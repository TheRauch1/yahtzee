import { useMemo, useSyncExternalStore } from 'react';
import { gameStore } from '@/lib/game-store';
import type { Player } from '@/lib/types';

export function usePlayers(): readonly Player[] {
	return useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot);
}

export function usePlayer(playerId: string | null): Player | null {
	const players = usePlayers();
	return useMemo(
		() => players.find((player) => player.id === playerId) ?? null,
		[players, playerId]
	);
}
