import { defineField, defineType } from 'sanity'
import { LinkIcon } from '@sanity/icons'

export default defineType({
	name: 'affiliateLink',
	title: 'Affiliate Product / CTA',
	type: 'object',
	icon: LinkIcon,
	groups: [
		{ name: 'source', title: '1. Product Source', default: true },
		{ name: 'overrides', title: '2. Deal & Overrides' },
		{ name: 'display', title: '3. Layout & Styling' },
	],
	fieldsets: [
		{
			name: 'customPricing',
			title: 'Pricing & Savings',
			options: { columns: 2 },
		},
		{
			name: 'dealBadging',
			title: 'Deal & Coupon Code',
			options: { columns: 2 },
		},
	],
	fields: [
		// ================= GROUP 1: PRODUCT SOURCE =================
		defineField({
			name: 'sourceMode',
			title: 'Product Source Mode',
			description: 'Choose how affiliate product details & tracking link are sourced.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Affiliate Catalog (Reusable Partner)',
						value: 'affiliate',
					},
					{
						title: 'Quick Custom URL (One-time Link)',
						value: 'custom',
					},
				],
				layout: 'radio',
			},
			initialValue: 'affiliate',
			group: 'source',
		}),

		// Source 1: Affiliate Product Reference
		defineField({
			name: 'affiliateRef',
			title: 'Select Affiliate Product',
			description: 'Pulls title, image, price, coupon, rating, and tracking URL from your Affiliate Catalog.',
			type: 'reference',
			to: [{ type: 'affiliate.product' }],
			hidden: ({ parent }) => parent?.sourceMode !== 'affiliate',
			group: 'source',
		}),

		// Source 3: Custom Inline Details
		defineField({
			name: 'customUrl',
			title: 'Affiliate Target URL',
			description: 'Direct affiliate tracking URL.',
			type: 'url',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const parent = context.parent as { sourceMode?: string } | undefined
					if (parent?.sourceMode === 'custom' && !value) {
						return 'Please provide a valid URL for custom affiliate links'
					}
					return true
				}),
			hidden: ({ parent }) => parent?.sourceMode !== 'custom',
			group: 'source',
		}),
		defineField({
			name: 'customTitle',
			title: 'Product / Service Name',
			type: 'string',
			hidden: ({ parent }) => parent?.sourceMode !== 'custom',
			group: 'source',
		}),
		defineField({
			name: 'customImage',
			title: 'Product Image',
			type: 'image',
			options: { hotspot: true, metadata: ['lqip'] },
			hidden: ({ parent }) => parent?.sourceMode !== 'custom',
			group: 'source',
		}),
		defineField({
			name: 'customPrice',
			title: 'Sale Price',
			placeholder: '$2.99 / mo',
			type: 'string',
			fieldset: 'customPricing',
			hidden: ({ parent }) => parent?.sourceMode !== 'custom',
			group: 'source',
		}),
		defineField({
			name: 'customOriginalPrice',
			title: 'Original Price (Strikethrough)',
			placeholder: '$11.99 / mo',
			type: 'string',
			fieldset: 'customPricing',
			hidden: ({ parent }) => parent?.sourceMode !== 'custom',
			group: 'source',
		}),
		defineField({
			name: 'customHighlights',
			title: 'Feature Highlights (Bullets)',
			description: 'Key pros / selling points (e.g., "Free Domain", "99.9% Uptime").',
			type: 'array',
			of: [{ type: 'string' }],
			hidden: ({ parent }) => parent?.sourceMode !== 'custom',
			group: 'source',
		}),
		defineField({
			name: 'customRating',
			title: 'Rating (0 - 5.0)',
			type: 'number',
			initialValue: 4.9,
			validation: (Rule) => Rule.min(0).max(5).precision(1),
			hidden: ({ parent }) => parent?.sourceMode !== 'custom',
			group: 'source',
		}),

		// ================= GROUP 2: DEAL & OVERRIDES =================
		defineField({
			name: 'badge',
			title: 'Promotional Badge (Override)',
			description: 'e.g., "Editor\'s Choice", "Best Value", "75% OFF Deal". Leave blank to use default.',
			type: 'string',
			placeholder: "Editor's Choice",
			fieldset: 'dealBadging',
			group: 'overrides',
		}),
		defineField({
			name: 'couponCode',
			title: 'Promo / Coupon Code (Override)',
			description: 'e.g., "DEAN75". Readers can copy this code with 1 click.',
			type: 'string',
			placeholder: 'DEAN75',
			fieldset: 'dealBadging',
			group: 'overrides',
		}),
		defineField({
			name: 'customVerdict',
			title: 'Short Editorial Note (Optional)',
			description: 'Brief custom sentence explaining why this deal is recommended in this context.',
			type: 'text',
			rows: 2,
			group: 'overrides',
		}),

		// ================= GROUP 3: LAYOUT & STYLING =================
		defineField({
			name: 'layout',
			title: 'Display Layout',
			description: 'Choose how this product/deal is presented to readers.',
			type: 'string',
			options: {
				list: [
					{
						title: 'The Verdict Box (High-Converting Review Card)',
						value: 'verdict',
					},
					{
						title: 'Compact Deal Strip (Inline Horizontal Banner)',
						value: 'strip',
					},
					{
						title: 'Minimal CTA Button (Simple Link Button)',
						value: 'button',
					},
				],
				layout: 'radio',
			},
			initialValue: 'verdict',
			group: 'display',
		}),
		defineField({
			name: 'buttonText',
			title: 'CTA Button Label',
			description: 'e.g., "Claim Exclusive Deal", "Check Price on Amazon", "View Official Offer"',
			type: 'string',
			placeholder: 'Claim Exclusive Deal',
			initialValue: 'Claim Exclusive Deal',
			group: 'display',
		}),
		defineField({
			name: 'buttonTheme',
			title: 'CTA Button Theme',
			type: 'string',
			options: {
				list: [
					{ title: 'Brand Primary (High-Contrast Zinc)', value: 'primary' },
					{ title: 'Emerald Green (Best Value / Deal)', value: 'emerald' },
					{ title: 'Amazon Gold (Marketplace)', value: 'amber' },
					{ title: 'Flash Deal (Rose / Red)', value: 'rose' },
				],
				layout: 'radio',
			},
			initialValue: 'primary',
			group: 'display',
		}),
	],
	preview: {
		select: {
			sourceMode: 'sourceMode',
			affiliateTitle: 'affiliateRef.title',
			customTitle: 'customTitle',
			affiliateMedia: 'affiliateRef.image',
			customMedia: 'customImage',
			layout: 'layout',
			buttonText: 'buttonText',
		},
		prepare({
			sourceMode,
			affiliateTitle,
			customTitle,
			affiliateMedia,
			customMedia,
			layout,
			buttonText,
		}) {
			const title =
				sourceMode === 'affiliate' ? affiliateTitle : customTitle
			const media = affiliateMedia || customMedia || LinkIcon

			return {
				title: title || buttonText || 'Affiliate Product Block',
				subtitle: `Source: ${sourceMode || 'affiliate'} • Layout: ${layout || 'verdict'}`,
				media,
			}
		},
	},
})
