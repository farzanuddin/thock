# Thock — agent guide

## Stack

Vite + React 19 + Tailwind CSS 3. Single-page app, no router, no TypeScript, no tests.

## Commands

| Command | What |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint on `.` (config: `eslint.config.js`) |

No typecheck, no test runner, no codegen.

## Notable

- Entry: `src/main.jsx` → `src/App.jsx`. All core logic is in `App.jsx` (1000 lines).
- `vite.config.js` sets `base: "/thock/"` — the app assumes it's served from `/thock/` (matches GitHub Pages deploy path).
- Keyboard sound samples are hardcoded millisecond offsets in `src/keyboard/sound.js`. The raw audio file lives at `public/sounds/sound.ogg`.
- Audio preloader (`src/lib/audioPreloader.js`) fires immediately on module import via `import.meta.env.BASE_URL` — no lazy init.
- Words come from `random-words` package, generated in `src/lib/words.js` (400 words per session).
- Tailwind theme with custom dark palette defined in `tailwind.config.js` — do not use standard Tailwind color names.
- Button component (`src/components/Button.jsx`) uses `class-variance-authority` with `default`, `ghost`, `subtle` variants.
- Utility `cn()` in `src/lib/utils.js` wraps `clsx` + `tailwind-merge`.

## GitHub Pages deploy

Pushes to `main` trigger `.github/workflows/pages.yml`: `npm ci && npm run build`, deploy `dist/` to Pages.

## Dev workflow

No prescribed order. `npm run lint` before committing is the only check available.

## Restart shortcut

`Tab` then `Enter` restarts the test (tab-armed pattern in `App.jsx`).
