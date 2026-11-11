export class DomainValidationError extends Error {
	status: number
	constructor(message: string, status = 400) {
		super(message)
		this.name = 'DomainValidationError'
		this.status = status
	}
}

export const ORDER_INTENTS = ['direct', 'sample', 'wholesale_rfq'] as const
export type OrderIntent = (typeof ORDER_INTENTS)[number]

export const FULFILLMENT_STATUSES = [
	'pending',
	'confirmed',
	'processing',
	'shipping',
	'delivered',
	'cancelled',
] as const
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number]

export const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_METHODS = [
	'cod',
	'bank_transfer',
	'wire_tt',
	'lc',
	'card',
	'manual',
] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const ADMIN_MUTABLE_QUOTE_STATUSES = [
	'draft',
	'pending',
	'sent',
	'negotiating',
	'rejected',
	'cancelled',
] as const

export const ALL_QUOTE_STATUSES = [
	'draft',
	'pending',
	'sent',
	'viewed',
	'negotiating',
	'revision_requested',
	'approved',
	'rejected',
	'expired',
	'cancelled',
] as const
export type QuoteStatus = (typeof ALL_QUOTE_STATUSES)[number]

export const INCOTERMS_2020 = [
	'EXW',
	'FCA',
	'CPT',
	'CIP',
	'DAP',
	'DPU',
	'DDP',
	'FAS',
	'FOB',
	'CFR',
	'CIF',
] as const

export const MAX_BULK_ORDER_IDS = 50
export const MAX_MONEY_CENTS = 1_000_000_000 // $10,000,000.00

const FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, ReadonlySet<FulfillmentStatus>> = {
	pending: new Set(['pending', 'confirmed', 'processing', 'shipping', 'cancelled']),
	confirmed: new Set(['confirmed', 'processing', 'shipping', 'delivered', 'cancelled']),
	processing: new Set(['processing', 'shipping', 'delivered', 'cancelled']),
	shipping: new Set(['shipping', 'delivered', 'cancelled']),
	delivered: new Set(['delivered']),
	cancelled: new Set(['cancelled']),
}

const ADMIN_QUOTE_TRANSITIONS: Record<QuoteStatus, ReadonlySet<QuoteStatus>> = {
	pending: new Set(['pending', 'draft', 'sent', 'rejected', 'cancelled']),
	draft: new Set(['draft', 'pending', 'sent', 'rejected', 'cancelled']),
	sent: new Set(['sent', 'draft', 'negotiating', 'rejected', 'cancelled']),
	viewed: new Set(['viewed', 'draft', 'negotiating', 'rejected', 'cancelled']),
	negotiating: new Set(['negotiating', 'draft', 'sent', 'rejected', 'cancelled']),
	revision_requested: new Set(['revision_requested', 'draft', 'sent', 'rejected', 'cancelled']),
	expired: new Set(['expired', 'draft', 'rejected', 'cancelled']),
	rejected: new Set(['rejected', 'draft', 'cancelled']),
	approved: new Set(['approved']),
	cancelled: new Set(['cancelled']),
}

export function normalizeEnum<T extends string>(
	raw: unknown,
	allowed: readonly T[],
	fieldName: string,
): T {
	if (typeof raw !== 'string') {
		throw new DomainValidationError(`Invalid ${fieldName}`, 400)
	}
	const val = raw.trim().toLowerCase() as T
	if (!allowed.includes(val)) {
		throw new DomainValidationError(`Unsupported ${fieldName}: ${raw}`, 400)
	}
	return val
}

export function canTransitionFulfillment(from: string, to: FulfillmentStatus): boolean {
	const current = (from || 'pending').toLowerCase() as FulfillmentStatus
	const allowed = FULFILLMENT_TRANSITIONS[current]
	return Boolean(allowed && allowed.has(to))
}

export function canTransitionAdminQuote(from: string | null | undefined, to: QuoteStatus): boolean {
	const current = (from || 'pending').toLowerCase() as QuoteStatus
	const allowed = ADMIN_QUOTE_TRANSITIONS[current]
	return Boolean(allowed && allowed.has(to))
}

export function toCents(value: unknown, fieldName: string): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new DomainValidationError(`Invalid numeric amount for ${fieldName}`, 400)
	}
	if (value < 0) {
		throw new DomainValidationError(`${fieldName} cannot be negative`, 422)
	}
	const cents = Math.round(value * 100)
	if (!Number.isSafeInteger(cents) || cents > MAX_MONEY_CENTS) {
		throw new DomainValidationError(`${fieldName} exceeds supported limit`, 400)
	}
	return cents
}

export function fromCents(cents: number): number {
	return Math.round(cents) / 100
}

export function cleanOptionalText(value: unknown, fieldName: string, maxLen = 250): string | null {
	if (value === null || value === undefined || value === '') return null
	if (typeof value !== 'string') {
		throw new DomainValidationError(`Invalid text for ${fieldName}`, 400)
	}
	const trimmed = value.trim()
	if (trimmed.length > maxLen) {
		throw new DomainValidationError(`${fieldName} exceeds ${maxLen} characters`, 400)
	}
	return trimmed || null
}

export interface NormalizedOrderLine {
	productId: string
	variantId?: string
	title: string
	sku: string
	price: number
	quantity: number
	total: number
	image?: string
	selectedOptions?: unknown
	requiresCustomQuote?: boolean
}

export function validateAndPriceOrderLines(
	rawItems: unknown,
	options: { requirePositivePrice?: boolean } = {},
): {
	lines: NormalizedOrderLine[]
	subtotalCents: number
	hasUnpricedItems: boolean
} {
	if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 100) {
		throw new DomainValidationError('Order must contain 1–100 line items', 400)
	}

	let subtotalCents = 0
	let hasUnpricedItems = false

	const lines: NormalizedOrderLine[] = rawItems.map((raw, idx) => {
		if (!raw || typeof raw !== 'object') {
			throw new DomainValidationError(`Invalid line item at index ${idx}`, 400)
		}
		const item = raw as Record<string, unknown>
		const title = cleanOptionalText(item.title, `items[${idx}].title`, 250)
		if (!title) {
			throw new DomainValidationError(`Line item #${idx + 1} requires a title`, 400)
		}
		const productId = cleanOptionalText(item.productId || item.id, `items[${idx}].productId`, 150) || `custom-${idx + 1}`
		const variantId = cleanOptionalText(item.variantId, `items[${idx}].variantId`, 150) || undefined
		const sku = cleanOptionalText(item.sku, `items[${idx}].sku`, 100) || ''
		const image = cleanOptionalText(item.image, `items[${idx}].image`, 1000) || undefined

		const quantity = item.quantity
		if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
			throw new DomainValidationError(`Invalid quantity for line item "${title}"`, 400)
		}

		const unitCents = toCents(item.price, `items[${idx}].price`)
		if (unitCents === 0) {
			hasUnpricedItems = true
			if (options.requirePositivePrice) {
				throw new DomainValidationError(
					`Line item "${title}" must have a unit price greater than 0 before issuing quotation`,
					422,
				)
			}
		}

		const lineTotalCents = unitCents * quantity
		if (!Number.isSafeInteger(lineTotalCents) || lineTotalCents > MAX_MONEY_CENTS) {
			throw new DomainValidationError(`Line total exceeds limit for "${title}"`, 400)
		}
		subtotalCents += lineTotalCents
		if (!Number.isSafeInteger(subtotalCents) || subtotalCents > MAX_MONEY_CENTS) {
			throw new DomainValidationError('Order subtotal exceeds limit', 400)
		}

		const line: NormalizedOrderLine = {
			productId,
			...(variantId ? { variantId } : {}),
			title,
			sku,
			price: fromCents(unitCents),
			quantity,
			total: fromCents(lineTotalCents),
			...(image ? { image } : {}),
			...(item.selectedOptions ? { selectedOptions: item.selectedOptions } : {}),
			requiresCustomQuote: unitCents === 0,
		}
		return line
	})

	return { lines, subtotalCents, hasUnpricedItems }
}

export function deriveOrderTotals(input: {
	subtotalCents: number
	shippingCents: number
	discountCents: number
}): { subtotal: number; shippingFee: number; discount: number; total: number; totalCents: number } {
	const { subtotalCents, shippingCents, discountCents } = input
	if (discountCents > subtotalCents + shippingCents) {
		throw new DomainValidationError('Discount cannot exceed subtotal plus shipping fee', 422)
	}
	const totalCents = subtotalCents + shippingCents - discountCents
	if (!Number.isSafeInteger(totalCents) || totalCents < 0 || totalCents > MAX_MONEY_CENTS) {
		throw new DomainValidationError('Derived order total is out of range', 422)
	}
	return {
		subtotal: fromCents(subtotalCents),
		shippingFee: fromCents(shippingCents),
		discount: fromCents(discountCents),
		total: fromCents(totalCents),
		totalCents,
	}
}

export function derivePaymentStatus(
	paidCents: number,
	totalCents: number,
	lastKind?: 'payment' | 'refund',
): PaymentStatus {
	if (paidCents <= 0) {
		return lastKind === 'refund' ? 'refunded' : 'unpaid'
	}
	if (totalCents > 0 && paidCents < totalCents) {
		return 'partial'
	}
	return 'paid'
}

export function resolveOrderIntent(order: {
	order_intent?: string | null
	order_number?: string | null
	quote_status?: string | null
}): OrderIntent {
	if (order.order_intent === 'wholesale_rfq' || order.order_intent === 'sample' || order.order_intent === 'direct') {
		return order.order_intent
	}
	if (order.order_number?.startsWith('RFQ-') || order.quote_status) {
		return 'wholesale_rfq'
	}
	return 'direct'
}

export interface OrderDeletionEligibility {
	eligible: boolean
	reason?: string
	code?: 'already_deleted' | 'has_payment' | 'quote_approved' | 'in_delivery'
}

export function getOrderDeletionEligibility(
	order: {
		paid_cents?: number | null
		payment_status?: string | null
		quote_status?: string | null
		quote_approved_at?: string | null
		fulfillment_status?: string | null
		deleted_at?: string | null
	},
	paymentLedgerCount = 0,
): OrderDeletionEligibility {
	if (order.deleted_at) {
		return {
			eligible: false,
			code: 'already_deleted',
			reason: 'Order has already been deleted.',
		}
	}

	const paidCents = Number(order.paid_cents) || 0
	const paymentStatus = (order.payment_status || 'unpaid').trim().toLowerCase()
	if (paidCents > 0 || paymentLedgerCount > 0 || ['partial', 'paid', 'refunded'].includes(paymentStatus)) {
		return {
			eligible: false,
			code: 'has_payment',
			reason: 'Cannot delete an order that already has recorded payments or non-unpaid payment status.',
		}
	}

	const quoteStatus = (order.quote_status || '').trim().toLowerCase()
	if (quoteStatus === 'approved' || Boolean(order.quote_approved_at)) {
		return {
			eligible: false,
			code: 'quote_approved',
			reason: 'Cannot delete an order whose commercial quotation is already approved.',
		}
	}

	const fulfillmentStatus = (order.fulfillment_status || 'pending').trim().toLowerCase()
	if (['shipping', 'delivered', 'returned'].includes(fulfillmentStatus)) {
		return {
			eligible: false,
			code: 'in_delivery',
			reason: 'Cannot delete an order that is already in transit, delivered, or returned.',
		}
	}

	return { eligible: true }
}

export function getAdminOrderDeletionEligibility(order: {
	paidCents?: number | null
	pricing?: { paidCents?: number | null; paidAmount?: number | null } | null
	paymentStatus?: string | null
	payments?: unknown[] | null
	quoteStatus?: string | null
	quoteApprovedAt?: string | null
	fulfillmentStatus?: string | null
	deletedAt?: string | null
} | null | undefined): OrderDeletionEligibility {
	if (!order) {
		return { eligible: false, reason: 'Order unavailable.' }
	}
	const paidCents =
		Number(order.paidCents ?? order.pricing?.paidCents) ||
		Math.round((Number(order.pricing?.paidAmount) || 0) * 100)
	const paymentCount = Array.isArray(order.payments) ? order.payments.length : 0
	return getOrderDeletionEligibility(
		{
			paid_cents: paidCents,
			payment_status: order.paymentStatus,
			quote_status: order.quoteStatus || null,
			quote_approved_at: order.quoteApprovedAt || null,
			fulfillment_status: order.fulfillmentStatus,
			deleted_at: order.deletedAt || null,
		},
		paymentCount,
	)
}



