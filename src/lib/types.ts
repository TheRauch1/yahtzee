export type ScoringCategory =
	| 'ones'
	| 'twos'
	| 'threes'
	| 'fours'
	| 'fives'
	| 'sixes'
	| 'pair'
	| 'two-pairs'
	| 'three-of-a-kind'
	| 'four-of-a-kind'
	| 'full-house'
	| 'small-straight'
	| 'large-straight'
	| 'yahtzee'
	| 'chance';

export interface Player {
	id: string;
	name: string;
	scores: Record<ScoringCategory, number | null>;
}

export interface DiceRoll {
	dice: number[];
	kept: boolean[];
}

export const UPPER_CATEGORIES: ScoringCategory[] = [
	'ones',
	'twos',
	'threes',
	'fours',
	'fives',
	'sixes'
];

export const LOWER_CATEGORIES: ScoringCategory[] = [
	'pair',
	'two-pairs',
	'three-of-a-kind',
	'four-of-a-kind',
	'full-house',
	'small-straight',
	'large-straight',
	'yahtzee',
	'chance'
];

export const ALL_CATEGORIES: ScoringCategory[] = [...UPPER_CATEGORIES, ...LOWER_CATEGORIES];
