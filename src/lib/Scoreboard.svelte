<script lang="ts">
	import AddPlayerForm from './AddPlayerForm.svelte';
	import ScoreModal from './ScoreModal.svelte';
	import { game } from './gameStore.svelte';
	import { theme } from './theme.svelte';
	import type { Player, ScoringCategory } from './types';
	import { CATEGORY_NAMES, LOWER_CATEGORIES, UPPER_CATEGORIES } from './types';
	import { UPPER_BONUS_THRESHOLD, grandTotal, lowerTotal, upperBonus, upperTotal } from './scoring';

	let selectedCategory = $state<ScoringCategory | null>(null);
	let selectedPlayerId = $state<string | null>(null);

	function openScoreModal(category: ScoringCategory, playerId: string) {
		selectedCategory = category;
		selectedPlayerId = playerId;
	}

	function closeScoreModal() {
		selectedCategory = null;
		selectedPlayerId = null;
	}

	function applyScore(score: number) {
		if (selectedCategory && selectedPlayerId) {
			game.scoreCategory(selectedCategory, score, selectedPlayerId);
		}
		closeScoreModal();
	}
</script>

{#snippet categoryRow(category: ScoringCategory)}
	<tr class="border-b border-[var(--table-border-soft)]">
		<td
			class="border-r border-[var(--table-border)] bg-[var(--row-header)] px-4 py-3 font-semibold"
		>
			{CATEGORY_NAMES[category]}
		</td>
		{#each game.players as player (player.id)}
			<td
				class="border-r border-[var(--table-border)] bg-[var(--card)] p-0 text-center last:border-r-0"
			>
				<button
					class="min-h-[48px] w-full cursor-pointer px-4 py-3 transition-colors duration-200 hover:bg-[var(--hover)]"
					aria-label={`Score ${CATEGORY_NAMES[category]} for ${player.name}`}
					onclick={() => openScoreModal(category, player.id)}
				>
					{#if player.scores[category] !== null}
						<span class="text-foreground font-medium">{player.scores[category]}</span>
					{:else}
						<span class="text-sm font-medium" style="color: var(--accent);">Click to score</span>
					{/if}
				</button>
			</td>
		{/each}
	</tr>
{/snippet}

{#snippet totalRow(label: string, value: (player: Player) => number)}
	<tr class="border border-[var(--table-border)]">
		<td class="px-4 py-3 font-bold">{label}</td>
		{#each game.players as player (player.id)}
			<td class="border border-[var(--table-border)] px-4 py-3 text-center font-bold">
				{value(player)}
			</td>
		{/each}
	</tr>
{/snippet}

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
					class="btn-primary rounded-md border border-transparent px-4 py-2"
					onclick={() => theme.toggle()}
					aria-pressed={theme.isDark}
				>
					{theme.isDark ? 'Light Mode' : 'Dark Mode'}
				</button>
				<button
					class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
					onclick={() => game.reset()}
				>
					Reset
				</button>
			</div>
		</header>

		{#if game.players.length === 0}
			<div class="card mb-6 p-6">
				<h2 class="mb-4 text-xl font-semibold">Add Players</h2>
				<AddPlayerForm onadd={(name) => game.addPlayer(name)} />
			</div>
		{:else}
			<div class="card mb-6 p-6">
				<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
					<h2 class="text-xl font-semibold">Yahtzee Scoreboard</h2>
					<div class="flex flex-wrap gap-2">
						{#each game.players as player (player.id)}
							<div
								class="flex items-center space-x-2 rounded bg-blue-500/15 px-3 py-1 text-blue-500"
							>
								<span class="font-medium">{player.name}</span>
								<button
									class="ml-2 text-xs text-red-500 hover:text-red-400"
									aria-label={`Remove ${player.name}`}
									onclick={() => game.removePlayer(player.id)}
								>
									×
								</button>
							</div>
						{/each}
					</div>
				</div>

				<div class="border-t border-[var(--table-border)] pt-4">
					<h3 class="mb-2 text-lg font-semibold">Add More Players</h3>
					<AddPlayerForm onadd={(name) => game.addPlayer(name)} />
				</div>
			</div>

			<div class="overflow-x-auto rounded-lg">
				<table class="w-full border-collapse">
					<thead class="bg-transparent">
						<tr>
							<th class="border-r border-[var(--table-border)] px-4 py-3 text-left font-semibold">
								Category
							</th>
							{#each game.players as player (player.id)}
								<th
									class="border-r border-[var(--table-border)] px-4 py-3 text-center font-semibold"
								>
									{player.name}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each UPPER_CATEGORIES as category (category)}
							{@render categoryRow(category)}
						{/each}

						{@render totalRow('Upper Total', upperTotal)}

						<tr
							class="border border-b-4 border-[var(--table-border-soft)]"
							style="border-bottom-color: var(--accent);"
						>
							<td class="px-4 py-3 font-semibold">Bonus ({UPPER_BONUS_THRESHOLD}+ pts)</td>
							{#each game.players as player (player.id)}
								<td class="border border-[var(--table-border)] px-4 py-3 text-center">
									{#if upperBonus(player) > 0}
										<span class="font-bold text-green-500">{upperBonus(player)}</span>
									{:else}
										<span class="text-muted">0</span>
									{/if}
								</td>
							{/each}
						</tr>

						{#each LOWER_CATEGORIES as category (category)}
							{@render categoryRow(category)}
						{/each}

						{@render totalRow('Lower Total', lowerTotal)}

						<tr
							class="border border-t-4 border-[var(--table-border)]"
							style="border-top-color: var(--accent);"
						>
							<td class="px-4 py-3 text-lg font-bold">Grand Total</td>
							{#each game.players as player (player.id)}
								<td
									class="border border-[var(--table-border)] px-4 py-3 text-center text-lg font-bold"
								>
									{grandTotal(player)}
								</td>
							{/each}
						</tr>
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

{#if selectedCategory}
	<ScoreModal category={selectedCategory} onscore={applyScore} onclose={closeScoreModal} />
{/if}
