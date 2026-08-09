export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'yahtzee:theme';
export const DEFAULT_THEME: Theme = 'dark';

/** Kept in sync with the --bg values in app.css. */
export const THEME_COLORS: Record<Theme, string> = {
	dark: '#0b1220',
	light: '#f8fafc'
};

function readStoredTheme(): Theme {
	if (typeof document === 'undefined') return DEFAULT_THEME;

	// The inline script in app.html has already applied the class before first paint,
	// so the DOM is the source of truth here and the two can never disagree.
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

class ThemeState {
	current = $state<Theme>(readStoredTheme());

	get isDark() {
		return this.current === 'dark';
	}

	toggle() {
		this.set(this.current === 'dark' ? 'light' : 'dark');
	}

	set(theme: Theme) {
		this.current = theme;

		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', theme === 'dark');
			document
				.querySelector('meta[name="theme-color"]')
				?.setAttribute('content', THEME_COLORS[theme]);
		}

		try {
			localStorage?.setItem(THEME_STORAGE_KEY, theme);
		} catch {
			// Blocked storage just means the preference does not survive a reload.
		}
	}
}

export const theme = new ThemeState();
