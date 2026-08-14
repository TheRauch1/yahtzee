import { useLocale, useTranslation } from '@/hooks/use-locale';
import { localeStore } from '@/lib/locale-store';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/translations';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export function LanguageSwitcher() {
	const locale = useLocale();
	const t = useTranslation();

	return (
		<NativeSelect
			value={locale}
			onChange={(event) => localeStore.set(event.target.value as Locale)}
			aria-label={t.language.switchLabel}
		>
			{LOCALES.map((code) => (
				<NativeSelectOption key={code} value={code}>
					{LOCALE_LABELS[code]}
				</NativeSelectOption>
			))}
		</NativeSelect>
	);
}
