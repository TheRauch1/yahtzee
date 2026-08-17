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

	// Pins the reset that the per-open `key` exists to give. The picker now
	// outlives `selected` by design, so that it animates out with content in it
	// rather than as an empty box — this is the guard that the surviving copy
	// never rides along into the next open of the same cell.
	//
	// Browser tests run without the stylesheet, so the exit animation the real
	// app has is injected here rather than left out. Without one the popup
	// unmounts on whatever tick the runtime gets to it, and whether the reopen
	// lands on a surviving copy — the case this is about — becomes a race the
	// test loses every so often. Note this still does not pin the flicker fix
	// itself; the no-blank-box behaviour was verified by sampling frames in a
	// real browser.
	it('does not carry picker state into a reopen of the same cell', async () => {
		const exitAnimation = document.createElement('style');
		exitAnimation.textContent = `
			@keyframes score-dialog-test-exit { to { opacity: 0 } }
			[data-slot='dialog-content'][data-closed],
			[data-slot='dialog-overlay'][data-closed] {
				animation: score-dialog-test-exit 300ms forwards;
			}
		`;
		document.head.append(exitAnimation);

		try {
			const selected: ScoreDialogSelection = { category: 'chance', playerId: 'p1' };
			const props = { current: null, onScore: vi.fn(), onErase: vi.fn(), onClose: vi.fn() };

			const rendered = await render(<ScoreDialog selected={selected} {...props} />);
			await expect.element(page.getByRole('dialog')).toBeVisible();

			// The remaining-dice count is what distinguishes a picker with state in it
			// from a fresh one: the summary block itself is always on screen, empty or
			// not, so its mere presence says nothing about which copy this is.
			const dice = q('.grid-cols-3 > button');
			await click(dice[0]);
			await click(dice[1]);
			expect(document.body.textContent).toContain('3 more dice to select');

			// Closing leaves the picker on screen with the picks still in it: that
			// is the copy the reopen below must not be handed.
			await rendered.rerender(<ScoreDialog selected={null} {...props} />);
			expect(document.body.textContent, 'picker mid-exit').toContain('3 more dice to select');

			// Reopen the very same player + category, mid-exit.
			await rendered.rerender(<ScoreDialog selected={selected} {...props} />);
			await expect.element(page.getByRole('dialog')).toBeVisible();

			expect(document.body.textContent).not.toContain('3 more dice to select');
			expect(document.body.textContent).toContain('5 more dice to select');
		} finally {
			exitAnimation.remove();
		}
	});

	// Guards the close-flicker fix in ui/dialog.tsx. Base UI holds the whole
	// portal subtree until the slowest animation in it ends, so if the backdrop
	// and the popup do not exit over the same duration — and hold their last
	// frame once done — the one that finishes first reverts to its unanimated
	// style in full view. For the backdrop that meant a black flash.
	//
	// Asserted on the class list rather than on computed style because browser
	// tests run without the stylesheet; there is no animation here to observe.
	// That still pins the regression that matters, which is someone re-running
	// `npx shadcn@latest add dialog` and overwriting these two utilities.
	it('exits the backdrop and the popup on the same schedule', async () => {
		await open('yahtzee');

		const backdrop = document.querySelector('[data-slot="dialog-overlay"]');
		const popup = document.querySelector('[data-slot="dialog-content"]');

		for (const [name, el] of [
			['backdrop', backdrop],
			['popup', popup]
		] as const) {
			expect(el, name).not.toBeNull();
			expect(el!.className, `${name} exit duration`).toContain('duration-200');
			expect(el!.className, `${name} exit fill mode`).toContain('data-closed:fill-mode-forwards');
		}
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

	it('scores three of a kind as three times the value', async () => {
		const { onScore } = await open('three-of-a-kind');
		const options = q('.space-y-3 > button');
		expect(options).toHaveLength(7); // None + the six die values

		await click(options[5]); // value 5
		expect(onScore).toHaveBeenCalledWith(15);
	});

	it('scores four of a kind as four times the value', async () => {
		const { onScore } = await open('four-of-a-kind');
		const options = q('.space-y-3 > button');
		expect(options).toHaveLength(7);

		await click(options[5]); // value 5
		expect(onScore).toHaveBeenCalledWith(20);
	});

	it('scratches three- and four-of-a-kind to 0', async () => {
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

	// The summary used to mount with the first die, which grew the popup and
	// re-centred it mid-tap. Asserted on the DOM rather than on measured height:
	// browser tests run without the stylesheet, so nothing here has the layout
	// that shifted. What this pins is that there is no empty-state branch to
	// mount into in the first place.
	it('shows the chance summary before any die is picked', async () => {
		await open('chance');

		expect(document.body.textContent).toContain('Selected Dice:');
		expect(document.body.textContent).toContain('No dice selected yet');
		expect(document.body.textContent).toContain('Total Score:');
		expect(document.body.textContent).toContain('5 more dice to select');

		const clearAll = page.getByRole('button', { name: 'Clear All' });
		await expect.element(clearAll).toBeVisible();
		await expect.element(clearAll).toBeDisabled();
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
