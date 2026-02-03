import { defineField, defineType } from 'sanity'
import { EditIcon } from '@sanity/icons'

export default defineType({
	name: 'product-content',
	title: 'Product content',
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
	preview: {
		select: {
			uid: 'attributes.uid',
		},
		prepare: ({ uid }) => ({
			title: 'Product content',
			subtitle: uid && `#${uid}`,
		}),
	},
})
