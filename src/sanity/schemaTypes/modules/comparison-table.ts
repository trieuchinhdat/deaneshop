import { defineArrayMember, defineField, defineType } from 'sanity'
import { SplitVerticalIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'comparison-table',
	title: 'Us vs. Them Comparison',
	description:
		'Head-to-head comparison matrix highlighting brand differentiators against competitors.',
	type: 'object',
	icon: SplitVerticalIcon,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: 'Competitive Advantage & ESG Impact',
			title: 'DeanFlow vs. Conventional Solutions',
			caption:
				'Engineered for high-performance conversion, seamless integration, and measurable business ROI.',
			headerAlignment: 'center',
			headers: [
				'Key Performance Criteria',
				'DeanFlow Platform',
				'Conventional Alternative',
			],
			highlightedColumnIndex: 1,
			highlightBadge: 'Recommended',
			tableStyle: 'card',
			mobileLayout: 'sticky-column',
			rowDensity: 'comfortable',
			ctaText: 'Request Technical Sample Kit',
			ctaLink: '#lead-form',
			ctaStyle: 'primary',
			ctaSubtext:
				'Complimentary technical sample kit • Expedited dispatch within 24 hours',
			footnote:
				'Performance metrics verified across 10,000+ benchmarked manufacturing cycles. Full technical dossier available upon request.',
			rows: [
				{
					_key: genKey(),
					cells: [
						'100% Home Compostable',
						'✅ Yes (<90 days)',
						'❌ No (>450 years)',
					],
				},
				{
					_key: genKey(),
					cells: [
						'FDA Food-Contact Safe',
						'✅ 21 CFR 176.170 Certified',
						'⚠️ Chemical migration risk',
					],
				},
				{
					_key: genKey(),
					cells: [
						'Hot & Cold Resilient',
						'✅ -20°C to 120°C (Microwave safe)',
						'❌ Warps & leaches microplastics',
					],
				},
				{
					_key: genKey(),
					cells: [
						'Carbon Footprint',
						'✅ 72% Lower emissions (Biomass)',
						'❌ High fossil fuel consumption',
					],
				},
				{
					_key: genKey(),
					cells: [
						'Custom Branding & Embossing',
						'✅ Low MOQ tool customization',
						'⚠️ Expensive mold tooling',
					],
				},
			],
		}
	},
	groups: [
		{ name: 'content', title: 'Content & Matrix', default: true },
		{ name: 'design', title: 'Appearance & Layout' },
		{ name: 'cta', title: 'Call to Action' },
		{ name: 'settings', title: 'Settings' },
	],
	fieldsets: [
		{
			name: 'headerGroup',
			title: 'Section Header & Positioning',
			options: { columns: 1 },
		},
		{
			name: 'comparisonMatrix',
			title: 'Comparison Data Matrix',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'visualHighlight',
			title: 'Brand Column Highlighting',
			options: { columns: 1 },
		},
		{
			name: 'layoutOptions',
			title: 'Layout & Responsiveness',
			options: { columns: 1 },
		},
		{
			name: 'ctaConfig',
			title: 'Call to Action (CTA)',
			options: { columns: 1 },
		},
		{
			name: 'trustSignals',
			title: 'Verification & Disclaimers',
			options: { columns: 1 },
		},
	],
	fields: [
		// -------------------------------------------------------------
		// TAB: SETTINGS
		// -------------------------------------------------------------
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// -------------------------------------------------------------
		// TAB: CONTENT
		// -------------------------------------------------------------
		defineField({
			name: 'badge',
			title: 'Header Eyebrow / Badge',
			description:
				'Small uppercase pill badge displayed above the headline (e.g. "Competitive Advantage & ESG Impact").',
			type: 'string',
			group: 'content',
			fieldset: 'headerGroup',
		}),
		defineField({
			name: 'title',
			title: 'Table Headline',
			description:
				'Primary section title comparing your solution against traditional alternatives.',
			type: 'string',
			validation: (Rule) =>
				Rule.required().min(2).error('Please enter a headline for the comparison table.'),
			group: 'content',
			fieldset: 'headerGroup',
		}),
		defineField({
			name: 'caption',
			title: 'Table Subtitle / Proposition',
			description:
				'Supporting description clarifying key business ROI, compliance, or competitive strengths.',
			type: 'string',
			group: 'content',
		}),
		defineField({
			name: 'headers',
			title: 'Column Headers',
			description:
				'Titles for each column in order from left to right. First column is typically the feature/criterion (e.g., "Feature", "Our Brand", "Competitor").',
			type: 'array',
			of: [{ type: 'string' }],
			validation: (Rule) =>
				Rule.min(2).error('At least 2 columns are required for a comparison table.').required(),
			group: 'content',
			fieldset: 'comparisonMatrix',
		}),
		defineField({
			name: 'rows',
			title: 'Comparison Rows',
			description:
				'List of criteria to compare. Each row contains cell values matching the column headers above.',
			type: 'array',
			group: 'content',
			fieldset: 'comparisonMatrix',
			of: [
				defineArrayMember({
					type: 'object',
					name: 'tableRow',
					title: 'Row',
					fields: [
						defineField({
							name: 'cells',
							title: 'Cells',
							description:
								'Values in order of column headers. Pro tip: Start with ✅ for positive, ❌ for negative, or ⚠️ for warnings, or just type text/values.',
							type: 'array',
							of: [{ type: 'string' }],
						}),
					],
					preview: {
						select: {
							cells: 'cells',
						},
						prepare: ({ cells }) => ({
							title: cells?.[0] || 'Untitled Criterion',
							subtitle:
								cells && cells.length > 1
									? cells.slice(1).join('  vs  ')
									: 'No comparative values entered',
						}),
					},
				}),
			],
		}),
		defineField({
			name: 'footnote',
			title: 'Verification Footnote / Legal Disclaimer',
			description:
				'Optional verification note or compliance disclaimer displayed beneath the table (e.g. "Third-party audit reports available upon request.").',
			type: 'text',
			rows: 2,
			group: 'content',
			fieldset: 'trustSignals',
		}),

		// -------------------------------------------------------------
		// TAB: DESIGN & LAYOUT
		// -------------------------------------------------------------
		defineField({
			name: 'headerAlignment',
			title: 'Header Alignment',
			description: 'Positioning of badge, headline, and subtitle.',
			type: 'string',
			options: {
				list: [
					{ title: 'Center Aligned', value: 'center' },
					{ title: 'Left Aligned', value: 'left' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'design',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'highlightedColumnIndex',
			title: 'Highlighted Column',
			description:
				'Select which column to visually emphasize as your brand hero. In a 3-column table [Criteria, Our Brand, Competitor], Column 2 is standard.',
			type: 'number',
			options: {
				list: [
					{ title: 'None (No column highlighted)', value: -1 },
					{
						title: 'Column 2 (Our Brand / Solution) — Recommended',
						value: 1,
					},
					{ title: 'Column 1 (First Column / Criteria)', value: 0 },
					{ title: 'Column 3 (Third Column / Competitor)', value: 2 },
					{ title: 'Column 4 (Fourth Column)', value: 3 },
					{ title: 'Column 5 (Fifth Column)', value: 4 },
				],
			},
			initialValue: 1,
			group: 'design',
			fieldset: 'visualHighlight',
		}),
		defineField({
			name: 'highlightBadge',
			title: 'Highlighted Column Pill Badge',
			description:
				'Badge shown atop the highlighted column header (e.g., "Our Choice", "Winner", "Best Value", or "ECO Choice").',
			type: 'string',
			placeholder: 'Recommended',
			initialValue: 'Recommended',
			group: 'design',
			fieldset: 'visualHighlight',
		}),
		defineField({
			name: 'tableStyle',
			title: 'Table Container Style',
			description: 'Visual presentation style of the table container.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Elevated Card (Modern Soft Shadow & Contained Surface)',
						value: 'card',
					},
					{
						title: 'Clean Bordered (Crisp High-Contrast Border)',
						value: 'bordered',
					},
					{
						title: 'Minimalist (Dividers Only, Flush Minimal)',
						value: 'minimal',
					},
				],
			},
			initialValue: 'card',
			group: 'design',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'mobileLayout',
			title: 'Mobile Viewport Mode (<768px)',
			description:
				'How comparison data renders on small mobile screens.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Sticky Feature Column (Left column frozen while scrolling) — Recommended',
						value: 'sticky-column',
					},
					{
						title: 'Stacked Feature Cards (Each criterion as a card with comparison tags)',
						value: 'cards',
					},
					{
						title: 'Full Table Scroll (Standard horizontal scroll with swipe indicator)',
						value: 'scroll',
					},
				],
			},
			initialValue: 'sticky-column',
			group: 'design',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'rowDensity',
			title: 'Row Padding & Density',
			description: 'Vertical spacing between comparison rows.',
			type: 'string',
			options: {
				list: [
					{ title: 'Compact (Space-efficient, higher density)', value: 'compact' },
					{ title: 'Comfortable (Standard balanced spacing)', value: 'comfortable' },
					{ title: 'Spacious (Roomy enterprise aesthetic)', value: 'spacious' },
				],
				layout: 'radio',
			},
			initialValue: 'comfortable',
			group: 'design',
			fieldset: 'layoutOptions',
		}),

		// -------------------------------------------------------------
		// TAB: CALL TO ACTION
		// -------------------------------------------------------------
		defineField({
			name: 'ctaText',
			title: 'CTA Button Text',
			description:
				'Call-to-action button text (e.g. "Request Comparative Sample Kit" or "Claim Launch Deal"). Leave empty to hide the button.',
			type: 'string',
			group: 'cta',
			fieldset: 'ctaConfig',
		}),
		defineField({
			name: 'ctaLink',
			title: 'CTA Link Destination',
			description: 'URL or section anchor (e.g., "#lead-form", "/contact", or "/products").',
			type: 'string',
			group: 'cta',
			fieldset: 'ctaConfig',
		}),
		defineField({
			name: 'ctaStyle',
			title: 'CTA Button Visual Style',
			type: 'string',
			options: {
				list: [
					{ title: 'Primary Brand Action (Filled High-Contrast)', value: 'primary' },
					{ title: 'Secondary / Subdued Action', value: 'secondary' },
					{ title: 'Outlined Button', value: 'outline' },
				],
				layout: 'radio',
			},
			initialValue: 'primary',
			group: 'cta',
			fieldset: 'ctaConfig',
		}),
		defineField({
			name: 'ctaSubtext',
			title: 'CTA Trust Microcopy',
			description:
				'Reassuring trust copy displayed beneath the button (e.g., "Free sample kit • No commitment required").',
			type: 'string',
			placeholder: 'Complimentary sample kit • Dispatched within 24 hours',
			group: 'cta',
			fieldset: 'ctaConfig',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'comparison-table',
		icon: SplitVerticalIcon,
		titleFields: ['title', 'badge'],
		select: {
			headers: 'headers',
			rows: 'rows',
		},
		metadata: (doc) => [
			doc.headers?.length ? `${doc.headers.length} columns` : null,
			doc.rows?.length ? `${doc.rows.length} criteria` : null,
		],
	}),
})
