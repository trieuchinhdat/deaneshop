import { defineField, defineType } from 'sanity'
import { LaunchIcon } from '@sanity/icons'

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
	preview: {
		select: {
			title: 'title',
			subtitle: 'buttonText',
			badge: 'badge',
		},
		prepare: ({ title, subtitle, badge }) => ({
			title: badge ? `[${badge}] ${title}` : title || 'CTA Banner',
			subtitle: `Button: "${subtitle || 'Click here'}"`,
		}),
	},
})
