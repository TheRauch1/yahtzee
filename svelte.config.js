import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Every route is prerendered (see src/routes/+layout.ts), so the deployment is
		// a set of static assets served straight from Cloudflare's edge.
		adapter: adapter()
	}
};

export default config;
