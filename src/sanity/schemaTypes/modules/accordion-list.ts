import { defineArrayMember, defineField, defineType } from 'sanity'
import { TfiLayoutAccordionMerged } from 'react-icons/tfi'
import { getBlockText } from '@/lib/utils'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'accordion-list',
	title: 'FAQ Drawer',
	description:
		'Expandable question-and-answer list with built-in Schema.org FAQ SEO markup.',
	type: 'object',
	icon: TfiLayoutAccordionMerged,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: 'Help & FAQ',
			layout: 'vertical',
			headerAlign: 'center',
			accordionStyle: 'card',
			iconStyle: 'chevron',
			containerStyle: 'plain',
			spacing: 'default',
			exclusive: false,
			defaultOpen: 'first',
			showSearch: false,
			searchPlaceholder: 'Search questions, terms, or topics...',
			showExpandAll: false,
			enableSchema: true,
			intro: [
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Frequently Asked Questions',
							marks: [],
						},
					],
					style: 'h2',
				},
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Find quick answers to common questions about our products, global wholesale terms, sustainability compliance, and shipping logistics.',
							marks: [],
						},
					],
					style: 'normal',
				},
			],
			accordions: [
				{
					_key: genKey(),
					summary:
						'What is your Minimum Order Quantity (MOQ) for custom branding?',
					badge: 'Wholesale & MOQ',
					iconPreset: 'package',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'Our standard wholesale MOQ starts at 5,000 units for stock items and 25,000 units for custom embossed molds and bespoke dimensions.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
					open: true,
				},
				{
					_key: genKey(),
					summary:
						'Are DeanFlow products 100% compliant with international standards?',
					badge: 'Certifications',
					iconPreset: 'shield',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'Yes. All items comply with ASTM D6400 and EN 13432 certifications, decomposing naturally into non-toxic biomass within 90 days.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
					open: false,
				},
				{
					_key: genKey(),
					summary:
						'What are your international shipping terms and production lead times?',
					badge: 'Logistics',
					iconPreset: 'truck',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'We ship FOB Vietnam, CIF, or DDP to major global ports with standard production turnaround of 15 to 21 business days.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
					open: false,
				},
				{
					_key: genKey(),
					summary:
						'Can we request certified material test reports and physical lab samples?',
					badge: 'Samples & Testing',
					iconPreset: 'fileCheck',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'Absolutely. We provide free physical sample boxes to verified enterprise accounts. Third-party SGS and TÜV audit test reports are available upon request.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
					open: false,
				},
			],
		}
	},
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'layout', title: 'Layout' },
		{ name: 'design', title: 'Appearance & Style' },
		{ name: 'settings', title: 'Behavior & SEO' },
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// ================= TAB 1: CONTENT =================
		defineField({
			name: 'badge',
			title: 'Section Eyebrow Badge',
			description:
				'Optional small pill tag displayed above the main section heading (e.g. "HELP & FAQ", "COMMONLY ASKED").',
			type: 'string',
			group: 'content',
		}),
		defineField({
			name: 'intro',
			title: 'Section Header & Description',
			description:
				'Main section heading (H2) and explanatory marketing or support copy.',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'accordions',
			title: 'Questions & Answers',
			description:
				'Add, reorder, and configure individual FAQ questions and detailed answers.',
			type: 'array',
			group: 'content',
			validation: (Rule) =>
				Rule.min(1).warning(
					'Add at least one question and answer pair to display this section.',
				),
			of: [
				defineArrayMember({
					name: 'accordion',
					title: 'Question Item',
					type: 'object',
					fieldsets: [
						{
							name: 'meta',
							title: 'Topic Tag & Icon (Optional)',
							description:
								'Categorize this question with an optional tag or icon symbol.',
							options: { columns: 1, collapsible: true, collapsed: true },
						},
					],
					fields: [
						defineField({
							name: 'summary',
							title: 'Question Headline',
							description:
								'Clear, concise question statement (e.g. "What is your return policy?").',
							type: 'string',
							validation: (Rule) =>
								Rule.required().error('Question headline is required.'),
						}),
						defineField({
							name: 'badge',
							title: 'Topic / Category Tag',
							description:
								'Optional category pill tag (e.g. "Shipping", "Returns", "Wholesale").',
							type: 'string',
							fieldset: 'meta',
						}),
						defineField({
							name: 'iconPreset',
							title: 'Icon Preset',
							description: 'Optional vector symbol for this question category.',
							type: 'string',
							fieldset: 'meta',
							options: {
								list: [
									{ title: 'None (Default)', value: 'none' },
									{ title: 'Help / Question (HelpCircle)', value: 'help' },
									{
										title: 'Shield (Compliance / Security / Guarantee)',
										value: 'shield',
									},
									{
										title: 'Truck (Shipping / Fulfillment / Logistics)',
										value: 'truck',
									},
									{
										title: 'Credit Card (Pricing / Payment / Invoicing)',
										value: 'credit-card',
									},
									{
										title: 'Rotate / Refresh (Returns / Exchanges / Warranty)',
										value: 'refresh',
									},
									{
										title: 'Package (Products / Packaging / Unboxing)',
										value: 'package',
									},
									{
										title: 'Leaf (Sustainability / Eco / Materials)',
										value: 'leaf',
									},
									{
										title: 'Globe (International / Customs / Export)',
										value: 'globe',
									},
									{
										title: 'Sparkles (Features / Custom Molds)',
										value: 'sparkles',
									},
									{
										title: 'File Check (Certificates / Reports / Specs)',
										value: 'fileCheck',
									},
								],
							},
							initialValue: 'none',
						}),
						defineField({
							name: 'content',
							title: 'Answer Body',
							description:
								'Detailed answer with formatting, bullet points, or reference links.',
							type: 'array',
							of: [{ type: 'block' }],
						}),
						defineField({
							name: 'open',
							title: 'Expanded by default',
							description:
								'Start this question expanded when "Default Open Mode" is set to Custom.',
							type: 'boolean',
							initialValue: false,
						}),
					],
					preview: {
						select: {
							title: 'summary',
							badge: 'badge',
							content: 'content',
						},
						prepare: ({ title, badge, content }) => ({
							title: title || 'Untitled Question',
							subtitle: [badge, getBlockText(content)]
								.filter(Boolean)
								.join(' · '),
						}),
					},
				}),
			],
		}),
		defineField({
			name: 'ctas',
			title: 'Call-to-Action Buttons',
			description:
				'Optional action buttons beneath the intro header (e.g. "Browse Documentation", "Contact Sales").',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
		}),
		defineField({
			name: 'supportCard',
			title: 'Support & Assistance Box (Optional)',
			description:
				'Conversion-oriented contact box displayed at the bottom of the questions (e.g. "Still have questions? Chat with our team").',
			type: 'object',
			group: 'content',
			options: { collapsible: true, collapsed: true },
			fields: [
				defineField({
					name: 'enabled',
					title: 'Enable Support Card',
					description:
						'Display a helpful contact card at the conclusion of the FAQ.',
					type: 'boolean',
					initialValue: false,
				}),
				defineField({
					name: 'title',
					title: 'Card Heading',
					type: 'string',
					initialValue: 'Still have questions?',
				}),
				defineField({
					name: 'description',
					title: 'Card Description',
					type: 'text',
					rows: 2,
					initialValue:
						'Can’t find the answer you’re looking for? Reach out to our specialist team for dedicated support.',
				}),
				defineField({
					name: 'linkText',
					title: 'Button / Link Text',
					type: 'string',
					initialValue: 'Contact Support',
				}),
				defineField({
					name: 'linkUrl',
					title: 'Destination Link / URL',
					type: 'string',
					initialValue: '/contact',
				}),
			],
		}),

		// ================= TAB 2: LAYOUT =================
		defineField({
			name: 'layout',
			title: 'Layout Style',
			description:
				'Choose the architectural arrangement for the questions and intro header.',
			type: 'string',
			options: {
				list: [
					{
						value: 'vertical',
						title: 'Vertical (Single Column - Centered or Left)',
					},
					{
						value: 'horizontal',
						title: 'Horizontal (2-Column Split: Intro Left, Questions Right)',
					},
					{
						value: 'grid',
						title: 'Two-Column Grid (Questions side-by-side on desktop)',
					},
				],
				layout: 'radio',
			},
			initialValue: 'vertical',
			group: 'layout',
		}),
		defineField({
			name: 'headerAlign',
			title: 'Header Alignment',
			description: 'Text alignment for the intro heading and description.',
			type: 'string',
			options: {
				list: [
					{ value: 'center', title: 'Center Aligned' },
					{ value: 'left', title: 'Left Aligned' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'layout',
			hidden: ({ parent }) => parent?.layout === 'horizontal',
		}),

		// ================= TAB 3: DESIGN =================
		defineField({
			name: 'accordionStyle',
			title: 'Accordion Visual Style',
			description: 'Select the visual framing for individual question panels.',
			type: 'string',
			options: {
				list: [
					{
						value: 'card',
						title:
							'Card (Individual separated boxes with subtle borders and shadows)',
					},
					{
						value: 'separated',
						title:
							'Separated (Minimalist horizontal divider lines - luxury / editorial)',
					},
					{
						value: 'contained',
						title:
							'Contained (All questions grouped inside one single unified card)',
					},
				],
			},
			initialValue: 'card',
			group: 'design',
		}),
		defineField({
			name: 'iconStyle',
			title: 'Expand Indicator Symbol',
			description: 'Choose the visual indicator for expandable question rows.',
			type: 'string',
			options: {
				list: [
					{ value: 'chevron', title: 'Chevron (Smooth rotating arrow)' },
					{
						value: 'plus-minus',
						title: 'Plus / Minus (Classic expand/collapse toggle)',
					},
				],
				layout: 'radio',
			},
			initialValue: 'chevron',
			group: 'design',
		}),
		defineField({
			name: 'containerStyle',
			title: 'Section Container Framing',
			description:
				'Choose whether the entire FAQ section is transparent or framed.',
			type: 'string',
			options: {
				list: [
					{
						value: 'plain',
						title: 'Plain (Transparent, seamless with page background)',
					},
					{
						value: 'boxed',
						title: 'Boxed (Framed inside a rounded surface container)',
					},
					{
						value: 'tinted',
						title: 'Tinted (Subtle muted background contrast)',
					},
				],
				layout: 'radio',
			},
			initialValue: 'plain',
			group: 'design',
		}),
		defineField({
			name: 'spacing',
			title: 'Vertical Spacing',
			description: 'Controls the vertical padding above and below the module.',
			type: 'string',
			options: {
				list: [
					{ value: 'compact', title: 'Compact (py-8 lg:py-12)' },
					{ value: 'default', title: 'Default (py-12 lg:py-20)' },
					{ value: 'spacious', title: 'Spacious (py-16 lg:py-28)' },
					{ value: 'none', title: 'None (py-0)' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'design',
		}),

		// ================= TAB 4: SETTINGS & BEHAVIOR =================
		defineField({
			name: 'exclusive',
			title: 'Exclusive Accordion Mode',
			description:
				'Allow only one question to be open at any time (auto-closes others when a new one opens).',
			type: 'boolean',
			initialValue: false,
			group: 'settings',
		}),
		defineField({
			name: 'defaultOpen',
			title: 'Initial Expanded State',
			description:
				'Determines which questions start open when visitors first land on the page.',
			type: 'string',
			options: {
				list: [
					{ value: 'first', title: 'First Question Only (Recommended)' },
					{ value: 'none', title: 'All Collapsed' },
					{ value: 'all', title: 'All Expanded' },
					{
						value: 'custom',
						title: 'Custom (Use individual "Expanded by default" toggles)',
					},
				],
				layout: 'radio',
			},
			initialValue: 'first',
			group: 'settings',
		}),
		defineField({
			name: 'showSearch',
			title: 'Enable Live Search Filter',
			description:
				'Adds an instant search bar allowing visitors to quickly filter questions by keyword.',
			type: 'boolean',
			initialValue: false,
			group: 'settings',
		}),
		defineField({
			name: 'searchPlaceholder',
			title: 'Search Input Placeholder',
			description:
				'Placeholder text inside the search bar (e.g. "Search questions, policies, or topics...").',
			type: 'string',
			initialValue: 'Search questions, terms, or topics...',
			group: 'settings',
			hidden: ({ parent }) => !parent?.showSearch,
		}),
		defineField({
			name: 'showExpandAll',
			title: 'Show "Expand / Collapse All" Button',
			description:
				'Displays a quick action button for visitors to toggle all questions simultaneously.',
			type: 'boolean',
			initialValue: false,
			group: 'settings',
		}),
		defineField({
			name: 'enableSchema',
			title: 'Enable Google FAQPage Schema.org',
			description:
				'Generates clean structured JSON-LD data for Google search rich snippets and AI search overviews.',
			type: 'boolean',
			initialValue: true,
			group: 'settings',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'accordion-list',
		icon: TfiLayoutAccordionMerged,
		titleFields: ['intro', 'badge'],
		select: {
			accordions: 'accordions',
			items: 'items',
			layout: 'layout',
			accordionStyle: 'accordionStyle',
		},
		metadata: (doc: any) => {
			const count = (doc.accordions || doc.items)?.length || 0
			return [
				count ? `${count} question${count === 1 ? '' : 's'}` : null,
				doc.layout ? `Layout: ${doc.layout}` : null,
				doc.accordionStyle ? `Style: ${doc.accordionStyle}` : null,
			]
		},
	}),
})
