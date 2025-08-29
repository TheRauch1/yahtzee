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
			ones: 1,
			twos: 2,
			threes: 3,
			fours: 4,
			fives: 5,
			sixes: 6
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
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
		<div class="modal-card max-h-[80vh] w-full max-w-2xl overflow-y-auto p-6">
			<h2 class="mb-4 text-2xl font-extrabold">
				Score for {category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
			</h2>

			{#if ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'].includes(category)}
				<div class="space-y-3">
					<p class="text-muted mb-4 text-sm">How many {category} did you roll?</p>
					{#each [0, 1, 2, 3, 4, 5] as count}
						<button
							class="flex w-full items-center justify-between rounded-lg border p-3 transition-shadow hover:shadow-sm"
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
									<span class="text-sm text-gray-400">None</span>
								{/if}
							</div>
							<span class="text-foreground text-lg font-semibold"
								>{count * getUpperCategoryNumber(category)}</span
							>
						</button>
					{/each}
				</div>
			{:else if category === 'pair'}
				<div class="space-y-3">
					<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">Select your pair:</p>
					{#each [0, 1, 2, 3, 4, 5, 6] as pairValue}
						<button
							class="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
							onclick={() => {
								const score = pairValue * 2;
								selectScore(score);
							}}
						>
							<div class="flex items-center space-x-2">
								{#if pairValue === 0}
									<span class="text-sm text-gray-400">None</span>
								{:else}
									<DiceFace value={pairValue} size={24} />
									<DiceFace value={pairValue} size={24} />
								{/if}
							</div>
							<span class="text-lg font-semibold">{pairValue * 2}</span>
						</button>
					{/each}
				</div>
			{:else if category === 'two-pairs'}
				<div class="space-y-4">
					<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">Select your two pairs:</p>

					<!-- None option -->
					<button
						class="flex w-full items-center justify-between rounded-lg border-2 p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						onclick={() => {
							selectedFirstPair = null;
							selectedSecondPair = null;
							selectScore(0);
						}}
					>
						<span class="text-gray-400">None</span>
						<span class="text-lg font-semibold">0</span>
					</button>

					<!-- Two columns for pair selection -->
					<div class="grid grid-cols-2 gap-4">
						<!-- Left column - First pair -->
						<div class="space-y-2">
							<h4 class="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
								First Pair
							</h4>
							{#each [1, 2, 3, 4, 5, 6] as pairValue}
								<button
									class="flex w-full items-center justify-between rounded border p-2 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700
                    {selectedFirstPair === pairValue
										? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
										: ''}"
									onclick={() => {
										selectedFirstPair = pairValue;
									}}
								>
									<div class="flex items-center space-x-1">
										<DiceFace value={pairValue} size={20} />
										<DiceFace value={pairValue} size={20} />
									</div>
									<span class="text-sm font-medium">{pairValue * 2}</span>
								</button>
							{/each}
						</div>

						<!-- Right column - Second pair -->
						<div class="space-y-2">
							<h4 class="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
								Second Pair
							</h4>
							{#each [1, 2, 3, 4, 5, 6] as pairValue}
								<button
									class="flex w-full items-center justify-between rounded border p-2 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700
                    {selectedSecondPair === pairValue
										? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
										: ''}"
									onclick={() => {
										selectedSecondPair = pairValue;
									}}
								>
									<div class="flex items-center space-x-1">
										<DiceFace value={pairValue} size={20} />
										<DiceFace value={pairValue} size={20} />
									</div>
									<span class="text-sm font-medium">{pairValue * 2}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Total display -->
					{#if selectedFirstPair && selectedSecondPair}
						<div class="mt-4 border-t pt-4">
							<div
								class="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/10"
							>
								<span class="font-medium text-green-800 dark:text-green-200">Score Submitted:</span>
								<span class="text-xl font-bold text-green-700 dark:text-green-300"
									>{totalScore}</span
								>
							</div>
							<p class="mt-2 text-center text-sm text-green-600 dark:text-green-400">
								Modal will close automatically...
							</p>
						</div>
					{:else}
						<div class="text-muted mt-4 text-center text-sm">
							Select one pair from each column to submit your score
						</div>
					{/if}
				</div>
			{:else if category === 'three-of-a-kind'}
				<div class="space-y-3">
					<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
						Select the value for your 3 of a kind (score = sum of all 5 dice):
					</p>
					{#each [1, 2, 3, 4, 5, 6] as value}
						<button
							class="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
							onclick={() => {
								// For 3 of a kind, score is sum of all 5 dice
								// We'll assume the other 2 dice total the minimum (1+2=3) to maximum (6+5=11)
								// But typically players will enter the actual sum, so we'll use a reasonable default
								const minOtherDice = 1 + 2; // minimum other dice sum
								const score = value * 3 + minOtherDice; // 3 of the selected value + minimum others
								selectScore(score);
							}}
						>
							<div class="flex items-center space-x-2">
								<!-- Show 3 dice of the selected value -->
								<DiceFace {value} size={24} />
								<DiceFace {value} size={24} />
								<DiceFace {value} size={24} />
							</div>
							<span class="text-lg font-semibold">{value * 3 + 3}</span>
						</button>
					{/each}
				</div>
			{:else if category === 'four-of-a-kind'}
				<div class="space-y-3">
					<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
						Select the value for your 4 of a kind (score = sum of all 5 dice):
					</p>
					{#each [1, 2, 3, 4, 5, 6] as value}
						<button
							class="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
							onclick={() => {
								// For 4 of a kind, score is sum of all 5 dice
								// We'll assume the remaining die is minimum (1) to maximum (6)
								const minOtherDie = 1; // minimum remaining die
								const score = value * 4 + minOtherDie; // 4 of the selected value + minimum other
								selectScore(score);
							}}
						>
							<div class="flex items-center space-x-2">
								<!-- Show 4 dice of the selected value -->
								<DiceFace {value} size={24} />
								<DiceFace {value} size={24} />
								<DiceFace {value} size={24} />
								<DiceFace {value} size={24} />
							</div>
							<span class="text-lg font-semibold">{value * 4 + 1}</span>
						</button>
					{/each}
				</div>
			{:else if category === 'full-house'}
				<div class="space-y-4">
					<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
						Select your full house (3 of a kind + pair):
					</p>

					<!-- None option -->
					<button
						class="flex w-full items-center justify-between rounded-lg border-2 p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						onclick={() => {
							selectedThreeOfAKind = null;
							selectedPair = null;
							selectScore(0);
						}}
					>
						<span class="text-gray-400">None</span>
						<span class="text-lg font-semibold">0</span>
					</button>

					<!-- Two columns for full house selection -->
					<div class="grid grid-cols-2 gap-4">
						<!-- Left column - Three of a kind -->
						<div class="space-y-2">
							<h4 class="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
								Three of a Kind
							</h4>
							{#each [1, 2, 3, 4, 5, 6] as value}
								<button
									class="flex w-full items-center justify-between rounded border p-2 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700
                    {selectedThreeOfAKind === value
										? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
										: ''}"
									onclick={() => {
										selectedThreeOfAKind = value;
									}}
								>
									<div class="flex items-center space-x-1">
										<DiceFace {value} size={20} />
										<DiceFace {value} size={20} />
										<DiceFace {value} size={20} />
									</div>
									<span class="text-sm font-medium">{value}×3</span>
								</button>
							{/each}
						</div>

						<!-- Right column - Pair -->
						<div class="space-y-2">
							<h4 class="text-center text-sm font-medium text-gray-700 dark:text-gray-300">Pair</h4>
							{#each [1, 2, 3, 4, 5, 6] as value}
								<button
									class="flex w-full items-center justify-between rounded border p-2 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700
                    {selectedPair === value ? 'border-blue-500 bg-blue-100 dark:bg-blue-900' : ''}"
									onclick={() => {
										selectedPair = value;
									}}
								>
									<div class="flex items-center space-x-1">
										<DiceFace {value} size={20} />
										<DiceFace {value} size={20} />
									</div>
									<span class="text-sm font-medium">{value}×2</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Total display -->
					{#if selectedThreeOfAKind && selectedPair}
						<div class="mt-4 border-t pt-4">
							<div
								class="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20"
							>
								<span class="font-medium text-green-800 dark:text-green-200">Full House Score:</span
								>
								<span class="text-xl font-bold text-green-600 dark:text-green-400"
									>{fullHouseScore}</span
								>
							</div>
							<p class="mt-2 text-center text-sm text-green-600 dark:text-green-400">
								Modal will close automatically...
							</p>
						</div>
					{:else}
						<div class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
							Select three-of-a-kind and pair to submit your score
						</div>
					{/if}
				</div>
			{:else if category === 'small-straight'}
				<div class="space-y-3">
					<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">Select your small straight:</p>

					<!-- None option -->
					<button
						class="flex w-full items-center justify-between rounded-lg border-2 p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						onclick={() => selectScore(0)}
					>
						<span class="text-gray-400">None</span>
						<span class="text-lg font-semibold">0</span>
					</button>

					<!-- Small straight option -->
					<button
						class="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						onclick={() => selectScore(30)}
					>
						<div class="flex items-center space-x-2">
							<DiceFace value={1} size={24} />
							<DiceFace value={2} size={24} />
							<DiceFace value={3} size={24} />
							<DiceFace value={4} size={24} />
							<DiceFace value={5} size={24} />
						</div>
						<span class="text-lg font-semibold">30</span>
					</button>
				</div>
			{:else if category === 'large-straight'}
				<div class="space-y-3">
					<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">Select your large straight:</p>

					<!-- None option -->
					<button
						class="flex w-full items-center justify-between rounded-lg border-2 p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						onclick={() => selectScore(0)}
					>
						<span class="text-gray-400">None</span>
						<span class="text-lg font-semibold">0</span>
					</button>

					<!-- Large straight option -->
					<button
						class="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						onclick={() => selectScore(40)}
					>
						<div class="flex items-center space-x-2">
							<DiceFace value={2} size={24} />
							<DiceFace value={3} size={24} />
							<DiceFace value={4} size={24} />
							<DiceFace value={5} size={24} />
							<DiceFace value={6} size={24} />
						</div>
						<span class="text-lg font-semibold">40</span>
					</button>
				</div>
			{:else if category === 'yahtzee'}
				<div class="space-y-3">
					<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">Select your Yahtzee:</p>

					<!-- None option -->
					<button
						class="flex w-full items-center justify-between rounded-lg border-2 p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						onclick={() => selectScore(0)}
					>
						<span class="text-gray-400">None</span>
						<span class="text-lg font-semibold">0</span>
					</button>

					<!-- Yahtzee option -->
					<button
						class="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						onclick={() => selectScore(50)}
					>
						<span class="font-medium">Yahtzee</span>
						<span class="text-lg font-semibold">50</span>
					</button>
				</div>
			{:else if category === 'chance'}
				<div class="space-y-4">
					<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
						Select your 5 dice for Chance (sum of all dice):
					</p>

					<!-- None option -->
					<button
						class="flex w-full items-center justify-between rounded-lg border-2 p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						onclick={() => {
							selectedDice = [];
							selectScore(0);
						}}
					>
						<span class="text-gray-400">None</span>
						<span class="text-lg font-semibold">0</span>
					</button>

					<!-- Dice selector -->
					<div class="space-y-3">
						<h4 class="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
							Click dice values to add (up to 5)
						</h4>
						<div class="grid grid-cols-3 gap-2">
							{#each [1, 2, 3, 4, 5, 6] as value}
								<button
									class="flex flex-col items-center justify-center rounded-lg border p-3 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700
                    {selectedDice.length >= 5 ? 'cursor-not-allowed opacity-50' : ''}"
									disabled={selectedDice.length >= 5}
									onclick={() => {
										if (selectedDice.length < 5) {
											selectedDice = [...selectedDice, value];
										}
									}}
								>
									<DiceFace {value} size={32} />
									<span class="mt-1 text-xs font-medium">{value}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Selected dice display -->
					{#if selectedDice.length > 0}
						<div class="border-t pt-4">
							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700 dark:text-gray-300"
										>Selected Dice:</span
									>
									<button
										class="rounded bg-red-100 px-3 py-1 text-xs text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800"
										onclick={() => (selectedDice = [])}
									>
										Clear All
									</button>
								</div>

								<div class="flex flex-wrap items-center space-x-2">
									{#each selectedDice as die, index}
										<div class="relative">
											<DiceFace value={die} size={28} />
											<button
												class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
												onclick={() => {
													selectedDice = selectedDice.filter((_, i) => i !== index);
												}}
											>
												×
											</button>
										</div>
									{/each}
								</div>

								<div
									class="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/10"
								>
									<span class="font-medium text-blue-800 dark:text-blue-200">Total Score:</span>
									<span class="text-xl font-bold text-blue-700 dark:text-blue-300"
										>{chanceScore}</span
									>
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
					class="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
					onclick={() => selectScore(0)}
				>
					<span>Score 0</span>
					<span class="text-lg font-semibold">0</span>
				</button>
			{/if}

			<div class="mt-4 flex gap-3">
				<button
					class="btn-primary flex-1 rounded-md px-4 py-2 font-semibold shadow-sm"
					onclick={() => {
						// keep modal open - this is a quick save/confirm visual but most flows auto-submit
						console.log('Confirm (no-op)');
					}}
				>
					Confirm
				</button>
				<button
					class="flex-1 rounded-md border border-neutral-300 bg-transparent px-4 py-2 text-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
					onclick={() => {
						console.log('Cancel button clicked');
						dispatch('close');
					}}
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
