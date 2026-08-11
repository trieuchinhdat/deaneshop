import { defineArrayMember, defineField, defineType } from 'sanity'
import { VscVersions } from 'react-icons/vsc'

export default defineType({
	name: 'product.variant',
	title: 'Product Variant',
	icon: VscVersions,
	type: 'object',
	fields: [
		defineField({
			name: 'title',
			title: 'Variant Title',
			type: 'string',
			description: 'E.g., Red / L',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'sku',
			title: 'SKU',
			type: 'string',
		}),
		defineField({
			name: 'price',
			title: 'Price',
			type: 'number',
			description: 'Variant price. If left empty, base product price will be used.',
			validation: (Rule) => Rule.min(0),
		}),
		defineField({
			name: 'compareAtPrice',
			title: 'Compare At Price',
			type: 'number',
			validation: (Rule) => Rule.min(0),
		}),
		defineField({
			name: 'stock',
			title: 'Stock Quantity',
			type: 'number',
			initialValue: 0,
		}),
		defineField({
			name: 'image',
			title: 'Variant Image',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
		}),
		defineField({
			name: 'options',
			title: 'Option Combinations',
			type: 'array',
			description: 'Option values matching product option names (e.g. Color: Red, Size: L)',
			of: [
				defineArrayMember({
					type: 'object',
					fields: [
						defineField({ name: 'name', title: 'Option Name', type: 'string' }),
						defineField({ name: 'value', title: 'Option Value', type: 'string' }),
					],
					preview: {
						select: {
							name: 'name',
							value: 'value',
						},
						prepare({ name, value }) {
							return {
								title: `${name}: ${value}`,
							}
						},
					},
				}),
			],
		}),
	],
	preview: {
		select: {
			title: 'title',
			sku: 'sku',
			price: 'price',
			stock: 'stock',
			media: 'image',
		},
		prepare({ title, sku, price, stock, media }) {
			const priceStr = price !== undefined ? `${price.toLocaleString('vi-VN')}đ` : 'Default price'
			const stockStr = stock !== undefined ? `Stock: ${stock}` : ''
			return {
				title: title || sku || 'Variant',
				subtitle: [priceStr, stockStr].filter(Boolean).join(' | '),
				media,
			}
		},
	},
})
