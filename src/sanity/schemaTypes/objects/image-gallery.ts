import { defineArrayMember, defineField, defineType } from 'sanity'
import { ImagesIcon } from '@sanity/icons'

export default defineType({
	name: 'image-gallery',
	title: 'Image Gallery & Showcase',
	type: 'object',
	icon: ImagesIcon,
	fields: [
		defineField({
			name: 'title',
			title: 'Gallery Title (Optional)',
			type: 'string',
		}),
		defineField({
			name: 'layout',
			title: 'Gallery Layout Style',
			type: 'string',
			options: {
				list: [
					{ title: '2-Column Grid', value: 'grid-2' },
					{ title: '3-Column Grid', value: 'grid-3' },
					{ title: 'Carousel Slider', value: 'slider' },
				],
				layout: 'radio',
			},
			initialValue: 'grid-2',
		}),
		defineField({
			name: 'images',
			title: 'Gallery Images',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'image',
					description:
						'Gallery photo. Recommended size: 1200 × 800 px (3:2 ratio) or 1200 × 675 px (16:9 ratio, max 250 KB, WebP/JPG).',
					options: { hotspot: true, metadata: ['lqip'] },
					fields: [
						defineField({
							name: 'alt',
							title: 'Alt Text (SEO & Accessibility)',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'caption',
							title: 'Caption (Optional)',
							type: 'string',
						}),
					],
				}),
			],
			validation: (Rule) => Rule.min(2).required(),
		}),
	],
	preview: {
		select: {
			title: 'title',
			images: 'images',
			layout: 'layout',
		},
		prepare: ({ title, images, layout }) => ({
			title: title || 'Image Gallery',
			subtitle: `${images?.length || 0} images (${layout || 'grid-2'})`,
			media: images?.[0],
		}),
	},
})
