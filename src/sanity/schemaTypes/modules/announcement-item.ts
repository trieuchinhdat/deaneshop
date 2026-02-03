import { defineField, defineType } from 'sanity'
import { FaRegImage } from 'react-icons/fa'
import { TfiAnnouncement } from 'react-icons/tfi'

export default defineType({
	name: 'announcement-item',
	title: 'Announcement Item',
	type: 'document',
	icon: TfiAnnouncement,
	// Dùng fieldsets để nhóm logic link lại cho gọn (giống banner list cũ)
	fieldsets: [
		{
			name: 'linkType',
			title: 'Link configuration',
			options: { columns: 2 },
		},
	],
	fields: [
		// 1. CÔNG TẮC BẬT/TẮT
		defineField({
			name: 'enabled',
			title: 'Enable Top Banner',
			type: 'boolean',
			initialValue: true,
		}),

		// 2. CHỌN GIAO DIỆN (TEXT hay ẢNH)
		defineField({
			name: 'variant',
			title: 'Display Variant',
			type: 'string',
			options: {
				list: [
					{ title: 'Text', value: 'text' },
					{ title: 'Image Banner', value: 'image' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'text',
		}),

		// --- OPTION A: TEXT MODE ---
		defineField({
			name: 'content',
			title: 'Content',
			type: 'string',
			hidden: ({ parent }) => parent?.variant !== 'text',
		}),
		defineField({
			name: 'backgroundColor',
			title: 'Background Color',
			type: 'string',
			description: 'Hex code (e.g. #000000)',
			initialValue: '#000000',
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
			description: 'Hex code (e.g. #FFFFFF)',
			initialValue: '#FFFFFF',
			hidden: ({ parent }) => parent?.variant !== 'text',
		}),

		// --- OPTION B: IMAGE MODE ---
		defineField({
			name: 'image',
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
					name: 'loading',
					type: 'string',
					options: {
						list: ['lazy', 'eager'],
						layout: 'radio',
					},
					initialValue: 'lazy',
				}),
			],
			hidden: ({ parent }) => parent?.variant !== 'image',
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
			to: [{ type: 'page' }, { type: 'blog.post' }, { type: 'product' }],
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
	],
	preview: {
		select: {
			variant: 'variant',
			content: 'content',
			media: 'image',
			enabled: 'enabled',
		},
		prepare({ variant, content, enabled }) {
			const isText = variant === 'text'
			return {
				title: isText ? content : 'Image Banner',
				subtitle: `Top Banner (${enabled ? 'On' : 'Off'}) - ${variant}`,
				media: isText ? TfiAnnouncement : FaRegImage,
			}
		},
	},
})
