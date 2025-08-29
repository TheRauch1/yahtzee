<script lang="ts">
  interface Props {
    value: number;
    size?: number;
  }

  let { value, size = 40 }: Props = $props();

  const dots = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    5: [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, 0]],
    6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
  }[value] || [];

  const s = size;
  const r = Math.max(3, Math.round(s * 0.08));
</script>

<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden="true">
  <rect
    x={0.5}
    y={0.5}
    width={s - 1}
    height={s - 1}
    rx={s * 0.12}
    fill="var(--dice-bg, white)"
    stroke="var(--stroke, #374151)"
    stroke-width="1"
  />
  {#each dots as d, i}
    <circle
      cx={(s / 2) + d[0] * s * 0.2}
      cy={(s / 2) + d[1] * s * 0.2}
      r={r}
      fill="var(--dot, #374151)"
    />
  {/each}
</svg>
