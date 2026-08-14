import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { DiceFace } from './dice-face';

describe('DiceFace', () => {
	it.each([
		[1, 1],
		[2, 2],
		[3, 3],
		[4, 4],
		[5, 5],
		[6, 6]
	])('renders %i pip(s) for face %i', async (value, expectedPips) => {
		const { container } = await render(<DiceFace value={value} />);
		expect(container.querySelectorAll('svg circle').length).toBe(expectedPips);
	});

	it.each([0, 7])('renders zero pips for an out-of-range value (%i)', async (value) => {
		const { container } = await render(<DiceFace value={value} />);
		expect(container.querySelectorAll('svg circle').length).toBe(0);
	});

	it('reflects the size prop on the rendered svg', async () => {
		const { container } = await render(<DiceFace value={3} size={24} />);
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('width')).toBe('24');
		expect(svg?.getAttribute('height')).toBe('24');
	});

	it('defaults to size 40', async () => {
		const { container } = await render(<DiceFace value={3} />);
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('width')).toBe('40');
		expect(svg?.getAttribute('height')).toBe('40');
	});

	it('is aria-hidden', async () => {
		const { container } = await render(<DiceFace value={3} />);
		expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
	});
});
