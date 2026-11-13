import { defineField, defineType } from 'sanity'
import { ComponentIcon } from '@sanity/icons'

export default defineType({
	name: 'logo',
	title: 'Logo',
	type: 'document',
	icon: ComponentIcon,
	fields: [
		defineField({
			name: 'title',
			title: 'Logo Name / Identifier',
			type: 'string',
			placeholder: 'e.g. Primary Brand Wordmark',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'url',
			title: 'Website / Partner Link (Optional)',
			description: 'Target URL opened when a visitor clicks this logo (e.g. https://partner.example.com).',
			type: 'url',
		}),
		defineField({
			name: 'image',
			title: 'Logo Variants by Background Context',
			type: 'object',
			options: { collapsible: true, collapsed: false },
			fields: [
				defineField({
					name: 'default',
					title: 'Primary Logo (Universal Default)',
					description: 'Standard brand logo used across headers, footers, and brand cards.',
					type: 'image',
					options: {
						hotspot: true,
					},
					validation: (Rule) => Rule.required(),
				}),
				defineField({
					name: 'light',
					title: 'Light Variant (For Dark Surfaces)',
					description: 'Light or white monochrome version displayed over dark/charcoal backgrounds.',
					type: 'image',
					options: {
						hotspot: true,
					},
				}),
				defineField({
					name: 'dark',
					title: 'Dark Variant (For Light Surfaces)',
					description: 'Dark or black monochrome version displayed over clean/white backgrounds.',
					type: 'image',
					options: {
						hotspot: true,
					},
				}),
			],
		}),
	],
	preview: {
		select: {
			title: 'title',
			media: 'image.default',
		},
		prepare({ title, media }) {
			return {
				title: title || 'Untitled Logo',
				subtitle: 'Brand Logo Graphic',
				media,
			}
		},
	},
})
