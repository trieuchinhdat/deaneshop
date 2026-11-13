import { defineField, defineType } from 'sanity'
import { MdShoppingCartCheckout } from 'react-icons/md'
import modules from '../fragments/modules'

export default defineType({
	name: 'checkout-settings',
	title: 'Checkout & Cart Settings',
	type: 'document',
	icon: MdShoppingCartCheckout,

	// 1. Optimized 2-Tab Architecture
	groups: [
		{ name: 'checkout_flow', title: 'Order Form & Logistics', default: true },
		{ name: 'cro_seo', title: 'CRO Funnel & SEO' },
	],

	// 2. Single-column collapsible fieldsets
	fieldsets: [
		{
			name: 'formCopyGroup',
			title: 'Checkout Form Headers & Instruction Copy',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'fulfillmentGroup',
			title: 'Shipping Fees & Order Webhook Automation',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'croModulesGroup',
			title: 'Modular Conversion Blocks (Above / Below Form)',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'seoGroup',
			title: 'Search Engine Optimization (SEO)',
			options: { collapsible: true, collapsed: false },
		},
	],

	fields: [
		/* ==================== TAB 1: ORDER FORM & LOGISTICS ==================== */
		defineField({
			name: 'title',
			title: 'Checkout Main Headline',
			type: 'string',
			initialValue: 'Fast & Secure Checkout',
			placeholder: 'e.g. Fast & Secure Checkout',
			validation: (Rule) => Rule.required(),
			group: 'checkout_flow',
			fieldset: 'formCopyGroup',
		}),
		defineField({
			name: 'description',
			title: 'Checkout Subtitle & Buyer Instruction',
			description: 'Clear reassurance displayed right beneath the checkout headline.',
			type: 'text',
			rows: 2,
			initialValue: 'Complete your shipping information and payment details below.',
			placeholder: 'e.g. Complete your shipping information and payment details below.',
			group: 'checkout_flow',
			fieldset: 'formCopyGroup',
		}),
		defineField({
			name: 'submitText',
			title: 'Primary Submit Button Label',
			description: 'Primary button CTA text to finalize order submission.',
			type: 'string',
			initialValue: 'Place Order',
			placeholder: 'e.g. Place Order / Confirm Reservation',
			group: 'checkout_flow',
			fieldset: 'formCopyGroup',
		}),
		defineField({
			name: 'showSummary',
			title: 'Show Order Summary Box',
			description: 'Displays order line items, quantity, subtotal, and calculated freight on checkout.',
			type: 'boolean',
			initialValue: true,
			group: 'checkout_flow',
			fieldset: 'formCopyGroup',
		}),

		defineField({
			name: 'priceShipping',
			title: 'Standard Flat Shipping Fee',
			description: 'Base shipping fee automatically added to the order total. Enter 0 for Free Shipping.',
			type: 'number',
			initialValue: 0,
			placeholder: '0.00',
			validation: (Rule) => Rule.min(0),
			group: 'checkout_flow',
			fieldset: 'fulfillmentGroup',
		}),
		defineField({
			name: 'webhookUrl',
			title: 'Order Dispatch Webhook Endpoint (Google Sheets / Zapier / Make)',
			description:
				'Webhook URL invoked upon successful order submission (passes Customer, Delivery Address, Items, and Totals).',
			type: 'url',
			placeholder: 'https://maker.ifttt.com/... or https://hook.eu1.make.com/...',
			group: 'checkout_flow',
			fieldset: 'fulfillmentGroup',
		}),

		/* ==================== TAB 2: CRO FUNNEL & SEO ==================== */
		defineField({
			...modules(),
			name: 'topModules',
			title: 'Top Banner Modules (Above Checkout Form)',
			description: 'Urgency countdown banners, progress bars, or security guarantees displayed above the checkout form.',
			group: 'cro_seo',
			fieldset: 'croModulesGroup',
		}),
		defineField({
			...modules(),
			name: 'bottomModules',
			title: 'Bottom CRO Modules (Below Checkout Form)',
			description: 'Trust signals, testimonials, guarantees, or FAQ accordions placed below the order form to resolve hesitation.',
			group: 'cro_seo',
			fieldset: 'croModulesGroup',
		}),
		defineField({
			name: 'metadata',
			title: 'Checkout Page SEO & Metadata',
			type: 'metadata',
			group: 'cro_seo',
			fieldset: 'seoGroup',
		}),
	],

	preview: {
		prepare: () => ({
			title: 'Checkout & Cart Settings',
			subtitle: 'Single-source configuration for /checkout flow & order automation',
		}),
	},
})
