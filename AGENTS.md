# AGENTS.md — LINGUAROLE

Non-obvious facts for future sessions. See `README.md` for the tour.

## Where the UI actually lives

- `src/main.tsx` → `src/App.tsx`. `App.tsx` is the live screen.
- `src/AppContent.tsx`, `src/contexts/AppContext.tsx`, `src/hooks/useSession.ts` and most of
  `src/components/*` belong to an unfinished refactor and are **not mounted**. Their tests still run.
  Do not assume an edit there reaches the browser.
- `GildedFrame` (from `src/components/BotanicalOrnaments.tsx`) replaced the old
  `GothicSkullFlowerFrame`. Panel ornaments are drawn in that file.

## Styling

- The palette lives in `src/index.css` under `@theme`, remapping Tailwind's `blue`, `cyan`, `amber`,
  `zinc`, `red`, `emerald`, `fuchsia`… scales to velvet, gold, moss and nightshade tones. Re-theme
  by changing tokens, not hundreds of utility classes.
- `src/themes.ts` and the `THEMES` object inside `src/App.tsx` must stay in sync in shape
  (`src/themes.test.ts` checks every mode has all `AppTheme` keys and hex glows).
- The page background is `BotanicalBackdrop` (pure CSS/SVG). There is no photographic background.

## Runtime

- `npm run dev` = `tsx server.ts`; Express serves the API and Vite middleware on port 3000.
- Conversation needs `GEMINI_API_KEY` (live audio + `/api/chat-roleplay`). `ELEVEN_API_KEY` is
  optional and only used by the ElevenLabs voice path. Neither is required to boot.
- `src/useGeneratedBackground.ts` is a stub returning `/deep-sea-bg.jpg`; it is no longer used by
  `App.tsx`.
- Vite is reached through the preview proxy, so compose passes
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` through from the platform.

## Verification notes

- `npm run lint` currently dies on `src/hooks/useSession.test.ts` (pre-existing broken merge in that
  file), not on app code. To type-check sources, use a tsconfig that excludes `**/*.test.ts(x)`.
- Unit tests covering non-UI logic: `npx vitest run src/themes.test.ts src/data.test.ts src/utils`.
- End-to-end: load `/`, pick a role card, pick a difficulty (it filters the card list), type a name,
  then the start button reads "Begin the Conversation" and is disabled until the name is signed.
