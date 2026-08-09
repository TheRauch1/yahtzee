import { beforeEach, describe, expect, it } from 'vitest';
import { Game, emptyScores } from './gameStore.svelte';
import { ALL_CATEGORIES } from './types';

const STORAGE_KEY = 'yahtzee:v1';

beforeEach(() => {
	localStorage.clear();
});

describe('emptyScores', () => {
	it('starts every category unscored', () => {
		const scores = emptyScores();
		expect(Object.keys(scores)).toHaveLength(ALL_CATEGORIES.length);
		expect(Object.values(scores).every((value) => value === null)).toBe(true);
	});
});

describe('players', () => {
	it('adds a player with a blank scorecard', () => {
		const game = new Game();
		game.addPlayer('Ada');

		expect(game.players).toHaveLength(1);
		expect(game.players[0].name).toBe('Ada');
		expect(game.players[0].scores.yahtzee).toBeNull();
	});

	it('trims names and ignores blank input', () => {
		const game = new Game();
		game.addPlayer('  Grace  ');
		game.addPlayer('   ');
		game.addPlayer('');

		expect(game.players).toHaveLength(1);
		expect(game.players[0].name).toBe('Grace');
	});

	it('gives players added in the same tick distinct ids', () => {
		const game = new Game();
		game.addPlayer('A');
		game.addPlayer('B');
		game.addPlayer('C');

		const ids = new Set(game.players.map((player) => player.id));
		expect(ids.size).toBe(3);
	});

	it('removes a player by id', () => {
		const game = new Game();
		game.addPlayer('A');
		game.addPlayer('B');

		game.removePlayer(game.players[0].id);

		expect(game.players).toHaveLength(1);
		expect(game.players[0].name).toBe('B');
	});
});

describe('scoring', () => {
	it('records a score against the right player and category', () => {
		const game = new Game();
		game.addPlayer('A');
		game.addPlayer('B');

		game.scoreCategory('yahtzee', 50, game.players[1].id);

		expect(game.players[0].scores.yahtzee).toBeNull();
		expect(game.players[1].scores.yahtzee).toBe(50);
	});

	it('stores zero rather than NaN', () => {
		const game = new Game();
		game.addPlayer('A');

		game.scoreCategory('chance', Number.NaN, game.players[0].id);

		expect(game.players[0].scores.chance).toBe(0);
	});

	it('ignores scores for an unknown player', () => {
		const game = new Game();
		game.addPlayer('A');

		expect(() => game.scoreCategory('ones', 3, 'nope')).not.toThrow();
		expect(game.players[0].scores.ones).toBeNull();
	});

	it('allows a category to be re-scored', () => {
		const game = new Game();
		game.addPlayer('A');

		game.scoreCategory('ones', 3, game.players[0].id);
		game.scoreCategory('ones', 5, game.players[0].id);

		expect(game.players[0].scores.ones).toBe(5);
	});
});

describe('persistence', () => {
	it('round-trips players and scores through localStorage', () => {
		const first = new Game();
		first.addPlayer('Ada');
		first.scoreCategory('sixes', 24, first.players[0].id);

		const second = new Game();

		expect(second.players).toHaveLength(1);
		expect(second.players[0].name).toBe('Ada');
		expect(second.players[0].scores.sixes).toBe(24);
	});

	it('clears storage on reset', () => {
		const game = new Game();
		game.addPlayer('Ada');
		game.reset();

		expect(game.players).toHaveLength(0);
		expect(new Game().players).toHaveLength(0);
	});

	it('recovers from a corrupt payload instead of throwing', () => {
		localStorage.setItem(STORAGE_KEY, '{not json');
		expect(new Game().players).toEqual([]);

		localStorage.setItem(STORAGE_KEY, '"a string"');
		expect(new Game().players).toEqual([]);

		localStorage.setItem(STORAGE_KEY, '[1, 2, null]');
		expect(new Game().players).toEqual([]);
	});

	it('fills in missing categories and drops unknown ones', () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify([{ id: 'x', name: 'Legacy', scores: { ones: 3, 'not-a-category': 99 } }])
		);

		const game = new Game();

		expect(game.players).toHaveLength(1);
		expect(game.players[0].scores.ones).toBe(3);
		expect(game.players[0].scores.yahtzee).toBeNull();
		expect(Object.keys(game.players[0].scores)).toHaveLength(ALL_CATEGORIES.length);
	});

	it('gives a persisted player without an id a fresh one', () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([{ name: 'NoId', scores: {} }]));

		const game = new Game();

		expect(game.players[0].id).toBeTruthy();
	});
});
