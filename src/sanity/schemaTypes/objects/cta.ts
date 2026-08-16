import { defineField, defineType } from 'sanity'
import { VscInspect } from 'react-icons/vsc'

export default defineType({
	name: 'cta',
	title: 'Call-to-action',
	icon: VscInspect,
	type: 'object',
	fields: [
		defineField({
			name: 'actionType',
			title: '⚡ Action Type (Hành động khi click)',
			description: 'Chọn hành động kích hoạt khi khách hàng bấm vào nút',
			type: 'string',
			options: {
				list: [
					{ title: '🔗 Chuyển trang (Open URL Link)', value: 'link' },
					{ title: '🛍️ Mở giỏ hàng trượt (Open Mini-Cart Drawer)', value: 'cart-drawer' },
					{ title: '🔍 Mở ô tìm kiếm nhanh (Open Quick Search Modal)', value: 'search-modal' },
				],
			},
			initialValue: 'link',
		}),
		defineField({
			name: 'iconType',
			title: 'Icon Type',
			description: 'Chọn icon hiển thị cho nút',
			type: 'string',
			options: {
				list: [
					{ title: 'Tự động theo tên (Auto)', value: 'auto' },
					{ title: '🛍️ Giỏ hàng (Cart)', value: 'cart' },
					{ title: '🔍 Tìm kiếm (Search)', value: 'search' },
					{ title: '👤 Tài khoản (User)', value: 'user' },
					{ title: '❤️ Yêu thích (Wishlist)', value: 'wishlist' },
					{ title: '📞 Điện thoại (Phone)', value: 'phone' },
					{ title: '❌ Không hiển thị icon (Chỉ chữ)', value: 'none' },
				],
			},
			initialValue: 'auto',
		}),
		defineField({
			name: 'link',
			title: 'Link & Label',
			type: 'link',
		}),
		defineField({
			name: 'style',
			type: 'string',
			options: {
				list: [
					'action',
					{ title: 'Action (outline)', value: 'action-outline' },
					'ghost',
					'link',
				],
			},
		}),
	],
	preview: {
		select: {
			link: 'link',
			actionType: 'actionType',
			iconType: 'iconType',
			pageTitle: 'link.internal.title',
			pageSlug: 'link.internal.metadata.slug.current',
		},
		prepare: ({ link, actionType, iconType, pageTitle, pageSlug }) => {
			const actionLabels: Record<string, string> = {
				'cart-drawer': '🛍️ Action: Mini-Cart Drawer',
				'search-modal': '🔍 Action: Quick Search Modal',
				link: '🔗 Action: Page Link',
			}

			const slug =
				link?.type === 'internal'
					? pageSlug === 'index'
						? '/'
						: [pageSlug && `/${pageSlug}`, link.params].filter(Boolean).join('')
					: link?.type === 'external'
						? link.external
						: null

			const actionSubtitle = actionLabels[actionType || 'link'] || ''
			const subtitle = slug ? `${actionSubtitle} (${slug})` : actionSubtitle

			return {
				title: link?.label || pageTitle || (actionType === 'cart-drawer' ? 'Giỏ hàng' : actionType === 'search-modal' ? 'Tìm kiếm' : 'Nút CTA'),
				subtitle: subtitle,
			}
		},
	},
})
