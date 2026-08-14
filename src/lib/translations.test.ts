import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ALL_CATEGORIES } from './types';
import { LOCALES, translations } from './translations';

function keysOf(value: unknown, prefix = ''): string[] {
	if (typeof value !== 'object' || value === null) return [prefix];
	return Object.entries(value).flatMap(([key, nested]) =>
		keysOf(nested, prefix ? `${prefix}.${key}` : key)
	);
}

describe('translations', () => {
	it('has every scoring category translated in both locales', () => {
		for (const locale of LOCALES) {
			for (const category of ALL_CATEGORIES) {
				expect(translations[locale].categories[category]).toBeTruthy();
			}
		}
	});

	it('has an identical key shape across every locale', () => {
		const [first, ...rest] = LOCALES;
		const baseline = keysOf(translations[first]).sort();

		for (const locale of rest) {
			expect(keysOf(translations[locale]).sort()).toEqual(baseline);
		}
	});

	it('pluralizes "more dice to select" for exactly one remaining die', () => {
		expect(translations.en.scoreModal.moreDiceToSelect(1)).toBe('1 more die to select');
		expect(translations.en.scoreModal.moreDiceToSelect(2)).toBe('2 more dice to select');
	});
});

describe('index.html pre-paint script', () => {
	it('keeps its hardcoded locale list in sync with LOCALES', () => {
		const path = fileURLToPath(new URL('../../index.html', import.meta.url));
		const html = readFileSync(path, 'utf-8');

		const match = html.match(/\[('[a-z]+'(?:,\s*'[a-z]+')*)\]\.indexOf\(savedLocale\)/);
		expect(match, 'expected to find the locale allow-list in the inline script').not.toBeNull();

		const listed = match![1].split(',').map((s) => s.trim().replace(/'/g, ''));
		expect(listed.sort()).toEqual([...LOCALES].sort());
	});
});
