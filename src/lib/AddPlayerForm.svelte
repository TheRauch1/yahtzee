<script lang="ts">
	import { locale } from './locale.svelte';

	interface Props {
		onadd: (name: string) => void;
		label?: string;
	}

	let { onadd, label }: Props = $props();

	let effectiveLabel = $derived(label ?? locale.t.addPlayerForm.playerNamePlaceholder);

	let name = $state('');

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim()) return;

		onadd(name.trim());
		name = '';
	}
</script>

<form class="flex space-x-4" onsubmit={submit}>
	<input
		type="text"
		bind:value={name}
		placeholder={effectiveLabel}
		aria-label={effectiveLabel}
		class="flex-1 rounded border border-[var(--table-border)] bg-[var(--card)] px-3 py-2"
	/>
	<button
		type="submit"
		class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
		disabled={!name.trim()}
	>
		{locale.t.addPlayerForm.addPlayer}
	</button>
</form>
