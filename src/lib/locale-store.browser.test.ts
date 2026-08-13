import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, localeStore } from './locale-store';

describe('locale store', () => {
	it('defaults to English', () => {
		expect(DEFAULT_LOCALE).toBe('en');
	});

	it('switching sets document.lang and localStorage', () => {
		localeStore.set('de');
		expect(document.documentElement.lang).toBe('de');
		expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('de');

		localeStore.set('en');
		expect(document.documentElement.lang).toBe('en');
		expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
	});

	it('notifies subscribers on change', () => {
		let calls = 0;
		const unsubscribe = localeStore.subscribe(() => {
			calls++;
		});

		localeStore.set('de');
		expect(calls).toBe(1);

		unsubscribe();
		localeStore.set('en');
		expect(calls).toBe(1);
	});
});
