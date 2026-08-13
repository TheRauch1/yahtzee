# React rewrite — implementation spec

This directory is the complete specification for rewriting the Yahtzee scorekeeper from
SvelteKit to React. It is written to be executed top to bottom by an implementer who has
not seen the Svelte codebase.

Read this file first, then work the phases in order. Each phase has its own document.

| Document                             | Covers                                                 |
| ------------------------------------ | ------------------------------------------------------ |
| [`01-scaffold.md`](./01-scaffold.md) | Versions, file moves, configs, shadcn init             |
| [`02-state.md`](./02-state.md)       | Stores, hooks, persistence, i18n, the pre-paint script |
| [`03-ui.md`](./03-ui.md)             | Design system, every component, the score dialog       |
| [`04-pwa.md`](./04-pwa.md)           | `vite-plugin-pwa`, offline verification                |
| [`05-testing.md`](./05-testing.md)   | Vitest projects, test mapping, what must stay pinned   |
| [`06-traps.md`](./06-traps.md)       | Ranked list of things that will go wrong               |

---

## What this app is

A **local-first Yahtzee scorekeeper** — the paper score sheet, digitised. You roll real
dice; the app keeps the scorecard.

There is **no dice rolling, no turns, no rounds, no game-over detection, no winner, no AI
opponent, no backend, no API, no database and no router.** One page. Everything lives in
`localStorage`. It is an installable PWA that works with no network at all, in English and
German.

If you find yourself adding a dice roller or a turn counter, stop — you have misread the
product.

## Why the rewrite

The app works, but its UI is hand-rolled: bare Tailwind utilities, a hand-written CSS
variable palette, a native `<dialog>`, and a `<select>` for language. The rewrite moves it
onto React and a real design system so the interface is maintainable and the score table is
genuinely good on a phone.

**Functionality is frozen.** The one deliberate exception is confirmation dialogs on the two
destructive actions (see below). Everything else — every scoring rule, every storage key,
every string — carries over unchanged.

## Locked decisions

| Decision            | Choice                                                      |
| ------------------- | ----------------------------------------------------------- |
| Framework           | **Vite 8 + React 19 SPA** — no router, no SSR, no prerender |
| Component library   | **shadcn/ui with Base UI** (its default since July 2026)    |
| Theme               | **shadcn stock `neutral` palette**, dark by default         |
| Destructive actions | **Confirmation dialogs added** for Reset and Remove Player  |
| Everything else     | Behaviour frozen                                            |

## Non-negotiable invariants

1. **The house rules are law.** Three-of-a-kind scores `value × 3 + 3`; four-of-a-kind
   scores `value × 4 + 1`. These are deliberate — they are how the owner actually plays.
   They are not bugs and must not be "corrected" to a rulebook. `src/lib/scoring.ts` is
   kept **byte-for-byte**.
2. **Storage keys and payload shape do not change** — `yahtzee:v1`, `yahtzee:theme`,
   `yahtzee:locale`. A game saved by the Svelte version must load in the React version with
   no migration. This is a hard compatibility guarantee and there is a manual test for it.
3. **Offline still works.** The app opens and is fully interactive with the network off.
4. **No flash** of the wrong theme or the wrong `<html lang>` on first paint.
5. **`0` is a real score.** Every emptiness check is `!== null`, never a truthiness check.

## Phases

Work these in order. Do not start a phase before the previous one's gate passes.

| Phase | Work                                            | Gate                                     |
| ----- | ----------------------------------------------- | ---------------------------------------- |
| **1** | Scaffold — [`01-scaffold.md`](./01-scaffold.md) | `npm run dev` serves a blank styled page |
| **2** | Logic — [`02-state.md`](./02-state.md)          | The `unit` Vitest project is green       |
| **3** | UI — [`03-ui.md`](./03-ui.md)                   | The `browser` Vitest project is green    |
| **4** | PWA + docs — [`04-pwa.md`](./04-pwa.md)         | `npm run test:pwa` passes                |

Commit at the end of each phase, not once at the end.

## Verification

Every gate must pass:

```bash
npm ci
npm run lint          # prettier --check . && eslint .
npm run check         # tsc -b --noEmit
npm test              # both Vitest projects
npm run build         # → dist/
npm run test:pwa      # real build, real Chromium, real offline
```

Then by hand, with `npm run dev`:

1. **Cold start** shows the empty "Add Players" card in **dark** theme with no flash, and
   **no table at all**.
2. Add two players. Score `Fives` with 3 dice → the cell reads `15`, Upper Total `15`,
   Grand Total `15`.
3. Score the upper section to exactly **62** → Bonus shows `0`. Add one more point → Bonus
   shows `35` and the Grand Total jumps by 36.
4. Open a scored category → **Erase score** is offered. Erase → the cell returns to its
   empty state and the totals roll back.
5. Open `two-pairs`, pick only the first column → nothing submits. Pick the second → submits
   and closes.
6. Open `chance`, add four dice → nothing submits. Add a fifth → submits the sum.
7. Open `three-of-a-kind` → **None** scores `0` (not `3`), and the value-5 row scores `18`.
8. Reset → the confirmation appears. Cancel leaves the board intact; confirm empties it.
9. Switch to Deutsch → every string changes and `<html lang="de">`. Reload → still German.
10. Toggle to light → reload → still light, with no dark flash and a light browser
    theme-colour.
11. **Old-save compatibility.** Seed `localStorage['yahtzee:v1']` with a payload written by
    the Svelte version and reload. It must load intact.
12. Narrow the window to 375 px: the category column stays pinned while player columns
    scroll horizontally, and every score cell is still comfortably tappable.
13. **Keyboard only:** Tab reaches every score cell, Enter opens the dialog, focus is
    trapped inside it, Escape closes it and focus returns to the cell that opened it.
14. DevTools → Application → **Offline**, then reload: the board renders, accepts a new
    player, and that player survives another offline reload.

## Ground rules

- `src/lib/scoring.ts` is the only place scoring maths lives. Keep it pure.
- If the house rules ever change, `scoring.test.ts` and the table in `README.md` change in
  the same commit. That is a standing repo rule.
- Run `npm run lint && npm run check && npm test` before pushing. CI runs the same, plus the
  PWA check.
- Do not open a pull request unless asked.
