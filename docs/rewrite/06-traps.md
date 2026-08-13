# Traps

Ranked by how likely they are to be got wrong. Read this before Phase 2 and again before
Phase 3.

---

### 1. In-place mutation survives the port

The Svelte store did `player.scores[category] = x` and Svelte's `$state` proxy made that
reactive. React compares snapshots with `Object.is`, so an in-place edit **persists correctly
and renders nothing**. It is the single most likely bug in this rewrite, and it looks like it
works — the data is right after a reload.

It has a subtler variant that reads as correct:

```ts
// WRONG — new player object, same scores object, mutated
const next = players.map((p) => (p.id === id ? { ...p, scores: p.scores } : p));
next.find((p) => p.id === id)!.scores[category] = value;
```

Both `players` **and** `scores` must be replaced.

### 2. The `getSnapshot` infinite loop

Any derivation inside `getSnapshot` — `.filter`, `.map`, `[...x]`, `{ ... }` — produces
_"The result of getSnapshot should be cached to avoid an infinite loop"_. Return the cached
array reference or a primitive, nothing else. Derive in the component body.

### 3. `useState` + `useEffect` to read localStorage

Reintroduces a paint of the empty board, and for theme a full palette flash. Read eagerly at
module scope; there is no SSR here, so nothing forces the effect pattern.

### 4. Porting `class Game` to a class

`useSyncExternalStore(store.subscribe, store.getSnapshot)` on a class instance passes the
method unbound and `this` is `undefined`. Use the closure factory in
[`02-state.md`](./02-state.md) — it has no `this` at all.

### 5. An always-mounted `<Dialog open={...}>`

The shadcn idiom, and it kills the free per-category state reset — a half-picked two-pairs
selection leaks into the next category the user opens. Mount the picker conditionally **and**
give it `key={`${playerId}:${category}`}`.

### 6. "None" scoring the house-rule remainder

`threeOfAKindScore(0)` is `3` and `fourOfAKindScore(0)` is `1`. The "None" row must call
`onScore(0)` **directly**, never through the scoring function. This was a real bug once and
there is a test named after it.

### 7. The house rules are not bugs

`value × 3 + 3` and `value × 4 + 1` are how the owner plays. Do not "correct" them to a
rulebook. If they ever do change, `scoring.test.ts` and the table in `README.md` change in
the same commit — that is a standing repo rule.

### 8. `0` is a real score

Every emptiness check is `!== null`, never truthiness. A cell holding `0` renders `0`, counts
toward totals, and offers Erase.

### 9. `reset()` deletes players, not just scores

There is no "new game, same players" path. Do not invent one, and do not soften it into
clearing scorecards.

### 10. `.prettierrc` still references Svelte

It lists `prettier-plugin-svelte` and points `tailwindStylesheet` at `./src/app.css`. Both
must change or `npm run lint` fails at plugin resolution — before it lints a single file.

### 11. `verify-pwa.mjs` asserts `'/'` is precached, and reads `keys[0]`

Workbox precaches `/index.html` and reaches `/` via `navigateFallback`, and its cache is
named `workbox-precache-v2-<origin>`. Both assertions break on a perfectly working build.
See [`04-pwa.md`](./04-pwa.md#scriptsverify-pwamjs).

### 12. `vite-plugin-pwa` running under Vitest

It registers a service worker inside the browser-test harness, which then serves stale
modules between runs. Guard the plugin with `process.env.VITEST`.

### 13. The inline script becoming `type="module"`, or `index.html` living in `public/`

Either one silently reintroduces the flash — the first because module scripts are deferred,
the second because Vite only treats the **root** `index.html` as the entry.

### 14. `%sveltekit.assets%` placeholders left in the copied `index.html`

Replace them with plain `/icons/...`. Do not set `base` in the Vite config — the default `/`
matches the manifest's `start_url`.

### 15. Pinning TypeScript wrong

`npm i -D typescript` installs 7.0.2, and `typescript-eslint@8.67` peer-caps at `<6.1.0`.
Pin `6.0.3` exactly.

### 16. Svelte→JSX attribute translation in `DiceFace`

`stroke-width` → `strokeWidth`, `class` → `className`. `viewBox`, `rx` and `aria-hidden` are
already correct. `{#each { length: count }, index}` becomes
`Array.from({ length: count }, (_, i) => ...)`.

### 17. Removing one of the two `NaN` guards

`Number.isNaN(score) ? 0 : score` exists in the picker **and** in the store. Keep both — the
store's is what `game-store.test.ts` asserts, the picker's is what the dialog tests assert.

### 18. Adding cross-tab `storage`-event sync

Not in the current app. Wiring it naively creates a feedback loop with `reset()` writing
`[]`. Out of scope.

### 19. Regenerating the icons

The PNGs are committed build outputs and the SVGs are their sources; the repo deliberately
ships both so no image tooling is needed to build. Move the bytes, do not rebuild them.

### 20. Assuming a Radix API

`components/ui/*` are Base UI internally. The shadcn wrapper exports the familiar names, so
consumption is unchanged — but read the generated file before editing a primitive.

### 21. The duplicated locale list

`['en', 'de']` lives in `index.html` **and** `translations.ts`. Keep the sync comment and add
the drift test.

### 22. `upperCategoryValue` falls back to `1`

`UPPER_CATEGORY_VALUES[category] ?? 1` — only reachable if called with a lower category, but
preserve it. `scoring.ts` is ported verbatim, so this is free unless someone "tidies" it.

---

## Dead code to drop

Confirmed unreferenced in the current codebase:

- `DiceRoll` in `types.ts` — declared, never used anywhere
- `.glass` in `app.css` — zero usages
- The `@theme inline` block in `app.css` — no `bg-app-*` / `text-app-*` utility is ever used
- `src/lib/index.ts` — a comment-only placeholder
- The `label` prop on `AddPlayerForm` — no caller ever passes it
