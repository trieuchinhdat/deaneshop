import { defineField, defineType } from 'sanity'
import { VscPaintcan } from 'react-icons/vsc'

export default defineType({
	name: 'theme-background',
	title: 'Theme Background Style',
	type: 'object',
	icon: VscPaintcan,
	fields: [
		defineField({
			name: 'type',
			title: 'Background Type',
			type: 'string',
			options: {
				list: [
					{ title: 'Màu đơn sắc (Solid Color)', value: 'color' },
					{ title: 'Hình ảnh (Image)', value: 'image' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'color',
		}),

		defineField({
			name: 'color',
			title: 'Hex Color',
			type: 'string',
			description: 'Ví dụ: #F5F5F5',
			placeholder: '#ffffff',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
					name: 'hex',
					invert: false,
				}).error('Mã màu Hex không hợp lệ (Ví dụ đúng: #FFFFFF)'),
			hidden: ({ parent }) => parent?.type !== 'color',
		}),

		// 3. Chọn ảnh nền
		defineField({
			name: 'image',
			title: 'Background Image',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip', 'palette'],
			},
			hidden: ({ parent }) => parent?.type !== 'image',
		}),
	],
	// Preview giúp nhìn nhanh màu/ảnh đã chọn trong Studio
	preview: {
		select: {
			type: 'type',
			color: 'color',
			image: 'image',
		},
		prepare({ type, color, image }) {
			return {
				title: 'Background Settings',
				subtitle:
					type === 'color'
						? color
						: type === 'image'
							? 'Image Background'
							: 'Default',
				media: type === 'image' ? image : VscPaintcan,
			}
		},
	},
})
