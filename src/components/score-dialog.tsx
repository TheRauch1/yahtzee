import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScorePicker } from '@/components/score-picker';
import type { ScoringCategory } from '@/lib/types';

export interface ScoreDialogSelection {
	category: ScoringCategory;
	playerId: string;
}

interface ScoreDialogProps {
	selected: ScoreDialogSelection | null;
	current: number | null;
	onScore: (score: number) => void;
	onErase: () => void;
	onClose: () => void;
}

export function ScoreDialog({ selected, current, onScore, onErase, onClose }: ScoreDialogProps) {
	return (
		<Dialog open={selected !== null} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
				{selected && (
					<ScorePicker
						// Player + category keys the whole picker, so its local pick
						// state (two-pairs halves, the chance dice buffer, ...) resets
						// the same way the old native <dialog> did on unmount, instead
						// of surviving across opens the way an always-mounted Dialog would.
						key={`${selected.playerId}:${selected.category}`}
						category={selected.category}
						current={current}
						onScore={onScore}
						onErase={onErase}
						onClose={onClose}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
