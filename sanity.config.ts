'use client'

/**
 * This configuration is used for the Sanity Studio mounted at `/studio`
 */
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
import { schema, singletonTypes } from './src/sanity/schemaTypes'
import structure from './src/sanity/structure'
import { ExportSystemTemplateAction } from './src/sanity/actions/export-system-template'
import { SmartBlogImporterAction } from './src/sanity/actions/smart-blog-importer'
import { SmartProductImporterAction } from './src/sanity/actions/smart-product-importer'
import { SmartPageImporterAction } from './src/sanity/actions/smart-page-importer'
import { AiAuditAction } from './src/sanity/actions/ai-audit-action'
import { AiScoreBadge } from './src/sanity/badges/ai-score-badge'
import { BlogPostDocumentLayout } from './src/sanity/ui/blog-post-document-layout'

const HOME_PAGE_ID =
	process.env.NEXT_PUBLIC_SANITY_HOME_PAGE_ID || '7afa548f-8003-4d6e-9fb2-25a3eb2c51a4'

export default defineConfig({
	title: process.env.NEXT_PUBLIC_SANITY_STUDIO_TITLE || process.env.NEXT_PUBLIC_SITE_NAME || 'STUDIO',
	basePath: '/studio',
	projectId,
	dataset,
	schema,
	plugins: [
		structure,
		presentation,
		media(),
		dashboardTool({
			name: 'info',
			title: 'Info',
			widgets: [projectInfoWidget(), projectUsersWidget(), vercelWidget()],
		}),
		visionTool({ defaultApiVersion: apiVersion }),
		codeInput(),
		assist(),
	],
	form: {
		image: {
			assetSources: (prev) => prev.filter((source) => source.name === 'media'),
		},
		file: {
			assetSources: (prev) => prev.filter((source) => source.name === 'media'),
		},
	},
	// Enterprise Gate: Only expose developer/system tools to Administrators or in Dev mode
	tools: (prev, context) => {
		const isDev = process.env.NODE_ENV === 'development'
		const isAdmin = Boolean(
			context.currentUser?.roles.some((role) => role.name === 'administrator'),
		)
		return prev.filter((tool) => {
			if (tool.name === 'vision' || tool.name === 'info') {
				return isDev || isAdmin
			}
			return true
		})
	},
	// Document Action Guards & Components
	document: {
		components: {
			unstable_layout: BlogPostDocumentLayout,
		},
		badges: (prev, context) => {
			if (context.schemaType === 'blog.post') {
				return [...prev, AiScoreBadge]
			}
			return prev
		},
		actions: (prev, context) => {
			const isSingleton = singletonTypes.includes(context.schemaType)
			const isProtectedHomePage =
				context.schemaType === 'page' &&
				(context.documentId === HOME_PAGE_ID ||
					context.documentId === `drafts.${HOME_PAGE_ID}` ||
					context.documentId === 'homePage' ||
					context.documentId === 'drafts.homePage')

			let actions = prev

			if (isSingleton || isProtectedHomePage) {
				actions = actions.filter(
					({ action }) =>
						action !== 'delete' &&
						action !== 'duplicate' &&
						action !== 'unpublish',
				)
			}

			if (context.schemaType === 'page') {
				actions = [...actions, SmartPageImporterAction]
			}

			if (context.schemaType === 'blog.post') {
				actions = [...actions, AiAuditAction, SmartBlogImporterAction]
			}

			if (context.schemaType === 'product') {
				actions = [...actions, SmartProductImporterAction]
			}

			// Development-Only Gate: Only expose System Code Export action to developers in dev mode
			const isDev = process.env.NODE_ENV === 'development'
			if (isDev && context.schemaType === 'page') {
				actions = [...actions, ExportSystemTemplateAction]
			}

			return actions
		},
	},
})
