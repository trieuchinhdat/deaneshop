import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'site',
	title: 'Site',
	type: 'document',
	groups: [
		{ name: 'branding', default: true },
		{ name: 'navigation' },
		{ name: 'info' },
		{ name: 'theme style' },
	],
	fields: [
		defineField({
			name: 'title',
			type: 'string',
			validation: (Rule) => Rule.required(),
			group: 'branding',
		}),
		defineField({
			name: 'logo',
			type: 'logo',
			group: 'branding',
		}),
		defineField({
			name: 'announcements',
			type: 'reference',
			to: [{ type: 'announcement-item' }],
			group: 'branding',
		}),
		defineField({
			name: 'header',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'ctas',
			title: 'Call-to-actions',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'navigation',
		}),
		defineField({
			name: 'footer',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'social',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'chatbox',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'footerContent',
			type: 'array',
			of: [
				{
					type: 'block',
					styles: [{ title: 'Normal', value: 'normal' }],
					lists: [],
				},
			],
			group: 'info',
		}),
		defineField({
			name: 'copyright',
			type: 'array',
			of: [
				{
					type: 'block',
					styles: [{ title: 'Normal', value: 'normal' }],
					lists: [],
				},
			],
			group: 'info',
		}),
		defineField({
			name: 'scripts',
			title: 'Mã theo dõi & Analytics',
			description: 'Quản lý các mã GA4, Pixel, Chat...',
			type: 'array',
			of: [{ type: 'tracking-script' }],
			options: {
				layout: 'tags',
			},
			group: 'info',
		}),
		defineField({
			name: 'theme',
			title: 'Global Theme Settings',
			type: 'object',
			group: 'theme style',
			options: { collapsible: true },
			fieldsets: [
				{
					name: 'globalColor',
					title: 'Global Color',
					options: { columns: 3 },
				},
				{
					name: 'headerColor',
					title: 'Header Color',
					options: { columns: 2 },
				},
				{
					name: 'footerColor',
					title: 'Footer Color',
					options: { columns: 2 },
				},
			],
			fields: [
				// 1. MÀU CHỦ ĐẠO (Primary) - Dùng cho button, link, highlight
				defineField({
					name: 'primaryColor',
					title: 'Primary Color',
					type: 'string',
					initialValue: '#000000',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex',
						),
					fieldset: 'globalColor',
				}),

				// 2. MÀU NỀN WEB (Body Background)
				defineField({
					name: 'backgroundColor',
					title: 'Background Color',
					type: 'string',
					initialValue: '#ffffff',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex',
						),
					fieldset: 'globalColor',
				}),

				// 3. MÀU CHỮ CHÍNH (Body Text)
				defineField({
					name: 'textColor',
					title: 'Text Color',
					type: 'string',
					initialValue: '#000000',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex',
						),
					fieldset: 'globalColor',
				}),

				// 4. MÀU HEADER
				defineField({
					name: 'headerBackground',
					title: 'Header Background',
					type: 'string',
					initialValue: '#ffffff',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex',
						),
					fieldset: 'headerColor',
				}),
				defineField({
					name: 'headerText',
					title: 'Header Text Color',
					type: 'string',
					initialValue: '#000000',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex',
						),
					fieldset: 'headerColor',
				}),

				// 5. MÀU FOOTER
				defineField({
					name: 'footerBackground',
					title: 'Footer Background',
					type: 'string',
					initialValue: '#000000',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex',
						),
					fieldset: 'footerColor',
				}),
				defineField({
					name: 'footerText',
					title: 'Footer Text Color',
					type: 'string',
					initialValue: '#ffffff',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex',
						),
					fieldset: 'footerColor',
				}),
			],
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Site',
		}),
	},
})
