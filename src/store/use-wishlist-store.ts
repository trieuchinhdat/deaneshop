import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface WishlistItem {
	_id: string
	addedAt: string
}

interface WishlistStore {
	items: WishlistItem[]
	addItem: (id: string) => void
	removeItem: (id: string) => void
	toggleItem: (id: string) => boolean // returns true if added, false if removed
	isInWishlist: (id: string) => boolean
	clearWishlist: () => void
	totalItems: () => number
}

export const useWishlistStore = create<WishlistStore>()(
	persist(
		(set, get) => ({
			items: [],

			addItem: (id: string) => {
				const current = get().items
				if (!current.some((item) => item._id === id)) {
					set({ items: [{ _id: id, addedAt: new Date().toISOString() }, ...current] })
				}
			},

			removeItem: (id: string) => {
				set({ items: get().items.filter((item) => item._id !== id) })
			},

			toggleItem: (id: string) => {
				const current = get().items
				const exists = current.some((item) => item._id === id)
				if (exists) {
					set({ items: current.filter((item) => item._id !== id) })
					return false
				} else {
					set({
						items: [{ _id: id, addedAt: new Date().toISOString() }, ...current],
					})
					return true
				}
			},

			isInWishlist: (id: string) => {
				return get().items.some((item) => item._id === id)
			},

			clearWishlist: () => {
				set({ items: [] })
			},

			totalItems: () => {
				return get().items.length
			},
		}),
		{
			name: 'ecocros_wishlist',
			storage: createJSONStorage(() => localStorage),
		},
	),
)

export function showWishlistToast(isAdded: boolean, productTitle?: string) {
	import('sweetalert2').then(({ default: Swal }) => {
		Swal.fire({
			toast: true,
			position: 'top-end',
			icon: isAdded ? 'success' : 'info',
			title: isAdded
				? productTitle
					? `Đã thêm "${productTitle}" vào danh sách yêu thích`
					: `Đã thêm vào danh sách yêu thích`
				: productTitle
					? `Đã xóa "${productTitle}" khỏi danh sách yêu thích`
					: `Đã xóa khỏi danh sách yêu thích`,
			showConfirmButton: false,
			timer: 2500,
			timerProgressBar: true,
			customClass: {
				popup:
					'!p-3 !rounded-2xl !border !border-gray-200/90 !shadow-xl !bg-white !w-auto !min-w-[250px]',
				container: 'mt-20 md:mt-24 z-[999]',
			},
		})
	})
}
