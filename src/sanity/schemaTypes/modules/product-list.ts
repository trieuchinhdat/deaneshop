import { defineField, defineType } from 'sanity'
import { BsViewList } from 'react-icons/bs'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'product-list',
	title: 'Product Showcase',
	description:
		'Display curated collection or catalog product grids with category filtering, sorting, and carousel slider.',
	type: 'object',
	icon: BsViewList,
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'layout', title: 'Layout' },
		{ name: 'appearance', title: 'Appearance' },
		{ name: 'settings', title: 'Settings' },
	],
	fieldsets: [
		{
			name: 'headerOptions',
			title: 'Header & Action Settings',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'gridLayout',
			title: 'Grid Column Density',
			options: { columns: 1 },
		},
		{
			name: 'carouselOptions',
			title: 'Carousel Slider Options',
			options: { columns: 1 },
		},
		{
			name: 'themeColors',
			title: 'Custom Palette (Hex)',
			options: { columns: 2 },
		},
		{
			name: 'queryLimits',
			title: 'Query & Pagination Chunking',
			options: { columns: 1 },
		},
		{
			name: 'filteringControls',
			title: 'Catalog Filtering & Sorting',
			options: { columns: 1 },
		},
	],
	fields: [
		// Tab: Settings (Attributes)
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// Tab 1: Content
		defineField({
			name: 'collection',
			title: 'Curated Collection',
			description:
				'Select a product collection to showcase (leave blank to display all recent products from the catalog).',
			type: 'reference',
			to: [{ type: 'collection' }],
			group: 'content',
		}),
		defineField({
			name: 'badge',
			title: 'Category / Kicker Badge (Optional)',
			description:
				'Prominent kicker tag displayed above the headline (e.g. "Featured Collection", "Bestsellers", "Limited Stock").',
			type: 'string',
			placeholder: 'e.g. Featured Collection',
			group: 'content',
			fieldset: 'headerOptions',
		}),
		defineField({
			name: 'intro',
			title: 'Section Header & Intro',
			description:
				'Header copy and descriptive rich text introducing the product showcase.',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'showViewAll',
			title: 'Show "View All in Collection" Link',
			description:
				'Displays a direct link button for customers to explore the entire collection on its dedicated page.',
			type: 'boolean',
			initialValue: false,
			group: 'content',
			fieldset: 'headerOptions',
			hidden: ({ parent }) => !parent?.collection,
		}),
		defineField({
			name: 'viewAllLabel',
			title: '"View All" Button Label',
			description: 'Custom text for the collection navigation link.',
			type: 'string',
			placeholder: 'e.g. Explore Full Collection',
			initialValue: 'View All Products',
			group: 'content',
			fieldset: 'headerOptions',
			hidden: ({ parent }) => !parent?.showViewAll || !parent?.collection,
		}),
		defineField({
			name: 'image',
			title: 'Featured Promo Banner (Optional)',
			description:
				'High-impact promotional graphic banner placed directly above or accompanying this catalog section.',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
			group: 'content',
			fields: [
				defineField({
					name: 'mobileImage',
					title: 'Mobile Banner Override (Optional)',
					description:
						'Optimized vertical or square image shown on mobile screens (max 600px width).',
					type: 'image',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
				}),
				defineField({
					name: 'alt',
					title: 'Alternative Text (SEO & Accessibility)',
					description:
						'Descriptive text explaining the banner graphic for search engines and screen readers.',
					type: 'string',
					validation: (Rule) =>
						Rule.custom((alt, context) => {
							const parent = context.parent as { asset?: any }
							if (parent?.asset && (!alt || alt.trim().length === 0)) {
								return 'Alt text is recommended for accessibility when a banner image is selected.'
							}
							return true
						}).warning(),
				}),
				defineField({
					name: 'linkBannerType',
					title: 'Banner Link Type',
					type: 'string',
					options: {
						layout: 'radio',
						list: [
							{ title: 'Internal Page / Product', value: 'internal' },
							{ title: 'External Destination URL', value: 'external' },
						],
					},
					initialValue: 'internal',
				}),
				defineField({
					name: 'internal',
					title: 'Internal Target',
					type: 'reference',
					to: [{ type: 'page' }, { type: 'blog.post' }, { type: 'product' }],
					hidden: ({ parent }) => parent?.linkBannerType !== 'internal',
				}),
				defineField({
					name: 'external',
					title: 'External Destination URL',
					placeholder: 'https://example.com',
					type: 'url',
					hidden: ({ parent }) => parent?.linkBannerType !== 'external',
				}),
				defineField({
					name: 'loading',
					title: 'Image Loading Strategy',
					type: 'string',
					options: {
						list: [
							{
								title: 'Lazy load (Default, better performance)',
								value: 'lazy',
							},
							{
								title: 'Eager load (Only for above-the-fold banners)',
								value: 'eager',
							},
						],
						layout: 'radio',
					},
					initialValue: 'lazy',
				}),
			],
		}),

		// Tab 2: Layout
		defineField({
			name: 'layout',
			title: 'Display Mode',
			description:
				'Choose between a structured multi-column catalog grid or an interactive touch carousel.',
			type: 'string',
			options: {
				list: [
					{ title: 'Responsive Grid', value: 'grid' },
					{ title: 'Touch Carousel / Slider', value: 'carousel' },
				],
				layout: 'radio',
			},
			initialValue: 'grid',
			group: 'layout',
		}),
		defineField({
			name: 'columnsDesktop',
			title: 'Desktop Grid Columns',
			description:
				'Number of product cards displayed per row on desktop viewports.',
			type: 'number',
			options: {
				list: [
					{ title: '2 Columns — High Visual / Editorial', value: 2 },
					{ title: '3 Columns — Balanced Showcase', value: 3 },
					{ title: '4 Columns — Standard Catalog (Recommended)', value: 4 },
					{ title: '5 Columns — High-Density Catalog', value: 5 },
				],
				layout: 'radio',
			},
			initialValue: 4,
			group: 'layout',
			fieldset: 'gridLayout',
			hidden: ({ parent }) => parent?.layout === 'carousel',
		}),
		defineField({
			name: 'columnsMobile',
			title: 'Mobile Grid Columns',
			description:
				'Number of product cards displayed per row on mobile phones.',
			type: 'number',
			options: {
				list: [
					{ title: '1 Column — Full Width Cards', value: 1 },
					{ title: '2 Columns — Compact Grid (Standard)', value: 2 },
				],
				layout: 'radio',
			},
			initialValue: 2,
			group: 'layout',
			fieldset: 'gridLayout',
			hidden: ({ parent }) => parent?.layout === 'carousel',
		}),
		defineField({
			name: 'rowsDesktop',
			title: 'Desktop Carousel Rows',
			description: 'Vertical rows visible on desktop screens in carousel mode.',
			type: 'number',
			initialValue: 1,
			validation: (Rule) => Rule.min(1).max(2),
			options: {
				list: [
					{ title: '1 Row (Recommended)', value: 1 },
					{ title: '2 Rows', value: 2 },
				],
				layout: 'radio',
			},
			group: 'layout',
			fieldset: 'carouselOptions',
			hidden: ({ parent }) => parent?.layout !== 'carousel',
		}),
		defineField({
			name: 'rowsMobile',
			title: 'Mobile Carousel Rows',
			description: 'Vertical rows visible on mobile devices in carousel mode.',
			type: 'number',
			initialValue: 1,
			validation: (Rule) => Rule.min(1).max(2),
			options: {
				list: [
					{ title: '1 Row (Recommended)', value: 1 },
					{ title: '2 Rows', value: 2 },
				],
				layout: 'radio',
			},
			group: 'layout',
			fieldset: 'carouselOptions',
			hidden: ({ parent }) => parent?.layout !== 'carousel',
		}),
		defineField({
			name: 'autoSlide',
			title: 'Autoplay Carousel',
			description:
				'Automatically advance slides in carousel mode. Includes pause on hover/focus and respects reduced-motion preferences.',
			type: 'boolean',
			initialValue: false,
			group: 'layout',
			fieldset: 'carouselOptions',
			hidden: ({ parent }) => parent?.layout !== 'carousel',
		}),
		defineField({
			name: 'autoSlideInterval',
			title: 'Autoplay Speed',
			description: 'Time interval between automatic slide advances.',
			type: 'number',
			options: {
				list: [
					{ title: '3 Seconds — Fast', value: 3 },
					{ title: '5 Seconds — Standard (Recommended)', value: 5 },
					{ title: '7 Seconds — Relaxed', value: 7 },
				],
				layout: 'radio',
			},
			initialValue: 5,
			group: 'layout',
			fieldset: 'carouselOptions',
			hidden: ({ parent }) =>
				parent?.layout !== 'carousel' || !parent?.autoSlide,
		}),

		// Tab 3: Appearance
		defineField({
			name: 'theme',
			title: 'Container Visual Style',
			description:
				'Select a predefined theme for the showcase container background and border styling.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Clean Card — White with soft border (Default)',
						value: 'default',
					},
					{ title: 'Minimalist — Clean borderless transparent', value: 'flat' },
					{
						title: 'Subtle Neutral — Soft warm grey background',
						value: 'subtle',
					},
					{
						title: 'Dark Accent — High-contrast premium dark slate',
						value: 'dark',
					},
					{
						title: 'Custom Colors — Specify custom hex codes',
						value: 'custom',
					},
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'appearance',
		}),
		defineField({
			name: 'backgroundColor',
			title: 'Background Color',
			type: 'string',
			description: 'Hex code (e.g. #FFFFFF or #F8FAFC).',
			initialValue: '#FFFFFF',
			group: 'appearance',
			fieldset: 'themeColors',
			hidden: ({ parent }) => parent?.theme !== 'custom',
			validation: (Rule) =>
				Rule.custom((val, context) => {
					const parent = context.parent as { theme?: string }
					if (
						parent?.theme === 'custom' &&
						val &&
						!/^#([0-9a-fA-F]{3}){1,2}$/.test(val)
					) {
						return 'Please enter a valid hex color code (e.g. #FFFFFF or #F8FAFC).'
					}
					return true
				}).warning(),
		}),
		defineField({
			name: 'textColor',
			title: 'Text Contrast Color',
			type: 'string',
			description: 'Hex code (e.g. #000000 or #0F172A).',
			initialValue: '#000000',
			group: 'appearance',
			fieldset: 'themeColors',
			hidden: ({ parent }) => parent?.theme !== 'custom',
			validation: (Rule) =>
				Rule.custom((val, context) => {
					const parent = context.parent as { theme?: string }
					if (
						parent?.theme === 'custom' &&
						val &&
						!/^#([0-9a-fA-F]{3}){1,2}$/.test(val)
					) {
						return 'Please enter a valid hex color code (e.g. #000000 or #0F172A).'
					}
					return true
				}).warning(),
		}),

		// Tab 4: Settings (Query & Filtering)
		defineField({
			name: 'limit',
			title: 'Maximum Products to Fetch',
			description:
				'Total number of products to retrieve from the catalog or collection.',
			type: 'number',
			initialValue: 8,
			validation: (Rule) => Rule.min(1).max(48),
			group: 'settings',
			fieldset: 'queryLimits',
		}),
		defineField({
			name: 'itemsPerPage',
			title: 'Initial Items Visible (Grid)',
			description:
				'Number of products shown initially before revealing the "Load more" button.',
			type: 'number',
			initialValue: 8,
			validation: (Rule) => Rule.min(2).max(24),
			group: 'settings',
			fieldset: 'queryLimits',
			hidden: ({ parent }) => parent?.layout === 'carousel',
		}),
		defineField({
			name: 'enableFilter',
			title: 'Enable Category Filter Tabs',
			description:
				'Render interactive category filter pills above the product cards, allowing shoppers to filter by category.',
			type: 'boolean',
			initialValue: false,
			group: 'settings',
			fieldset: 'filteringControls',
		}),
		defineField({
			name: 'enableSort',
			title: 'Enable Sort Dropdown',
			description:
				'Render a sorting control (Price, Name, Newest) above the product grid.',
			type: 'boolean',
			initialValue: false,
			group: 'settings',
			fieldset: 'filteringControls',
		}),
		defineField({
			name: 'defaultSort',
			title: 'Default Sort Order',
			description: 'Initial ordering of products on first render.',
			type: 'string',
			options: {
				list: [
					{ title: 'Default / Catalog Sequence', value: 'default' },
					{ title: 'Newest Arrivals First', value: 'newest' },
					{ title: 'Price: Low to High', value: 'price_asc' },
					{ title: 'Price: High to Low', value: 'price_desc' },
					{ title: 'Alphabetical: A-Z', value: 'title_asc' },
					{ title: 'Alphabetical: Z-A', value: 'title_desc' },
				],
			},
			initialValue: 'default',
			group: 'settings',
			fieldset: 'filteringControls',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'product-list',
		icon: BsViewList,
		titleFields: ['intro', 'collection.title'],
		select: {
			collectionTitle: 'collection.title',
			layout: 'layout',
			enableFilter: 'enableFilter',
			limit: 'limit',
		},
		metadata: (doc) => [
			doc.layout === 'carousel' ? 'Touch Carousel' : 'Responsive Grid',
			doc.collectionTitle
				? `Collection: ${doc.collectionTitle}`
				: 'All Products',
			doc.enableFilter ? 'Category Filter: On' : null,
			doc.limit ? `Max: ${doc.limit}` : null,
		],
	}),
})
