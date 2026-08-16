import { defineField, defineType } from 'sanity'
import { VscLayout } from 'react-icons/vsc'

export default defineType({
	name: 'footer-settings',
	title: 'Footer Settings',
	icon: VscLayout,
	type: 'document',
	groups: [
		{ name: 'navigation', title: 'Menu & Social', default: true },
		{ name: 'content', title: 'Nội dung Footer' },
		{ name: 'style', title: 'Giao diện & Màu sắc' },
	],
	fieldsets: [
		{
			name: 'footerColor',
			title: 'Footer Color Scheme',
			options: { columns: 2 },
		},
	],
	fields: [
		// ================= TAB 1: NAVIGATION & SOCIAL =================
		defineField({
			name: 'footerMenu',
			title: 'Footer Navigation Menu',
			description: 'Danh sách cột liên kết menu hiển thị ở Footer',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'social',
			title: 'Social Links Menu',
			description: 'Danh sách các liên kết mạng xã hội hiển thị ở Footer',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),

		// ================= TAB 2: CONTENT =================
		defineField({
			name: 'footerContent',
			title: 'Thông tin công ty / Cửa hàng',
			description: 'Tên công ty, địa chỉ, hotline, mã số thuế, thông tin liên hệ...',
			type: 'array',
			of: [
				{
					type: 'block',
					styles: [{ title: 'Normal', value: 'normal' }],
					lists: [],
				},
			],
			group: 'content',
		}),
		defineField({
			name: 'copyright',
			title: 'Thông tin bản quyền (Copyright)',
			description: 'Dòng thông tin bản quyền hiển thị ở chân trang',
			type: 'array',
			of: [
				{
					type: 'block',
					styles: [{ title: 'Normal', value: 'normal' }],
					lists: [],
				},
			],
			group: 'content',
		}),

		// ================= TAB 3: STYLE =================
		defineField({
			name: 'footerBackground',
			title: 'Footer Background Color',
			type: 'string',
			initialValue: '#000000',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Invalid Hex Color'),
			fieldset: 'footerColor',
			group: 'style',
		}),
		defineField({
			name: 'footerText',
			title: 'Footer Text & Icon Color',
			type: 'string',
			initialValue: '#ffffff',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Invalid Hex Color'),
			fieldset: 'footerColor',
			group: 'style',
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Footer Settings',
		}),
	},
})
