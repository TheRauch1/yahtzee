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
	// Identifies one open of the dialog, which the selection cannot: reopening
	// the same cell is a new open of an identical selection. See the key below.
	openId: number;
}

export function ScoreDialog({ selected, current, onScore, onErase, onClose }: ScoreDialogProps) {
	const open = selected !== null;

	// Base UI keeps the popup mounted while it animates out, but `selected` is
	// already null by that point. Rendering the picker straight off it emptied the
	// dialog the instant it started closing, so what animated away was a blank
	// box. Mirror the selection here and let the copy outlive it.
	const [shown, setShown] = useState<Shown | null>(null);
	// Because the copy outlives `selected`, "is the dialog open" cannot be read
	// off `shown` — during an exit there is a copy but no selection. Tracking the
	// prop is what tells a reopen apart from a re-render of an open dialog.
	const [wasOpen, setWasOpen] = useState(false);

	// Assigning during render is deliberate — it is React's "adjust state when a
	// prop changes" case, and each branch is idempotent. Every close path has to
	// be covered, and only some of them go through onOpenChange: scoring, erasing
	// and Cancel all null `selected` directly.
	if (open !== wasOpen) setWasOpen(open);

	if (selected !== null) {
		if (shown !== null && wasOpen && shown.selection === selected) {
			// Still the same open of the same cell, so only the score under it can
			// have moved. Keep the picker and whatever has been picked in it.
			if (shown.current !== current) setShown({ ...shown, current });
		} else {
			// A new open. That includes reopening the cell that is still animating
			// out: `selected` can even be the identical object, and the popup is
			// still mounted, so without a fresh id React would hand the reopen the
			// picker that is on its way out — half-made picks and all.
			setShown({ selection: selected, current, openId: (shown?.openId ?? 0) + 1 });
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => !next && onClose()}
			// Belt and braces. Base UI tears down the popup subtree once it has
			// finished animating out, so the picker already unmounts and its local
			// pick state already resets without this. Releasing the copy keeps that
			// true if the popup is ever kept mounted instead.
			onOpenChangeComplete={(next) => {
				if (!next) setShown(null);
			}}
		>
			<DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
				{shown && (
					<ScorePicker
						// One picker per open — not per cell — so its local pick state
						// resets the same way the old native <dialog> did on unmount,
						// instead of surviving across opens.
						key={shown.openId}
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
