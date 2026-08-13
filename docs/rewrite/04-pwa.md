# Phase 4 — PWA, deployment and docs

**Gate: `npm run test:pwa` passes against a real build.**

The old service worker was hand-written against SvelteKit's `$service-worker` module
(`build`, `files`, `prerendered`, `version`), which does not exist here. Replace it with
`vite-plugin-pwa`.

---

## Strategy: `generateSW`, not `injectManifest`

`injectManifest` is for custom runtime logic — push, background sync, bespoke routing. This
app has none. The old worker did precache-all + cache-first + network-with-cache-fallback +
navigation fallback, which is `generateSW`'s default behaviour plus two options.

Hand-rolling the precache list is also precisely the code that already broke once: the
original had to deduplicate its URLs because `cache.addAll()` rejects with
`InvalidStateError` when a URL appears twice. Workbox computes the manifest from the real
build output, with revisions, and dedupes it.

---

## Configuration

The manifest **moves into the plugin config** and `static/manifest.webmanifest` is deleted.
The plugin emits it, injects `<link rel="manifest">` into `index.html`, precaches it with a
revision, and validates its shape — one source of truth alongside `theme_color` and the
`<meta name="theme-color">`.

Icons stay in `public/icons/` and are picked up by `includeAssets` and `globPatterns`.

```ts
VitePWA({
	registerType: 'autoUpdate',
	injectRegister: null, // registered explicitly in main.tsx so it is greppable
	includeAssets: ['icons/*.png', 'icons/*.svg', 'robots.txt'],
	manifest: {
		name: 'Yahtzee Scoreboard',
		short_name: 'Yahtzee',
		description:
			'A local-first Yahtzee scorekeeper. Track scores for multiple players, online or off.',
		id: '/',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		orientation: 'portrait-primary',
		background_color: '#0b1220',
		theme_color: '#0b1220',
		categories: ['games', 'utilities'],
		icons: [
			{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
			{
				src: '/icons/icon-maskable-512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable'
			},
			{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
		]
	},
	workbox: {
		globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,txt}'],
		// Replaces the hand-written "app shell for navigations" branch.
		navigateFallback: '/index.html',
		cleanupOutdatedCaches: true,
		clientsClaim: true,
		skipWaiting: true
	},
	// A service worker in dev caches stale modules and makes HMR lie.
	devOptions: { enabled: false }
});
```

Keep **every manifest field exactly as it is today**, including all four icon entries and
especially the **maskable** one — `verify-pwa.mjs` asserts a maskable icon exists.

`clientsClaim` + `skipWaiting` reproduce the old worker's `sw.skipWaiting()` and
`sw.clients.claim()` exactly.

Registration lives in `main.tsx` (see [`01-scaffold.md`](./01-scaffold.md#5-entry-files)),
and `src/vite-env.d.ts` needs `/// <reference types="vite-plugin-pwa/client" />`.

**Guard the plugin out of Vitest** — see [`01-scaffold.md`](./01-scaffold.md#4-viteconfigts).
A service worker inside the browser-test harness intercepts the test page's own requests and
serves stale modules between runs.

---

## `scripts/verify-pwa.mjs`

Keep the script and all seven of its checks. Five edits, and **three of them are not
obvious** — miss them and CI fails on a working build.

1. **`const ROOT = 'dist';`** (was `.svelte-kit/cloudflare`). The server's
   `path.endsWith('/') → index.html` rule already handles `/`, so nothing else in the static
   server changes.

2. **The `'app shell precached'` assertion breaks.** Workbox precaches `/index.html`, not
   `/`. Change:

   ```js
   check('app shell precached', !!cacheInfo.urls?.includes('/'), '/');
   // →
   check('app shell precached', !!cacheInfo.urls?.includes('/index.html'), '/index.html');
   ```

3. **The cache-name lookup breaks.** The script opens `keys[0]`, assuming a single cache named
   `yahtzee-cache-${version}`. Workbox creates `workbox-precache-v2-<origin>` and may create
   runtime caches alongside it. Change the lookup to
   `keys.find((key) => key.includes('workbox-precache'))`.

4. **Add a `navigateFallback` assertion** while you are in there: after going offline,
   `page.goto(origin + '/')` still resolves and renders.

5. The offline-interaction step fills `input[type="text"]` and clicks `button[type="submit"]`.
   Both still exist with the shadcn `Input` and `Button` — verify after the form is built.

Everything else is unchanged, because the React UI keeps the same `<h1>` text and the same
text input. **Keep `"Yahtzee Scoreboard"` as the English `scoreboard.title`** — the script
asserts on it exactly.

The seven checks, for reference: manifest parses; a maskable icon is present; all declared
icons resolve 200; the service worker activates; the precache is populated; the app shell is
precached; and, offline, a reload still renders, still accepts a new player, and that player
survives another offline reload.

---

## Deployment

Unchanged in kind. `dist/` is a directory of static assets, exactly as
`.svelte-kit/cloudflare` was.

There is no `wrangler.toml` in the repo — the Cloudflare Pages project is wired up in the
dashboard, outside version control. **The only thing that changes is the build output
directory**, from `.svelte-kit/cloudflare` to `dist`. Whoever owns the Cloudflare project
needs to update that setting; note it in the README and mention it when reporting the work.

The `@sveltejs/adapter-cloudflare` dependency goes away with everything else Svelte.

---

## README

Rewrite `README.md` for the new stack:

- The stack line: SvelteKit/Svelte 5 → Vite + React 19 + shadcn/ui.
- The project-structure block → the tree from [`01-scaffold.md`](./01-scaffold.md#target-tree).
- The scripts table → the new scripts, including `check` now being `tsc -b --noEmit`.
- The testing section → the `unit` / `browser` project names and the new file-naming
  convention.
- The PWA section → `vite-plugin-pwa` instead of a hand-written worker.
- The deployment section → `dist` instead of `.svelte-kit/cloudflare`.
- The contributing notes → keep them, adjusting the `npm run check` description.

**Keep the house-rules table verbatim.** It is the single most important paragraph in the
repo, and the contributing notes bind it to `scoring.test.ts` in the same commit.

Keep the `PLAYWRIGHT_CHROMIUM_EXECUTABLE` documentation — it still applies.

---

## Gate

```bash
npm run build
npm run test:pwa
```

All seven checks pass, and step 14 of the manual checklist in
[`README.md`](./README.md#verification) — the DevTools offline reload — works. Commit.
