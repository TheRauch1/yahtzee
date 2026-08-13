# Yahtzee

A local-first Yahtzee **scorekeeper**, built with SvelteKit, Svelte 5 and Tailwind CSS 4.
You roll real dice; this keeps the scorecard. Works offline and installs to your home screen.

There is no dice rolling and no computer opponent — it is the paper score sheet, digitised.

## Features

- Full score sheet: Ones → Sixes, Pair, Two Pairs, 3/4 of a Kind, Full House, Small/Large Straight, Yahtzee, Chance
- Multiple players side by side, added and removed as you go
- A dice-picker modal per category, so you tap what you rolled instead of doing mental arithmetic
- Automatic upper total, bonus, lower total and grand total
- Games persist to `localStorage` — closing the tab does not lose the sheet
- Light and dark themes, dark by default
- English and German, switchable in the header and remembered across reloads
- Installable PWA that works with no network at all

## House rules

This scoreboard deliberately does **not** follow standard Yahtzee or standard Yatzy. It follows
the way we play. These are intentional, and they are pinned by tests in `src/lib/scoring.test.ts`
so they cannot drift:

| Rule             | Here            | Standard Yahtzee  |
| ---------------- | --------------- | ----------------- |
| Three of a kind  | `value × 3 + 3` | Sum of all 5 dice |
| Four of a kind   | `value × 4 + 1` | Sum of all 5 dice |
| Pair / Two Pairs | Included        | Not a category    |

The upper bonus follows the standard rules: 35 points at 63+.

For three and four of a kind, the non-matching dice count as a flat amount (3 and 1
respectively) rather than being entered individually — that keeps scoring to a single tap.

## Quick start

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

## Scripts

| Script              | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                               |
| `npm run build`     | Production build                                         |
| `npm run preview`   | Serve the production build locally                       |
| `npm test`          | Run all tests once                                       |
| `npm run test:unit` | Tests in watch mode                                      |
| `npm run test:pwa`  | Build check: manifest, service worker and offline reload |
| `npm run check`     | `svelte-check` type checking                             |
| `npm run lint`      | Prettier + ESLint                                        |
| `npm run format`    | Rewrite files with Prettier                              |

## Project structure

```
src/
  app.css                    theme variables + Tailwind setup
  app.html                   document shell, PWA tags, no-flash theme + lang script
  service-worker.ts          precaches the app for offline use
  lib/
    scoring.ts               all scoring maths (pure, unit-tested)
    gameStore.svelte.ts      players, scores and localStorage persistence
    theme.svelte.ts          light/dark preference
    translations.ts          English and German strings
    locale.svelte.ts         language preference
    Scoreboard.svelte        the score table
    ScoreModal.svelte        per-category dice picker
    DiceFace.svelte          a single die
    AddPlayerForm.svelte     player name input
    LanguageSwitcher.svelte  English/German dropdown
  routes/
    +layout.ts               prerender = true
    +layout.svelte           global styles
    +page.svelte             renders the scoreboard
static/
  manifest.webmanifest       PWA manifest
  icons/                     app icons (SVG sources + generated PNGs)
```

## Testing

Two Vitest projects run from one config:

- **server** — pure logic in Node (`src/**/*.test.ts`)
- **client** — components in real Chromium via `vitest-browser-svelte` (`src/**/*.svelte.test.ts`)

```bash
npm test                  # both projects
npx vitest --project client
```

Browser tests need Chromium once: `npx playwright install chromium`.

If a machine already has a Chromium but cannot download the exact build Playwright asks for
(offline, or a locked-down egress policy), point the tests at the existing binary instead:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome npm test
```

`npm run test:pwa` is separate because it runs against a real build: it serves `.svelte-kit/cloudflare`,
registers the service worker, drops the network, reloads, and asserts the app still works.
Run `npm run build` first.

## PWA

The app is fully prerendered, so the service worker can precache every asset and serve the
whole thing offline. SvelteKit registers `src/service-worker.ts` automatically in production
builds — there is no registration code to maintain.

To try it locally:

```bash
npm run build && npm run preview
```

Then in DevTools → Application, check **Manifest** and **Service Workers**, tick
**Network → Offline**, and reload. The scoreboard should keep working.

Icons live in `static/icons/`. The `.svg` files are the sources; the `.png` files are generated
from them and committed, so no image tooling is needed to build the app.

## Deployment

Built with `@sveltejs/adapter-cloudflare`. Because every route is prerendered, the output in
`.svelte-kit/cloudflare` is a set of static assets served from Cloudflare's edge; the worker is
never invoked for page requests.

## Contributing notes

- `src/lib/scoring.ts` is the only place scoring maths should live. Keep it pure and add a test.
- If you change the house rules, update `scoring.test.ts` and the table above in the same commit.
- Run `npm run lint && npm run check && npm test` before pushing; CI runs the same, plus the PWA check.

## License

None specified. Add a `LICENSE` file if you want to set reuse terms.
