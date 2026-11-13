import { defineField, defineType } from 'sanity'
import { IoMdPhotos } from 'react-icons/io'
import { FiImage } from 'react-icons/fi'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'carousel-banner-list',
	title: 'Media Slider',
	description: 'Clean visual image and lookbook carousel with responsive images, links, and smooth touch swipe.',
	type: 'object',
	icon: IoMdPhotos,
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'design', title: 'Design' },
		{ name: 'settings', title: 'Settings' },
	],
	fieldsets: [
		{
			name: 'colors',
			title: 'Background & Color Contrast',
			options: { columns: 2 },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),
		defineField({
			name: 'intro',
			title: 'Section Header & Intro',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'items',
			title: 'Slider Slides',
			type: 'array',
			group: 'content',
			of: [
				{
					type: 'image',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					fieldsets: [
						{
							name: 'linkType',
							title: 'Link Destination',
							options: { columns: 1 },
						},
					],
					fields: [
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
						}),
						defineField({
							name: 'linkBannerType',
							title: 'Link Type',
							type: 'string',
							options: {
								layout: 'radio',
								list: ['internal', 'external'],
							},
							fieldset: 'linkType',
						}),
						defineField({
							name: 'internal',
							title: 'Internal Target',
							type: 'reference',
							to: [
								{ type: 'page' },
								{ type: 'blog.post' },
								{ type: 'product' },
							],
							hidden: ({ parent }) => parent?.linkBannerType !== 'internal',
							fieldset: 'linkType',
						}),
						defineField({
							name: 'external',
							title: 'External Target URL',
							placeholder: 'https://example.com',
							type: 'url',
							hidden: ({ parent }) => parent?.linkBannerType !== 'external',
							fieldset: 'linkType',
						}),
						defineField({
							name: 'loading',
							title: 'Image Loading Strategy',
							type: 'string',
							options: {
								list: ['lazy', 'eager'],
								layout: 'radio',
							},
							initialValue: 'lazy',
						}),
					],
					preview: {
						select: {
							alt: 'alt',
							media: 'asset',
						},
						prepare({ alt, media }) {
							return {
								title: alt || 'Slide Banner',
								media: media || FiImage,
							}
						},
					},
				},
			],
		}),

		// Tab 2: Design
		defineField({
			name: 'desktop',
			title: 'Desktop Layout',
			type: 'object',
			group: 'design',
			fields: [
				defineField({
					name: 'bannersPerRow',
					title: 'Banners Visible Per View',
					type: 'number',
					initialValue: 1,
					validation: (Rule) => Rule.min(1).max(4),
					options: {
						list: [
							{ title: '1 banner (Full Width)', value: 1 },
							{ title: '2 banners', value: 2 },
							{ title: '3 banners', value: 3 },
							{ title: '4 banners', value: 4 },
						],
						layout: 'radio',
					},
				}),
			],
		}),
		defineField({
			name: 'mobile',
			title: 'Mobile Layout',
			type: 'object',
			group: 'design',
			fields: [
				defineField({
					name: 'bannersPerRow',
					title: 'Banners Visible on Mobile',
					type: 'number',
					initialValue: 1,
					validation: (Rule) => Rule.min(1).max(2),
					options: {
						list: [
							{ title: '1 banner (Clean Mobile-First)', value: 1 },
							{ title: '2 banners', value: 2 },
						],
						layout: 'radio',
					},
				}),
			],
		}),
		defineField({
			name: 'options',
			title: 'Display & Navigation Options',
			type: 'object',
			group: 'design',
			fields: [
				defineField({
					name: 'width',
					title: 'Full Bleed (Edge to Edge)',
					type: 'boolean',
					initialValue: false,
				}),
				defineField({
					name: 'borderRadius',
					title: 'Rounded Corners',
					type: 'boolean',
					initialValue: true,
				}),
				defineField({
					name: 'navigation',
					title: 'Show Navigation Arrows',
					type: 'boolean',
					initialValue: true,
				}),
				defineField({
					name: 'pagination',
					title: 'Show Pagination Dots',
					type: 'boolean',
					initialValue: true,
				}),
				defineField({
					name: 'autoSlide',
					title: 'Enable Auto Slide',
					type: 'boolean',
					initialValue: false,
				}),
			],
		}),
		defineField({
			name: 'backgroundColor',
			title: 'Background Color (Optional)',
			type: 'string',
			fieldset: 'colors',
			group: 'design',
		}),
		defineField({
			name: 'textColor',
			title: 'Text Color (Optional)',
			type: 'string',
			fieldset: 'colors',
			group: 'design',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'carousel-banner-list',
		icon: IoMdPhotos,
		imageField: 'items.0.image',
		titleFields: ['items.0.title', 'title'],
		select: {
			items: 'items',
		},
		metadata: (doc) => [
			doc.items?.length ? `${doc.items.length} slides` : null,
		],
	}),
})
