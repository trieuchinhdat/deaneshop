import { defineArrayMember, defineField, defineType } from 'sanity'
import { BlockContentIcon, ImageIcon } from '@sanity/icons'
import { getBlockText } from '@/lib/utils'

export default defineType({
	name: 'prose',
	title: 'Prose',
	type: 'object',
	icon: BlockContentIcon,
	groups: [{ name: 'content', default: true }, { name: 'options' }],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'options',
		}),
		defineField({
			name: 'content',
			type: 'array',
			of: [
				{ type: 'block' },
				defineArrayMember({
					type: 'image',
					icon: ImageIcon,
					description:
						'Prose inline photo. Recommended size: 1200 × 675 px (16:9 ratio, max 250 KB, WebP/JPG).',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					fields: [
						defineField({
							name: 'alt',
							title: 'Alt Text (SEO & Accessibility)',
							description: 'Concise description of the image for screen readers & Google Images SEO.',
							type: 'string',
						}),
						defineField({
							name: 'figcaption',
							title: 'Caption',
							description: 'Optional caption displayed beneath the image.',
							type: 'array',
							of: [
								{
									type: 'block',
									styles: [{ title: 'Normal', value: 'normal' }],
								},
							],
						}),
					],
				}),
				defineArrayMember({
					type: 'code',
					title: 'Code block',
					options: { withFilename: true },
				}),
				{ type: 'callout-box' },
				{ type: 'product-embed' },
				{ type: 'comparison-table' },
				{ type: 'video-embed' },
				{ type: 'faq-accordion' },
				{ type: 'image-gallery' },
				{ type: 'cta-banner' },
				{ type: 'custom-html' },
				{ type: 'affiliateLink' },
			],
			group: 'content',
		}),
		defineField({
			name: 'tableOfContents',
			title: 'Table of contents (position)',
			type: 'string',
			options: {
				list: ['left', 'right'],
			},
			group: 'options',
		}),
	],
	preview: {
		select: {
			content: 'content',
		},
		prepare: ({ content }) => ({
			title: getBlockText(content),
			subtitle: 'Prose',
		}),
	},
})
