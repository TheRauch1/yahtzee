<script lang="ts">
	import type { ScoringCategory } from './types';
	import { CATEGORY_NAMES, UPPER_CATEGORIES } from './types';
	import DiceFace from './DiceFace.svelte';
	import {
		LARGE_STRAIGHT_POINTS,
		SMALL_STRAIGHT_POINTS,
		YAHTZEE_POINTS,
		chanceScore,
		fourOfAKindScore,
		fullHouseScore,
		pairScore,
		threeOfAKindScore,
		twoPairsScore,
		upperCategoryScore,
		upperCategoryValue
	} from './scoring';

	interface Props {
		category: ScoringCategory;
		/** The score already recorded for this category, or null if it is still unscored. */
		current: number | null;
		onscore: (score: number) => void;
		onerase: () => void;
		onclose: () => void;
	}

	let { category, current, onscore, onerase, onclose }: Props = $props();

	const DIE_VALUES = [1, 2, 3, 4, 5, 6];
	const MAX_CHANCE_DICE = 5;

	let dialog = $state<HTMLDialogElement | null>(null);

	// Two pairs / full house are picked one column at a time and submit once both halves are chosen.
	let firstPair = $state<number | null>(null);
	let secondPair = $state<number | null>(null);
	let threeOfAKind = $state<number | null>(null);
	let fullHousePair = $state<number | null>(null);
	let selectedDice = $state<number[]>([]);

	let isUpper = $derived(UPPER_CATEGORIES.includes(category));

	$effect(() => {
		// showModal() gives us focus trapping, focus restore, Escape handling and an
		// inert background for free, so none of that needs hand-rolling here.
		dialog?.showModal();
	});

	function submit(score: number) {
		onscore(Number.isNaN(score) ? 0 : score);
	}

	function pickFirstPair(value: number) {
		firstPair = value;
		if (secondPair !== null) submit(twoPairsScore(firstPair, secondPair));
	}

	function pickSecondPair(value: number) {
		secondPair = value;
		if (firstPair !== null) submit(twoPairsScore(firstPair, secondPair));
	}

	function pickThreeOfAKind(value: number) {
		threeOfAKind = value;
		if (fullHousePair !== null) submit(fullHouseScore(threeOfAKind, fullHousePair));
	}

	function pickFullHousePair(value: number) {
		fullHousePair = value;
		if (threeOfAKind !== null) submit(fullHouseScore(threeOfAKind, fullHousePair));
	}

	function addDie(value: number) {
		if (selectedDice.length >= MAX_CHANCE_DICE) return;

		selectedDice = [...selectedDice, value];
		if (selectedDice.length === MAX_CHANCE_DICE) submit(chanceScore(selectedDice));
	}

	function onDialogClick(event: MouseEvent) {
		// A click that lands on the dialog itself rather than its content is a backdrop click.
		if (event.target === dialog) onclose();
	}
</script>

<dialog
	bind:this={dialog}
	class="modal-card m-auto max-h-[80vh] w-full max-w-2xl overflow-y-auto p-6 backdrop:bg-black/50"
	aria-labelledby="score-modal-title"
	{onclose}
	onclick={onDialogClick}
>
	<h2 id="score-modal-title" class="mb-4 text-2xl font-extrabold">
		Score for {CATEGORY_NAMES[category]}
	</h2>

	{#if isUpper}
		<div class="space-y-3">
			<p class="text-muted mb-4 text-sm">
				How many {CATEGORY_NAMES[category].toLowerCase()} did you roll?
			</p>
			{#each [0, 1, 2, 3, 4, 5] as count (count)}
				<button
					class="flex w-full items-center justify-between rounded-lg border border-[var(--table-border)] p-3 transition-shadow hover:shadow-sm"
					onclick={() => submit(upperCategoryScore(category, count))}
				>
					<div class="flex items-center space-x-2">
						{#each { length: count }, index (index)}
							<DiceFace value={upperCategoryValue(category)} size={24} />
						{/each}
						{#if count === 0}
							<span class="text-muted text-sm">None</span>
						{/if}
					</div>
					<span class="text-foreground text-lg font-semibold">
						{upperCategoryScore(category, count)}
					</span>
				</button>
			{/each}
		</div>
	{:else if category === 'pair'}
		<div class="space-y-3">
			<p class="text-muted mb-4 text-sm">Select your pair:</p>
			{#each [0, ...DIE_VALUES] as value (value)}
				<button
					class="flex w-full items-center justify-between rounded-lg border border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
					onclick={() => submit(pairScore(value))}
				>
					<div class="flex items-center space-x-2">
						{#if value === 0}
							<span class="text-muted text-sm">None</span>
						{:else}
							<DiceFace {value} size={24} />
							<DiceFace {value} size={24} />
						{/if}
					</div>
					<span class="text-lg font-semibold">{pairScore(value)}</span>
				</button>
			{/each}
		</div>
	{:else if category === 'two-pairs'}
		<div class="space-y-4">
			<p class="text-muted mb-4 text-sm">Select your two pairs:</p>

			<button
				class="flex w-full items-center justify-between rounded-lg border-2 border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
				onclick={() => submit(0)}
			>
				<span class="text-muted">None</span>
				<span class="text-lg font-semibold">0</span>
			</button>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<h3 class="text-muted text-center text-sm font-medium">First Pair</h3>
					{#each DIE_VALUES as value (value)}
						<button
							class="flex w-full items-center justify-between rounded border p-2 transition-colors hover:bg-[var(--hover)] {firstPair ===
							value
								? 'border-blue-500 bg-blue-500/20'
								: 'border-[var(--table-border)]'}"
							aria-pressed={firstPair === value}
							onclick={() => pickFirstPair(value)}
						>
							<div class="flex items-center space-x-1">
								<DiceFace {value} size={20} />
								<DiceFace {value} size={20} />
							</div>
							<span class="text-sm font-medium">{pairScore(value)}</span>
						</button>
					{/each}
				</div>

				<div class="space-y-2">
					<h3 class="text-muted text-center text-sm font-medium">Second Pair</h3>
					{#each DIE_VALUES as value (value)}
						<button
							class="flex w-full items-center justify-between rounded border p-2 transition-colors hover:bg-[var(--hover)] {secondPair ===
							value
								? 'border-blue-500 bg-blue-500/20'
								: 'border-[var(--table-border)]'}"
							aria-pressed={secondPair === value}
							onclick={() => pickSecondPair(value)}
						>
							<div class="flex items-center space-x-1">
								<DiceFace {value} size={20} />
								<DiceFace {value} size={20} />
							</div>
							<span class="text-sm font-medium">{pairScore(value)}</span>
						</button>
					{/each}
				</div>
			</div>

			<p class="text-muted mt-4 text-center text-sm">
				Select one pair from each column to submit your score
			</p>
		</div>
	{:else if category === 'three-of-a-kind'}
		<div class="space-y-3">
			<p class="text-muted mb-4 text-sm">
				Select the value for your three of a kind (house rule: the other two dice count as 3):
			</p>

			<button
				class="flex w-full items-center justify-between rounded-lg border-2 border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
				onclick={() => submit(0)}
			>
				<span class="text-muted">None</span>
				<span class="text-lg font-semibold">0</span>
			</button>

			{#each DIE_VALUES as value (value)}
				<button
					class="flex w-full items-center justify-between rounded-lg border border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
					onclick={() => submit(threeOfAKindScore(value))}
				>
					<div class="flex items-center space-x-2">
						<DiceFace {value} size={24} />
						<DiceFace {value} size={24} />
						<DiceFace {value} size={24} />
					</div>
					<span class="text-lg font-semibold">{threeOfAKindScore(value)}</span>
				</button>
			{/each}
		</div>
	{:else if category === 'four-of-a-kind'}
		<div class="space-y-3">
			<p class="text-muted mb-4 text-sm">
				Select the value for your four of a kind (house rule: the remaining die counts as 1):
			</p>

			<button
				class="flex w-full items-center justify-between rounded-lg border-2 border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
				onclick={() => submit(0)}
			>
				<span class="text-muted">None</span>
				<span class="text-lg font-semibold">0</span>
			</button>

			{#each DIE_VALUES as value (value)}
				<button
					class="flex w-full items-center justify-between rounded-lg border border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
					onclick={() => submit(fourOfAKindScore(value))}
				>
					<div class="flex items-center space-x-2">
						<DiceFace {value} size={24} />
						<DiceFace {value} size={24} />
						<DiceFace {value} size={24} />
						<DiceFace {value} size={24} />
					</div>
					<span class="text-lg font-semibold">{fourOfAKindScore(value)}</span>
				</button>
			{/each}
		</div>
	{:else if category === 'full-house'}
		<div class="space-y-4">
			<p class="text-muted mb-4 text-sm">Select your full house (3 of a kind + pair):</p>

			<button
				class="flex w-full items-center justify-between rounded-lg border-2 border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
				onclick={() => submit(0)}
			>
				<span class="text-muted">None</span>
				<span class="text-lg font-semibold">0</span>
			</button>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<h3 class="text-muted text-center text-sm font-medium">Three of a Kind</h3>
					{#each DIE_VALUES as value (value)}
						<button
							class="flex w-full items-center justify-between rounded border p-2 transition-colors hover:bg-[var(--hover)] {threeOfAKind ===
							value
								? 'border-blue-500 bg-blue-500/20'
								: 'border-[var(--table-border)]'}"
							aria-pressed={threeOfAKind === value}
							onclick={() => pickThreeOfAKind(value)}
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

				<div class="space-y-2">
					<h3 class="text-muted text-center text-sm font-medium">Pair</h3>
					{#each DIE_VALUES as value (value)}
						<button
							class="flex w-full items-center justify-between rounded border p-2 transition-colors hover:bg-[var(--hover)] {fullHousePair ===
							value
								? 'border-blue-500 bg-blue-500/20'
								: 'border-[var(--table-border)]'}"
							aria-pressed={fullHousePair === value}
							onclick={() => pickFullHousePair(value)}
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

			<p class="text-muted mt-4 text-center text-sm">
				Select three-of-a-kind and pair to submit your score
			</p>
		</div>
	{:else if category === 'small-straight' || category === 'large-straight'}
		{@const isSmall = category === 'small-straight'}
		{@const points = isSmall ? SMALL_STRAIGHT_POINTS : LARGE_STRAIGHT_POINTS}
		{@const faces = isSmall ? [1, 2, 3, 4, 5] : [2, 3, 4, 5, 6]}
		<div class="space-y-3">
			<p class="text-muted mb-4 text-sm">
				Select your {isSmall ? 'small' : 'large'} straight:
			</p>

			<button
				class="flex w-full items-center justify-between rounded-lg border-2 border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
				onclick={() => submit(0)}
			>
				<span class="text-muted">None</span>
				<span class="text-lg font-semibold">0</span>
			</button>

			<button
				class="flex w-full items-center justify-between rounded-lg border border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
				onclick={() => submit(points)}
			>
				<div class="flex items-center space-x-2">
					{#each faces as value (value)}
						<DiceFace {value} size={24} />
					{/each}
				</div>
				<span class="text-lg font-semibold">{points}</span>
			</button>
		</div>
	{:else if category === 'yahtzee'}
		<div class="space-y-3">
			<p class="text-muted mb-4 text-sm">Select your Yahtzee:</p>

			<button
				class="flex w-full items-center justify-between rounded-lg border-2 border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
				onclick={() => submit(0)}
			>
				<span class="text-muted">None</span>
				<span class="text-lg font-semibold">0</span>
			</button>

			<button
				class="flex w-full items-center justify-between rounded-lg border border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
				onclick={() => submit(YAHTZEE_POINTS)}
			>
				<span class="font-medium">Yahtzee</span>
				<span class="text-lg font-semibold">{YAHTZEE_POINTS}</span>
			</button>
		</div>
	{:else if category === 'chance'}
		<div class="space-y-4">
			<p class="text-muted mb-4 text-sm">Select your 5 dice for Chance (sum of all dice):</p>

			<button
				class="flex w-full items-center justify-between rounded-lg border-2 border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
				onclick={() => {
					selectedDice = [];
					submit(0);
				}}
			>
				<span class="text-muted">None</span>
				<span class="text-lg font-semibold">0</span>
			</button>

			<div class="space-y-3">
				<h3 class="text-muted text-center text-sm font-medium">
					Click dice values to add (up to {MAX_CHANCE_DICE})
				</h3>
				<div class="grid grid-cols-3 gap-2">
					{#each DIE_VALUES as value (value)}
						<button
							class="flex flex-col items-center justify-center rounded-lg border border-[var(--table-border)] p-3 transition-colors hover:bg-[var(--hover)] disabled:cursor-not-allowed disabled:opacity-50"
							disabled={selectedDice.length >= MAX_CHANCE_DICE}
							aria-label={`Add a ${value}`}
							onclick={() => addDie(value)}
						>
							<DiceFace {value} size={32} />
							<span class="mt-1 text-xs font-medium">{value}</span>
						</button>
					{/each}
				</div>
			</div>

			{#if selectedDice.length > 0}
				<div class="border-t border-[var(--table-border)] pt-4">
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-muted text-sm font-medium">Selected Dice:</span>
							<button
								class="rounded bg-red-500/15 px-3 py-1 text-xs text-red-500 hover:bg-red-500/25"
								onclick={() => (selectedDice = [])}
							>
								Clear All
							</button>
						</div>

						<div class="flex flex-wrap items-center space-x-2">
							{#each selectedDice as die, index (index)}
								<div class="relative">
									<DiceFace value={die} size={28} />
									<button
										class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
										aria-label={`Remove die showing ${die}`}
										onclick={() => (selectedDice = selectedDice.filter((_, i) => i !== index))}
									>
										×
									</button>
								</div>
							{/each}
						</div>

						<div
							class="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-3"
						>
							<span class="font-medium">Total Score:</span>
							<span class="text-xl font-bold">{chanceScore(selectedDice)}</span>
						</div>

						<p class="text-muted text-center text-sm">
							{MAX_CHANCE_DICE - selectedDice.length} more dice to select
						</p>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<button
			class="flex w-full items-center justify-between rounded-lg border border-[var(--table-border)] p-3 hover:bg-[var(--hover)]"
			onclick={() => submit(0)}
		>
			<span>Score 0</span>
			<span class="text-lg font-semibold">0</span>
		</button>
	{/if}

	<div class="mt-4 flex gap-3">
		{#if current !== null}
			<button
				class="flex-1 rounded-md bg-red-500/15 px-4 py-2 text-red-500 hover:bg-red-500/25"
				onclick={onerase}
			>
				Erase score
			</button>
		{/if}
		<button
			class="flex-1 rounded-md border border-[var(--table-border)] bg-transparent px-4 py-2"
			onclick={onclose}
		>
			Cancel
		</button>
	</div>
</dialog>
