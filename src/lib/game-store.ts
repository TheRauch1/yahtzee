import type { Player, ScoringCategory } from './types';
import { ALL_CATEGORIES } from './types';

const STORAGE_KEY = 'yahtzee:v1';

export function emptyScores(): Record<ScoringCategory, number | null> {
	return Object.fromEntries(ALL_CATEGORIES.map((category) => [category, null])) as Record<
		ScoringCategory,
		number | null
	>;
}

function createId(): string {
	// randomUUID needs a secure context; fall back to a random suffix so two players
	// added in the same millisecond can never collide.
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Coerce an unknown persisted value into a valid player, or return null.
 * Unknown categories are dropped and missing ones default to unscored, so a
 * payload written by an older version can never white-screen the app.
 */
function parsePlayer(value: unknown): Player | null {
	if (typeof value !== 'object' || value === null) return null;

	const candidate = value as Record<string, unknown>;
	if (typeof candidate.name !== 'string') return null;

	const persisted = (
		typeof candidate.scores === 'object' && candidate.scores !== null ? candidate.scores : {}
	) as Record<string, unknown>;

	const scores = emptyScores();
	for (const category of ALL_CATEGORIES) {
		const score = persisted[category];
		if (typeof score === 'number' && Number.isFinite(score)) {
			scores[category] = score;
		}
	}

	return {
		id: typeof candidate.id === 'string' && candidate.id ? candidate.id : createId(),
		name: candidate.name,
		scores
	};
}

function loadPlayers(): Player[] {
	if (typeof localStorage === 'undefined') return [];

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.map(parsePlayer).filter((player): player is Player => player !== null);
	} catch {
		return [];
	}
}

function save(players: readonly Player[]): void {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
	} catch {
		// Storage can be full or blocked (private mode). The game still works in memory.
	}
}

export interface GameStore {
	subscribe(listener: () => void): () => void;
	getSnapshot(): readonly Player[];
	addPlayer(name: string): void;
	removePlayer(playerId: string): void;
	scoreCategory(category: ScoringCategory, score: number, playerId: string): void;
	/** Return a single category to unscored, so a mis-tap does not need a full reset. */
	clearCategory(category: ScoringCategory, playerId: string): void;
	reset(): void;
}

export function createGameStore(): GameStore {
	let players: readonly Player[] = loadPlayers();
	const listeners = new Set<() => void>();

	/**
	 * The single write path. `players` is replaced, never mutated: React compares
	 * snapshots with Object.is, so an in-place edit would persist correctly and
	 * still render nothing.
	 */
	function commit(next: readonly Player[]): void {
		players = next;
		save(players);
		for (const listener of listeners) listener();
	}

	function setScore(category: ScoringCategory, score: number | null, playerId: string): void {
		let found = false;
		const next = players.map((player) => {
			if (player.id !== playerId) return player;
			found = true;
			return { ...player, scores: { ...player.scores, [category]: score } };
		});
		if (found) commit(next);
	}

	return {
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},

		// Returns the cached array reference. Never derive, filter, sort or wrap here.
		getSnapshot: () => players,

		addPlayer(name) {
			const trimmed = name.trim();
			if (!trimmed) return;
			commit([...players, { id: createId(), name: trimmed, scores: emptyScores() }]);
		},

		removePlayer(playerId) {
			const next = players.filter((player) => player.id !== playerId);
			if (next.length !== players.length) commit(next);
		},

		scoreCategory(category, score, playerId) {
			setScore(category, Number.isNaN(score) ? 0 : score, playerId);
		},

		clearCategory(category, playerId) {
			setScore(category, null, playerId);
		},

		reset() {
			commit([]);
		}
	};
}

export const gameStore = createGameStore();
