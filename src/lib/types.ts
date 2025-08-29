export type ScoringCategory =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'pair' | 'two-pairs' | 'three-of-a-kind' | 'four-of-a-kind' | 'full-house' | 'small-straight'
  | 'large-straight' | 'yahtzee' | 'chance';

export interface Player {
  id: string;
  name: string;
  scores: Record<ScoringCategory, number | null>;
}

export interface DiceRoll {
  dice: number[];
  kept: boolean[];
}

export const CATEGORY_NAMES: Record<ScoringCategory, string> = {
  'ones': 'Ones',
  'twos': 'Twos',
  'threes': 'Threes',
  'fours': 'Fours',
  'fives': 'Fives',
  'sixes': 'Sixes',
  'pair': 'Pair',
  'two-pairs': 'Two Pairs',
  'three-of-a-kind': 'Three of a Kind',
  'four-of-a-kind': 'Four of a Kind',
  'full-house': 'Full House',
  'small-straight': 'Small Straight',
  'large-straight': 'Large Straight',
  'yahtzee': 'Yahtzee',
  'chance': 'Chance'
};

export const UPPER_CATEGORIES: ScoringCategory[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
export const LOWER_CATEGORIES: ScoringCategory[] = ['pair', 'two-pairs', 'three-of-a-kind', 'four-of-a-kind', 'full-house', 'small-straight', 'large-straight', 'yahtzee', 'chance'];
