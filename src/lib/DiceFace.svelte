<script lang="ts">
	interface Props {
		value: number;
		size?: number;
	}

	let { value, size = 40 }: Props = $props();

	const DOT_LAYOUTS: Record<number, [number, number][]> = {
		1: [[0, 0]],
		2: [
			[-1, -1],
			[1, 1]
		],
		3: [
			[-1, -1],
			[0, 0],
			[1, 1]
		],
		4: [
			[-1, -1],
			[-1, 1],
			[1, -1],
			[1, 1]
		],
		5: [
			[-1, -1],
			[-1, 1],
			[1, -1],
			[1, 1],
			[0, 0]
		],
		6: [
			[-1, -1],
			[-1, 0],
			[-1, 1],
			[1, -1],
			[1, 0],
			[1, 1]
		]
	};

	let dots = $derived(DOT_LAYOUTS[value] ?? []);
	let radius = $derived(Math.max(3, Math.round(size * 0.08)));
</script>

<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
	<rect
		x={0.5}
		y={0.5}
		width={size - 1}
		height={size - 1}
		rx={size * 0.12}
		fill="var(--dice-bg, white)"
		stroke="var(--stroke, #374151)"
		stroke-width="1"
	/>
	{#each dots as [dx, dy] (`${dx},${dy}`)}
		<circle
			cx={size / 2 + dx * size * 0.2}
			cy={size / 2 + dy * size * 0.2}
			r={radius}
			fill="var(--dot, #374151)"
		/>
	{/each}
</svg>
