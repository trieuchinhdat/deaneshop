import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProductOption = {
	name: string
	values: string[]
}

export type ProductVariant = {
	_key?: string
	title?: string
	sku?: string
	price?: number
	compareAtPrice?: number
	stock?: number
	image?: any
	options?: Array<{ name?: string; value?: string }>
}

export type CartItem = {
	id: string
	productId?: string
	productTitle?: string
	variantId?: string
	variantTitle?: string
	selectedOptions?: Record<string, string>
	sku?: string
	title: string
	price: number
	compareAtPrice?: number
	slug?: string
	quantity: number
	image: any
	hasVariants?: boolean
	options?: ProductOption[]
	variants?: ProductVariant[]
}

export type UpdateVariantPayload = {
	variantId: string
	variantTitle?: string
	selectedOptions?: Record<string, string>
	sku?: string
	price: number
	compareAtPrice?: number
	image?: any
	title?: string
	quantity?: number
}

type CartState = {
	items: CartItem[]
	addItem: (item: CartItem) => void
	removeItem: (id: string) => void
	updateQuantity: (id: string, quantity: number) => void
	updateVariant: (oldItemId: string, newVariant: UpdateVariantPayload) => void
	updateItemData: (id: string, data: Partial<CartItem>) => void
	clearCart: () => void
	totalPrice: () => number
}

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],

			addItem: (item) =>
				set((state) => {
					const existing = state.items.find((i) => i.id === item.id)
					const validQty = Math.max(1, Math.floor(item.quantity || 1))

					if (existing) {
						return {
							items: state.items.map((i) =>
								i.id === item.id
									? {
											...i,
											quantity: i.quantity + validQty,
											options: item.options || i.options,
											variants: item.variants || i.variants,
											productTitle: item.productTitle || i.productTitle,
											hasVariants:
												item.hasVariants !== undefined
													? item.hasVariants
													: i.hasVariants,
										}
									: i,
							),
						}
					}

					return { items: [...state.items, { ...item, quantity: validQty }] }
				}),

			removeItem: (id) =>
				set((state) => ({
					items: state.items.filter((i) => i.id !== id),
				})),

			updateQuantity: (id, quantity) =>
				set((state) => ({
					items: state.items.map((i) =>
						i.id === id
							? { ...i, quantity: Math.max(1, Math.floor(quantity || 1)) }
							: i,
					),
				})),

			updateVariant: (oldItemId, newVariant) =>
				set((state) => {
					const oldItemIndex = state.items.findIndex((i) => i.id === oldItemId)
					if (oldItemIndex === -1) return state

					const oldItem = state.items[oldItemIndex]
					const newVariantId = newVariant.variantId
					const baseProductId = oldItem.productId || oldItem.slug || ''
					const newCartItemId =
						baseProductId && newVariantId
							? `${baseProductId}_${newVariantId}`
							: newVariant.sku || newVariantId || oldItemId

					const baseTitle =
						oldItem.productTitle ||
						oldItem.title.replace(/\s*\([^)]*\)$/, '').trim()
					const newTitle =
						newVariant.title ||
						(newVariant.variantTitle
							? `${baseTitle} (${newVariant.variantTitle})`
							: baseTitle)
					const targetQuantity =
						typeof newVariant.quantity === 'number' && newVariant.quantity > 0
							? newVariant.quantity
							: oldItem.quantity

					// Nếu ID mới trùng với 1 item khác đã có trong giỏ hàng -> Gộp số lượng và xóa dòng cũ
					if (newCartItemId !== oldItemId) {
						const existingSameVariantIndex = state.items.findIndex(
							(i) => i.id === newCartItemId,
						)
						if (existingSameVariantIndex !== -1) {
							const updatedItems = [...state.items]
							updatedItems[existingSameVariantIndex] = {
								...updatedItems[existingSameVariantIndex],
								quantity:
									updatedItems[existingSameVariantIndex].quantity +
									targetQuantity,
								price: newVariant.price,
								compareAtPrice:
									newVariant.compareAtPrice ??
									updatedItems[existingSameVariantIndex].compareAtPrice,
								image:
									newVariant.image ||
									updatedItems[existingSameVariantIndex].image,
							}
							return {
								items: updatedItems.filter((_, idx) => idx !== oldItemIndex),
							}
						}
					}

					// Cập nhật ngay tại dòng hiện tại
					const updatedItems = [...state.items]
					updatedItems[oldItemIndex] = {
						...oldItem,
						id: newCartItemId,
						variantId: newVariantId,
						variantTitle: newVariant.variantTitle,
						selectedOptions:
							newVariant.selectedOptions || oldItem.selectedOptions,
						sku: newVariant.sku || oldItem.sku,
						title: newTitle,
						productTitle: baseTitle,
						price: newVariant.price,
						compareAtPrice: newVariant.compareAtPrice,
						image: newVariant.image || oldItem.image,
						quantity: targetQuantity,
					}

					return { items: updatedItems }
				}),

			updateItemData: (id, data) =>
				set((state) => ({
					items: state.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
				})),

			clearCart: () => set({ items: [] }),

			totalPrice: () =>
				get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
		}),
		{
			name: 'cart-storage',
			version: 1,
		},
	),
)

