import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = '.svelte-kit/cloudflare';
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

const server = createServer(async (req, res) => {
	let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
	if (path.endsWith('/')) path += 'index.html';

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

const browser = await chromium.launch();
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

// 4. The precache actually populated (this is what the addAll() dedupe bug broke)
const cacheInfo = await page.evaluate(async () => {
	const keys = await caches.keys();
	if (!keys.length) return { keys, count: 0 };
	const cache = await caches.open(keys[0]);
	const reqs = await cache.keys();
	return { keys, count: reqs.length, urls: reqs.map((r) => new URL(r.url).pathname) };
});
check(
	'precache populated',
	cacheInfo.count > 0,
	`${cacheInfo.count} entries in ${cacheInfo.keys[0]}`
);
check('app shell precached', !!cacheInfo.urls?.includes('/'), '/');

// 5. The real test: go offline and reload
await context.setOffline(true);
await page.reload({ waitUntil: 'load' });

const offlineHeading = await page.textContent('h1').catch(() => null);
check('app renders offline after reload', offlineHeading === 'Yahtzee Scoreboard', offlineHeading);

// 6. And is still interactive offline
await page.fill('input[type="text"]', 'Offline Player');
await page.click('button[type="submit"]');
const playerVisible = await page
	.locator('th', { hasText: 'Offline Player' })
	.count()
	.catch(() => 0);
check('can add a player while offline', playerVisible > 0);

// 7. State survives a reload (still offline)
await page.reload({ waitUntil: 'load' });
const persisted = await page.locator('th', { hasText: 'Offline Player' }).count();
check('game state persists across reload', persisted > 0);

await context.setOffline(false);
await browser.close();
server.close();

console.log(problems.length ? `\n${problems.length} FAILURES` : '\nAll PWA checks passed');
process.exit(problems.length ? 1 : 0);
