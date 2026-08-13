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

const STICKY_LABEL_CELL = 'sticky left-0 z-20 border-r bg-background font-semibold';

export function ScoreTable({ players, onOpenCell }: ScoreTableProps) {
	const t = useTranslation();

	function categoryRow(category: ScoringCategory) {
		return (
			<TableRow key={category}>
				<TableCell className={STICKY_LABEL_CELL}>{t.categories[category]}</TableCell>
				{players.map((player) => (
					<TableCell key={player.id} className="border-r p-0 text-center last:border-r-0">
						<ScoreCell category={category} player={player} onOpen={onOpenCell} />
					</TableCell>
				))}
			</TableRow>
		);
	}

	function totalRow(label: string, value: (player: Player) => number) {
		return (
			<TableRow className="bg-muted/40">
				<TableCell className={cn(STICKY_LABEL_CELL, 'bg-muted/40')}>{label}</TableCell>
				{players.map((player) => (
					<TableCell
						key={player.id}
						className="border-r text-center font-semibold tabular-nums last:border-r-0"
					>
						{value(player)}
					</TableCell>
				))}
			</TableRow>
		);
	}

	return (
		<div className="overflow-hidden rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="sticky top-0 left-0 z-30 border-r bg-background">
							{t.scoreboard.categoryHeader}
						</TableHead>
						{players.map((player) => (
							<TableHead
								key={player.id}
								className="sticky top-0 z-10 border-r bg-background text-center last:border-r-0"
							>
								{player.name}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{UPPER_CATEGORIES.map(categoryRow)}
					{totalRow(t.scoreboard.upperTotal, upperTotal)}

					<TableRow className="border-b-2 border-primary/40">
						<TableCell className={STICKY_LABEL_CELL}>
							{t.scoreboard.bonus(UPPER_BONUS_THRESHOLD)}
						</TableCell>
						{players.map((player) => {
							const bonus = upperBonus(player);
							return (
								<TableCell key={player.id} className="border-r text-center last:border-r-0">
									{bonus > 0 ? (
										<Badge variant="secondary">{bonus}</Badge>
									) : (
										<span className="text-muted-foreground tabular-nums">0</span>
									)}
								</TableCell>
							);
						})}
					</TableRow>

					{LOWER_CATEGORIES.map(categoryRow)}
					{totalRow(t.scoreboard.lowerTotal, lowerTotal)}

					<TableRow className="border-t-2 border-primary/40">
						<TableCell className={cn(STICKY_LABEL_CELL, 'text-lg font-bold')}>
							{t.scoreboard.grandTotal}
						</TableCell>
						{players.map((player) => (
							<TableCell
								key={player.id}
								className="border-r text-center text-lg font-bold tabular-nums last:border-r-0"
							>
								{grandTotal(player)}
							</TableCell>
						))}
					</TableRow>
				</TableBody>
			</Table>
		</div>
	);
}
