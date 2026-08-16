import { defineField, defineType } from 'sanity'
import { HiOutlineHeart } from 'react-icons/hi2'

export default defineType({
	name: 'wishlist',
	title: 'Wishlist (Danh sách yêu thích)',
	type: 'object',
	icon: HiOutlineHeart,
	groups: [
		{ name: 'content', title: 'Nội dung', default: true },
		{ name: 'emptyState', title: 'Khi danh sách trống' },
		{ name: 'options', title: 'Tùy chọn hiển thị' },
	],
	fields: [
		defineField({
			name: 'title',
			title: 'Tiêu đề trang',
			type: 'string',
			group: 'content',
			initialValue: 'Danh sách yêu thích',
		}),
		defineField({
			name: 'description',
			title: 'Mô tả ngắn',
			type: 'text',
			group: 'content',
			rows: 2,
			initialValue: 'Những sản phẩm bạn đã lưu để xem lại và mua sắm sau.',
		}),
		defineField({
			name: 'emptyTitle',
			title: 'Tiêu đề khi trống',
			type: 'string',
			group: 'emptyState',
			initialValue: 'Danh sách yêu thích của bạn đang trống',
		}),
		defineField({
			name: 'emptyDescription',
			title: 'Mô tả khi trống',
			type: 'text',
			group: 'emptyState',
			rows: 2,
			initialValue: 'Hãy thêm những sản phẩm bạn yêu thích bằng cách nhấn vào biểu tượng trái tim để xem lại bất cứ lúc nào!',
		}),
		defineField({
			name: 'emptyButtonText',
			title: 'Chữ trên nút CTA (Khi trống)',
			type: 'string',
			group: 'emptyState',
			initialValue: 'Khám phá sản phẩm ngay',
		}),
		defineField({
			name: 'emptyButtonLink',
			title: 'Đường dẫn nút CTA (Khi trống)',
			type: 'string',
			group: 'emptyState',
			initialValue: '/collections/all',
		}),
		defineField({
			name: 'showMoveAllToCart',
			title: 'Hiển thị nút "Chuyển tất cả vào giỏ"',
			type: 'boolean',
			group: 'options',
			initialValue: true,
		}),
		defineField({
			name: 'showClearAll',
			title: 'Hiển thị nút "Xóa tất cả"',
			type: 'boolean',
			group: 'options',
			initialValue: true,
		}),
	],
	preview: {
		prepare() {
			return {
				title: 'Wishlist (Yêu thích)',
				subtitle: 'Danh sách sản phẩm thả tim',
				media: HiOutlineHeart,
			}
		},
	},
})
