import { defineField, defineType } from 'sanity'
import { EditIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'blog-post-content',
	title: 'Blog Post Content [DEPRECATED]',
	description:
		'Legacy module. Blog Post Content is rendered automatically by the /blog/[slug] template.',
	deprecated: {
		reason: 'Blog Post Content is rendered automatically on /blog/[slug].',
	},
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
	preview: defineModulePreview({
		schemaName: 'blog-post-content',
		icon: EditIcon,
		select: {
			uid: 'attributes.uid',
		},
		metadata: (doc) => [
			doc.uid ? `#${doc.uid}` : null,
		],
	}),
})
