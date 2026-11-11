import type { D1Order, D1OrderNote, D1OrderPayment } from './d1'
import { resolveOrderIntent } from './order-domain'

export function parseLegacyNotes(rawNotes: string | null | undefined, fallbackTimestamp: string) {
	if (!rawNotes || !rawNotes.trim()) return []
	return rawNotes
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line, index) => {
			const match = line.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.+)$/)
			if (match) {
				return {
					_key: `legacy-${index}`,
					timestamp: match[1],
					createdAt: match[1],
					author: match[2].trim(),
					note: match[3].trim(),
					content: match[3].trim(),
				}
			}
			return {
				_key: `legacy-${index}`,
				timestamp: fallbackTimestamp,
				createdAt: fallbackTimestamp,
				author: 'Staff',
				note: line,
				content: line,
			}
		})
}

export function formatAdminOrder(
	order: D1Order,
	extras?: {
		notes?: D1OrderNote[]
		payments?: D1OrderPayment[]
	},
) {
	let parsedItems: any[] = []
	try {
		parsedItems = JSON.parse(order.items_json || '[]')
	} catch {
		parsedItems = []
	}
	let trade: Record<string, any> = {}
	try {
		trade = JSON.parse(order.commerce_json || '{}') || {}
	} catch {
		trade = {}
	}

	const orderIntent = resolveOrderIntent(order)
	const trackingCodeClean = order.tracking_code || ''
	const legacyNotes = parseLegacyNotes(order.internal_notes, order.updated_at)
	const structuredNotes = (extras?.notes || []).map((n) => ({
		_key: n.id,
		author: n.author_name,
		note: n.content,
		content: n.content,
		createdAt: n.created_at,
		timestamp: n.created_at,
	}))
	const combinedNotes = [...legacyNotes, ...structuredNotes]
	const paidCents = Number(order.paid_cents) || (order.payment_status === 'paid' ? Math.round((Number(order.total) || 0) * 100) : 0)

	return {
		_id: order.id,
		_createdAt: order.created_at,
		_updatedAt: order.updated_at,
		deletedAt: order.deleted_at || null,
		version: order.version ?? 1,
		orderIntent,
		orderId: order.order_number,
		customer: {
			name: order.customer_name,
			email: order.customer_email,
			phone: order.customer_phone || '',
			address: order.shipping_address,
			city: order.shipping_city || '',
			state: order.shipping_state || '',
			postalCode: order.shipping_postal_code || '',
			country: order.shipping_country,
		},
		companyName: trade.company || '',
		taxId: trade.taxId || '',
		incoterm: trade.incoterm || '',
		portOfDestination: trade.port || '',
		targetDeliveryDate: trade.targetDate || '',
		deliveryTerms: trade.deliveryTerms || '',
		customQuote: Boolean(trade.customQuote) || parsedItems.some((it) => Number(it.price) <= 0),
		items: parsedItems,
		pricing: {
			subtotal: order.subtotal,
			shippingFee: order.shipping_fee,
			discount: order.discount,
			grandTotal: order.total,
			currency: order.currency || 'USD',
			paidAmount: Math.round(paidCents) / 100,
			paidCents,
		},
		total: order.total,
		paidCents,
		payments: (extras?.payments || []).map((p) => ({
			id: p.id,
			amount: p.amount_cents / 100,
			amountCents: p.amount_cents,
			currency: p.currency,
			method: p.method,
			reference: p.reference,
			kind: p.kind,
			actorName: p.actor_name,
			notes: p.notes || '',
			createdAt: p.created_at,
		})),
		paymentMethod: (order.payment_method || 'manual').toUpperCase(),
		paymentStatus: (order.payment_status || 'unpaid').toUpperCase(),
		fulfillmentStatus: (order.fulfillment_status || 'pending').toUpperCase(),
		carrier: trackingCodeClean.includes(': ')
			? trackingCodeClean.split(': ')[0]
			: trackingCodeClean
				? 'Express Courier'
				: '',
		trackingCode: trackingCodeClean.includes(': ')
			? trackingCodeClean.split(': ')[1]
			: trackingCodeClean,
		paymentTerms: orderIntent === 'wholesale_rfq' ? order.payment_terms || '' : '',
		quoteStatus:
			orderIntent === 'wholesale_rfq'
				? (order.quote_status || 'pending').toUpperCase()
				: '',
		quoteApprovedAt: orderIntent === 'wholesale_rfq' ? order.quote_approved_at || null : null,
		quoteApprovedBy: orderIntent === 'wholesale_rfq' ? order.quote_approved_by || '' : '',
		quoteValidUntil: orderIntent === 'wholesale_rfq' ? order.quote_valid_until || null : null,
		utmSource: order.utm_source || '',
		utmCampaign: order.utm_campaign || '',
		utmMedium: order.utm_medium || '',
		clickId: order.click_id || '',
		customerNote: order.customer_note || '',
		internalNotes: combinedNotes,
	}
}
