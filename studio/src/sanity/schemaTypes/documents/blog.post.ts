import { defineArrayMember, defineField, defineType } from 'sanity'
import { EditIcon, ImageIcon } from '@sanity/icons'

export default defineType({
	name: 'blog.post',
	title: 'Articles',
	type: 'document',
	icon: EditIcon,

	// 1. Strategic 3-Tab Architecture
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'publishing', title: 'Publishing' },
		{ name: 'seo', title: 'SEO & Metadata' },
	],

	// 2. Single-column collapsible fieldsets
	fieldsets: [
		{
			name: 'publishingMeta',
			title: 'Publishing Schedule & Authorship',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'layoutExperience',
			title: 'Reading Experience & Layout Overrides',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'crossSellCommerce',
			title: 'Curated Articles & E-Commerce Showcase',
			options: { collapsible: true, collapsed: false },
		},
	],

	fields: [
		/* ==================== TAB 1: CONTENT ==================== */
		defineField({
			name: 'title',
			title: 'Article Headline',
			type: 'string',
			placeholder: 'e.g. Navigating Global Sustainable Supply Chains in 2026',
			validation: (Rule) => Rule.required(),
			group: 'content',
		}),
		defineField({
			name: 'excerpt',
			title: 'Executive Summary / Excerpt',
			description:
				'Brief overview (2–3 sentences) used for article preview cards, hero features, RSS feeds, and SEO fallback.',
			type: 'text',
			rows: 3,
			placeholder:
				'e.g. An in-depth analysis of eco-conscious manufacturing practices and international distribution trends.',
			group: 'content',
		}),
		defineField({
			name: 'keyTakeaways',
			title: 'Key Takeaways / TL;DR (Executive Summary Bullets)',
			description:
				'3–5 concise, high-value bullet points shown in a prominent TL;DR box at the top of the article. Crucial for skimming and Google AI Overviews.',
			type: 'array',
			of: [{ type: 'string' }],
			group: 'content',
		}),
		defineField({
			name: 'content',
			title: 'Article Body (Rich Content Builder)',
			description:
				'Compose narrative with inline media, product showcases, interactive galleries, and callouts.',
			type: 'array',
			of: [
				{ type: 'block' },
				defineArrayMember({
					type: 'image',
					icon: ImageIcon,
					description:
						'In-article inline photo. Recommended size: 1200 × 675 px (16:9 ratio, max 250 KB, WebP/JPG).',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					fields: [
						defineField({
							name: 'alt',
							title: 'Alt Text (SEO & Accessibility)',
							description:
								'Concise description of the image for screen readers & Google Images SEO.',
							type: 'string',
							placeholder: 'e.g. Factory precision equipment assembly line',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'figcaption',
							title: 'Caption',
							description: 'Optional caption displayed beneath the image.',
							type: 'array',
							of: [
								{
									type: 'block',
									styles: [{ title: 'Normal', value: 'normal' }],
								},
							],
						}),
					],
				}),
				defineArrayMember({
					type: 'code',
					title: 'Code Block',
					options: {
						withFilename: true,
					},
				}),
				{ type: 'callout-box' },
				{ type: 'product-embed' },
				{ type: 'comparison-table' },
				{ type: 'video-embed' },
				{ type: 'faq-accordion' },
				{ type: 'image-gallery' },
				{ type: 'cta-banner' },
				{ type: 'custom-html' },
			],
			group: 'content',
		}),

		/* ==================== TAB 2: PUBLISHING ==================== */
		defineField({
			name: 'isFeatured',
			title: 'Pin as Featured Article (Hero Spotlight)',
			description:
				'Spotlights this article in the Magazine Hero banner at the top of the blog index.',
			type: 'boolean',
			initialValue: false,
			group: 'publishing',
			fieldset: 'publishingMeta',
		}),
		defineField({
			name: 'publishDate',
			title: 'Publication Date',
			type: 'date',
			initialValue: () => new Date().toISOString().split('T')[0],
			validation: (Rule) => Rule.required(),
			group: 'publishing',
			fieldset: 'publishingMeta',
		}),
		defineField({
			name: 'lastUpdatedDate',
			title: 'Last Modified Date (Google Freshness Ranking)',
			description:
				'Update when article content is refreshed or significantly expanded.',
			type: 'date',
			group: 'publishing',
			fieldset: 'publishingMeta',
		}),
		defineField({
			name: 'categories',
			title: 'Primary Categories',
			description:
				'Select one or more topics for indexing and related article filtering.',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'blog.category' }] }],
			validation: (Rule) => Rule.min(1).required(),
			group: 'publishing',
			fieldset: 'publishingMeta',
		}),
		defineField({
			name: 'tags',
			title: 'Article Keywords & Tags',
			description:
				'Tags used for internal search discovery and metadata keywords.',
			type: 'array',
			of: [{ type: 'string' }],
			options: { layout: 'tags' },
			group: 'publishing',
			fieldset: 'publishingMeta',
		}),
		defineField({
			name: 'author',
			title: 'Article Author (Byline)',
			description:
				'Attributed author profile for E-E-A-T credentials and author bio box.',
			type: 'reference',
			to: [{ type: 'person' }],
			group: 'publishing',
			fieldset: 'publishingMeta',
		}),
		defineField({
			name: 'reviewedBy',
			title: 'Expert / Technical Reviewer (E-E-A-T)',
			description:
				'Certified specialist or expert who fact-checked this article for accuracy.',
			type: 'reference',
			to: [{ type: 'person' }],
			group: 'publishing',
			fieldset: 'publishingMeta',
		}),
		defineField({
			name: 'factCheckedDate',
			title: 'Fact-Checked / Verification Date',
			description:
				'Date this article was formally verified by the technical reviewer.',
			type: 'date',
			group: 'publishing',
			fieldset: 'publishingMeta',
		}),
		defineField({
			name: 'ftcDisclosure',
			title: 'FTC Compliance & Sponsorship Disclosure',
			description:
				'Mandatory by US law (16 CFR Part 255) when the article includes affiliate links or sponsored mentions.',
			type: 'string',
			options: {
				list: [
					{ title: 'Use Global Blog Default', value: 'default' },
					{
						title: 'Affiliate Disclosure (Commission notice)',
						value: 'affiliate',
					},
					{
						title: 'Sponsored Article (Paid partnership notice)',
						value: 'sponsored',
					},
					{ title: 'No Disclosure Needed (Pure Editorial)', value: 'none' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					if (value === 'none') {
						const doc = context.document as
							{ content?: Array<{ _type: string }> } | undefined
						const hasCommercialBlock = doc?.content?.some((block) =>
							[
								'product-embed',
								'comparison-table',
								'cta-banner',
								'affiliateLink',
							].includes(block._type),
						)
						if (hasCommercialBlock) {
							return 'US FTC Notice: This article includes commercial blocks (Product Embed, Comparison Table, or CTA Banner). Setting disclosure to "None" may violate US FTC guidelines.'
						}
					}
					return true
				}).warning(),
			group: 'publishing',
			fieldset: 'publishingMeta',
		}),
		defineField({
			name: 'customFtcDisclosure',
			title: 'Custom FTC Disclosure Statement (Optional Override)',
			description:
				'Override the standard FTC disclosure text for this specific article.',
			type: 'text',
			rows: 2,
			hidden: ({ parent }) => parent?.ftcDisclosure === 'none',
			group: 'publishing',
			fieldset: 'publishingMeta',
		}),

		defineField({
			name: 'tableOfContents',
			title: 'Table of Contents (TOC) Position',
			type: 'string',
			options: {
				list: [
					{ title: 'Use Global Blog Default', value: 'default' },
					{ title: 'Sticky Header Bar (Auto Highlight)', value: 'sticky-bar' },
					{ title: 'Sidebar Left', value: 'left' },
					{ title: 'Sidebar Right', value: 'right' },
					{ title: 'Hidden / Disabled', value: 'hidden' },
				],
			},
			initialValue: 'default',
			group: 'publishing',
			fieldset: 'layoutExperience',
		}),
		defineField({
			name: 'sidebarLayout',
			title: 'Desktop Sidebar Layout',
			description:
				'Optionally override the global desktop sidebar layout for this specific article.',
			type: 'string',
			options: {
				list: [
					{ title: 'Use Global Blog Default', value: 'default' },
					{
						title:
							'None / Bottom (Single Centered Column, Related Articles at Bottom)',
						value: 'none',
					},
					{
						title:
							'Right Sidebar (2 Columns: Main Content + Sticky Right Sidebar)',
						value: 'right',
					},
					{
						title:
							'Left Sidebar (2 Columns: Sticky Left Sidebar + Main Content)',
						value: 'left',
					},
				],
			},
			initialValue: 'default',
			group: 'publishing',
			fieldset: 'layoutExperience',
		}),
		defineField({
			name: 'allowComments',
			title: 'Allow Reader Discussion & Comments',
			description: 'Toggle reader comments section for this specific article.',
			type: 'boolean',
			initialValue: true,
			group: 'publishing',
			fieldset: 'layoutExperience',
		}),

		defineField({
			name: 'relatedProducts',
			title: 'Featured Products in Article (E-Commerce Showcase)',
			description:
				'Pick products referenced in this article to display an interactive product showcase at the bottom.',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'product' }] }],
			group: 'publishing',
			fieldset: 'crossSellCommerce',
		}),
		defineField({
			name: 'relatedPosts',
			title: 'Curated Related Articles',
			description:
				'Manually select related articles (if empty, articles with the same category will be shown automatically).',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'blog.post' }] }],
			group: 'publishing',
			fieldset: 'crossSellCommerce',
		}),

		/* ==================== TAB 3: SEO & METADATA ==================== */
		defineField({
			name: 'metadata',
			title: 'Search Engine Optimization (SEO)',
			type: 'metadata',
			group: 'seo',
		}),
	],

	// 3. Document list view preview
	preview: {
		select: {
			title: 'title',
			subtitle: 'publishDate',
			isFeatured: 'isFeatured',
			media: 'metadata.image',
		},
		prepare: ({ title, subtitle, isFeatured, media }) => ({
			title: isFeatured
				? `[Featured] ${title || 'Untitled'}`
				: title || 'Untitled Post',
			subtitle: subtitle ? `Published: ${subtitle}` : 'Draft',
			media,
		}),
	},
	orderings: [
		{
			name: 'publishDate',
			title: 'Publish date (Newest first)',
			by: [{ field: 'publishDate', direction: 'desc' }],
		},
		{
			name: 'title',
			title: 'Title (A-Z)',
			by: [{ field: 'title', direction: 'asc' }],
		},
	],
})
