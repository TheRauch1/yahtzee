import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import Scoreboard from './Scoreboard.svelte';
import { game } from './gameStore.svelte';
import { locale } from './locale.svelte';
import { theme } from './theme.svelte';

beforeEach(() => {
	localStorage.clear();
	game.reset();
	theme.set('dark');
	// The locale store is a module singleton, so a test that switches language
	// would otherwise leak German strings into every assertion after it.
	locale.set('en');
});

async function renderBoard() {
	const rendered = await render(Scoreboard);

	async function addPlayer(name: string) {
		await rendered.getByLabelText('Player name').first().fill(name);
		await rendered.getByRole('button', { name: 'Add Player' }).first().click();
		await tick();
	}

	function cell(category: string, player: string) {
		return rendered.container.querySelector<HTMLButtonElement>(
			`button[aria-label="Score ${category} for ${player}"]`
		);
	}

	function rowValues(label: string) {
		const row = [...rendered.container.querySelectorAll('tr')].find((tr) =>
			tr.querySelector('td')?.textContent?.trim().startsWith(label)
		);
		return [...(row?.querySelectorAll('td') ?? [])].slice(1).map((td) => td.textContent?.trim());
	}

	return { ...rendered, addPlayer, cell, rowValues };
}

describe('Scoreboard', () => {
	it('shows the add-player form when there are no players', async () => {
		const { container } = await renderBoard();

		expect(container.textContent).toContain('Add Players');
		expect(container.querySelector('table')).toBeNull();
	});

	it('adds a player and renders the score table', async () => {
		const { container, addPlayer, cell } = await renderBoard();
		await addPlayer('Ada');

		expect(game.players.map((p) => p.name)).toEqual(['Ada']);
		expect(container.querySelector('table')).not.toBeNull();
		expect(cell('Ones', 'Ada')).not.toBeNull();
	});

	it('scores a category through the modal and updates the totals', async () => {
		const { container, addPlayer, cell, rowValues } = await renderBoard();
		await addPlayer('Ada');

		cell('Fives', 'Ada')?.click();
		await tick();

		const dialog = container.querySelector('dialog');
		expect(dialog).not.toBeNull();
		expect(dialog?.open).toBe(true);

		// "three fives" -> 15
		[...dialog!.querySelectorAll<HTMLButtonElement>('.space-y-3 > button')][3].click();
		await tick();

		expect(game.players[0].scores.fives).toBe(15);
		expect(container.querySelector('dialog')).toBeNull();
		expect(rowValues('Upper Total')).toEqual(['15']);
		expect(rowValues('Grand Total')).toEqual(['15']);
	});

	it('awards the bonus once the upper total reaches 63', async () => {
		const { addPlayer, rowValues } = await renderBoard();
		await addPlayer('Ada');

		const id = game.players[0].id;
		game.scoreCategory('ones', 5, id);
		game.scoreCategory('twos', 10, id);
		game.scoreCategory('threes', 15, id);
		game.scoreCategory('fours', 20, id);
		game.scoreCategory('fives', 12, id);
		await tick();

		expect(rowValues('Upper Total')).toEqual(['62']);
		expect(rowValues('Bonus')).toEqual(['0']);

		game.scoreCategory('fives', 13, id);
		await tick();

		expect(rowValues('Upper Total')).toEqual(['63']);
		expect(rowValues('Bonus')).toEqual(['35']);
		expect(rowValues('Grand Total')).toEqual(['98']);
	});

	it('erases a single category from the modal and rolls the totals back', async () => {
		const { container, addPlayer, cell, rowValues } = await renderBoard();
		await addPlayer('Ada');

		const id = game.players[0].id;
		game.scoreCategory('fives', 15, id);
		game.scoreCategory('sixes', 24, id);
		await tick();
		expect(rowValues('Upper Total')).toEqual(['39']);

		cell('Fives', 'Ada')?.click();
		await tick();

		const erase = [...container.querySelectorAll<HTMLButtonElement>('dialog button')].find((b) =>
			b.textContent?.includes('Erase score')
		);
		expect(erase).toBeDefined();

		erase!.click();
		await tick();

		expect(game.players[0].scores.fives).toBeNull();
		expect(game.players[0].scores.sixes).toBe(24);
		expect(container.querySelector('dialog')).toBeNull();
		expect(cell('Fives', 'Ada')?.textContent?.trim()).toBe('Click to score');
		expect(rowValues('Upper Total')).toEqual(['24']);
		expect(rowValues('Grand Total')).toEqual(['24']);
	});

	it('does not offer Erase for a category that has never been scored', async () => {
		const { container, addPlayer, cell } = await renderBoard();
		await addPlayer('Ada');

		cell('Fives', 'Ada')?.click();
		await tick();

		const erase = [...container.querySelectorAll<HTMLButtonElement>('dialog button')].filter((b) =>
			b.textContent?.includes('Erase score')
		);
		expect(erase).toHaveLength(0);
	});

	it('removes a player', async () => {
		const { container, addPlayer } = await renderBoard();
		await addPlayer('Ada');
		await addPlayer('Grace');

		container.querySelector<HTMLButtonElement>('button[aria-label="Remove Ada"]')?.click();
		await tick();

		expect(game.players.map((p) => p.name)).toEqual(['Grace']);
	});

	it('clears the board on reset', async () => {
		const { container, addPlayer, getByRole } = await renderBoard();
		await addPlayer('Ada');

		await getByRole('button', { name: 'Reset' }).click();
		await tick();

		expect(game.players).toHaveLength(0);
		expect(container.querySelector('table')).toBeNull();
	});

	it('toggles the theme class on the document', async () => {
		const { container } = await renderBoard();

		expect(document.documentElement.classList.contains('dark')).toBe(true);

		const toggle = [...container.querySelectorAll('button')].find((b) =>
			['Light Mode', 'Dark Mode'].includes(b.textContent?.trim() ?? '')
		);

		toggle?.click();
		await tick();
		expect(document.documentElement.classList.contains('dark')).toBe(false);
		expect(localStorage.getItem('yahtzee:theme')).toBe('light');

		toggle?.click();
		await tick();
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	it('switches the interface language and remembers the choice', async () => {
		const { container } = await renderBoard();

		expect(container.textContent).toContain('Add Players');

		const select = container.querySelector<HTMLSelectElement>('select')!;
		expect(select.value).toBe('en');

		select.value = 'de';
		select.dispatchEvent(new Event('change', { bubbles: true }));
		await tick();

		expect(container.textContent).toContain('Yahtzee-Punktetafel');
		expect(container.textContent).toContain('Spieler hinzufügen');
		expect(container.textContent).not.toContain('Add Players');
		expect(localStorage.getItem('yahtzee:locale')).toBe('de');
		expect(document.documentElement.lang).toBe('de');

		select.value = 'en';
		select.dispatchEvent(new Event('change', { bubbles: true }));
		await tick();

		expect(container.textContent).toContain('Add Players');
		expect(localStorage.getItem('yahtzee:locale')).toBe('en');
	});

	it('translates the category names and the score-cell labels', async () => {
		const { container, addPlayer, cell } = await renderBoard();
		await addPlayer('Ada');

		expect(cell('Fives', 'Ada')).not.toBeNull();

		locale.set('de');
		await tick();

		expect(container.textContent).toContain('Fünfer');
		expect(container.textContent).toContain('Kniffel');
		expect(container.textContent).toContain('Gesamtsumme');

		// The English label is gone and the interpolated German one replaces it.
		expect(cell('Fives', 'Ada')).toBeNull();
		expect(container.querySelector('button[aria-label="Fünfer für Ada werten"]')).not.toBeNull();
	});

	it('gives every score cell an accessible name so the table is keyboard usable', async () => {
		const { container, addPlayer } = await renderBoard();
		await addPlayer('Ada');

		expect(container.querySelectorAll('tbody button[aria-label^="Score "]')).toHaveLength(15);
	});
});
