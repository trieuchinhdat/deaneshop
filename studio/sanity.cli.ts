import { fileURLToPath } from 'node:url'
import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
	api: {
		projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'jy7u0ikv',
		dataset: process.env.SANITY_STUDIO_DATASET || 'production',
	},
	studioHost: process.env.SANITY_STUDIO_HOST || 'deanflow',
	typegen: {
		path: '../src/**/*.{ts,tsx}',
		schema: './schema.json',
		generates: '../src/sanity/types.ts',
		// Format with explicit options so TypeGen does not require web Prettier plugins.
		formatGeneratedCode: false,
	},
	vite: (config) => ({
		...config,
		resolve: {
			...config.resolve,
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
				'@shared': fileURLToPath(new URL('../shared', import.meta.url)),
				'@guides': fileURLToPath(new URL('../', import.meta.url)),
			},
		},
	}),
})
