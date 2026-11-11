import { defineArrayMember, defineField, defineType } from 'sanity'
import { TfiLayoutSlider } from 'react-icons/tfi'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'hero-slider',
	title: 'Hero Slider',
	description:
		'High-impact, mobile-first hero visual carousel with responsive desktop/mobile imagery, headline overlays, and conversion CTAs.',
	type: 'object',
	icon: TfiLayoutSlider,
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'design', title: 'Design' },
		{ name: 'settings', title: 'Settings' },
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),
		defineField({
			name: 'slides',
			title: 'Hero Slides',
			type: 'array',
			group: 'content',
			validation: (Rule) => Rule.min(1).error('At least one slide is required.'),
			of: [
				defineArrayMember({
					name: 'slide',
					title: 'Hero Slide',
					type: 'object',
					fields: [
						defineField({
							name: 'image',
							title: 'Desktop Banner Image',
							description: 'High-resolution landscape image (16:9 or 21:9 ratio recommended).',
							type: 'image',
							options: {
								hotspot: true,
								metadata: ['lqip'],
							},
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'mobileImage',
							title: 'Mobile Banner Image (Recommended)',
							description:
								'Portrait crop (4:5 or 1:1 ratio) specifically framed for smartphones to maximize visual impact.',
							type: 'image',
							options: {
								hotspot: true,
								metadata: ['lqip'],
							},
						}),
						defineField({
							name: 'alt',
							title: 'Alt Text (SEO & Accessibility)',
							description: 'Descriptive alt text for screen readers and search engines.',
							type: 'string',
							validation: (Rule) => Rule.required().warning('Alt text is required for ADA accessibility.'),
						}),
						defineField({
							name: 'eyebrow',
							title: 'Eyebrow Tag (Optional)',
							placeholder: 'e.g. 2026 SUSTAINABLE COLLECTION',
							type: 'string',
						}),
						defineField({
							name: 'title',
							title: 'Headline (H1 / H2)',
							placeholder: 'e.g. Next-Gen Plant-Based Packaging',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'description',
							title: 'Supporting Pitch (1-2 sentences)',
							placeholder: 'e.g. Certified 100% compostable food containers engineered for enterprise foodservice.',
							type: 'text',
							rows: 2,
						}),
						defineField({
							name: 'ctas',
							title: 'Call-to-Action Buttons',
							description: 'Up to 2 action buttons (Primary + Secondary).',
							type: 'array',
							of: [{ type: 'cta' }],
							validation: (Rule) => Rule.max(2),
						}),
						defineField({
							name: 'textPosition',
							title: 'Text Vertical Position',
							description:
								'Bottom anchor is strongly recommended for Mobile-First thumb zone ergonomics.',
							type: 'string',
							options: {
								list: [
									{ title: 'Bottom (Thumb-Friendly - Recommended)', value: 'bottom' },
									{ title: 'Center', value: 'center' },
								],
								layout: 'radio',
							},
							initialValue: 'bottom',
						}),
						defineField({
							name: 'textAlign',
							title: 'Text Alignment',
							type: 'string',
							options: {
								list: [
									{ title: 'Left Aligned (Clean / Modern)', value: 'left' },
									{ title: 'Center Aligned', value: 'center' },
								],
								layout: 'radio',
							},
							initialValue: 'left',
						}),
						defineField({
							name: 'overlay',
							title: 'Contrast Overlay Treatment',
							description:
								'Ensures WCAG 2.1 AA text contrast compliance on top of dynamic photography.',
							type: 'string',
							options: {
								list: [
									{ title: 'Bottom Dark Gradient (Recommended)', value: 'gradient' },
									{ title: 'Subtle Dark Dim (35%)', value: 'dark' },
									{ title: 'Deep Dim (55%)', value: 'deep-dark' },
									{ title: 'None (Plain image)', value: 'none' },
								],
								layout: 'radio',
							},
							initialValue: 'gradient',
						}),
					],
					preview: {
						select: {
							title: 'title',
							eyebrow: 'eyebrow',
							image: 'image',
						},
						prepare({ title, eyebrow, image }) {
							return {
								title: title || 'Untitled Slide',
								subtitle: eyebrow || 'Hero Slide',
								media: image,
							}
						},
					},
				}),
			],
		}),

		// Design group
		defineField({
			name: 'fullWidth',
			title: 'Full Bleed (Edge-to-Edge)',
			description: 'Expand banner to the full viewport width without horizontal padding.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
		}),
		defineField({
			name: 'height',
			title: 'Height Scale',
			description: 'Controls viewport height across devices.',
			type: 'string',
			options: {
				list: [
					{ title: 'Hero Dynamic Viewport (80dvh Mobile / 650px Desktop - Recommended)', value: 'dvh-80' },
					{ title: 'Full Screen (100dvh)', value: 'dvh-100' },
					{ title: 'Fixed Ratio (4:5 Mobile / 16:9 Desktop)', value: 'ratio' },
				],
				layout: 'radio',
			},
			initialValue: 'dvh-80',
			group: 'design',
		}),
		defineField({
			name: 'autoSlide',
			title: 'Enable Auto Slide',
			description: 'Rotates slides automatically. Automatically pauses on hover/focus for ADA compliance.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
		}),
		defineField({
			name: 'interval',
			title: 'Auto Slide Delay (Seconds)',
			type: 'number',
			initialValue: 6,
			validation: (Rule) => Rule.min(3).max(12),
			hidden: ({ parent }) => !parent?.autoSlide,
			group: 'design',
		}),
		defineField({
			name: 'navigation',
			title: 'Show Desktop Navigation Arrows',
			description: 'Arrows display on desktop screen hover. Mobile always uses smooth touch swipe.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
		}),
		defineField({
			name: 'pagination',
			title: 'Show Progress Indicator / Dots',
			type: 'boolean',
			initialValue: true,
			group: 'design',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'hero-slider',
		icon: TfiLayoutSlider,
		imageField: 'slides.0.image',
		titleFields: ['slides.0.title'],
		select: {
			slides: 'slides',
		},
		metadata: (doc) => [
			doc.slides?.length ? `${doc.slides.length} slides` : null,
		],
	}),
})
