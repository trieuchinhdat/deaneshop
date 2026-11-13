import { defineField, defineType } from 'sanity'
import { LaunchIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'cta-banner',
	title: 'Call-to-Action (CTA Banner)',
	type: 'object',
	icon: LaunchIcon,
	fields: [
		defineField({
			name: 'badge',
			title: 'Banner Badge (Optional)',
			type: 'string',
			placeholder: 'Limited Time Offer / Special Guide',
		}),
		defineField({
			name: 'title',
			title: 'Banner Headline',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'description',
			title: 'Banner Description / Subtext',
			type: 'text',
			rows: 2,
		}),
		defineField({
			name: 'buttonText',
			title: 'Button Label',
			type: 'string',
			initialValue: 'Shop Now',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'buttonLink',
			title: 'Button Destination Link',
			type: 'link',
		}),
		defineField({
			name: 'style',
			title: 'Color Theme / Background',
			type: 'string',
			options: {
				list: [
					{ title: 'Dark Premium (Onyx)', value: 'dark' },
					{ title: 'Light Minimal (Soft Gray)', value: 'light' },
					{ title: 'Brand Accent (Primary Gradient)', value: 'accent' },
				],
				layout: 'radio',
			},
			initialValue: 'dark',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'cta-banner',
		icon: LaunchIcon,
		titleFields: ['title', 'badge'],
		select: {
			btnText: 'buttonText',
			style: 'style',
		},
		metadata: (doc) => [
			doc.btnText ? `CTA: "${doc.btnText}"` : null,
			doc.style ? `Style: ${doc.style}` : null,
		],
	}),
})
