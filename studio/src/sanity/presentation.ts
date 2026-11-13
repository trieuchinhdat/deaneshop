import { defineLocations, presentationTool } from 'sanity/presentation'
import { webUrl } from './env'
import { ROUTES } from '@shared/routes'

export default presentationTool({
	title: 'Visual Editor',
	previewUrl: {
		origin: webUrl,
		previewMode: {
			enable: '/api/draft-mode/enable',
		},
	},
	resolve: {
		locations: {
			page: defineLocations({
				select: {
					title: 'title',
					slug: 'metadata.slug.current',
				},
				resolve: (doc) => ({
					locations: [
						{
							title: doc?.title,
							href: doc?.slug
								? doc.slug === 'index'
									? '/'
									: `/${doc.slug}`
								: '/',
						},
					],
				}),
			}),
			'blog.post': defineLocations({
				select: {
					title: 'title',
					metaTitle: 'metadata.title',
					slug: 'metadata.slug.current',
				},
				resolve: (doc) => ({
					locations: [
						{
							title: doc?.title || doc?.metaTitle || 'Article',
							href: doc?.slug
								? `/${ROUTES.blog}/${doc.slug}`
								: `/${ROUTES.blog}`,
						},
					],
				}),
			}),
			'blog.category': defineLocations({
				select: {
					title: 'title',
					slug: 'slug.current',
					metaSlug: 'metadata.slug.current',
				},
				resolve: (doc) => {
					const categorySlug = doc?.slug || doc?.metaSlug
					return {
						locations: [
							{
								title: doc?.title || 'Category',
								href: categorySlug
									? `/${ROUTES.blog}/category/${categorySlug}`
									: `/${ROUTES.blog}`,
							},
						],
					}
				},
			}),
			product: defineLocations({
				select: {
					title: 'metadata.title',
					slug: 'metadata.slug.current',
				},
				resolve: (doc) => ({
					locations: [
						{
							title: doc?.title,
							href: doc?.slug
								? `/${ROUTES.products}/${doc.slug}`
								: `/${ROUTES.products}`,
						},
					],
				}),
			}),
			collection: defineLocations({
				select: {
					title: 'metadata.title',
					slug: 'metadata.slug.current',
				},
				resolve: (doc) => ({
					locations: [
						{
							title: doc?.title,
							href: doc?.slug
								? `/${ROUTES.collections}/${doc.slug}`
								: `/${ROUTES.collections}`,
						},
					],
				}),
			}),
		},
	},
})
