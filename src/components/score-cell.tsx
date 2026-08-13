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
			// Fills the cell so the whole thing is tappable, and never changes width
			// with its own state: an empty cell and a scored one occupy the same box.
			// The accessible name carries the "score X for Y" wording on its own.
			// The ring is inset because the table clips to a rounded border; an
			// outset ring on an edge cell would be cropped. Matches Button's focus
			// treatment otherwise.
			className="h-12 w-full px-2 text-center tabular-nums transition-colors outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
			aria-label={t.scoreboard.scoreFor(t.categories[category], player.name)}
			onClick={() => onOpen(category, player.id)}
		>
			{score !== null ? (
				<span className="font-medium">{score}</span>
			) : (
				<span className="text-muted-foreground">–</span>
			)}
		</button>
	);
}
