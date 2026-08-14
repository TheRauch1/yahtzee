import { X } from 'lucide-react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-locale';
import { gameStore } from '@/lib/game-store';
import type { Player } from '@/lib/types';

interface PlayerChipsProps {
	players: readonly Player[];
}

export function PlayerChips({ players }: PlayerChipsProps) {
	const t = useTranslation();

	return (
		<div className="flex flex-wrap gap-2">
			{players.map((player) => (
				<Badge key={player.id} variant="secondary" className="gap-2 py-1 pr-1 pl-3 text-sm">
					<span className="font-medium">{player.name}</span>
					<ConfirmDialog
						trigger={
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="size-5"
								aria-label={t.scoreboard.removePlayer(player.name)}
							>
								<X className="size-3" />
							</Button>
						}
						title={t.scoreboard.confirmRemoveTitle(player.name)}
						description={t.scoreboard.confirmRemoveBody}
						confirmLabel={t.scoreboard.confirmRemoveConfirm}
						cancelLabel={t.common.cancel}
						onConfirm={() => gameStore.removePlayer(player.id)}
					/>
				</Badge>
			))}
		</div>
	);
}
