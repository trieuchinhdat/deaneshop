import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
	id: string
	productId?: string
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
}

type CartState = {
	items: CartItem[]
	addItem: (item: CartItem) => void
	removeItem: (id: string) => void
	updateQuantity: (id: string, quantity: number) => void
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
									? { ...i, quantity: i.quantity + validQty }
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
