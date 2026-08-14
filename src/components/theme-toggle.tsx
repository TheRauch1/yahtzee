import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-locale';
import { themeStore } from '@/lib/theme-store';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
	const theme = useTheme();
	const t = useTranslation();
	const isDark = theme === 'dark';

	return (
		<Button
			variant="ghost"
			size="icon"
			aria-pressed={isDark}
			aria-label={isDark ? t.scoreboard.lightMode : t.scoreboard.darkMode}
			onClick={() => themeStore.toggle()}
		>
			{isDark ? <Sun /> : <Moon />}
		</Button>
	);
}
