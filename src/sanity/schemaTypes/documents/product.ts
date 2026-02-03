import { defineArrayMember, defineField, defineType } from 'sanity'
import {
	EditIcon,
	ErrorScreenIcon,
	HomeIcon,
	ImageIcon,
	SearchIcon,
} from '@sanity/icons'
import { FiImage, FiStar } from 'react-icons/fi'
import { VscEyeClosed } from 'react-icons/vsc'
import modules from '../fragments/modules'

export default defineType({
	name: 'product',
	title: 'Product',
	type: 'document',

	groups: [
		{ name: 'metadata' },
		{ name: 'content', default: true },
		{ name: 'media' },
		{ name: 'pricing' },
		{ name: 'review' },
	],

	fieldsets: [
		{
			name: 'priceRow',
			title: 'Price',
			options: { columns: 3 },
		},
		{
			name: 'skuStockRow',
			title: 'SKU & Stock',
			options: { columns: 2 },
		},
	],
	fields: [
		defineField({
			name: 'title',
			type: 'string',
			group: 'content',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'description',
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
				{ type: 'custom-html' },
				{ type: 'affiliateLink' },
			],
			group: 'content',
		}),

		defineField({
			name: 'images',
			title: 'Product Images',
			type: 'array',
			group: 'media',
			of: [
				defineArrayMember({
					type: 'image',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					preview: {
						select: {
							title: 'alt',
							media: 'asset',
						},
						prepare({ title, media }) {
							return {
								title: title || 'Product Image',
								media: media || FiImage,
							}
						},
					},
				}),
			],
		}),

		defineField({
			name: 'sku',
			title: 'SKU',
			type: 'string',
			group: 'content',
			fieldset: 'skuStockRow',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'stock',
			title: 'Stock',
			type: 'number',
			group: 'content',
			fieldset: 'skuStockRow',
			initialValue: 0,
		}),
		defineField({
			name: 'categories',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'product.category' }] }],
			group: 'content',
		}),

		defineField({
			name: 'price',
			title: 'Price',
			type: 'number',
			group: 'pricing',
			fieldset: 'priceRow',
			validation: (Rule) => Rule.required().min(0),
		}),

		defineField({
			name: 'compareAtPrice',
			title: 'Compare At Price',
			type: 'number',
			group: 'pricing',
			fieldset: 'priceRow',
			validation: (Rule) =>
				Rule.min(0).custom((compareAtPrice, context) => {
					const parent = context.parent as { price?: number }

					if (
						typeof compareAtPrice === 'number' &&
						typeof parent?.price === 'number' &&
						compareAtPrice < parent.price
					) {
						return 'Compare at price must be higher than regular price'
					}

					return true
				}),
		}),
		defineField({
			name: 'sold',
			title: 'Sold',
			type: 'number',
			group: 'pricing',
			fieldset: 'priceRow',
			initialValue: 0,
		}),
		defineField({
			name: 'reviews',
			title: 'Reviews',
			type: 'array',
			group: 'review',
			of: [
				defineArrayMember({
					type: 'object',
					icon: FiStar,
					fields: [
						defineField({
							name: 'author',
							title: 'Reviewer Name',
							type: 'string',
						}),
						defineField({
							name: 'rating',
							title: 'Rating',
							type: 'number',
							validation: (Rule) => Rule.min(1).max(5),
						}),
						defineField({
							name: 'comment',
							title: 'Comment',
							type: 'text',
							rows: 3,
						}),
						defineField({
							name: 'images',
							title: 'Product Images',
							type: 'array',
							of: [
								defineArrayMember({
									type: 'image',
									options: {
										hotspot: true,
										metadata: ['lqip'],
									},
									preview: {
										select: {
											title: 'alt',
											media: 'asset',
										},
										prepare({ title, media }) {
											return {
												title: title || 'Product image',
												media: media || FiImage,
											}
										},
									},
								}),
							],
						}),
					],
					preview: {
						select: {
							title: 'author',
							subtitle: 'comment',
						},
					},
				}),
			],
		}),
		defineField({
			...modules(),
			of: [
				{ type: 'theme-background' },
				{ type: 'prose' },
				{ type: 'callout' },
				{ type: 'custom-html' },
				{ type: 'accordion-list' },
				{ type: 'hero.split' },
				{ type: 'quote-list' },
				{ type: 'step-list' },
				{ type: 'card-list' },
				{ type: 'product-list' },
				{ type: 'carousel-banner-list' },
			],
			group: 'content',
		}),

		defineField({
			name: 'metadata',
			type: 'metadata',
			group: 'metadata',
		}),
	],

	preview: {
		select: {
			title: 'title',
			subtitle: 'publishDate',
			media: 'metadata.image',
		},
	},
	orderings: [
		{
			name: 'title',
			title: 'Title',
			by: [{ field: 'title', direction: 'asc' }],
		},
	],
})
