import { beforeEach } from 'vitest';

// Components read persisted state at module load, so each test starts from a
// clean slate rather than inheriting whatever the previous one stored.
beforeEach(() => {
	localStorage.clear();
});
