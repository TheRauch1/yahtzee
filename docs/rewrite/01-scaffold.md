# Phase 1 — Scaffold

**Gate: `npm run dev` serves a blank, Tailwind-styled page with the correct theme applied
before first paint.**

---

## Versions

All of these were checked against the npm registry in August 2026. Use them.

```jsonc
// dependencies
"react": "^19.2.8",
"react-dom": "^19.2.8",
"lucide-react": "^1.31.0",
// @base-ui/react, class-variance-authority, clsx and tailwind-merge are
// installed for you by `shadcn init` / `shadcn add`. Do not add them by hand.

// devDependencies
"vite": "^8.2.1",
"@vitejs/plugin-react": "^6.0.5",
"typescript": "6.0.3",                    // EXACT — see below
"tailwindcss": "^4.3.3",
"@tailwindcss/vite": "^4.3.3",
"tw-animate-css": "^1.4.0",
"vite-plugin-pwa": "^1.3.0",
"workbox-window": "^7.4.1",
"vitest": "^4.1.10",
"@vitest/browser-playwright": "^4.1.10",
"vitest-browser-react": "^2.2.0",
"playwright": "^1.62.1",
"eslint": "^10.8.1",
"@eslint/js": "^10.0.1",
"@eslint/compat": "^2.1.0",
"typescript-eslint": "^8.67.0",
"eslint-plugin-react-hooks": "^7.1.1",
"eslint-plugin-react-refresh": "^0.5.4",
"eslint-config-prettier": "^10.1.8",
"globals": "^17.11.0",
"prettier": "^3.9.6",
"prettier-plugin-tailwindcss": "^0.8.1",
"@types/react": "^19.2.18",
"@types/react-dom": "^19.2.4",
"@types/node": "^26.2.0"
```

### Version notes that will bite you

- **Pin `typescript` to `6.0.3` exactly.** npm's `latest` is 7.0.2, but
  `typescript-eslint@8.67` declares `typescript: ">=4.8.4 <6.1.0"`. A bare
  `npm i -D typescript` installs 7 and breaks peer resolution on the next `npm ci`.
- **`@vitest/browser-playwright` peer-depends on an exact `vitest` version** (`"4.1.10"`).
  If you bump one, bump the other in the same commit.
- **`workbox-window` is listed explicitly** even though `vite-plugin-pwa` depends on it.
  It is also a peer, and `virtual:pwa-register` resolves it from _your_ `node_modules`.
- **React Compiler is out of scope.** `@vitejs/plugin-react@6` supports it via optional
  peers, but it adds a Babel pass for negligible gain on a 15-row table.
  `eslint-plugin-react-hooks@7` already ships the compiler-derived lint rules — take the
  linting, skip the build step.

---

## File moves — what to keep, what to delete

### Keep in place, unchanged

These three files are plain TypeScript with no framework code in them. **Do not delete and
retype them.** `git mv` is not even needed — they already live at the right path.

| File                      | Change                                                          |
| ------------------------- | --------------------------------------------------------------- |
| `src/lib/scoring.ts`      | none — byte-for-byte                                            |
| `src/lib/types.ts`        | delete the unused `DiceRoll` interface; nothing else            |
| `src/lib/translations.ts` | change `interface Translation` → `export interface Translation` |
| `src/lib/scoring.test.ts` | none                                                            |

`Translation` is currently unexported (line 13). The `useTranslation()` hook needs it.

### Move

| From                       | To                  |
| -------------------------- | ------------------- |
| `static/icons/*` (6 files) | `public/icons/*`    |
| `static/robots.txt`        | `public/robots.txt` |

**Do not regenerate the icons.** The PNGs are committed build outputs and the SVGs are their
sources; the repo deliberately ships both so no image tooling is needed. Move the bytes.

### Delete

```
src/routes/                    (+layout.svelte, +layout.ts, +page.svelte)
src/lib/*.svelte               (Scoreboard, ScoreModal, DiceFace, AddPlayerForm, LanguageSwitcher)
src/lib/*.svelte.ts            (gameStore, theme, locale)
src/lib/*.svelte.test.ts       (4 files — their assertions are ported, see 05-testing.md)
src/lib/index.ts               (comment-only placeholder)
src/app.html                   (its inline script moves to index.html — see 02-state.md)
src/app.css                    (replaced by shadcn tokens — see 03-ui.md)
src/app.d.ts
src/service-worker.ts          (replaced by vite-plugin-pwa)
static/manifest.webmanifest    (moves into the plugin config — see 04-pwa.md)
svelte.config.js
vitest-setup-client.ts
package-lock.json              (regenerated)
```

Read the deleted `.svelte` files before deleting them — they are the source material for
Phase 3, and [`03-ui.md`](./03-ui.md) specifies them, but the originals are the ground
truth. They stay available in git history either way.

---

## Target tree

```
index.html                     ← root entry, contains the pre-paint script
components.json                ← written by `shadcn init`
vite.config.ts
tsconfig.json                  ← solution file, references the two below
tsconfig.app.json              ← src/**, "@/*" path, DOM lib
tsconfig.node.json             ← vite.config.ts, scripts/**
eslint.config.js
public/
  icons/                       ← 6 files, moved verbatim
  robots.txt
scripts/
  verify-pwa.mjs               ← retargeted at dist/ (see 04-pwa.md)
docs/rewrite/                  ← this spec
src/
  main.tsx                     ← createRoot + registerSW + import './index.css'
  App.tsx                      ← renders <Scoreboard />
  index.css                    ← @import tailwindcss + shadcn tokens
  vite-env.d.ts                ← vite/client + vite-plugin-pwa/client refs
  lib/
    utils.ts                   ← cn()  (generated by shadcn)
    types.ts                   ← kept
    scoring.ts                 ← kept, verbatim
    scoring.test.ts            ← kept, verbatim
    translations.ts            ← kept, + export Translation
    translations.test.ts       ← NEW: locale-key parity + index.html drift
    game-store.ts
    game-store.test.ts
    theme-store.ts
    theme-store.browser.test.ts
    locale-store.ts
    locale-store.browser.test.ts
  hooks/
    use-game.ts                ← usePlayers, usePlayer
    use-theme.ts               ← useTheme
    use-locale.ts              ← useLocale, useTranslation
  components/
    scoreboard.tsx
    scoreboard.browser.test.tsx
    score-table.tsx
    score-cell.tsx
    score-dialog.tsx
    score-picker.tsx           ← the nine category panels
    score-dialog.browser.test.tsx
    dice-face.tsx
    dice-face.browser.test.tsx
    add-player-form.tsx
    player-chips.tsx
    language-switcher.tsx
    theme-toggle.tsx
    confirm-dialog.tsx         ← AlertDialog wrapper (new)
    ui/                        ← shadcn-generated. Do not hand-edit.
  test/
    setup-node.ts
    setup-browser.ts
```

Test-file naming mirrors the convention already in the repo: `*.browser.test.{ts,tsx}` runs
in real Chromium, `*.test.ts` runs in Node.

---

## Steps

### 1. Restructure

Move the icons and `robots.txt` into `public/` **before** deleting `static/`. Delete the
files listed above.

### 2. `package.json`

Name it `yahtzee`, keep `"private": true` and `"type": "module"`, and add the `engines`
field the repo currently lacks (`.npmrc` already sets `engine-strict=true`, so today it
enforces nothing):

```json
"engines": { "node": ">=22" }
```

Scripts:

```json
"dev": "vite",
"build": "tsc -b && vite build",
"preview": "vite preview",
"check": "tsc -b --noEmit",
"test": "vitest run",
"test:unit": "vitest",
"test:pwa": "node scripts/verify-pwa.mjs",
"format": "prettier --write .",
"lint": "prettier --check . && eslint ."
```

### 3. TypeScript

Three files. `tsconfig.json` is a solution file that references the other two.

`tsconfig.app.json` needs `strict: true`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`,
DOM libs, and the alias:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

Set `baseUrl` + `paths` in **both** `tsconfig.json` and `tsconfig.app.json` — the shadcn CLI
reads the root one to resolve its aliases.

### 4. `vite.config.ts`

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { playwright } from '@vitest/browser-playwright';

// Escape hatch for machines that have a Chromium but not the exact build
// Playwright expects, and cannot download one (offline, or a locked-down egress
// policy). Unset — CI and ordinary local runs — behaves as it always did.
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

// A service worker inside the Vitest browser harness intercepts the test page's
// own requests and serves stale modules between runs. Keep it out of tests.
const isVitest = !!process.env.VITEST;

export default defineConfig({
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
	},
	plugins: [react(), tailwindcss(), ...(isVitest ? [] : [VitePWA({/* see 04-pwa.md */})])],
	test: {/* see 05-testing.md */}
});
```

Keep the `PLAYWRIGHT_CHROMIUM_EXECUTABLE` escape hatch and its comment — it exists so the
suite runs on locked-down machines. Unlike the Svelte config, `@types/node` is now a
dependency, so the `declare const process` hack is no longer needed.

### 5. Entry files

`index.html` at the repo root (**not** in `public/` — Vite only treats the root one as the
entry). Its full contents, including the load-bearing pre-paint script, are specified in
[`02-state.md`](./02-state.md#the-pre-paint-script).

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// autoUpdate: a new build takes over on the next navigation. There is no
// unsaved state to lose — everything already lives in localStorage.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

`src/index.css` starts as just `@import 'tailwindcss';` — `shadcn init` fills in the rest.

### 6. shadcn/ui

```bash
npx shadcn@latest init
```

Accept the defaults (**Base UI** — its default since July 2026) and choose base colour
**neutral**. This writes `components.json`, `src/lib/utils.ts` with `cn()`, and the full
OKLCH token block plus a class-driven `@custom-variant dark` into `src/index.css`.

Then:

```bash
npx shadcn@latest add button card dialog alert-dialog input select \
    badge table toggle-group separator label
```

All eleven names are confirmed present in the current shadcn registry.

**Read the generated `src/components/ui/dialog.tsx` before composing with it.** These
components are Base UI internally, not Radix — do not write Radix APIs from memory. The
shadcn wrapper still exports the familiar names (`Dialog`, `DialogContent`, `DialogHeader`,
`DialogTitle`, `DialogFooter`), so consumption is unchanged, but if you ever need to edit a
primitive, <https://base-ui.com/react/components/dialog> is the reference.

Never hand-edit files in `components/ui/` unless the spec explicitly says to.

### 7. Lint and format config

`eslint.config.js` — flat config, keeping the existing shape but swapping the Svelte plugin
for the React ones:

```js
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	reactHooks.configs.recommended,
	reactRefresh.configs.vite,
	prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		// typescript-eslint recommends against no-undef on TypeScript projects.
		rules: { 'no-undef': 'off' }
	}
);
```

`.prettierrc` — **two edits are mandatory or `npm run lint` fails at plugin resolution.**
Drop `prettier-plugin-svelte` and the `*.svelte` override, and retarget the stylesheet:

```json
{
	"useTabs": true,
	"singleQuote": true,
	"trailingComma": "none",
	"printWidth": 100,
	"plugins": ["prettier-plugin-tailwindcss"],
	"tailwindStylesheet": "./src/index.css"
}
```

Tabs, single quotes, no trailing commas, 100 columns — the whole repo follows this. Keep it.

`.prettierignore` — change `/static/` to `/public/`.

`.gitignore` — replace `/.svelte-kit` and `/build` with `/dist`. Leave the rest.

### 8. CI

`.github/workflows/ci.yml` keeps its exact shape. One line changes: the typecheck step runs
`npm run check` which is now `tsc -b --noEmit` instead of `svelte-check`. Everything else —
`npm ci`, lint, `npx playwright install --with-deps chromium`, test, build, `test:pwa`, Node
22 — is unchanged.

---

## Gate

```bash
npm install
npm run dev
```

The page is blank but styled, the document has `class="dark"` on `<html>` **before** first
paint, and `npm run lint && npm run check` pass. Commit.
