import { defineField, defineType } from 'sanity'
import { EditIcon } from '@sanity/icons'
import { getBlockText } from '@/lib/utils'

export default defineType({
	name: 'blog-post-list',
	title: 'Blog Post List',
	type: 'object',
	icon: EditIcon,
	groups: [
		{ name: 'content', title: '1. Content & Source', default: true },
		{ name: 'layout', title: '2. Layout & Presentation' },
		{ name: 'style', title: '3. Appearance & Style' },
		{ name: 'banner', title: '4. Optional Banner' },
	],
	fieldsets: [
		{
			name: 'headerGroup',
			title: 'Header & SEO Meta',
			options: { columns: 2 },
		},
		{
			name: 'ctaGroup',
			title: 'Call to Action (CTA)',
			options: { columns: 2 },
		},
		{
			name: 'gridOptions',
			title: 'Grid Settings',
			options: { columns: 2 },
		},
	],
	fields: [
		// ================= GROUP 1: CONTENT & SOURCE =================
		defineField({
			name: 'sourceType',
			title: 'Post Source',
			description: 'Choose how articles are selected for this module.',
			type: 'string',
			options: {
				list: [
					{ title: 'Recent Articles (Latest published)', value: 'recent' },
					{ title: 'By Category (Topic Cluster Pillar)', value: 'category' },
					{ title: 'Featured / Case Studies Only', value: 'featured' },
					{ title: 'Hand-picked (Curated article selection)', value: 'manual' },
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
			hidden: ({ parent }) => parent?.sourceType !== 'category',
			group: 'content',
		}),
		defineField({
			name: 'manualPosts',
			title: 'Selected Articles',
			description: 'Manually pick the exact articles to display in order.',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'blog.post' }] }],
			hidden: ({ parent }) => parent?.sourceType !== 'manual',
			group: 'content',
		}),
		defineField({
			name: 'limit',
			title: 'Max Posts to Display',
			description: 'Number of articles to fetch (recommend 3 for service pages, 4 or 6 for hub pages).',
			type: 'number',
			initialValue: 3,
			validation: (Rule) => Rule.min(1).max(24),
			hidden: ({ parent }) => parent?.sourceType === 'manual',
			group: 'content',
		}),

		// Section Header Fields
		defineField({
			name: 'tagline',
			title: 'Section Tagline / Badge',
			description: 'Small badge text above headline (e.g., "Knowledge Base", "Proven Case Studies").',
			type: 'string',
			fieldset: 'headerGroup',
			group: 'content',
		}),
		defineField({
			name: 'headingLevel',
			title: 'Heading Tag (SEO Hierarchy)',
			description: 'Use H2 for main section, H3 if placed beneath another major H2 section.',
			type: 'string',
			options: {
				list: [
					{ title: 'H2 (Section Heading)', value: 'h2' },
					{ title: 'H3 (Sub-heading)', value: 'h3' },
				],
				layout: 'radio',
			},
			initialValue: 'h2',
			fieldset: 'headerGroup',
			group: 'content',
		}),
		defineField({
			name: 'title',
			title: 'Section Headline',
			description: 'Main heading text (e.g., "Latest Insights & Expert Solutions").',
			type: 'string',
			group: 'content',
		}),
		defineField({
			name: 'subtitle',
			title: 'Section Subtitle / Description',
			description: 'Brief description clarifying the purpose and value of these articles.',
			type: 'text',
			rows: 2,
			group: 'content',
		}),
		defineField({
			name: 'intro',
			title: 'Rich Text Intro (Optional Override)',
			description: 'Use if you need formatted rich text instead of plain title & subtitle.',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),

		// CTA & Navigation
		defineField({
			name: 'showCta',
			title: 'Show "View All" Link',
			description: 'Renders an internal keyword-rich link button to the blog or category hub.',
			type: 'boolean',
			initialValue: true,
			fieldset: 'ctaGroup',
			group: 'content',
		}),
		defineField({
			name: 'ctaText',
			title: 'Custom CTA Label',
			description: 'e.g., "Explore all SEO Guides". Leave blank to use default.',
			type: 'string',
			hidden: ({ parent }) => !parent?.showCta,
			fieldset: 'ctaGroup',
			group: 'content',
		}),
		defineField({
			name: 'ctaLink',
			title: 'Custom CTA URL (Optional)',
			description: 'Direct link destination (defaults to /blog or target category URL).',
			type: 'string',
			hidden: ({ parent }) => !parent?.showCta,
			group: 'content',
		}),

		// ================= GROUP 2: LAYOUT & PRESENTATION =================
		defineField({
			name: 'layout',
			title: 'Module Presentation Layout',
			description: 'Mobile-first responsive presentation style.',
			type: 'string',
			options: {
				list: [
					{ title: 'Responsive Grid (Equal Card Columns)', value: 'grid' },
					{ title: 'Native Touch Carousel (Mobile Snap Scroll & Slider)', value: 'carousel' },
					{ title: 'Spotlight Feature (1 Large Hero Card + Secondary Posts)', value: 'spotlight' },
					{ title: 'Editorial List (Compact Horizontal Rows)', value: 'list' },
				],
				layout: 'radio',
			},
			initialValue: 'grid',
			group: 'layout',
		}),
		defineField({
			name: 'columnsDesktop',
			title: 'Desktop Grid Columns',
			description: 'Number of columns on large screens (Mobile & Tablet adapt automatically).',
			type: 'number',
			options: {
				list: [
					{ title: '2 Columns', value: 2 },
					{ title: '3 Columns (Recommended for Services)', value: 3 },
					{ title: '4 Columns', value: 4 },
				],
				layout: 'radio',
			},
			initialValue: 3,
			hidden: ({ parent }) => parent?.layout !== 'grid',
			fieldset: 'gridOptions',
			group: 'layout',
		}),

		// ================= GROUP 3: APPEARANCE & CARD STYLE =================
		defineField({
			name: 'cardStyle',
			title: 'Blog Card Design Style',
			description: 'Inherit global blog setting or override for this specific landing page.',
			type: 'string',
			options: {
				list: [
					{ title: 'Inherit from Global Blog Settings (Recommended)', value: 'inherit' },
					{ title: 'Boxed (Card border, background & padding)', value: 'boxed' },
					{ title: 'Minimalist (Frameless flush image & clean text)', value: 'minimalist' },
				],
				layout: 'radio',
			},
			initialValue: 'inherit',
			group: 'style',
		}),
		defineField({
			name: 'containerStyle',
			title: 'Section Background Container',
			type: 'string',
			options: {
				list: [
					{ title: 'Transparent / Flat', value: 'transparent' },
					{ title: 'Muted Background (Subtle card container)', value: 'muted' },
					{ title: 'Outlined Card Container', value: 'bordered' },
				],
				layout: 'radio',
			},
			initialValue: 'transparent',
			group: 'style',
		}),

		// ================= GROUP 4: OPTIONAL BANNER =================
		defineField({
			name: 'image',
			title: 'Featured Section Banner (Optional)',
			description: 'Optional visual banner accompanying this post list.',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
			group: 'banner',
			fields: [
				defineField({
					name: 'mobileImage',
					title: 'Mobile Banner Image (Optional)',
					type: 'image',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
				}),
				defineField({
					name: 'alt',
					title: 'Alt Text (SEO & Accessibility)',
					type: 'string',
				}),
				defineField({
					name: 'linkBannerType',
					title: 'Banner Link Type',
					type: 'string',
					options: {
						layout: 'radio',
						list: ['none', 'internal', 'external'],
					},
					initialValue: 'none',
				}),
				defineField({
					name: 'internal',
					title: 'Internal Target',
					type: 'reference',
					to: [{ type: 'page' }, { type: 'blog.post' }, { type: 'product' }, { type: 'collection' }],
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
	],
	preview: {
		select: {
			title: 'title',
			intro: 'intro',
			sourceType: 'sourceType',
			layout: 'layout',
		},
		prepare: ({ title, intro, sourceType, layout }) => ({
			title: title || getBlockText(intro) || 'Blog Post List',
			subtitle: `Source: ${sourceType || 'recent'} • Layout: ${layout || 'grid'}`,
		}),
	},
})
