import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DiceFace from './DiceFace.svelte';

function pipCount(container: HTMLElement) {
	return container.querySelectorAll('circle').length;
}

describe('DiceFace', () => {
	it('renders one pip per face value', async () => {
		for (const value of [1, 2, 3, 4, 5, 6]) {
			const { container, unmount } = await render(DiceFace, { value });
			expect(pipCount(container), `value ${value}`).toBe(value);
			await unmount();
		}
	});

	it('renders no pips for an out-of-range value', async () => {
		const { container } = await render(DiceFace, { value: 9 });
		expect(pipCount(container)).toBe(0);
	});

	it('sizes the svg from the size prop', async () => {
		const { container } = await render(DiceFace, { value: 3, size: 64 });
		const svg = container.querySelector('svg');

		expect(svg?.getAttribute('width')).toBe('64');
		expect(svg?.getAttribute('viewBox')).toBe('0 0 64 64');
	});

	it('updates its pips when the value changes', async () => {
		const { container, rerender } = await render(DiceFace, { value: 1 });
		expect(pipCount(container)).toBe(1);

		await rerender({ value: 6 });
		expect(pipCount(container)).toBe(6);
	});

	it('is hidden from assistive technology', async () => {
		const { container } = await render(DiceFace, { value: 3 });
		expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
	});
});
