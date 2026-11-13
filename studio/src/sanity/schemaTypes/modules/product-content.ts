import { defineField, defineType } from 'sanity'
import { EditIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'product-content',
	title: 'Product Main Content [DEPRECATED]',
	description:
		'Legacy module. Complete PDP view is rendered automatically on /products/[slug].',
	deprecated: {
		reason: 'Product Content is rendered automatically on /products/[slug].',
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
	],
	preview: defineModulePreview({
		schemaName: 'product-content',
		icon: EditIcon,
		select: {
			uid: 'attributes.uid',
		},
		metadata: (doc) => [
			doc.uid ? `#${doc.uid}` : null,
		],
	}),
})
