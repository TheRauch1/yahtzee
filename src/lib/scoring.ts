import type { Player, ScoringCategory } from './types';
import { LOWER_CATEGORIES, UPPER_CATEGORIES } from './types';

/**
 * Scoring follows Yatzy, not Yahtzee.
 *
 *  - Pair and Two Pairs are categories here; Yahtzee has neither.
 *  - Three and four of a kind score the matching dice only (value * 3, value * 4),
 *    where Yahtzee would score the sum of all five dice.
 *
 * The upper bonus is the standard 35 points at 63+.
 */
export const UPPER_BONUS_THRESHOLD = 63;
export const UPPER_BONUS_POINTS = 35;

export const SMALL_STRAIGHT_POINTS = 30;
export const LARGE_STRAIGHT_POINTS = 40;
export const YAHTZEE_POINTS = 50;

/** Face value scored by each upper category, e.g. 'threes' -> 3. */
export const UPPER_CATEGORY_VALUES: Record<string, number> = {
	ones: 1,
	twos: 2,
	threes: 3,
	fours: 4,
	fives: 5,
	sixes: 6
};

export function upperCategoryValue(category: ScoringCategory): number {
	return UPPER_CATEGORY_VALUES[category] ?? 1;
}

/** Score for `count` dice showing the face value of an upper category. */
export function upperCategoryScore(category: ScoringCategory, count: number): number {
	return count * upperCategoryValue(category);
}

export function pairScore(value: number): number {
	return value * 2;
}

export function twoPairsScore(first: number, second: number): number {
	return first * 2 + second * 2;
}

/** Sum of the three matching dice. */
export function threeOfAKindScore(value: number): number {
	return value * 3;
}

/** Sum of the four matching dice. */
export function fourOfAKindScore(value: number): number {
	return value * 4;
}

export function fullHouseScore(threeOfAKind: number, pair: number): number {
	return threeOfAKind * 3 + pair * 2;
}

export function chanceScore(dice: number[]): number {
	return dice.reduce((sum, die) => sum + die, 0);
}

function sumCategories(player: Player, categories: ScoringCategory[]): number {
	return categories.reduce((total, category) => {
		const score = player.scores[category];
		return typeof score === 'number' && !Number.isNaN(score) ? total + score : total;
	}, 0);
}

export function upperTotal(player: Player): number {
	return sumCategories(player, UPPER_CATEGORIES);
}

export function upperBonus(player: Player): number {
	return upperTotal(player) >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS_POINTS : 0;
}

export function lowerTotal(player: Player): number {
	return sumCategories(player, LOWER_CATEGORIES);
}

export function grandTotal(player: Player): number {
	return upperTotal(player) + lowerTotal(player) + upperBonus(player);
}
