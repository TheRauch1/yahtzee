import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { playwright } from '@vitest/browser-playwright';

// Escape hatch for machines that have a Chromium but not the exact build
// Playwright expects, and cannot download one (offline, or a locked-down egress
// policy). Unset — CI and ordinary local runs — behaves as it always did.
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

// A service worker inside the Vitest browser harness intercepts the test page's
// own requests and serves stale modules between runs. Keep it out of tests.
const isVitest = !!process.env.VITEST;

export default defineConfig({
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
	},
	plugins: [
		react(),
		tailwindcss(),
		...(isVitest
			? []
			: [
					VitePWA({
						registerType: 'autoUpdate',
						injectRegister: null,
						includeAssets: ['icons/*.png', 'icons/*.svg', 'robots.txt'],
						manifest: {
							name: 'Yahtzee Scoreboard',
							short_name: 'Yahtzee',
							description:
								'A local-first Yahtzee scorekeeper. Track scores for multiple players, online or off.',
							id: '/',
							start_url: '/',
							scope: '/',
							display: 'standalone',
							orientation: 'portrait-primary',
							background_color: '#0b1220',
							theme_color: '#0b1220',
							categories: ['games', 'utilities'],
							icons: [
								{
									src: '/icons/icon-192.png',
									sizes: '192x192',
									type: 'image/png',
									purpose: 'any'
								},
								{
									src: '/icons/icon-512.png',
									sizes: '512x512',
									type: 'image/png',
									purpose: 'any'
								},
								{
									src: '/icons/icon-maskable-512.png',
									sizes: '512x512',
									type: 'image/png',
									purpose: 'maskable'
								},
								{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
							]
						},
						workbox: {
							globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,txt}'],
							// Replaces the hand-written "app shell for navigations" branch.
							navigateFallback: '/index.html',
							cleanupOutdatedCaches: true,
							clientsClaim: true,
							skipWaiting: true
						},
						// A service worker in dev caches stale modules and makes HMR lie.
						devOptions: { enabled: false }
					})
				])
	],
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.test.{ts,tsx}'],
					exclude: ['src/**/*.browser.test.{ts,tsx}'],
					setupFiles: ['./src/test/setup-node.ts']
				}
			},
			{
				// Component tests run in a real browser rather than a DOM shim, so
				// portals, focus containment and inert behave as they do in production.
				extends: './vite.config.ts',
				test: {
					name: 'browser',
					include: ['src/**/*.browser.test.{ts,tsx}'],
					setupFiles: ['./src/test/setup-browser.ts'],
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(
							chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}
						),
						instances: [{ browser: 'chromium' }]
					}
				}
			}
		]
	}
});
