import { beforeEach } from 'vitest';

/**
 * The stores read and write global `localStorage` exactly as they do in the
 * browser. Node has no Web Storage, so give it a minimal in-memory one — that
 * keeps the production code path under test instead of a test-only branch.
 */
class MemoryStorage implements Storage {
	private map = new Map<string, string>();

	get length() {
		return this.map.size;
	}

	key(index: number): string | null {
		return [...this.map.keys()][index] ?? null;
	}

	getItem(key: string): string | null {
		return this.map.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.map.set(key, String(value));
	}

	removeItem(key: string): void {
		this.map.delete(key);
	}

	clear(): void {
		this.map.clear();
	}
}

globalThis.localStorage = new MemoryStorage();

beforeEach(() => {
	localStorage.clear();
});
