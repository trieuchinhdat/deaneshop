import { defineArrayMember, defineField, defineType } from 'sanity'
import { BillIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'tiered-pricing',
	title: 'Volume Pricing (MOQ)',
	description:
		'MOQ and volume discount pricing tables tailored for high-conversion B2B wholesale orders and institutional buyers.',
	type: 'object',
	icon: BillIcon,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: 'B2B Wholesale & Volume Discounts',
			headline: 'Transparent Volume-Based Pricing',
			subtitle:
				'Higher manufacturing economies of scale unlock lower per-unit export costs. All tiers based on standard export packaging and FOB terms.',
			ctaText: 'Request Official Quotation (RFQ)',
			ctaLink: '#lead-form',
			tableStyle: 'cards',
			currency: 'USD',
			defaultIncoterm: 'FOB',
			actionType: 'rfq',
			enableCurrencySelector: true,
			highlightBestValue: true,
			showCalculator: true,
			colorTheme: 'default',
			termsNotice:
				'All wholesale prices are quoted on FOB standard export packaging basis. International sea/air freight, customs clearance, and local duties will be confirmed prior to final proforma invoice issuance.',
			tiers: [
				{
					_key: genKey(),
					minQty: 1000,
					maxQty: 4999,
					unitPrice: 0.18,
					discountPercent: 5,
					incoterm: 'FOB',
					badge: 'Standard Wholesale',
					isCustomQuote: false,
				},
				{
					_key: genKey(),
					minQty: 5000,
					maxQty: 19999,
					unitPrice: 0.14,
					discountPercent: 15,
					incoterm: 'FOB',
					badge: 'Best Value',
					isCustomQuote: false,
				},
				{
					_key: genKey(),
					minQty: 20000,
					unitPrice: 0.09,
					discountPercent: 30,
					incoterm: 'FOB',
					badge: 'Enterprise Bulk',
					isCustomQuote: false,
				},
			],
		}
	},
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'design', title: 'Design' },
		{ name: 'settings', title: 'Settings' },
	],
	fieldsets: [
		{
			name: 'headerInfo',
			title: 'Header & Value Proposition',
			options: { columns: 1 },
		},
		{
			name: 'pricingMatrix',
			title: 'Pricing Tiers & Quantity Breaks',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'callToAction',
			title: 'Call to Action (RFQ)',
			options: { columns: 1 },
		},
		{
			name: 'termsNoticeFieldset',
			title: 'Commercial Terms & Shipping Footnote',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'styling',
			title: 'Layout & Visual Presentation',
			options: { columns: 1 },
		},
		{
			name: 'tradeConfig',
			title: 'Global Trade & Currency Defaults',
			options: { columns: 1 },
		},
	],
	fields: [
		// -------------------------------------------------------------
		// TAB 1: CONTENT
		// -------------------------------------------------------------
		defineField({
			name: 'badge',
			title: 'Header Badge',
			description:
				'Small uppercase pill badge displayed above the headline (e.g., "B2B Wholesale & Volume Discounts").',
			type: 'string',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'headline',
			title: 'Section Headline',
			description:
				'Primary title emphasizing economies of scale, transparent tiered pricing, or factory-direct wholesale savings.',
			type: 'string',
			validation: (Rule) =>
				Rule.required().error('Section headline is required for high conversion.'),
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'subtitle',
			title: 'Subtitle & Logistics Overview',
			description:
				'Contextual explanation of manufacturing tiers, export packaging quality, or order dispatch terms.',
			type: 'text',
			rows: 2,
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'tiers',
			title: 'Pricing Tiers & MOQ Breaks',
			description:
				'Add quantity breaks in ascending order (e.g. Tier 1: 1,000–4,999; Tier 2: 5,000–19,999; Tier 3: 20,000+).',
			type: 'array',
			group: 'content',
			fieldset: 'pricingMatrix',
			of: [
				defineArrayMember({
					type: 'object',
					name: 'tierItem',
					title: 'Pricing Tier',
					fields: [
						defineField({
							name: 'minQty',
							title: 'Minimum Order Quantity (MOQ)',
							description: 'The minimum number of units required to qualify for this tier rate.',
							type: 'number',
							validation: (Rule) =>
								Rule.required()
									.min(1)
									.error('Minimum quantity must be at least 1 unit.'),
						}),
						defineField({
							name: 'maxQty',
							title: 'Maximum Quantity (Blank for Unlimited)',
							description:
								'Upper quantity threshold. Leave blank for the highest tier (e.g. 20,000+ units).',
							type: 'number',
							validation: (Rule) =>
								Rule.min(Rule.valueOfField('minQty')).warning(
									'Maximum quantity should be greater than minimum quantity.',
								),
						}),
						defineField({
							name: 'unitPrice',
							title: 'Unit Price',
							description:
								'Progressive per-unit price for this quantity range. Hidden when custom quote is required.',
							type: 'number',
							validation: (Rule) =>
								Rule.min(0).error('Unit price cannot be negative.'),
							hidden: ({ parent }) => Boolean(parent?.isCustomQuote),
						}),
						defineField({
							name: 'discountPercent',
							title: 'Discount Percentage (%)',
							description:
								'Optional percentage savings badge displayed to buyer (e.g. 15 for "Save 15%").',
							type: 'number',
							validation: (Rule) =>
								Rule.min(0)
									.max(100)
									.warning('Discount percentage should be between 0% and 100%.'),
						}),
						defineField({
							name: 'incoterm',
							title: 'Incoterm (Shipping Basis)',
							description:
								'Standard International Commercial Term for this tier. Defaults to FOB.',
							type: 'string',
							options: {
								list: [
									{ title: 'FOB (Free On Board - Standard Port)', value: 'FOB' },
									{ title: 'EXW (Ex Works - Factory Gate)', value: 'EXW' },
									{ title: 'CIF (Cost, Insurance & Freight)', value: 'CIF' },
									{ title: 'DDP (Delivered Duty Paid - Door Delivery)', value: 'DDP' },
								],
							},
							initialValue: 'FOB',
							hidden: ({ parent }) => Boolean(parent?.isCustomQuote),
						}),
						defineField({
							name: 'badge',
							title: 'Highlight Tag (e.g., Best Value, Enterprise)',
							description:
								'Promotional tag badge displayed prominently at the top of the card or row.',
							type: 'string',
						}),
						defineField({
							name: 'features',
							title: 'Included Tier Features & Inclusions',
							description:
								'Optional bullet points specific to this tier (e.g. "Free lab certification", "Custom carton markings"). Leave empty to use standard inclusions.',
							type: 'array',
							of: [{ type: 'string' }],
						}),
						defineField({
							name: 'isCustomQuote',
							title: 'Requires Custom Quotation (Enterprise RFQ)',
							description:
								'Enable for high-volume orders requiring bespoke factory tooling, OEM customization, or dedicated proforma negotiation.',
							type: 'boolean',
							initialValue: false,
						}),
					],
					preview: {
						select: {
							minQty: 'minQty',
							maxQty: 'maxQty',
							unitPrice: 'unitPrice',
							incoterm: 'incoterm',
							isCustomQuote: 'isCustomQuote',
							badge: 'badge',
						},
						prepare({ minQty, maxQty, unitPrice, incoterm, isCustomQuote, badge }) {
							const formattedMin = minQty ? Number(minQty).toLocaleString('en-US') : '1'
							const formattedMax = maxQty ? Number(maxQty).toLocaleString('en-US') : null
							const range = formattedMax
								? `${formattedMin} – ${formattedMax} units`
								: `${formattedMin}+ units`
							const price = isCustomQuote
								? 'VIP Custom Quote'
								: `$${unitPrice ?? 0}/unit (${incoterm || 'FOB'})`
							const badgeText = badge ? ` [${badge}]` : ''
							return {
								title: `${range} ➔ ${price}${badgeText}`,
							}
						},
					},
				}),
			],
		}),
		defineField({
			name: 'actionType',
			title: 'Action Mode',
			description:
				'Choose whether clicking action buttons scrolls to an RFQ inquiry form with automated quote prefill, or directly adds items to the shopping cart.',
			type: 'string',
			options: {
				list: [
					{
						title: 'RFQ Lead Capture (Anchor Scroll & Form Prefill)',
						value: 'rfq',
					},
					{
						title: 'Direct Add to Cart (E-Commerce Wholesale Order)',
						value: 'cart',
					},
				],
				layout: 'radio',
			},
			initialValue: 'rfq',
			group: 'content',
			fieldset: 'callToAction',
		}),
		defineField({
			name: 'linkedProduct',
			title: 'Linked Product (for Direct Cart Add)',
			description:
				'Select the catalog product associated with this volume pricing table for direct one-click cart addition.',
			type: 'reference',
			to: [{ type: 'product' }],
			hidden: ({ parent }) => parent?.actionType !== 'cart',
			group: 'content',
			fieldset: 'callToAction',
		}),
		defineField({
			name: 'ctaText',
			title: 'Action Button Label',
			description: 'Text displayed on primary buttons (e.g., "Request Official Quotation (RFQ)").',
			type: 'string',
			initialValue: 'Request Official Quotation (RFQ)',
			group: 'content',
			fieldset: 'callToAction',
		}),
		defineField({
			name: 'ctaLink',
			title: 'Action Button Link',
			description:
				'Target anchor or URL (e.g., "#lead-form", "/contact", or mailto: link). Ignored if Action Mode is Direct Add to Cart.',
			type: 'string',
			initialValue: '#lead-form',
			group: 'content',
			fieldset: 'callToAction',
		}),
		defineField({
			name: 'termsNotice',
			title: 'Logistics, Shipping & Terms Footnote',
			description:
				'Legal or commercial disclaimer displayed under the pricing table (e.g. freight, port of loading, inspection certificates).',
			type: 'text',
			rows: 2,
			initialValue:
				'All wholesale prices are quoted on FOB standard export packaging basis. International sea/air freight, customs clearance, and local duties will be confirmed prior to final proforma invoice issuance.',
			group: 'content',
			fieldset: 'termsNoticeFieldset',
		}),

		// -------------------------------------------------------------
		// TAB 2: DESIGN
		// -------------------------------------------------------------
		defineField({
			name: 'tableStyle',
			title: 'Layout & Display Variant',
			description:
				'Choose between interactive elevated cards (ideal for mobile and high engagement) or a comprehensive B2B comparison data table.',
			type: 'string',
			options: {
				list: [
					{ title: 'Elevated Cards (Interactive Selection)', value: 'cards' },
					{ title: 'Commercial Comparison Table', value: 'table' },
					{ title: 'Minimalist Clean Cards', value: 'minimal' },
				],
				layout: 'radio',
			},
			initialValue: 'cards',
			group: 'design',
			fieldset: 'styling',
		}),
		defineField({
			name: 'highlightBestValue',
			title: 'Auto-Highlight Best Value Tier',
			description:
				'Automatically emphasizes the tier with the highest percentage savings or marked badge with an accent border and elevation.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
			fieldset: 'styling',
		}),
		defineField({
			name: 'showCalculator',
			title: 'Interactive Order Batch Calculator',
			description:
				'Displays an intuitive volume simulator allowing buyers to input their exact order size to see active tier rates and estimated total savings.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
			fieldset: 'styling',
		}),
		defineField({
			name: 'colorTheme',
			title: 'Section Background Styling',
			description:
				'Choose a surface background color that harmonizes with adjacent page modules.',
			type: 'string',
			options: {
				list: [
					{ title: 'Default (Pure Clean White)', value: 'default' },
					{ title: 'Subtle Surface (Warm Neutral Tint)', value: 'surface' },
					{ title: 'Brand Accent Tint (Subtle Primary Wash)', value: 'brand' },
				],
			},
			initialValue: 'default',
			group: 'design',
			fieldset: 'styling',
		}),

		// -------------------------------------------------------------
		// TAB 3: SETTINGS
		// -------------------------------------------------------------
		defineField({
			name: 'enableCurrencySelector',
			title: 'Visitor Currency Converter',
			description:
				'Display an interactive currency switcher pill allowing global buyers (US, UK, Europe, Canada, Australia) to preview live converted volume rates.',
			type: 'boolean',
			initialValue: true,
			group: 'settings',
			fieldset: 'tradeConfig',
		}),
		defineField({
			name: 'currency',
			title: 'Default Base Currency',
			description:
				'Primary accounting currency for base unit prices and standard exports.',
			type: 'string',
			options: {
				list: [
					{ title: 'USD ($) — United States Dollar', value: 'USD' },
					{ title: 'GBP (£) — British Pound Sterling', value: 'GBP' },
					{ title: 'EUR (€) — Euro', value: 'EUR' },
					{ title: 'CAD (C$) — Canadian Dollar', value: 'CAD' },
					{ title: 'AUD (A$) — Australian Dollar', value: 'AUD' },
				],
			},
			initialValue: 'USD',
			group: 'settings',
			fieldset: 'tradeConfig',
		}),
		defineField({
			name: 'defaultIncoterm',
			title: 'Default Incoterm',
			description:
				'Default commercial delivery term when not individually specified on a tier.',
			type: 'string',
			options: {
				list: [
					{ title: 'FOB (Free On Board - Standard Port)', value: 'FOB' },
					{ title: 'EXW (Ex Works - Factory Gate)', value: 'EXW' },
					{ title: 'CIF (Cost, Insurance & Freight)', value: 'CIF' },
					{ title: 'DDP (Delivered Duty Paid - Door Delivery)', value: 'DDP' },
				],
			},
			initialValue: 'FOB',
			group: 'settings',
			fieldset: 'tradeConfig',
		}),
		defineField({
			name: 'customQuoteThreshold',
			title: 'Custom RFQ Quantity Threshold',
			description:
				'Optional volume quantity at or above which orders automatically transition to VIP Custom RFQ mode.',
			type: 'number',
			validation: (Rule) =>
				Rule.min(1).warning('Custom quote threshold must be at least 1 unit.'),
			group: 'settings',
			fieldset: 'tradeConfig',
		}),
		defineField({
			name: 'attributes',
			title: 'Module Attributes & Anchor ID',
			type: 'module-attributes',
			group: 'settings',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'tiered-pricing',
		icon: BillIcon,
		titleFields: ['headline', 'badge'],
		select: {
			tiers: 'tiers',
			currency: 'currency',
			badge: 'badge',
			tableStyle: 'tableStyle',
		},
		metadata: (doc) => [
			doc.badge || null,
			doc.tiers?.length ? `${doc.tiers.length} pricing tiers` : null,
			doc.currency ? `Currency: ${doc.currency}` : null,
			doc.tableStyle ? `Layout: ${doc.tableStyle}` : null,
		],
	}),
})
