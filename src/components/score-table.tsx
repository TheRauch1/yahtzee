import { ScoreCell } from '@/components/score-cell';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-locale';
import {
	UPPER_BONUS_THRESHOLD,
	grandTotal,
	lowerTotal,
	upperBonus,
	upperTotal
} from '@/lib/scoring';
import type { Player, ScoringCategory } from '@/lib/types';
import { LOWER_CATEGORIES, UPPER_CATEGORIES } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ScoreTableProps {
	players: readonly Player[];
	onOpenCell: (category: ScoringCategory, playerId: string) => void;
}

// The category column is pinned, so player columns scroll under it once they stop
// fitting. Both widths are fixed rather than content-derived: with `table-auto` a
// long category name or a three-digit score silently rewrites the whole layout.
const LABEL_WIDTH = '8rem';
const MIN_PLAYER_WIDTH = '4.5rem';

// Every row's first cell. Padding matches the header so labels line up with it.
// Labels are a size down from the scores and may wrap: German runs long
// ("Bonus (63+ Punkte)"), and a clipped row label is worse than a two-line one.
const LABEL_CELL =
	'sticky left-0 z-20 border-r bg-background px-3 text-left text-xs leading-tight whitespace-normal';
const VALUE_CELL = 'border-r text-center tabular-nums last:border-r-0';

export function ScoreTable({ players, onOpenCell }: ScoreTableProps) {
	const t = useTranslation();

	// Below this the table scrolls sideways instead of crushing the columns.
	const minWidth = `calc(${LABEL_WIDTH} + ${players.length} * ${MIN_PLAYER_WIDTH})`;

	function categoryRow(category: ScoringCategory) {
		return (
			<TableRow key={category}>
				<TableCell className={cn(LABEL_CELL, 'font-medium')}>{t.categories[category]}</TableCell>
				{players.map((player) => (
					<TableCell key={player.id} className={cn(VALUE_CELL, 'p-0')}>
						<ScoreCell category={category} player={player} onOpen={onOpenCell} />
					</TableCell>
				))}
			</TableRow>
		);
	}

	// Emphasis lands on the row and the numbers, never on the label: bumping the
	// label's size is what pushes a long German string out of the fixed column.
	function totalRow(
		label: string,
		value: (player: Player) => number,
		options: { rowClass?: string; valueClass?: string } = {}
	) {
		return (
			<TableRow className={cn('h-10 bg-muted/40', options.rowClass)}>
				<TableCell className={cn(LABEL_CELL, 'bg-muted/40 font-semibold')}>{label}</TableCell>
				{players.map((player) => (
					<TableCell
						key={player.id}
						className={cn(VALUE_CELL, 'font-semibold', options.valueClass)}
					>
						{value(player)}
					</TableCell>
				))}
			</TableRow>
		);
	}

	// The outer div clips the table to the rounded border; Table's own wrapper
	// is what actually scrolls sideways.
	return (
		<div className="overflow-hidden rounded-lg border">
			<Table className="table-fixed" style={{ minWidth }}>
				<TableHeader>
					<TableRow className="h-11">
						<TableHead
							className={cn(LABEL_CELL, 'z-30 font-semibold')}
							style={{ width: LABEL_WIDTH }}
						>
							{t.scoreboard.categoryHeader}
						</TableHead>
						{players.map((player) => (
							<TableHead
								key={player.id}
								className="truncate border-r px-2 text-center font-semibold last:border-r-0"
							>
								{player.name}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{UPPER_CATEGORIES.map(categoryRow)}
					{totalRow(t.scoreboard.upperTotal, upperTotal)}

					<TableRow className="h-10 border-b-2 border-primary/40 bg-muted/40">
						<TableCell className={cn(LABEL_CELL, 'bg-muted/40 font-semibold')}>
							{t.scoreboard.bonus(UPPER_BONUS_THRESHOLD)}
						</TableCell>
						{players.map((player) => {
							const bonus = upperBonus(player);
							return (
								<TableCell key={player.id} className={VALUE_CELL}>
									{bonus > 0 ? (
										<Badge variant="secondary">{bonus}</Badge>
									) : (
										<span className="text-muted-foreground">0</span>
									)}
								</TableCell>
							);
						})}
					</TableRow>

					{LOWER_CATEGORIES.map(categoryRow)}
					{totalRow(t.scoreboard.lowerTotal, lowerTotal)}
					{totalRow(t.scoreboard.grandTotal, grandTotal, {
						rowClass: 'border-t-2 border-primary/40',
						valueClass: 'text-base font-bold'
					})}
				</TableBody>
			</Table>
		</div>
	);
}
