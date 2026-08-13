import type { ScoringCategory } from './types';

export type Locale = 'en' | 'de';

export const LOCALES: Locale[] = ['en', 'de'];

/** Each locale's own name for itself, shown in the switcher regardless of the active locale. */
export const LOCALE_LABELS: Record<Locale, string> = {
	en: 'English',
	de: 'Deutsch'
};

export interface Translation {
	categories: Record<ScoringCategory, string>;
	language: {
		switchLabel: string;
	};
	common: {
		cancel: string;
	};
	scoreboard: {
		title: string;
		subtitle: string;
		lightMode: string;
		darkMode: string;
		reset: string;
		addPlayers: string;
		addMorePlayers: string;
		categoryHeader: string;
		upperTotal: string;
		bonus: (threshold: number) => string;
		lowerTotal: string;
		grandTotal: string;
		removePlayer: (name: string) => string;
		scoreFor: (category: string, player: string) => string;
		confirmResetTitle: string;
		confirmResetBody: string;
		confirmResetConfirm: string;
		confirmRemoveTitle: (name: string) => string;
		confirmRemoveBody: string;
		confirmRemoveConfirm: string;
	};
	addPlayerForm: {
		playerNamePlaceholder: string;
		addPlayer: string;
	};
	scoreModal: {
		scoreFor: (category: string) => string;
		howManyDidYouRoll: (category: string) => string;
		none: string;
		selectYourPair: string;
		selectYourTwoPairs: string;
		firstPair: string;
		secondPair: string;
		selectOnePairPerColumn: string;
		selectThreeOfAKindHint: string;
		selectFourOfAKindHint: string;
		selectFullHouseHint: string;
		selectThreeAndPair: string;
		selectSmallStraight: string;
		selectLargeStraight: string;
		selectYahtzee: string;
		selectChanceDice: string;
		clickDiceToAdd: (max: number) => string;
		addDie: (value: number) => string;
		selectedDice: string;
		clearAll: string;
		removeDie: (value: number) => string;
		totalScore: string;
		moreDiceToSelect: (count: number) => string;
		scoreZero: string;
		eraseScore: string;
		cancel: string;
	};
}

export const translations: Record<Locale, Translation> = {
	en: {
		categories: {
			ones: 'Ones',
			twos: 'Twos',
			threes: 'Threes',
			fours: 'Fours',
			fives: 'Fives',
			sixes: 'Sixes',
			pair: 'Pair',
			'two-pairs': 'Two Pairs',
			'three-of-a-kind': 'Three of a Kind',
			'four-of-a-kind': 'Four of a Kind',
			'full-house': 'Full House',
			'small-straight': 'Small Straight',
			'large-straight': 'Large Straight',
			yahtzee: 'Yahtzee',
			chance: 'Chance'
		},
		language: {
			switchLabel: 'Language'
		},
		common: {
			cancel: 'Cancel'
		},
		scoreboard: {
			title: 'Yahtzee Scoreboard',
			subtitle: 'Keep score, add players, and switch between light and dark themes.',
			lightMode: 'Light Mode',
			darkMode: 'Dark Mode',
			reset: 'Reset',
			addPlayers: 'Add Players',
			addMorePlayers: 'Add More Players',
			categoryHeader: 'Category',
			upperTotal: 'Upper Total',
			bonus: (threshold) => `Bonus (${threshold}+ pts)`,
			lowerTotal: 'Lower Total',
			grandTotal: 'Grand Total',
			removePlayer: (name) => `Remove ${name}`,
			scoreFor: (category, player) => `Score ${category} for ${player}`,
			confirmResetTitle: 'Reset the scoreboard?',
			confirmResetBody: 'This removes all players and their scores. This cannot be undone.',
			confirmResetConfirm: 'Reset',
			confirmRemoveTitle: (name) => `Remove ${name}?`,
			confirmRemoveBody: 'Their column and all their scores will be deleted.',
			confirmRemoveConfirm: 'Remove'
		},
		addPlayerForm: {
			playerNamePlaceholder: 'Player name',
			addPlayer: 'Add Player'
		},
		scoreModal: {
			scoreFor: (category) => `Score for ${category}`,
			howManyDidYouRoll: (category) => `How many ${category.toLowerCase()} did you roll?`,
			none: 'None',
			selectYourPair: 'Select your pair:',
			selectYourTwoPairs: 'Select your two pairs:',
			firstPair: 'First Pair',
			secondPair: 'Second Pair',
			selectOnePairPerColumn: 'Select one pair from each column to submit your score',
			selectThreeOfAKindHint:
				'Select the value for your three of a kind (house rule: the other two dice count as 3):',
			selectFourOfAKindHint:
				'Select the value for your four of a kind (house rule: the remaining die counts as 1):',
			selectFullHouseHint: 'Select your full house (3 of a kind + pair):',
			selectThreeAndPair: 'Select three-of-a-kind and pair to submit your score',
			selectSmallStraight: 'Select your small straight:',
			selectLargeStraight: 'Select your large straight:',
			selectYahtzee: 'Select your Yahtzee:',
			selectChanceDice: 'Select your 5 dice for Chance (sum of all dice):',
			clickDiceToAdd: (max) => `Click dice values to add (up to ${max})`,
			addDie: (value) => `Add a ${value}`,
			selectedDice: 'Selected Dice:',
			clearAll: 'Clear All',
			removeDie: (value) => `Remove die showing ${value}`,
			totalScore: 'Total Score:',
			moreDiceToSelect: (count) => `${count} more ${count === 1 ? 'die' : 'dice'} to select`,
			scoreZero: 'Score 0',
			eraseScore: 'Erase score',
			cancel: 'Cancel'
		}
	},
	de: {
		categories: {
			ones: 'Einser',
			twos: 'Zweier',
			threes: 'Dreier',
			fours: 'Vierer',
			fives: 'Fünfer',
			sixes: 'Sechser',
			pair: 'Paar',
			'two-pairs': 'Zwei Paare',
			'three-of-a-kind': 'Dreierpasch',
			'four-of-a-kind': 'Viererpasch',
			'full-house': 'Full House',
			'small-straight': 'Kleine Straße',
			'large-straight': 'Große Straße',
			yahtzee: 'Yahtzee',
			chance: 'Chance'
		},
		language: {
			switchLabel: 'Sprache'
		},
		common: {
			cancel: 'Abbrechen'
		},
		scoreboard: {
			title: 'Yahtzee-Punktetafel',
			subtitle:
				'Punkte eintragen, Spieler hinzufügen und zwischen hellem und dunklem Design wechseln.',
			lightMode: 'Heller Modus',
			darkMode: 'Dunkler Modus',
			reset: 'Zurücksetzen',
			addPlayers: 'Spieler hinzufügen',
			addMorePlayers: 'Weitere Spieler hinzufügen',
			categoryHeader: 'Kategorie',
			upperTotal: 'Obere Summe',
			bonus: (threshold) => `Bonus (${threshold}+ Punkte)`,
			lowerTotal: 'Untere Summe',
			grandTotal: 'Gesamtsumme',
			removePlayer: (name) => `${name} entfernen`,
			scoreFor: (category, player) => `${category} für ${player} werten`,
			confirmResetTitle: 'Punktetafel zurücksetzen?',
			confirmResetBody:
				'Dadurch werden alle Spieler und ihre Punkte entfernt. Das kann nicht rückgängig gemacht werden.',
			confirmResetConfirm: 'Zurücksetzen',
			confirmRemoveTitle: (name) => `${name} entfernen?`,
			confirmRemoveBody: 'Die Spalte und alle Punkte werden gelöscht.',
			confirmRemoveConfirm: 'Entfernen'
		},
		addPlayerForm: {
			playerNamePlaceholder: 'Spielername',
			addPlayer: 'Spieler hinzufügen'
		},
		scoreModal: {
			scoreFor: (category) => `Punkte für ${category}`,
			howManyDidYouRoll: (category) => `Wie viele ${category} hast du gewürfelt?`,
			none: 'Keine',
			selectYourPair: 'Wähle dein Paar:',
			selectYourTwoPairs: 'Wähle deine zwei Paare:',
			firstPair: 'Erstes Paar',
			secondPair: 'Zweites Paar',
			selectOnePairPerColumn: 'Wähle ein Paar aus jeder Spalte, um deine Punktzahl einzutragen',
			selectThreeOfAKindHint:
				'Wähle den Wert für deinen Dreierpasch (Hausregel: die anderen beiden Würfel zählen als 3):',
			selectFourOfAKindHint:
				'Wähle den Wert für deinen Viererpasch (Hausregel: der verbleibende Würfel zählt als 1):',
			selectFullHouseHint: 'Wähle dein Full House (Dreierpasch + Paar):',
			selectThreeAndPair: 'Wähle Dreierpasch und Paar, um deine Punktzahl einzutragen',
			selectSmallStraight: 'Wähle deine kleine Straße:',
			selectLargeStraight: 'Wähle deine große Straße:',
			selectYahtzee: 'Wähle dein Yahtzee:',
			selectChanceDice: 'Wähle deine 5 Würfel für die Chance (Summe aller Würfel):',
			clickDiceToAdd: (max) => `Klicke auf Würfelwerte zum Hinzufügen (bis zu ${max})`,
			addDie: (value) => `Eine ${value} hinzufügen`,
			selectedDice: 'Ausgewählte Würfel:',
			clearAll: 'Alle löschen',
			removeDie: (value) => `Würfel mit ${value} entfernen`,
			totalScore: 'Gesamtpunktzahl:',
			moreDiceToSelect: (count) => `Noch ${count} Würfel auszuwählen`,
			scoreZero: '0 Punkte',
			eraseScore: 'Punktzahl löschen',
			cancel: 'Abbrechen'
		}
	}
};
