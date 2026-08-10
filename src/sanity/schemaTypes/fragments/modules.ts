import { defineField } from 'sanity'
import { group } from './../../lib/builders'

export default ({ of = [] }: { of?: Array<{ type: string }> } = {}) =>
	defineField({
		name: 'modules',
		type: 'array',
		of: [
			{ type: 'accordion-list' },
			{ type: 'breadcrumbs' },
			{ type: 'theme-background' },
			{ type: 'cart-checkout' },
			{ type: 'callout' },
			{ type: 'card-list' },
			{ type: 'custom-html' },
			{ type: 'hero.split' },
			{ type: 'logo-list' },
			{ type: 'person-list' },
			{ type: 'prose' },
			{ type: 'search-module' },
			{ type: 'stat-list' },
			{ type: 'step-list' },
			{ type: 'quote-list' },
			{ type: 'blog-index' },
			{ type: 'blog-post-list' },
			{ type: 'product-content' },
			{ type: 'product-list' },
			{ type: 'collection-content' },
			{ type: 'carousel-banner-list' },
			...of,
		],
		options: {
			insertMenu: {
				groups: [
					{
						name: 'blog',
						of: ['blog-index', 'blog-post-content', 'blog-post-list'],
					},
					{
						name: 'ecommerce',
						of: ['product-content', 'product-list', 'collection-content', 'cart-checkout'],
					},
					{
						name: 'list',
						of: [
							'accordion-list',
							'card-list',
							'logo-list',
							'person-list',
							'stat-list',
							'step-list',
							'quote-list',
							'blog-post-list',
							'product-list',
							'carousel-banner-list',
						],
					},
				],
			},
		},
	})
