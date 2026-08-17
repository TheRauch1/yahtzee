import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = 'dist';
const TYPES = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.webmanifest': 'application/manifest+json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.txt': 'text/plain'
};

// An in-scope page that registers nothing and loads nothing. The tombstone
// check below needs a client the service worker can claim and reload without
// that reload re-registering /sw.js and refilling the caches it just wiped.
const BLANK = '/__pwa-test-blank.html';

// Fixtures for the migration test at the end, which replays the deployment that
// broke: a SvelteKit-shaped worker at /service-worker.js, then the React build
// at the same origin. `mode` swaps what the origin serves.
//   'react'          — dist/, as deployed
//   'svelte'         — the old build and the old worker
//   'react-no-tomb'  — dist/, but /service-worker.js answers the way Cloudflare
//                      Pages answers an unmatched path: index.html, 200,
//                      text/html. This is the bug, reproduced.
let mode = 'react';

// The inline register() stands in for SvelteKit's client runtime, which called
// it on every load. It matters that the fixture keeps doing so: this shell is
// what the old worker serves from its cache after the new build is deployed.
const SVELTE_SHELL = `<!doctype html><title>Yahtzee</title><h1>Old Svelte build</h1>
<script>navigator.serviceWorker.register('/service-worker.js', { type: 'classic' });</script>`;

// The parts of the deleted src/service-worker.ts that caused the trap: precache
// the shell on install, then answer it from the cache without asking the network.
const SVELTE_SW = `
const CACHE = 'yahtzee-cache-1';
const PRECACHE = ['/'];
self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== location.origin) return;
	event.respondWith((async () => {
		const cache = await caches.open(CACHE);
		if (PRECACHE.includes(url.pathname)) {
			const hit = await cache.match(url.pathname);
			if (hit) return hit;
		}
		if (event.request.mode === 'navigate') {
			const shell = await cache.match('/');
			if (shell) return shell;
		}
		return fetch(event.request);
	})());
});
`;

const send = (res, body, type) => {
	res.writeHead(200, { 'content-type': type });
	res.end(body);
};

const server = createServer(async (req, res) => {
	let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
	if (path.endsWith('/')) path += 'index.html';

	if (path === BLANK) return send(res, '<!doctype html><title>blank</title>', 'text/html');

	if (mode === 'svelte') {
		if (path === '/index.html') return send(res, SVELTE_SHELL, 'text/html');
		if (path === '/service-worker.js') return send(res, SVELTE_SW, 'text/javascript');
	}

	if (mode === 'react-no-tomb' && path === '/service-worker.js') {
		return send(res, await readFile(join(ROOT, 'index.html')), 'text/html');
	}

	const file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''));

	try {
		await stat(file);
		const body = await readFile(file);
		res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
		res.end(body);
	} catch {
		res.writeHead(404, { 'content-type': 'text/plain' });
		res.end('Not found');
	}
});

await new Promise((resolve) => server.listen(4173, resolve));
const origin = 'http://localhost:4173';

// Same escape hatch as vite.config.ts: a machine with a Chromium already
// installed but not the exact build Playwright asks for (offline, or a
// locked-down egress policy) can point this at the existing binary.
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(
	chromiumExecutable ? { executablePath: chromiumExecutable } : {}
);
const context = await browser.newContext();
const page = await context.newPage();

const problems = [];
const check = (label, ok, detail = '') => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
	if (!ok) problems.push(label);
};

await page.goto(origin, { waitUntil: 'networkidle' });

// 1. Manifest is reachable and well-formed
const manifest = await page.evaluate(async () => {
	const href = document.querySelector('link[rel="manifest"]')?.href;
	if (!href) return null;
	const res = await fetch(href);
	return res.ok ? await res.json() : null;
});
check('manifest loads and parses', !!manifest, manifest?.name);
check(
	'manifest has maskable icon',
	!!manifest?.icons?.some((i) => i.purpose === 'maskable'),
	`${manifest?.icons?.length} icons`
);

// 2. All declared icons actually resolve
const iconResults = await page.evaluate(async (icons) => {
	const out = [];
	for (const icon of icons) {
		const res = await fetch(icon.src);
		out.push({ src: icon.src, status: res.status });
	}
	return out;
}, manifest?.icons ?? []);
check(
	'all manifest icons resolve',
	iconResults.every((r) => r.status === 200),
	iconResults.map((r) => `${r.src}:${r.status}`).join(' ')
);

// 3. Service worker registers and activates
const swState = await page.evaluate(async () => {
	const reg = await navigator.serviceWorker.ready;
	return reg.active?.state ?? 'none';
});
check('service worker activated', swState === 'activated', swState);

// 4. The precache actually populated. Workbox names its cache
// `workbox-precache-v2-<origin>`, not a single fixed key, so find it by
// prefix rather than assuming it is the only (or first) cache.
const cacheInfo = await page.evaluate(async () => {
	const keys = await caches.keys();
	const precacheKey = keys.find((key) => key.includes('workbox-precache'));
	if (!precacheKey) return { keys, count: 0 };
	const cache = await caches.open(precacheKey);
	const reqs = await cache.keys();
	return { keys, precacheKey, count: reqs.length, urls: reqs.map((r) => new URL(r.url).pathname) };
});
check(
	'precache populated',
	cacheInfo.count > 0,
	`${cacheInfo.count} entries in ${cacheInfo.precacheKey}`
);
// Workbox precaches /index.html directly rather than the bare '/' the old
// hand-written service worker used; navigateFallback (checked below) is what
// makes a request for '/' itself work offline.
check('app shell precached', !!cacheInfo.urls?.includes('/index.html'), '/index.html');
// The tombstone is reached only by the browser's own update check, which does
// not consult this worker. Precaching it would be dead weight.
check(
	'tombstone kept out of the precache',
	!cacheInfo.urls?.includes('/service-worker.js'),
	'/service-worker.js'
);

// 5. The real test: go offline and reload
await context.setOffline(true);
await page.reload({ waitUntil: 'load' });

const offlineHeading = await page.textContent('h1').catch(() => null);
check('app renders offline after reload', offlineHeading === 'Yahtzee Scoreboard', offlineHeading);

// 6. Navigating to '/' itself (not just '/index.html') still works offline,
// via Workbox's navigateFallback rather than a precached literal '/' entry.
await page.goto(origin + '/', { waitUntil: 'load' }).catch(() => null);
const rootHeading = await page.textContent('h1').catch(() => null);
check(
	'navigating to / works offline via navigateFallback',
	rootHeading === 'Yahtzee Scoreboard',
	rootHeading
);

// 7. And is still interactive offline
await page.fill('input[type="text"]', 'Offline Player');
await page.click('button[type="submit"]');
const playerVisible = await page
	.locator('th', { hasText: 'Offline Player' })
	.count()
	.catch(() => 0);
check('can add a player while offline', playerVisible > 0);

// 8. State survives a reload (still offline)
await page.reload({ waitUntil: 'load' });
const persisted = await page.locator('th', { hasText: 'Offline Player' }).count();
check('game state persists across reload', persisted > 0);

await context.setOffline(false);

// 9. public/service-worker.js still rescues browsers running the SvelteKit
// worker that used to own that URL. Two things have to hold, and neither is
// visible from the app itself: the URL must answer with JavaScript (Cloudflare
// Pages answers an unmatched path with index.html, and a text/html body fails
// the update check and leaves the old worker installed), and the script must
// actually dismantle whatever is there.
const tombstone = await fetch(`${origin}/service-worker.js`);
const tombstoneType = tombstone.headers.get('content-type') ?? '';
check(
	'/service-worker.js is served as JavaScript',
	tombstone.status === 200 && tombstoneType.includes('javascript'),
	`${tombstone.status} ${tombstoneType}`
);

// A fresh context, so wiping every cache does not undo the checks above.
const staleContext = await browser.newContext();
const stalePage = await staleContext.newPage();
await stalePage.goto(origin + BLANK, { waitUntil: 'load' });

await stalePage.evaluate(async () => {
	// Stand in for the cache the SvelteKit worker left behind.
	const cache = await caches.open('yahtzee-cache-stale');
	await cache.put(
		'/index.html',
		new Response('<h1>Old Svelte build</h1>', { headers: { 'content-type': 'text/html' } })
	);
	await navigator.serviceWorker.register('/service-worker.js');
});

// The tombstone reloads the pages it claims, so an evaluate() can lose its
// execution context mid-flight. Poll through that rather than racing it.
let teardown = null;
const deadline = Date.now() + 15000;
while (Date.now() < deadline) {
	try {
		teardown = await stalePage.evaluate(async () => ({
			registrations: (await navigator.serviceWorker.getRegistrations()).length,
			caches: await caches.keys()
		}));
		if (teardown.registrations === 0 && teardown.caches.length === 0) break;
	} catch {
		// Navigated out from under us — that is the tombstone doing its job.
	}
	await new Promise((resolve) => setTimeout(resolve, 250));
}

check(
	'tombstone unregisters itself',
	teardown?.registrations === 0,
	`${teardown?.registrations ?? '?'} registrations left`
);
check(
	'tombstone deletes every cache',
	teardown?.caches.length === 0,
	`${teardown?.caches.join(' ') || 'none'} left`
);

// 10. The migration itself, end to end: a browser holding the old SvelteKit
// worker, then the React build deployed over it. This is the case the tombstone
// exists for, and the only one that proves it rescues a browser rather than
// merely tearing itself down.
const headingOf = async (page) => {
	const deadline = Date.now() + 20000;
	let heading = null;
	while (Date.now() < deadline) {
		try {
			heading = await page.textContent('h1', { timeout: 1000 });
			if (heading === 'Yahtzee Scoreboard') return heading;
		} catch {
			// Mid-navigation, or no h1 yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	return heading;
};

mode = 'svelte';
const migrationContext = await browser.newContext();
const migrationPage = await migrationContext.newPage();
await migrationPage.goto(origin, { waitUntil: 'load' });
await migrationPage.evaluate(async () => {
	await navigator.serviceWorker.ready;
});
await migrationPage.reload({ waitUntil: 'load' });

const stuckOn = await migrationPage.textContent('h1').catch(() => null);
check('old Svelte worker installed and serving its cache', stuckOn === 'Old Svelte build', stuckOn);

// Deploy React with /service-worker.js unresolved, exactly as Cloudflare Pages
// answered it: the update check gets text/html, fails, and leaves the old worker
// in place. Reloading is not enough to escape — that is the whole bug.
mode = 'react-no-tomb';
await migrationPage.reload({ waitUntil: 'load' });
await migrationPage.reload({ waitUntil: 'load' });
const stillStuck = await migrationPage.textContent('h1').catch(() => null);
check(
	'without the tombstone, reloading cannot escape the old worker',
	stillStuck === 'Old Svelte build',
	stillStuck
);

// Now deploy the tombstone alongside it. One visit is all it should take.
mode = 'react';
// The tombstone navigates this page while it is loading, which cancels the
// reload. That is the fix working, not a failure.
await migrationPage.reload({ waitUntil: 'load' }).catch(() => {});
const rescued = await headingOf(migrationPage);
check(
	'the tombstone rescues a stuck browser in one visit',
	rescued === 'Yahtzee Scoreboard',
	rescued
);

// The rescued page registers /sw.js on load; give it a moment to reach active.
let scripts = [];
const activeDeadline = Date.now() + 10000;
while (Date.now() < activeDeadline) {
	try {
		scripts = await migrationPage.evaluate(async () =>
			(await navigator.serviceWorker.getRegistrations()).map((r) => {
				const worker = r.active ?? r.waiting ?? r.installing;
				return worker ? new URL(worker.scriptURL).pathname : 'pending';
			})
		);
		if (scripts.length === 1 && scripts[0] === '/sw.js') break;
	} catch {
		// Still settling after the tombstone's reload.
	}
	await new Promise((resolve) => setTimeout(resolve, 250));
}
check(
	'the rescued page ends up on the React worker',
	scripts.length === 1 && scripts[0] === '/sw.js',
	scripts.join(' ') || 'none'
);

await browser.close();
server.close();

console.log(problems.length ? `\n${problems.length} FAILURES` : '\nAll PWA checks passed');
process.exit(problems.length ? 1 : 0);
