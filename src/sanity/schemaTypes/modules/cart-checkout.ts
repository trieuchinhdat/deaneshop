import { defineField, defineType } from 'sanity'
import { MdShoppingCartCheckout } from 'react-icons/md'

export default defineType({
	name: 'cart-checkout',
	title: 'Cart / Checkout',
	type: 'object',
	icon: MdShoppingCartCheckout,
	groups: [
		{ name: 'content', default: true },
		{ name: 'options' },
		{ name: 'settings' },
	],
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			group: 'content',
			initialValue: 'Checkout',
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'text',
			group: 'content',
			rows: 2,
		}),

		defineField({
			name: 'submitText',
			title: 'Submit Button Text',
			type: 'string',
			group: 'content',
			initialValue: 'Place Order',
		}),
		defineField({
			name: 'webhookUrl',
			title: 'Google Sheet Webhook',
			description:
				'Rule: Date, Order ID, Name, Phone, Email, Address, Total, Shipping, Note, Items',
			type: 'string',
			group: 'settings',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'priceShipping',
			title: 'Price Shipping',
			type: 'number',
			group: 'settings',
			initialValue: 0,
		}),
		defineField({
			name: 'showSummary',
			title: 'Show Order Summary',
			type: 'boolean',
			group: 'options',
			initialValue: true,
		}),
		defineField({
			name: 'width',
			title: 'Full width',
			type: 'boolean',
			group: 'options',
			initialValue: false,
		}),
	],
	preview: {
		prepare() {
			return {
				title: 'Cart / Checkout',
				subtitle: 'Zustand cart',
				media: MdShoppingCartCheckout,
			}
		},
	},
})
