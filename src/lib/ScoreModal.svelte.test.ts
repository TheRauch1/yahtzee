import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ScoreModal from './ScoreModal.svelte';
import type { ScoringCategory } from './types';

function open(category: ScoringCategory) {
	const onscore = vi.fn();
	const onclose = vi.fn();
	return { onscore, onclose, rendered: render(ScoreModal, { category, onscore, onclose }) };
}

function buttonsIn(container: HTMLElement, text: string) {
	return [...container.querySelectorAll('button')].filter((b) => b.textContent?.includes(text));
}

describe('ScoreModal', () => {
	it('opens as a modal dialog with an accessible name', async () => {
		const { rendered } = open('yahtzee');
		const { container } = await rendered;

		const dialog = container.querySelector('dialog');
		expect(dialog?.open).toBe(true);
		expect(container.querySelector('#score-modal-title')?.textContent?.trim()).toBe(
			'Score for Yahtzee'
		);
	});

	it('closes on Escape', async () => {
		const { onclose, rendered } = open('yahtzee');
		const { container } = await rendered;

		container.querySelector('dialog')?.dispatchEvent(new Event('close'));
		expect(onclose).toHaveBeenCalled();
	});

	it('closes from the Cancel button', async () => {
		const { onclose, rendered } = open('chance');
		const { container } = await rendered;

		buttonsIn(container, 'Cancel')[0].click();
		expect(onclose).toHaveBeenCalled();
	});

	it('offers 0 to 5 dice for an upper category and scores by face value', async () => {
		const { onscore, rendered } = open('fives');
		const { container } = await rendered;

		const options = [...container.querySelectorAll<HTMLButtonElement>('.space-y-3 > button')];
		expect(options).toHaveLength(6);

		options[3].click();
		expect(onscore).toHaveBeenCalledWith(15);
	});

	it('scores a pair as twice its value', async () => {
		const { onscore, rendered } = open('pair');
		const { container } = await rendered;

		const options = [...container.querySelectorAll<HTMLButtonElement>('.space-y-3 > button')];
		expect(options).toHaveLength(7);

		options[6].click();
		expect(onscore).toHaveBeenCalledWith(12);
	});

	it('applies the three-of-a-kind house rule', async () => {
		const { onscore, rendered } = open('three-of-a-kind');
		const { container } = await rendered;

		const options = [...container.querySelectorAll<HTMLButtonElement>('.space-y-3 > button')];
		options[4].click(); // value 5

		expect(onscore).toHaveBeenCalledWith(18);
	});

	it('applies the four-of-a-kind house rule', async () => {
		const { onscore, rendered } = open('four-of-a-kind');
		const { container } = await rendered;

		const options = [...container.querySelectorAll<HTMLButtonElement>('.space-y-3 > button')];
		options[4].click(); // value 5

		expect(onscore).toHaveBeenCalledWith(21);
	});

	it('submits two pairs only once both columns are chosen', async () => {
		const { onscore, rendered } = open('two-pairs');
		const { container } = await rendered;

		const columns = container.querySelectorAll('.grid > .space-y-2');
		const first = [...columns[0].querySelectorAll('button')];
		const second = [...columns[1].querySelectorAll('button')];

		first[2].click(); // pair of 3s
		expect(onscore).not.toHaveBeenCalled();

		second[4].click(); // pair of 5s
		expect(onscore).toHaveBeenCalledWith(16);
	});

	it('submits a full house only once both halves are chosen', async () => {
		const { onscore, rendered } = open('full-house');
		const { container } = await rendered;

		const columns = container.querySelectorAll('.grid > .space-y-2');
		const threes = [...columns[0].querySelectorAll('button')];
		const pairs = [...columns[1].querySelectorAll('button')];

		threes[4].click(); // three 5s
		expect(onscore).not.toHaveBeenCalled();

		pairs[1].click(); // pair of 2s
		expect(onscore).toHaveBeenCalledWith(19);
	});

	it('scores straights and yahtzee at their fixed values', async () => {
		for (const [category, points] of [
			['small-straight', 30],
			['large-straight', 40],
			['yahtzee', 50]
		] as const) {
			const { onscore, rendered } = open(category);
			const { container, unmount } = await rendered;

			const options = [...container.querySelectorAll<HTMLButtonElement>('.space-y-3 > button')];
			options[0].click();
			expect(onscore, `${category} none`).toHaveBeenCalledWith(0);

			options[1].click();
			expect(onscore, category).toHaveBeenCalledWith(points);
			await unmount();
		}
	});

	it('submits chance once five dice are picked', async () => {
		const { onscore, rendered } = open('chance');
		const { container } = await rendered;

		const dice = [...container.querySelectorAll<HTMLButtonElement>('.grid-cols-3 > button')];

		for (let i = 0; i < 4; i++) dice[5].click(); // four 6s
		expect(onscore).not.toHaveBeenCalled();

		dice[0].click(); // a 1
		expect(onscore).toHaveBeenCalledWith(25);
	});
});
