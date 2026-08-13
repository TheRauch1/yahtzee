export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'yahtzee:theme';
export const DEFAULT_THEME: Theme = 'dark';

/**
 * Kept in sync with the --background values for :root and .dark in src/index.css
 * (oklch(1 0 0) and oklch(0.145 0 0) respectively, converted to sRGB).
 */
export const THEME_COLORS: Record<Theme, string> = {
	dark: '#0a0a0a',
	light: '#ffffff'
};

function readAppliedTheme(): Theme {
	if (typeof document === 'undefined') return DEFAULT_THEME;

	// The inline script in index.html has already applied the class before first
	// paint, so the DOM is the source of truth here and the two can never disagree.
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export interface ThemeStore {
	subscribe(listener: () => void): () => void;
	getSnapshot(): Theme;
	set(theme: Theme): void;
	toggle(): void;
}

function createThemeStore(): ThemeStore {
	let current: Theme = readAppliedTheme();
	const listeners = new Set<() => void>();

	function set(theme: Theme): void {
		current = theme;

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
		set,
		toggle() {
			set(current === 'dark' ? 'light' : 'dark');
		}
	};
}

export const themeStore = createThemeStore();
