import { defineField, defineType } from 'sanity'
import { FaRegImage } from 'react-icons/fa'
import { TfiAnnouncement } from 'react-icons/tfi'

export default defineType({
	name: 'announcement-item',
	title: 'Announcement Item',
	type: 'document',
	icon: TfiAnnouncement,
	fieldsets: [
		{
			name: 'badgeGroup',
			title: '🏷️ Tag / Badge (Optional)',
			options: { columns: 2 },
		},
		{
			name: 'colorGroup',
			title: '🎨 Color Customization',
			options: { columns: 2 },
		},
		{
			name: 'linkGroup',
			title: '🔗 Link Configuration',
			options: { columns: 2 },
		},
	],
	fields: [
		// 1. CÔNG TẮC BẬT/TẮT
		defineField({
			name: 'enabled',
			title: 'Enable This Announcement',
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
					{ title: '📝 Text Message with Options', value: 'text' },
					{ title: '🖼️ Image Graphic Banner', value: 'image' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'text',
		}),

		// --- OPTION A: TEXT MODE ---
		// A1. Badge
		defineField({
			name: 'badgeText',
			title: 'Badge Text',
			description: 'E.g: FLASH SALE, HOT, FREESHIP, LIMITED',
			type: 'string',
			fieldset: 'badgeGroup',
			hidden: ({ parent }) => parent?.variant !== 'text',
		}),
		defineField({
			name: 'badgeBgColor',
			title: 'Badge Background Color',
			description: 'Hex code (Leave empty for default theme accent)',
			type: 'string',
			fieldset: 'badgeGroup',
			hidden: ({ parent }) => parent?.variant !== 'text' || !parent?.badgeText,
		}),
		defineField({
			name: 'badgeTextColor',
			title: 'Badge Text Color',
			description: 'Hex code (e.g. #FFFFFF)',
			type: 'string',
			fieldset: 'badgeGroup',
			hidden: ({ parent }) => parent?.variant !== 'text' || !parent?.badgeText,
		}),

		// A2. Main Content
		defineField({
			name: 'content',
			title: 'Announcement Message',
			description: 'E.g: Free shipping on all orders over $50! Use code ECO2026',
			type: 'string',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const parent = context.parent as { variant?: string }
					if (parent?.variant === 'text' && !value) {
						return 'Announcement text content is required'
					}
					return true
				}),
			hidden: ({ parent }) => parent?.variant !== 'text',
		}),

		// A3. Colors
		defineField({
			name: 'backgroundColor',
			title: 'Background Color',
			description: 'Hex code (e.g. #000000). Leave empty to inherit Topbar theme.',
			type: 'string',
			fieldset: 'colorGroup',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
					name: 'hex',
					invert: false,
				}).error('Must be a valid hex color code (e.g. #000000)'),
		}),
		defineField({
			name: 'textColor',
			title: 'Text Color',
			description: 'Hex code (e.g. #FFFFFF). Leave empty to inherit Topbar theme.',
			type: 'string',
			fieldset: 'colorGroup',
			hidden: ({ parent }) => parent?.variant !== 'text',
		}),

		// --- OPTION B: IMAGE MODE ---
		defineField({
			name: 'image',
			title: 'Desktop Banner Image',
			description: 'Recommended aspect ratio: 20:1 to 30:1 (e.g. 1920x60px or 1200x50px)',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
			fields: [
				defineField({
					name: 'mobileImage',
					title: 'Mobile Banner Image (Optional)',
					description: 'Optimized banner image for smartphones (e.g. 750x80px)',
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
					name: 'loading',
					title: 'Loading Strategy',
					type: 'string',
					options: {
						list: ['eager', 'lazy'],
						layout: 'radio',
					},
					initialValue: 'eager',
				}),
			],
			hidden: ({ parent }) => parent?.variant !== 'image',
		}),

		// --- LINK CONFIGURATION ---
		defineField({
			name: 'linkBannerType',
			title: 'Link Destination Type',
			type: 'string',
			options: {
				layout: 'radio',
				list: [
					{ title: 'Internal Link (Page/Product/Blog)', value: 'internal' },
					{ title: 'External URL', value: 'external' },
				],
			},
			fieldset: 'linkGroup',
		}),
		defineField({
			name: 'internal',
			title: 'Select Internal Target',
			type: 'reference',
			to: [{ type: 'page' }, { type: 'blog.post' }, { type: 'product' }, { type: 'collection' }],
			hidden: ({ parent }) => parent?.linkBannerType !== 'internal',
			fieldset: 'linkGroup',
		}),
		defineField({
			name: 'external',
			title: 'External URL',
			placeholder: 'https://example.com/promo',
			type: 'url',
			validation: (Rule) =>
				Rule.uri({
					scheme: ['http', 'https', 'mailto', 'tel'],
					allowRelative: true,
				}),
			hidden: ({ parent }) => parent?.linkBannerType !== 'external',
			fieldset: 'linkGroup',
		}),
	],
	preview: {
		select: {
			variant: 'variant',
			content: 'content',
			badgeText: 'badgeText',
			media: 'image',
			enabled: 'enabled',
		},
		prepare({ variant, content, badgeText, enabled }) {
			const isText = variant === 'text'
			const badgePrefix = badgeText ? `[${badgeText}] ` : ''
			const titleText = isText
				? `${badgePrefix}${content || 'Untitled Announcement'}`
				: 'Image Banner Graphic'

			return {
				title: titleText,
				subtitle: `Status: ${enabled !== false ? '✅ Active' : '⏸️ Inactive'} | Variant: ${variant || 'text'}`,
				media: isText ? TfiAnnouncement : FaRegImage,
			}
		},
	},
})
