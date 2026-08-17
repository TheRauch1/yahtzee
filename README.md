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

## Quick start

Requires Node.js 22+ — `package.json` enforces it (`.npmrc` sets `engine-strict=true`, so an
older Node fails at install rather than at runtime), and `.node-version` pins it for CI and
hosts that read it.

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
  test/
    setup-node.ts                 localStorage polyfill for the node project
    setup-browser.ts              store reset + cleanup between browser tests
public/                          copied to dist/ verbatim
  icons/                          app icons (SVG sources + generated PNGs)
  _headers                        Cloudflare Pages cache policy
  service-worker.js               tombstone for the Svelte-era worker, see PWA below
  robots.txt
scripts/
  verify-pwa.mjs                  offline/manifest/migration checks (npm run test:pwa)
```

The PWA manifest is not a file here — `vite-plugin-pwa` generates `dist/manifest.webmanifest`
from the `manifest` option in `vite.config.ts`, which is its single source of truth.

## Testing

Two Vitest projects run from one config:

- **unit** — pure logic in Node (`src/**/*.test.{ts,tsx}`, minus the browser tests below)
- **browser** — components in real Chromium via `vitest-browser-react` (`src/**/*.browser.test.tsx`)

Browser tests run without the stylesheet, so they cover behaviour and the DOM, not appearance:
anything that depends on a CSS animation having run cannot be asserted there.

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
registers the service worker, drops the network, reloads, and asserts the app still works. It
then replays the Svelte-to-React migration against a browser holding the old worker, which is
the one thing no unit test can cover. Run `npm run build` first. It respects the same
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` override.

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

### Never move the service worker's URL

`public/service-worker.js` is a tombstone, not a service worker. It exists because the Svelte
build shipped a real one at that URL, and moving to Workbox's `/sw.js` stranded every browser
that had installed it: the old worker answered navigations from its own cache, so those
browsers kept serving the Svelte app and never fetched an `index.html` that would have
registered the new worker. A browser only re-checks the script URL it originally registered,
and a failed update check — a 404, or the `index.html` Cloudflare Pages returns for an
unmatched path — leaves the old worker installed rather than removing it. Nothing shipped
inside the app can reach those browsers.

The tombstone is what reaches them: it is served at the old URL, claims the old worker's
clients, unregisters itself, deletes every cache and reloads the page, which then comes from
the network. `npm run test:pwa` replays that whole migration, including the failure it fixes.

Two rules follow. Keep `public/service-worker.js` deployed indefinitely — a browser that has
not opened the site since the Svelte build is still waiting for it, and desktop browsers never
expire a registration on their own. And if the Workbox filename ever changes again, leave a
tombstone at the outgoing URL in the same release, or repeat this outage.

## Deployment

The build output in `dist/` is a set of static assets — no server-side rendering, no API,
nothing to run at request time. Point any static host (Cloudflare Pages, Netlify, GitHub
Pages, S3 + CDN, ...) at `dist/` after `npm run build`.

`public/_headers` is the one piece of host configuration in the repo, and Cloudflare Pages is
the host that reads it. The rule it encodes: files that decide _which build you get_ —
`index.html`, the manifest, both service worker URLs — must never be served from a cache,
while `/assets/*` names its own content in the filename and can be cached forever. Other hosts
ignore the file and need the same policy expressed their own way.

The rest of the Cloudflare Pages project is wired up in the Cloudflare dashboard, so its build
command and **output directory (`dist`)** are set there, not here. A host that reads
`.node-version` will pick up Node 22 from it; one that does not needs its Node version set
alongside the output directory, or `npm ci` fails the engine check.

## Contributing notes

- `src/lib/scoring.ts` is the only place scoring maths should live. Keep it pure and add a test.
- Files under `src/components/ui/` are shadcn/Base UI primitives — treat them as generated code,
  not hand-tuned application logic.
- To add a primitive, run `npx shadcn@latest add <name>`. The CLI is deliberately **not** a
  dependency: installing it to import one stylesheet cost 224 packages, so the handful of
  Base UI variants that stylesheet provided are inlined in `src/index.css` instead. If the new
  component styles itself off a Base UI data attribute, copy the matching `@custom-variant`
  across; the four in use are listed there. A missing one compiles to nothing silently, so
  check the component actually animates rather than trusting a green build.
- Run `npm run lint && npm run check && npm test` before pushing; CI runs the same, plus the PWA check.

## License

None specified. Add a `LICENSE` file if you want to set reuse terms.
