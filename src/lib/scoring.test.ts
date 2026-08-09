import { describe, expect, it } from 'vitest';
import type { Player, ScoringCategory } from './types';
import { ALL_CATEGORIES } from './types';
import {
	UPPER_BONUS_POINTS,
	UPPER_BONUS_THRESHOLD,
	chanceScore,
	fourOfAKindScore,
	fullHouseScore,
	grandTotal,
	lowerTotal,
	pairScore,
	threeOfAKindScore,
	twoPairsScore,
	upperBonus,
	upperCategoryScore,
	upperCategoryValue,
	upperTotal
} from './scoring';

function playerWith(scores: Partial<Record<ScoringCategory, number | null>>): Player {
	const full = Object.fromEntries(ALL_CATEGORIES.map((c) => [c, null])) as Record<
		ScoringCategory,
		number | null
	>;
	return { id: 'p1', name: 'Test', scores: { ...full, ...scores } };
}

describe('upper categories', () => {
	it('maps each category to its face value', () => {
		expect(upperCategoryValue('ones')).toBe(1);
		expect(upperCategoryValue('threes')).toBe(3);
		expect(upperCategoryValue('sixes')).toBe(6);
	});

	it('multiplies the face value by the number of dice', () => {
		expect(upperCategoryScore('fives', 0)).toBe(0);
		expect(upperCategoryScore('fives', 3)).toBe(15);
		expect(upperCategoryScore('sixes', 5)).toBe(30);
	});
});

describe('lower categories', () => {
	it('scores a pair as twice the value', () => {
		expect(pairScore(0)).toBe(0);
		expect(pairScore(6)).toBe(12);
	});

	it('scores two pairs as the sum of both pairs', () => {
		expect(twoPairsScore(3, 5)).toBe(16);
		expect(twoPairsScore(1, 1)).toBe(4);
	});

	it('scores a full house as three of one plus two of the other', () => {
		expect(fullHouseScore(5, 2)).toBe(19);
		expect(fullHouseScore(1, 6)).toBe(15);
	});

	it('sums the dice for chance', () => {
		expect(chanceScore([])).toBe(0);
		expect(chanceScore([1, 2, 3, 4, 5])).toBe(15);
		expect(chanceScore([6, 6, 6, 6, 6])).toBe(30);
	});
});

/**
 * These are deliberate house rules, not standard Yahtzee or Yatzy.
 * If one of these assertions fails, the scoring was changed by accident.
 */
describe('house rules', () => {
	it('scores three of a kind as value * 3 + 3', () => {
		expect(threeOfAKindScore(5)).toBe(18);
		expect(threeOfAKindScore(1)).toBe(6);
		expect(threeOfAKindScore(6)).toBe(21);
	});

	it('scores four of a kind as value * 4 + 1', () => {
		expect(fourOfAKindScore(5)).toBe(21);
		expect(fourOfAKindScore(1)).toBe(5);
		expect(fourOfAKindScore(6)).toBe(25);
	});

	it('awards the upper bonus at 65, not the standard 63', () => {
		expect(UPPER_BONUS_THRESHOLD).toBe(65);
		expect(UPPER_BONUS_POINTS).toBe(35);

		// 63 and 64 are deliberately not enough.
		expect(upperBonus(playerWith({ ones: 63 }))).toBe(0);
		expect(upperBonus(playerWith({ ones: 64 }))).toBe(0);
		expect(upperBonus(playerWith({ ones: 65 }))).toBe(35);
		expect(upperBonus(playerWith({ ones: 100 }))).toBe(35);
	});
});

describe('totals', () => {
	it('ignores unscored categories', () => {
		const player = playerWith({ ones: 3, sixes: 12 });
		expect(upperTotal(player)).toBe(15);
		expect(lowerTotal(player)).toBe(0);
	});

	it('sums the upper section only', () => {
		const player = playerWith({ ones: 1, twos: 4, threes: 9, chance: 20 });
		expect(upperTotal(player)).toBe(14);
	});

	it('sums the lower section only', () => {
		const player = playerWith({ sixes: 30, yahtzee: 50, chance: 20 });
		expect(lowerTotal(player)).toBe(70);
	});

	it('adds the bonus into the grand total once earned', () => {
		const withoutBonus = playerWith({ ones: 4, twos: 8, threes: 12, yahtzee: 50 });
		expect(upperTotal(withoutBonus)).toBe(24);
		expect(grandTotal(withoutBonus)).toBe(74);

		const withBonus = playerWith({
			ones: 5,
			twos: 10,
			threes: 15,
			fours: 20,
			fives: 15,
			yahtzee: 50
		});
		expect(upperTotal(withBonus)).toBe(65);
		expect(grandTotal(withBonus)).toBe(65 + 50 + 35);
	});

	it('treats an all-null scorecard as zero', () => {
		const player = playerWith({});
		expect(grandTotal(player)).toBe(0);
	});
});
