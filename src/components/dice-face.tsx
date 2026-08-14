const DOTS: Record<number, ReadonlyArray<readonly [number, number]>> = {
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

interface DiceFaceProps {
	value: number;
	size?: number;
}

export function DiceFace({ value, size = 40 }: DiceFaceProps) {
	const dots = DOTS[value] ?? [];

	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
			<rect
				x={0.5}
				y={0.5}
				width={size - 1}
				height={size - 1}
				rx={size * 0.12}
				fill="var(--dice-bg)"
				stroke="var(--dice-stroke)"
				strokeWidth="1"
			/>
			{dots.map(([dx, dy]) => (
				<circle
					key={`${dx},${dy}`}
					cx={size / 2 + dx * size * 0.2}
					cy={size / 2 + dy * size * 0.2}
					r={Math.max(3, Math.round(size * 0.08))}
					fill="var(--dice-dot)"
				/>
			))}
		</svg>
	);
}
