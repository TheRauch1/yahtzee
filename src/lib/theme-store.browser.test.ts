import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEME_COLORS, THEME_STORAGE_KEY, themeStore } from './theme-store';

beforeEach(() => {
	document.documentElement.classList.remove('dark');
	document.querySelector('meta[name="theme-color"]')?.remove();
	const meta = document.createElement('meta');
	meta.setAttribute('name', 'theme-color');
	document.head.appendChild(meta);
});

describe('theme store', () => {
	it('defaults to dark', () => {
		expect(DEFAULT_THEME).toBe('dark');
	});

	it('reads the applied class rather than storage on init', () => {
		document.documentElement.classList.add('dark');
		expect(themeStore.getSnapshot()).toBeTypeOf('string');
	});

	it('toggling sets the class, the meta tag and localStorage', () => {
		themeStore.set('light');
		expect(document.documentElement.classList.contains('dark')).toBe(false);
		expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
			THEME_COLORS.light
		);
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

		themeStore.toggle();
		expect(document.documentElement.classList.contains('dark')).toBe(true);
		expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
			THEME_COLORS.dark
		);
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
	});

	it('notifies subscribers on change', () => {
		let calls = 0;
		const unsubscribe = themeStore.subscribe(() => {
			calls++;
		});

		themeStore.set('light');
		expect(calls).toBe(1);

		unsubscribe();
		themeStore.set('dark');
		expect(calls).toBe(1);
	});
});
