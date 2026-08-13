import { defineField, defineType } from 'sanity'
import { VscInspect } from 'react-icons/vsc'

export default defineType({
	name: 'cta',
	title: 'Call-to-action',
	icon: VscInspect,
	type: 'object',
	fields: [
		defineField({
			name: 'link',
			type: 'link',
		}),
		defineField({
			name: 'iconType',
			title: 'Icon Type',
			type: 'string',
			options: {
				list: [
					{ title: 'Tự động / Mặc định', value: 'auto' },
					{ title: 'Không hiển thị icon', value: 'none' },
					{ title: 'Giỏ hàng (Cart)', value: 'cart' },
					{ title: 'Tìm kiếm (Search)', value: 'search' },
					{ title: 'Tài khoản (User)', value: 'user' },
					{ title: 'Yêu thích (Wishlist)', value: 'wishlist' },
					{ title: 'Điện thoại (Phone)', value: 'phone' },
				],
			},
			initialValue: 'auto',
		}),
		defineField({
			name: 'actionType',
			title: 'Hành động khi nhấp',
			type: 'string',
			options: {
				list: [
					{ title: 'Chuyển trang (Link)', value: 'link' },
					{ title: 'Mở giỏ hàng nhanh (Cart Drawer)', value: 'cart-drawer' },
					{ title: 'Mở ô tìm kiếm (Search Modal)', value: 'search-modal' },
				],
			},
			initialValue: 'link',
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
			pageTitle: 'link.internal.title',
			pageSlug: 'link.internal.metadata.slug.current',
		},
		prepare: ({ link, pageTitle, pageSlug }) => {
			const slug =
				link.type === 'internal'
					? pageSlug === 'index'
						? '/'
						: [pageSlug && `/${pageSlug}`, link.params].filter(Boolean).join('')
					: link.type === 'external'
						? link.external
						: null

			return {
				title: link.label || pageTitle,
				subtitle: slug,
			}
		},
	},
})
