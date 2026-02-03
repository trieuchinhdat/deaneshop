import { defineField, defineType } from 'sanity'
import { TfiLayoutMediaLeft } from 'react-icons/tfi'
import { getBlockText } from '@/lib/utils'

export default defineType({
	name: 'hero.split',
	title: 'Hero (split)',
	type: 'object',
	icon: TfiLayoutMediaLeft,
	groups: [
		{ name: 'content', default: true },
		{ name: 'image' },
		{ name: 'options' },
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'options',
		}),
		defineField({
			name: 'content',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'ctas',
			title: 'Call-to-actions',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
		}),
		defineField({
			name: 'image',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
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
					name: 'url',
					title: 'Link URL (Optional)',
					type: 'string',
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
				}),
				defineField({
					name: 'afterContent',
					description: 'Mobile',
					type: 'boolean',
				}),
			],
			group: 'image',
		}),
	],
	preview: {
		select: {
			content: 'content',
			image: 'image',
		},
		prepare: ({ content, image }) => ({
			title: getBlockText(content),
			subtitle: 'Hero (split)',
			media: image,
		}),
	},
})
