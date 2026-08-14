import { describe, expect, it } from 'vitest';
import { createGameStore, emptyScores } from './game-store';
import { ALL_CATEGORIES } from './types';

const STORAGE_KEY = 'yahtzee:v1';

describe('emptyScores', () => {
	it('starts every category unscored', () => {
		const scores = emptyScores();
		expect(Object.keys(scores)).toHaveLength(ALL_CATEGORIES.length);
		expect(Object.values(scores).every((value) => value === null)).toBe(true);
	});
});

describe('players', () => {
	it('adds a player with a blank scorecard', () => {
		const game = createGameStore();
		game.addPlayer('Ada');

		expect(game.getSnapshot()).toHaveLength(1);
		expect(game.getSnapshot()[0].name).toBe('Ada');
		expect(game.getSnapshot()[0].scores.yahtzee).toBeNull();
	});

	it('trims names and ignores blank input', () => {
		const game = createGameStore();
		game.addPlayer('  Grace  ');
		game.addPlayer('   ');
		game.addPlayer('');

		expect(game.getSnapshot()).toHaveLength(1);
		expect(game.getSnapshot()[0].name).toBe('Grace');
	});

	it('gives players added in the same tick distinct ids', () => {
		const game = createGameStore();
		game.addPlayer('A');
		game.addPlayer('B');
		game.addPlayer('C');

		const ids = new Set(game.getSnapshot().map((player) => player.id));
		expect(ids.size).toBe(3);
	});

	it('removes a player by id', () => {
		const game = createGameStore();
		game.addPlayer('A');
		game.addPlayer('B');

		game.removePlayer(game.getSnapshot()[0].id);

		expect(game.getSnapshot()).toHaveLength(1);
		expect(game.getSnapshot()[0].name).toBe('B');
	});
});

describe('scoring', () => {
	it('records a score against the right player and category', () => {
		const game = createGameStore();
		game.addPlayer('A');
		game.addPlayer('B');

		game.scoreCategory('yahtzee', 50, game.getSnapshot()[1].id);

		expect(game.getSnapshot()[0].scores.yahtzee).toBeNull();
		expect(game.getSnapshot()[1].scores.yahtzee).toBe(50);
	});

	it('stores zero rather than NaN', () => {
		const game = createGameStore();
		game.addPlayer('A');

		game.scoreCategory('chance', Number.NaN, game.getSnapshot()[0].id);

		expect(game.getSnapshot()[0].scores.chance).toBe(0);
	});

	it('ignores scores for an unknown player', () => {
		const game = createGameStore();
		game.addPlayer('A');

		expect(() => game.scoreCategory('ones', 3, 'nope')).not.toThrow();
		expect(game.getSnapshot()[0].scores.ones).toBeNull();
	});

	it('allows a category to be re-scored', () => {
		const game = createGameStore();
		game.addPlayer('A');

		game.scoreCategory('ones', 3, game.getSnapshot()[0].id);
		game.scoreCategory('ones', 5, game.getSnapshot()[0].id);

		expect(game.getSnapshot()[0].scores.ones).toBe(5);
	});

	it('clears a single category back to unscored without touching the others', () => {
		const game = createGameStore();
		game.addPlayer('A');
		const id = game.getSnapshot()[0].id;

		game.scoreCategory('ones', 3, id);
		game.scoreCategory('sixes', 24, id);
		game.clearCategory('ones', id);

		expect(game.getSnapshot()[0].scores.ones).toBeNull();
		expect(game.getSnapshot()[0].scores.sixes).toBe(24);

		// The clear must survive a reload, not just live in memory.
		const reloaded = createGameStore();
		expect(reloaded.getSnapshot()[0].scores.ones).toBeNull();
		expect(reloaded.getSnapshot()[0].scores.sixes).toBe(24);
	});

	it('ignores a clear for an unknown player', () => {
		const game = createGameStore();
		game.addPlayer('A');
		game.scoreCategory('ones', 3, game.getSnapshot()[0].id);

		expect(() => game.clearCategory('ones', 'nope')).not.toThrow();
		expect(game.getSnapshot()[0].scores.ones).toBe(3);
	});
});

describe('persistence', () => {
	it('round-trips players and scores through localStorage', () => {
		const first = createGameStore();
		first.addPlayer('Ada');
		first.scoreCategory('sixes', 24, first.getSnapshot()[0].id);

		const second = createGameStore();

		expect(second.getSnapshot()).toHaveLength(1);
		expect(second.getSnapshot()[0].name).toBe('Ada');
		expect(second.getSnapshot()[0].scores.sixes).toBe(24);
	});

	it('clears storage on reset', () => {
		const game = createGameStore();
		game.addPlayer('Ada');
		game.reset();

		expect(game.getSnapshot()).toHaveLength(0);
		expect(createGameStore().getSnapshot()).toHaveLength(0);
	});

	it('recovers from a corrupt payload instead of throwing', () => {
		localStorage.setItem(STORAGE_KEY, '{not json');
		expect(createGameStore().getSnapshot()).toEqual([]);

		localStorage.setItem(STORAGE_KEY, '"a string"');
		expect(createGameStore().getSnapshot()).toEqual([]);

		localStorage.setItem(STORAGE_KEY, '[1, 2, null]');
		expect(createGameStore().getSnapshot()).toEqual([]);
	});

	it('fills in missing categories and drops unknown ones', () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify([{ id: 'x', name: 'Legacy', scores: { ones: 3, 'not-a-category': 99 } }])
		);

		const game = createGameStore();

		expect(game.getSnapshot()).toHaveLength(1);
		expect(game.getSnapshot()[0].scores.ones).toBe(3);
		expect(game.getSnapshot()[0].scores.yahtzee).toBeNull();
		expect(Object.keys(game.getSnapshot()[0].scores)).toHaveLength(ALL_CATEGORIES.length);
	});

	it('gives a persisted player without an id a fresh one', () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([{ name: 'NoId', scores: {} }]));

		const game = createGameStore();

		expect(game.getSnapshot()[0].id).toBeTruthy();
	});

	it('swallows a write failure and keeps working in memory', () => {
		const game = createGameStore();
		const originalSetItem = localStorage.setItem.bind(localStorage);
		localStorage.setItem = () => {
			throw new Error('quota exceeded');
		};

		try {
			expect(() => game.addPlayer('Ada')).not.toThrow();
			expect(game.getSnapshot()).toHaveLength(1);
		} finally {
			localStorage.setItem = originalSetItem;
		}
	});
});

describe('identity', () => {
	it('does not mutate previous snapshots in place', () => {
		const game = createGameStore();
		game.addPlayer('A');
		const before = game.getSnapshot();

		game.scoreCategory('ones', 3, before[0].id);
		const after = game.getSnapshot();

		expect(before).not.toBe(after);
		expect(before[0].scores.ones).toBeNull();
		expect(after[0].scores.ones).toBe(3);
	});

	it('notifies subscribers on every mutation', () => {
		const game = createGameStore();
		let calls = 0;
		const unsubscribe = game.subscribe(() => {
			calls++;
		});

		game.addPlayer('A');
		expect(calls).toBe(1);

		game.scoreCategory('ones', 3, game.getSnapshot()[0].id);
		expect(calls).toBe(2);

		unsubscribe();
		game.addPlayer('B');
		expect(calls).toBe(2);
	});
});
