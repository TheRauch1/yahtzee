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
		UPPER_CATEGORIES.forEach((cat) => {
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
		LOWER_CATEGORIES.forEach((cat) => {
			const score = player.scores[cat];
			if (score !== null && typeof score === 'number' && !isNaN(score)) {
				total += score;
			}
		});
		return total;
	}

	onMount(() => {
		// Initialize dark mode from localStorage or default to dark mode
		const savedDarkMode = localStorage.getItem('darkMode');
		if (savedDarkMode !== null) {
			if (savedDarkMode === 'false') {
				document.documentElement.classList.add('dark');
			}
		}
		// If no saved preference, default to dark mode (no class needed)
	});

	$effect(() => {
		if (!gameState.darkMode && typeof document !== 'undefined') {
			document.documentElement.classList.add('dark');
			localStorage.setItem('darkMode', 'false');
		} else if (typeof document !== 'undefined') {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('darkMode', 'true');
		}
	});
</script>

<div class="min-h-screen p-6">
	<div class="mx-auto max-w-6xl">
		<header
			class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
		>
			<div>
				<h1 class="text-3xl font-extrabold">Yahtzee Scoreboard</h1>
				<p class="text-muted mt-1 text-sm">
					Keep score, add players, and switch between light and dark themes.
				</p>
			</div>
			<div class="flex items-center space-x-3">
				<button
					class="btn-primary rounded-md border px-4 py-2"
					onclick={toggleDarkMode}
					aria-pressed={gameState.darkMode}
				>
					{gameState.darkMode ? 'Light Mode' : 'Dark Mode'}
				</button>
				<button
					class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
					onclick={resetGame}
				>
					Reset
				</button>
			</div>
		</header>

		{#if gameState.players.length === 0}
			<div class="mb-6 rounded-lg bg-white p-6 dark:bg-gray-800">
				<h2 class="mb-4 text-xl font-semibold">Add Players</h2>
				<div class="mb-4 flex space-x-4">
					<input
						type="text"
						bind:value={playersInput}
						placeholder="Player name"
						class="flex-1 rounded border bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
						onkeydown={(e) => e.key === 'Enter' && handleAddPlayer()}
					/>
					<button
						class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
						onclick={handleAddPlayer}
					>
						Add Player
					</button>
				</div>
			</div>
		{/if}

		{#if gameState.players.length > 0}
			{console.log('Rendering scoreboard for players:', gameState.players)}
			<div class="card mb-6 p-6">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-semibold">Yahtzee Scoreboard</h2>
					<div class="flex space-x-2">
						{#each gameState.players as player}
							<div
								class="flex items-center space-x-2 rounded bg-blue-50 px-3 py-1 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
							>
								<span class="font-medium">{player.name}</span>
								<button
									class="ml-2 text-xs text-red-600 hover:text-red-800"
									onclick={() =>
										gameStore.update((state) => ({
											...state,
											players: state.players.filter((p) => p.id !== player.id)
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
					<h3 class="mb-2 text-lg font-semibold">Add More Players</h3>
					<div class="flex space-x-4">
						<input
							type="text"
							bind:value={playersInput}
							placeholder="Player name"
							class="flex-1 rounded border bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
							onkeydown={(e) => e.key === 'Enter' && handleAddPlayer()}
						/>
						<button
							class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
							onclick={handleAddPlayer}
						>
							Add Player
						</button>
					</div>
				</div>
			</div>

			<div class="overflow-x-auto rounded-lg">
				<table class="w-full border-collapse">
					<thead class="bg-transparent">
						<tr>
							<th
								class="border-r px-4 py-3 text-left font-semibold"
								style="border-color: var(--table-border);">Category</th
							>
							{#each gameState.players as player}
								<th
									class="border-r px-4 py-3 text-center font-semibold"
									style="border-color: var(--table-border);">{player.name}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						<!-- Upper Section -->
						{#each UPPER_CATEGORIES as category}
							<tr class="border-b" style="border-color: var(--table-border-soft);">
								<td
									class="border-r bg-gray-50 px-4 py-3 font-semibold dark:bg-gray-800"
									style="border-color: var(--table-border);">{CATEGORY_NAMES[category]}</td
								>
								{#each gameState.players as player}
									<td
										class="min-h-[48px] cursor-pointer border-r px-4 py-3 text-center transition-colors duration-200 last:border-r-0"
										style="border-color: var(--table-border); background: var(--card);"
										onclick={() => {
											console.log('Cell clicked for category:', category, 'player:', player.id);
											handleScore(category, player.id);
										}}
									>
										{console.log(
											'Rendering cell for category:',
											category,
											'player:',
											player.name,
											'score:',
											player.scores[category]
										)}
										{#if player.scores[category] !== null}
											<span class="text-foreground font-medium">{player.scores[category]}</span>
										{:else}
											<span class="text-sm font-medium" style="color: var(--accent);"
												>Click to score</span
											>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}

						<!-- Upper Total -->
						<tr class="border" style="border-color: var(--table-border); background: transparent;">
							<td class="px-4 py-3 font-bold">Upper Total</td>
							{#each gameState.players as player}
								<td
									class="border px-4 py-3 text-center font-bold"
									style="border-color: var(--table-border);">{getUpperTotal(player)}</td
								>
							{/each}
						</tr>

						<!-- Upper Bonus -->
						<tr class="border border-b-4" style="border-color: var(--table-border-soft); border-bottom-color: var(--accent);">
							<td class="px-4 py-3 font-semibold">Bonus (65+ pts)</td>
							{#each gameState.players as player}
								<td class="border px-4 py-3 text-center" style="border-color: var(--table-border);">
									{#if getUpperBonus(player) > 0}
										<span class="font-bold text-green-600 dark:text-green-300"
											>{getUpperBonus(player)}</span
										>
									{:else}
										<span class="text-muted">0</span>
									{/if}
								</td>
							{/each}
						</tr>

						<!-- Lower Section -->
						{#each LOWER_CATEGORIES as category}
							<tr class="border-b" style="border-color: var(--table-border-soft);">
								<td
									class="border-r bg-gray-50 px-4 py-3 font-semibold dark:bg-gray-700"
									style="border-color: var(--table-border);">{CATEGORY_NAMES[category]}</td
								>
								{#each gameState.players as player}
									<td
										class="min-h-[48px] cursor-pointer border-r px-4 py-3 text-center transition-colors duration-200 last:border-r-0"
										style="border-color: var(--table-border); background: var(--card);"
										onclick={() => {
											console.log('Cell clicked for category:', category, 'player:', player.id);
											handleScore(category, player.id);
										}}
									>
										{#if player.scores[category] !== null}
											<span class="text-foreground font-medium">{player.scores[category]}</span>
										{:else}
											<span class="text-sm font-medium" style="color: var(--accent);"
												>Click to score</span
											>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}

						<!-- Lower Total -->
						<tr class="border" style="border-color: var(--table-border);">
							<td class="px-4 py-3 font-bold">Lower Total</td>
							{#each gameState.players as player}
								<td
									class="border px-4 py-3 text-center font-bold"
									style="border-color: var(--table-border);">{getLowerTotal(player)}</td
								>
							{/each}
						</tr>

						<!-- Grand Total -->
						<tr class="border border-t-4" style="border-color: var(--table-border); border-top-color: var(--accent);">
							<td class="px-4 py-3 text-lg font-bold">Grand Total</td>
							{#each gameState.players as player}
								<td
									class="border px-4 py-3 text-center text-lg font-bold"
									style="border-color: var(--table-border);">{getTotalScore(player)}</td
								>
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
