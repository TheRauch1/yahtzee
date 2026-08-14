import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent, type Locator } from 'vitest/browser';
import { Scoreboard } from './scoreboard';
import { gameStore } from '@/lib/game-store';
import { localeStore } from '@/lib/locale-store';

// src/test/setup-browser.ts resets gameStore/themeStore/localeStore before
// every test in this project; no local beforeEach needed here.

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

async function addPlayer(name: string) {
	await page.getByLabelText('Player name').first().fill(name);
	await roleClick(page.getByRole('button', { name: 'Add Player' }).first());
}

function cell(category: string, player: string) {
	return page.getByRole('button', { name: `Score ${category} for ${player}` });
}

function rowValues(label: string) {
	const rows = q('tr');
	const row = rows.find((tr) => tr.querySelector('td')?.textContent?.trim().startsWith(label));
	return q('td', row)
		.slice(1)
		.map((td) => td.textContent?.trim());
}

describe('Scoreboard', () => {
	it('shows the add-player form when there are no players', async () => {
		await render(<Scoreboard />);
		await expect.element(page.getByText('Add Players', { exact: true })).toBeVisible();
		expect(document.querySelector('table')).toBeNull();
	});

	it('adds a player and renders the score table', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');

		expect(gameStore.getSnapshot().map((p) => p.name)).toEqual(['Ada']);
		await expect.element(page.getByRole('table')).toBeVisible();
		await expect.element(cell('Ones', 'Ada')).toBeVisible();
	});

	it('scores a category through the dialog and updates the totals', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');

		await roleClick(cell('Fives', 'Ada'));
		await expect.element(page.getByRole('dialog')).toBeVisible();

		// "three fives" -> 15
		await click(q('.space-y-3 > button')[3]);
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

		expect(gameStore.getSnapshot()[0].scores.fives).toBe(15);
		expect(rowValues('Upper Total')).toEqual(['15']);
		expect(rowValues('Grand Total')).toEqual(['15']);
	});

	it('awards the bonus once the upper total reaches 63', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');

		const id = gameStore.getSnapshot()[0].id;
		gameStore.scoreCategory('ones', 5, id);
		gameStore.scoreCategory('twos', 10, id);
		gameStore.scoreCategory('threes', 15, id);
		gameStore.scoreCategory('fours', 20, id);
		gameStore.scoreCategory('fives', 12, id);

		await expect.poll(() => rowValues('Upper Total')).toEqual(['62']);
		expect(rowValues('Bonus')).toEqual(['0']);

		gameStore.scoreCategory('fives', 13, id);

		await expect.poll(() => rowValues('Upper Total')).toEqual(['63']);
		expect(rowValues('Bonus')).toEqual(['35']);
		expect(rowValues('Grand Total')).toEqual(['98']);
	});

	it('erases a single category from the dialog and rolls the totals back', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');

		const id = gameStore.getSnapshot()[0].id;
		gameStore.scoreCategory('fives', 15, id);
		gameStore.scoreCategory('sixes', 24, id);
		await expect.poll(() => rowValues('Upper Total')).toEqual(['39']);

		await roleClick(cell('Fives', 'Ada'));
		await expect.element(page.getByRole('button', { name: 'Erase score' })).toBeVisible();
		await roleClick(page.getByRole('button', { name: 'Erase score' }));

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		expect(gameStore.getSnapshot()[0].scores.fives).toBeNull();
		expect(gameStore.getSnapshot()[0].scores.sixes).toBe(24);
		expect(rowValues('Upper Total')).toEqual(['24']);
		expect(rowValues('Grand Total')).toEqual(['24']);
	});

	it('does not offer Erase for a category that has never been scored', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');

		await roleClick(cell('Fives', 'Ada'));
		await expect.element(page.getByRole('dialog')).toBeVisible();
		expect(page.getByRole('button', { name: 'Erase score' }).elements()).toHaveLength(0);

		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('removes a player after confirming', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');
		await addPlayer('Grace');

		await roleClick(page.getByRole('button', { name: 'Remove Ada' }));
		await expect.element(page.getByRole('alertdialog')).toBeVisible();
		await roleClick(
			page.getByRole('alertdialog').getByRole('button', { name: 'Remove', exact: true })
		);

		await expect.poll(() => gameStore.getSnapshot().map((p) => p.name)).toEqual(['Grace']);
	});

	it('leaves the player list untouched when remove is cancelled', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');

		await roleClick(page.getByRole('button', { name: 'Remove Ada' }));
		await expect.element(page.getByRole('alertdialog')).toBeVisible();
		await roleClick(page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }));

		expect(gameStore.getSnapshot().map((p) => p.name)).toEqual(['Ada']);
	});

	it('clears the board on reset after confirming', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');

		await roleClick(page.getByRole('button', { name: 'Reset', exact: true }).first());
		await expect.element(page.getByRole('alertdialog')).toBeVisible();
		await roleClick(
			page.getByRole('alertdialog').getByRole('button', { name: 'Reset', exact: true })
		);

		await expect.poll(() => gameStore.getSnapshot().length).toBe(0);
		expect(document.querySelector('table')).toBeNull();
	});

	it('leaves the board untouched when reset is cancelled', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');

		await roleClick(page.getByRole('button', { name: 'Reset', exact: true }).first());
		await expect.element(page.getByRole('alertdialog')).toBeVisible();
		await roleClick(page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }));

		expect(gameStore.getSnapshot()).toHaveLength(1);
		expect(document.querySelector('table')).not.toBeNull();
	});

	it('toggles the theme class on the document', async () => {
		await render(<Scoreboard />);
		expect(document.documentElement.classList.contains('dark')).toBe(true);

		await roleClick(page.getByRole('button', { name: 'Light Mode' }));
		expect(document.documentElement.classList.contains('dark')).toBe(false);
		expect(localStorage.getItem('yahtzee:theme')).toBe('light');

		await roleClick(page.getByRole('button', { name: 'Dark Mode' }));
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	it('switches the interface language and remembers the choice', async () => {
		await render(<Scoreboard />);
		await expect.element(page.getByText('Add Players', { exact: true })).toBeVisible();

		const select = q('select')[0] as HTMLSelectElement;
		expect(select.value).toBe('en');

		await userEvent.selectOptions(select, 'de');

		await expect.element(page.getByText('Yahtzee-Punktetafel')).toBeVisible();
		await expect.element(page.getByLabelText('Spielername')).toBeVisible();
		expect(localStorage.getItem('yahtzee:locale')).toBe('de');
		expect(document.documentElement.lang).toBe('de');

		await userEvent.selectOptions(select, 'en');

		await expect.element(page.getByText('Add Players', { exact: true })).toBeVisible();
		expect(localStorage.getItem('yahtzee:locale')).toBe('en');
	});

	it('translates the category names and the score-cell labels', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');

		await expect.element(cell('Fives', 'Ada')).toBeVisible();

		localeStore.set('de');

		await expect.element(page.getByText('Fünfer')).toBeVisible();
		await expect.element(page.getByText('Dreierpasch')).toBeVisible();
		await expect.element(page.getByText('Gesamtsumme')).toBeVisible();
		expect(cell('Fives', 'Ada').elements()).toHaveLength(0);
		await expect.element(page.getByRole('button', { name: 'Fünfer für Ada werten' })).toBeVisible();
	});

	it('gives every score cell an accessible name so the table is keyboard usable', async () => {
		await render(<Scoreboard />);
		await addPlayer('Ada');

		const scoreButtons = q('tbody button[aria-label^="Score "]');
		expect(scoreButtons).toHaveLength(15);
	});
});
