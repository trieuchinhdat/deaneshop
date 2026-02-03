import { defineField, defineType } from 'sanity'
import { EditIcon } from '@sanity/icons'

export default defineType({
	name: 'blog-post-content',
	title: 'Blog post content',
	type: 'object',
	icon: EditIcon,
	groups: [{ name: 'layout', default: true }, { name: 'options' }],
	fields: [
		defineField({
			name: 'attributes',
			title: 'Module attributes',
			type: 'module-attributes',
			group: 'options',
		}),
		defineField({
			name: 'tableOfContents',
			title: 'Table of contents (position)',
			type: 'string',
			options: {
				list: ['left', 'right'],
			},
			group: 'layout',
		}),
	],
	preview: {
		select: {
			uid: 'attributes.uid',
		},
		prepare: ({ uid }) => ({
			title: 'Blog post content',
			subtitle: uid && `#${uid}`,
		}),
	},
})
