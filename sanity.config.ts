'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/admin/[[...tool]]/page.tsx` route
 */
// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { defineConfig } from 'sanity'
import { assist } from '@sanity/assist'
import { codeInput } from '@sanity/code-input'
import {
	dashboardTool,
	projectInfoWidget,
	projectUsersWidget,
} from '@sanity/dashboard'
import { visionTool } from '@sanity/vision'
import { vercelWidget } from 'sanity-plugin-dashboard-widget-vercel'
import { media } from 'sanity-plugin-media'
import { apiVersion, dataset, projectId } from './src/sanity/env'
import presentation from './src/sanity/presentation'
import { schema } from './src/sanity/schemaTypes'
import structure from './src/sanity/structure'

export default defineConfig({
	title: 'ECOCROS',
	basePath: '/admin',
	projectId,
	dataset,
	// Add and edit the content schema in the './sanity/schemaTypes' folder
	schema,
	plugins: [
		structure,
		media(),
		presentation,
		dashboardTool({
			name: 'info',
			title: 'Info',
			widgets: [projectInfoWidget(), projectUsersWidget(), vercelWidget()],
		}),
		// Vision is for querying with GROQ from inside the Studio
		// https://www.sanity.io/docs/the-vision-plugin
		visionTool({ defaultApiVersion: apiVersion }),
		codeInput(),
		assist(),
	],
})
