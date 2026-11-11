import type { Product, ProductVariant } from '@/sanity/types'
import { formatCurrency } from './utils'

type PricingProduct = Pick<
	Product,
	| 'price'
	| 'compareAtPrice'
	| 'currency'
	| 'pricingModel'
	| 'maxPrice'
	| 'priceTiers'
> & {
	variants?: Array<Pick<ProductVariant, 'price' | 'compareAtPrice'>> | null
}

const isPrice = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value) && value >= 0

/** Legacy products use the storefront default USD; explicit currencies take precedence. */
export function getProductPricing(
	product: PricingProduct,
	variant?: Pick<ProductVariant, 'price' | 'compareAtPrice'> | null,
) {
	const currency = product.currency?.trim().toUpperCase() || 'USD'
	const hasCurrency = Boolean(currency && /^[A-Z]{3}$/.test(currency))
	let price = isPrice(variant?.price)
		? variant.price
		: isPrice(product.price)
			? product.price
			: 0
	let compareAtPrice = variant
		? (variant.compareAtPrice ?? product.compareAtPrice)
		: product.compareAtPrice
	let maxPrice = price
	let from = product.pricingModel === 'starting_at'
	let hasConfiguredPrice = isPrice(variant?.price) || isPrice(product.price)

	if (!variant && product.variants?.length) {
		const prices = product.variants
			.map((v) => (isPrice(v.price) ? v.price : product.price))
			.filter(isPrice)
		if (prices.length) {
			price = Math.min(...prices)
			maxPrice = Math.max(...prices)
			hasConfiguredPrice = true
			from ||= maxPrice > price
			// A single comparison price cannot represent several differently priced variants.
			compareAtPrice =
				maxPrice === price
					? (product.variants[0]?.compareAtPrice ?? product.compareAtPrice)
					: undefined
		}
	} else if (!variant && product.pricingModel === 'tiered') {
		const prices = (product.priceTiers ?? [])
			.filter((t) => !t.isCustomQuote)
			.map((t) => t.unitPrice)
			.filter(isPrice)
		if (prices.length) {
			price = Math.min(...prices)
			hasConfiguredPrice = true
		}
		from = true
		compareAtPrice = undefined
	}

	const range =
		!variant &&
		product.pricingModel === 'range' &&
		isPrice(product.maxPrice) &&
		product.maxPrice > price
	const hidden =
		product.pricingModel === 'quote_only' || !hasConfiguredPrice || !hasCurrency
	const label = hidden
		? 'Request Quote'
		: range
			? `${formatCurrency(price, currency)} – ${formatCurrency(product.maxPrice, currency)}`
			: `${from && !variant ? 'From ' : ''}${formatCurrency(price, currency)}`
	const hasSale =
		!hidden &&
		!range &&
		!from &&
		isPrice(compareAtPrice) &&
		compareAtPrice > price
	return { price, compareAtPrice, label, hasSale, hidden }
}
