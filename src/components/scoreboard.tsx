import { useState } from 'react';

import { AddPlayerForm } from '@/components/add-player-form';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PlayerChips } from '@/components/player-chips';
import { ScoreDialog, type ScoreDialogSelection } from '@/components/score-dialog';
import { ScoreTable } from '@/components/score-table';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePlayer, usePlayers } from '@/hooks/use-game';
import { useTranslation } from '@/hooks/use-locale';
import { gameStore } from '@/lib/game-store';
import type { ScoringCategory } from '@/lib/types';

export function Scoreboard() {
	const t = useTranslation();
	const players = usePlayers();
	const [selected, setSelected] = useState<ScoreDialogSelection | null>(null);
	const selectedPlayer = usePlayer(selected?.playerId ?? null);
	const current = selected && selectedPlayer ? selectedPlayer.scores[selected.category] : null;

	function openCell(category: ScoringCategory, playerId: string) {
		setSelected({ category, playerId });
	}

	function closeDialog() {
		setSelected(null);
	}

	function applyScore(score: number) {
		if (selected) gameStore.scoreCategory(selected.category, score, selected.playerId);
		closeDialog();
	}

	function eraseScore() {
		if (selected) gameStore.clearCategory(selected.category, selected.playerId);
		closeDialog();
	}

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
				<header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<h1 className="text-3xl font-extrabold">{t.scoreboard.title}</h1>
						<p className="mt-1 text-sm text-muted-foreground">{t.scoreboard.subtitle}</p>
					</div>
					<div className="flex items-center gap-2">
						<LanguageSwitcher />
						<ThemeToggle />
						<ConfirmDialog
							trigger={<Button variant="destructive">{t.scoreboard.reset}</Button>}
							title={t.scoreboard.confirmResetTitle}
							description={t.scoreboard.confirmResetBody}
							confirmLabel={t.scoreboard.confirmResetConfirm}
							cancelLabel={t.common.cancel}
							onConfirm={() => gameStore.reset()}
						/>
					</div>
				</header>

				{players.length === 0 ? (
					<Card>
						<CardHeader>
							<CardTitle>{t.scoreboard.addPlayers}</CardTitle>
						</CardHeader>
						<CardContent>
							<AddPlayerForm onAdd={(name) => gameStore.addPlayer(name)} />
						</CardContent>
					</Card>
				) : (
					<div className="space-y-6">
						<Card>
							<CardContent className="space-y-4">
								<PlayerChips players={players} />
								<Separator />
								<div>
									<h2 className="mb-2 text-lg font-semibold">{t.scoreboard.addMorePlayers}</h2>
									<AddPlayerForm onAdd={(name) => gameStore.addPlayer(name)} />
								</div>
							</CardContent>
						</Card>

						<ScoreTable players={players} onOpenCell={openCell} />
					</div>
				)}
			</div>

			<ScoreDialog
				selected={selected}
				current={current}
				onScore={applyScore}
				onErase={eraseScore}
				onClose={closeDialog}
			/>
		</div>
	);
}
