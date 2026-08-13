import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent, type Locator } from 'vitest/browser';
import { ScoreDialog, type ScoreDialogSelection } from './score-dialog';
import type { ScoringCategory } from '@/lib/types';

function q(selector: string, root: ParentNode = document): HTMLElement[] {
	return [...root.querySelectorAll<HTMLElement>(selector)];
}

// Base UI's modal Dialog/AlertDialog renders an internal full-viewport backdrop
// (used for outside-press detection) alongside our own overlay. Inside the
// Vitest browser-mode iframe, Playwright's actionability pre-check sometimes
// flags that backdrop as intercepting clicks on the popup content above it,
// even though the same interaction is provably fine in a real browser (see the
// manual end-to-end walkthrough this port was verified against). A native
// click bypasses that pre-check without skipping anything React actually does.
//
// The trailing yield matters for rapid repeated clicks on the same element
// (picking several chance dice in a row): without it, each click's handler
// still closes over the pre-click state, since nothing has given React a
// chance to flush the previous click's setState and re-render yet.
async function click(el: HTMLElement) {
	el.click();
	await new Promise((resolve) => setTimeout(resolve, 0));
}

async function roleClick(locator: Locator) {
	await expect.element(locator).toBeVisible();
	(locator.element() as HTMLElement).click();
	await new Promise((resolve) => setTimeout(resolve, 0));
}

async function open(category: ScoringCategory, current: number | null = null) {
	const onScore = vi.fn();
	const onErase = vi.fn();
	const onClose = vi.fn();
	const selected: ScoreDialogSelection = { category, playerId: 'p1' };

	const rendered = await render(
		<ScoreDialog
			selected={selected}
			current={current}
			onScore={onScore}
			onErase={onErase}
			onClose={onClose}
		/>
	);
	await expect.element(page.getByRole('dialog')).toBeVisible();

	return { onScore, onErase, onClose, rendered };
}

describe('ScoreDialog', () => {
	it('opens as a modal dialog with an accessible name', async () => {
		await open('yahtzee');
		await expect.element(page.getByRole('heading', { name: 'Score for Yahtzee' })).toBeVisible();
	});

	it('closes on Escape', async () => {
		const { onClose } = await open('yahtzee');

		await userEvent.keyboard('{Escape}');

		await expect.poll(() => onClose.mock.calls.length).toBeGreaterThan(0);
	});

	it('closes from the Cancel button', async () => {
		const { onClose } = await open('chance');
		await roleClick(page.getByRole('button', { name: 'Cancel' }));
		expect(onClose).toHaveBeenCalled();
	});

	// Pins the reset that the `key` and the popup's unmount exist to give. The
	// picker now outlives `selected` by design, so that it animates out with
	// content in it rather than as an empty box — this is the guard that the
	// surviving copy never rides along into the next open of the same cell.
	//
	// Note it does not pin the flicker fix itself: browser tests run without the
	// stylesheet, so there is no exit animation, and the popup unmounts at once.
	// The no-blank-box behaviour was verified by sampling frames in a real browser.
	it('does not carry picker state into a reopen of the same cell', async () => {
		const selected: ScoreDialogSelection = { category: 'chance', playerId: 'p1' };
		const props = { current: null, onScore: vi.fn(), onErase: vi.fn(), onClose: vi.fn() };

		const rendered = await render(<ScoreDialog selected={selected} {...props} />);
		await expect.element(page.getByRole('dialog')).toBeVisible();

		const dice = q('.grid-cols-3 > button');
		await click(dice[0]);
		await click(dice[1]);
		expect(document.body.textContent).toContain('more dice to select');

		// Close, then reopen the very same player + category.
		await rendered.rerender(<ScoreDialog selected={null} {...props} />);
		await rendered.rerender(<ScoreDialog selected={selected} {...props} />);
		await expect.element(page.getByRole('dialog')).toBeVisible();

		expect(document.body.textContent).not.toContain('more dice to select');
	});

	it('offers 0 to 5 dice for an upper category and scores by face value', async () => {
		const { onScore } = await open('fives');
		const options = q('.space-y-3 > button');
		expect(options).toHaveLength(6);

		await click(options[3]);
		expect(onScore).toHaveBeenCalledWith(15);
	});

	it('scores a pair as twice its value', async () => {
		const { onScore } = await open('pair');
		const options = q('.space-y-3 > button');
		expect(options).toHaveLength(7);

		await click(options[6]);
		expect(onScore).toHaveBeenCalledWith(12);
	});

	it('applies the three-of-a-kind house rule', async () => {
		const { onScore } = await open('three-of-a-kind');
		const options = q('.space-y-3 > button');
		expect(options).toHaveLength(7); // None + the six die values

		await click(options[5]); // value 5
		expect(onScore).toHaveBeenCalledWith(18);
	});

	it('applies the four-of-a-kind house rule', async () => {
		const { onScore } = await open('four-of-a-kind');
		const options = q('.space-y-3 > button');
		expect(options).toHaveLength(7);

		await click(options[5]); // value 5
		expect(onScore).toHaveBeenCalledWith(21);
	});

	it('scratches three- and four-of-a-kind to 0, not to the house-rule remainder', async () => {
		for (const category of ['three-of-a-kind', 'four-of-a-kind'] as const) {
			const { onScore, rendered } = await open(category);
			const options = q('.space-y-3 > button');
			await click(options[0]); // None

			expect(onScore, category).toHaveBeenCalledWith(0);
			await rendered.unmount();
		}
	});

	it('submits two pairs only once both columns are chosen', async () => {
		const { onScore } = await open('two-pairs');
		const columns = q('.grid-cols-2 > div');
		const first = q('button', columns[0]);
		const second = q('button', columns[1]);

		await click(first[2]); // pair of 3s
		expect(onScore).not.toHaveBeenCalled();

		await click(second[4]); // pair of 5s
		expect(onScore).toHaveBeenCalledWith(16);
	});

	it('submits a full house only once both halves are chosen', async () => {
		const { onScore } = await open('full-house');
		const columns = q('.grid-cols-2 > div');
		const threes = q('button', columns[0]);
		const pairs = q('button', columns[1]);

		await click(threes[4]); // three 5s
		expect(onScore).not.toHaveBeenCalled();

		await click(pairs[1]); // pair of 2s
		expect(onScore).toHaveBeenCalledWith(19);
	});

	it('scores straights and yahtzee at their fixed values', async () => {
		for (const [category, points] of [
			['small-straight', 30],
			['large-straight', 40],
			['yahtzee', 50]
		] as const) {
			const { onScore, rendered } = await open(category);
			const options = q('.space-y-3 > button');

			await click(options[0]);
			expect(onScore, `${category} none`).toHaveBeenCalledWith(0);

			await click(options[1]);
			expect(onScore, category).toHaveBeenCalledWith(points);
			await rendered.unmount();
		}
	});

	it('offers Erase only for a category that is already scored', async () => {
		const unscored = await open('yahtzee');
		expect(page.getByRole('button', { name: 'Erase score' }).elements()).toHaveLength(0);
		await unscored.rendered.unmount();

		const { onErase } = await open('yahtzee', 50);
		await expect.element(page.getByRole('button', { name: 'Erase score' })).toBeVisible();

		await roleClick(page.getByRole('button', { name: 'Erase score' }));
		expect(onErase).toHaveBeenCalled();
	});

	it('offers Erase for a category scratched to 0', async () => {
		await open('yahtzee', 0);
		await expect.element(page.getByRole('button', { name: 'Erase score' })).toBeVisible();
	});

	it('submits chance once five dice are picked', async () => {
		const { onScore } = await open('chance');
		const dice = q('.grid-cols-3 > button');
		expect(dice).toHaveLength(6);

		for (let i = 0; i < 4; i++) await click(dice[5]); // four 6s
		expect(onScore).not.toHaveBeenCalled();

		await click(dice[0]); // a 1
		expect(onScore).toHaveBeenCalledWith(25);
	});
});
