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

export class Game {
	players = $state<Player[]>(loadPlayers());

	addPlayer(name: string) {
		const trimmed = name.trim();
		if (!trimmed) return;

		this.players.push({ id: createId(), name: trimmed, scores: emptyScores() });
		this.save();
	}

	removePlayer(playerId: string) {
		this.players = this.players.filter((player) => player.id !== playerId);
		this.save();
	}

	scoreCategory(category: ScoringCategory, score: number, playerId: string) {
		const player = this.players.find((candidate) => candidate.id === playerId);
		if (!player) return;

		player.scores[category] = Number.isNaN(score) ? 0 : score;
		this.save();
	}

	reset() {
		this.players = [];
		this.save();
	}

	save() {
		if (typeof localStorage === 'undefined') return;

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(this.players)));
		} catch {
			// Storage can be full or blocked (private mode). The game still works in memory.
		}
	}
}

export const game = new Game();
