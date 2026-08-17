import { defineField, defineType } from 'sanity'
import { VscLayout } from 'react-icons/vsc'

export default defineType({
	name: 'footer-settings',
	title: 'Footer Settings',
	icon: VscLayout,
	type: 'document',
	groups: [
		{ name: 'layout', title: 'Layout & Style', default: true },
		{ name: 'usp', title: 'Feature & USP Bar' },
		{ name: 'brand', title: 'Brand & Business' },
		{ name: 'navigation', title: 'Navigation Menus' },
		{ name: 'marketing', title: 'Newsletter & Trust Badges' },
	],
	fieldsets: [
		{
			name: 'colorScheme',
			title: 'Custom Color Scheme',
			options: { columns: 2 },
		},
		{
			name: 'backgroundImageSettings',
			title: 'Background Image & Pattern Settings',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'contactToggles',
			title: 'Contact Information Visibility',
			options: { columns: 3 },
		},
	],
	fields: [
		// ================= TAB 1: LAYOUT & STYLE =================
		defineField({
			name: 'footerThemeStyle',
			title: 'Footer Color Theme',
			description:
				'Select color theme for the footer. "Default" inherits automatically from Global Theme Tokens.',
			type: 'string',
			options: {
				list: [
					{ title: 'Default (Inherit from Global Theme Tokens)', value: 'default' },
					{ title: 'Dark Elegance (Deep Dark Surface)', value: 'dark' },
					{ title: 'Light Minimal (Soft Light Surface)', value: 'light' },
					{ title: 'Custom (Specify custom hex colors below)', value: 'custom' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'layout',
		}),
		defineField({
			name: 'footerBackground',
			title: 'Custom Footer Background',
			description: 'Custom hex color for footer background (e.g. #0f172a)',
			type: 'string',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Invalid Hex Color code'),
			fieldset: 'colorScheme',
			hidden: ({ parent }) => parent?.footerThemeStyle !== 'custom',
			group: 'layout',
		}),
		defineField({
			name: 'footerText',
			title: 'Custom Footer Text Color',
			description: 'Custom hex color for footer text (e.g. #f8fafc)',
			type: 'string',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Invalid Hex Color code'),
			fieldset: 'colorScheme',
			hidden: ({ parent }) => parent?.footerThemeStyle !== 'custom',
			group: 'layout',
		}),

		// --- Background Image / Pattern Section ---
		defineField({
			name: 'enableBgImage',
			title: 'Enable Background Image / Pattern',
			description: 'Add a subtle graphic background, eco texture, or pattern tile to footer.',
			type: 'boolean',
			initialValue: false,
			fieldset: 'backgroundImageSettings',
			group: 'layout',
		}),
		defineField({
			name: 'backgroundImage',
			title: 'Background Image File',
			description: 'Recommended: High resolution JPG/PNG or subtle repeating SVG pattern.',
			type: 'image',
			options: { hotspot: true },
			fieldset: 'backgroundImageSettings',
			hidden: ({ parent }) => !parent?.enableBgImage,
			group: 'layout',
		}),
		defineField({
			name: 'bgDisplayMode',
			title: 'Background Sizing & Repeat',
			type: 'string',
			options: {
				list: [
					{ title: 'Cover (Full background image fit)', value: 'cover' },
					{ title: 'Pattern Tile (Repeat horizontally & vertically)', value: 'repeat' },
					{ title: 'Contain (Fit within bounds without crop)', value: 'contain' },
				],
				layout: 'radio',
			},
			initialValue: 'cover',
			fieldset: 'backgroundImageSettings',
			hidden: ({ parent }) => !parent?.enableBgImage,
			group: 'layout',
		}),
		defineField({
			name: 'bgOverlayStyle',
			title: 'Overlay Tint Style',
			description: 'Ensures optimal text contrast & legibility against the background image.',
			type: 'string',
			options: {
				list: [
					{ title: 'Dark Overlay (Rich Charcoal / Black tint)', value: 'dark' },
					{ title: 'Light Overlay (Clean White / Pure Paper tint)', value: 'light' },
					{ title: 'Brand Primary Gradient (Smooth accent gradient)', value: 'primary_gradient' },
					{ title: 'None (Pure image without overlay tint)', value: 'none' },
				],
				layout: 'radio',
			},
			initialValue: 'dark',
			fieldset: 'backgroundImageSettings',
			hidden: ({ parent }) => !parent?.enableBgImage,
			group: 'layout',
		}),
		defineField({
			name: 'bgOverlayOpacity',
			title: 'Overlay Opacity (%)',
			description: 'Controls the strength of the overlay tint (0 = fully transparent, 100 = fully solid).',
			type: 'number',
			initialValue: 60,
			validation: (Rule) => Rule.min(0).max(100),
			fieldset: 'backgroundImageSettings',
			hidden: ({ parent }) => !parent?.enableBgImage || parent?.bgOverlayStyle === 'none',
			group: 'layout',
		}),
		defineField({
			name: 'bgBlur',
			title: 'Background Backdrop Blur',
			description: 'Apply subtle depth-of-field blur to soften background details and emphasize typography.',
			type: 'string',
			options: {
				list: [
					{ title: 'None (Sharp)', value: 'none' },
					{ title: 'Subtle (sm - 4px)', value: 'sm' },
					{ title: 'Medium (md - 8px)', value: 'md' },
					{ title: 'Strong (lg - 16px)', value: 'lg' },
				],
			},
			initialValue: 'none',
			fieldset: 'backgroundImageSettings',
			hidden: ({ parent }) => !parent?.enableBgImage,
			group: 'layout',
		}),
		defineField({
			name: 'desktopLayout',
			title: 'Desktop Columns Layout',
			description: 'Arrangement of footer columns on desktop screens.',
			type: 'string',
			options: {
				list: [
					{
						title: '4 Columns (Brand Info - 2 Navigation Columns - Newsletter Form)',
						value: '4-columns',
					},
					{
						title: '5 Columns (Brand Info - 3 Navigation Columns - Newsletter Form)',
						value: '5-columns',
					},
					{
						title: '3 Columns (Brand Info - Navigation Columns - Contact / Social)',
						value: '3-columns',
					},
				],
				layout: 'radio',
			},
			initialValue: '4-columns',
			group: 'layout',
		}),
		defineField({
			name: 'mobileAccordion',
			title: 'Enable Collapsible Accordion on Mobile',
			description:
				'Turns navigation link groups into collapsible accordions on mobile viewports for compact browsing.',
			type: 'boolean',
			initialValue: true,
			group: 'layout',
		}),
		defineField({
			name: 'showDividers',
			title: 'Show Section Dividers',
			description: 'Display subtle divider lines between USP bar, Main Grid, and Bottom Bar.',
			type: 'boolean',
			initialValue: true,
			group: 'layout',
		}),

		// ================= TAB 2: FEATURE & USP BAR =================
		defineField({
			name: 'showUspBar',
			title: 'Enable USP / Feature Highlights Bar',
			description:
				'Display a top value proposition bar above the footer (e.g. Free Shipping, 100% Genuine, 30-Day Return).',
			type: 'boolean',
			initialValue: true,
			group: 'usp',
		}),
		defineField({
			name: 'uspItems',
			title: 'USP Highlights List',
			description: 'Add 3 to 4 key value propositions for customer reassurance.',
			type: 'array',
			group: 'usp',
			hidden: ({ parent }) => parent?.showUspBar === false,
			of: [
				{
					type: 'object',
					fields: [
						defineField({
							name: 'icon',
							title: 'Icon',
							type: 'string',
							options: {
								list: [
									{ title: '🚚 Free / Fast Shipping', value: 'shipping' },
									{ title: '🛡️ 100% Authentic / Safe Guarantee', value: 'shield' },
									{ title: '🔄 30-Day Easy Returns / Refunds', value: 'return' },
									{ title: '🎧 24/7 Dedicated Support', value: 'support' },
									{ title: '🌿 Eco-Friendly / Sustainable', value: 'eco' },
									{ title: '⭐ Premium Quality Checked', value: 'star' },
									{ title: '🔒 Secure Checkout & Encryption', value: 'lock' },
								],
							},
							initialValue: 'shipping',
						}),
						defineField({
							name: 'title',
							title: 'Title',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'description',
							title: 'Short Description / Subtitle',
							type: 'string',
						}),
					],
					preview: {
						select: {
							title: 'title',
							subtitle: 'description',
							icon: 'icon',
						},
						prepare({ title, subtitle }) {
							return {
								title: title || 'USP Item',
								subtitle: subtitle || '',
							}
						},
					},
				},
			],
		}),

		// ================= TAB 3: BRAND & BUSINESS =================
		defineField({
			name: 'showLogo',
			title: 'Display Brand Logo',
			description: 'Show brand logo in the first column.',
			type: 'boolean',
			initialValue: true,
			group: 'brand',
		}),
		defineField({
			name: 'brandDescription',
			title: 'Brand Description / Elevator Pitch',
			description:
				'A brief introductory sentence about your store, mission, or sustainable values.',
			type: 'text',
			rows: 3,
			placeholder:
				'Ecocros is committed to delivering sustainable, premium lifestyle essentials curated for conscious living.',
			group: 'brand',
		}),
		defineField({
			name: 'useSiteProfile',
			title: 'Inherit Contact Details from Site Profile',
			description:
				'Automatically pulls Hotline, Email, Address, Tax Code, and Working Hours from Global Site Settings (site.ts).',
			type: 'boolean',
			initialValue: true,
			group: 'brand',
		}),
		defineField({
			name: 'showHotline',
			title: 'Show Phone / Hotline',
			type: 'boolean',
			initialValue: true,
			fieldset: 'contactToggles',
			group: 'brand',
		}),
		defineField({
			name: 'showEmail',
			title: 'Show Support Email',
			type: 'boolean',
			initialValue: true,
			fieldset: 'contactToggles',
			group: 'brand',
		}),
		defineField({
			name: 'showAddress',
			title: 'Show Showroom / Address',
			type: 'boolean',
			initialValue: true,
			fieldset: 'contactToggles',
			group: 'brand',
		}),
		defineField({
			name: 'showTaxCode',
			title: 'Show Tax ID / Business Reg Code',
			type: 'boolean',
			initialValue: false,
			fieldset: 'contactToggles',
			group: 'brand',
		}),
		defineField({
			name: 'showWorkingHours',
			title: 'Show Working Hours',
			type: 'boolean',
			initialValue: true,
			fieldset: 'contactToggles',
			group: 'brand',
		}),
		defineField({
			name: 'customFooterContent',
			title: 'Additional Custom Legal / Rich Text Content',
			description: 'Optional Rich text editor for extra legal notices or disclaimers.',
			type: 'array',
			of: [
				{
					type: 'block',
					styles: [{ title: 'Normal', value: 'normal' }],
					lists: [],
				},
			],
			group: 'brand',
		}),

		// ================= TAB 4: NAVIGATION MENUS =================
		defineField({
			name: 'footerMenu',
			title: 'Footer Navigation Menu',
			description:
				'Select the Navigation document containing the footer columns (Link Lists).',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'showSocialLinks',
			title: 'Display Social Media Links',
			description: 'Show social media icon buttons in the footer.',
			type: 'boolean',
			initialValue: true,
			group: 'navigation',
		}),
		defineField({
			name: 'socialSource',
			title: 'Social Links Data Source',
			type: 'string',
			options: {
				list: [
					{
						title: 'Inherit from Global Business Profile (site.ts)',
						value: 'site',
					},
					{
						title: 'Custom Navigation Document Reference',
						value: 'custom',
					},
				],
				layout: 'radio',
			},
			initialValue: 'site',
			hidden: ({ parent }) => parent?.showSocialLinks === false,
			group: 'navigation',
		}),
		defineField({
			name: 'social',
			title: 'Custom Social Links Menu Reference',
			description: 'Select a custom Navigation document for social icons.',
			type: 'reference',
			to: [{ type: 'navigation' }],
			hidden: ({ parent }) =>
				parent?.showSocialLinks === false || parent?.socialSource !== 'custom',
			group: 'navigation',
		}),

		// ================= TAB 5: NEWSLETTER & TRUST BADGES =================
		defineField({
			name: 'showNewsletter',
			title: 'Enable Newsletter Lead Form',
			description:
				'Display an email subscription box for lead generation and marketing promotions.',
			type: 'boolean',
			initialValue: true,
			group: 'marketing',
		}),
		defineField({
			name: 'newsletterTitle',
			title: 'Newsletter Headline',
			type: 'string',
			initialValue: 'Join our Community',
			placeholder: 'e.g. Subscribe & Get 10% Off',
			hidden: ({ parent }) => parent?.showNewsletter === false,
			group: 'marketing',
		}),
		defineField({
			name: 'newsletterDescription',
			title: 'Newsletter Description / Subtext',
			type: 'text',
			rows: 2,
			initialValue:
				'Subscribe for exclusive drops, early bird offers, and member-only promotions.',
			hidden: ({ parent }) => parent?.showNewsletter === false,
			group: 'marketing',
		}),
		defineField({
			name: 'newsletterPlaceholder',
			title: 'Email Input Placeholder',
			type: 'string',
			initialValue: 'Enter your email address...',
			hidden: ({ parent }) => parent?.showNewsletter === false,
			group: 'marketing',
		}),
		defineField({
			name: 'newsletterButtonText',
			title: 'Subscribe Button Text',
			type: 'string',
			initialValue: 'Subscribe',
			hidden: ({ parent }) => parent?.showNewsletter === false,
			group: 'marketing',
		}),
		defineField({
			name: 'showPaymentMethods',
			title: 'Display Accepted Payment Badges',
			description: 'Show payment gateway icons in the bottom bar.',
			type: 'boolean',
			initialValue: true,
			group: 'marketing',
		}),
		defineField({
			name: 'paymentMethods',
			title: 'Accepted Payment Methods',
			description: 'Select all payment methods accepted by your store.',
			type: 'array',
			of: [{ type: 'string' }],
			options: {
				list: [
					{ title: 'Visa', value: 'visa' },
					{ title: 'Mastercard', value: 'mastercard' },
					{ title: 'JCB', value: 'jcb' },
					{ title: 'American Express (Amex)', value: 'amex' },
					{ title: 'MoMo E-Wallet', value: 'momo' },
					{ title: 'VNPay QR / Gateway', value: 'vnpay' },
					{ title: 'ZaloPay', value: 'zalopay' },
					{ title: 'Cash on Delivery (COD)', value: 'cod' },
					{ title: 'Bank Direct Transfer', value: 'bank_transfer' },
					{ title: 'Apple Pay', value: 'apple_pay' },
					{ title: 'Google Pay', value: 'google_pay' },
					{ title: 'PayPal', value: 'paypal' },
				],
			},
			initialValue: ['visa', 'mastercard', 'momo', 'vnpay', 'cod'],
			hidden: ({ parent }) => parent?.showPaymentMethods === false,
			group: 'marketing',
		}),
		defineField({
			name: 'showTrustBadges',
			title: 'Display Trust & Verification Seals',
			description:
				'Show certification badges (e.g. Ministry of Industry and Trade, DMCA, SSL, Eco Certified).',
			type: 'boolean',
			initialValue: false,
			group: 'marketing',
		}),
		defineField({
			name: 'trustBadges',
			title: 'Trust Badges List',
			type: 'array',
			hidden: ({ parent }) => parent?.showTrustBadges === false,
			of: [
				{
					type: 'object',
					fields: [
						defineField({
							name: 'title',
							title: 'Badge Title',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'image',
							title: 'Badge Image / Logo',
							type: 'image',
							options: { hotspot: true },
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'url',
							title: 'Verification Link (URL)',
							type: 'url',
						}),
					],
					preview: {
						select: {
							title: 'title',
							media: 'image',
							subtitle: 'url',
						},
					},
				},
			],
			group: 'marketing',
		}),
		defineField({
			name: 'copyrightText',
			title: 'Copyright Notice',
			description:
				'Custom copyright notice. Use "{year}" for dynamic current year and "{siteName}" for brand name.',
			type: 'string',
			initialValue: '© {year} {siteName}. All rights reserved.',
			group: 'marketing',
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Footer Settings',
			subtitle: 'Global Footer Layout, USP Bar, Navigation & Marketing Settings',
		}),
	},
})
