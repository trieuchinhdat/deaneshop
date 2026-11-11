import { defineArrayMember, defineField, defineType } from 'sanity'
import { OlistIcon } from '@sanity/icons'
import { getBlockText } from '@/lib/utils'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'step-list',
	title: 'Process Steps',
	description:
		'Sequential numbered milestone workflow illustrating how your product, fulfillment, or partnership operates.',
	type: 'object',
	icon: OlistIcon,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: 'How It Works',
			layout: 'split',
			columns: 3,
			mobileLayout: 'stack',
			headerAlign: 'left',
			spacing: 'default',
			containerStyle: 'plain',
			stepStyle: 'card',
			numberStyle: 'brand',
			showConnector: true,
			animateTimeline: true,
			enableSchema: true,
			intro: [
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Seamless Procurement & Manufacturing',
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
							text: 'From technical sample testing to international container freight delivery, our verified 3-step process ensures predictable quality and zero delays.',
							marks: [],
						},
					],
					style: 'normal',
				},
			],
			steps: [
				{
					_key: genKey(),
					title: 'Specification Review & Sample Dispatch',
					badge: 'Step 01 · 24-48h',
					iconPreset: 'search',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'Submit your dimensions, food-contact requirements, and brand packaging specifications to receive express physical lab sample kits.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
				},
				{
					_key: genKey(),
					title: 'Tooling & Pilot Production Run',
					badge: 'Step 02 · 10 Days',
					iconPreset: 'cpu',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'Automated CNC tooling, mold calibration, and third-party laboratory audit validation (SGS/TÜV) guarantee 100% compliance.',
									marks: [],
								},
							],
							style: 'normal',
						},
					],
				},
				{
					_key: genKey(),
					title: 'Mass Manufacturing & Global Logistics',
					badge: 'Step 03 · Dispatch',
					iconPreset: 'truck',
					content: [
						{
							_key: genKey(),
							_type: 'block',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: 'High-speed thermoforming output, certified export palletization, and insured container shipment on FOB, CIF, or DDP terms.',
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
		{ name: 'layout', title: 'Layout & Progression' },
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
				'Optional small uppercase pill badge above the section title (e.g., "HOW IT WORKS", "STEP-BY-STEP PROCESS").',
			type: 'string',
			group: 'content',
		}),
		defineField({
			name: 'intro',
			title: 'Section Header & Description',
			description: 'Main section heading (H2) and explanatory marketing copy.',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'steps',
			title: 'Workflow Steps',
			description:
				'Add, reorder, and configure individual process steps in the milestone sequence.',
			type: 'array',
			group: 'content',
			validation: (Rule) =>
				Rule.min(1).warning(
					'Add at least one process step to display the milestone workflow.',
				),
			of: [
				defineArrayMember({
					name: 'step',
					title: 'Process Step',
					type: 'object',
					fieldsets: [
						{
							name: 'meta',
							title: 'Step Tags & Timing (Optional)',
							description: 'Highlight duration, tags, or phase identifiers.',
							options: { columns: 1, collapsible: true, collapsed: true },
						},
						{
							name: 'visual',
							title: 'Visual Media (Optional)',
							description:
								'Choose a preset vector icon, upload a custom icon graphic, or add a showcase photo.',
							options: { columns: 1, collapsible: true, collapsed: true },
						},
						{
							name: 'action',
							title: 'Step Action Link (Optional)',
							description: 'Optional destination link or action button for this step.',
							options: { collapsible: true, collapsed: true },
						},
					],
					fields: [
						defineField({
							name: 'title',
							title: 'Step Headline / Title',
							description:
								'Clear milestone headline (e.g. "Specification Review & Sample Dispatch").',
							type: 'string',
						}),
						defineField({
							name: 'badge',
							title: 'Step Tag / Duration Badge',
							description:
								'Optional pill badge (e.g. "Step 01", "24–48 Hours", "Free Sample", "Sign-Off").',
							type: 'string',
							fieldset: 'meta',
						}),
						defineField({
							name: 'iconPreset',
							title: 'Icon Symbol Preset',
							description:
								'Select a clean, high-utility vector icon for quick merchant configuration.',
							type: 'string',
							fieldset: 'visual',
							options: {
								list: [
									{
										title: 'None (Use milestone number badge)',
										value: 'none',
									},
									{
										title: 'Search (Discovery, Scope, Consultation)',
										value: 'search',
									},
									{
										title: 'File Text (Blueprint, Quotation, Lab Spec)',
										value: 'fileText',
									},
									{
										title: 'CPU / Tooling (Engineering, Calibration, Prototyping)',
										value: 'cpu',
									},
									{
										title: 'Factory (Manufacturing, Cleanroom Line)',
										value: 'factory',
									},
									{
										title: 'Check (Quality Audit, Verified Compliance, SGS)',
										value: 'check',
									},
									{
										title: 'Package (Custom Packaging, Palletization)',
										value: 'package',
									},
									{
										title: 'Truck (Logistics, Ocean Freight, Express Dispatch)',
										value: 'truck',
									},
									{
										title: 'Globe (Customs Clearance, Global Export, DDP)',
										value: 'globe',
									},
									{
										title: 'Zap (Rapid Dispatch, Fast Turnaround)',
										value: 'zap',
									},
									{
										title: 'Shield (Warranty, Safe Handling, ISO Standards)',
										value: 'shield',
									},
									{
										title: 'Sparkles (Polished Output, Premium Quality)',
										value: 'sparkles',
									},
									{
										title: 'Clock (24/7 Processing, Timely Delivery)',
										value: 'clock',
									},
									{
										title: 'Phone (Kickoff Consultation, Dedicated Call)',
										value: 'phone',
									},
									{
										title: 'User Check (Account Setup, Client Approval)',
										value: 'userCheck',
									},
									{
										title: 'Credit Card (Secure Checkout, Order Confirmation)',
										value: 'creditCard',
									},
									{
										title: 'Settings (Custom Dimensions, Tailored Specs)',
										value: 'settings',
									},
									{
										title: 'Send (Mailing Lab Samples, Courier Tracking)',
										value: 'send',
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
							fieldset: 'visual',
						}),
						defineField({
							name: 'image',
							title: 'Step Showcase Image',
							description:
								'Optional photo or diagram illustrating this step in the process.',
							type: 'image',
							options: {
								hotspot: true,
							},
							fields: [
								defineField({
									name: 'alt',
									title: 'Alternative Text',
									description:
										'Descriptive text for accessibility and screen readers.',
									type: 'string',
								}),
							],
							fieldset: 'visual',
						}),
						defineField({
							name: 'videoUrl',
							title: 'Step Video Walkthrough (URL)',
							description:
								'Optional video link (YouTube, Vimeo, TikTok, or direct MP4/WebM) demonstrating this milestone.',
							type: 'url',
							placeholder: 'https://www.youtube.com/watch?v=... or direct MP4',
							fieldset: 'visual',
						}),
						defineField({
							name: 'videoThumbnail',
							title: 'Custom Video Poster (Optional)',
							description:
								'Custom preview image before video playback. If left empty, step showcase image or platform poster will be used.',
							type: 'image',
							options: { hotspot: true },
							fields: [
								defineField({
									name: 'alt',
									title: 'Alternative Text',
									description:
										'Descriptive text for accessibility and screen readers.',
									type: 'string',
								}),
							],
							fieldset: 'visual',
							hidden: ({ parent }) => !parent?.videoUrl,
						}),
						defineField({
							name: 'videoAutoplay',
							title: 'Ambient Looping Video Preview',
							description:
								'When enabled, plays a silent looping background preview inside the card instead of requiring click to open.',
							type: 'boolean',
							initialValue: false,
							fieldset: 'visual',
							hidden: ({ parent }) => !parent?.videoUrl,
						}),
						defineField({
							name: 'content',
							title: 'Step Body Copy & Details',
							description:
								'Detailed explanation of this milestone, deliverables, or customer action.',
							type: 'array',
							of: [{ type: 'block' }],
						}),
						defineField({
							name: 'link',
							title: 'Step Target Link',
							description:
								'Optional link destination for this milestone card.',
							type: 'link',
							fieldset: 'action',
						}),
						defineField({
							name: 'ctas',
							title: 'Step Action Buttons',
							description:
								'Optional button link at the bottom of this step.',
							type: 'array',
							of: [{ type: 'cta' }],
							fieldset: 'action',
						}),
					],
					preview: {
						select: {
							title: 'title',
							content: 'content',
							badge: 'badge',
							iconPreset: 'iconPreset',
							image: 'image',
							icon: 'icon',
							videoUrl: 'videoUrl',
						},
						prepare: ({
							title,
							content,
							badge,
							iconPreset,
							image,
							icon,
							videoUrl,
						}) => {
							const heading =
								title || getBlockText(content) || 'Process Step'
							const iconLabel =
								iconPreset && iconPreset !== 'none'
									? `Icon: ${iconPreset}`
									: null
							const videoLabel = videoUrl ? '🎬 Video' : null
							const subParts = [badge, iconLabel, videoLabel].filter(Boolean)
							return {
								title: heading,
								subtitle:
									subParts.length > 0
										? subParts.join(' · ')
										: title
											? getBlockText(content)
											: undefined,
								media: image || icon,
							}
						},
					},
				}),
			],
		}),
		defineField({
			name: 'ctas',
			title: 'Section Call-to-Action Buttons',
			description:
				'Optional conversion action buttons below or next to the process workflow (e.g., "Request Sample Kit", "Schedule Kickoff").',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
		}),

		// Tab 2: Layout & Progression
		defineField({
			name: 'layout',
			title: 'Process Layout Mode',
			description:
				'Choose the visual structure and progression flow of the process steps.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Split Timeline — Editorial sticky intro on left, connected vertical steps on right (Recommended for B2B & Storytelling)',
						value: 'split',
					},
					{
						title:
							'Horizontal Milestones — Left-to-right progressive chain with connection arrows (Ideal for 3–4 steps)',
						value: 'horizontal',
					},
					{
						title:
							'Step Cards Grid — Multi-column card matrix with step indicators (Great for high-detail workflows)',
						value: 'grid',
					},
					{
						title:
							'Centered Vertical Timeline — Single-column centered process path (Classic, focused sequence)',
						value: 'vertical',
					},
				],
				layout: 'radio',
			},
			initialValue: 'split',
			group: 'layout',
		}),
		defineField({
			name: 'columns',
			title: 'Desktop Grid Columns',
			description:
				'Number of columns when Step Cards Grid or Horizontal Milestone layout is selected.',
			type: 'number',
			options: {
				list: [
					{ title: '3 Columns — Balanced 3-Step Flow (Recommended)', value: 3 },
					{ title: '4 Columns — 4-Step Milestone Flow', value: 4 },
					{ title: '2 Columns — Detailed 2-Step Comparison / Flow', value: 2 },
				],
				layout: 'radio',
			},
			initialValue: 3,
			hidden: ({ parent }) =>
				parent?.layout === 'split' || parent?.layout === 'vertical',
			group: 'layout',
		}),
		defineField({
			name: 'mobileLayout',
			title: 'Mobile Screen Layout',
			description:
				'Control how process steps are displayed on mobile screens (smartphones).',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Vertical Timeline Stack — Connected sequential path (Recommended)',
						value: 'stack',
					},
					{
						title:
							'Horizontal Swipe Cards — Space-saving swipeable cards with step indicators',
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
				'Alignment of section eyebrow badge, main title, and introductory text.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Left — Clean editorial / B2B alignment (Default)',
						value: 'left',
					},
					{
						title: 'Center — Symmetrical showcase presentation',
						value: 'center',
					},
				],
				layout: 'radio',
			},
			initialValue: 'left',
			hidden: ({ parent }) => parent?.layout === 'split',
			group: 'layout',
		}),
		defineField({
			name: 'containerStyle',
			title: 'Section Framing & Surface',
			description:
				'Enclose the entire section within a subtle framed surface or keep open against the page background.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Open Section — Seamless against page background (Recommended)',
						value: 'plain',
					},
					{
						title:
							'Framed Box — Elevated background surface with subtle border',
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
			description: 'Control top and bottom padding of the process steps section.',
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
						title: 'Spacious (py-16 to py-28 — High-impact landing)',
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
			name: 'stepStyle',
			title: 'Step Container Style',
			description: 'Visual appearance of the step content cards.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Card — Subtle border, surface background, and soft hover lift (Recommended)',
						value: 'card',
					},
					{
						title: 'Elevated — Floating shadow with interactive hover lift',
						value: 'elevated',
					},
					{
						title:
							'Minimal — Clean borderless tonal background for clean typography',
						value: 'minimal',
					},
					{
						title:
							'Outline — Distinct accent border framing without solid card background',
						value: 'outline',
					},
				],
				layout: 'radio',
			},
			initialValue: 'card',
			group: 'design',
		}),
		defineField({
			name: 'numberStyle',
			title: 'Step Number Badge Style',
			description:
				'Visual styling for the sequential milestone number badges.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Brand Accent — Filled brand color with crisp contrast (Recommended)',
						value: 'brand',
					},
					{
						title:
							'Slate Neutral — Modern dark/neutral badge for understated elegance',
						value: 'neutral',
					},
					{
						title:
							'Outline Ring — Clean geometric ring with brand-accented text',
						value: 'outline',
					},
					{
						title:
							'Gradient Glow — Modern dynamic subtle gradient accent',
						value: 'gradient',
					},
				],
				layout: 'radio',
			},
			initialValue: 'brand',
			group: 'design',
		}),
		defineField({
			name: 'showConnector',
			title: 'Show Process Connector Line',
			description:
				'Display visual progression line connecting milestones in sequential order.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
		}),
		defineField({
			name: 'animateTimeline',
			title: 'Interactive Timeline Scroll Animation',
			description:
				'Dynamically animates progression connector lines and illuminates milestone markers as the visitor scrolls through each step.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
		}),

		// Tab 4: Settings
		defineField({
			name: 'enableSchema',
			title: 'Enable Google HowTo Schema.org',
			description:
				'Generate structured JSON-LD data for Google search rich snippets and HowTo SEO eligibility.',
			type: 'boolean',
			initialValue: true,
			group: 'settings',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'step-list',
		icon: OlistIcon,
		titleFields: ['intro', 'badge'],
		select: {
			steps: 'steps',
			layout: 'layout',
		},
		metadata: (doc) => [
			doc.steps?.length ? `${doc.steps.length} steps` : null,
			doc.layout ? `Layout: ${doc.layout}` : null,
		],
	}),
})
