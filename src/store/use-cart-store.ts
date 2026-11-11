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

export type PriceTier = {
	minQty: number
	maxQty?: number
	unitPrice: number
	incoterm?: string
	discountPercent?: number
	isCustomQuote?: boolean
	badge?: string
}

export type CartMode = 'sample' | 'wholesale_rfq' | 'direct' | 'rfq'

export type TierUpsellInfo = {
	currentTier?: PriceTier
	nextTier?: PriceTier
	unitsNeeded?: number
	isTierActive: boolean
	savingsPercent?: number
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
	samplePrice?: number
	compareAtPrice?: number
	slug?: string
	quantity: number
	image: any
	hasVariants?: boolean
	options?: ProductOption[]
	variants?: ProductVariant[]
	moq?: number
	priceTiers?: PriceTier[]
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

export type MoqDeficit = {
	productId: string
	title: string
	current: number
	moq: number
	shortfall: number
}

type CartState = {
	items: CartItem[]
	mode: CartMode
	setMode: (mode: CartMode) => void
	addItem: (item: CartItem) => void
	removeItem: (id: string) => void
	updateQuantity: (id: string, quantity: number) => void
	updateVariant: (oldItemId: string, newVariant: UpdateVariantPayload) => void
	updateItemData: (id: string, data: Partial<CartItem>) => void
	clearCart: () => void
	getProductPooledQuantity: (productId?: string) => number
	getItemEffectivePrice: (item: CartItem) => number
	getItemTierUpsell: (item: CartItem) => TierUpsellInfo
	getMoqValidation: () => { isQualified: boolean; deficits: MoqDeficit[] }
	roundUpToMoq: () => void
	totalPrice: () => number
	totalItemsCount: () => number
}

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],
			mode: 'direct',

			setMode: (mode) => set({ mode }),

			getProductPooledQuantity: (productId?: string) => {
				if (!productId) return 0
				const { items } = get()
				return items
					.filter(
						(i) =>
							i.productId === productId ||
							i.slug === productId ||
							i.id.startsWith(`${productId}_`),
					)
					.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
			},

			getItemEffectivePrice: (item: CartItem) => {
				const { getProductPooledQuantity, mode } = get()

				// Auto-resolve volume tiers via variant pooling regardless of mode!
				if (mode !== 'sample' && item.priceTiers && Array.isArray(item.priceTiers) && item.priceTiers.length > 0) {
					const baseKey = item.productId || item.slug || item.id.split('_')[0]
					const pooledQty = getProductPooledQuantity(baseKey) || item.quantity

					// Sort tiers descending by minQty to match highest applicable bracket
					const sortedTiers = [...item.priceTiers].sort((a, b) => b.minQty - a.minQty)
					const matchedTier = sortedTiers.find(
						(tier) =>
							pooledQty >= tier.minQty &&
							(!tier.maxQty || pooledQty <= tier.maxQty),
					)

					if (matchedTier && !matchedTier.isCustomQuote && typeof matchedTier.unitPrice === 'number') {
						return matchedTier.unitPrice
					}
				}

				return item.price
			},

			getItemTierUpsell: (item: CartItem): TierUpsellInfo => {
				const { getProductPooledQuantity } = get()
				if (!item.priceTiers || !Array.isArray(item.priceTiers) || item.priceTiers.length === 0) {
					return { isTierActive: false }
				}

				const baseKey = item.productId || item.slug || item.id.split('_')[0]
				const pooledQty = getProductPooledQuantity(baseKey) || item.quantity

				const sortedAsc = [...item.priceTiers].sort((a, b) => a.minQty - b.minQty)
				const sortedDesc = [...item.priceTiers].sort((a, b) => b.minQty - a.minQty)

				const currentTier = sortedDesc.find(
					(tier) =>
						pooledQty >= tier.minQty &&
						(!tier.maxQty || pooledQty <= tier.maxQty),
				)

				const nextTier = sortedAsc.find((tier) => tier.minQty > pooledQty)
				const unitsNeeded = nextTier ? nextTier.minQty - pooledQty : undefined
				const isTierActive = Boolean(currentTier)

				let savingsPercent: number | undefined
				if (nextTier && typeof nextTier.unitPrice === 'number') {
					const basePrice = item.samplePrice ?? item.price
					if (basePrice > 0 && nextTier.unitPrice < basePrice) {
						savingsPercent = Math.round(((basePrice - nextTier.unitPrice) / basePrice) * 100)
					}
				}

				return {
					currentTier,
					nextTier,
					unitsNeeded,
					isTierActive,
					savingsPercent,
				}
			},

			getMoqValidation: () => {
				const { items, getProductPooledQuantity, mode } = get()
				if (items.length === 0 || mode === 'sample') {
					return { isQualified: true, deficits: [] }
				}

				const productGroups = new Map<string, { title: string; moq: number }>()

				items.forEach((item) => {
					const baseKey = item.productId || item.slug || item.id.split('_')[0]
					const moq = Math.max(1, Number(item.moq) || 1)
					if (!productGroups.has(baseKey)) {
						productGroups.set(baseKey, {
							title: item.productTitle || item.title.replace(/\s*\([^)]*\)$/, ''),
							moq,
						})
					} else {
						const existing = productGroups.get(baseKey)!
						if (moq > existing.moq) {
							existing.moq = moq
						}
					}
				})

				const deficits: MoqDeficit[] = []

				productGroups.forEach((val, baseKey) => {
					if (val.moq > 1) {
						const current = getProductPooledQuantity(baseKey)
						if (current < val.moq) {
							deficits.push({
								productId: baseKey,
								title: val.title,
								current,
								moq: val.moq,
								shortfall: val.moq - current,
							})
						}
					}
				})

				return {
					isQualified: deficits.length === 0,
					deficits,
				}
			},

			roundUpToMoq: () => {
				const { items, getMoqValidation } = get()
				const { deficits } = getMoqValidation()
				if (deficits.length === 0) return

				const updatedItems = [...items]

				deficits.forEach((def) => {
					// Find the last item belonging to this product group and add the shortfall
					for (let i = updatedItems.length - 1; i >= 0; i--) {
						const item = updatedItems[i]
						const baseKey = item.productId || item.slug || item.id.split('_')[0]
						if (baseKey === def.productId) {
							updatedItems[i] = {
								...item,
								quantity: item.quantity + def.shortfall,
							}
							break
						}
					}
				})

				set({ items: updatedItems })
			},

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
											moq: item.moq ?? i.moq,
											samplePrice: item.samplePrice ?? i.samplePrice,
											priceTiers: item.priceTiers ?? i.priceTiers,
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

					// If new ID matches another existing item in cart -> merge quantities and remove old line item
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

					// Update existing line item in place
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

			totalPrice: () => {
				const { items, getItemEffectivePrice } = get()
				return items.reduce((sum, item) => sum + getItemEffectivePrice(item) * item.quantity, 0)
			},

			totalItemsCount: () => {
				return get().items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
			},
		}),
		{
			name: 'cart-storage',
			version: 2,
			migrate: (persistedState: any, version: number) => {
				if (version === 1) {
					return {
						...persistedState,
						mode: 'sample',
					}
				}
				return persistedState
			},
		},
	),
)
