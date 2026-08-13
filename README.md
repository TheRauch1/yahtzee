# Yahtzee

A local-first Yahtzee **scorekeeper**, built with Vite, React 19 and shadcn/ui (on Base UI)
with Tailwind CSS 4. You roll real dice; this keeps the scorecard. Works offline and installs
to your home screen.

There is no dice rolling and no computer opponent — it is the paper score sheet, digitised.

## Features

- Full score sheet: Ones → Sixes, Pair, Two Pairs, 3/4 of a Kind, Full House, Small/Large Straight, Yahtzee, Chance
- Multiple players side by side, added and removed as you go
- A dice-picker dialog per category, so you tap what you rolled instead of doing mental arithmetic
- Automatic upper total, bonus, lower total and grand total
- Games persist to `localStorage` — closing the tab does not lose the sheet
- Light and dark themes, dark by default
- English and German, switchable in the header and remembered across reloads
- Installable PWA that works with no network at all
- Confirmation prompts on the two destructive actions — Reset and removing a player

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
| `npm run build`     | Type-check, then production build                        |
| `npm run preview`   | Serve the production build locally                       |
| `npm test`          | Run all tests once                                       |
| `npm run test:unit` | Tests in watch mode                                      |
| `npm run test:pwa`  | Build check: manifest, service worker and offline reload |
| `npm run check`     | `tsc -b --noEmit` type checking                          |
| `npm run lint`      | Prettier + ESLint                                        |
| `npm run format`    | Rewrite files with Prettier                              |

## Project structure

```
index.html                       document shell, PWA tags, no-flash theme + lang script
src/
  main.tsx                       React root, service worker registration
  App.tsx                        renders <Scoreboard />
  index.css                      shadcn/Tailwind tokens + theme setup
  lib/
    scoring.ts                   all scoring maths (pure, unit-tested)
    types.ts                     ScoringCategory, Player and category groupings
    translations.ts              English and German strings
    game-store.ts                players, scores and localStorage persistence
    theme-store.ts               light/dark preference
    locale-store.ts              language preference
    utils.ts                     cn() class-name helper
  hooks/
    use-game.ts                  usePlayers, usePlayer
    use-theme.ts                 useTheme
    use-locale.ts                useLocale, useTranslation
  components/
    scoreboard.tsx                page: header, players card, score table
    score-table.tsx               the score sheet
    score-cell.tsx                a single score button
    score-dialog.tsx              the per-category picker (dialog shell)
    score-picker.tsx              the nine category panels
    dice-face.tsx                 a single die
    add-player-form.tsx           player name input
    player-chips.tsx              player list with remove (with confirmation)
    language-switcher.tsx         English/German select
    theme-toggle.tsx              light/dark icon button
    confirm-dialog.tsx            reusable "are you sure?" wrapper
    ui/                           shadcn-generated primitives (Base UI), do not hand-edit
public/
  manifest.webmanifest            PWA manifest
  icons/                          app icons (SVG sources + generated PNGs)
```

## Testing

Two Vitest projects run from one config:

- **unit** — pure logic in Node (`src/**/*.test.ts`)
- **browser** — components in real Chromium via `vitest-browser-react` (`src/**/*.browser.test.tsx`)

```bash
npm test                  # both projects
npx vitest --project browser
```

Browser tests need Chromium once: `npx playwright install chromium`.

If a machine already has a Chromium but cannot download the exact build Playwright asks for
(offline, or a locked-down egress policy), point the tests at the existing binary instead:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chrome npm test
```

`npm run test:pwa` is separate because it runs against a real build: it serves `dist/`,
registers the service worker, drops the network, reloads, and asserts the app still works.
Run `npm run build` first. It respects the same `PLAYWRIGHT_CHROMIUM_EXECUTABLE` override.

## PWA

`vite-plugin-pwa` (Workbox `generateSW` mode) precaches every build asset, so the service
worker can serve the whole app offline. Registration happens explicitly in `src/main.tsx` via
`registerSW()` — there is no separate registration step to maintain.

To try it locally:

```bash
npm run build && npm run preview
```

Then in DevTools → Application, check **Manifest** and **Service Workers**, tick
**Network → Offline**, and reload. The scoreboard should keep working.

Icons live in `public/icons/`. The `.svg` files are the sources; the `.png` files are generated
from them and committed, so no image tooling is needed to build the app.

## Deployment

The build output in `dist/` is a set of static assets — no server-side rendering, no API,
nothing to run at request time. Point any static host (Cloudflare Pages, Netlify, GitHub
Pages, S3 + CDN, ...) at `dist/` after `npm run build`.

## Contributing notes

- `src/lib/scoring.ts` is the only place scoring maths should live. Keep it pure and add a test.
- If you change the house rules, update `scoring.test.ts` and the table above in the same commit.
- Files under `src/components/ui/` are shadcn/Base UI primitives — treat them as generated code,
  not hand-tuned application logic.
- To add a primitive, run `npx shadcn@latest add <name>` (the CLI is deliberately **not** a
  dependency — it pulls ~170 packages to supply a stylesheet). If the new component styles itself
  off a Base UI data attribute, copy the matching `@custom-variant` into `src/index.css`; the four
  in use are listed there. A missing variant compiles to nothing silently, so check the component
  actually animates rather than trusting a green build.
- Run `npm run lint && npm run check && npm test` before pushing; CI runs the same, plus the PWA check.

## License

None specified. Add a `LICENSE` file if you want to set reuse terms.
