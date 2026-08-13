<script lang="ts">
	import { locale } from './locale.svelte';
	import { LOCALES, LOCALE_LABELS, type Locale } from './translations';

	function onchange(event: Event) {
		locale.set((event.target as HTMLSelectElement).value as Locale);
	}
</script>

<select
	class="rounded-md border border-[var(--table-border)] bg-[var(--card)] px-3 py-2"
	aria-label={locale.t.language.switchLabel}
	value={locale.current}
	{onchange}
>
	{#each LOCALES as code (code)}
		<option value={code}>{LOCALE_LABELS[code]}</option>
	{/each}
</select>
