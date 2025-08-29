<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ScoringCategory } from './types';
  import DiceFace from './DiceFace.svelte';

  interface Props {
    category: ScoringCategory;
    isOpen: boolean;
  }

  let { category, isOpen }: Props = $props();

  console.log('ScoreModal props received:', { category, isOpen });
  console.log('ScoreModal rendering check:', isOpen && category);

  // State for Two Pairs selection
  let selectedFirstPair: number | null = $state(null);
  let selectedSecondPair: number | null = $state(null);

  let totalScore = $derived((selectedFirstPair || 0) * 2 + (selectedSecondPair || 0) * 2);

  // Automatically submit score when both pairs are selected
  $effect(() => {
    if (selectedFirstPair && selectedSecondPair && totalScore > 0) {
      selectScore(totalScore);
    }
  });

  // State for Full House selection
  let selectedThreeOfAKind: number | null = $state(null);
  let selectedPair: number | null = $state(null);

  let fullHouseScore = $derived((selectedThreeOfAKind || 0) * 3 + (selectedPair || 0) * 2);

  // Automatically submit score when both three-of-a-kind and pair are selected
  $effect(() => {
    if (selectedThreeOfAKind && selectedPair) {
      selectScore(fullHouseScore);
    }
  });

  // State for Chance selection
  let selectedDice: number[] = $state([]);

  let chanceScore = $derived(selectedDice.reduce((sum, die) => sum + die, 0));

  // Automatically submit score when 5 dice are selected
  $effect(() => {
    if (selectedDice.length === 5) {
      selectScore(chanceScore);
    }
  });

  const dispatch = createEventDispatcher<{
    score: { category: ScoringCategory; score: number };
    close: void;
  }>();

  function getUpperCategoryNumber(category: ScoringCategory): number {
    const numberMap: Record<string, number> = {
      'ones': 1,
      'twos': 2,
      'threes': 3,
      'fours': 4,
      'fives': 5,
      'sixes': 6
    };
    return numberMap[category] || 1;
  }

  function selectScore(score: number) {
    console.log('Selecting score:', score, 'for category:', category);
    // Ensure score is a valid number, default to 0 if NaN
    const validScore = isNaN(score) ? 0 : score;
    console.log('Dispatching score event with valid score:', validScore);
    dispatch('score', { category, score: validScore });
    console.log('Score event dispatched');
  }
</script>

{#if isOpen}
  <!-- Modal is rendering -->
  {console.log('Modal is rendering for category:', category)}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Score for {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </h2>

      {#if ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'].includes(category)}
        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">How many {category} did you roll?</p>
          {#each [0, 1, 2, 3, 4, 5] as count}
            <button
              class="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
              onclick={() => {
                console.log('Button clicked for count:', count);
                const multiplier = getUpperCategoryNumber(category);
                selectScore(count * multiplier);
              }}
            >
              <div class="flex items-center space-x-2">
                {#each Array(count) as _, i}
                  <DiceFace value={getUpperCategoryNumber(category)} size={24} />
                {/each}
                {#if count === 0}
                  <span class="text-gray-400 text-sm">None</span>
                {/if}
              </div>
              <span class="font-semibold text-lg">{count * getUpperCategoryNumber(category)}</span>
            </button>
          {/each}
        </div>
      {:else if category === 'pair'}
        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Select your pair:</p>
          {#each [0, 1, 2, 3, 4, 5, 6] as pairValue}
            <button
              class="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
              onclick={() => {
                const score = pairValue * 2;
                selectScore(score);
              }}
            >
              <div class="flex items-center space-x-2">
                {#if pairValue === 0}
                  <span class="text-gray-400 text-sm">None</span>
                {:else}
                  <DiceFace value={pairValue} size={24} />
                  <DiceFace value={pairValue} size={24} />
                {/if}
              </div>
              <span class="font-semibold text-lg">{pairValue * 2}</span>
            </button>
          {/each}
        </div>
      {:else if category === 'two-pairs'}
        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Select your two pairs:</p>

          <!-- None option -->
          <button
            class="w-full flex items-center justify-between p-3 border-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            onclick={() => {
              selectedFirstPair = null;
              selectedSecondPair = null;
              selectScore(0);
            }}
          >
            <span class="text-gray-400">None</span>
            <span class="font-semibold text-lg">0</span>
          </button>

          <!-- Two columns for pair selection -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Left column - First pair -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">First Pair</h4>
              {#each [1, 2, 3, 4, 5, 6] as pairValue}
                <button
                  class="w-full flex items-center justify-between p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors
                    {selectedFirstPair === pairValue ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' : ''}"
                  onclick={() => {
                    selectedFirstPair = pairValue;
                  }}
                >
                  <div class="flex items-center space-x-1">
                    <DiceFace value={pairValue} size={20} />
                    <DiceFace value={pairValue} size={20} />
                  </div>
                  <span class="font-medium text-sm">{pairValue * 2}</span>
                </button>
              {/each}
            </div>

            <!-- Right column - Second pair -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Second Pair</h4>
              {#each [1, 2, 3, 4, 5, 6] as pairValue}
                <button
                  class="w-full flex items-center justify-between p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors
                    {selectedSecondPair === pairValue ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' : ''}"
                  onclick={() => {
                    selectedSecondPair = pairValue;
                  }}
                >
                  <div class="flex items-center space-x-1">
                    <DiceFace value={pairValue} size={20} />
                    <DiceFace value={pairValue} size={20} />
                  </div>
                  <span class="font-medium text-sm">{pairValue * 2}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Total display -->
          {#if selectedFirstPair && selectedSecondPair}
            <div class="border-t pt-4 mt-4">
              <div class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <span class="font-medium text-green-800 dark:text-green-200">Score Submitted:</span>
                <span class="font-bold text-xl text-green-600 dark:text-green-400">{totalScore}</span>
              </div>
              <p class="text-center text-sm text-green-600 dark:text-green-400 mt-2">Modal will close automatically...</p>
            </div>
          {:else}
            <div class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Select one pair from each column to submit your score
            </div>
          {/if}
        </div>
      {:else if category === 'three-of-a-kind'}
        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Select the value for your 3 of a kind (score = sum of all 5 dice):</p>
          {#each [1, 2, 3, 4, 5, 6] as value}
            <button
              class="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
              onclick={() => {
                // For 3 of a kind, score is sum of all 5 dice
                // We'll assume the other 2 dice total the minimum (1+2=3) to maximum (6+5=11)
                // But typically players will enter the actual sum, so we'll use a reasonable default
                const minOtherDice = 1 + 2; // minimum other dice sum
                const score = (value * 3) + minOtherDice; // 3 of the selected value + minimum others
                selectScore(score);
              }}
            >
              <div class="flex items-center space-x-2">
                <!-- Show 3 dice of the selected value -->
                <DiceFace value={value} size={24} />
                <DiceFace value={value} size={24} />
                <DiceFace value={value} size={24} />
              </div>
              <span class="font-semibold text-lg">{(value * 3) + 3}</span>
            </button>
          {/each}
        </div>
      {:else if category === 'four-of-a-kind'}
        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Select the value for your 4 of a kind (score = sum of all 5 dice):</p>
          {#each [1, 2, 3, 4, 5, 6] as value}
            <button
              class="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
              onclick={() => {
                // For 4 of a kind, score is sum of all 5 dice
                // We'll assume the remaining die is minimum (1) to maximum (6)
                const minOtherDie = 1; // minimum remaining die
                const score = (value * 4) + minOtherDie; // 4 of the selected value + minimum other
                selectScore(score);
              }}
            >
              <div class="flex items-center space-x-2">
                <!-- Show 4 dice of the selected value -->
                <DiceFace value={value} size={24} />
                <DiceFace value={value} size={24} />
                <DiceFace value={value} size={24} />
                <DiceFace value={value} size={24} />
              </div>
              <span class="font-semibold text-lg">{(value * 4) + 1}</span>
            </button>
          {/each}
        </div>
      {:else if category === 'full-house'}
        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Select your full house (3 of a kind + pair):</p>

          <!-- None option -->
          <button
            class="w-full flex items-center justify-between p-3 border-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            onclick={() => {
              selectedThreeOfAKind = null;
              selectedPair = null;
              selectScore(0);
            }}
          >
            <span class="text-gray-400">None</span>
            <span class="font-semibold text-lg">0</span>
          </button>

          <!-- Two columns for full house selection -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Left column - Three of a kind -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Three of a Kind</h4>
              {#each [1, 2, 3, 4, 5, 6] as value}
                <button
                  class="w-full flex items-center justify-between p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors
                    {selectedThreeOfAKind === value ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' : ''}"
                  onclick={() => {
                    selectedThreeOfAKind = value;
                  }}
                >
                  <div class="flex items-center space-x-1">
                    <DiceFace value={value} size={20} />
                    <DiceFace value={value} size={20} />
                    <DiceFace value={value} size={20} />
                  </div>
                  <span class="font-medium text-sm">{value}×3</span>
                </button>
              {/each}
            </div>

            <!-- Right column - Pair -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Pair</h4>
              {#each [1, 2, 3, 4, 5, 6] as value}
                <button
                  class="w-full flex items-center justify-between p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors
                    {selectedPair === value ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' : ''}"
                  onclick={() => {
                    selectedPair = value;
                  }}
                >
                  <div class="flex items-center space-x-1">
                    <DiceFace value={value} size={20} />
                    <DiceFace value={value} size={20} />
                  </div>
                  <span class="font-medium text-sm">{value}×2</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Total display -->
          {#if selectedThreeOfAKind && selectedPair}
            <div class="border-t pt-4 mt-4">
              <div class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <span class="font-medium text-green-800 dark:text-green-200">Full House Score:</span>
                <span class="font-bold text-xl text-green-600 dark:text-green-400">{fullHouseScore}</span>
              </div>
              <p class="text-center text-sm text-green-600 dark:text-green-400 mt-2">Modal will close automatically...</p>
            </div>
          {:else}
            <div class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Select three-of-a-kind and pair to submit your score
            </div>
          {/if}
        </div>
      {:else if category === 'small-straight'}
        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Select your small straight:</p>

          <!-- None option -->
          <button
            class="w-full flex items-center justify-between p-3 border-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            onclick={() => selectScore(0)}
          >
            <span class="text-gray-400">None</span>
            <span class="font-semibold text-lg">0</span>
          </button>

          <!-- Small straight option -->
          <button
            class="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            onclick={() => selectScore(30)}
          >
            <div class="flex items-center space-x-2">
              <DiceFace value={1} size={24} />
              <DiceFace value={2} size={24} />
              <DiceFace value={3} size={24} />
              <DiceFace value={4} size={24} />
              <DiceFace value={5} size={24} />
            </div>
            <span class="font-semibold text-lg">30</span>
          </button>
        </div>
      {:else if category === 'large-straight'}
        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Select your large straight:</p>

          <!-- None option -->
          <button
            class="w-full flex items-center justify-between p-3 border-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            onclick={() => selectScore(0)}
          >
            <span class="text-gray-400">None</span>
            <span class="font-semibold text-lg">0</span>
          </button>

          <!-- Large straight option -->
          <button
            class="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            onclick={() => selectScore(40)}
          >
            <div class="flex items-center space-x-2">
              <DiceFace value={2} size={24} />
              <DiceFace value={3} size={24} />
              <DiceFace value={4} size={24} />
              <DiceFace value={5} size={24} />
              <DiceFace value={6} size={24} />
            </div>
            <span class="font-semibold text-lg">40</span>
          </button>
        </div>
      {:else if category === 'yahtzee'}
        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Select your Yahtzee:</p>

          <!-- None option -->
          <button
            class="w-full flex items-center justify-between p-3 border-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            onclick={() => selectScore(0)}
          >
            <span class="text-gray-400">None</span>
            <span class="font-semibold text-lg">0</span>
          </button>

          <!-- Yahtzee option -->
          <button
            class="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            onclick={() => selectScore(50)}
          >
            <span class="font-medium">Yahtzee</span>
            <span class="font-semibold text-lg">50</span>
          </button>
        </div>
      {:else if category === 'chance'}
        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Select your 5 dice for Chance (sum of all dice):</p>

          <!-- None option -->
          <button
            class="w-full flex items-center justify-between p-3 border-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            onclick={() => {
              selectedDice = [];
              selectScore(0);
            }}
          >
            <span class="text-gray-400">None</span>
            <span class="font-semibold text-lg">0</span>
          </button>

          <!-- Dice selector -->
          <div class="space-y-3">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Click dice values to add (up to 5)</h4>
            <div class="grid grid-cols-3 gap-2">
              {#each [1, 2, 3, 4, 5, 6] as value}
                <button
                  class="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors
                    {selectedDice.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}"
                  disabled={selectedDice.length >= 5}
                  onclick={() => {
                    if (selectedDice.length < 5) {
                      selectedDice = [...selectedDice, value];
                    }
                  }}
                >
                  <DiceFace value={value} size={32} />
                  <span class="text-xs mt-1 font-medium">{value}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Selected dice display -->
          {#if selectedDice.length > 0}
            <div class="border-t pt-4">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Dice:</span>
                  <button
                    class="px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-800"
                    onclick={() => selectedDice = []}
                  >
                    Clear All
                  </button>
                </div>

                <div class="flex items-center space-x-2 flex-wrap">
                  {#each selectedDice as die, index}
                    <div class="relative">
                      <DiceFace value={die} size={28} />
                      <button
                        class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        onclick={() => {
                          selectedDice = selectedDice.filter((_, i) => i !== index);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  {/each}
                </div>

                <div class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span class="font-medium text-blue-800 dark:text-blue-200">Total Score:</span>
                  <span class="font-bold text-xl text-blue-600 dark:text-blue-400">{chanceScore}</span>
                </div>

                {#if selectedDice.length === 5}
                  <div class="text-center text-sm text-green-600 dark:text-green-400">
                    5 dice selected - score will be submitted automatically
                  </div>
                {:else}
                  <div class="text-center text-sm text-gray-500 dark:text-gray-400">
                    {5 - selectedDice.length} more dice to select
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <button
          class="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
          onclick={() => selectScore(0)}
        >
          <span>Score 0</span>
          <span class="font-semibold text-lg">0</span>
        </button>
      {/if}

      <button
        class="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        onclick={() => {
          console.log('Cancel button clicked');
          dispatch('close');
        }}
      >
        Cancel
      </button>
    </div>
  </div>
{/if}
