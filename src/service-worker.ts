/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { base, build, files, prerendered, version } from '$service-worker';

// `self` is a ServiceWorkerGlobalScope here, but TypeScript types it as Window.
const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = `yahtzee-cache-${version}`;

/**
 * Everything this app needs to run. The scoreboard is entirely client-side and
 * talks to no API, so the full asset set can be precached and served cache-first.
 *
 * Deduplicated because `prerendered` already contains the root path, and
 * `cache.addAll()` rejects with InvalidStateError if a URL appears twice.
 */
const PRECACHE_URLS = [...new Set([...build, ...files, ...prerendered, `${base}/`])];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
			)
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const request = event.request;

	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== location.origin) return;

	event.respondWith(respond(request, url));
});

async function respond(request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(CACHE_NAME);

	// Immutable build artefacts and static files never change within a version.
	const isPrecached = PRECACHE_URLS.includes(url.pathname);
	if (isPrecached) {
		const cached = await cache.match(url.pathname);
		if (cached) return cached;
	}

	try {
		const response = await fetch(request);

		// `fetch` on an opaque/error response must not be cached.
		if (response.status === 200 && response.type === 'basic') {
			cache.put(request, response.clone());
		}

		return response;
	} catch {
		const cached = await cache.match(request);
		if (cached) return cached;

		// A navigation that missed the cache still gets the app shell, so the
		// scoreboard opens offline no matter which URL was used to launch it.
		if (request.mode === 'navigate') {
			const shell = await cache.match(`${base}/`);
			if (shell) return shell;
		}

		throw new Error('Offline and no cached response available');
	}
}
