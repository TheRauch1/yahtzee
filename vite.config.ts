import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// The project has no @types/node, and pulling it in would retype globals like
// setTimeout across the whole app. This config only ever reads one variable.
declare const process: { env: Record<string, string | undefined> };

// Escape hatch for machines that already have a Chromium but not the exact browser
// build this Playwright expects, and cannot download one (offline or a locked-down
// egress policy). Point it at an existing binary and the browser tests reuse it.
// Unset — CI and ordinary local runs — behaves exactly as it did before.
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	test: {
		projects: [
			{
				// Component tests run in a real browser rather than a DOM shim, so
				// things like <dialog>.showModal() behave the way they do in production.
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(
							chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}
						),
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
