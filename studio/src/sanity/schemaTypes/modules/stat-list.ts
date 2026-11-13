import { defineArrayMember, defineField, defineType } from 'sanity'
import { NumberIcon } from '@sanity/icons'
import { getBlockText } from '@shared/content-utils'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'stat-list',
	title: 'Impact Metrics',
	description:
		'Large numeric proof points emphasizing business scale, growth, sustainability impact, and verified achievements.',
	type: 'object',
	icon: NumberIcon,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: 'Proven Impact & Scale',
			layout: 'grid',
			columns: 4,
			mobileLayout: 'stack',
			headerAlign: 'center',
			textAlign: 'center',
			containerStyle: 'plain',
			spacing: 'default',
			cardStyle: 'card',
			numberColor: 'brand',
			numberSize: 'default',
			iconStyle: 'brand',
			animateCounter: true,
			intro: [
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Proven Manufacturing Scale & Environmental Impact',
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
							text: 'Verified production capacity and accredited sustainability benchmarks across our global facilities.',
							marks: [],
						},
					],
					style: 'normal',
				},
			],
			stats: [
				{
					_key: genKey(),
					value: '500,000',
					suffix: '+',
					label: 'Daily Output',
					iconPreset: 'factory',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'Daily Unit Production Capacity across automated cleanroom lines.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
				},
				{
					_key: genKey(),
					value: '25,000',
					suffix: 'm²',
					label: 'Facility Area',
					iconPreset: 'layers',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'Certified ISO 9001 & ISO 14001 manufacturing facility floor area.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
				},
				{
					_key: genKey(),
					value: '32',
					suffix: '+',
					label: 'Global Reach',
					iconPreset: 'globe',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'International Export Destinations across US, EU, Japan & Australia.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
				},
				{
					_key: genKey(),
					value: '72',
					suffix: '%',
					label: 'Carbon Reduction',
					iconPreset: 'leaf',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'Lifecycle Carbon Reduction compared to fossil fuel-derived plastics.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
				},
			],
		}
	},
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'layout', title: 'Layout & Grid' },
		{ name: 'design', title: 'Appearance & Style' },
		{ name: 'settings', title: 'Settings' },
	],
	fields: [
		// Tab 4: Settings
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),
		defineField({
			name: 'animateCounter',
			title: 'Interactive Count-Up Animation',
			description:
				'Smoothly animate numeric figures when the section scrolls into view (automatically respects prefers-reduced-motion).',
			type: 'boolean',
			initialValue: true,
			group: 'settings',
		}),

		// Tab 1: Content
		defineField({
			name: 'badge',
			title: 'Section Eyebrow Badge',
			description:
				'Optional small uppercase pill badge above the section title (e.g., "BY THE NUMBERS", "PROVEN IMPACT").',
			type: 'string',
			group: 'content',
		}),
		defineField({
			name: 'intro',
			title: 'Section Header & Narrative',
			description:
				'Section heading (H2) and introductory narrative copy explaining key achievements.',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'stats',
			title: 'Metric Highlights',
			description:
				'Key numeric proof points, scale statistics, and sustainability achievements.',
			type: 'array',
			group: 'content',
			validation: (Rule) =>
				Rule.min(1).warning(
					'Add at least one metric highlight to display the section.',
				),
			of: [
				defineArrayMember({
					name: 'stat',
					title: 'Metric Stat',
					type: 'object',
					fieldsets: [
						{
							name: 'metricFigure',
							title: 'Metric Figure & Symbols',
							description:
								'Define the numeric value along with optional prefix and suffix symbols (e.g., $ · 500,000 · +).',
						},
						{
							name: 'asset',
							title: 'Metric Icon / Visual Media',
							description:
								'Choose a preset icon symbol or upload a custom SVG/PNG icon.',
							options: { collapsible: true, collapsed: true },
						},
						{
							name: 'interaction',
							title: 'Card Link & Actions',
							options: { collapsible: true, collapsed: true },
						},
					],
					fields: [
						defineField({
							name: 'prefix',
							title: 'Prefix Symbol',
							description: 'E.g., $, £, €, >, <, ~',
							type: 'string',
							fieldset: 'metricFigure',
						}),
						defineField({
							name: 'value',
							title: 'Numeric Figure',
							description: 'E.g., 500, 99.4, 10, 25,000',
							type: 'string',
							fieldset: 'metricFigure',
							validation: (Rule) =>
								Rule.required().error('Metric figure is required.'),
						}),
						defineField({
							name: 'suffix',
							title: 'Suffix / Unit',
							description: 'E.g., +, %, M, k, m², /yr',
							type: 'string',
							fieldset: 'metricFigure',
						}),
						defineField({
							name: 'label',
							title: 'Metric Label (Short Title)',
							description:
								'Optional concise title above or beside description (e.g., "Daily Output", "Facility Area").',
							type: 'string',
						}),
						defineField({
							name: 'content',
							title: 'Metric Context & Description',
							description:
								'Descriptive copy explaining the metric context, audit standard, or business significance.',
							type: 'array',
							of: [{ type: 'block' }],
						}),
						defineField({
							name: 'iconPreset',
							title: 'Icon Symbol Preset',
							description:
								'Select a clean Lucide vector icon symbol for quick merchant configuration.',
							type: 'string',
							fieldset: 'asset',
							options: {
								list: [
									{ title: 'None (No icon)', value: 'none' },
									{
										title: 'Shield (Security, Verified, Certified)',
										value: 'shield',
									},
									{
										title: 'Zap (Speed, Rapid Tooling, Efficiency)',
										value: 'zap',
									},
									{
										title: 'Check (Compliance, Quality Approved)',
										value: 'check',
									},
									{
										title: 'Leaf (Sustainability, ESG, Eco-friendly)',
										value: 'leaf',
									},
									{
										title: 'Award (Accreditation, Excellence, Honors)',
										value: 'award',
									},
									{
										title: 'Globe (International Reach, Export Markets)',
										value: 'globe',
									},
									{
										title: 'Factory (Manufacturing Scale, Cleanroom Lines)',
										value: 'factory',
									},
									{
										title: 'Bar Chart (Growth, Revenue, High Volume)',
										value: 'barchart',
									},
									{
										title: 'Truck (Logistics, Freight, Delivery)',
										value: 'truck',
									},
									{
										title: 'Sparkles (Innovation, Premium Grade)',
										value: 'sparkles',
									},
									{
										title: 'Clock (24/7 Production, Rapid Turnaround)',
										value: 'clock',
									},
									{
										title: 'Heart (Customer Trust, Satisfaction)',
										value: 'heart',
									},
									{
										title: 'Refresh (Circular Economy, Recycling)',
										value: 'refresh',
									},
									{
										title: 'Layers (Material Layers, Facility Floor Area)',
										value: 'layers',
									},
									{
										title: 'CPU (Automation, Precision Engineering)',
										value: 'cpu',
									},
									{
										title: 'Package (Custom Packaging Units)',
										value: 'package',
									},
									{
										title: 'Recycle (Compostable, Zero-Waste)',
										value: 'recycle',
									},
									{
										title: 'Scale (ASTM Standards, Regulatory Compliance)',
										value: 'scale',
									},
									{
										title: 'Flame (Thermal Resistance, Microwave Safe)',
										value: 'flame',
									},
									{
										title: 'Droplets (Grease & Moisture Barrier)',
										value: 'droplets',
									},
									{
										title: 'Flask (Lab Audited, Food-Contact Safe)',
										value: 'flask',
									},
								],
							},
							initialValue: 'none',
						}),
						defineField({
							name: 'icon',
							title: 'Custom Icon Graphic (Upload)',
							description:
								'Optional custom transparent PNG or SVG icon graphic. Overrides preset icon if provided.',
							type: 'image',
							fieldset: 'asset',
						}),
						defineField({
							name: 'link',
							title: 'Card Target Link',
							description:
								'Optional destination link when clicking this metric card.',
							type: 'link',
							fieldset: 'interaction',
						}),
						defineField({
							name: 'linkEntireCard',
							title: 'Make Entire Card Clickable',
							description:
								'When enabled and a link is configured, clicking anywhere on the card navigates to the destination.',
							type: 'boolean',
							initialValue: false,
							fieldset: 'interaction',
						}),
					],
					preview: {
						select: {
							prefix: 'prefix',
							value: 'value',
							suffix: 'suffix',
							label: 'label',
							content: 'content',
							iconPreset: 'iconPreset',
							icon: 'icon',
						},
						prepare: ({
							prefix,
							value,
							suffix,
							label,
							content,
							iconPreset,
							icon,
						}) => {
							const figure =
								[prefix, value, suffix].filter(Boolean).join('') || 'Metric'
							const iconText =
								iconPreset && iconPreset !== 'none'
									? `[Icon: ${iconPreset}]`
									: null
							const subtitle = [label, iconText, getBlockText(content)]
								.filter(Boolean)
								.join(' · ')
							return {
								title: figure,
								subtitle: subtitle || undefined,
								media: icon,
							}
						},
					},
				}),
			],
		}),
		defineField({
			name: 'ctas',
			title: 'Section Call-to-actions',
			description:
				'Optional conversion action buttons below the metric highlights (e.g., "Request Capacity Audit", "Download ESG Report").',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
		}),

		// Tab 2: Layout & Grid
		defineField({
			name: 'layout',
			title: 'Section Layout Mode',
			description:
				'Choose the overall structural arrangement of the metrics section.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Standard Grid — Multi-column metric cards (Recommended)',
						value: 'grid',
					},
					{
						title:
							'Split Showcase — Sticky left narrative with right metrics grid',
						value: 'split',
					},
					{
						title:
							'Bento Highlight — Prominent primary metric with supporting cards',
						value: 'bento',
					},
					{
						title: 'Trust Bar — Clean borderless ticker with vertical dividers',
						value: 'divider',
					},
				],
				layout: 'radio',
			},
			initialValue: 'grid',
			group: 'layout',
		}),
		defineField({
			name: 'columns',
			title: 'Desktop Grid Columns',
			description:
				'Number of metric cards displayed per row on desktop screens.',
			type: 'number',
			options: {
				list: [
					{
						title: '4 Columns — Standard Quad Metrics (Recommended)',
						value: 4,
					},
					{ title: '3 Columns — High-Emphasis Triple Metrics', value: 3 },
					{ title: '2 Columns — High-Detail Dual Showcase', value: 2 },
					{ title: '5 Columns — Compact High-Density Row', value: 5 },
				],
				layout: 'radio',
			},
			initialValue: 4,
			hidden: ({ parent }) =>
				parent?.layout === 'split' || parent?.layout === 'divider',
			group: 'layout',
		}),
		defineField({
			name: 'mobileLayout',
			title: 'Mobile Screen Layout',
			description:
				'Control how metric highlights behave on smartphones and small screens.',
			type: 'string',
			options: {
				list: [
					{
						title: '1 Column Stack — Standard vertical scroll (Recommended)',
						value: 'stack',
					},
					{
						title: '2 Columns Grid — Compact view for short metrics',
						value: 'grid-2',
					},
					{
						title: 'Horizontal Swipe Carousel — Space-saving swipeable cards',
						value: 'carousel',
					},
				],
				layout: 'radio',
			},
			initialValue: 'stack',
			group: 'layout',
		}),
		defineField({
			name: 'headerAlign',
			title: 'Section Header Alignment',
			description:
				'Alignment for eyebrow badge, main title, and introductory narrative.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Center — Balanced marketing pitch (Recommended)',
						value: 'center',
					},
					{
						title: 'Left — Clean editorial / Technical enterprise',
						value: 'left',
					},
				],
				layout: 'radio',
			},
			initialValue: 'center',
			hidden: ({ parent }) => parent?.layout === 'split',
			group: 'layout',
		}),
		defineField({
			name: 'textAlign',
			title: 'Metric Content Alignment',
			description:
				'Alignment of figures, labels, and descriptions inside each individual card.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Center — Symmetric pitch style (Recommended)',
						value: 'center',
					},
					{
						title: 'Left — Clean editorial / Technical alignment',
						value: 'left',
					},
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'layout',
		}),
		defineField({
			name: 'containerStyle',
			title: 'Section Framing & Surface',
			description:
				'Enclose the entire metrics section in an elevated container or keep it open against page background.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Open Section — Seamless page background (Recommended)',
						value: 'plain',
					},
					{
						title:
							'Framed Box — Subtle border with elevated background surface',
						value: 'boxed',
					},
				],
				layout: 'radio',
			},
			initialValue: 'plain',
			group: 'layout',
		}),
		defineField({
			name: 'spacing',
			title: 'Section Vertical Spacing',
			description:
				'Control top and bottom padding of the impact metrics section.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Standard (py-12 to py-20 — Recommended)',
						value: 'default',
					},
					{
						title: 'Compact (py-6 to py-12 — Dense page flow)',
						value: 'compact',
					},
					{
						title: 'Spacious (py-16 to py-28 — High-impact brand section)',
						value: 'spacious',
					},
					{ title: 'None (Flush edge-to-edge)', value: 'none' },
				],
			},
			initialValue: 'default',
			group: 'layout',
		}),

		// Tab 3: Appearance & Style
		defineField({
			name: 'cardStyle',
			title: 'Card Visual Aesthetic',
			description:
				'Visual container styling applied to each individual metric card.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Classic Card — Subtle border, surface background, soft hover glow (Recommended)',
						value: 'card',
					},
					{
						title: 'Elevated — Floating shadow with interactive lift',
						value: 'elevated',
					},
					{
						title: 'Minimal Tonal — Clean borderless tonal surface',
						value: 'minimal',
					},
					{
						title: 'Crisp Outline — Transparent background with subtle border',
						value: 'outline',
					},
				],
				layout: 'radio',
			},
			initialValue: 'card',
			hidden: ({ parent }) => parent?.layout === 'divider',
			group: 'design',
		}),
		defineField({
			name: 'numberColor',
			title: 'Metric Figure Color Treatment',
			description: 'Color styling applied to the large numeric figures.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Brand Primary — Deep brand accent color (Recommended)',
						value: 'brand',
					},
					{
						title: 'Gradient Glow — Modern dynamic brand gradient',
						value: 'gradient',
					},
					{
						title: 'High-Contrast Neutral — Monochrome foreground text',
						value: 'neutral',
					},
				],
				layout: 'radio',
			},
			initialValue: 'brand',
			group: 'design',
		}),
		defineField({
			name: 'numberSize',
			title: 'Metric Figure Typography Scale',
			description: 'Scale and prominence of the large numeric proof points.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Large Impact (text-3xl to 5xl — Recommended)',
						value: 'default',
					},
					{
						title: 'Balanced Metric (text-2xl to 4xl — For dense layouts)',
						value: 'compact',
					},
					{
						title: 'Massive Statement (text-4xl to 6xl — For 2-3 key stats)',
						value: 'heroic',
					},
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'design',
		}),
		defineField({
			name: 'iconStyle',
			title: 'Icon Badge Visual Treatment',
			description: 'Styling for metric icon containers.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Brand Accent — Soft brand tint with refined ring border (Recommended)',
						value: 'brand',
					},
					{
						title: 'Slate Neutral — Modern charcoal/slate badge',
						value: 'neutral',
					},
					{
						title: 'Minimalist — Clean icon without container box',
						value: 'minimal',
					},
				],
				layout: 'radio',
			},
			initialValue: 'brand',
			group: 'design',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'stat-list',
		icon: NumberIcon,
		titleFields: ['badge', 'intro'],
		select: {
			stats: 'stats',
			layout: 'layout',
		},
		metadata: (doc) => [
			doc.stats?.length ? `${doc.stats.length} metrics` : null,
			doc.layout ? `Layout: ${doc.layout}` : null,
		],
	}),
})
