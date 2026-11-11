import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { scheduleBackgroundTask } from '@/lib/cf-env'
import { d1Query, ordersDb } from '@/lib/d1'
import { CommerceError, priceOrder, requestedItems, textField, type CatalogProduct, type PurchaseMode } from '@/lib/commerce'
import { parseAttributionCookie } from '@/lib/attribution'
import { drainOutbox } from '@/lib/outbox'
import { takeRateLimit } from '@/lib/rate-limit'
import { client } from '@/sanity/lib/client'

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const key = request.headers.get('Idempotency-Key')
		if (!key || !/^[a-zA-Z0-9_-]{16,128}$/.test(key)) throw new CommerceError('A valid idempotency key is required')
		const mode: PurchaseMode = body.mode
		if (!['direct', 'sample', 'wholesale_rfq'].includes(mode)) throw new CommerceError('Invalid purchase mode')
		const items = requestedItems(body.itemsDetail)
		const name = textField(body.name, 'name', true)
		const email = textField(body.email, 'email', false, 254)
		const phone = textField(body.phone, 'phone', false, 40)
		if ((!email && !phone) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new CommerceError('Valid contact details required')
		const address = textField(body.shippingAddress, 'shippingAddress', true, 1000)
		const country = textField(body.shippingCountry, 'shippingCountry', true, 100)
		const city = textField(body.shippingCity, 'shippingCity')
		const state = textField(body.shippingState, 'shippingState')
		const postal = textField(body.shippingPostalCode, 'shippingPostalCode', false, 30)
		const apartment = textField(body.shippingApartment, 'shippingApartment')
		const note = textField(body.note, 'note', false, 4000)
		const trade = { mode, company: textField(body.companyName, 'companyName'), taxId: textField(body.taxId, 'taxId'),
			incoterm: textField(body.incoterm || 'FOB', 'incoterm'), incotermVersion: '2020',
			port: textField(body.portOfDestination, 'portOfDestination'), targetDate: textField(body.targetDeliveryDate, 'targetDeliveryDate'),
			customization: textField(body.customizationRequirements, 'customizationRequirements', false, 4000) }
		if (!['EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'].includes(trade.incoterm)) throw new CommerceError('Invalid Incoterm')
		const hash = createHash('sha256').update(JSON.stringify({items, name, email, phone, address, country, city, state, postal, apartment, note, trade})).digest('hex')
		const id = `ord_${createHash('sha256').update(key).digest('hex')}`

		// Always satisfy idempotent retries BEFORE rate limiting so valid retries never get throttled (DF-019)
		const existing = await ordersDb.getById(id, { includeDeleted: true })
		if (existing) {
			if (existing.deleted_at) {
				return NextResponse.json(
					{ success: false, message: 'This submission reference was deleted and cannot be replayed. Please refresh and submit a new order.' },
					{ status: 409 },
				)
			}
			if (existing.request_hash !== hash) return NextResponse.json({ success: false, message: 'Idempotency key already used for another request' }, { status: 409 })
			return NextResponse.json({
				success: true,
				orderId: existing.order_number,
				id,
				total: existing.total,
				mode: existing.order_intent || mode,
				customQuote: Boolean(existing.commerce_json && JSON.parse(existing.commerce_json).customQuote),
			})
		}

		// Multi-dimensional abuse controls on new order creation (DF-019)
		const clientIp = (request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '')
			.split(',')[0]
			.trim()
		const rateQuery = typeof d1Query === 'function' ? d1Query : undefined
		if (clientIp && rateQuery && !(await takeRateLimit('order-ip', clientIp, 20, 3600, rateQuery))) {
			return NextResponse.json(
				{ success: false, message: 'Too many order submissions from this network. Please wait before submitting again.' },
				{ status: 429 },
			)
		}
		if (rateQuery && !(await takeRateLimit('order-contact', (email || phone).toLowerCase(), 8, 3600, rateQuery))) {
			return NextResponse.json(
				{ success: false, message: 'Too many submissions for this contact. Please contact support or wait briefly.' },
				{ status: 429 },
			)
		}

		const products = await client.withConfig({ useCdn: false, perspective: 'published', stega: false }).fetch<CatalogProduct[]>(
			`*[_type == 'product' && _id in $ids && !(_id in path('drafts.**'))]{_id,title,sku,price,currency,inStock,moq,priceTiers,conversionType,variants}`,
			{ ids: items.map(i => i.productId) })
		const settings = await client.withConfig({ useCdn: false, stega: false }).fetch<{priceShipping?: number} | null>(`*[_type == 'checkout-settings'][0]{priceShipping}`)
		const priced = priceOrder(items, products, mode, settings?.priceShipping || 0, trade.incoterm)

		// Explicit price-change confirmation when client submits expectedTotal + requirePriceMatch (DF-012)
		if (body.requirePriceMatch === true) {
			const expectedTotalCents =
				typeof body.expectedTotal === 'number' && Number.isFinite(body.expectedTotal)
					? Math.round(body.expectedTotal * 100)
					: -1
			const serverTotalCents = Math.round(priced.total * 100)
			if (expectedTotalCents !== serverTotalCents || Boolean(body.expectedCustomQuote) !== priced.customQuote) {
				return NextResponse.json(
					{
						success: false,
						priceChanged: true,
						message: 'Product pricing or shipping updated on server. Please confirm the updated total before submitting.',
						serverPricing: {
							subtotal: priced.subtotal,
							shipping: priced.shipping,
							total: priced.total,
							customQuote: priced.customQuote,
							currency: 'USD',
						},
					},
					{ status: 409 },
				)
			}
		}

		const attr = parseAttributionCookie(request.headers.get('cookie'))
		// Keep customer-facing references short while retaining a cryptographically
		// random, collision-resistant identifier. The internal order ID remains unchanged.
		const orderNumber = `${mode === 'wholesale_rfq' ? 'RFQ' : 'ORD'}-${randomBytes(5).toString('hex').toUpperCase()}`
		const receiptToken = randomBytes(24).toString('hex')
		const receiptTokenHash = createHash('sha256').update(receiptToken).digest('hex')

		try {
			await ordersDb.create({ id, request_hash: hash, commerce_json: JSON.stringify({...trade, customQuote: priced.customQuote}), order_intent: mode, receipt_token_hash: receiptTokenHash, order_number: orderNumber,
				customer_name: name, customer_email: email, customer_phone: phone, shipping_address: [address,apartment].filter(Boolean).join(', '),
				shipping_country: country, shipping_city: city, shipping_state: state, shipping_postal_code: postal,
				items_json: JSON.stringify(priced.lines), subtotal: priced.subtotal, shipping_fee: priced.shipping, discount: 0, total: priced.total, currency: 'USD',
				payment_method: mode === 'wholesale_rfq' ? 'manual' : 'cod', payment_status: 'unpaid', fulfillment_status: 'pending',
				quote_status: mode === 'wholesale_rfq' ? 'pending' : null, customer_note: note,
				utm_source: attr?.utm_source, utm_medium: attr?.utm_medium, utm_campaign: attr?.utm_campaign,
				utm_term: attr?.utm_term, utm_content: attr?.click_id ? attr.utm_content : attr?.utm_content, click_id: attr?.click_id })
		} catch (error) {
			const winner = await ordersDb.getById(id, { includeDeleted: true })
			if (winner?.deleted_at) {
				return NextResponse.json(
					{ success: false, message: 'This submission reference was deleted and cannot be replayed.' },
					{ status: 409 },
				)
			}
			if (winner?.request_hash === hash) {
				return NextResponse.json({
					success: true,
					orderId: winner.order_number,
					id,
					total: winner.total,
					mode: winner.order_intent || mode,
				})
			}
			throw error
		}
		// The database trigger commits the delivery job with the order, before acknowledging.
		scheduleBackgroundTask(() => drainOutbox(5))
		return NextResponse.json({
			success: true,
			orderId: orderNumber,
			id,
			total: priced.total,
			subtotal: priced.subtotal,
			shipping: priced.shipping,
			customQuote: priced.customQuote,
			mode,
			receiptToken,
			notificationStatus: 'pending',
		})
	} catch (error) {
		const invalid = error instanceof CommerceError || error instanceof SyntaxError
		return NextResponse.json({ success: false, message: invalid ? (error as Error).message : 'Order service unavailable. Retry with the same submission.' }, { status: invalid ? 400 : 503 })
	}
}
