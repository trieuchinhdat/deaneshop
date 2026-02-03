import { defineField, defineType } from 'sanity'
import { CodeIcon } from '@sanity/icons'

export default defineType({
	name: 'tracking-script',
	title: 'Tracking Script',
	type: 'object',
	icon: CodeIcon,
	fields: [
		defineField({
			name: 'title',
			title: 'Tên Script',
			description: 'VD: Google Analytics 4, FB Pixel, Tawk.to',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'isActive',
			title: 'Kích hoạt',
			type: 'boolean',
			initialValue: true,
		}),
		defineField({
			name: 'location',
			title: 'Vị trí (Logic)',
			description:
				'Phân loại để quản lý (Next.js Script tự động tối ưu vị trí thực tế)',
			type: 'string',
			options: {
				list: [
					{ title: 'Head (Đầu trang)', value: 'head' },
					{ title: 'Body (Cuối trang)', value: 'body' },
				],
				layout: 'radio',
			},
			initialValue: 'head',
		}),
		defineField({
			name: 'strategy',
			title: 'Chiến lược tải (Loading Strategy)',
			description: 'Quyết định khi nào script được tải để tối ưu tốc độ web.',
			type: 'string',
			options: {
				list: [
					{
						title: 'afterInteractive (Khuyên dùng - GA4, Pixel)',
						value: 'afterInteractive',
					},
					{
						title: 'lazyOnload (Tải chậm - Chat, Support, Social)',
						value: 'lazyOnload',
					},
					{
						title: 'beforeInteractive (Tải ngay - Hạn chế dùng)',
						value: 'beforeInteractive',
					},
				],
			},
			initialValue: 'afterInteractive',
		}),
		defineField({
			name: 'scriptType',
			title: 'Loại Script',
			type: 'string',
			options: {
				list: [
					{ title: 'External URL (Link file .js)', value: 'url' },
					{ title: 'Inline Code (Viết code trực tiếp)', value: 'inline' },
				],
				layout: 'radio',
			},
			initialValue: 'url',
		}),
		// --- CÁC FIELD CẤU HÌNH CHI TIẾT ---
		defineField({
			name: 'src',
			title: 'Script Source (URL)',
			placeholder: 'https://example.com/script.js',
			type: 'url',
			hidden: ({ parent }) => parent?.scriptType !== 'url',
		}),
		defineField({
			name: 'code',
			title: 'Mã Inline',
			description: 'Chỉ dán nội dung JS nằm GIỮA thẻ <script>.',
			type: 'text',
			rows: 6,
			hidden: ({ parent }) => parent?.scriptType !== 'inline',
		}),
		// --- FIELD ATTRIBUTES (QUAN TRỌNG) ---
		defineField({
			name: 'attributes',
			title: 'Thuộc tính mở rộng (Attributes)',
			description: 'Thêm các thuộc tính như: data-domain, id, data-id...',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						defineField({
							name: 'key',
							title: 'Tên (Key)',
							placeholder: 'data-id',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'value',
							title: 'Giá trị (Value)',
							placeholder: '123456',
							type: 'string',
						}),
					],
					preview: {
						select: { key: 'key', value: 'value' },
						prepare({ key, value }) {
							return {
								title: key,
								subtitle: value ? `= ${value}` : '(Empty value)',
							}
						},
					},
				},
			],
			options: {
				modal: { type: 'popover' }, // Hiển thị popup nhỏ cho gọn
			},
		}),
	],
	preview: {
		select: {
			title: 'title',
			active: 'isActive',
			type: 'scriptType',
		},
		prepare({ title, active, type }) {
			return {
				title: title,
				subtitle: `${active ? '🟢 Bật' : '⚪ Tắt'} - ${type === 'url' ? 'URL' : 'Inline'}`,
				media: CodeIcon,
			}
		},
	},
})
