import { defineField, defineType } from 'sanity'
import { VscLayoutMenubar } from 'react-icons/vsc'

export default defineType({
	name: 'header-settings',
	title: 'Header Settings',
	icon: VscLayoutMenubar,
	type: 'document',
	groups: [
		{ name: 'navigation', title: 'Menu & Điều Hướng', default: true },
		{ name: 'desktop', title: 'Cấu Hình Desktop' },
		{ name: 'mobile', title: 'Cấu Hình Mobile' },
		{ name: 'style_topbar', title: 'Màu Sắc & Top Bar' },
	],
	fieldsets: [
		{
			name: 'headerColor',
			title: 'Cấu hình Màu sắc Header',
			options: { columns: 2 },
		},
	],
	fields: [
		// ================= TAB 1: MENU & ĐIỀU HƯỚNG =================
		defineField({
			name: 'menu',
			title: 'Menu Điều Hướng Desktop (Desktop Navigation)',
			description: 'Danh mục Menu chính hiển thị trên màn hình máy tính',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'mobileMenu',
			title: 'Menu Điều Hướng Mobile (Mobile Navigation)',
			description: 'Tùy chọn. Danh mục Menu riêng cho di động. Nếu bỏ trống, hệ thống sẽ tự động dùng chung Menu Desktop',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'ctas',
			title: 'Call-to-actions (Nút chức năng góc phải)',
			description: 'Danh sách các nút hành động (Tìm kiếm, Giỏ hàng, Tài khoản, Hotline...)',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'navigation',
		}),

		// ================= TAB 2: CẤU HÌNH DESKTOP =================
		defineField({
			name: 'desktopLayout',
			title: 'Kiểu Bố Cục Desktop (Desktop Header Layout)',
			type: 'string',
			options: {
				list: [
					{ title: 'Layout 01: 1 Hàng (Logo - Menu - CTAs)', value: 'layout01' },
					{ title: 'Layout 02: 2 Hàng Superstore (Hàng 1: Logo - Box Search - CTAs | Hàng 2: Menu)', value: 'layout02' },
				],
				layout: 'radio',
			},
			initialValue: 'layout01',
			group: 'desktop',
		}),
		defineField({
			name: 'desktopMenuAlign',
			title: 'Vị Trí Căn Lề Menu Desktop (Desktop Menu Alignment)',
			type: 'string',
			options: {
				list: [
					{ title: 'Căn Trái (Sát bên phải Logo)', value: 'left' },
					{ title: 'Căn Giữa (Mặc định)', value: 'center' },
					{ title: 'Căn Phải (Sát bên trái CTAs)', value: 'right' },
				],
			},
			initialValue: 'center',
			group: 'desktop',
		}),
		defineField({
			name: 'desktopSearchVariant',
			title: 'Kiểu Ô Tìm Kiếm Desktop (Desktop Search Variant)',
			description: 'Chỉ áp dụng khi chọn Desktop Layout 02',
			type: 'string',
			options: {
				list: [
					{ title: 'Ô gõ tìm kiếm trực tiếp (Live Input Search)', value: 'input' },
					{ title: 'Nút bấm mở Modal Tìm kiếm (Trigger Search Modal)', value: 'modal' },
				],
				layout: 'radio',
			},
			initialValue: 'input',
			group: 'desktop',
			hidden: ({ parent }) => parent?.desktopLayout !== 'layout02',
		}),
		defineField({
			name: 'behavior',
			title: 'Header Behavior (Quy cách cuộn trang)',
			type: 'string',
			options: {
				list: [
					{ title: 'Sticky cố định trên cùng', value: 'sticky' },
					{ title: 'Smart Sticky (Ẩn khi cuộn xuống, hiện khi cuộn lên)', value: 'smart' },
					{ title: 'Tĩnh (Static)', value: 'static' },
				],
				layout: 'radio',
			},
			initialValue: 'sticky',
			group: 'desktop',
		}),
		defineField({
			name: 'style',
			title: 'Phông nền Header (Style Variant)',
			type: 'string',
			options: {
				list: [
					{ title: 'Màu nền tĩnh (Solid)', value: 'solid' },
					{ title: 'Kính mờ hiện đại (Glassmorphism Backdrop Blur)', value: 'blur' },
					{ title: 'Trong suốt (Transparent)', value: 'transparent' },
				],
				layout: 'radio',
			},
			initialValue: 'solid',
			group: 'desktop',
		}),

		// ================= TAB 3: CẤU HÌNH MOBILE =================
		defineField({
			name: 'mobileLayout',
			title: 'Kiểu Bố Cục Mobile (Mobile Header Layout)',
			type: 'string',
			options: {
				list: [
					{ title: 'Layout 01 (Classic): [Menu] - [Logo] - [Cart/CTAs]', value: 'layout01' },
					{ title: 'Layout 02 (Thumb-friendly): [Logo] - [Cart/CTAs] - [Menu]', value: 'layout02' },
				],
				layout: 'radio',
			},
			initialValue: 'layout01',
			group: 'mobile',
		}),
		defineField({
			name: 'mobileLogoAlign',
			title: 'Vị Trí Logo Mobile (Mobile Logo Position)',
			description: 'Chỉ áp dụng khi chọn Mobile Layout 01',
			type: 'string',
			options: {
				list: [
					{ title: 'Căn Giữa (Center)', value: 'center' },
					{ title: 'Căn Trái (Left)', value: 'left' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'mobile',
			hidden: ({ parent }) => parent?.mobileLayout !== 'layout01',
		}),
		defineField({
			name: 'mobileSearchDisplay',
			title: 'Hiển Thị Tìm Kiếm Mobile (Mobile Search Display)',
			type: 'string',
			options: {
				list: [
					{ title: 'Thanh tìm kiếm Full-width (Nằm ở hàng 2 riêng biệt)', value: 'bar' },
					{ title: 'Icon Kính lúp (Nằm kế bên Cart ở hàng 1 - Tiết kiệm chiều cao)', value: 'icon' },
				],
				layout: 'radio',
			},
			initialValue: 'bar',
			group: 'mobile',
		}),

		// ================= TAB 4: MÀU SẮC & TOP BAR =================
		defineField({
			name: 'headerBackground',
			title: 'Màu nền Header (Header Background)',
			type: 'string',
			initialValue: '#ffffff',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Invalid Hex'),
			fieldset: 'headerColor',
			group: 'style_topbar',
		}),
		defineField({
			name: 'headerText',
			title: 'Màu chữ Header (Header Text Color)',
			type: 'string',
			initialValue: '#000000',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Invalid Hex'),
			fieldset: 'headerColor',
			group: 'style_topbar',
		}),
		defineField({
			name: 'showTopBar',
			title: 'Bật Top Bar trên cùng Header',
			type: 'boolean',
			initialValue: true,
			group: 'style_topbar',
		}),
		defineField({
			name: 'phoneContact',
			title: 'Thông tin Hotline / Số điện thoại',
			type: 'string',
			description: 'Ví dụ: Hotline: 0901 234 567 (Hiển thị ở góc Top Bar)',
			initialValue: 'Hotline: 0901 234 567',
			group: 'style_topbar',
			hidden: ({ parent }) => parent?.showTopBar === false,
		}),
		defineField({
			name: 'announcements',
			title: 'Danh sách Banner / Thông báo',
			description: 'Chọn các bài thông báo (Announcement Items) hiển thị ở Top Bar',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'announcement-item' }] }],
			group: 'style_topbar',
			hidden: ({ parent }) => parent?.showTopBar === false,
		}),
		defineField({
			name: 'enableCartDrawer',
			title: 'Bật Mini-Cart Slide-Over Drawer',
			description: 'Hiển thị bảng giỏ hàng xem nhanh ở góc phải màn hình khi nhấp vào Icon Giỏ hàng',
			type: 'boolean',
			initialValue: true,
			group: 'style_topbar',
		}),
		defineField({
			name: 'enableSearchModal',
			title: 'Bật Quick Search Modal Overlay',
			description: 'Hiển thị khung tìm kiếm nhanh với kết quả xem tức thì khi nhấp vào Icon Tìm kiếm',
			type: 'boolean',
			initialValue: true,
			group: 'style_topbar',
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Header Settings',
		}),
	},
})
