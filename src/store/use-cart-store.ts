import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CartItem = {
	id: string
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

					if (existing) {
						return {
							items: state.items.map((i) =>
								i.id === item.id
									? { ...i, quantity: i.quantity + item.quantity }
									: i,
							),
						}
					}

					return { items: [...state.items, item] }
				}),

			removeItem: (id) =>
				set((state) => ({
					items: state.items.filter((i) => i.id !== id),
				})),

			updateQuantity: (id, quantity) =>
				set((state) => ({
					items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
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
