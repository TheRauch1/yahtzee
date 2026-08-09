import type { Player, ScoringCategory } from './types';
import { LOWER_CATEGORIES, UPPER_CATEGORIES } from './types';

/**
 * House rules.
 *
 * This scoreboard deliberately does NOT follow either standard Yahtzee or standard
 * Yatzy. The values below are how we actually play — they are intentional, they are
 * covered by tests, and they should not be "corrected" to match a rulebook.
 *
 *  - Upper bonus is 35 points at 65+ (standard rulesets use 63).
 *  - Three of a kind scores value * 3 + 3 (the two remaining dice count as a flat 3).
 *  - Four of a kind scores value * 4 + 1 (the remaining die counts as a flat 1).
 */
export const UPPER_BONUS_THRESHOLD = 65;
export const UPPER_BONUS_POINTS = 35;

const THREE_OF_A_KIND_REMAINDER = 3;
const FOUR_OF_A_KIND_REMAINDER = 1;

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

/** House rule: the two non-matching dice always count as a flat 3. */
export function threeOfAKindScore(value: number): number {
	return value * 3 + THREE_OF_A_KIND_REMAINDER;
}

/** House rule: the remaining die always counts as a flat 1. */
export function fourOfAKindScore(value: number): number {
	return value * 4 + FOUR_OF_A_KIND_REMAINDER;
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
