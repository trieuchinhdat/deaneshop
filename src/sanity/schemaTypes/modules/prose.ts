import { defineArrayMember, defineField, defineType } from 'sanity'
import { BlockContentIcon, ImageIcon } from '@sanity/icons'
import { getBlockText } from '@/lib/utils'

export default defineType({
	name: 'prose',
	title: 'Prose',
	type: 'object',
	icon: BlockContentIcon,
	groups: [{ name: 'content', default: true }, { name: 'options' }],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'options',
		}),
		defineField({
			name: 'content',
			type: 'array',
			of: [
				{ type: 'block' },
				defineArrayMember({
					type: 'image',
					icon: ImageIcon,
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					fields: [
						defineField({
							name: 'alt',
							type: 'string',
						}),
						defineField({
							name: 'figcaption',
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
					title: 'Code block',
					options: { withFilename: true },
				}),
				{ type: 'custom-html' },
			],
			group: 'content',
		}),
		defineField({
			name: 'tableOfContents',
			title: 'Table of contents (position)',
			type: 'string',
			options: {
				list: ['left', 'right'],
			},
			group: 'options',
		}),
	],
	preview: {
		select: {
			content: 'content',
		},
		prepare: ({ content }) => ({
			title: getBlockText(content),
			subtitle: 'Prose',
		}),
	},
})
