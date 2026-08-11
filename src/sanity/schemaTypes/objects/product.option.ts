import { defineArrayMember, defineField, defineType } from 'sanity'
import { VscListUnordered } from 'react-icons/vsc'

export default defineType({
	name: 'product.option',
	title: 'Product Option',
	icon: VscListUnordered,
	type: 'object',
	fields: [
		defineField({
			name: 'name',
			title: 'Option Name',
			type: 'string',
			description: 'E.g., Color, Size, Material',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'values',
			title: 'Option Values',
			type: 'array',
			description: 'E.g., Red, Blue, Green or S, M, L',
			of: [defineArrayMember({ type: 'string' })],
			options: {
				layout: 'tags',
			},
			validation: (Rule) => Rule.required().min(1),
		}),
	],
	preview: {
		select: {
			name: 'name',
			values: 'values',
		},
		prepare({ name, values }) {
			return {
				title: name || 'Option',
				subtitle: Array.isArray(values) ? values.join(', ') : 'No values',
			}
		},
	},
})
