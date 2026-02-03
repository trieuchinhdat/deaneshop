import { defineLocations, presentationTool } from 'sanity/presentation'
import { ROUTES } from '@/lib/env'

export default presentationTool({
	previewUrl: {
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
					title: 'metadata.title',
					slug: 'metadata.slug.current',
				},
				resolve: (doc) => ({
					locations: [
						{
							title: doc?.title,
							href: doc?.slug
								? `/${ROUTES.blog}/${doc.slug}`
								: `/${ROUTES.blog}`,
						},
					],
				}),
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
		},
	},
})
