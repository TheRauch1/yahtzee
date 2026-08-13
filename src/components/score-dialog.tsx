import { useState } from 'react';

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

interface Shown {
	selection: ScoreDialogSelection;
	current: number | null;
}

export function ScoreDialog({ selected, current, onScore, onErase, onClose }: ScoreDialogProps) {
	// Base UI keeps the popup mounted while it animates out, but `selected` is
	// already null by that point. Rendering the picker straight off it emptied the
	// dialog the instant it started closing, so what animated away was a blank
	// box. Mirror the selection here and let the copy outlive it.
	//
	// Assigning during render is deliberate — it is React's "adjust state when a
	// prop changes" case, and the condition makes it idempotent. Every close path
	// has to be covered, and only some of them go through onOpenChange: scoring,
	// erasing and Cancel all null `selected` directly.
	const [shown, setShown] = useState<Shown | null>(null);

	if (
		selected !== null &&
		(shown === null || shown.selection !== selected || shown.current !== current)
	) {
		setShown({ selection: selected, current });
	}

	return (
		<Dialog
			open={selected !== null}
			onOpenChange={(open) => !open && onClose()}
			// Belt and braces. Base UI tears down the popup subtree once it has
			// finished animating out, so the picker already unmounts and its local
			// pick state already resets without this. Releasing the copy keeps that
			// true if the popup is ever kept mounted instead.
			onOpenChangeComplete={(open) => {
				if (!open) setShown(null);
			}}
		>
			<DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
				{shown && (
					<ScorePicker
						// Player + category keys the whole picker, so its local pick
						// state resets the same way the old native <dialog> did on
						// unmount, instead of surviving across opens.
						key={`${shown.selection.playerId}:${shown.selection.category}`}
						category={shown.selection.category}
						current={shown.current}
						onScore={onScore}
						onErase={onErase}
						onClose={onClose}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
