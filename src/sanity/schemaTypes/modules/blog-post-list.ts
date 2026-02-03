import { defineField, defineType } from 'sanity'
import { EditIcon } from '@sanity/icons'
import { getBlockText } from '@/lib/utils'

export default defineType({
	name: 'blog-post-list',
	title: 'Blog post list',
	type: 'object',
	icon: EditIcon,
	groups: [
		{ name: 'image' },
		{ name: 'content', default: true },
		{ name: 'style' },
	],
	fieldsets: [
		{
			name: 'limitPagination',
			title: 'Limit & Pagination',
			options: { columns: 2 },
		},
		{
			name: 'backgroundColor',
			title: 'Background & Color',
			options: { columns: 2 },
		},
	],
	fields: [
		defineField({
			name: 'image',
			type: 'image',
			group: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
			fieldsets: [
				{
					name: 'linkType',
					title: 'Link type',
					options: { columns: 2 },
				},
			],
			fields: [
				defineField({
					name: 'mobileImage',
					title: 'Mobile image (Optional)',
					type: 'image',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
				}),
				defineField({
					name: 'alt',
					type: 'string',
				}),
				defineField({
					name: 'linkBannerType',
					type: 'string',
					options: {
						layout: 'radio',
						list: ['internal', 'external'],
					},
					fieldset: 'linkType',
				}),
				defineField({
					name: 'internal',
					type: 'reference',
					to: [{ type: 'page' }, { type: 'blog.post' }, { type: 'product' }],
					hidden: ({ parent }) => parent?.linkBannerType !== 'internal',
					fieldset: 'linkType',
				}),
				defineField({
					name: 'external',
					placeholder: 'https://example.com',
					type: 'url',
					validation: (Rule) =>
						Rule.uri({
							scheme: ['http', 'https', 'mailto', 'tel'],
							allowRelative: true,
						}),
					hidden: ({ parent }) => parent?.linkBannerType !== 'external',
					fieldset: 'linkType',
				}),
				defineField({
					name: 'loading',
					type: 'string',
					options: {
						list: ['lazy', 'eager'],
						layout: 'radio',
					},
					initialValue: 'lazy',
				}),
				defineField({
					name: 'onRight',
					description: 'Desktop',
					type: 'boolean',
					hidden: true,
				}),
				defineField({
					name: 'afterContent',
					description: 'Mobile',
					type: 'boolean',
					hidden: true,
				}),
			],
		}),
		defineField({
			name: 'intro',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'category',
			title: 'Category',
			type: 'reference',
			to: [{ type: 'blog.category' }],
			group: 'content',
		}),
		defineField({
			name: 'backgroundColor',
			title: 'Background Color',
			type: 'string',
			description: 'Hex code (e.g. #FFFFFF)',
			initialValue: '#FFFFFF',
			fieldset: 'backgroundColor',
			group: 'content',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
					name: 'hex', // Error message code
					invert: false, // Pattern must match
				}).error('Must be a valid hex color code'),
		}),
		defineField({
			name: 'textColor',
			title: 'Text Color',
			type: 'string',
			description: 'Hex code (e.g. #000000)',
			initialValue: '#000000',
			fieldset: 'backgroundColor',
			group: 'content',
		}),
		defineField({
			name: 'layout',
			type: 'string',
			options: {
				list: [
					{ title: 'Grid', value: 'grid' },
					{ title: 'Carousel', value: 'carousel' },
				],
				layout: 'radio',
			},
			initialValue: 'grid',
			group: 'style',
		}),
		defineField({
			name: 'limit',
			description: 'Number of posts to display',
			type: 'number',
			initialValue: 8,
			validation: (Rule) => Rule.min(1),
			group: 'style',
			fieldset: 'limitPagination',
		}),
		defineField({
			name: 'itemsPerPage',
			title: 'Items Per Page',
			description: 'Items per page (for Grid layout)',
			type: 'number',
			initialValue: 8,
			validation: (Rule) => Rule.min(1),
			group: 'style',
			fieldset: 'limitPagination',
			hidden: ({ parent }) => parent?.layout !== 'grid',
		}),
	],
	preview: {
		select: {
			intro: 'intro',
		},
		prepare: ({ intro }) => ({
			title: getBlockText(intro),
			subtitle: 'Blog post (list)',
		}),
	},
})
