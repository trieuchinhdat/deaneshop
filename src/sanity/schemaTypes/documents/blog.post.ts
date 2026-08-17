import { defineArrayMember, defineField, defineType } from 'sanity'
import { EditIcon, ImageIcon, DocumentTextIcon, CogIcon, SearchIcon, LinkIcon } from '@sanity/icons'

export default defineType({
	name: 'blog.post',
	title: 'Blog Post',
	type: 'document',
	icon: EditIcon,
	groups: [
		{ name: 'content', title: '1. Content & Story', icon: DocumentTextIcon, default: true },
		{ name: 'settings', title: '2. Post Settings', icon: CogIcon },
		{ name: 'seo', title: '3. SEO & Metadata', icon: SearchIcon },
		{ name: 'related', title: '4. Related & Commerce', icon: LinkIcon },
	],
	fields: [
		// ================= GROUP 1: CONTENT =================
		defineField({
			name: 'title',
			title: 'Article Headline',
			type: 'string',
			validation: (Rule) => Rule.required(),
			group: 'content',
		}),
		defineField({
			name: 'excerpt',
			title: 'Short Excerpt / Summary',
			description: 'Brief overview (2–3 sentences) used for article preview cards, hero features, RSS feeds, and SEO fallback.',
			type: 'text',
			rows: 3,
			group: 'content',
		}),
		defineField({
			name: 'content',
			title: 'Article Body (Rich Content Builder)',
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
							description: 'Concise description of the image for screen readers & Google Images SEO.',
							type: 'string',
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
				{ type: 'affiliateLink' },
			],
			group: 'content',
		}),

		// ================= GROUP 2: SETTINGS & PUBLISHING =================
		defineField({
			name: 'isFeatured',
			title: 'Pin as Featured Article (Hero Spotlight)',
			description: 'Displays this article in the Magazine Hero banner at the top of the blog.',
			type: 'boolean',
			initialValue: false,
			group: 'settings',
		}),
		defineField({
			name: 'publishDate',
			title: 'Publication Date',
			type: 'date',
			initialValue: () => new Date().toISOString().split('T')[0],
			validation: (Rule) => Rule.required(),
			group: 'settings',
		}),
		defineField({
			name: 'lastUpdatedDate',
			title: 'Last Modified Date (Google Freshness Ranking)',
			description: 'Update when article content is refreshed or expanded.',
			type: 'date',
			group: 'settings',
		}),
		defineField({
			name: 'categories',
			title: 'Categories',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'blog.category' }] }],
			validation: (Rule) => Rule.min(1).required(),
			group: 'settings',
		}),
		defineField({
			name: 'tags',
			title: 'Article Tags / Keywords',
			type: 'array',
			of: [{ type: 'string' }],
			options: { layout: 'tags' },
			group: 'settings',
		}),
		defineField({
			name: 'author',
			title: 'Author',
			type: 'reference',
			to: [{ type: 'person' }],
			group: 'settings',
		}),
		defineField({
			name: 'tableOfContents',
			title: 'Table of Contents (TOC) Override',
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
			group: 'settings',
		}),
		defineField({
			name: 'sidebarLayout',
			title: 'Desktop Sidebar Layout Override',
			description: 'Optionally override the global desktop sidebar layout for this specific article.',
			type: 'string',
			options: {
				list: [
					{ title: 'Use Global Blog Default', value: 'default' },
					{ title: 'None / Bottom (Single Centered Column, Related Articles at Bottom)', value: 'none' },
					{ title: 'Right Sidebar (2 Columns: Main Content + Sticky Right Sidebar)', value: 'right' },
					{ title: 'Left Sidebar (2 Columns: Sticky Left Sidebar + Main Content)', value: 'left' },
				],
			},
			initialValue: 'default',
			group: 'settings',
		}),

		// ================= GROUP 3: SEO & METADATA =================
		defineField({
			name: 'metadata',
			title: 'SEO & Social Share Metadata',
			type: 'metadata',
			group: 'seo',
		}),

		// ================= GROUP 4: RELATED & COMMERCE =================
		defineField({
			name: 'relatedProducts',
			title: 'Featured / Related Products (E-Commerce Conversion)',
			description: 'Pick products referenced in this article to display an interactive product showcase at the bottom.',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'product' }] }],
			group: 'related',
		}),
		defineField({
			name: 'relatedPosts',
			title: 'Curated Related Articles',
			description: 'Manually pick related articles (if empty, articles with the same category will be shown automatically).',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'blog.post' }] }],
			group: 'related',
		}),
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'publishDate',
			isFeatured: 'isFeatured',
			media: 'metadata.image',
		},
		prepare: ({ title, subtitle, isFeatured, media }) => ({
			title: isFeatured ? `⭐ [Featured] ${title || 'Untitled'}` : title || 'Untitled Post',
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
