// A tombstone for the service worker the SvelteKit build used to ship at this
// URL. Do not delete it, and do not let it 404.
//
// SvelteKit compiled src/service-worker.ts to /service-worker.js and registered
// it for scope '/'. That worker precached the app shell and answered
// navigations cache-first, so every browser that installed it still has a copy
// of the Svelte build and serves it without ever asking the network. The React
// build registers /sw.js instead — but the code that would register it lives in
// an index.html the old worker never fetches. Nothing shipped in the app can
// break that loop, because the browser only re-checks the script URL it
// originally registered, which is this one.
//
// A failed update check is not an unregistration: the spec leaves the existing
// worker in place when the script 404s or comes back with the wrong MIME type
// (w3c/ServiceWorker#204 proposed changing that and it never landed). Cloudflare
// Pages answers an unmatched path with index.html, so before this file existed
// the update check got text/html and gave up. That is why the old app stuck.
//
// Classic script, not a module: SvelteKit registered this URL with
// { type: 'classic' }.

self.addEventListener('install', () => {
	// The clients waiting behind the old worker are exactly the ones that need
	// rescuing, so do not wait for them to go away.
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// Take the old worker's clients before unregistering, so the reload
			// below is answered by the network rather than out of its cache. This
			// worker has no fetch handler, so claimed pages just pass through.
			await self.clients.claim();

			await self.registration.unregister();

			// Every cache: the old `yahtzee-cache-<version>`, plus any Workbox
			// precache a half-updated client managed to pick up.
			const keys = await caches.keys();
			await Promise.all(keys.map((key) => caches.delete(key)));

			// Turn a stale tab into a fresh one now instead of on the next visit.
			// If navigate() is unavailable or refused, the registration is gone
			// either way and the next load comes from the network.
			const windows = await self.clients.matchAll({ type: 'window' });
			await Promise.all(windows.map((client) => client.navigate(client.url).catch(() => {})));
		})()
	);
});
