# Phase 2 — State, persistence and i18n

**Gate: the `unit` Vitest project is green. No components exist yet.**

Three module-level Svelte singletons become three **external stores consumed with
`useSyncExternalStore`**.

Not Context, not Zustand:

- **Context + `useReducer`** would need a Provider for a single-consumer store, re-render the
  whole subtree per dispatch, and make state unreadable outside React — while the theme store
  _must_ do DOM side effects (`classList.toggle`, `meta[theme-color]`) that have no business
  inside a render.
- **Zustand** is a dependency to reimplement the ~60 lines below. `create()` is
  `useSyncExternalStore` plus a closure. In an offline-first PWA whose whole value is a small
  precache, that is weight with no leverage.
- **`useSyncExternalStore`** is a 1:1 map of the Svelte singleton, and the store files import
  **zero React** — so their tests run in the fast Node project.

---

## `src/lib/game-store.ts`

Use a **closure factory, not a class.** A class means `store.getSnapshot` passed unbound into
`useSyncExternalStore` loses `this` and crashes. The factory has no `this` at all.

```ts
import type { Player, ScoringCategory } from './types';
import { ALL_CATEGORIES } from './types';

const STORAGE_KEY = 'yahtzee:v1';

export function emptyScores(): Record<ScoringCategory, number | null> {
	return Object.fromEntries(ALL_CATEGORIES.map((category) => [category, null])) as Record<
		ScoringCategory,
		number | null
	>;
}

// createId(), parsePlayer(), loadPlayers() and save() port VERBATIM from the
// deleted src/lib/gameStore.svelte.ts. They are already framework-free and
// already defensive. Do not rewrite them. See "Rehydration" below.

export interface GameStore {
	subscribe(listener: () => void): () => void;
	getSnapshot(): readonly Player[];
	addPlayer(name: string): void;
	removePlayer(playerId: string): void;
	scoreCategory(category: ScoringCategory, score: number, playerId: string): void;
	clearCategory(category: ScoringCategory, playerId: string): void;
	reset(): void;
}

export function createGameStore(): GameStore {
	let players: readonly Player[] = loadPlayers();
	const listeners = new Set<() => void>();

	/**
	 * The single write path. `players` is replaced, never mutated: React compares
	 * snapshots with Object.is, so an in-place edit would persist correctly and
	 * still render nothing at all.
	 */
	function commit(next: readonly Player[]): void {
		players = next;
		save(players);
		for (const listener of listeners) listener();
	}

	function setScore(category: ScoringCategory, score: number | null, playerId: string): void {
		let found = false;
		const next = players.map((player) => {
			if (player.id !== playerId) return player;
			found = true;
			return { ...player, scores: { ...player.scores, [category]: score } };
		});
		if (found) commit(next);
	}

	return {
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},

		// Returns the cached array reference. Never derive, filter, sort or wrap here.
		getSnapshot: () => players,

		addPlayer(name) {
			const trimmed = name.trim();
			if (!trimmed) return;
			commit([...players, { id: createId(), name: trimmed, scores: emptyScores() }]);
		},

		removePlayer(playerId) {
			const next = players.filter((player) => player.id !== playerId);
			if (next.length !== players.length) commit(next);
		},

		scoreCategory(category, score, playerId) {
			setScore(category, Number.isNaN(score) ? 0 : score, playerId);
		},

		clearCategory(category, playerId) {
			setScore(category, null, playerId);
		},

		reset() {
			commit([]);
		}
	};
}

export const gameStore = createGameStore();
```

`createGameStore()` gives every unit test a fresh, isolated store with no module mocking —
the existing tests already do `new Game()` per test, so they port line for line. The
`gameStore` singleton is what components import; they call its actions directly from event
handlers, so there is **no action hook, no `useCallback`, and never a dependency-array
entry**.

### Behaviour that must survive exactly

Every line here is currently pinned by a test.

- `addPlayer` trims, and **silently ignores** blank or whitespace-only names.
- Ids come from `crypto.randomUUID()` when available, falling back to
  `` `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}` ``. `randomUUID`
  needs a secure context, and the fallback exists so two players added in the same
  millisecond cannot collide. Three players added in one tick get three distinct ids.
- `scoreCategory` stores `0` when handed `NaN`, and **no-ops silently** for an unknown
  `playerId`.
- Any category can be re-scored freely. There is no "already used" lock.
- `clearCategory` returns one category to `null` and **persists** — it must survive a reload,
  not just live in memory.
- `reset()` deletes **all players**, not just their scores. There is no "new game, same
  players" path. Do not invent one.
- `save()` writes the whole array on every mutation and swallows failures, because storage
  can be full or blocked in private mode. The game then works in memory only.

### Rehydration — port `parsePlayer` verbatim

The defensive loader is load-bearing and directly tested. Every rule matters:

| Input                               | Result          |
| ----------------------------------- | --------------- |
| Unparseable JSON                    | `[]`            |
| Valid JSON that is not an array     | `[]`            |
| Array element that is not an object | dropped         |
| Object with a non-string `name`     | dropped         |
| Unknown score key                   | discarded       |
| Missing score key                   | `null`          |
| Non-finite number as a score        | `null`          |
| Missing or empty `id`               | fresh id minted |

Its purpose, from the original comment: _a payload written by an older version can never
white-screen the app._

---

## `src/hooks/use-game.ts`

```ts
import { useMemo, useSyncExternalStore } from 'react';
import { gameStore } from '@/lib/game-store';
import type { Player } from '@/lib/types';

export function usePlayers(): readonly Player[] {
	return useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot);
}

export function usePlayer(playerId: string | null): Player | null {
	const players = usePlayers();
	return useMemo(
		() => players.find((player) => player.id === playerId) ?? null,
		[players, playerId]
	);
}
```

### The `getSnapshot` trap — read this twice

React calls `getSnapshot` on every render and after every notification, and compares results
with `Object.is`. If it returns a fresh object each call, React sees a change, re-renders,
calls it again, forever, and throws _"The result of getSnapshot should be cached to avoid an
infinite loop"_.

All three of these are broken, and all three are what gets written by reflex:

```ts
useSyncExternalStore(sub, () => gameStore.getSnapshot().filter((p) => p.name)); // new array
useSyncExternalStore(sub, () => ({ players: gameStore.getSnapshot() })); // new object
useSyncExternalStore(sub, () => [...players]); // new array
```

**The rule: `getSnapshot` returns exactly one of — the cached array reference, or a
primitive.** All derivation (`upperTotal`, `grandTotal`, filtering) happens in the component
body. Those scoring functions are pure and cheap; for a 15-row table, call them inline in
render with no memoisation at all.

`getServerSnapshot` is deliberately omitted. There is no SSR and no prerendering of React
output, so it would be dead code — and if anyone later adds prerendering, its absence throws
loudly, which is the right failure.

### No hydration mismatch, by construction

`main.tsx` calls `createRoot` against an empty `<div id="root">`. There is no `hydrateRoot`,
so the mismatch failure mode does not exist. `localStorage` is read **eagerly at module
scope**, which means the very first React render already has the real players.

**Do not** use the `useState` + `useEffect` pattern to read `localStorage`. It costs an extra
render and reintroduces a flash of the empty board.

---

## `src/lib/theme-store.ts`

```ts
export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'yahtzee:theme';
export const DEFAULT_THEME: Theme = 'dark';

/** Kept in sync with the --background values in src/index.css. */
export const THEME_COLORS: Record<Theme, string> = { dark: '#0b1220', light: '#f8fafc' };

function readAppliedTheme(): Theme {
	if (typeof document === 'undefined') return DEFAULT_THEME;
	// The inline script in index.html already applied the class before first
	// paint, so the DOM is the source of truth and the two can never disagree.
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function createThemeStore() {
	let current: Theme = readAppliedTheme();
	const listeners = new Set<() => void>();

	function set(theme: Theme) {
		current = theme;
		document.documentElement.classList.toggle('dark', theme === 'dark');
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', THEME_COLORS[theme]);
		try {
			localStorage.setItem(THEME_STORAGE_KEY, theme);
		} catch {
			// Blocked storage just means the preference does not survive a reload.
		}
		for (const listener of listeners) listener();
	}

	return {
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		getSnapshot: (): Theme => current,
		set,
		toggle: () => set(current === 'dark' ? 'light' : 'dark')
	};
}

export const themeStore = createThemeStore();
```

Replace the two hex values in `THEME_COLORS` with the actual `--background` values of the
shadcn neutral theme once `src/index.css` exists, and keep the comment tying them together.

`src/hooks/use-theme.ts`:

```ts
export function useTheme(): Theme {
	return useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot);
}
```

Derive `isDark` at the call site — `const isDark = useTheme() === 'dark'`. **Do not** make
`getSnapshot` return `{ theme, isDark }`; that is the infinite loop again. Primitive
snapshots are automatically safe.

---

## `src/lib/locale-store.ts`

Same shape. Key `yahtzee:locale`, values `'en' | 'de'`, default `'en'`. `set()` also assigns
`document.documentElement.lang`, and both the read and the write are wrapped in try/catch for
blocked storage.

`src/hooks/use-locale.ts`:

```ts
import { useSyncExternalStore } from 'react';
import { localeStore } from '@/lib/locale-store';
import { translations, type Locale, type Translation } from '@/lib/translations';

export function useLocale(): Locale {
	return useSyncExternalStore(localeStore.subscribe, localeStore.getSnapshot);
}

export function useTranslation(): Translation {
	return translations[useLocale()];
}
```

`useTranslation()` returns the module-level `translations[locale]` object, so its reference is
stable per locale and safe in dependency arrays.

---

## i18n — keep the hand-rolled object

**Do not introduce an i18n library.**

- `react-i18next` means i18next (~14 kB gz) + react-i18next (~7 kB gz) + a plural plugin, for
  two locales and about 4 kB of strings — in an app whose entire value proposition is a small
  offline precache.
- Lingui needs a macro/Babel step, which is extra build complexity for no benefit.
- The function-valued strings are **more** type-safe than any library gives you.
  `t.scoreboard.scoreFor(category, player)` is checked for both arity and types.
  `t('scoreFor', { category, player })` is stringly-typed without hand-written resource
  augmentation.
- Lazy-loading locales would add a round-trip an offline app has to precache anyway.

Nine strings are **functions** taking parameters, and they stay functions:

`scoreboard.bonus(threshold)` · `scoreboard.removePlayer(name)` ·
`scoreboard.scoreFor(category, player)` · `scoreModal.scoreFor(category)` ·
`scoreModal.howManyDidYouRoll(category)` · `scoreModal.clickDiceToAdd(max)` ·
`scoreModal.addDie(value)` · `scoreModal.removeDie(value)` ·
`scoreModal.moreDiceToSelect(count)`

Because the shape is unchanged, **every `t.*` expression in the old components ports
character for character.** That is the strongest argument for keeping it.

Deliberate quirks — do not "fix" these:

- English `howManyDidYouRoll` lowercases the category; German does not, because German nouns
  stay capitalised.
- German uses **"Yahtzee", not "Kniffel"**. That was a deliberate later correction.
- Each locale names itself in the switcher (`English` / `Deutsch`) regardless of the active
  locale.

### Two small fixes worth making while porting

1. **`moreDiceToSelect(1)` currently renders "1 more dice to select".** Fix the English with
   an `if` inside the function. The German (`Noch 1 Würfel auszuwählen`) is already correct.
   This is the entire pluralisation requirement of the app.
2. Export the `Translation` interface (see [`01-scaffold.md`](./01-scaffold.md)).

### New keys for the confirmation dialogs

Add to **both** locales — see [`03-ui.md`](./03-ui.md#confirmation-dialogs) for the copy.

---

## The pre-paint script

`src/app.html` is gone. Its inline script moves into the root `index.html`, and it is
load-bearing.

Because this is a pure client SPA, there is no hydration mismatch to worry about. Two things
_are_ real:

1. **A flash of the wrong palette.** `index.html` ships without `.dark`. If React applied the
   class in an effect, the browser paints the light palette for one frame.
2. **`<html lang>` timing.** Assistive tech reads the document language at load. Setting it
   in a React effect is too late, and German content gets announced as English.

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
		<meta name="description" content="A local-first Yahtzee scorekeeper that works offline." />
		<title>Yahtzee Scoreboard</title>

		<link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
		<meta name="theme-color" content="#0b1220" />

		<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
		<meta name="apple-mobile-web-app-title" content="Yahtzee" />

		<!-- Classic and blocking, so it runs before first paint. Must NOT become
		     type="module" — module scripts are deferred and the page would paint
		     the wrong palette for a frame. -->
		<script>
			// Dark is the default: anything that is not exactly 'light' yields dark.
			try {
				var isLight = localStorage.getItem('yahtzee:theme') === 'light';
				document.documentElement.classList.toggle('dark', !isLight);
				document
					.querySelector('meta[name="theme-color"]')
					.setAttribute('content', isLight ? '#f8fafc' : '#0b1220');
			} catch (e) {
				document.documentElement.classList.add('dark');
			}

			// Tag the document with the saved language before first paint, so
			// assistive tech does not read German content as English.
			// Keep this list in sync with LOCALES in src/lib/translations.ts.
			try {
				var savedLocale = localStorage.getItem('yahtzee:locale');
				if (['en', 'de'].indexOf(savedLocale) !== -1) {
					document.documentElement.lang = savedLocale;
				}
			} catch (e) {
				// No stored preference reachable; the shipped lang="en" stands.
			}
		</script>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/main.tsx"></script>
	</body>
</html>
```

`vite-plugin-pwa` injects the `<link rel="manifest">` — do not add it by hand.

### The `theme-color` line fixes a real bug

Today `app.html` hardcodes `content="#0b1220"` and `readStoredTheme()` reads the class without
ever calling `set()`. So a user whose stored preference is **light** gets a dark browser
status bar and PWA title bar until they toggle the theme. Setting it in the inline script
fixes it while keeping it pre-paint.

### The duplicated locale list

`['en', 'de']` is hardcoded here _and_ in `translations.ts`. Keep the sync comment, and add a
Node test (`src/lib/translations.test.ts`) that reads `index.html` with `fs` and asserts the
two lists match. Injecting it through a Vite HTML transform is over-engineering for two
locales; a drift test is not.

---

## Gate

```bash
npx vitest run --project unit
```

Green, with `scoring.test.ts`, `game-store.test.ts` and `translations.test.ts` covering
everything in [`05-testing.md`](./05-testing.md). Commit.
