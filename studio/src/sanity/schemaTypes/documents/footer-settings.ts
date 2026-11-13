import { defineField, defineType } from 'sanity'
import { VscLayout } from 'react-icons/vsc'

export default defineType({
	name: 'footer-settings',
	title: 'Footer Settings',
	icon: VscLayout,
	type: 'document',

	// ================= LOGICAL MERCHANT-FRIENDLY GROUPS =================
	groups: [
		{ name: 'content', title: 'Content & Brand', default: true },
		{ name: 'layout', title: 'Layout & Structure' },
		{ name: 'appearance', title: 'Appearance & Styling' },
		{ name: 'conversion', title: 'Trust & Conversion' },
		{ name: 'compliance', title: 'Legal & Payments' },
	],

	// ================= COLLAPSIBLE FIELDSETS =================
	fieldsets: [
		{
			name: 'brandDetails',
			title: 'Brand Profile & Tagline',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'contactDetails',
			title: 'Contact Details Visibility (From Site Profile)',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'navigationStructure',
			title: 'Navigation Columns & Mobile Browsing',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'layoutSettings',
			title: 'Grid Architecture & Typography',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'colorSettings',
			title: 'Color Palette & Theme Overrides',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'uspBarSettings',
			title: 'Value Proposition & Reassurance Bar',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'newsletterSettings',
			title: 'Newsletter Email Subscription Form',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'legalPolicies',
			title: 'Legal Pages & Cookie Compliance',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'paymentTrust',
			title: 'Payment Gateway Badges & Trust Seals',
			options: { collapsible: true, collapsed: false },
		},
	],

	fields: [
		/* ====================================================================== */
		/* TAB 1: CONTENT & BRAND                                                 */
		/* ====================================================================== */
		defineField({
			name: 'showLogo',
			title: 'Display Brand Logo',
			description: 'Render the official brand logo configured in Site Profile.',
			type: 'boolean',
			initialValue: true,
			group: 'content',
			fieldset: 'brandDetails',
		}),
		defineField({
			name: 'brandDescription',
			title: 'Brand Tagline / Elevator Pitch',
			description:
				'A short, memorable introductory summary about your brand mission, heritage, or core value.',
			type: 'text',
			rows: 3,
			placeholder:
				'Crafted for conscious living. We engineer high-performance lifestyle essentials built with timeless quality.',
			group: 'content',
			fieldset: 'brandDetails',
		}),
		defineField({
			name: 'showSocialLinks',
			title: 'Display Social Media Links',
			description:
				'Show official social media icon channels configured in Global Site Profile (site.ts).',
			type: 'boolean',
			initialValue: true,
			group: 'content',
			fieldset: 'brandDetails',
		}),

		defineField({
			name: 'showContactInfo',
			title: 'Display Customer Care & Business Details',
			description:
				'Single Source of Truth: Inherits verified support channels directly from Global Site Profile.',
			type: 'boolean',
			initialValue: true,
			group: 'content',
			fieldset: 'contactDetails',
		}),
		defineField({
			name: 'showEmail',
			title: 'Show Support Email',
			description: 'Display official customer support email address.',
			type: 'boolean',
			initialValue: true,
			fieldset: 'contactDetails',
			hidden: ({ parent }) => parent?.showContactInfo === false,
			group: 'content',
		}),
		defineField({
			name: 'showHotline',
			title: 'Show Phone / Hotline',
			description: 'Display customer service phone number with click-to-call link.',
			type: 'boolean',
			initialValue: true,
			fieldset: 'contactDetails',
			hidden: ({ parent }) => parent?.showContactInfo === false,
			group: 'content',
		}),
		defineField({
			name: 'showAddress',
			title: 'Show Physical Address / Showroom',
			description: 'Display headquarters, warehouse, or showroom physical location.',
			type: 'boolean',
			initialValue: true,
			fieldset: 'contactDetails',
			hidden: ({ parent }) => parent?.showContactInfo === false,
			group: 'content',
		}),
		defineField({
			name: 'showWorkingHours',
			title: 'Show Operating Hours',
			description: 'Display customer support response times and business hours.',
			type: 'boolean',
			initialValue: true,
			fieldset: 'contactDetails',
			hidden: ({ parent }) => parent?.showContactInfo === false,
			group: 'content',
		}),
		defineField({
			name: 'showTaxCode',
			title: 'Show Tax ID / EIN / Business Registration',
			description:
				'Display legal business registration or VAT number (Recommended for B2B & European compliance).',
			type: 'boolean',
			initialValue: false,
			fieldset: 'contactDetails',
			hidden: ({ parent }) => parent?.showContactInfo === false,
			group: 'content',
		}),

		defineField({
			name: 'footerMenu',
			title: 'Main Footer Navigation Document',
			description:
				'Select the Navigation document containing footer link columns (Recommended: 2 to 4 link groups).',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'content',
			fieldset: 'navigationStructure',
		}),
		defineField({
			name: 'mobileAccordion',
			title: 'Enable Collapsible Accordions on Mobile',
			description:
				'Automatically converts multi-column link lists into touch-friendly expandable accordions on mobile viewports.',
			type: 'boolean',
			initialValue: true,
			group: 'content',
			fieldset: 'navigationStructure',
		}),

		/* ====================================================================== */
		/* TAB 2: LAYOUT & STRUCTURE                                              */
		/* ====================================================================== */
		defineField({
			name: 'desktopLayout',
			title: 'Desktop Grid Layout',
			description:
				'Choose how brand information, navigation columns, and newsletter interact on desktop screens.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Standard Balanced (Brand Left, Nav Columns Center, Newsletter Right)',
						value: 'standard',
					},
					{
						title: 'Expanded Navigation (Brand Left, Wide 3-4 Column Nav, Newsletter Full Banner)',
						value: 'expanded_nav',
					},
					{
						title: 'Compact Clean (Brand Left, Consolidated Navigation, Bottom Bar)',
						value: 'compact',
					},
				],
				layout: 'radio',
			},
			initialValue: 'standard',
			group: 'layout',
			fieldset: 'layoutSettings',
		}),
		defineField({
			name: 'spacing',
			title: 'Vertical Spacing & Content Density',
			description: 'Control the top and bottom whitespace of the footer sections.',
			type: 'string',
			options: {
				list: [
					{ title: 'Compact (py-6 md:py-8) — Sleek for catalogs and landing pages', value: 'compact' },
					{ title: 'Normal (py-8 md:py-12) — Recommended commercial standard', value: 'normal' },
					{ title: 'Spacious (py-12 md:py-16) — Airy editorial aesthetic', value: 'spacious' },
				],
				layout: 'radio',
			},
			initialValue: 'normal',
			group: 'layout',
			fieldset: 'layoutSettings',
		}),
		defineField({
			name: 'headingCase',
			title: 'Column Heading Style',
			description: 'Choose typography casing for navigation column titles.',
			type: 'string',
			options: {
				list: [
					{ title: 'Title Case (e.g. "Customer Care") — Modern US/UK standard', value: 'title' },
					{ title: 'Uppercase (e.g. "CUSTOMER CARE") — Classic bold retail', value: 'uppercase' },
				],
				layout: 'radio',
			},
			initialValue: 'title',
			group: 'layout',
			fieldset: 'layoutSettings',
		}),
		defineField({
			name: 'showBackToTop',
			title: 'Display "Back to Top" Button',
			description: 'Render a smooth scroll-to-top button in the bottom compliance bar.',
			type: 'boolean',
			initialValue: true,
			group: 'layout',
			fieldset: 'layoutSettings',
		}),

		/* ====================================================================== */
		/* TAB 3: APPEARANCE & STYLING                                            */
		/* ====================================================================== */
		defineField({
			name: 'footerThemeStyle',
			title: 'Footer Color Theme Preset',
			description:
				'Select the color theme for the footer. "Default" inherits automatically from Global Theme Tokens.',
			type: 'string',
			options: {
				list: [
					{ title: 'Default (Inherit from Global Theme Tokens)', value: 'default' },
					{ title: 'Slate Dark (Charcoal Slate Elegance)', value: 'dark' },
					{ title: 'Light Minimal (Soft Pure Surface)', value: 'light' },
					{ title: 'Midnight Navy (Deep Luxury Blue)', value: 'navy' },
					{ title: 'Warm Sand (Subtle Oatmeal Tone)', value: 'warm' },
					{ title: 'Custom Palette (Define custom hex codes)', value: 'custom' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'appearance',
			fieldset: 'colorSettings',
		}),
		defineField({
			name: 'footerBackground',
			title: 'Custom Background Color',
			description: 'Hex color for footer surface (e.g. #090d16 or #f8fafc)',
			type: 'string',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Must be a valid hex code (e.g. #090d16)'),
			fieldset: 'colorSettings',
			hidden: ({ parent }) => parent?.footerThemeStyle !== 'custom',
			group: 'appearance',
		}),
		defineField({
			name: 'footerText',
			title: 'Custom Primary Text Color',
			description: 'Hex color for headings and primary labels (e.g. #ffffff or #0f172a)',
			type: 'string',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Must be a valid hex code (e.g. #ffffff)'),
			fieldset: 'colorSettings',
			hidden: ({ parent }) => parent?.footerThemeStyle !== 'custom',
			group: 'appearance',
		}),
		defineField({
			name: 'footerMutedText',
			title: 'Custom Muted / Secondary Text Color',
			description: 'Hex color for descriptions, links, and subtext (e.g. #94a3b8 or #64748b)',
			type: 'string',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Must be a valid hex code (e.g. #94a3b8)'),
			fieldset: 'colorSettings',
			hidden: ({ parent }) => parent?.footerThemeStyle !== 'custom',
			group: 'appearance',
		}),
		defineField({
			name: 'footerBorder',
			title: 'Custom Border Divider Color',
			description: 'Hex color for dividers and separators (e.g. #1e293b or #e2e8f0)',
			type: 'string',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Must be a valid hex code (e.g. #1e293b)'),
			fieldset: 'colorSettings',
			hidden: ({ parent }) => parent?.footerThemeStyle !== 'custom',
			group: 'appearance',
		}),

		/* ====================================================================== */
		/* TAB 4: TRUST & CONVERSION                                              */
		/* ====================================================================== */
		defineField({
			name: 'showUspBar',
			title: 'Enable Value Proposition (USP) Bar',
			description:
				'Display a top reassurance bar above the main footer columns (e.g. Free Worldwide Shipping, 30-Day Easy Returns).',
			type: 'boolean',
			initialValue: true,
			group: 'conversion',
			fieldset: 'uspBarSettings',
		}),
		defineField({
			name: 'uspLayout',
			title: 'USP Bar Layout',
			description: 'Choose display style for value proposition highlights.',
			type: 'string',
			options: {
				list: [
					{ title: 'Grid (Adaptive 2 to 4 responsive cards)', value: 'grid' },
					{ title: 'Inline Bar (Compact horizontal reassurance strip)', value: 'inline' },
				],
				layout: 'radio',
			},
			initialValue: 'grid',
			hidden: ({ parent }) => parent?.showUspBar === false,
			group: 'conversion',
			fieldset: 'uspBarSettings',
		}),
		defineField({
			name: 'uspItems',
			title: 'Value Proposition Highlights (Max 4)',
			description: 'Add up to 4 key reassurance points to boost consumer purchasing confidence.',
			type: 'array',
			validation: (Rule) => Rule.max(4),
			hidden: ({ parent }) => parent?.showUspBar === false,
			group: 'conversion',
			fieldset: 'uspBarSettings',
			of: [
				{
					type: 'object',
					fields: [
						defineField({
							name: 'icon',
							title: 'Icon Symbol',
							type: 'string',
							options: {
								list: [
									{ title: 'Shipping & Delivery (Truck)', value: 'shipping' },
									{ title: 'Authentic Certified / Safe Guarantee (Shield)', value: 'shield' },
									{ title: 'Easy 30-Day Returns / Refunds (Rotate)', value: 'return' },
									{ title: '24/7 Dedicated Support (Headphones)', value: 'support' },
									{ title: 'Eco-Friendly & Sustainable (Leaf)', value: 'eco' },
									{ title: 'Premium Curated Quality (Star)', value: 'star' },
									{ title: 'Secure 256-Bit SSL Checkout (Lock)', value: 'lock' },
									{ title: 'Complimentary Gift Box / Packaging (Gift)', value: 'gift' },
									{ title: 'Fast 24-48h Express Dispatch (Clock)', value: 'clock' },
									{ title: 'Flexible Installments / Buy Now Pay Later (Card)', value: 'credit_card' },
									{ title: 'Best Price / Match Guarantee (Percent)', value: 'discount' },
									{ title: 'Artisan / Handcrafted Excellence (Sparkles)', value: 'sparkles' },
								],
							},
							initialValue: 'shipping',
						}),
						defineField({
							name: 'title',
							title: 'Headline Title',
							type: 'string',
							validation: (Rule) => Rule.required(),
							placeholder: 'e.g. Free Worldwide Shipping',
						}),
						defineField({
							name: 'description',
							title: 'Short Subtitle / Condition',
							type: 'string',
							placeholder: 'e.g. On all domestic orders over $50',
						}),
						defineField({
							name: 'url',
							title: 'Optional Link Destination (URL)',
							description: 'Link directly to policy page (e.g. /shipping-returns or /guarantee).',
							type: 'string',
							placeholder: 'e.g. /shipping-returns',
						}),
					],
					preview: {
						select: {
							title: 'title',
							subtitle: 'description',
							icon: 'icon',
						},
						prepare({ title, subtitle, icon }) {
							return {
								title: title || 'USP Highlight',
								subtitle: subtitle ? `[${icon || 'shipping'}] ${subtitle}` : `[${icon || 'shipping'}]`,
							}
						},
					},
				},
			],
		}),

		defineField({
			name: 'showNewsletter',
			title: 'Enable Newsletter Signup Form',
			description:
				'Display high-converting email subscription capture for marketing leads, VIP drops, and discounts.',
			type: 'boolean',
			initialValue: true,
			group: 'conversion',
			fieldset: 'newsletterSettings',
		}),
		defineField({
			name: 'newsletterTitle',
			title: 'Newsletter Headline',
			type: 'string',
			initialValue: 'Unlock 10% Off Your First Order',
			placeholder: 'e.g. Join the DeanFlow Community',
			hidden: ({ parent }) => parent?.showNewsletter === false,
			group: 'conversion',
			fieldset: 'newsletterSettings',
		}),
		defineField({
			name: 'newsletterDescription',
			title: 'Value Proposition & Offer Copy',
			type: 'text',
			rows: 2,
			initialValue:
				'Subscribe for exclusive drops, early bird access, and conscious living inspiration.',
			placeholder: 'Explain customer benefit: discounts, secret sales, or guides.',
			hidden: ({ parent }) => parent?.showNewsletter === false,
			group: 'conversion',
			fieldset: 'newsletterSettings',
		}),
		defineField({
			name: 'newsletterPlaceholder',
			title: 'Email Input Placeholder',
			type: 'string',
			initialValue: 'Enter your email address...',
			hidden: ({ parent }) => parent?.showNewsletter === false,
			group: 'conversion',
			fieldset: 'newsletterSettings',
		}),
		defineField({
			name: 'newsletterButtonText',
			title: 'Subscribe Button Text',
			type: 'string',
			initialValue: 'Subscribe',
			hidden: ({ parent }) => parent?.showNewsletter === false,
			group: 'conversion',
			fieldset: 'newsletterSettings',
		}),
		defineField({
			name: 'newsletterConsentText',
			title: 'GDPR / CAN-SPAM Consent Notice',
			description:
				'Legal compliance micro-copy reassuring privacy consent. Word "Privacy Policy" automatically links if present.',
			type: 'string',
			initialValue:
				'By subscribing, you agree to our Privacy Policy and consent to receive marketing updates.',
			hidden: ({ parent }) => parent?.showNewsletter === false,
			group: 'conversion',
			fieldset: 'newsletterSettings',
		}),

		/* ====================================================================== */
		/* TAB 5: LEGAL & PAYMENTS                                                */
		/* ====================================================================== */
		defineField({
			name: 'legalLinks',
			title: 'Legal & Policy Navigation Links',
			description:
				'Compliance links displayed in the bottom legal row (Privacy Policy, Terms of Service, Shipping, Refunds, Accessibility Statement, Do Not Sell My Info).',
			type: 'array',
			of: [{ type: 'link' }],
			group: 'compliance',
			fieldset: 'legalPolicies',
		}),
		defineField({
			name: 'showCookieSettingsTrigger',
			title: 'Enable "Cookie Preferences" Button',
			description:
				'Renders an interactive button at the end of the legal links allowing visitors to revisit GDPR/CCPA cookie choices.',
			type: 'boolean',
			initialValue: true,
			group: 'compliance',
			fieldset: 'legalPolicies',
		}),
		defineField({
			name: 'regionLabel',
			title: 'Store Region & Currency Indicator',
			description:
				'International market label displayed in the bottom bar (e.g. "United States (USD $)" or "United Kingdom (GBP £)").',
			type: 'string',
			initialValue: 'United States (USD $)',
			placeholder: 'e.g. United States (USD $)',
			group: 'compliance',
			fieldset: 'legalPolicies',
		}),
		defineField({
			name: 'copyrightText',
			title: 'Copyright Notice',
			description:
				'Dynamic macros supported: "{year}" for current calendar year, "{siteName}" for verified store name.',
			type: 'string',
			initialValue: '© {year} {siteName}. All rights reserved.',
			group: 'compliance',
			fieldset: 'legalPolicies',
		}),

		defineField({
			name: 'showPaymentMethods',
			title: 'Display Accepted Payment Badges',
			description: 'Show clean, standardized payment gateway badges in the bottom compliance bar.',
			type: 'boolean',
			initialValue: true,
			group: 'compliance',
			fieldset: 'paymentTrust',
		}),
		defineField({
			name: 'paymentMethods',
			title: 'Accepted Global Payment Methods',
			description: 'Select all payment methods accepted by your store.',
			type: 'array',
			of: [{ type: 'string' }],
			options: {
				list: [
					{ title: 'Visa', value: 'visa' },
					{ title: 'Mastercard', value: 'mastercard' },
					{ title: 'American Express (Amex)', value: 'amex' },
					{ title: 'Apple Pay', value: 'apple_pay' },
					{ title: 'Google Pay', value: 'google_pay' },
					{ title: 'PayPal', value: 'paypal' },
					{ title: 'Shop Pay', value: 'shop_pay' },
					{ title: 'Klarna', value: 'klarna' },
					{ title: 'Afterpay / Clearpay', value: 'afterpay' },
					{ title: 'Discover', value: 'discover' },
					{ title: 'Maestro', value: 'maestro' },
					{ title: 'UnionPay', value: 'unionpay' },
					{ title: 'JCB', value: 'jcb' },
					{ title: 'Cash on Delivery (COD)', value: 'cod' },
					{ title: 'Bank Wire / Transfer', value: 'bank_transfer' },
				],
			},
			initialValue: [
				'visa',
				'mastercard',
				'amex',
				'apple_pay',
				'google_pay',
				'paypal',
				'shop_pay',
				'klarna',
			],
			hidden: ({ parent }) => parent?.showPaymentMethods === false,
			group: 'compliance',
			fieldset: 'paymentTrust',
		}),
		defineField({
			name: 'showTrustBadges',
			title: 'Display Trust & Certification Seals',
			description:
				'Show verified certification logos (e.g. SSL 256-Bit Encrypted, B-Corp Certified, 1% for the Planet).',
			type: 'boolean',
			initialValue: false,
			group: 'compliance',
			fieldset: 'paymentTrust',
		}),
		defineField({
			name: 'trustBadges',
			title: 'Trust Badges & Seals List',
			description: 'Upload high-resolution transparent PNG or SVG badges with optional verification links.',
			type: 'array',
			hidden: ({ parent }) => parent?.showTrustBadges === false,
			group: 'compliance',
			fieldset: 'paymentTrust',
			of: [
				{
					type: 'object',
					fields: [
						defineField({
							name: 'title',
							title: 'Badge Title / Name',
							type: 'string',
							validation: (Rule) => Rule.required(),
							placeholder: 'e.g. 256-Bit SSL Encrypted',
						}),
						defineField({
							name: 'image',
							title: 'Badge Graphic (PNG / SVG)',
							type: 'image',
							options: { hotspot: true },
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'url',
							title: 'Verification Link URL (Optional)',
							type: 'url',
							placeholder: 'https://...',
						}),
					],
					preview: {
						select: {
							title: 'title',
							media: 'image',
							subtitle: 'url',
						},
						prepare({ title, media, subtitle }) {
							return {
								title: title || 'Trust Badge',
								subtitle: subtitle || 'Verified Seal',
								media,
							}
						},
					},
				},
			],
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Footer Settings',
			subtitle: 'Global Multi-Column Layout, Navigation, Newsletter & Compliance',
		}),
	},
})
