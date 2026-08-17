import { defineField, defineType } from 'sanity'
import { BasketIcon } from '@sanity/icons'

export default defineType({
	name: 'product-embed',
	title: 'Product Card (E-Commerce Embed)',
	type: 'object',
	icon: BasketIcon,
	fields: [
		defineField({
			name: 'product',
			title: 'Select Product',
			description: 'Choose a product from your catalog to embed inside the article.',
			type: 'reference',
			to: [{ type: 'product' }],
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'layout',
			title: 'Card Display Layout',
			type: 'string',
			options: {
				list: [
					{ title: 'Standard Product Card (with Buy Button)', value: 'card' },
					{ title: 'Horizontal Banner / Spotlight', value: 'banner' },
					{ title: 'Minimal Inline Badge', value: 'minimal' },
				],
				layout: 'radio',
			},
			initialValue: 'card',
		}),
		defineField({
			name: 'customBadge',
			title: 'Custom Promotional Badge (Optional)',
			type: 'string',
			placeholder: "Editor's Choice / Best Value",
		}),
		defineField({
			name: 'customReviewSnippet',
			title: 'Short Editorial Recommendation (Optional)',
			description: 'Brief text explaining why you recommend this product in this article.',
			type: 'text',
			rows: 2,
		}),
	],
	preview: {
		select: {
			title: 'product.title',
			media: 'product.images.0',
			layout: 'layout',
		},
		prepare: ({ title, media, layout }) => ({
			title: title ? `🛍️ Product: ${title}` : 'Product Embed',
			subtitle: `Layout: ${layout || 'card'}`,
			media,
		}),
	},
})
