import { useSyncExternalStore } from 'react';
import { themeStore, type Theme } from '@/lib/theme-store';

export function useTheme(): Theme {
	return useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot);
}
