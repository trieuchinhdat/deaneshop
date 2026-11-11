import { defineArrayMember, defineField, defineType } from 'sanity'
import {
	ImageIcon,
} from '@sanity/icons'
import { FiFilm, FiImage, FiPlay, FiPackage } from 'react-icons/fi'
import modules from '../fragments/modules'

export default defineType({
	name: 'product',
	title: 'Products',
	type: 'document',
	icon: FiPackage,

	// 1. Optimized 3-Tab Architecture
	groups: [
		{ name: 'general', title: 'Overview & Content', default: true },
		{ name: 'commercial', title: 'Commercial & Sales' },
		{ name: 'specs_seo', title: 'Specs & SEO' },
	],

	// 2. Single-column layout with progressive disclosure collapsible fieldsets
	fieldsets: [
		{
			name: 'basicIdentity',
			title: 'Product Identity & Taxonomy',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'intentGroup',
			title: 'Conversion Strategy & Funnel Mode',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'pricingSection',
			title: 'Pricing & Currency Matrix',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'inventoryLogistics',
			title: 'Inventory, SKU & Commercial Logistics',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'ctaOverrides',
			title: 'Call-to-Action Customization',
			options: { collapsible: true, collapsed: true },
		},
		{
			name: 'promotionsGroup',
			title: 'Product Perks & Guarantees',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'specialDealGroup',
			title: 'Limited-Time Deal & Scarcity Countdown',
			options: { collapsible: true, collapsed: true },
		},
		{
			name: 'technicalSpecs',
			title: 'Technical & Physical Specifications',
			options: { collapsible: true, collapsed: false },
		},
	],

	fields: [
		/* ==================== TAB 1: OVERVIEW & CONTENT ==================== */
		defineField({
			name: 'title',
			title: 'Product Title',
			type: 'string',
			group: 'general',
			fieldset: 'basicIdentity',
			placeholder: 'e.g. DeanFlow Precision Solution',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'categories',
			title: 'Product Categories',
			description: 'Primary product taxonomy and catalog grouping.',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'product.category' }] }],
			group: 'general',
			fieldset: 'basicIdentity',
		}),

		defineField({
			name: 'tags',
			title: 'Product Tags',
			description: 'Search keywords and attribute tags.',
			type: 'array',
			of: [{ type: 'string' }],
			options: {
				layout: 'tags',
			},
			group: 'general',
			fieldset: 'basicIdentity',
		}),

		defineField({
			name: 'images',
			title: 'Product Media (Images & Videos)',
			description:
				'Upload high-resolution photography and video demos (MP4/WebM or YouTube/Vimeo URLs). The first visual serves as the primary storefront image.',
			type: 'array',
			group: 'general',
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
				defineArrayMember({
					type: 'file',
					name: 'video',
					title: 'Product Video (MP4 / WebM File)',
					icon: FiFilm,
					options: {
						accept: 'video/*',
					},
					fields: [
						defineField({
							name: 'alt',
							title: 'Video Title / Caption',
							type: 'string',
						}),
					],
					preview: {
						select: {
							title: 'alt',
						},
						prepare({ title }) {
							return {
								title: title || 'Product Video (File)',
								media: FiFilm,
							}
						},
					},
				}),
				defineArrayMember({
					type: 'object',
					name: 'videoUrl',
					title: 'Video URL (YouTube / Vimeo / TikTok)',
					icon: FiPlay,
					fields: [
						defineField({
							name: 'url',
							title: 'Video URL',
							type: 'url',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'alt',
							title: 'Video Title / Caption',
							type: 'string',
						}),
					],
					preview: {
						select: {
							title: 'alt',
							subtitle: 'url',
						},
						prepare({ title, subtitle }) {
							return {
								title: title || 'Product Video (Link)',
								subtitle,
								media: FiPlay,
							}
						},
					},
				}),
			],
		}),

		defineField({
			name: 'shortPitch',
			title: 'Value Proposition / Executive Summary',
			description: 'A 1-2 sentence compelling summary of why buyers choose this solution.',
			type: 'text',
			rows: 2,
			group: 'general',
			placeholder: 'e.g. Industrial-grade efficiency with zero-carbon footprint.',
		}),

		defineField({
			name: 'keyBenefits',
			title: 'Key Selling Highlights',
			description: 'Bulleted key customer benefits or commercial advantages.',
			type: 'array',
			group: 'general',
			of: [
				defineArrayMember({
					type: 'object',
					name: 'benefit',
					fields: [
						defineField({
							name: 'title',
							title: 'Benefit Title',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'description',
							title: 'Description',
							type: 'text',
							rows: 2,
						}),
					],
					preview: {
						select: {
							title: 'title',
							subtitle: 'description',
						},
					},
				}),
			],
		}),

		defineField({
			name: 'description',
			title: 'Rich Product Story & Overview',
			type: 'array',
			group: 'general',
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
			],
		}),

		defineField({
			...modules(),
			title: 'Modular Dynamic Landing Blocks',
			description: 'Enhance this product into a full-length direct-response sales letter.',
			group: 'general',
		}),

		/* ==================== TAB 2: COMMERCIAL & SALES ==================== */
		defineField({
			name: 'conversionType',
			title: 'Primary Conversion Mode',
			description: 'Determines customer conversion journey and primary call-to-action button.',
			type: 'string',
			group: 'commercial',
			fieldset: 'intentGroup',
			options: {
				list: [
					{ title: 'Request for Quotation / RFQ (B2B Export & Wholesale)', value: 'rfq' },
					{ title: 'Consultation & Demo Booking (High-Ticket)', value: 'consultation' },
					{ title: 'Sample Order / Direct Reserve', value: 'order_request' },
				],
			},
			initialValue: 'rfq',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'pricingModel',
			title: 'Pricing Model',
			description: 'How pricing is presented to global buyers.',
			type: 'string',
			group: 'commercial',
			fieldset: 'intentGroup',
			options: {
				list: [
					{ title: 'Fixed Price', value: 'fixed' },
					{ title: 'Price Range', value: 'range' },
					{ title: 'Starting At Price', value: 'starting_at' },
					{ title: 'Tiered / Volume Pricing (B2B)', value: 'tiered' },
					{ title: 'Quotation Upon Request (Hidden Price)', value: 'quote_only' },
				],
			},
			initialValue: 'fixed',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'currency',
			title: 'Currency',
			type: 'string',
			group: 'commercial',
			fieldset: 'pricingSection',
			options: {
				list: [
					{ title: 'USD - US Dollar ($)', value: 'USD' },
					{ title: 'EUR - Euro (€)', value: 'EUR' },
					{ title: 'GBP - British Pound (£)', value: 'GBP' },
					{ title: 'AUD - Australian Dollar ($)', value: 'AUD' },
					{ title: 'SGD - Singapore Dollar ($)', value: 'SGD' },
					{ title: 'VND - Vietnamese Dong (₫)', value: 'VND' },
				],
			},
			initialValue: 'USD',
			hidden: ({ parent }) => parent?.pricingModel === 'quote_only',
		}),

		defineField({
			name: 'price',
			title: 'Unit Price / Starting Price',
			type: 'number',
			group: 'commercial',
			fieldset: 'pricingSection',
			placeholder: '0.00',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const parent = context.parent as { pricingModel?: string }
					if (parent?.pricingModel !== 'quote_only' && (value === undefined || value < 0)) {
						return 'Price must be 0 or higher'
					}
					return true
				}),
			hidden: ({ parent }) => parent?.pricingModel === 'quote_only',
		}),

		defineField({
			name: 'maxPrice',
			title: 'Maximum Price (Upper Boundary for Range)',
			description: 'Upper boundary for price range.',
			type: 'number',
			group: 'commercial',
			fieldset: 'pricingSection',
			placeholder: '0.00',
			hidden: ({ parent }) => parent?.pricingModel !== 'range',
		}),

		defineField({
			name: 'compareAtPrice',
			title: 'Compare At Price / MSRP',
			description: 'Original list price displayed with a strikethrough for comparison.',
			type: 'number',
			group: 'commercial',
			fieldset: 'pricingSection',
			placeholder: '0.00',
			hidden: ({ parent }) => parent?.pricingModel === 'quote_only',
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
			name: 'priceNote',
			title: 'Price Term & Shipping Disclaimer',
			description: 'E.g. "Ex-works / FOB price. International freight calculated upon destination."',
			type: 'string',
			group: 'commercial',
			fieldset: 'pricingSection',
			initialValue: 'Ex-works export price. International shipping, insurance and customs quoted upon inquiry.',
		}),

		defineField({
			name: 'priceTiers',
			title: 'Volume / Tiered Pricing Matrix',
			description: 'Configure progressive volume discounts (e.g. 10-49: $15, 50-199: $12, 200+: VIP Quote).',
			type: 'array',
			group: 'commercial',
			fieldset: 'pricingSection',
			of: [
				defineArrayMember({
					type: 'object',
					name: 'priceTier',
					title: 'Price Tier',
					fields: [
						defineField({
							name: 'minQty',
							title: 'Min Quantity',
							type: 'number',
							validation: (Rule) => Rule.required().min(1),
						}),
						defineField({
							name: 'maxQty',
							title: 'Max Quantity (Leave empty for ∞ / and above)',
							type: 'number',
						}),
						defineField({
							name: 'unitPrice',
							title: 'Unit Price',
							type: 'number',
							validation: (Rule) => Rule.min(0),
						}),
						defineField({
							name: 'incoterm',
							title: 'Incoterm Default',
							type: 'string',
							options: {
								list: [
									{ title: 'FOB (Free On Board - VN Port)', value: 'FOB' },
									{ title: 'EXW (Ex Works - Factory Gate)', value: 'EXW' },
									{ title: 'CIF (Cost, Insurance & Freight)', value: 'CIF' },
									{ title: 'DDP (Delivered Duty Paid)', value: 'DDP' },
								],
							},
							initialValue: 'FOB',
						}),
						defineField({
							name: 'discountPercent',
							title: 'Discount % Badge (Optional)',
							type: 'number',
						}),
						defineField({
							name: 'badge',
							title: 'Highlight Badge (e.g. "Most Popular", "Best Value")',
							type: 'string',
						}),
						defineField({
							name: 'isCustomQuote',
							title: 'VIP Custom Quote (No fixed unit price)',
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
						},
						prepare({ minQty, maxQty, unitPrice, incoterm, isCustomQuote }) {
							const range = maxQty ? `${minQty} – ${maxQty} units` : `${minQty}+ units`
							const priceStr = isCustomQuote ? 'VIP Quote' : `$${unitPrice ?? 0} (${incoterm || 'FOB'})`
							return {
								title: `${range}: ${priceStr}`,
							}
						},
					},
				}),
			],
		}),

		defineField({
			name: 'sku',
			title: 'SKU / Model Number',
			type: 'string',
			group: 'commercial',
			fieldset: 'inventoryLogistics',
			placeholder: 'e.g. ECO-CROSS-2026',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'inStock',
			title: 'Available for Order / Inquiry',
			description: 'Toggle off to display Backorder or Out of Stock status.',
			type: 'boolean',
			group: 'commercial',
			fieldset: 'inventoryLogistics',
			initialValue: true,
		}),

		defineField({
			name: 'stock',
			title: 'Stock Quota',
			type: 'number',
			group: 'commercial',
			fieldset: 'inventoryLogistics',
			initialValue: 0,
		}),

		defineField({
			name: 'sold',
			title: 'Sold / Delivered Count',
			type: 'number',
			group: 'commercial',
			fieldset: 'inventoryLogistics',
			initialValue: 0,
		}),

		defineField({
			name: 'moq',
			title: 'Minimum Order Quantity (MOQ)',
			description: 'Minimum units required per order request (Default: 1 unit).',
			type: 'number',
			group: 'commercial',
			fieldset: 'inventoryLogistics',
			initialValue: 1,
			validation: (Rule) => Rule.min(1),
		}),

		defineField({
			name: 'leadTime',
			title: 'Dispatch & Production Lead Time',
			description: 'E.g. "Dispatches in 2-4 business days" or "Custom production: 2-3 weeks".',
			type: 'string',
			group: 'commercial',
			fieldset: 'inventoryLogistics',
			initialValue: 'Dispatches within 2-4 business days worldwide',
		}),

		defineField({
			name: 'specSheetPdf',
			title: 'Technical Spec Sheet / Catalog PDF',
			description: 'Downloadable PDF documentation for enterprise and institutional buyers.',
			type: 'file',
			group: 'commercial',
			fieldset: 'inventoryLogistics',
			options: {
				accept: 'application/pdf',
			},
		}),

		defineField({
			name: 'customCtaText',
			title: 'Custom Action Button Label (Optional)',
			description: 'Override the default button label (e.g. "Reserve Order Now" or "Get Official Quotation").',
			type: 'string',
			group: 'commercial',
			fieldset: 'ctaOverrides',
			placeholder: 'e.g. Request Official Quotation',
		}),

		defineField({
			name: 'customCtaSubtext',
			title: 'Trust Subtext below Action Button',
			description: 'Reassures buyers regarding payment and order verification.',
			type: 'string',
			group: 'commercial',
			fieldset: 'ctaOverrides',
			initialValue: 'No payment required today. Dedicated specialist confirms shipping rates within 12 hours.',
		}),

		defineField({
			name: 'promotionMode',
			title: 'Promotions Display Mode',
			description: 'Choose how promotional perks are displayed on this product page.',
			type: 'string',
			group: 'commercial',
			fieldset: 'promotionsGroup',
			options: {
				list: [
					{ title: 'Use Global Default Promotions', value: 'default' },
					{ title: 'Custom Promotions for This Product', value: 'custom' },
					{ title: 'Disabled (Hidden)', value: 'disabled' },
				],
				layout: 'radio',
			},
			initialValue: 'disabled',
		}),

		defineField({
			name: 'promotions',
			title: 'Custom Product Promotions',
			description: 'Exclusive promotional perks and commercial guarantees for this product.',
			type: 'object',
			group: 'commercial',
			fieldset: 'promotionsGroup',
			hidden: ({ parent }) => parent?.promotionMode !== 'custom',
			fields: [
				defineField({
					name: 'title',
					title: 'Headline',
					type: 'string',
					initialValue: 'Promotions & Perks',
				}),
				defineField({
					name: 'subtitle',
					title: 'Subtitle / Disclaimer',
					type: 'string',
					initialValue: 'Prices and promotional offers may end without prior notice',
				}),
				defineField({
					name: 'items',
					title: 'Promotional Items',
					type: 'array',
					of: [
						{
							type: 'object',
							name: 'promotionItem',
							title: 'Promotion Item',
							fields: [
								defineField({
									name: 'text',
									title: 'Offer Text',
									type: 'string',
									validation: (Rule) => Rule.required(),
								}),
								defineField({
									name: 'linkText',
									title: 'Link Text',
									type: 'string',
								}),
								defineField({
									name: 'linkUrl',
									title: 'Link URL',
									type: 'string',
								}),
								defineField({
									name: 'highlight',
									title: 'Highlight (Emphasize)',
									type: 'boolean',
									initialValue: false,
								}),
							],
							preview: {
								select: {
									title: 'text',
									subtitle: 'linkText',
								},
							},
						},
					],
				}),
			],
		}),

		defineField({
			name: 'enableSpecialDeal',
			title: 'Enable Special Deal / Limited-Time Scarcity Banner',
			description: 'Displays urgency countdown timer, campaign badge, and highlighted border.',
			type: 'boolean',
			group: 'commercial',
			fieldset: 'specialDealGroup',
			initialValue: false,
		}),

		defineField({
			name: 'specialDealConfig',
			title: 'Special Deal Configuration',
			type: 'object',
			group: 'commercial',
			fieldset: 'specialDealGroup',
			hidden: ({ parent }) => !parent?.enableSpecialDeal,
			fields: [
				defineField({
					name: 'badgeTitle',
					title: 'Deal Badge / Campaign Title',
					description: 'E.g. "Limited Export Allocation", "Pilot Batch Pricing", "Early Adopter Offer"',
					type: 'string',
					initialValue: 'Limited Allocation Offer',
				}),
				defineField({
					name: 'badgeIcon',
					title: 'Badge Icon',
					description: 'Upload icon displayed beside the badge title. Recommended: transparent PNG.',
					type: 'image',
					options: { hotspot: true },
				}),
				defineField({
					name: 'channelText',
					title: 'Channel Tag',
					description: 'E.g. "EXPORT DIRECT", "LIMITED RUN"',
					type: 'string',
					initialValue: 'EXPORT DIRECT',
				}),
				defineField({
					name: 'endTime',
					title: 'Countdown Expiration Date & Time',
					type: 'datetime',
				}),
				defineField({
					name: 'totalQuota',
					title: 'Total Allocation Units Available',
					type: 'number',
					initialValue: 20,
				}),
				defineField({
					name: 'remainingQuota',
					title: 'Remaining Units',
					type: 'number',
					initialValue: 14,
				}),
				defineField({
					name: 'specialConditions',
					title: 'Deal Terms & Conditions',
					description: 'List special terms for this deal (Leave empty to inherit from Global Settings).',
					type: 'array',
					of: [{ type: 'string' }],
				}),
			],
		}),

		/* ==================== TAB 3: SPECS & SEO ==================== */
		defineField({
			name: 'specs',
			title: 'Product Specifications',
			description: 'Technical and physical attributes (e.g. Dimensions, Weight, Materials, Voltage, Certifications).',
			type: 'array',
			group: 'specs_seo',
			fieldset: 'technicalSpecs',
			of: [
				defineArrayMember({
					type: 'object',
					name: 'specItem',
					fields: [
						defineField({
							name: 'label',
							title: 'Attribute / Label',
							type: 'string',
							placeholder: 'e.g. Dimensions, Weight, Materials',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'value',
							title: 'Value',
							type: 'string',
							placeholder: 'e.g. 120 x 80 x 45 cm',
							validation: (Rule) => Rule.required(),
						}),
					],
					preview: {
						select: {
							title: 'label',
							subtitle: 'value',
						},
					},
				}),
			],
		}),

		defineField({
			name: 'metadata',
			title: 'SEO & Social Metadata',
			type: 'metadata',
			group: 'specs_seo',
		}),
	],

	// 3. Document list view preview
	preview: {
		select: {
			title: 'title',
			sku: 'sku',
			price: 'price',
			currency: 'currency',
			conversionType: 'conversionType',
			inStock: 'inStock',
			media: 'images.0',
		},
		prepare({ title, sku, price, currency, conversionType, inStock, media }) {
			const modeLabel =
				conversionType === 'rfq'
					? 'RFQ'
					: conversionType === 'consultation'
						? 'Consultation'
						: 'Order'

			const priceDisplay =
				price !== undefined ? `${currency || 'USD'} ${Number(price).toLocaleString('en-US')}` : 'Custom Quote'

			const stockIndicator = inStock === false ? '🔴 Out of Stock' : '🟢 In Stock'

			return {
				title: title || 'Untitled Product',
				subtitle: `[${modeLabel}] ${priceDisplay} • SKU: ${sku || 'N/A'} • ${stockIndicator}`,
				media: media || FiPackage,
			}
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
