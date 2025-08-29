<script lang="ts">
  import { onMount } from 'svelte';
  import DiceFace from './DiceFace.svelte';
  import ScoreModal from './ScoreModal.svelte';
  import { gameStore, addPlayer, scoreCategory, resetGame, toggleDarkMode } from './gameStore';
  import type { ScoringCategory } from './types';
  import { CATEGORY_NAMES, UPPER_CATEGORIES, LOWER_CATEGORIES } from './types';

  let playersInput = $state('');
  let modalOpen = $state(false);
  let selectedCategory: ScoringCategory | null = $state(null);
  let selectedPlayerId: string | null = $state(null);

  let gameState = $derived($gameStore);

  function handleAddPlayer() {
    if (playersInput.trim()) {
      console.log('Adding player:', playersInput.trim());
      addPlayer(playersInput.trim());
      playersInput = '';
      console.log('Player added, current gameState:', gameState);
    }
  }

  function handleScore(category: ScoringCategory, playerId: string) {
    console.log('Opening modal for:', category, playerId);
    console.log('Current state - modalOpen:', modalOpen, 'selectedCategory:', selectedCategory);
    selectedCategory = category;
    selectedPlayerId = playerId;
    modalOpen = true;
    console.log('After setting - modalOpen:', modalOpen, 'selectedCategory:', selectedCategory);
  }

  function handleModalScore(event: { category: ScoringCategory; score: number }) {
    console.log('handleModalScore called with:', event);
    if (selectedPlayerId) {
      scoreCategory(event.category, event.score, selectedPlayerId);
    }
    modalOpen = false;
    selectedCategory = null;
    selectedPlayerId = null;
  }

  function handleModalClose() {
    console.log('handleModalClose called');
    modalOpen = false;
    selectedCategory = null;
    selectedPlayerId = null;
  }

  function getTotalScore(player: any): number {
    let total = 0;
    Object.values(player.scores).forEach((score: any) => {
      if (score !== null && typeof score === 'number' && !isNaN(score)) {
        total += score;
      }
    });
    // Add bonus if upper total is 65 or more
    total += getUpperBonus(player);
    return total;
  }

    function getUpperTotal(player: any): number {
    let total = 0;
    UPPER_CATEGORIES.forEach(cat => {
      const score = player.scores[cat];
      if (score !== null && typeof score === 'number' && !isNaN(score)) {
        total += score;
      }
    });
    return total;
  }

  function getUpperBonus(player: any): number {
    const upperTotal = getUpperTotal(player);
    return upperTotal >= 65 ? 35 : 0;
  }

  function getLowerTotal(player: any): number {
    let total = 0;
    LOWER_CATEGORIES.forEach(cat => {
      const score = player.scores[cat];
      if (score !== null && typeof score === 'number' && !isNaN(score)) {
        total += score;
      }
    });
    return total;
  }

  onMount(() => {
    // Initialize dark mode from localStorage or system preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      if (savedDarkMode === 'true') {
        document.documentElement.classList.add('dark');
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  });

  $effect(() => {
    if (gameState.darkMode && typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  });
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4">
  <div class="max-w-6xl mx-auto">
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Yahtzee Scoreboard</h1>
      <div class="flex space-x-4">
        <button
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          onclick={toggleDarkMode}
        >
          {gameState.darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        <button
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onclick={resetGame}
        >
          Reset Scores
        </button>
      </div>
    </header>

    {#if gameState.players.length === 0}
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Add Players</h2>
        <div class="flex space-x-4 mb-4">
          <input
            type="text"
            bind:value={playersInput}
            placeholder="Player name"
            class="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            onkeydown={(e) => e.key === 'Enter' && handleAddPlayer()}
          />
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onclick={handleAddPlayer}
          >
            Add Player
          </button>
        </div>
      </div>
    {/if}

    {#if gameState.players.length > 0}
      {console.log('Rendering scoreboard for players:', gameState.players)}
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Yahtzee Scoreboard</h2>
          <div class="flex space-x-2">
            {#each gameState.players as player}
              <div class="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                <span>{player.name}</span>
                <button
                  class="ml-2 text-red-600 hover:text-red-800 text-xs"
                  onclick={() => gameStore.update(state => ({
                    ...state,
                    players: state.players.filter(p => p.id !== player.id)
                  }))}
                >
                  ×
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- Add more players section -->
        <div class="border-t pt-4">
          <h3 class="text-lg font-semibold mb-2">Add More Players</h3>
          <div class="flex space-x-4">
            <input
              type="text"
              bind:value={playersInput}
              placeholder="Player name"
              class="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              onkeydown={(e) => e.key === 'Enter' && handleAddPlayer()}
            />
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onclick={handleAddPlayer}
            >
              Add Player
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-collapse">
          <thead class="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left border-r border-gray-300 dark:border-gray-600 font-semibold">Category</th>
              {#each gameState.players as player}
                <th class="px-4 py-3 text-center border-r border-gray-300 dark:border-gray-600 last:border-r-0 font-semibold">{player.name}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            <!-- Upper Section -->
            {#each UPPER_CATEGORIES as category}
              <tr class="border-b border-gray-200 dark:border-gray-600">
                <td class="px-4 py-3 font-semibold border-r border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">{CATEGORY_NAMES[category]}</td>
                {#each gameState.players as player}
                  <td class="px-4 py-3 text-center border-r border-gray-300 dark:border-gray-600 last:border-r-0 min-h-[48px] transition-colors duration-200
                    {player.scores[category] !== null 
                      ? 'bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' 
                      : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'}"
                    onclick={() => {
                      console.log('Cell clicked for category:', category, 'player:', player.id);
                      handleScore(category, player.id);
                    }}
                  >
                    {console.log('Rendering cell for category:', category, 'player:', player.name, 'score:', player.scores[category])}
                    {#if player.scores[category] !== null}
                      <span class="font-medium">{player.scores[category]}</span>
                    {:else}
                      <span class="text-blue-600 dark:text-blue-400 text-sm font-medium">Click to score</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}

            <!-- Upper Total -->
            <tr class="border-b-2 border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700">
              <td class="px-4 py-3 font-bold border-r border-gray-300 dark:border-gray-600">Upper Total</td>
              {#each gameState.players as player}
                <td class="px-4 py-3 text-center font-bold border-r border-gray-300 dark:border-gray-600 last:border-r-0">{getUpperTotal(player)}</td>
              {/each}
            </tr>

            <!-- Upper Bonus -->
            <tr class="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <td class="px-4 py-3 font-semibold border-r border-gray-300 dark:border-gray-600">Bonus (65+ pts)</td>
              {#each gameState.players as player}
                <td class="px-4 py-3 text-center border-r border-gray-300 dark:border-gray-600 last:border-r-0">
                  {#if getUpperBonus(player) > 0}
                    <span class="font-bold text-green-600 dark:text-green-400">{getUpperBonus(player)}</span>
                  {:else}
                    <span class="text-gray-400">0</span>
                  {/if}
                </td>
              {/each}
            </tr>

            <!-- Lower Section -->
            {#each LOWER_CATEGORIES as category}
              <tr class="border-b border-gray-200 dark:border-gray-600">
                <td class="px-4 py-3 font-semibold border-r border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">{CATEGORY_NAMES[category]}</td>
                {#each gameState.players as player}
                  <td class="px-4 py-3 text-center border-r border-gray-300 dark:border-gray-600 last:border-r-0 min-h-[48px] transition-colors duration-200
                    {player.scores[category] !== null 
                      ? 'bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' 
                      : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'}"
                    onclick={() => {
                      console.log('Cell clicked for category:', category, 'player:', player.id);
                      handleScore(category, player.id);
                    }}
                  >
                    {#if player.scores[category] !== null}
                      <span class="font-medium">{player.scores[category]}</span>
                    {:else}
                      <span class="text-blue-600 dark:text-blue-400 text-sm font-medium">Click to score</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}

            <!-- Lower Total -->
            <tr class="border-b-2 border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700">
              <td class="px-4 py-3 font-bold border-r border-gray-300 dark:border-gray-600">Lower Total</td>
              {#each gameState.players as player}
                <td class="px-4 py-3 text-center font-bold border-r border-gray-300 dark:border-gray-600 last:border-r-0">{getLowerTotal(player)}</td>
              {/each}
            </tr>

            <!-- Grand Total -->
            <tr class="border-b-2 border-gray-400 dark:border-gray-500 bg-gray-200 dark:bg-gray-600">
              <td class="px-4 py-3 font-bold text-lg border-r border-gray-300 dark:border-gray-600">Grand Total</td>
              {#each gameState.players as player}
                <td class="px-4 py-3 text-center font-bold text-lg border-r border-gray-300 dark:border-gray-600 last:border-r-0">{getTotalScore(player)}</td>
              {/each}
            </tr>
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

{#if modalOpen && selectedCategory}
  <ScoreModal 
    category={selectedCategory} 
    isOpen={modalOpen} 
    on:score={(e) => handleModalScore(e.detail)} 
    on:close={handleModalClose} 
  />
{/if}
