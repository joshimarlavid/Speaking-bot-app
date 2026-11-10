# Agent notes

## Running the app

`docker-compose.base44.yml` runs the whole app as one Node 22 service from the bind-mounted
source. There is no separate frontend build in dev: `npm run dev` (`tsx server.ts`) starts an
Express server that mounts the Vite dev server as middleware and listens on port 3000.

- Entry point: `server.ts` (Express API under `/api/*` + Vite middleware in dev,
  `dist/` static files when `NODE_ENV=production`).
- Dependencies install into the `app_node_modules` volume: the container runs
  `npm ci` before `npm run dev`, so a fresh volume needs ~20-30s. Compose healthcheck
  has a 120s start period for that.
- The host has no Node runtime; run every command inside the service:
  `docker compose -f docker-compose.base44.yml exec -T app <cmd>`.

## Checks

- Typecheck/lint: `npm run lint` (`tsc --noEmit`). Note this also typechecks `*.test.ts(x)`.
- Tests: `npx vitest run` (jsdom, 14 files).
- Production build: `npm run build` (vite build + esbuild bundle of `server.ts`).

## Gotchas

- Use `npm ci`, not `npm install`: the npm shipped in `node:22` (10.9.9) rewrites
  `package-lock.json` (drops the `libc` fields of optional deps), which shows up as a
  spurious lockfile diff.
- Vite runs in middleware mode without a shared HTTP server, so its HMR websocket is not
  reachable through the preview proxy. Source edits do reload the page fresh on the next
  preview call; for a visible reload, call `reload_preview`.
- `GEMINI_API_KEY` and `ELEVEN_API_KEY` are runtime-only, not boot requirements. Without
  GEMINI the AI endpoints answer 503 and the UI falls back to offline dictionaries; without
  ElevenLabs the chat endpoint returns `x-elevenlabs-missing` and the hook speaks with
  `window.speechSynthesis` instead.
- `public/logo.png` is referenced by the header/hero but does not exist in the repo; the
  components hide the broken image via `onError` and show a "LOGO" placeholder (harmless
  404 in the console).
- The `@` Vite/TS alias points at the repo root, not `src/`.
