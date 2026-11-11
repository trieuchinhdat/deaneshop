import { defineField, defineType } from 'sanity'
import { EditIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'blog-index',
	title: 'Blog Magazine Index [DEPRECATED]',
	description:
		'Legacy module. Blog Index is now a fixed system view managed via Blog & Editorial Settings.',
	deprecated: {
		reason: 'Blog Index is a fixed system view managed via Blog & Editorial Settings singleton.',
	},
	type: 'object',
	icon: EditIcon,
	fields: [
		defineField({
			name: 'intro',
			type: 'array',
			of: [{ type: 'block' }],
		}),
		defineField({
			name: 'postsPerPage',
			type: 'number',
			initialValue: 6,
			validation: (Rule) => Rule.min(1),
		}),
	],
	preview: defineModulePreview({
		schemaName: 'blog-index',
		icon: EditIcon,
		titleFields: ['intro'],
		select: {
			postsPerPage: 'postsPerPage',
		},
		metadata: (doc) => [
			doc.postsPerPage ? `${doc.postsPerPage} posts/page` : null,
		],
	}),
})
