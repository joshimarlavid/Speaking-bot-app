# Base44 Dev Environment

## What this app is
A Vite + React + Express English-learning app ("Lingua Role") with AI-powered roleplay, flashcards, grammar exercises, and feedback. Single Node.js process: `tsx server.ts` runs an Express API server with Vite in middleware mode on port 3000.

## How to run
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Base image: `node:22-slim` with source bind-mounted at `/app`
- `npm install` runs at container start, then `npx tsx server.ts`
- Port 3000 is the web entry point (both API and frontend)
- HMR is disabled (`DISABLE_HMR=true`) to prevent flickering during edits

## Environment / Secrets
- `GEMINI_API_KEY` — Google Gemini API key. The app has comprehensive offline fallbacks (offline dictionary, simulated roleplay, static feedback) when the key is missing or invalid. Set a real key via the platform secrets to enable AI features.
- `ELEVEN_API_KEY` — Optional. ElevenLabs neural voice streaming. Without it, the app returns text-only responses.
- `APP_URL` — The hosted URL (optional, used for self-referential links).

Placeholder values live in `.env.base44-defaults` (loaded first). Real secrets from `/run/base44/app.env` override them.

## Key architecture notes
- `server.ts` — Express server with API routes (`/api/generate-exercise`, `/api/generate-background`, `/api/chat-roleplay`, `/api/feedback`, `/api/flashcard`) + Vite middleware
- `src/data.ts` — Topic/grammar data imported by both server and client
- `src/useLiveAPI.ts` — Client-side Gemini Live API (WebSocket) for voice; proxied through `/api/gemini/ws/`
- `better-sqlite3` and `puppeteer` are in `package.json` but NOT used in the codebase; `PUPPETEER_SKIP_DOWNLOAD=true` skips Chromium download
- Client-side state uses `localStorage` (see `src/utils/storage.ts`)

## Fix applied during setup
- Removed duplicate `import { GRAMMAR_TOPICS } from "./src/data.js"` in `server.ts` (was already imported on line 6)

## How to verify it works
```bash
curl -s http://localhost:3000/  # Should return HTML with Vite client
curl -s http://localhost:3000/src/main.tsx  # Should return transformed JS
```
```

