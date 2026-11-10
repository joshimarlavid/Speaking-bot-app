# LINGUAROLE — Botanical Grammar Conservatory

An AI conversation partner for everyday English practice: choose a role play, set the difficulty,
sign your name, and your partner opens the conversation by name.

By **Dark Art Studio**.

## How the app is put together

- `src/main.tsx` renders `src/App.tsx`. **`App.tsx` is the shipping screen** (a large legacy
  monolith that holds the setup ritual, live session, exercises, ledger and spellbook).
- `src/AppContent.tsx` plus `src/components/*` are a partially finished refactor of that screen and
  are **not wired to the router or entry point**. Editing them changes nothing the user sees unless
  you also move the entry point over.
- `server.ts` is the Express server: Gemini proxy (`/api/gemini`), role-play voice endpoint
  (`/api/chat-roleplay`), exercise/flashcard/feedback endpoints, and the Vite dev middleware.
- `src/index.css` holds the whole visual system. The `@theme` block re-tints Tailwind's colour
  scales to the velvet/gold palette, so most components need no class changes — adjust tokens there.
- `src/components/BotanicalOrnaments.tsx` draws the gilded frames, vines, moonflower plate and
  drifting spores (`BotanicalBackdrop`, `GildedFrame`, `LeafSprig`, `BotanicalEmblem`).

## Running it in the sandbox

```bash
docker compose -f docker-compose.base44.yml up -d --build
docker compose -f docker-compose.base44.yml logs -f app
```

The dev server listens on host port `3000` and serves the cloned source through Vite (live reload
works as you edit). Dependencies install from `package-lock.json` into a named volume on boot.

### Environment

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Required for the live conversation partner and AI feedback. |
| `ELEVEN_API_KEY` | Optional; enables the high-fidelity neural character voices. |
| `BASE44_PREVIEW_MODE` | Set by the platform in the sandbox; passed through untouched. |
| `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` | Vite host allowlist for the preview host. |

`.env.base44-defaults` supplies empty placeholders so the stack boots before credentials exist; the
platform-managed `/run/base44/app.env` is loaded **after** it and wins. Without a real
`GEMINI_API_KEY` the UI runs but "Begin the Conversation" cannot reach the partner.

## Checking it

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
docker compose -f docker-compose.base44.yml exec -T app npx vitest run src/themes.test.ts src/data.test.ts src/utils
```

Known pre-existing issue: `npm run lint` fails to parse `src/hooks/useSession.test.ts` (malformed
merge on this branch), so it also hides type errors. Type-check application sources only with a
filtered config, e.g. one that extends `tsconfig.json` and excludes `**/*.test.ts(x)`.
