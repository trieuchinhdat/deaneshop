import { defineField, defineType } from 'sanity'
import { MobileDeviceIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'sticky-mobile-cta',
	title: 'Sticky Buy Bar',
	description:
		'High-converting persistent buy bar with product info, pricing, star ratings, and instant checkout triggers for mobile and desktop.',
	type: 'object',
	icon: MobileDeviceIcon,
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'layout', title: 'Layout & Visibility' },
		{ name: 'appearance', title: 'Appearance & Theme' },
		{ name: 'settings', title: 'Behavior & Settings' },
	],
	fieldsets: [
		{
			name: 'productInfo',
			title: 'Product & Offer Presentation',
			options: { columns: 1 },
		},
		{
			name: 'pricingGroup',
			title: 'Pricing & Savings Badges',
			options: { columns: 2 },
		},
		{
			name: 'socialProofGroup',
			title: 'Ratings, Reviews & Guarantees',
			options: { columns: 1 },
		},
		{
			name: 'primaryActionGroup',
			title: 'Primary Purchase / Checkout Button',
			options: { columns: 1 },
		},
		{
			name: 'secondaryActionGroup',
			title: 'Quick Contact & Direct Support',
			options: { columns: 1 },
		},
		{
			name: 'positioningGroup',
			title: 'Positioning & Screen Visibility',
			options: { columns: 1 },
		},
		{
			name: 'triggerGroup',
			title: 'Display & Scroll Triggers',
			options: { columns: 1 },
		},
		{
			name: 'dismissGroup',
			title: 'Dismissal & Session Handling',
			options: { columns: 1 },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// --- Group: Content / Fieldset: productInfo ---
		defineField({
			name: 'linkedProduct',
			title: 'Linked Store Product (Optional)',
			description:
				'Connect directly to a catalog product to sync live prices, thumbnail, and enable 1-click Add to Cart.',
			type: 'reference',
			to: [{ type: 'product' }],
			group: 'content',
			fieldset: 'productInfo',
		}),
		defineField({
			name: 'image',
			title: 'Product / Bundle Thumbnail',
			description:
				'Optional product shot or bundle preview shown beside the title (1:1 square recommended).',
			type: 'image',
			options: { hotspot: true },
			fields: [
				defineField({
					name: 'alt',
					title: 'Alternative Text',
					description: 'Important for SEO and screen reader accessibility.',
					type: 'string',
					initialValue: 'Product thumbnail',
				}),
			],
			group: 'content',
			fieldset: 'productInfo',
		}),
		defineField({
			name: 'title',
			title: 'Product / Offer Headline',
			description: 'Short headline shown on the bar (e.g. package name or product title).',
			type: 'string',
			initialValue: 'Special Promo Package',
			validation: (Rule) => Rule.required(),
			group: 'content',
			fieldset: 'productInfo',
		}),
		defineField({
			name: 'badge',
			title: 'Highlight or Urgency Tag',
			description: 'E.g., "Save 30%", "Best Seller", or "Free Shipping". Leave blank to hide.',
			type: 'string',
			initialValue: 'Save 30%',
			group: 'content',
			fieldset: 'productInfo',
		}),

		// --- Group: Content / Fieldset: pricingGroup ---
		defineField({
			name: 'price',
			title: 'Current / Sale Price',
			description: 'Main price display (e.g. "$49.00" or "£39.00").',
			type: 'string',
			initialValue: '$49.00',
			group: 'content',
			fieldset: 'pricingGroup',
		}),
		defineField({
			name: 'originalPrice',
			title: 'Original / Strike-through Price (Optional)',
			description: 'Compare-at price with strike-through line (e.g. "$79.00" or "£59.00").',
			type: 'string',
			initialValue: '$79.00',
			group: 'content',
			fieldset: 'pricingGroup',
		}),
		defineField({
			name: 'priceOrBadge',
			title: 'Legacy Price or Highlight Badge (Fallback)',
			description: 'Maintained for backward compatibility with older pages.',
			type: 'string',
			hidden: true,
			group: 'content',
			fieldset: 'pricingGroup',
		}),

		// --- Group: Content / Fieldset: socialProofGroup ---
		defineField({
			name: 'ratingScore',
			title: 'Rating Score (Optional)',
			description: 'Numerical rating (e.g. "4.9"). Renders with an authentic gold star icon.',
			type: 'string',
			initialValue: '4.9',
			group: 'content',
			fieldset: 'socialProofGroup',
		}),
		defineField({
			name: 'ratingCount',
			title: 'Review Count / Proof Text (Optional)',
			description: 'E.g. "(2.4k+ reviews)" or "Over 5,000 satisfied buyers".',
			type: 'string',
			initialValue: '(2.4k+ reviews)',
			group: 'content',
			fieldset: 'socialProofGroup',
		}),
		defineField({
			name: 'ratingText',
			title: 'Legacy Combined Rating Text (Fallback)',
			description: 'Maintained for backward compatibility.',
			type: 'string',
			hidden: true,
			group: 'content',
			fieldset: 'socialProofGroup',
		}),
		defineField({
			name: 'trustNote',
			title: 'Trust / Shipping Guarantee Note',
			description:
				'Short reassurance snippet visible on desktop & tablet (e.g. "Free 2-day delivery • 30-day money-back guarantee").',
			type: 'string',
			initialValue: 'Free shipping & 30-day guarantee',
			group: 'content',
			fieldset: 'socialProofGroup',
		}),

		// --- Group: Content / Fieldset: primaryActionGroup ---
		defineField({
			name: 'actionType',
			title: 'CTA Action Behavior',
			description:
				'Choose whether clicking the button smooth-scrolls to a page section, directly adds to the cart, or navigates to a URL.',
			type: 'string',
			options: {
				list: [
					{ title: 'Smooth Scroll to Section / Anchor (Default)', value: 'anchor' },
					{ title: 'Direct Add to Cart (Opens Cart Drawer)', value: 'direct_cart' },
					{ title: 'Standard Page / External Link', value: 'link' },
				],
				layout: 'radio',
			},
			initialValue: 'anchor',
			group: 'content',
			fieldset: 'primaryActionGroup',
		}),
		defineField({
			name: 'primaryButtonText',
			title: 'Primary CTA Label',
			description: 'Action-oriented button text (e.g. "Order Now", "Add to Cart", or "Claim Deal").',
			type: 'string',
			validation: (Rule) => Rule.required(),
			initialValue: 'Order Now',
			group: 'content',
			fieldset: 'primaryActionGroup',
		}),
		defineField({
			name: 'primaryButtonLink',
			title: 'Primary CTA Link Destination',
			description: 'Anchor link (e.g. "#lead-form", "#order", "#products") or internal/external page URL.',
			type: 'string',
			validation: (Rule) => Rule.required(),
			initialValue: '#lead-form',
			group: 'content',
			fieldset: 'primaryActionGroup',
		}),
		defineField({
			name: 'primaryButtonSubtext',
			title: 'Micro-Text Below Button (Optional)',
			description: 'Reassurance note (e.g. "Instant confirmation • Ships today").',
			type: 'string',
			initialValue: '',
			group: 'content',
			fieldset: 'primaryActionGroup',
		}),

		// --- Group: Content / Fieldset: secondaryActionGroup ---
		defineField({
			name: 'secondaryButtonType',
			title: 'Secondary Contact Action',
			description: 'Direct contact channel for customers needing support before buying.',
			type: 'string',
			options: {
				list: [
					{ title: 'None (Primary Button Only)', value: 'none' },
					{ title: 'WhatsApp Direct Chat', value: 'whatsapp' },
					{ title: 'Phone Hotline Call', value: 'phone' },
					{ title: 'Secondary Link / FAQ', value: 'link' },
				],
			},
			initialValue: 'whatsapp',
			group: 'content',
			fieldset: 'secondaryActionGroup',
		}),
		defineField({
			name: 'secondaryButtonLabel',
			title: 'Secondary Button Label',
			type: 'string',
			initialValue: 'Chat',
			hidden: ({ parent }) => parent?.secondaryButtonType === 'none',
			group: 'content',
			fieldset: 'secondaryActionGroup',
		}),
		defineField({
			name: 'secondaryButtonValue',
			title: 'Secondary Target (Phone / WhatsApp / URL)',
			description: 'International phone number (e.g. +15550001122), WhatsApp number, or link URL.',
			type: 'string',
			hidden: ({ parent }) => parent?.secondaryButtonType === 'none',
			group: 'content',
			fieldset: 'secondaryActionGroup',
		}),

		// --- Group: Layout / Fieldset: positioningGroup ---
		defineField({
			name: 'barPosition',
			title: 'Screen Anchor Position',
			description:
				'Bottom is the ergonomic thumb zone on mobile. Top docks below the site navigation bar.',
			type: 'string',
			options: {
				list: [
					{ title: 'Bottom Fixed (Thumb Zone — Recommended)', value: 'bottom' },
					{ title: 'Top Sticky Header (Below Navigation)', value: 'top' },
				],
				layout: 'radio',
			},
			initialValue: 'bottom',
			group: 'layout',
			fieldset: 'positioningGroup',
		}),
		defineField({
			name: 'barStyle',
			title: 'Bar Silhouette & Container Style',
			description: 'Choose between an edge-to-edge docked bar or a modern floating capsule island.',
			type: 'string',
			options: {
				list: [
					{ title: 'Full-Width Docked Bar (Edge-to-Edge)', value: 'docked' },
					{ title: 'Floating Capsule / Pill (Modern D2C Island)', value: 'floating' },
				],
				layout: 'radio',
			},
			initialValue: 'docked',
			group: 'layout',
			fieldset: 'positioningGroup',
		}),
		defineField({
			name: 'deviceVisibility',
			title: 'Device Visibility',
			description: 'Control which screen sizes display the sticky buy bar.',
			type: 'string',
			options: {
				list: [
					{ title: 'All Devices (Mobile, Tablet & Desktop — Maximum Conversions)', value: 'all' },
					{ title: 'Mobile & Tablet Only (Under 1024px)', value: 'mobile_only' },
					{ title: 'Desktop Only (1024px and up)', value: 'desktop_only' },
				],
				layout: 'radio',
			},
			initialValue: 'all',
			group: 'layout',
			fieldset: 'positioningGroup',
		}),

		// --- Group: Appearance ---
		defineField({
			name: 'themeStyle',
			title: 'Color Theme',
			description: 'Visual palette for the bar surface, borders, and typography.',
			type: 'string',
			options: {
				list: [
					{ title: 'Clean Light (White surface with high contrast text)', value: 'light' },
					{ title: 'Midnight Dark (Dark charcoal surface with crisp white text)', value: 'dark' },
					{ title: 'Brand Accent (Subtle primary brand background tint)', value: 'brand' },
					{ title: 'High Urgency (Warm amber/red scarcity borders)', value: 'urgent' },
				],
			},
			initialValue: 'light',
			group: 'appearance',
		}),
		defineField({
			name: 'buttonStyle',
			title: 'Primary CTA Button Style',
			description: 'Visual styling of the primary action button.',
			type: 'string',
			options: {
				list: [
					{ title: 'Brand CTA Accent (Vibrant conversion color)', value: 'accent' },
					{ title: 'Solid Black / Dark (High contrast solid dark)', value: 'dark' },
					{ title: 'Subtle Pulse Glow (Draws visitor attention)', value: 'pulse' },
				],
			},
			initialValue: 'accent',
			group: 'appearance',
		}),

		// --- Group: Settings / Fieldset: triggerGroup ---
		defineField({
			name: 'triggerMode',
			title: 'Trigger Behavior',
			description: 'Determine when the sticky bar slides into view.',
			type: 'string',
			options: {
				list: [
					{ title: 'Scroll Distance Threshold (Default)', value: 'scroll' },
					{ title: 'When Main Element Scrolls Out of View', value: 'target_element' },
					{ title: 'Always Visible (Immediate)', value: 'always' },
				],
				layout: 'radio',
			},
			initialValue: 'scroll',
			group: 'settings',
			fieldset: 'triggerGroup',
		}),
		defineField({
			name: 'scrollThreshold',
			title: 'Scroll Distance Threshold (px)',
			description: 'Pixels visitor must scroll down before bar appears.',
			type: 'number',
			initialValue: 250,
			validation: (Rule) => Rule.min(0).max(2000),
			hidden: ({ parent }) => parent?.triggerMode && parent?.triggerMode !== 'scroll',
			group: 'settings',
			fieldset: 'triggerGroup',
		}),
		defineField({
			name: 'targetElementId',
			title: 'Trigger Element ID',
			description:
				'HTML ID of an element (e.g. "hero" or "lead-form") that triggers the bar once scrolled past view.',
			type: 'string',
			initialValue: 'lead-form',
			hidden: ({ parent }) => parent?.triggerMode !== 'target_element',
			group: 'settings',
			fieldset: 'triggerGroup',
		}),
		defineField({
			name: 'autoHideOnTarget',
			title: 'Auto-hide When Destination Form is in View',
			description:
				'Automatically hide the bar when visitor reaches the target form/section (e.g. #lead-form), avoiding redundant duplicate buttons.',
			type: 'boolean',
			initialValue: true,
			group: 'settings',
			fieldset: 'triggerGroup',
		}),
		defineField({
			name: 'syncWithProduct',
			title: 'Sync with Active Product & Variants in Real-Time',
			description:
				'On Product Detail Pages, the sticky buy bar dynamically updates its price, thumbnail, and title in real-time as the shopper clicks different variants (e.g. Size/Color).',
			type: 'boolean',
			initialValue: true,
			group: 'settings',
			fieldset: 'triggerGroup',
		}),

		// --- Group: Settings / Fieldset: dismissGroup ---
		defineField({
			name: 'allowDismiss',
			title: 'Allow Visitor to Dismiss / Close',
			description: 'Show a close button (X) allowing visitor to close the bar.',
			type: 'boolean',
			initialValue: false,
			group: 'settings',
			fieldset: 'dismissGroup',
		}),
		defineField({
			name: 'dismissDurationHours',
			title: 'Remember Dismissal (Hours)',
			description: 'Hours to keep bar hidden once closed by the visitor in this browser.',
			type: 'number',
			initialValue: 24,
			validation: (Rule) => Rule.min(1).max(720),
			hidden: ({ parent }) => !parent?.allowDismiss,
			group: 'settings',
			fieldset: 'dismissGroup',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'sticky-mobile-cta',
		icon: MobileDeviceIcon,
		titleFields: ['title', 'dealTitle'],
		imageField: 'image',
		select: {
			price: 'price',
			originalPrice: 'originalPrice',
			priceOrBadge: 'priceOrBadge',
			badge: 'badge',
			btn: 'primaryButtonText',
			position: 'barPosition',
			style: 'barStyle',
			devices: 'deviceVisibility',
		},
		metadata: (doc) => [
			doc.price || doc.priceOrBadge ? `Price: ${doc.price || doc.priceOrBadge}` : null,
			doc.badge ? `Badge: ${doc.badge}` : null,
			doc.position === 'top' ? 'Top Header' : 'Bottom Fixed',
			doc.style === 'floating' ? 'Floating Pill' : 'Docked Bar',
			doc.devices === 'mobile_only'
				? 'Mobile Only'
				: doc.devices === 'desktop_only'
					? 'Desktop Only'
					: 'All Devices',
			doc.btn ? `CTA: ${doc.btn}` : null,
		],
	}),
})
