import { defineArrayMember, defineField, defineType } from 'sanity'
import { FiImage } from 'react-icons/fi'
import { IoMdPhotos } from 'react-icons/io'

export default defineType({
	name: 'carousel-banner-list',
	title: 'Carousel Banner List',
	type: 'object',
	icon: IoMdPhotos,
	groups: [
		{ name: 'content' },
		{ name: 'image', default: true },
		{ name: 'layout' },
		{ name: 'options' },
	],
	fieldsets: [
		{
			name: 'backgroundColor',
			title: 'Background & Color',
			options: { columns: 2 },
		},
	],
	fields: [
		defineField({
			name: 'intro',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'backgroundColor',
			title: 'Background Color',
			type: 'string',
			description: 'Hex code (e.g. #FFFFFF)',
			initialValue: '#FFFFFF',
			fieldset: 'backgroundColor',
			group: 'content',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
					name: 'hex', // Error message code
					invert: false, // Pattern must match
				}).error('Must be a valid hex color code'),
		}),
		defineField({
			name: 'textColor',
			title: 'Text Color',
			type: 'string',
			description: 'Hex code (e.g. #000000)',
			initialValue: '#000000',
			fieldset: 'backgroundColor',
			group: 'content',
		}),
		defineField({
			name: 'items',
			title: 'Carousel Images',
			type: 'array',
			group: 'image',
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
							title: 'Link type',
							options: { columns: 2 },
						},
					],
					fields: [
						defineField({
							name: 'mobileImage',
							title: 'Mobile image (Optional)',
							type: 'image',
							options: {
								hotspot: true,
								metadata: ['lqip'],
							},
						}),
						defineField({
							name: 'alt',
							type: 'string',
						}),
						defineField({
							name: 'linkBannerType',
							type: 'string',
							options: {
								layout: 'radio',
								list: ['internal', 'external'],
							},
							fieldset: 'linkType',
						}),
						defineField({
							name: 'internal',
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
							placeholder: 'https://example.com',
							type: 'url',
							validation: (Rule) =>
								Rule.uri({
									scheme: ['http', 'https', 'mailto', 'tel'],
									allowRelative: true,
								}),
							hidden: ({ parent }) => parent?.linkBannerType !== 'external',
							fieldset: 'linkType',
						}),
						defineField({
							name: 'loading',
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
							hasMobile: 'mobileImage.asset',
						},
						prepare({ alt, hasMobile }) {
							return {
								title: alt || 'No alt text',
								media: hasMobile ? FiImage : FiImage,
							}
						},
					},
				},
			],
		}),
		defineField({
			name: 'desktop',
			title: 'Desktop layout',
			type: 'object',
			group: 'layout',
			fieldsets: [
				{
					name: 'desktopLayout',
					title: 'Desktop',
					options: { columns: 2 },
				},
			],
			fields: [
				defineField({
					name: 'bannersPerRow',
					title: 'Banners per row',
					description: 'Số banner hiển thị trên 1 dòng (desktop)',
					type: 'number',
					initialValue: 1,
					validation: (Rule) => Rule.min(1).max(12),
					options: {
						list: [
							{ title: '1 banner', value: 1 },
							{ title: '2 banners', value: 2 },
							{ title: '3 banners', value: 3 },
							{ title: '4 banners', value: 4 },
							{ title: '5 banners', value: 5 },
							{ title: '6 banners', value: 6 },
						],
						layout: 'radio',
					},
					fieldset: 'desktopLayout',
				}),

				defineField({
					name: 'rows',
					title: 'Rows',
					description: 'Số hàng hiển thị (desktop)',
					type: 'number',
					initialValue: 1,
					validation: (Rule) => Rule.min(1).max(3),
					options: {
						list: [
							{ title: '1 row', value: 1 },
							{ title: '2 rows', value: 2 },
							{ title: '3 rows', value: 3 },
						],
						layout: 'radio',
					},
					fieldset: 'desktopLayout',
				}),
			],
		}),
		defineField({
			name: 'mobile',
			title: 'Mobile layout',
			type: 'object',
			group: 'layout',
			fieldsets: [
				{
					name: 'mobileLayout',
					title: 'Mobile',
					options: { columns: 2 },
				},
			],
			fields: [
				defineField({
					name: 'bannersPerRow',
					title: 'Banners per row',
					description: 'Số banner hiển thị trên 1 dòng (mobile)',
					type: 'number',
					initialValue: 1,
					validation: (Rule) => Rule.min(1).max(5),
					options: {
						list: [
							{ title: '1 banner', value: 1 },
							{ title: '2 banners', value: 2 },
							{ title: '3 banners', value: 3 },
							{ title: '4 banners', value: 4 },
							{ title: '5 banners', value: 5 },
						],
						layout: 'radio',
					},
					fieldset: 'mobileLayout',
				}),

				defineField({
					name: 'rows',
					title: 'Rows',
					description: 'Số hàng hiển thị (mobile)',
					type: 'number',
					initialValue: 1,
					validation: (Rule) => Rule.min(1).max(2),
					options: {
						list: [
							{ title: '1 row', value: 1 },
							{ title: '2 rows', value: 2 },
						],
						layout: 'radio',
					},
					fieldset: 'mobileLayout',
				}),
			],
		}),
		defineField({
			name: 'options',
			title: 'Options',
			type: 'object',
			group: 'options',
			fields: [
				defineField({
					name: 'width',
					title: 'Enable custom full width',
					type: 'boolean',
					initialValue: false,
				}),
				defineField({
					name: 'borderRadius',
					title: 'Enable border radius',
					type: 'boolean',
					initialValue: false,
				}),
				defineField({
					name: 'navigation',
					title: 'Show navigation arrows',
					type: 'boolean',
					initialValue: true,
				}),

				defineField({
					name: 'pagination',
					title: 'Show pagination dots',
					type: 'boolean',
					initialValue: true,
				}),

				defineField({
					name: 'autoSlide',
					title: 'Enable auto slide',
					type: 'boolean',
					initialValue: false,
				}),
			],
		}),
	],
	preview: {
		select: {
			items: 'items',
		},
		prepare({ items }) {
			const count = items?.length || 0

			return {
				title: 'Carousel Banner List',
				subtitle: `${count} banner${count !== 1 ? 's' : ''}`,
				media: IoMdPhotos,
			}
		},
	},
})
