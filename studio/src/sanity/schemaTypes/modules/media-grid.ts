import { defineArrayMember, defineField, defineType } from 'sanity'
import { TfiLayoutGrid2Thumb } from 'react-icons/tfi'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'media-grid',
	title: 'Media Grid',
	description:
		'High-performance visual promo and category grid with zero-JS mobile card-peeking scroll-snap.',
	type: 'object',
	icon: TfiLayoutGrid2Thumb,
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
			name: 'intro',
			title: 'Section Header & Pitch',
			description: 'Optional headline and supporting intro copy above the grid.',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'items',
			title: 'Grid Banners / Cards',
			type: 'array',
			group: 'content',
			validation: (Rule) => Rule.min(1).error('At least one grid item is required.'),
			of: [
				defineArrayMember({
					name: 'item',
					title: 'Grid Card',
					type: 'object',
					fields: [
						defineField({
							name: 'image',
							title: 'Visual Image',
							type: 'image',
							options: {
								hotspot: true,
								metadata: ['lqip'],
							},
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'mobileImage',
							title: 'Mobile Image Override (Optional)',
							type: 'image',
							options: {
								hotspot: true,
								metadata: ['lqip'],
							},
						}),
						defineField({
							name: 'alt',
							title: 'Alt Text (SEO & Accessibility)',
							type: 'string',
							validation: (Rule) => Rule.required().warning('Alt text is required for accessibility.'),
						}),
						defineField({
							name: 'badge',
							title: 'Badge Tag (Optional)',
							placeholder: 'e.g. NEW, 20% OFF, BESTSELLER',
							type: 'string',
						}),
						defineField({
							name: 'title',
							title: 'Card Title',
							placeholder: 'e.g. Compostable Takeout Bowls',
							type: 'string',
						}),
						defineField({
							name: 'subtitle',
							title: 'Subtitle / Description (Optional)',
							placeholder: 'e.g. Certified ASTM D6400 home compostable',
							type: 'string',
						}),
						defineField({
							name: 'link',
							title: 'Card Destination Link',
							type: 'link',
						}),
						defineField({
							name: 'aspectRatio',
							title: 'Card Aspect Ratio',
							type: 'string',
							options: {
								list: [
									{ title: 'Portrait (3:4 - Great for Products / Fashion)', value: 'portrait' },
									{ title: 'Square (1:1 - Standard Grid)', value: 'square' },
									{ title: 'Landscape (16:9 - Wide Banner)', value: 'landscape' },
									{ title: 'Auto / Natural', value: 'auto' },
								],
								layout: 'radio',
							},
							initialValue: 'portrait',
						}),
						defineField({
							name: 'cardStyle',
							title: 'Card Style',
							type: 'string',
							options: {
								list: [
									{ title: 'Overlay (Text over Dark Gradient)', value: 'overlay' },
									{ title: 'Below (Clean Text Below Image)', value: 'below' },
									{ title: 'Pure Visual (Image Only, Clickable)', value: 'visual-only' },
								],
								layout: 'radio',
							},
							initialValue: 'overlay',
						}),
					],
					preview: {
						select: {
							title: 'title',
							badge: 'badge',
							image: 'image',
							alt: 'alt',
						},
						prepare({ title, badge, image, alt }) {
							return {
								title: title || alt || 'Grid Banner',
								subtitle: badge ? `Badge: ${badge}` : 'Media Item',
								media: image,
							}
						},
					},
				}),
			],
		}),

		// Design group
		defineField({
			name: 'layout',
			title: 'Desktop Grid Layout',
			type: 'string',
			options: {
				list: [
					{ title: '2 Columns (50 / 50 Split)', value: '2-cols' },
					{ title: '3 Columns (33 / 33 / 33 Grid)', value: '3-cols' },
					{ title: '4 Columns (25 / 25 / 25 / 25 Grid)', value: '4-cols' },
					{ title: 'Bento Grid (1 Large Left + 2 Small Right)', value: 'bento-1-2' },
					{ title: 'Bento Grid (2 Small Left + 1 Large Right)', value: 'bento-2-1' },
				],
				layout: 'radio',
			},
			initialValue: '3-cols',
			group: 'design',
		}),
		defineField({
			name: 'mobileLayout',
			title: 'Mobile Layout Mode',
			description:
				'Card-peeking scroll-snap is 100% pure CSS, ultra-fast and native-feeling on iOS and Android.',
			type: 'string',
			options: {
				list: [
					{ title: 'Card-Peeking Scroll Snap (Recommended - Mobile First)', value: 'peek-scroll' },
					{ title: '2-Column Mobile Grid', value: 'grid-2' },
					{ title: '1-Column Full Width Stack', value: 'stacked' },
				],
				layout: 'radio',
			},
			initialValue: 'peek-scroll',
			group: 'design',
		}),
		defineField({
			name: 'gap',
			title: 'Grid Spacing (Gap)',
			type: 'string',
			options: {
				list: [
					{ title: 'Compact (12px)', value: 'sm' },
					{ title: 'Comfortable (20px)', value: 'md' },
					{ title: 'Spacious (32px)', value: 'lg' },
				],
				layout: 'radio',
			},
			initialValue: 'md',
			group: 'design',
		}),
		defineField({
			name: 'fullWidth',
			title: 'Full Bleed (Edge to Edge)',
			type: 'boolean',
			initialValue: false,
			group: 'design',
		}),
		defineField({
			name: 'borderRadius',
			title: 'Rounded Corners',
			type: 'boolean',
			initialValue: true,
			group: 'design',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'media-grid',
		icon: TfiLayoutGrid2Thumb,
		imageField: 'items.0.image',
		titleFields: ['intro'],
		select: {
			items: 'items',
		},
		metadata: (doc) => [
			doc.items?.length ? `${doc.items.length} items` : null,
		],
	}),
})
