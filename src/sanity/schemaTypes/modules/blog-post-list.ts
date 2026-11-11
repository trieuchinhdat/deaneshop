import { defineField, defineType } from 'sanity'
import { EditIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'blog-post-list',
	title: 'Content Hub / Insights',
	description:
		'Dynamic editorial article cards with publication dates, tags, and reading times to build topical authority and internal linking.',
	type: 'object',
	icon: EditIcon,
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'layout', title: 'Layout' },
		{ name: 'appearance', title: 'Appearance' },
		{ name: 'settings', title: 'Settings' },
	],
	fieldsets: [
		{
			name: 'headerGroup',
			title: 'Header & Tagline',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'ctaGroup',
			title: 'Call to Action (CTA)',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'bannerGroup',
			title: 'Section Promotional Banner (Optional)',
			options: { collapsible: true, collapsed: true },
		},
		{
			name: 'gridOptions',
			title: 'Grid & Density Controls',
			options: { columns: 1 },
		},
		{
			name: 'carouselOptions',
			title: 'Carousel Slider Controls',
			options: { columns: 1 },
		},
		{
			name: 'stylingOptions',
			title: 'Card & Container Aesthetics',
			options: { columns: 1 },
		},
		{
			name: 'queryLimits',
			title: 'Query & Heading Hierarchy',
			options: { columns: 1 },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// ================= TAB 1: CONTENT =================
		defineField({
			name: 'sourceType',
			title: 'Post Source',
			description: 'Choose how articles are queried and populated for this section.',
			type: 'string',
			options: {
				list: [
					{ title: 'Recent Articles (Latest published feed)', value: 'recent' },
					{ title: 'By Category (Topic Cluster Pillar)', value: 'category' },
					{ title: 'Featured / Case Studies Only', value: 'featured' },
					{ title: 'Hand-picked (Curated exact selection)', value: 'manual' },
				],
				layout: 'radio',
			},
			initialValue: 'recent',
			group: 'content',
		}),
		defineField({
			name: 'category',
			title: 'Target Category',
			description: 'Articles from this category will be queried to build topical authority.',
			type: 'reference',
			to: [{ type: 'blog.category' }],
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const parent = context.parent as { sourceType?: string } | undefined
					if (parent?.sourceType === 'category' && !value) {
						return 'Please select a target category to display articles.'
					}
					return true
				}),
			hidden: ({ parent }) => parent?.sourceType !== 'category',
			group: 'content',
		}),
		defineField({
			name: 'manualPosts',
			title: 'Selected Articles',
			description: 'Manually pick the exact articles to display in order.',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'blog.post' }] }],
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const parent = context.parent as { sourceType?: string } | undefined
					if (parent?.sourceType === 'manual' && (!value || value.length === 0)) {
						return 'Please select at least one article to showcase.'
					}
					return true
				}),
			hidden: ({ parent }) => parent?.sourceType !== 'manual',
			group: 'content',
		}),

		// Section Header Fields
		defineField({
			name: 'tagline',
			title: 'Section Tagline / Eyebrow Badge',
			description: 'Small badge text above headline (e.g., "Knowledge Base", "Case Studies", "Industry Insights").',
			type: 'string',
			placeholder: 'e.g. Industry Insights',
			fieldset: 'headerGroup',
			group: 'content',
		}),
		defineField({
			name: 'title',
			title: 'Section Headline',
			description: 'Main heading text (e.g., "Latest Insights & Sustainable Innovations").',
			type: 'string',
			placeholder: 'e.g. Latest Insights & Sustainable Innovations',
			fieldset: 'headerGroup',
			group: 'content',
		}),
		defineField({
			name: 'subtitle',
			title: 'Section Subtitle / Description',
			description: 'Brief description clarifying the purpose and value of these articles.',
			type: 'text',
			rows: 2,
			placeholder: 'e.g. Explore in-depth editorial guides, research papers, and technical analysis.',
			fieldset: 'headerGroup',
			group: 'content',
		}),
		defineField({
			name: 'intro',
			title: 'Rich Text Intro (Optional Override)',
			description: 'Use if you need formatted rich text copy instead of standard title & subtitle.',
			type: 'array',
			of: [{ type: 'block' }],
			fieldset: 'headerGroup',
			group: 'content',
		}),

		// CTA & Navigation
		defineField({
			name: 'showCta',
			title: 'Show "View All" Button',
			description: 'Renders an internal keyword-rich link button to the blog or category hub.',
			type: 'boolean',
			initialValue: true,
			fieldset: 'ctaGroup',
			group: 'content',
		}),
		defineField({
			name: 'ctaText',
			title: 'Custom CTA Label',
			description: 'e.g., "Explore all Eco Guides". Leave blank to use default (e.g., "Explore all articles").',
			type: 'string',
			placeholder: 'e.g. Explore all articles',
			hidden: ({ parent }) => !parent?.showCta,
			fieldset: 'ctaGroup',
			group: 'content',
		}),
		defineField({
			name: 'ctaLink',
			title: 'Custom CTA URL (Optional)',
			description: 'Direct link destination (defaults to /blog or target category URL).',
			type: 'string',
			placeholder: '/blog or https://...',
			hidden: ({ parent }) => !parent?.showCta,
			fieldset: 'ctaGroup',
			group: 'content',
		}),

		// Section Visual Banner
		defineField({
			name: 'image',
			title: 'Featured Section Banner (Optional)',
			description: 'Optional visual banner accompanying this post list.',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
			fieldset: 'bannerGroup',
			group: 'content',
			fields: [
				defineField({
					name: 'mobileImage',
					title: 'Mobile Banner Image (Optional)',
					description: 'Alternative cropped banner optimized for mobile screens.',
					type: 'image',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
				}),
				defineField({
					name: 'alt',
					title: 'Alt Text (SEO & Accessibility)',
					description: 'Describe the banner image for screen readers and search engines.',
					type: 'string',
				}),
				defineField({
					name: 'linkBannerType',
					title: 'Banner Link Destination',
					type: 'string',
					options: {
						layout: 'radio',
						list: [
							{ title: 'No Link', value: 'none' },
							{ title: 'Internal Page / Article / Category', value: 'internal' },
							{ title: 'External Website URL', value: 'external' },
						],
					},
					initialValue: 'none',
				}),
				defineField({
					name: 'internal',
					title: 'Internal Target',
					type: 'reference',
					to: [
						{ type: 'page' },
						{ type: 'blog.post' },
						{ type: 'blog.category' },
						{ type: 'product' },
						{ type: 'collection' },
					],
					hidden: ({ parent }) => parent?.linkBannerType !== 'internal',
				}),
				defineField({
					name: 'external',
					title: 'External Target URL',
					placeholder: 'https://example.com',
					type: 'url',
					hidden: ({ parent }) => parent?.linkBannerType !== 'external',
				}),
			],
		}),

		// ================= TAB 2: LAYOUT =================
		defineField({
			name: 'layout',
			title: 'Presentation Layout',
			description: 'Choose the visual arrangement and layout pattern for the article cards.',
			type: 'string',
			options: {
				list: [
					{ title: 'Responsive Grid (Equal Card Columns)', value: 'grid' },
					{ title: 'Interactive Carousel (Horizontal Swipe with Controls)', value: 'carousel' },
					{ title: 'Spotlight Feature (1 Hero Card + Secondary Grid)', value: 'spotlight' },
					{ title: 'Editorial List (Compact Horizontal Rows)', value: 'list' },
				],
				layout: 'radio',
			},
			initialValue: 'grid',
			group: 'layout',
		}),
		defineField({
			name: 'columnsDesktop',
			title: 'Desktop Columns',
			description: 'Number of columns displayed simultaneously on large desktop viewports.',
			type: 'number',
			options: {
				list: [
					{ title: '2 Columns (Spacious)', value: 2 },
					{ title: '3 Columns (Recommended standard)', value: 3 },
					{ title: '4 Columns (High density)', value: 4 },
				],
				layout: 'radio',
			},
			initialValue: 3,
			hidden: ({ parent }) => parent?.layout === 'list' || parent?.layout === 'spotlight',
			fieldset: 'gridOptions',
			group: 'layout',
		}),
		defineField({
			name: 'mobileLayout',
			title: 'Mobile Screen Layout',
			description: 'Control how article cards behave on mobile devices (smartphones).',
			type: 'string',
			options: {
				list: [
					{ title: 'Horizontal Swipe Carousel (Space-saving snap scroll)', value: 'carousel' },
					{ title: '1 Column Stack (Standard vertical scroll)', value: 'stack' },
					{ title: '2 Columns Grid (Compact mobile layout)', value: 'grid-2' },
				],
				layout: 'radio',
			},
			initialValue: 'carousel',
			hidden: ({ parent }) => parent?.layout === 'spotlight' || parent?.layout === 'list',
			fieldset: 'gridOptions',
			group: 'layout',
		}),
		defineField({
			name: 'showNavigationArrows',
			title: 'Show Carousel Navigation Arrows',
			description: 'Display previous and next arrow buttons on desktop and tablet.',
			type: 'boolean',
			initialValue: true,
			hidden: ({ parent }) => parent?.layout !== 'carousel' && parent?.mobileLayout !== 'carousel',
			fieldset: 'carouselOptions',
			group: 'layout',
		}),
		defineField({
			name: 'headerAlignment',
			title: 'Header Text Alignment',
			description: 'Align the section badge, headline, and subtitle.',
			type: 'string',
			options: {
				list: [
					{ title: 'Left Aligned (Standard)', value: 'left' },
					{ title: 'Center Aligned (Editorial Spotlight)', value: 'center' },
				],
				layout: 'radio',
			},
			initialValue: 'left',
			fieldset: 'gridOptions',
			group: 'layout',
		}),

		// ================= TAB 3: APPEARANCE =================
		defineField({
			name: 'cardStyle',
			title: 'Card Design Style',
			description: 'Visual treatment of article thumbnail cards.',
			type: 'string',
			options: {
				list: [
					{ title: 'Inherit from Global Blog Settings', value: 'inherit' },
					{ title: 'Boxed (Card border, background & padding)', value: 'boxed' },
					{ title: 'Minimalist (Frameless flush image & clean text)', value: 'minimalist' },
				],
				layout: 'radio',
			},
			initialValue: 'inherit',
			fieldset: 'stylingOptions',
			group: 'appearance',
		}),
		defineField({
			name: 'cardImageAspectRatio',
			title: 'Thumbnail Aspect Ratio',
			description: 'Proportion of article images in preview cards.',
			type: 'string',
			options: {
				list: [
					{ title: 'Inherit from Global Blog Settings', value: 'inherit' },
					{ title: '16:9 (Standard Widescreen)', value: '16:9' },
					{ title: '3:2 (Editorial Classic)', value: '3:2' },
					{ title: '4:3 (Balanced Rectangle)', value: '4:3' },
					{ title: '1:1 (Square)', value: '1:1' },
				],
				layout: 'radio',
			},
			initialValue: 'inherit',
			fieldset: 'stylingOptions',
			group: 'appearance',
		}),
		defineField({
			name: 'cardShowCategoryCount',
			title: 'Show Article Count in Category Badges',
			description: 'Display total count of articles inside category badge pills (e.g., "News (14)").',
			type: 'boolean',
			initialValue: false,
			fieldset: 'stylingOptions',
			group: 'appearance',
		}),
		defineField({
			name: 'containerStyle',
			title: 'Container Background',
			description: 'Outer section background and border styling.',
			type: 'string',
			options: {
				list: [
					{ title: 'Transparent / Flat (No background box)', value: 'transparent' },
					{ title: 'Muted Background (Subtle shaded section card)', value: 'muted' },
					{ title: 'Outlined Card Container (Bordered card)', value: 'bordered' },
				],
				layout: 'radio',
			},
			initialValue: 'transparent',
			fieldset: 'stylingOptions',
			group: 'appearance',
		}),

		// ================= TAB 4: SETTINGS =================
		defineField({
			name: 'limit',
			title: 'Max Posts to Query',
			description: 'Number of articles to fetch (recommend 3 for landing pages, 6 for hubs).',
			type: 'number',
			initialValue: 3,
			validation: (Rule) => Rule.min(1).max(24),
			hidden: ({ parent }) => parent?.sourceType === 'manual',
			fieldset: 'queryLimits',
			group: 'settings',
		}),
		defineField({
			name: 'headingLevel',
			title: 'Heading Tag (SEO Hierarchy)',
			description: 'Semantic HTML tag for the section title (H2 for standard page sections, H3 for sub-sections).',
			type: 'string',
			options: {
				list: [
					{ title: 'H2 (Section Heading — Recommended)', value: 'h2' },
					{ title: 'H3 (Sub-heading)', value: 'h3' },
				],
				layout: 'radio',
			},
			initialValue: 'h2',
			fieldset: 'queryLimits',
			group: 'settings',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'blog-post-list',
		icon: EditIcon,
		titleFields: ['title', 'intro'],
		select: {
			sourceType: 'sourceType',
			layout: 'layout',
			limit: 'limit',
		},
		metadata: (doc) => {
			const sourceLabels: Record<string, string> = {
				recent: 'Latest Articles',
				category: 'By Category',
				featured: 'Featured Only',
				manual: 'Curated Selection',
			}
			const layoutLabels: Record<string, string> = {
				grid: 'Responsive Grid',
				carousel: 'Carousel Slider',
				spotlight: 'Spotlight Feature',
				list: 'Editorial List',
			}
			const src = doc.sourceType ? (sourceLabels[doc.sourceType] ?? doc.sourceType) : 'Latest Articles'
			const lay = doc.layout ? (layoutLabels[doc.layout] ?? doc.layout) : 'Grid'
			return [`Source: ${src}`, `Layout: ${lay}`]
		},
	}),
})
