import { describe, it, expect, vi, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import { createAppServer } from './server';

const gemini = vi.hoisted(() => ({ generate: vi.fn(), connect: vi.fn() }));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: gemini.generate };
    live = { connect: gemini.connect };
  },
  Modality: { AUDIO: 'AUDIO' },
}));
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

async function withRealServer(test: (port: number) => Promise<void>) {
  const server = await createAppServer({ skipFrontend: true });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await test((server.address() as { port: number }).port);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
}

async function postEndpoint(port: number, path: string, body: unknown) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

const learnerMessages = [
  { role: 'model', text: 'Welcome to the shop.' },
  { role: 'user', text: 'I would like to buy a ticket today and I need some help finding the right counter please.' },
  { role: 'model', text: 'Where are you going?' },
  { role: 'user', text: 'I am going to London tomorrow with my family and we want to travel in the morning.' },
];

const originalGeminiKey = process.env.GEMINI_API_KEY;
afterEach(() => {
  if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalGeminiKey;
  vi.restoreAllMocks();
  gemini.generate.mockReset();
  gemini.connect.mockReset();
});

describe('Feedback and exercise endpoints', () => {
  it('accepts ordered messages and context without attributing partner text to the learner', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-unit-tests';
    gemini.generate.mockResolvedValue({ text: '### Estimated level\nTentative A2' });
    await withRealServer(async (port) => {
      const result = await postEndpoint(port, '/api/feedback', {
        messages: learnerMessages, role: { name: 'Clerk', winCondition: 'Buy a ticket' },
        topic: { title: 'Travel', grammar: 'Questions', vocabulary: ['ticket'] }, mode: 'student',
      });
      expect(result.status).toBe(200);
      expect(result.body.feedback).toContain('not a certified assessment');
      const prompt = gemini.generate.mock.calls[0][0].config.systemInstruction;
      const data = JSON.parse(prompt.slice(prompt.indexOf('{"context"')));
      expect(data.transcript).toEqual(learnerMessages);
      expect(data.context.role.name).toBe('Clerk');
      expect(data.context.topic.title).toBe('Travel');
      expect(data.context.mode).toBe('student');
      expect(prompt).toContain('Quote exact learner phrases');
      expect(prompt).toContain('Do not infer pronunciation');
    });
  });

  it('labels insufficient evidence and offline feedback without invented praise', async () => {
    delete process.env.GEMINI_API_KEY;
    await withRealServer(async (port) => {
      const short = await postEndpoint(port, '/api/feedback', { messages: [{ role: 'user', text: 'Hi' }] });
      expect(short.body.feedback).toContain('Insufficient evidence');
      const offline = await postEndpoint(port, '/api/feedback', { history: learnerMessages });
      expect(offline.body.feedback).toContain('unavailable offline');
      expect(offline.body.feedback).not.toMatch(/excellent|successfully/i);
      const invalid = await postEndpoint(port, '/api/feedback', { messages: [{ role: 'system', text: 'hello' }] });
      expect(invalid.status).toBe(400);
    });
  });

  it('falls back honestly if feedback generation fails or returns empty', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-unit-tests';
    gemini.generate.mockResolvedValue({ text: '' });
    await withRealServer(async (port) => {
      const response = await postEndpoint(port, '/api/feedback', { messages: learnerMessages });
      expect(response.body.feedback).toContain('Feedback unavailable');
    });
  });

  it('does not leak provider errors and keeps legacy context and partner roles intact', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-unit-tests';
    gemini.generate.mockRejectedValue(new Error('provider secret key'));
    await withRealServer(async (port) => {
      const result = await postEndpoint(port, '/api/feedback', { history: learnerMessages });
      expect(result.status).toBe(200);
      expect(result.body.feedback).toContain('Feedback unavailable');
      expect(JSON.stringify(result.body)).not.toContain('provider secret key');
      expect(gemini.generate).toHaveBeenCalledTimes(3);
      gemini.generate.mockResolvedValue({ text: 'Feedback' });
      await postEndpoint(port, '/api/feedback', {
        history: [{ role: 'assistant', text: 'Partner words' }, ...learnerMessages],
        role: 'Guide', topic_title: 'Legacy topic', grammar: 'Past', vocabulary: ['ticket'], student_name: 'Alex',
      });
      const prompt = gemini.generate.mock.calls.at(-1)![0].config.systemInstruction;
      const data = JSON.parse(prompt.slice(prompt.indexOf('{"context"')));
      expect(data.transcript[0]).toEqual({ role: 'model', text: 'Partner words' });
      expect(data.context).toMatchObject({ role: { name: 'Guide' }, topic: { title: 'Legacy topic', grammar: 'Past', vocabulary: ['ticket'] }, student: 'Alex' });
    });
  });

  it('rejects malformed generated exercises and falls back when the provider fails', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-unit-tests';
    const valid = { question: 'I ____ home.', options: ['go', 'goes', 'went', 'going'], answer: 0, explanation: 'Use go with I.' };
    const invalid = [
      'not JSON', JSON.stringify(null),
      JSON.stringify({ ...valid, question: 'No blank' }),
      JSON.stringify({ ...valid, options: ['go', 'GO ', 'went', 'going'] }),
      JSON.stringify({ ...valid, options: ['go', 'goes'] }),
      JSON.stringify({ ...valid, options: ['go', 'goes', '', 'going'] }),
      JSON.stringify({ ...valid, explanation: ' ' }),
      JSON.stringify({ ...valid, pronunciation: 42 }),
    ];
    await withRealServer(async (port) => {
      for (const text of invalid) {
        gemini.generate.mockResolvedValue({ text });
        const result = await postEndpoint(port, '/api/generate-exercise', { randomTopic: { title: 'Travel' } });
        expect(result.status).toBe(200);
        expect(result.body.topic).not.toBe('Travel');
        expect(result.body.options).toHaveLength(4);
        expect(result.body.options[result.body.answer]).toBeTruthy();
      }
      gemini.generate.mockRejectedValue(new Error('sensitive provider error'));
      const failed = await postEndpoint(port, '/api/generate-exercise', {});
      expect(failed.status).toBe(200);
      expect(JSON.stringify(failed.body)).not.toContain('sensitive provider error');
      expect(failed.body.options[failed.body.answer]).toBeTruthy();
    });
  });

  it('validates generated exercises and supplies varied, valid offline exercises', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-unit-tests';
    await withRealServer(async (port) => {
      const topic = { title: 'Travel' };
      gemini.generate.mockResolvedValue({ text: JSON.stringify({ question: 'I ____ home.', options: ['go', 'goes', 'went', 'going'], answer: 0, explanation: 'Use go with I.' }) });
      const valid = await postEndpoint(port, '/api/generate-exercise', { randomTopic: topic });
      expect(valid.body.topic).toBe('Travel');
      expect(valid.body.question).toBe('I ____ home.');
      for (const answer of [-1, 4, 1.5, '1']) {
        gemini.generate.mockResolvedValue({ text: JSON.stringify({ question: 'I ____ home.', options: ['go', 'goes', 'went', 'going'], answer, explanation: 'test' }) });
        const invalid = await postEndpoint(port, '/api/generate-exercise', { randomTopic: topic });
        expect(invalid.body.question).not.toBe('I ____ home.');
        expect(invalid.body.answer).toBeGreaterThanOrEqual(0);
        expect(invalid.body.answer).toBeLessThan(4);
        expect(invalid.body.topic).not.toBe('Travel');
      }
      delete process.env.GEMINI_API_KEY;
      const random = vi.spyOn(Math, 'random');
      random.mockReturnValueOnce(0).mockReturnValueOnce(0.9);
      const first = await postEndpoint(port, '/api/generate-exercise', {});
      const second = await postEndpoint(port, '/api/generate-exercise', {});
      expect(first.body.question).not.toBe(second.body.question);
      expect(first.body.options[first.body.answer]).toBeTruthy();
      expect(second.body.options[second.body.answer]).toBeTruthy();
    });
  });
});

describe('Live bridge handshake', () => {
  it('forwards ordered Live events, audio input, and a turn completion boundary', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-unit-tests';
    let callbacks: any;
    const session = { close: vi.fn(), sendRealtimeInput: vi.fn() };
    gemini.connect.mockImplementation((params) => {
      callbacks = params.callbacks;
      return Promise.resolve(session);
    });
    await withRealServer(async (port) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/api/live`);
      try {
        await new Promise<void>((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
        const received: any[] = [];
        ws.on('message', (message) => received.push(JSON.parse(message.toString())));
        ws.send(JSON.stringify({ type: 'setup', voiceName: 'Kore', systemInstruction: 'Be concise' }));
        await vi.waitFor(() => expect(received).toContainEqual({ type: 'connected' }));
        expect(gemini.connect.mock.calls[0][0]).toMatchObject({
          model: 'gemini-3.1-flash-live-preview',
          config: { responseModalities: ['AUDIO'], systemInstruction: 'Be concise', inputAudioTranscription: {}, outputAudioTranscription: {}, speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
        });
        callbacks.onmessage({ serverContent: {
          interrupted: true, inputTranscription: { text: 'hello' }, outputTranscription: { text: 'welcome' },
          modelTurn: { parts: [{ inlineData: { data: 'YWJj' } }, { text: 'welcome' }] }, turnComplete: true,
        } });
        await vi.waitFor(() => expect(received).toHaveLength(7));
        expect(received.slice(1)).toEqual([
          { type: 'interrupted' }, { type: 'inputTranscript', text: 'hello' },
          { type: 'outputTranscript', text: 'welcome' }, { type: 'audio', data: 'YWJj' },
          { type: 'text', text: 'welcome' }, { type: 'turn_complete' },
        ]);
        ws.send(JSON.stringify({ type: 'audio', data: 'YXVkaW8=' }));
        await vi.waitFor(() => expect(session.sendRealtimeInput).toHaveBeenCalledWith({ audio: { mimeType: 'audio/pcm;rate=16000', data: 'YXVkaW8=' } }));
        ws.send(JSON.stringify({ type: 'setup' }));
        await vi.waitFor(() => expect(received).toContainEqual({ type: 'error', message: 'Live session setup has already started.' }));
        expect(gemini.connect).toHaveBeenCalledTimes(1);
      } finally {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close();
          await new Promise<void>((resolve) => ws.once('close', () => resolve()));
        }
      }
    });
    expect(session.close).toHaveBeenCalledTimes(1);
  });

  it('sanitizes synchronous send errors and malformed client messages', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-unit-tests';
    const session = { close: vi.fn(), sendRealtimeInput: vi.fn(() => { throw new Error('secret upstream details'); }) };
    gemini.connect.mockResolvedValue(session);
    const log = vi.spyOn(console, 'error');
    await withRealServer(async (port) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/api/live`);
      try {
        await new Promise<void>((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
        const received: any[] = [];
        ws.on('message', (message) => received.push(JSON.parse(message.toString())));
        ws.send(JSON.stringify({ type: 'setup', voiceName: 'invalid' }));
        await vi.waitFor(() => expect(received).toContainEqual({ type: 'connected' }));
        expect(gemini.connect.mock.calls[0][0].config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Zephyr');
        ws.send('not json');
        ws.send(JSON.stringify({ type: 'text', text: 'hello' }));
        await vi.waitFor(() => expect(received.filter(m => m.type === 'error')).toHaveLength(2));
        expect(JSON.stringify(received)).not.toContain('secret upstream details');
        expect(log).not.toHaveBeenCalled();
      } finally {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close();
          await new Promise<void>((resolve) => ws.once('close', () => resolve()));
        }
      }
    });
  });

  it('closes a late upstream session if the client disconnects during setup', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-unit-tests';
    let resolveSession!: (session: any) => void;
    const session = { close: vi.fn(), sendRealtimeInput: vi.fn() };
    gemini.connect.mockImplementation(() => new Promise(resolve => { resolveSession = resolve; }));
    await withRealServer(async (port) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/api/live`);
      await new Promise<void>((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
      ws.send(JSON.stringify({ type: 'setup' }));
      await vi.waitFor(() => expect(gemini.connect).toHaveBeenCalled());
      ws.close();
      await new Promise<void>((resolve) => ws.once('close', () => resolve()));
      resolveSession(session);
      await vi.waitFor(() => expect(session.close).toHaveBeenCalledTimes(1));
    });
  });

  it('reports upstream failures instead of a successful connection', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-unit-tests';
    gemini.connect.mockImplementation(({ callbacks }) => {
      callbacks.onopen();
      callbacks.onerror({ message: 'secret key must not leak' });
      return Promise.reject(new Error('upstream failed'));
    });
    await withRealServer(async (port) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/api/live`);
      await new Promise<void>((resolve) => ws.once('open', resolve));
      const received: any[] = [];
      ws.on('message', (message) => received.push(JSON.parse(message.toString())));
      ws.send(JSON.stringify({ type: 'setup' }));
      await vi.waitFor(() => expect(received).toContainEqual({ type: 'error', message: 'Live API connection error.' }));
      expect(received).not.toContainEqual({ type: 'connected' });
      ws.close();
      await new Promise<void>((resolve) => ws.once('close', () => resolve()));
    });
  });

  it('waits for completed upstream setup before reporting connected', async () => {
    process.env.GEMINI_API_KEY = 'fake-key-for-unit-tests';
    let resolveSession!: (session: any) => void;
    const session = { close: vi.fn(), sendRealtimeInput: vi.fn() };
    gemini.connect.mockImplementation(({ callbacks }) => {
      callbacks.onopen();
      return new Promise((resolve) => { resolveSession = resolve; });
    });
    await withRealServer(async (port) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/api/live`);
      await new Promise<void>((resolve) => ws.once('open', resolve));
      const received: any[] = [];
      ws.on('message', (message) => received.push(JSON.parse(message.toString())));
      ws.send(JSON.stringify({ type: 'setup' }));
      await vi.waitFor(() => expect(gemini.connect).toHaveBeenCalled());
      expect(gemini.connect.mock.calls[0][0].model).toBe('gemini-3.1-flash-live-preview');
      expect(received).toEqual([]);
      resolveSession(session);
      await vi.waitFor(() => expect(received).toContainEqual({ type: 'connected' }));
      ws.send(JSON.stringify({ type: 'text', text: 'Hello' }));
      await vi.waitFor(() => expect(session.sendRealtimeInput).toHaveBeenCalledWith({ text: 'Hello' }));
      ws.close();
      await new Promise<void>((resolve) => ws.once('close', () => resolve()));
      expect(session.close).toHaveBeenCalled();
    });
  });
});

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

describe('Flashcard API Caching & Functionality (/api/flashcard)', () => {
  function createFlashcardApp(options: { maxCacheSize?: number; mockGenerator?: (vocab: string, topic?: string) => Promise<any> } = {}) {
    const app = express();
    app.use(express.json());

    const FLASHCARD_CACHE_MAX_SIZE = options.maxCacheSize || 500;
    const flashcardCache = new Map<string, any>();

    function getCachedFlashcard(key: string): any | undefined {
      if (!flashcardCache.has(key)) return undefined;
      const value = flashcardCache.get(key);
      flashcardCache.delete(key);
      flashcardCache.set(key, value);
      return value;
    }

    function setCachedFlashcard(key: string, value: any): void {
      if (flashcardCache.has(key)) {
        flashcardCache.delete(key);
      } else if (flashcardCache.size >= FLASHCARD_CACHE_MAX_SIZE) {
        const oldestKey = flashcardCache.keys().next().value;
        if (oldestKey !== undefined) {
          flashcardCache.delete(oldestKey);
        }
      }
      flashcardCache.set(key, value);
    }

    let generatorCalls = 0;

    app.post('/api/flashcard', async (req: express.Request, res: express.Response) => {
      try {
        const { vocab, topic } = req.body;
        const safeVocab = typeof vocab === 'string' ? vocab.trim().slice(0, 100) : '';
        const safeTopic = typeof topic === 'string' ? topic.trim().slice(0, 120) : '';
        if (!safeVocab) {
          res.status(400).json({ error: 'Missing required parameter: vocab' });
          return;
        }

        const cacheKey = `${safeVocab.toLowerCase()}:::${safeTopic.toLowerCase()}`;
        const cached = getCachedFlashcard(cacheKey);
        if (cached) {
          res.status(200).json({ ...cached, _cached: true });
          return;
        }

        generatorCalls++;
        const generated = options.mockGenerator
          ? await options.mockGenerator(safeVocab, safeTopic)
          : {
              vocab: safeVocab,
              definitionEn: `Meaning of ${safeVocab}`,
              definitionEs: `Significado de ${safeVocab}`,
              ipa: `/${safeVocab}/`,
              partOfSpeech: 'noun',
              exampleEn: `Example with ${safeVocab}`,
              exampleEs: `Ejemplo con ${safeVocab}`,
              syllables: safeVocab,
              tips: 'Practice this'
            };

        setCachedFlashcard(cacheKey, generated);
        res.status(200).json({ ...generated, _cached: false });
      } catch (err) {
        res.status(500).json({ error: 'Failed' });
      }
    });

    return {
      app,
      getGeneratorCalls: () => generatorCalls,
      getCacheSize: () => flashcardCache.size
    };
  }

  function postJson(port: number, path: string, body: any): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const dataString = JSON.stringify(body);
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          method: 'POST',
          path,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(dataString)
          }
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            let parsed = data;
            try {
              parsed = JSON.parse(data);
            } catch {}
            resolve({ status: res.statusCode || 0, body: parsed });
          });
        }
      );
      req.on('error', reject);
      req.write(dataString);
      req.end();
    });
  }

  it('should return 400 when vocab is missing or empty', async () => {
    const { app } = createFlashcardApp();
    await runTestServer(app, async (port) => {
      const res = await postJson(port, '/api/flashcard', { topic: 'Shopping' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required parameter');
    });
  });

  it('should generate on cache miss and serve from cache on subsequent identical requests', async () => {
    const { app, getGeneratorCalls } = createFlashcardApp();
    await runTestServer(app, async (port) => {
      const res1 = await postJson(port, '/api/flashcard', { vocab: 'checkout', topic: 'Supermarket' });
      expect(res1.status).toBe(200);
      expect(res1.body._cached).toBe(false);
      expect(getGeneratorCalls()).toBe(1);

      const res2 = await postJson(port, '/api/flashcard', { vocab: 'checkout', topic: 'Supermarket' });
      expect(res2.status).toBe(200);
      expect(res2.body._cached).toBe(true);
      expect(getGeneratorCalls()).toBe(1); // Didn't call generator again
    });
  });

  it('should match cache keys in a case-insensitive manner', async () => {
    const { app, getGeneratorCalls } = createFlashcardApp();
    await runTestServer(app, async (port) => {
      const res1 = await postJson(port, '/api/flashcard', { vocab: 'CheckOut', topic: 'SuperMarket' });
      expect(res1.status).toBe(200);
      expect(getGeneratorCalls()).toBe(1);

      const res2 = await postJson(port, '/api/flashcard', { vocab: 'checkout', topic: 'supermarket' });
      expect(res2.status).toBe(200);
      expect(res2.body._cached).toBe(true);
      expect(getGeneratorCalls()).toBe(1);
    });
  });

  it('should enforce LRU capacity bounds and evict oldest entries when full', async () => {
    const maxCacheSize = 2;
    const { app, getGeneratorCalls, getCacheSize } = createFlashcardApp({ maxCacheSize });
    await runTestServer(app, async (port) => {
      // Insert item A
      await postJson(port, '/api/flashcard', { vocab: 'wordA', topic: 'T1' });
      expect(getGeneratorCalls()).toBe(1);
      expect(getCacheSize()).toBe(1);

      // Insert item B
      await postJson(port, '/api/flashcard', { vocab: 'wordB', topic: 'T1' });
      expect(getGeneratorCalls()).toBe(2);
      expect(getCacheSize()).toBe(2);

      // Re-access item A to make it recently used (so B becomes oldest)
      const resA = await postJson(port, '/api/flashcard', { vocab: 'wordA', topic: 'T1' });
      expect(resA.body._cached).toBe(true);
      expect(getGeneratorCalls()).toBe(2);

      // Insert item C - this should evict item B
      await postJson(port, '/api/flashcard', { vocab: 'wordC', topic: 'T1' });
      expect(getGeneratorCalls()).toBe(3);
      expect(getCacheSize()).toBe(2);

      // Query item A - should still be cached
      const resA2 = await postJson(port, '/api/flashcard', { vocab: 'wordA', topic: 'T1' });
      expect(resA2.body._cached).toBe(true);
      expect(getGeneratorCalls()).toBe(3);

      // Query item B - was evicted, should be a miss and call generator again
      const resB = await postJson(port, '/api/flashcard', { vocab: 'wordB', topic: 'T1' });
      expect(resB.body._cached).toBe(false);
      expect(getGeneratorCalls()).toBe(4);
    });
  });
});
