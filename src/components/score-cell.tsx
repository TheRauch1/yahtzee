import { useTranslation } from '@/hooks/use-locale';
import type { Player, ScoringCategory } from '@/lib/types';

interface ScoreCellProps {
	category: ScoringCategory;
	player: Player;
	onOpen: (category: ScoringCategory, playerId: string) => void;
}

export function ScoreCell({ category, player, onOpen }: ScoreCellProps) {
	const t = useTranslation();
	const score = player.scores[category];

	return (
		<button
			type="button"
			className="group min-h-12 w-full px-4 py-3 text-center transition-colors hover:bg-accent focus-visible:bg-accent"
			aria-label={t.scoreboard.scoreFor(t.categories[category], player.name)}
			onClick={() => onOpen(category, player.id)}
		>
			{score !== null ? (
				<span className="font-medium tabular-nums">{score}</span>
			) : (
				<>
					<span className="text-muted-foreground group-hover:hidden group-focus-visible:hidden">
						–
					</span>
					<span className="hidden text-sm font-medium text-primary group-hover:inline group-focus-visible:inline">
						{t.scoreboard.clickToScore}
					</span>
				</>
			)}
		</button>
	);
}
