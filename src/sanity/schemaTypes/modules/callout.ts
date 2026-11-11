import { defineArrayMember, defineField, defineType } from 'sanity'
import { FiTag } from 'react-icons/fi'
import { VscInspect } from 'react-icons/vsc'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'callout',
	title: 'Promo Callout',
	description:
		'High-converting announcement & promotional callout box with accent borders, tags, trust guarantees, and primary CTA.',
	type: 'object',
	icon: VscInspect,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: 'LIMITED TIME PROMOTION',
			layout: 'centered',
			themeStyle: 'brand',
			iconStyle: 'info',
			borderStyle: 'accent-left',
			maxWidth: 'standard',
			textAlign: 'center',
			ctaSubtext:
				'Free international sample dispatch • 24h response guarantee • No commitment required',
			intro: [
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Q3 Export Promotion: Free International Lab Samples & Priority Production Dispatch',
							marks: ['strong'],
						},
					],
					style: 'h3',
				},
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'New enterprise wholesale inquiries receive complimentary container logistics feasibility reports and physical test sample kits delivered within 5 business days.',
							marks: [],
						},
					],
					style: 'normal',
				},
			],
			ctas: [
				{
					_key: genKey(),
					actionType: 'link',
					style: 'action',
					link: {
						label: 'Claim Sample Dispatch',
						type: 'internal',
						params: '#lead-form',
					},
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
			name: 'messaging',
			title: 'Promotional Messaging & Announcement',
			options: { columns: 1 },
		},
		{
			name: 'action',
			title: 'Call-to-Action & Reassurance',
			options: { columns: 1 },
		},
		{
			name: 'visuals',
			title: 'Layout & Aesthetic Styling',
			options: { columns: 1 },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// --- Group: Content ---
		defineField({
			name: 'badge',
			title: 'Eyebrow / Promo Badge',
			description:
				'Short attention-grabbing tag above the headline (e.g. "LIMITED TIME OFFER", "WHOLESALE EXCLUSIVE", "SPECIAL ANNOUNCEMENT"). Leave blank to hide.',
			type: 'string',
			group: 'content',
			fieldset: 'messaging',
		}),
		defineField({
			name: 'intro',
			title: 'Headline & Callout Copy',
			description:
				'Main promotional message. Format with headings (H2/H3 for titles), paragraphs for details, bullet lists for key perks, and optional interactive tags.',
			type: 'array',
			group: 'content',
			fieldset: 'messaging',
			of: [
				{ type: 'block' },
				defineArrayMember({
					name: 'tag',
					title: 'Tag / Pill Badge',
					type: 'object',
					icon: FiTag,
					fields: [
						defineField({
							name: 'label',
							title: 'Tag Text',
							type: 'string',
							placeholder: 'e.g., Free Express Shipping',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'href',
							title: 'Link Destination (Optional)',
							description:
								'Leave blank for a purely informational pill badge, or enter a URL/anchor link.',
							type: 'string',
							placeholder: 'e.g., /collections/samples or #lead-form',
						}),
						defineField({
							name: 'icon',
							title: 'Tag Icon',
							type: 'string',
							options: {
								list: [
									{ title: 'Tag / Offer Icon (Default)', value: 'tag' },
									{ title: 'Sparkle / Highlight', value: 'sparkle' },
									{ title: 'Checkmark / Verified', value: 'check' },
									{ title: 'None (Text Only)', value: 'none' },
								],
							},
							initialValue: 'tag',
						}),
					],
					preview: {
						select: {
							title: 'label',
							subtitle: 'href',
						},
						prepare({ title, subtitle }) {
							return {
								title: `# ${title || 'Untitled Tag'}`,
								subtitle: subtitle ? `🔗 ${subtitle}` : 'Badge (no link)',
							}
						},
					},
				}),
			],
		}),
		defineField({
			name: 'ctas',
			title: 'Call-to-Action Buttons',
			description: 'Primary and secondary conversion buttons.',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
			fieldset: 'action',
		}),
		defineField({
			name: 'ctaSubtext',
			title: 'Trust Guarantee / Subtext Below Buttons',
			description:
				'Reassurance microcopy displayed beneath the buttons (e.g., "Free international sample dispatch • 24h response guarantee • No commitment required").',
			type: 'string',
			group: 'content',
			fieldset: 'action',
		}),

		// --- Group: Design ---
		defineField({
			name: 'layout',
			title: 'Layout Format',
			description:
				'Choose how the callout content and action buttons are structured on the page.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Centered Card (Stacked & focused — high-impact announcement)',
						value: 'centered',
					},
					{
						title:
							'Split Banner (Horizontal: copy on left, action buttons on right)',
						value: 'split',
					},
					{
						title:
							'Compact Strip (Slim inline bar — great between long sections)',
						value: 'compact',
					},
				],
			},
			initialValue: 'centered',
			group: 'design',
			fieldset: 'visuals',
		}),
		defineField({
			name: 'themeStyle',
			title: 'Color Theme & Tone',
			description:
				'Visual palette for background tint, accent borders, and badge styling.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Brand Dynamic (Primary theme accent with tinted background)',
						value: 'brand',
					},
					{
						title:
							'Urgent / Promotional (Warm amber / red highlight for sales & scarcity)',
						value: 'urgent',
					},
					{
						title:
							'Success & Trust (Emerald green for eco, guarantees & verified perks)',
						value: 'success',
					},
					{
						title:
							'Dark Elegance (Charcoal / Midnight high-contrast aesthetic)',
						value: 'dark',
					},
					{
						title: 'Clean Surface (White / neutral bordered minimalist card)',
						value: 'neutral',
					},
					{
						title: 'Custom Accent (Specify custom hex colors below)',
						value: 'custom',
					},
				],
			},
			initialValue: 'brand',
			group: 'design',
			fieldset: 'visuals',
		}),
		defineField({
			name: 'customAccentColor',
			title: 'Custom Accent Hex Color',
			description:
				'Primary brand hex color for borders, icon containers, and badges (e.g. #6366F1, #0EA5E9, #E11D48).',
			type: 'string',
			placeholder: '#6366F1',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
					'Must be a valid hex color code (e.g. #6366F1)',
				),
			hidden: ({ parent }) => parent?.themeStyle !== 'custom',
			group: 'design',
			fieldset: 'visuals',
		}),
		defineField({
			name: 'customBackgroundColor',
			title: 'Custom Background Hex Color (Optional)',
			description:
				'Optional custom background color (e.g. #F8FAFC or #0F172A). Leave blank to apply an automatic 6% subtle tint of your accent color.',
			type: 'string',
			placeholder: '#F8FAFC',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
					'Must be a valid hex color code (e.g. #F8FAFC)',
				),
			hidden: ({ parent }) => parent?.themeStyle !== 'custom',
			group: 'design',
			fieldset: 'visuals',
		}),
		defineField({
			name: 'customTextColor',
			title: 'Custom Text Hex Color (Optional)',
			description:
				'Optional custom headline and text color (e.g. #0F172A). Leave blank to automatically adapt to site light/dark mode.',
			type: 'string',
			placeholder: '#0F172A',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
					'Must be a valid hex color code (e.g. #0F172A)',
				),
			hidden: ({ parent }) => parent?.themeStyle !== 'custom',
			group: 'design',
			fieldset: 'visuals',
		}),
		defineField({
			name: 'iconStyle',
			title: 'Featured Header Icon',
			description:
				'Prominent visual icon displayed with the promotional callout.',
			type: 'string',
			options: {
				list: [
					{ title: 'Information Notice (Blue / Neutral Info)', value: 'info' },
					{ title: 'Promo Tag / Discount (Sale & Offers)', value: 'tag' },
					{
						title: 'Megaphone / Announcement (News & Updates)',
						value: 'announcement',
					},
					{
						title: 'Sparkle / Premium (Exclusive Perks & New Features)',
						value: 'sparkle',
					},
					{ title: 'Shield / Guarantee (Security & Trust)', value: 'shield' },
					{
						title: 'Checkmark / Verified (Approval & Benefits)',
						value: 'check',
					},
					{ title: 'Alert / Warning (Important Heads-Up)', value: 'alert' },
					{ title: 'None (Hide Icon)', value: 'none' },
				],
			},
			initialValue: 'info',
			group: 'design',
			fieldset: 'visuals',
		}),
		defineField({
			name: 'borderStyle',
			title: 'Border Styling',
			description: 'Accent line styling around the callout card container.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Accent Left Border (Classic highlight box)',
						value: 'accent-left',
					},
					{
						title: 'Accent Top Border (Card header accent bar)',
						value: 'accent-top',
					},
					{ title: 'Full Border (Uniform border all around)', value: 'full' },
					{ title: 'Subtle Minimal (Soft hairline border)', value: 'subtle' },
				],
			},
			initialValue: 'accent-left',
			group: 'design',
			fieldset: 'visuals',
		}),
		defineField({
			name: 'maxWidth',
			title: 'Container Width',
			description:
				'Maximum width boundary of the callout card on desktop screens.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Standard (max-w-4xl — recommended for standard pages)',
						value: 'standard',
					},
					{
						title: 'Narrow / Focus (max-w-2xl — high focus for text notices)',
						value: 'narrow',
					},
					{
						title: 'Wide Container (max-w-6xl — matches broad page sections)',
						value: 'wide',
					},
				],
			},
			initialValue: 'standard',
			group: 'design',
		}),
		defineField({
			name: 'textAlign',
			title: 'Text Alignment (Centered Layout)',
			description:
				'Text alignment when using Centered Card layout. Split and Compact layouts always align left for natural reading flow.',
			type: 'string',
			options: {
				list: [
					{ title: 'Center (Default for hero promo cards)', value: 'center' },
					{ title: 'Left (Professional editorial alignment)', value: 'left' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			hidden: ({ parent }) =>
				parent?.layout === 'split' || parent?.layout === 'compact',
			group: 'design',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'callout',
		icon: VscInspect,
		titleFields: ['badge', 'intro'],
		select: {
			badge: 'badge',
			ctas: 'ctas',
			theme: 'themeStyle',
			customAccent: 'customAccentColor',
			layout: 'layout',
			icon: 'iconStyle',
		},
		metadata: (doc) => [
			doc.theme === 'custom' && doc.customAccent
				? `Theme: Custom (${doc.customAccent})`
				: doc.theme
					? `Theme: ${doc.theme}`
					: null,
			doc.layout ? `Layout: ${doc.layout}` : null,
			doc.ctas?.length
				? `${doc.ctas.length} CTA${doc.ctas.length > 1 ? 's' : ''}`
				: null,
			doc.badge || null,
		],
	}),
})
