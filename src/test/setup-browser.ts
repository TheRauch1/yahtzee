import { afterEach, beforeEach } from 'vitest';
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

afterEach(cleanup);
