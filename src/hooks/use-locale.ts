import { useSyncExternalStore } from 'react';
import { localeStore } from '@/lib/locale-store';
import { translations, type Locale, type Translation } from '@/lib/translations';

export function useLocale(): Locale {
	return useSyncExternalStore(localeStore.subscribe, localeStore.getSnapshot);
}

export function useTranslation(): Translation {
	return translations[useLocale()];
}
