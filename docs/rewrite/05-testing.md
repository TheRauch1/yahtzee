# Testing

The existing suite is **73 tests across 5 files**, and it is the real specification of this
app. Port the _assertions_; rewrite the _selectors_.

---

## Two Vitest projects

Keep the two-project split — it is the right shape, and CI already installs Chromium.

```ts
// vite.config.ts — the `test` key of the defineConfig object
export default defineConfig({
	// resolve + plugins: see 01-scaffold.md
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.test.{ts,tsx}'],
					exclude: ['src/**/*.browser.test.{ts,tsx}'],
					setupFiles: ['./src/test/setup-node.ts']
				}
			},
			{
				// Component tests run in a real browser rather than a DOM shim, so
				// portals, focus containment and inert behave as they do in production.
				extends: './vite.config.ts',
				test: {
					name: 'browser',
					include: ['src/**/*.browser.test.{ts,tsx}'],
					setupFiles: ['./src/test/setup-browser.ts'],
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(
							chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}
						),
						instances: [{ browser: 'chromium' }]
					}
				}
			}
		]
	}
});
```

`include` is scoped to `src/**` in both projects, so the overridden `exclude` never has to
re-list `node_modules`.

**Component tests stay in real Chromium, not jsdom.** Base UI's Dialog uses portals, focus
containment, `inert` and `ResizeObserver`; jsdom models all of those badly and the suite
would be flaky for no gain. Chromium is already installed in CI, so this costs nothing.

---

## Where each existing file lands

Note a correction to any assumption you may have: **`gameStore.svelte.test.ts` runs in the
browser project today**, not Node — its filename matches the `*.svelte.test.ts` pattern that
the server project excludes. The port moves the largest fast-moving suite out of Chromium and
into Node, which is a real speed win.

| Today                       | Tests | New file                                       | Project                |
| --------------------------- | ----- | ---------------------------------------------- | ---------------------- |
| `scoring.test.ts`           | 18    | `src/lib/scoring.test.ts` — **verbatim**       | unit                   |
| `gameStore.svelte.test.ts`  | 17    | `src/lib/game-store.test.ts`                   | **unit** (was browser) |
| `DiceFace.svelte.test.ts`   | 5     | `src/components/dice-face.browser.test.tsx`    | browser                |
| `ScoreModal.svelte.test.ts` | 13    | `src/components/score-dialog.browser.test.tsx` | browser                |
| `Scoreboard.svelte.test.ts` | 12    | `src/components/scoreboard.browser.test.tsx`   | browser                |
| —                           | new   | `src/lib/theme-store.browser.test.ts`          | browser                |
| —                           | new   | `src/lib/locale-store.browser.test.ts`         | browser                |
| —                           | new   | `src/lib/translations.test.ts`                 | unit                   |

`scoring.test.ts` needs **no changes at all** — it imports only pure functions. Keep it.

`game-store.test.ts` is a mechanical rename: every `new Game()` becomes
`createGameStore()`. The assertions are identical.

---

## Setup files

### `src/test/setup-node.ts`

The stores read and write global `localStorage` exactly as they do in the browser. Node has
no Web Storage, so give it a minimal in-memory one — that keeps the production code path
under test instead of adding a test-only branch to the store.

```ts
import { beforeEach } from 'vitest';

class MemoryStorage {
	private map = new Map<string, string>();
	get length() {
		return this.map.size;
	}
	key(index: number) {
		return [...this.map.keys()][index] ?? null;
	}
	getItem(key: string) {
		return this.map.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		this.map.set(key, String(value));
	}
	removeItem(key: string) {
		this.map.delete(key);
	}
	clear() {
		this.map.clear();
	}
}

globalThis.localStorage = new MemoryStorage() as unknown as Storage;

beforeEach(() => {
	localStorage.clear();
});
```

The quota-error path (`save()` swallowing a throw) is testable here by temporarily replacing
`localStorage.setItem` with a thrower.

### `src/test/setup-browser.ts`

`localStorage.clear()` alone is **not enough**. The stores load persisted state once, at
module import, so clearing storage leaves the in-memory snapshot populated. That is exactly
why the current `Scoreboard.svelte.test.ts` has to call `game.reset()` on top of the shared
setup. Hoist all of it so every browser test gets a clean slate.

```ts
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { gameStore } from '@/lib/game-store';
import { localeStore } from '@/lib/locale-store';
import { themeStore } from '@/lib/theme-store';

beforeEach(() => {
	// Clear storage first so storage and memory agree afterwards.
	localStorage.clear();
	gameStore.reset();
	themeStore.set('dark');
	// The locale store is a module singleton, so a test that switches language
	// would otherwise leak German strings into every assertion after it.
	localeStore.set('en');
});

afterEach(cleanup);
```

---

## Rewrite the selectors

The old component tests select structurally — `.space-y-3 > button`, `.grid > .space-y-2`,
`.grid-cols-3 > button`, `dialog`, `tbody button[aria-label^="Score "]`. **Every one of those
dies with the markup.**

Port the assertions using role and label queries — `getByRole('button', { name })`,
`getByRole('dialog')`, `getByLabelText(...)` — so the suite survives the next restyle.

One API difference from `vitest-browser-svelte`: drop `await tick()` in favour of
`await expect.element(...)` assertions, which poll until the DOM settles. `render(...)` is
still async — keep the `await`.

---

## Assertions that must keep a test

Each of these encodes a decision someone will otherwise "fix".

**Scoring**

- `threeOfAKindScore(5) === 18`, `threeOfAKindScore(1) === 6`, `threeOfAKindScore(6) === 21`
- `fourOfAKindScore(5) === 21`, `fourOfAKindScore(1) === 5`, `fourOfAKindScore(6) === 25`
- Upper bonus boundary: 62 → `0`, 63 → `35`, 65 → `35`, 100 → `35`
- `twoPairsScore(1, 1) === 4` — pairs need not be distinct
- Totals ignore `null` and `NaN`; an all-null scorecard grand-totals `0`
- The bonus is folded into the grand total once earned

**Store**

- Names are trimmed; blank and whitespace-only input is ignored
- Three players added in one tick get three distinct ids
- `NaN` → `0`; an unknown `playerId` is a silent no-op that does not throw
- A category can be re-scored
- `clearCategory` isolates to one category **and survives a reload**
- localStorage round-trip; `reset()` clears storage
- Corrupt payloads all recover to `[]`: `'{not json'`, `'"a string"'`, `'[1, 2, null]'`
- Missing categories filled with `null`, unknown categories dropped, missing `id` backfilled

**Dialog**

- Opens with an accessible name; closes on Escape and on Cancel
- Option counts: 6 for an upper category, 7 for pair, 7 for three- and four-of-a-kind
- **"None" on three-/four-of-a-kind scores `0`, not the house-rule remainder**
- Two-pairs and full-house do **not** submit until both halves are chosen
- Straights and Yahtzee submit their flat values
- Chance submits at exactly five dice: `[6,6,6,6,1]` → `25`
- Erase is offered for a category scratched to `0`, and **not** for one never scored

**Board**

- No table renders when there are no players
- Scoring through the dialog updates Upper Total and Grand Total
- The 62 → 63 flip shows Bonus `35` and Grand Total `98`
- Erasing rolls the totals back
- Removing a player; resetting clears the board
- Theme toggle mutates `document.documentElement.classList` and `localStorage`
- Language switch updates strings, `localStorage`, `document.documentElement.lang`, and the
  interpolated `aria-label`s — assert the German one, e.g. `"Fünfer für Ada werten"`
- **15 score cells per player**, each with an accessible name

**New**

- Confirming Reset empties the board; cancelling leaves it untouched
- Confirming Remove deletes that player; cancelling leaves them
- `translations.ts`: both locales have identical key sets, and the hardcoded locale list in
  `index.html` matches `LOCALES`
- `theme-store`: initial value is read from the DOM class, and `set()` updates
  `meta[name="theme-color"]`

---

## CI

`.github/workflows/ci.yml` keeps its shape. The typecheck step still runs `npm run check`,
which is now `tsc -b --noEmit` instead of `svelte-check`. Everything else is unchanged:
`npm ci` → lint → typecheck → `npx playwright install --with-deps chromium` → test → build →
`test:pwa`, on Node 22.
