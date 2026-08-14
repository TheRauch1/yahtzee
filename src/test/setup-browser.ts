import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { gameStore } from '@/lib/game-store';
import { localeStore } from '@/lib/locale-store';
import { themeStore } from '@/lib/theme-store';

beforeEach(() => {
	// The stores load persisted state once, at module import, so clearing
	// storage alone leaves the in-memory snapshot populated. Clear first so
	// storage and memory agree afterwards.
	localStorage.clear();
	gameStore.reset();
	themeStore.set('dark');
	// The locale store is a module singleton, so a test that switches language
	// would otherwise leak German strings into every assertion after it.
	localeStore.set('en');
});

afterEach(async () => {
	await cleanup();

	// A dialog/alert-dialog still mid-close when its test ends leaves Base UI's
	// `[data-base-ui-inert]` backdrop marker in the DOM for the tail of its exit
	// animation, even though the React tree that rendered it has been unmounted.
	// That marker sits over the whole page and swallows every click in whatever
	// test runs next, so wait it out here rather than in each test.
	await vi.waitFor(
		() => {
			if (document.querySelector('[data-base-ui-inert]')) {
				throw new Error('a Base UI inert marker from this test has not cleared yet');
			}
		},
		{ timeout: 1000, interval: 20 }
	);
});
