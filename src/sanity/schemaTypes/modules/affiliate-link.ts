import { defineField, defineType } from 'sanity'
import { LinkIcon } from '@sanity/icons'

export default defineType({
	name: 'affiliateLink',
	title: 'Affiliate Product',
	type: 'object',
	icon: LinkIcon,
	// Sử dụng groups để tách biệt Cấu hình hiển thị và Nội dung
	groups: [
		{ name: 'display', title: 'Giao diện' },
		{ name: 'content', title: 'Nội dung' },
	],
	fields: [
		// --- CẤU HÌNH GIAO DIỆN ---
		defineField({
			name: 'layout',
			title: 'Kiểu hiển thị',
			type: 'string',
			group: 'display',
			options: {
				list: [
					{ title: 'Chỉ Button', value: 'button' },
					{ title: 'Card Ngang (Horizontal)', value: 'horizontal' },
					{ title: 'Card Dọc (Vertical)', value: 'vertical' },
				],
				layout: 'radio',
			},
			initialValue: 'horizontal',
		}),
		defineField({
			name: 'alignment',
			title: 'Căn chỉnh',
			description: 'Căn trái, giữa hoặc phải cho module',
			type: 'string',
			group: 'display',
			options: {
				list: [
					{ title: 'Trái', value: 'left' },
					{ title: 'Giữa', value: 'center' },
					{ title: 'Phải', value: 'right' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
		}),
		defineField({
			name: 'buttonColor',
			title: 'Màu nút CTA',
			type: 'string',
			group: 'display',
			options: {
				list: [
					{ title: 'Mặc định (Đen)', value: 'default' },
					{ title: 'Xanh lá (Amazon)', value: 'green' },
					{ title: 'Đỏ (Sale)', value: 'red' },
					{ title: 'Xanh dương', value: 'blue' },
					{ title: 'Cam', value: 'orange' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
		}),

		// --- NỘI DUNG ---
		defineField({
			name: 'badge',
			title: 'Nhãn nổi bật',
			description: 'VD: Best Choice, Editor Pick',
			type: 'string',
			group: 'content',
			hidden: ({ parent }) => parent?.layout === 'button',
		}),
		defineField({
			name: 'image',
			title: 'Hình ảnh',
			type: 'image',
			group: 'content',
			options: { hotspot: true },
			hidden: ({ parent }) => parent?.layout === 'button',
		}),
		defineField({
			name: 'title',
			title: 'Tên sản phẩm',
			type: 'string',
			group: 'content',
			hidden: ({ parent }) => parent?.layout === 'button',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					// Ép kiểu parent để tránh lỗi truy cập thuộc tính layout
					const parent = context.parent as { layout?: string } | undefined

					if (parent?.layout !== 'button' && !value) {
						return 'Vui lòng nhập tên sản phẩm cho Layout này'
					}
					return true
				}),
		}),
		defineField({
			name: 'rating',
			title: 'Đánh giá',
			type: 'number',
			group: 'content',
			validation: (Rule) => Rule.min(0).max(5).precision(1),
			hidden: ({ parent }) => parent?.layout === 'button',
		}),
		defineField({
			name: 'price',
			title: 'Giá',
			type: 'string',
			group: 'content',
			hidden: ({ parent }) => parent?.layout === 'button',
		}),
		defineField({
			name: 'shortInfo',
			title: 'Mô tả ngắn',
			type: 'text',
			rows: 2,
			group: 'content',
			hidden: ({ parent }) => parent?.layout === 'button',
		}),

		// --- LINK (Luôn hiển thị) ---
		defineField({
			name: 'url',
			title: 'Link Affiliate',
			type: 'url',
			group: 'content',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'buttonText',
			title: 'Chữ trên nút',
			type: 'string',
			group: 'content',
			initialValue: 'Check Price',
		}),
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'buttonText',
			media: 'image',
			layout: 'layout',
			price: 'price',
		},
		prepare({ title, subtitle, media, layout, price }) {
			return {
				title: title || subtitle || 'Affiliate Link',
				subtitle: `${layout.toUpperCase()} ${price ? `| ${price}` : ''}`,
				media: media || LinkIcon,
			}
		},
	},
})
