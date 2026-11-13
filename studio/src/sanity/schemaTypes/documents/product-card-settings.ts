import { defineField, defineType } from 'sanity'
import { VscLayout } from 'react-icons/vsc'

export default defineType({
	name: 'product-card-settings',
	title: 'Product Card Settings',
	type: 'document',
	icon: VscLayout,

	// 1. Structured Multi-Tab Architecture for Non-Technical Merchants
	groups: [
		{ name: 'info', title: 'Product Info', default: true },
		{ name: 'media', title: 'Image & Media' },
		{ name: 'pricing', title: 'Pricing & Discounts' },
		{ name: 'badges', title: 'Badges & Inventory' },
		{ name: 'actions', title: 'Actions & CTAs' },
		{ name: 'layout', title: 'Layout & Styling' },
	],

	// 2. Clear Collapsible Fieldsets
	fieldsets: [
		{
			name: 'infoGroup',
			title: 'Product Information Elements',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'mediaGroup',
			title: 'Thumbnail Ratio, Fit & Secondary Flip',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'pricingGroup',
			title: 'Price Display & Strike-Through Rules',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'badgesGroup',
			title: 'Promotional Badges & Stock Status',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'swatchesGroup',
			title: 'Variant Color Swatches',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'actionsGroup',
			title: 'Interactive Quick Actions (Add to Cart / Quick View)',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'layoutGroup',
			title: 'Card Aesthetic, Alignment & Hover Feedback',
			options: { collapsible: true, collapsed: false },
		},
	],

	fields: [
		/* ==================== TAB 1: PRODUCT INFO ==================== */
		defineField({
			name: 'cardShowCategory',
			title: 'Show Product Category Pill',
			description: 'Displays the primary category label above the product title.',
			type: 'boolean',
			initialValue: true,
			group: 'info',
			fieldset: 'infoGroup',
		}),
		defineField({
			name: 'cardShowRating',
			title: 'Show Star Rating & Review Count',
			description: 'Displays customer star ratings and review count (e.g. 4.9 ★ (28)).',
			type: 'boolean',
			initialValue: true,
			group: 'info',
			fieldset: 'infoGroup',
		}),
		defineField({
			name: 'cardShowSoldCount',
			title: 'Show Units Sold Social Proof',
			description: 'Displays verified units sold/delivered for social proof (e.g. 1.2k+ sold).',
			type: 'boolean',
			initialValue: true,
			group: 'info',
			fieldset: 'infoGroup',
		}),

		/* ==================== TAB 2: IMAGE & MEDIA ==================== */
		defineField({
			name: 'cardImageAspectRatio',
			title: 'Product Thumbnail Aspect Ratio',
			description: 'Standardized image frame ratio for catalog grid consistency.',
			type: 'string',
			options: {
				list: [
					{ title: 'Square (1:1) — E-Commerce Standard', value: '1:1' },
					{ title: 'Portrait (3:4) — Fashion & Editorial', value: '3:4' },
					{ title: 'Landscape (4:3) — Equipment & Wide Products', value: '4:3' },
				],
				layout: 'radio',
			},
			initialValue: '1:1',
			group: 'media',
			fieldset: 'mediaGroup',
		}),
		defineField({
			name: 'cardImageFit',
			title: 'Image Fitting Mode',
			description: 'Choose "Cover" to fill the entire thumbnail box, or "Contain" to display the full product with subtle padding (recommended for items with tight borders).',
			type: 'string',
			options: {
				list: [
					{ title: 'Cover (Fill thumbnail box)', value: 'cover' },
					{ title: 'Contain (Fit entire item without cropping)', value: 'contain' },
				],
				layout: 'radio',
			},
			initialValue: 'cover',
			group: 'media',
			fieldset: 'mediaGroup',
		}),
		defineField({
			name: 'cardShowSecondaryImageHover',
			title: 'Flip to Secondary Image on Hover',
			description: 'Smoothly crossfades to the second gallery photo or video when hovering over the thumbnail.',
			type: 'boolean',
			initialValue: true,
			group: 'media',
			fieldset: 'mediaGroup',
		}),
		defineField({
			name: 'cardHoverEffect',
			title: 'Thumbnail Hover Effect',
			description: 'Visual feedback when hovering over the product card.',
			type: 'string',
			options: {
				list: [
					{ title: 'Card Lift (Subtle elevation and shadow)', value: 'lift' },
					{ title: 'Image Zoom (Subtle scale up on photo)', value: 'zoom' },
					{ title: 'None (Clean flat transition)', value: 'none' },
				],
				layout: 'radio',
			},
			initialValue: 'lift',
			group: 'media',
			fieldset: 'mediaGroup',
		}),

		/* ==================== TAB 3: PRICING & DISCOUNTS ==================== */
		defineField({
			name: 'cardShowPrice',
			title: 'Show Product Price',
			description: 'Enables or hides price presentation on catalog cards.',
			type: 'boolean',
			initialValue: true,
			group: 'pricing',
			fieldset: 'pricingGroup',
		}),
		defineField({
			name: 'cardShowCompareAtPrice',
			title: 'Show Strike-Through Compare-at Price',
			description: 'Displays the original MSRP price with a strikethrough when on sale.',
			type: 'boolean',
			initialValue: true,
			group: 'pricing',
			fieldset: 'pricingGroup',
			hidden: ({ parent }) => parent?.cardShowPrice === false,
		}),

		/* ==================== TAB 4: BADGES & INVENTORY ==================== */
		defineField({
			name: 'cardShowDiscountBadge',
			title: 'Show Discount Savings Badge',
			description: 'Displays a promotional discount tag when compare-at price exceeds regular price.',
			type: 'boolean',
			initialValue: true,
			group: 'badges',
			fieldset: 'badgesGroup',
		}),
		defineField({
			name: 'cardDiscountStyle',
			title: 'Discount Badge Display Format',
			type: 'string',
			options: {
				list: [
					{ title: 'Percentage Off (e.g. 20% OFF)', value: 'percent' },
					{ title: 'Monetary Amount Saved (e.g. Save $15)', value: 'amount' },
				],
				layout: 'radio',
			},
			initialValue: 'percent',
			group: 'badges',
			fieldset: 'badgesGroup',
			hidden: ({ parent }) => parent?.cardShowDiscountBadge === false,
		}),
		defineField({
			name: 'cardBadgePosition',
			title: 'Promotional Badge Corner',
			description: 'Choose which corner badges and discount tags appear on.',
			type: 'string',
			options: {
				list: [
					{ title: 'Top Left (Recommended)', value: 'topLeft' },
					{ title: 'Top Right', value: 'topRight' },
				],
				layout: 'radio',
			},
			initialValue: 'topLeft',
			group: 'badges',
			fieldset: 'badgesGroup',
		}),
		defineField({
			name: 'cardShowCustomBadges',
			title: 'Show Promotional Tag Badges (New, Best Seller, Featured)',
			description: 'Automatically highlights products tagged as "New", "Best Seller", or "Featured".',
			type: 'boolean',
			initialValue: true,
			group: 'badges',
			fieldset: 'badgesGroup',
		}),
		defineField({
			name: 'cardShowOutOfStock',
			title: 'Show "Out of Stock" Overlay & Dimming',
			description: 'Displays an "Out of Stock" status label and dims thumbnail when inventory is 0 or unavailable.',
			type: 'boolean',
			initialValue: true,
			group: 'badges',
			fieldset: 'badgesGroup',
		}),

		// Color Swatches
		defineField({
			name: 'cardShowColorSwatches',
			title: 'Show Selectable Color Swatches',
			description: 'Renders interactive color swatches beneath thumbnail for immediate colorway previews.',
			type: 'boolean',
			initialValue: true,
			group: 'badges',
			fieldset: 'swatchesGroup',
		}),
		defineField({
			name: 'cardMaxColorSwatches',
			title: 'Maximum Swatches to Display before (+N)',
			description: 'Maximum visible swatch circles before grouping remaining colors into a "+N more" badge.',
			type: 'number',
			initialValue: 4,
			placeholder: '4',
			validation: (Rule) => Rule.min(1).max(10).error('Please specify between 1 and 10 swatches.'),
			group: 'badges',
			fieldset: 'swatchesGroup',
			hidden: ({ parent }) => parent?.cardShowColorSwatches === false,
		}),

		/* ==================== TAB 5: ACTIONS & CTAS ==================== */
		defineField({
			name: 'cardQuickActionMode',
			title: 'Card Interactive Quick Action Mode',
			description: 'Determines the storefront action button style on hover or tap.',
			type: 'string',
			options: {
				list: [
					{ title: 'None (Direct navigation on card click)', value: 'none' },
					{ title: 'Quick Add Button (Bottom Bar)', value: 'quickAdd' },
					{ title: 'Quick View Modal Button (Bottom Bar)', value: 'quickView' },
					{ title: 'Dual Actions (Hover Icon Floating Bar)', value: 'both' },
				],
				layout: 'radio',
			},
			initialValue: 'quickAdd',
			group: 'actions',
			fieldset: 'actionsGroup',
		}),
		defineField({
			name: 'cardQuickAddText',
			title: 'Quick Add Button Text Label',
			description: 'Default label for one-click add button. Products with multiple variants will open the selection modal.',
			type: 'string',
			initialValue: 'Add to Cart',
			placeholder: 'e.g. Add to Cart',
			group: 'actions',
			fieldset: 'actionsGroup',
			hidden: ({ parent }) =>
				parent?.cardQuickActionMode !== 'quickAdd' &&
				parent?.cardQuickActionMode !== 'both',
		}),
		defineField({
			name: 'cardQuickViewText',
			title: 'Quick View Button Text Label',
			description: 'Label for opening the quick specification and option modal.',
			type: 'string',
			initialValue: 'Quick View',
			placeholder: 'e.g. Quick View',
			group: 'actions',
			fieldset: 'actionsGroup',
			hidden: ({ parent }) =>
				parent?.cardQuickActionMode !== 'quickView' &&
				parent?.cardQuickActionMode !== 'both',
		}),
		defineField({
			name: 'cardShowWishlist',
			title: 'Show Wishlist / Favorite Icon (Optional)',
			description: 'Renders quick save/bookmark button at the upper corner of the card.',
			type: 'boolean',
			initialValue: false,
			group: 'actions',
			fieldset: 'actionsGroup',
		}),

		/* ==================== TAB 6: LAYOUT & STYLING ==================== */
		defineField({
			name: 'cardContentAlignment',
			title: 'Content Alignment',
			description: 'Text alignment for product title, category, price, and ratings.',
			type: 'string',
			options: {
				list: [
					{ title: 'Left Aligned (Clean & modern standard for US/UK)', value: 'left' },
					{ title: 'Center Aligned', value: 'center' },
				],
				layout: 'radio',
			},
			initialValue: 'left',
			group: 'layout',
			fieldset: 'layoutGroup',
		}),
		defineField({
			name: 'cardStyle',
			title: 'Card Visual Style Preset',
			description: 'Surface styling and border presentation.',
			type: 'string',
			options: {
				list: [
					{ title: 'Standard (Clean border with subtle card background & elevation)', value: 'standard' },
					{ title: 'Bordered Minimal (Crisp border with transparent surface)', value: 'bordered' },
					{ title: 'Flat (No card border, seamless catalog flow)', value: 'flat' },
				],
				layout: 'radio',
			},
			initialValue: 'standard',
			group: 'layout',
			fieldset: 'layoutGroup',
		}),
	],

	preview: {
		prepare: () => ({
			title: 'Product Card Settings',
			subtitle: 'Badges, Layout, Media, Pricing & Quick Actions',
		}),
	},
})

