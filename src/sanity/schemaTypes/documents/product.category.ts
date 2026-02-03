import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'

type ProductCategoryDocument = {
	products?: {
		_ref: string
	}[]
}

export default defineType({
	name: 'product.category',
	title: 'Product (category)',
	type: 'document',
	icon: TagIcon,
	fields: [
		defineField({
			name: 'title',
			type: 'string',
		}),
		defineField({
			name: 'slug',
			type: 'slug',
			options: { source: 'title' },
		}),
	],
	preview: {
		select: {
			title: 'title',
		},
	},
})
