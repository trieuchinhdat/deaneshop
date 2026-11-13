import { defineArrayMember, defineField, defineType } from 'sanity'
import { TfiLayoutGrid2Thumb } from 'react-icons/tfi'
import { count, getBlockText } from '@shared/content-utils'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'card-list',
	title: 'Feature Cards',
	description:
		'Showcase product capabilities, service USPs, or key enterprise features in a responsive multi-column grid.',
	type: 'object',
	icon: TfiLayoutGrid2Thumb,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: 'Enterprise Capabilities',
			desktopLayout: 'grid',
			columns: 3,
			mobileLayout: 'stack',
			showNavigationArrows: true,
			cardLayout: 'stacked',
			headerAlign: 'center',
			textAlign: 'left',
			containerStyle: 'boxed',
			spacing: 'default',
			cardStyle: 'card',
			iconStyle: 'brand',
			imageAspectRatio: '16/9',
			intro: [
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Engineered for Performance & Sustainability',
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
							text: 'Eliminate single-use plastic compliance risks with certified plant-based packaging designed for enterprise food service.',
							marks: [],
						},
					],
					style: 'normal',
				},
			],
			cards: [
				{
					_key: genKey(),
					badge: 'ASTM Certified',
					iconPreset: 'shield',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: '100% Home Compostable',
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
									text: 'Certified ASTM D6400 and EN 13432. Disintegrates naturally in home compost piles within 90 days with zero microplastic residue.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
				},
				{
					_key: genKey(),
					badge: 'Zero Toxins',
					iconPreset: 'check',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'FDA Food-Contact Safe',
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
									text: 'Completely PFAS-free and BPA-free. Rigorously lab-tested to withstand boiling oils, hot soups, and deep freezing from -20°C to 120°C.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
				},
				{
					_key: genKey(),
					badge: 'Rapid Tooling',
					iconPreset: 'zap',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'Custom Embossing & Low MOQ',
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
									text: 'Fast 10-day rapid CNC mold prototyping. Elevate your brand experience with custom debossed logos and bespoke container geometries.',
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
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),
		defineField({
			name: 'badge',
			title: 'Section Eyebrow Badge',
			description:
				'Optional small uppercase pill badge above the section title (e.g., "ENTERPRISE ADVANTAGES").',
			type: 'string',
			group: 'content',
		}),
		defineField({
			name: 'intro',
			title: 'Section Header & Pitch',
			description: 'Section heading (H2) and introductory marketing copy.',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'cards',
			title: 'Feature Cards',
			description:
				'Add, reorder, and configure individual capability cards in the grid.',
			type: 'array',
			group: 'content',
			validation: (Rule) =>
				Rule.min(1).warning(
					'Add at least one feature card to display the section.',
				),
			of: [
				defineArrayMember({
					name: 'card',
					title: 'Feature Card',
					type: 'object',
					fieldsets: [
						{
							name: 'asset',
							title: 'Card Visual Media',
							description:
								'Choose a preset icon, upload a custom vector/PNG icon, or upload a showcase image.',
							options: { columns: 1, collapsible: true, collapsed: false },
						},
						{
							name: 'interaction',
							title: 'Card Link & Actions',
							options: { collapsible: true, collapsed: true },
						},
					],
					fields: [
						defineField({
							name: 'badge',
							title: 'Card Highlight Badge',
							description:
								'Optional small badge pill (e.g., "Patented", "ASTM D6400", "New", "Eco-Certified").',
							type: 'string',
						}),
						defineField({
							name: 'iconPreset',
							title: 'Icon Symbol Preset',
							description:
								'Select a clean, high-utility vector icon symbol for quick merchant configuration.',
							type: 'string',
							fieldset: 'asset',
							options: {
								list: [
									{
										title: 'None (Use custom upload or no icon)',
										value: 'none',
									},
									{
										title: 'Shield (Security, Guarantee, Certified)',
										value: 'shield',
									},
									{
										title: 'Zap (Speed, High Performance, Rapid Tooling)',
										value: 'zap',
									},
									{
										title: 'Check (Verified, Safe, Compliant)',
										value: 'check',
									},
									{
										title: 'Sparkles (Premium, Quality, Innovation)',
										value: 'sparkles',
									},
									{
										title: 'Leaf (Eco-Friendly, Compostable, Sustainable)',
										value: 'leaf',
									},
									{
										title: 'Award (Accreditation, Industry Standard)',
										value: 'award',
									},
									{
										title: 'Truck (Logistics, Fast Shipping, Global Freight)',
										value: 'truck',
									},
									{
										title: 'Globe (International Reach, Worldwide Export)',
										value: 'globe',
									},
									{
										title: 'Lock (Data Protection, Privacy, Compliance)',
										value: 'lock',
									},
									{
										title: 'Bar Chart (Analytics, Production Scale, Growth)',
										value: 'barchart',
									},
									{
										title: 'Clock (24/7 Support, Quick Turnaround, Durability)',
										value: 'clock',
									},
									{
										title: 'Heart (Customer Satisfaction, Care)',
										value: 'heart',
									},
									{
										title: 'Refresh (Circular Economy, Recycling, Reusability)',
										value: 'refresh',
									},
									{
										title:
											'Layers (Modular Architecture, Stacking, Material Layers)',
										value: 'layers',
									},
									{
										title: 'CPU (High-Precision Tech, Automated Manufacturing)',
										value: 'cpu',
									},
									{
										title: 'Package (Custom Packaging, Food Service Boxes)',
										value: 'package',
									},
									{
										title: 'Star (Top Rated, Customer Favorite)',
										value: 'star',
									},
									{
										title: 'Flame (Heat Resistant / Hot Food / Microwave Safe)',
										value: 'flame',
									},
									{
										title: 'Snowflake (Freezer Safe / Deep Cold Storage)',
										value: 'snowflake',
									},
									{
										title: 'Droplets (Grease & Liquid Barrier / Oil Resistant)',
										value: 'droplets',
									},
									{
										title: 'Flask (Lab Tested / SGS & TÜV Certified)',
										value: 'flask',
									},
									{
										title: 'Recycle (Circular Packaging / Compostable)',
										value: 'recycle',
									},
									{
										title: 'Factory (Industrial Scale / Automated Lines)',
										value: 'factory',
									},
									{
										title: 'File Text (Specification Sheet / Lab Report)',
										value: 'fileText',
									},
									{
										title: 'Scale (Regulatory Compliance / ASTM Standards)',
										value: 'scale',
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
							name: 'image',
							title: 'Card Showcase Image',
							description:
								'Optional photo or illustration displayed at the top of the card.',
							type: 'image',
							options: {
								hotspot: true,
							},
							fields: [
								defineField({
									name: 'alt',
									title: 'Alternative Text',
									description:
										'Descriptive text for accessibility and SEO screen readers.',
									type: 'string',
								}),
							],
							fieldset: 'asset',
						}),
						defineField({
							name: 'content',
							title: 'Card Heading & Copy',
							description:
								'Feature title (H3) and descriptive body copy explaining user benefits.',
							type: 'array',
							of: [{ type: 'block' }],
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'link',
							title: 'Card Target Link',
							description:
								'Optional internal or external destination link for this card.',
							type: 'link',
							fieldset: 'interaction',
						}),
						defineField({
							name: 'linkEntireCard',
							title: 'Make Entire Card Clickable',
							description:
								'When enabled and a link or CTA is configured, clicking anywhere on the card navigates to the destination.',
							type: 'boolean',
							initialValue: false,
							fieldset: 'interaction',
						}),
						defineField({
							name: 'ctas',
							title: 'Card Action Buttons',
							description:
								'Optional button or text link at the footer of the card.',
							type: 'array',
							of: [{ type: 'cta' }],
							fieldset: 'interaction',
						}),
					],
					preview: {
						select: {
							content: 'content',
							badge: 'badge',
							iconPreset: 'iconPreset',
							cta: 'ctas.0.link.label',
							image: 'image',
							icon: 'icon',
						},
						prepare: ({ content, badge, iconPreset, cta, image, icon }) => {
							const heading = getBlockText(content) || 'Feature Card'
							const iconLabel =
								iconPreset && iconPreset !== 'none'
									? `Icon: ${iconPreset}`
									: null
							const subParts = [badge, iconLabel, cta].filter(Boolean)
							return {
								title: heading,
								subtitle:
									subParts.length > 0 ? subParts.join(' · ') : undefined,
								media: image || icon,
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
				'Optional conversion action buttons below the feature grid (e.g., "Request Sample Kit", "View All Capabilities").',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
		}),

		// Tab 2: Layout & Grid
		defineField({
			name: 'desktopLayout',
			title: 'Desktop Layout Mode',
			description:
				'Choose between a standard multi-column grid or a horizontal scrollable card carousel on desktop.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Standard Grid — Multi-column showcase (Recommended)',
						value: 'grid',
					},
					{
						title:
							'Horizontal Carousel — Scrollable slider with navigation controls',
						value: 'carousel',
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
				'Number of feature cards displayed per row on desktop screens.',
			type: 'number',
			options: {
				list: [
					{ title: '3 Columns — Balanced Showcase (Recommended)', value: 3 },
					{
						title: '2 Columns — High-Detail Comparison / Wide Cards',
						value: 2,
					},
					{ title: '4 Columns — Compact Capabilities', value: 4 },
					{ title: '1 Column — Full-Width Vertical List', value: 1 },
				],
				layout: 'radio',
			},
			initialValue: 3,
			hidden: ({ parent }) => parent?.desktopLayout === 'carousel',
			group: 'layout',
		}),
		defineField({
			name: 'mobileLayout',
			title: 'Mobile Screen Layout',
			description:
				'Control how feature cards behave on mobile devices (smartphones).',
			type: 'string',
			options: {
				list: [
					{
						title: '1 Column Stack — Standard vertical scroll (Recommended)',
						value: 'stack',
					},
					{
						title: '2 Columns Grid — Compact view for short cards',
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
			name: 'showNavigationArrows',
			title: 'Show Carousel Navigation Arrows',
			description:
				'Display previous and next arrow buttons when desktop or mobile carousel layout is active.',
			type: 'boolean',
			initialValue: true,
			group: 'layout',
		}),
		defineField({
			name: 'cardLayout',
			title: 'Card Media Arrangement',
			description:
				'Choose whether icons/images sit on top of the text or beside the text.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Stacked — Visual media on top (Standard)',
						value: 'stacked',
					},
					{
						title:
							'Horizontal — Icon on left side of text (Compact capability list)',
						value: 'horizontal',
					},
				],
				layout: 'radio',
			},
			initialValue: 'stacked',
			group: 'layout',
		}),
		defineField({
			name: 'headerAlign',
			title: 'Section Header Alignment',
			description:
				'Alignment for the section eyebrow badge, main title, and introductory paragraph.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Center — Polished marketing pitch (Recommended)',
						value: 'center',
					},
					{
						title: 'Left — Clean editorial / Technical B2B format',
						value: 'left',
					},
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'layout',
		}),
		defineField({
			name: 'textAlign',
			title: 'Card Content Alignment',
			description:
				'Alignment of titles, paragraphs, and CTAs inside each individual feature card.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Left — Clean & easily readable (Recommended)',
						value: 'left',
					},
					{ title: 'Center — Symmetric pitch style', value: 'center' },
				],
				layout: 'radio',
			},
			initialValue: 'left',
			group: 'layout',
		}),
		defineField({
			name: 'imageAspectRatio',
			title: 'Card Image Aspect Ratio',
			description: 'Display proportion when card images are uploaded.',
			type: 'string',
			options: {
				list: [
					{ title: '16:9 Widescreen Landscape (Recommended)', value: '16/9' },
					{ title: '4:3 Standard Photo', value: '4/3' },
					{ title: '1:1 Square (Product / Technical Focus)', value: '1/1' },
					{ title: 'Natural / Auto', value: 'auto' },
				],
			},
			initialValue: '16/9',
			group: 'layout',
		}),
		defineField({
			name: 'containerStyle',
			title: 'Section Framing & Surface',
			description:
				'Enclose the entire grid in an elevated surface container or keep it open against the page background.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Framed Box (Subtle border with elevated background surface)',
						value: 'boxed',
					},
					{ title: 'Open Grid (Seamless page background)', value: 'plain' },
				],
				layout: 'radio',
			},
			initialValue: 'boxed',
			group: 'layout',
		}),
		defineField({
			name: 'spacing',
			title: 'Section Vertical Spacing',
			description: 'Control top and bottom padding of the feature section.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Standard (py-12 to py-20 — Recommended)',
						value: 'default',
					},
					{
						title: 'Compact (py-8 to py-12 — Dense page flow)',
						value: 'compact',
					},
					{
						title: 'Spacious (py-16 to py-28 — High-end brand landing)',
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
			description: 'Visual container styling applied to each individual card.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Classic Card (Subtle border, surface background, soft hover lift)',
						value: 'card',
					},
					{
						title: 'Elevated (Floating shadow with interactive lift)',
						value: 'elevated',
					},
					{
						title: 'Minimal (Clean borderless tonal surface for high density)',
						value: 'minimal',
					},
					{ title: 'Glass (Translucent backdrop blur effect)', value: 'glass' },
				],
				layout: 'radio',
			},
			initialValue: 'card',
			group: 'design',
		}),
		defineField({
			name: 'iconStyle',
			title: 'Icon Badge Visual Treatment',
			description: 'Styling for feature card icon containers.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Brand Accent (Soft brand tint with refined ring border)',
						value: 'brand',
					},
					{
						title: 'Slate Neutral (Modern charcoal/slate badge)',
						value: 'neutral',
					},
					{
						title: 'Gradient Glow (Modern dynamic subtle glow)',
						value: 'gradient',
					},
					{
						title: 'Minimalist (Clean icon without container box)',
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
		schemaName: 'card-list',
		icon: TfiLayoutGrid2Thumb,
		titleFields: ['intro', 'badge'],
		select: {
			cards: 'cards',
			columns: 'columns',
		},
		metadata: (doc) => [
			doc.cards?.length ? `${doc.cards.length} cards` : null,
			doc.columns ? `${doc.columns} columns` : null,
		],
	}),
})
