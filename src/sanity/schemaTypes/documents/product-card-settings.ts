import { defineField, defineType } from 'sanity'
import { VscLayout } from 'react-icons/vsc'

export default defineType({
	name: 'product-card-settings',
	title: 'Product Card Settings',
	type: 'document',
	icon: VscLayout,
	groups: [
		{ name: 'visibility', title: 'Visibility & Badges', default: true },
		{ name: 'quickActions', title: 'Quick Actions' },
		{ name: 'variants', title: 'Variants & Colors' },
		{ name: 'layout', title: 'Layout & Styling' },
	],
	fieldsets: [
		{
			name: 'cardVisibilityGroup',
			title: 'Cấu hình Hiển thị Yếu tố (Visibility)',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'cardQuickActionsGroup',
			title: 'Cấu hình Thao tác Mua nhanh (Quick Actions)',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'cardBadgesGroup',
			title: 'Cấu hình Nhãn & Badge (Badges)',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'cardVariantsGroup',
			title: 'Cấu hình Biến thể & Chấm màu (Color Swatches)',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'cardLayoutGroup',
			title: 'Cấu hình Bố cục & Căn chỉnh (Layout)',
			options: { collapsible: true, collapsed: false },
		},
	],
	fields: [
		// ================= VISIBILITY & BADGES =================
		defineField({
			name: 'cardShowCategory',
			title: 'Hiển thị Danh mục sản phẩm (Category)',
			description: 'Hiển thị tên danh mục sản phẩm phía trên tên sản phẩm',
			type: 'boolean',
			initialValue: true,
			group: 'visibility',
			fieldset: 'cardVisibilityGroup',
		}),
		defineField({
			name: 'cardShowRating',
			title: 'Hiển thị Số sao & Lượt đánh giá',
			description: 'Hiển thị số sao trung bình và số lượng review trên Product Card',
			type: 'boolean',
			initialValue: true,
			group: 'visibility',
			fieldset: 'cardVisibilityGroup',
		}),
		defineField({
			name: 'cardShowSoldCount',
			title: 'Hiển thị Lượt đã bán',
			description: 'Hiển thị số lượng đã bán trên Product Card (ví dụ: 1.2k sold)',
			type: 'boolean',
			initialValue: true,
			group: 'visibility',
			fieldset: 'cardVisibilityGroup',
		}),
		defineField({
			name: 'cardShowSecondaryImageHover',
			title: 'Đổi ảnh thứ 2 khi di chuột (Hover image)',
			description: 'Tự động hiển thị hình ảnh thứ 2 của sản phẩm khi di chuột qua Card',
			type: 'boolean',
			initialValue: true,
			group: 'visibility',
			fieldset: 'cardVisibilityGroup',
		}),
		defineField({
			name: 'cardShowWishlist',
			title: 'Hiển thị Nút Yêu thích (Wishlist button)',
			description: 'Hiển thị biểu tượng thả tim yêu thích ở góc sản phẩm',
			type: 'boolean',
			initialValue: true,
			group: 'visibility',
			fieldset: 'cardVisibilityGroup',
		}),

		// Badges
		defineField({
			name: 'cardShowDiscountBadge',
			title: 'Hiển thị Badge Giảm giá',
			description: 'Hiển thị nhãn giảm giá ở góc sản phẩm khi so sánh giá gốc',
			type: 'boolean',
			initialValue: true,
			group: 'visibility',
			fieldset: 'cardBadgesGroup',
		}),
		defineField({
			name: 'cardDiscountStyle',
			title: 'Kiểu hiển thị Giảm giá',
			type: 'string',
			options: {
				list: [
					{ title: 'Phần trăm (%) (vd: -20%)', value: 'percent' },
					{ title: 'Số tiền giảm (vd: -50k)', value: 'amount' },
				],
				layout: 'radio',
			},
			initialValue: 'percent',
			group: 'visibility',
			fieldset: 'cardBadgesGroup',
			hidden: ({ parent }) => parent?.cardShowDiscountBadge === false,
		}),
		defineField({
			name: 'cardShowOutOfStock',
			title: 'Cảnh báo & Phủ mờ khi Hết hàng',
			description: 'Hiển thị badge "Hết hàng" và mờ ảnh khi tồn kho = 0',
			type: 'boolean',
			initialValue: true,
			group: 'visibility',
			fieldset: 'cardBadgesGroup',
		}),

		// ================= QUICK ACTIONS =================
		defineField({
			name: 'cardQuickActionMode',
			title: 'Chế độ Thao tác Mua nhanh (Quick Actions)',
			description: 'Chọn loại nút tương tác trực tiếp hiển thị trên Card sản phẩm',
			type: 'string',
			options: {
				list: [
					{ title: 'Không hiển thị nút', value: 'none' },
					{ title: 'Nút "Thêm vào giỏ" (Quick Add)', value: 'quickAdd' },
					{ title: 'Nút "Xem nhanh" (Quick View)', value: 'quickView' },
					{ title: 'Cả 2 (Hiển thị dạng icon khi hover)', value: 'both' },
				],
				layout: 'radio',
			},
			initialValue: 'quickAdd',
			group: 'quickActions',
			fieldset: 'cardQuickActionsGroup',
		}),
		defineField({
			name: 'cardQuickAddText',
			title: 'Nhãn nút "Thêm vào giỏ nhanh"',
			type: 'string',
			initialValue: 'Thêm vào giỏ',
			group: 'quickActions',
			fieldset: 'cardQuickActionsGroup',
			hidden: ({ parent }) =>
				parent?.cardQuickActionMode !== 'quickAdd' &&
				parent?.cardQuickActionMode !== 'both',
		}),

		// ================= VARIANTS & COLORS =================
		defineField({
			name: 'cardShowColorSwatches',
			title: 'Hiển thị Chấm màu sắc Biến thể (Color Swatches)',
			description: 'Hiển thị danh sách màu sắc lựa chọn bên dưới hình ảnh Card',
			type: 'boolean',
			initialValue: true,
			group: 'variants',
			fieldset: 'cardVariantsGroup',
		}),
		defineField({
			name: 'cardMaxColorSwatches',
			title: 'Số chấm màu hiển thị tối đa',
			type: 'number',
			initialValue: 4,
			validation: (Rule) => Rule.min(1).max(10),
			group: 'variants',
			fieldset: 'cardVariantsGroup',
			hidden: ({ parent }) => parent?.cardShowColorSwatches === false,
		}),

		// ================= LAYOUT & STYLING =================
		defineField({
			name: 'cardContentAlignment',
			title: 'Căn chỉnh Văn bản (Text Alignment)',
			type: 'string',
			options: {
				list: [
					{ title: 'Căn giữa (Center)', value: 'center' },
					{ title: 'Căn trái (Left)', value: 'left' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'layout',
			fieldset: 'cardLayoutGroup',
		}),
		defineField({
			name: 'cardImageAspectRatio',
			title: 'Tỷ lệ khung hình Ảnh đại diện (Aspect Ratio)',
			type: 'string',
			options: {
				list: [
					{ title: 'Vuông (1:1)', value: '1:1' },
					{ title: 'Thời trang / Dọc (3:4)', value: '3:4' },
					{ title: 'Ngang (4:3)', value: '4:3' },
				],
				layout: 'radio',
			},
			initialValue: '1:1',
			group: 'layout',
			fieldset: 'cardLayoutGroup',
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Product Card Settings',
		}),
	},
})
