# Yahtzee

A small, local-first Yahtzee scorekeeper built with React, TypeScript and Vite. Track scores, manage multiple players, and persist games in localStorage.

This README covers how to run the app locally, the project's structure, and quick notes for contributors.

## Features
- Full Yahtzee scoring categories (Ones → Sixes, Pair, Two Pairs, 3/4 of a kind, Full House, Small/Large Straight, Yahtzee, Chance)
- Interactive modal to select score values, plus keyboard accessibility
- Local storage persistence per player
- Multiple-player support via the UI
- Small, dependency-light React + Vite setup for fast development

## Demo / Quick start

Prerequisites: Node.js 18+ and a POSIX shell (this repo was developed on macOS).

Install dependencies:

```bash
npm install
```

Run the dev server with hot reload:

```bash
npm run dev
```

Open your browser at the address printed by Vite (usually http://localhost:5173).

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project structure

- `src/` — application source
  - `main.tsx` — app entry
  - `App.tsx` — top-level app component and routes
  - `components/` — UI components (ScoreCard, Dice, PlayersTable, Modal, etc.)
  - `utils/score.ts` — score logic and category definitions
- `public/` — static assets
- `vite.config.ts`, `tsconfig.*.json` — build and TypeScript configs

## How scoring works (notes for users)
- Most categories present a small list of reasonable scoring options in a modal. For example, the Yahtzee category provides a single 50-point option when selected.
- The upper section subtotal and bonus (35 points when subtotal ≥ 63) are computed automatically.
- Scores persist to `localStorage`. Clearing scores in the UI removes persisted state for the current player.

## Development notes for contributors
- TypeScript is used across the codebase. Run the type-check/build with:

```bash
npm run build
```

- Linting:

```bash
npm run lint
```

- If you add tests, keep them small and fast. There are currently no automated tests in the repo.

Common small improvements you could contribute:
- Add unit tests for `src/utils/score.ts` (scoring functions)
- Improve accessibility and keyboard flows in the modals
- Add export/import of score sheets

## Troubleshooting
- If scores disappear between sessions, confirm your browser allows localStorage for the site.
- If the dev server fails to start, ensure your Node version matches the project's requirements and that dependencies installed successfully.

## License
No license file is included in this repository. Add a `LICENSE` file if you want to specify reuse terms.

---

If you'd like, I can also:
- add a short screenshot or GIF to the README, or
- add a `CONTRIBUTING.md` and a simple unit test for `utils/score.ts`.
