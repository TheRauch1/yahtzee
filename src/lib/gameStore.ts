import { writable } from 'svelte/store';
import type { Player, ScoringCategory } from './types';

export interface GameState {
  players: Player[];
  darkMode: boolean;
}

const initialState: GameState = {
  players: [],
  darkMode: false
};

export const gameStore = writable<GameState>(initialState);

export function addPlayer(name: string) {
  const initialScores: Record<ScoringCategory, number | null> = {
    'ones': null,
    'twos': null,
    'threes': null,
    'fours': null,
    'fives': null,
    'sixes': null,
    'pair': null,
    'two-pairs': null,
    'three-of-a-kind': null,
    'four-of-a-kind': null,
    'full-house': null,
    'small-straight': null,
    'large-straight': null,
    'yahtzee': null,
    'chance': null
  };

  gameStore.update(state => ({
    ...state,
    players: [...state.players, {
      id: Date.now().toString(),
      name,
      scores: initialScores
    }]
  }));
}

export function scoreCategory(category: ScoringCategory, score: number, playerId: string) {
  gameStore.update(state => {
    const updatedPlayers = state.players.map(player =>
      player.id === playerId
        ? { ...player, scores: { ...player.scores, [category]: score } }
        : player
    );

    return {
      ...state,
      players: updatedPlayers
    };
  });
}

export function resetGame() {
  gameStore.set({
    ...initialState,
    players: [],
    darkMode: false
  });
}

export function toggleDarkMode() {
  gameStore.update(state => ({
    ...state,
    darkMode: !state.darkMode
  }));
}
