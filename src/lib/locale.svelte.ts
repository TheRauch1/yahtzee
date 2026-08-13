import { LOCALES, translations, type Locale } from './translations';

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

class LocaleState {
	current = $state<Locale>(readStoredLocale());

	get t() {
		return translations[this.current];
	}

	set(locale: Locale) {
		this.current = locale;

		if (typeof document !== 'undefined') {
			document.documentElement.lang = locale;
		}

		try {
			localStorage?.setItem(LOCALE_STORAGE_KEY, locale);
		} catch {
			// Blocked storage just means the preference does not survive a reload.
		}
	}
}

export const locale = new LocaleState();

if (typeof document !== 'undefined') {
	document.documentElement.lang = locale.current;
}
