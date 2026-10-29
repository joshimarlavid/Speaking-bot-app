import { describe, it, expect } from 'vitest';
import express from 'express';
import http from 'node:http';

function createServerWithProxyMiddleware(geminiKey: string | undefined, maxRequests: number = 30) {
  const app = express();

  const proxyRateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const PROXY_RATE_LIMIT_WINDOW_MS = 60 * 1000;

  function isProxyRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = proxyRateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
      proxyRateLimitMap.set(ip, { count: 1, resetTime: now + PROXY_RATE_LIMIT_WINDOW_MS });
      return false;
    }
    if (record.count >= maxRequests) {
      return true;
    }
    record.count += 1;
    return false;
  }

  app.use('/api/gemini', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!geminiKey || geminiKey.trim().length === 0) {
      res.status(503).json({ error: "Gemini API key is not configured on the server." });
      return;
    }

    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (isProxyRateLimited(clientIp)) {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }

    const upgradeHeader = req.headers.upgrade;
    const isWebSocketRequest = req.method === "GET" && typeof upgradeHeader === "string" && upgradeHeader.toLowerCase() === "websocket";

    if (!isWebSocketRequest) {
      res.status(403).json({ error: "Access denied. Proxy only allows WebSocket live connection requests." });
      return;
    }

    let decodedUrl = "";
    try {
      decodedUrl = decodeURIComponent(req.url || "");
    } catch {
      res.status(400).json({ error: "Invalid URL encoding." });
      return;
    }

    if (decodedUrl.includes("..") || decodedUrl.includes("\\")) {
      res.status(403).json({ error: "Access denied. Invalid request path." });
      return;
    }

    if (!decodedUrl.startsWith("/ws/google.ai.generativelanguage.")) {
      res.status(403).json({ error: "Access denied. Proxy endpoint restricted." });
      return;
    }

    res.status(200).json({ success: true, path: decodedUrl });
  });

  return app;
}

function makeHttpRequest(
  serverPort: number,
  method: string,
  path: string,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: serverPort,
        method,
        path,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let body = data;
          try {
            body = JSON.parse(data);
          } catch {}
          resolve({ status: res.statusCode || 0, body });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTestServer(app: express.Express, testFn: (port: number) => Promise<void>) {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  try {
    await testFn(address.port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

describe('Proxy Security Middleware (/api/gemini)', () => {
  it('should return 503 if GEMINI_API_KEY is not configured', async () => {
    const app = createServerWithProxyMiddleware(undefined);
    await runTestServer(app, async (port) => {
      const res = await makeHttpRequest(port, 'GET', '/api/gemini/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent', { Upgrade: 'websocket' });
      expect(res.status).toBe(503);
      expect(res.body.error).toContain('not configured');
    });
  });

  it('should reject non-WebSocket requests with 403 Forbidden', async () => {
    const app = createServerWithProxyMiddleware('test-api-key');
    await runTestServer(app, async (port) => {
      const res = await makeHttpRequest(port, 'GET', '/api/gemini/v1beta/models');
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });
  });

  it('should reject POST requests with 403 Forbidden even with upgrade header', async () => {
    const app = createServerWithProxyMiddleware('test-api-key');
    await runTestServer(app, async (port) => {
      const res = await makeHttpRequest(port, 'POST', '/api/gemini/v1beta/models', { Upgrade: 'websocket' });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });
  });

  it('should reject path traversal attempts containing .. or backslashes with 403 Forbidden', async () => {
    const app = createServerWithProxyMiddleware('test-api-key');
    await runTestServer(app, async (port) => {
      const res1 = await makeHttpRequest(port, 'GET', '/api/gemini/ws/google.ai.generativelanguage.v1alpha/../v1/models', { Upgrade: 'websocket' });
      expect(res1.status).toBe(403);

      const res2 = await makeHttpRequest(port, 'GET', '/api/gemini/ws/google.ai.generativelanguage.%5Cv1%5Cmodels', { Upgrade: 'websocket' });
      expect(res2.status).toBe(403);
    });
  });

  it('should reject requests targeting unauthorized endpoints with 403 Forbidden', async () => {
    const app = createServerWithProxyMiddleware('test-api-key');
    await runTestServer(app, async (port) => {
      const res = await makeHttpRequest(port, 'GET', '/api/gemini/v1beta/models/gemini-pro:generateContent', { Upgrade: 'websocket' });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Proxy endpoint restricted');
    });
  });

  it('should allow valid WebSocket requests targeting /ws/google.ai.generativelanguage.', async () => {
    const app = createServerWithProxyMiddleware('test-api-key');
    await runTestServer(app, async (port) => {
      const validPath = '/api/gemini/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
      const res = await makeHttpRequest(port, 'GET', validPath, { Upgrade: 'websocket' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  it('should trigger rate limiting (429) when request threshold is exceeded', async () => {
    const app = createServerWithProxyMiddleware('test-api-key', 3);
    await runTestServer(app, async (port) => {
      const validPath = '/api/gemini/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
      const headers = { Upgrade: 'websocket' };

      await makeHttpRequest(port, 'GET', validPath, headers); // 1
      await makeHttpRequest(port, 'GET', validPath, headers); // 2
      await makeHttpRequest(port, 'GET', validPath, headers); // 3

      const rateLimitedRes = await makeHttpRequest(port, 'GET', validPath, headers); // 4
      expect(rateLimitedRes.status).toBe(429);
      expect(rateLimitedRes.body.error).toContain('Too many requests');
    });
  });
});
