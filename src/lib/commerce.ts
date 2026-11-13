import type { Product, ProductVariant } from '@/sanity/types'

export class CommerceError extends Error {}
export type PurchaseMode = 'sample' | 'direct' | 'wholesale_rfq'
export interface RequestedItem { productId: string; variantId?: string; quantity: number }
export type CatalogProduct = Pick<Product, '_id' | 'title' | 'sku' | 'price' | 'currency' | 'inStock' | 'moq' | 'priceTiers' | 'conversionType'> & { variants?: Array<ProductVariant & { _key: string }> }
export function textField(value: unknown, name: string, required = false, max = 250): string {
	if (value == null && !required) return ''
	if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new CommerceError(`Invalid ${name}`)
	return value.trim()
}
export function requestedItems(input: unknown): RequestedItem[] {
	if (!Array.isArray(input) || input.length === 0 || input.length > 100) throw new CommerceError('Cart must contain 1–100 items')
	const result = new Map<string, RequestedItem>()
	for (const raw of input) {
		if (!raw || !Number.isSafeInteger(raw.quantity) || raw.quantity < 1 || raw.quantity > 100000) throw new CommerceError('Invalid item quantity')
		const productId = textField(raw.productId, 'productId', true, 150)
		const variantId = textField(raw.variantId, 'variantId', false, 150)
		if (productId.startsWith('drafts.')) throw new CommerceError('Unpublished product')
		const key = JSON.stringify([productId, variantId])
		const quantity = (result.get(key)?.quantity || 0) + raw.quantity
		if (quantity > 100000) throw new CommerceError('Quantity exceeds limit')
		result.set(key, { productId, variantId: variantId || undefined, quantity })
	}
	return [...result.values()]
}
function cents(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 10000000) throw new CommerceError('Invalid configured price')
	return Math.round(value * 100)
}
export function priceOrder(items: RequestedItem[], products: CatalogProduct[], mode: PurchaseMode, shipping: number, incoterm: string) {
	const pooled = new Map<string, number>()
	items.forEach(i => pooled.set(i.productId, (pooled.get(i.productId) || 0) + i.quantity))
	let customQuote = false
	const lines = items.map(item => {
		const p = products.find(p => p._id === item.productId)
		if (!p) throw new CommerceError('Product unavailable')
		if ((p.currency || 'USD') !== 'USD') throw new CommerceError('Unsupported currency; request consultation')
		if (p.conversionType === 'consultation' || (p.conversionType === 'rfq' && mode === 'direct')) throw new CommerceError('This product requires an inquiry or sample request')
		const variant = item.variantId ? p.variants?.find(v => v._key === item.variantId) : undefined
		if ((item.variantId && !variant) || (!item.variantId && p.variants?.length)) throw new CommerceError('Select a valid variant')
		if (variant?.stock != null && item.quantity > variant.stock) throw new CommerceError('Variant stock insufficient')
		const quantity = pooled.get(item.productId)!
		if (mode !== 'sample' && quantity < (p.moq || 1)) throw new CommerceError(`Minimum quantity is ${p.moq || 1}`)
		const tier = mode === 'sample' ? undefined : [...(p.priceTiers || [])]
			.filter(t => !t.incoterm || t.incoterm === incoterm)
			.sort((a,b) => (b.minQty || 0) - (a.minQty || 0))
			.find(t => quantity >= (t.minQty || 1) && (!t.maxQty || quantity <= t.maxQty))
		if (tier?.isCustomQuote && mode !== 'wholesale_rfq') throw new CommerceError('Custom tier requires an RFQ')
		const pending = Boolean(tier?.isCustomQuote) || (mode === 'wholesale_rfq' && p.price == null && variant?.price == null)
		customQuote ||= pending
		const unit = pending ? 0 : cents(tier?.unitPrice ?? variant?.price ?? p.price)
		return { productId: p._id, variantId: item.variantId || '', title: p.title || '', sku: variant?.sku || p.sku || '', price: unit / 100, quantity: item.quantity, total: unit * item.quantity / 100, requiresCustomQuote: pending }
	})
	const subtotal = lines.reduce((sum, l) => sum + Math.round(l.total * 100), 0)
	const shippingCents = mode === 'wholesale_rfq' ? 0 : cents(shipping)
	if (!Number.isSafeInteger(subtotal + shippingCents)) throw new CommerceError('Order amount exceeds limit')
	return { lines, subtotal: subtotal / 100, shipping: shippingCents / 100, total: (subtotal + shippingCents) / 100, customQuote }
}
