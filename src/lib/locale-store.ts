import { LOCALES, type Locale } from './translations';

export const LOCALE_STORAGE_KEY = 'yahtzee:locale';
export const DEFAULT_LOCALE: Locale = 'en';

function readStoredLocale(): Locale {
	if (typeof localStorage === 'undefined') return DEFAULT_LOCALE;

	try {
		const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
		return (LOCALES as string[]).includes(stored ?? '') ? (stored as Locale) : DEFAULT_LOCALE;
	} catch {
		return DEFAULT_LOCALE;
	}
}

export interface LocaleStore {
	subscribe(listener: () => void): () => void;
	getSnapshot(): Locale;
	set(locale: Locale): void;
}

function createLocaleStore(): LocaleStore {
	let current: Locale = readStoredLocale();
	const listeners = new Set<() => void>();

	function set(locale: Locale): void {
		current = locale;

		// The inline script in index.html applies the stored language before
		// first paint, so this only has to keep the attribute honest afterward.
		if (typeof document !== 'undefined') {
			document.documentElement.lang = locale;
		}

		try {
			localStorage?.setItem(LOCALE_STORAGE_KEY, locale);
		} catch {
			// Blocked storage just means the preference does not survive a reload.
		}

		for (const listener of listeners) listener();
	}

	return {
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		getSnapshot: () => current,
		set
	};
}

export const localeStore = createLocaleStore();
