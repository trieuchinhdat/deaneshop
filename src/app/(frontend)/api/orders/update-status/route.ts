import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { broadcastAdminEvent } from '@/lib/admin-events'
import { formatAdminOrder } from '@/lib/admin-format'
import { scheduleBackgroundTask } from '@/lib/cf-env'
import {
	orderNotesDb,
	orderPaymentsDb,
	ordersDb,
	PersistenceError,
} from '@/lib/d1'
import {
	ADMIN_MUTABLE_QUOTE_STATUSES,
	canTransitionAdminQuote,
	canTransitionFulfillment,
	cleanOptionalText,
	deriveOrderTotals,
	DomainValidationError,
	fromCents,
	FULFILLMENT_STATUSES,
	INCOTERMS_2020,
	MAX_BULK_ORDER_IDS,
	normalizeEnum,
	PAYMENT_STATUSES,
	resolveOrderIntent,
	toCents,
	validateAndPriceOrderLines,
	type FulfillmentStatus,
	type QuoteStatus,
} from '@/lib/order-domain'
import { drainOutbox } from '@/lib/outbox'

function isConflictError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false
	const err = error as { message?: unknown; causeMessage?: unknown }
	const msg = `${typeof err.message === 'string' ? err.message : ''} ${typeof err.causeMessage === 'string' ? err.causeMessage : ''}`
	return /Move an unapproved quote to draft|Approved quote status is immutable|Quote snapshots are immutable/i.test(
		msg,
	)
}

function isDomainTriggerError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false
	const err = error as { message?: unknown; causeMessage?: unknown }
	const msg = `${typeof err.message === 'string' ? err.message : ''} ${typeof err.causeMessage === 'string' ? err.causeMessage : ''}`
	return /Invalid order financial values|Invalid order intent|Invalid payment status|Invalid fulfillment status/i.test(
		msg,
	)
}

export async function POST(request: Request) {
	try {
		const auth = await requireAdminSession(['superadmin', 'admin', 'cskh'])
		if (!auth.ok) {
			return NextResponse.json(
				{ success: false, message: auth.error },
				{ status: auth.status },
			)
		}
		const session = auth.session

		const body = await request.json().catch(() => null)
		if (!body || typeof body !== 'object' || Array.isArray(body)) {
			return NextResponse.json(
				{ success: false, message: 'Invalid JSON request body' },
				{ status: 400 },
			)
		}

		const {
			docId,
			orderId,
			orderIds,
			expectedVersion,
			expectedVersions,
			fulfillmentStatus,
			paymentStatus,
			carrier,
			trackingCode,
			customerName,
			customerPhone,
			customerEmail,
			shippingAddress,
			shippingCity,
			shippingState,
			shippingPostalCode,
			shippingCountry,
			internalNote,
			items,
			shippingFee,
			discount,
			total,
			currency,
			paymentTerms,
			quoteStatus,
			quoteValidUntil,
			incoterm,
			portOfDestination,
			targetDeliveryDate,
			deliveryTerms,
		} = body as Record<string, unknown>

		const finalAuthorName = session.name || 'Staff'
		const noteText = cleanOptionalText(internalNote, 'internalNote', 2000)

		// =========================================================================
		// 1. BULK STATUS UPDATE
		// =========================================================================
		if (orderIds !== undefined) {
			if (!Array.isArray(orderIds) || orderIds.length === 0) {
				return NextResponse.json(
					{ success: false, message: 'orderIds must be a non-empty array' },
					{ status: 400 },
				)
			}
			if (orderIds.length > MAX_BULK_ORDER_IDS) {
				return NextResponse.json(
					{
						success: false,
						message: `Bulk updates are limited to ${MAX_BULK_ORDER_IDS} orders per request`,
					},
					{ status: 400 },
				)
			}

			// Bulk updates strictly reject commercial / payment mutations
			if (
				quoteStatus !== undefined ||
				paymentTerms !== undefined ||
				quoteValidUntil !== undefined ||
				items !== undefined ||
				shippingFee !== undefined ||
				discount !== undefined ||
				total !== undefined
			) {
				return NextResponse.json(
					{
						success: false,
						message:
							'Commercial and pricing fields cannot be modified in bulk updates',
					},
					{ status: 422 },
				)
			}

			if (paymentStatus !== undefined) {
				normalizeEnum(paymentStatus, PAYMENT_STATUSES, 'paymentStatus')
				return NextResponse.json(
					{
						success: false,
						message:
							'Payment status cannot be bulk-overridden without payment ledger transactions',
					},
					{ status: 422 },
				)
			}

			const parsedFulfillment =
				fulfillmentStatus !== undefined
					? normalizeEnum(
							fulfillmentStatus,
							FULFILLMENT_STATUSES,
							'fulfillmentStatus',
						)
					: undefined

			if (!parsedFulfillment && !noteText) {
				return NextResponse.json(
					{
						success: false,
						message: 'Bulk update requires fulfillmentStatus or internalNote',
					},
					{ status: 400 },
				)
			}

			const cleanIds = [
				...new Set(
					orderIds
						.map((id) => (typeof id === 'string' ? id.trim() : ''))
						.filter(Boolean),
				),
			]
			if (cleanIds.length === 0) {
				return NextResponse.json(
					{ success: false, message: 'No valid order IDs provided' },
					{ status: 400 },
				)
			}

			const versionMap =
				expectedVersions &&
				typeof expectedVersions === 'object' &&
				!Array.isArray(expectedVersions)
					? (expectedVersions as Record<string, unknown>)
					: {}

			const results: Array<{
				id: string
				status: 'updated' | 'conflict' | 'not_found' | 'invalid'
				message?: string
				version?: number
			}> = []

			let updatedCount = 0
			let conflictCount = 0
			let notFoundCount = 0
			let failedCount = 0

			for (const id of cleanIds) {
				const existing =
					(await ordersDb.getById(id)) || (await ordersDb.getByOrderNumber(id))
				if (!existing) {
					notFoundCount++
					results.push({ id, status: 'not_found', message: 'Order not found' })
					continue
				}

				const rawExpVer = versionMap[id] ?? versionMap[existing.id]
				const expectedVer =
					rawExpVer !== undefined
						? Number.isSafeInteger(rawExpVer) && Number(rawExpVer) >= 1
							? Number(rawExpVer)
							: -1
						: undefined

				if (expectedVer === -1) {
					failedCount++
					results.push({
						id,
						status: 'invalid',
						message: 'Invalid expectedVersion',
					})
					continue
				}

				const intent = resolveOrderIntent(existing)
				const bulkPatch: Record<string, any> = {}

				if (parsedFulfillment) {
					if (
						!canTransitionFulfillment(
							existing.fulfillment_status,
							parsedFulfillment,
						)
					) {
						failedCount++
						results.push({
							id,
							status: 'invalid',
							message: `Cannot transition fulfillment from ${existing.fulfillment_status} to ${parsedFulfillment}`,
						})
						continue
					}
					if (
						intent === 'wholesale_rfq' &&
						['processing', 'shipping', 'delivered'].includes(
							parsedFulfillment,
						) &&
						existing.quote_status !== 'approved'
					) {
						failedCount++
						results.push({
							id,
							status: 'invalid',
							message:
								'Wholesale RFQ must be approved before fulfillment dispatch',
						})
						continue
					}
					bulkPatch.fulfillment_status = parsedFulfillment
				}

				try {
					const changed = await ordersDb.update(
						existing.id,
						bulkPatch,
						expectedVer,
					)
					if (!changed) {
						conflictCount++
						results.push({
							id,
							status: 'conflict',
							message: 'Order was modified concurrently; refresh and retry',
						})
						continue
					}
					if (noteText) {
						await orderNotesDb.append({
							order_id: existing.id,
							author_id: session.id,
							author_name: finalAuthorName,
							content: noteText,
						})
					}
					updatedCount++
					results.push({
						id,
						status: 'updated',
						version: (existing.version ?? 1) + 1,
					})
				} catch (err: any) {
					if (isConflictError(err)) {
						conflictCount++
						results.push({
							id,
							status: 'conflict',
							message: err?.causeMessage || err?.message,
						})
					} else {
						failedCount++
						results.push({
							id,
							status: 'invalid',
							message: err?.message || 'Update failed',
						})
					}
				}
			}

			if (updatedCount > 0) {
				broadcastAdminEvent('ORDER_UPDATED', {
					ids: results.filter((r) => r.status === 'updated').map((r) => r.id),
					updatedCount,
				})
			}

			const httpStatus =
				updatedCount > 0
					? 200
					: notFoundCount === cleanIds.length
						? 404
						: conflictCount > 0
							? 409
							: 422

			return NextResponse.json(
				{
					success:
						updatedCount > 0 &&
						conflictCount === 0 &&
						failedCount === 0 &&
						notFoundCount === 0,
					partial:
						updatedCount > 0 &&
						(conflictCount > 0 || failedCount > 0 || notFoundCount > 0),
					message: `Processed ${cleanIds.length} orders: ${updatedCount} updated, ${conflictCount} conflicts, ${failedCount + notFoundCount} failed`,
					updatedCount,
					conflictCount,
					failedCount: failedCount + notFoundCount,
					results,
				},
				{ status: httpStatus },
			)
		}

		// =========================================================================
		// 2. SINGLE ORDER / QUOTE MUTATION
		// =========================================================================
		const targetId = cleanOptionalText(
			docId || orderId,
			'order identifier',
			150,
		)
		if (!targetId) {
			return NextResponse.json(
				{
					success: false,
					message: 'Missing order identifier (docId or orderId)',
				},
				{ status: 400 },
			)
		}

		let parsedExpectedVersion: number | undefined
		if (expectedVersion !== undefined && expectedVersion !== null) {
			if (
				typeof expectedVersion !== 'number' ||
				!Number.isSafeInteger(expectedVersion) ||
				expectedVersion < 1
			) {
				return NextResponse.json(
					{ success: false, message: 'Invalid expectedVersion' },
					{ status: 400 },
				)
			}
			parsedExpectedVersion = expectedVersion
		}

		const existing =
			(await ordersDb.getById(targetId)) ||
			(await ordersDb.getByOrderNumber(targetId))
		if (!existing) {
			return NextResponse.json(
				{ success: false, message: 'Order not found' },
				{ status: 404 },
			)
		}

		const intent = resolveOrderIntent(existing)
		const isWholesaleRfq = intent === 'wholesale_rfq'
		const canEditCommercial =
			session.role === 'superadmin' || session.role === 'admin'

		// Reject B2B quotation fields on D2C orders (DF-002)
		const hasQuoteFields =
			quoteStatus !== undefined ||
			paymentTerms !== undefined ||
			quoteValidUntil !== undefined ||
			incoterm !== undefined ||
			portOfDestination !== undefined ||
			targetDeliveryDate !== undefined ||
			deliveryTerms !== undefined

		if (!isWholesaleRfq && (hasQuoteFields || items !== undefined)) {
			return NextResponse.json(
				{
					success: false,
					message:
						'Quotation fields cannot be applied to a D2C direct or sample order',
				},
				{ status: 422 },
			)
		}

		// Validate paymentStatus (DF-001 & DF-003): never mutate directly without ledger
		if (paymentStatus !== undefined) {
			const normalizedPayment = normalizeEnum(
				paymentStatus,
				PAYMENT_STATUSES,
				'paymentStatus',
			)
			if (
				normalizedPayment !==
				(existing.payment_status || 'unpaid').toLowerCase()
			) {
				return NextResponse.json(
					{
						success: false,
						message:
							'Payment status is derived from recorded transactions. Use /api/orders/record-payment instead.',
					},
					{ status: 422 },
				)
			}
		}

		// Validate total if supplied (DF-003): must be finite non-negative; server always derives final total
		let clientSubmittedTotalCents: number | undefined
		if (total !== undefined) {
			clientSubmittedTotalCents = toCents(total, 'total')
		}

		const patch: Record<string, any> = {}

		// Validate fulfillmentStatus + state machine
		if (fulfillmentStatus !== undefined) {
			const nextFulfillment: FulfillmentStatus = normalizeEnum(
				fulfillmentStatus,
				FULFILLMENT_STATUSES,
				'fulfillmentStatus',
			)
			if (
				!canTransitionFulfillment(existing.fulfillment_status, nextFulfillment)
			) {
				return NextResponse.json(
					{
						success: false,
						message: `Invalid fulfillment status transition from "${existing.fulfillment_status}" to "${nextFulfillment}"`,
					},
					{ status: 422 },
				)
			}
			patch.fulfillment_status = nextFulfillment
		}

		// Tracking / Carrier
		if (trackingCode !== undefined || carrier !== undefined) {
			const cleanTracking =
				cleanOptionalText(trackingCode, 'trackingCode', 150) || ''
			const cleanCarrier = cleanOptionalText(carrier, 'carrier', 100) || ''
			if (cleanCarrier && cleanTracking) {
				patch.tracking_code = `${cleanCarrier}: ${cleanTracking}`
			} else if (cleanTracking) {
				patch.tracking_code = cleanTracking
			} else if (cleanCarrier) {
				patch.tracking_code = `${cleanCarrier}: `
			} else if (trackingCode === null || trackingCode === '') {
				patch.tracking_code = null
			}
		}

		// Editable Customer and Shipping Information
		if (customerName !== undefined) {
			const val = cleanOptionalText(customerName, 'customerName', 250)
			if (!val)
				throw new DomainValidationError('Customer name cannot be empty', 400)
			patch.customer_name = val
		}
		if (customerPhone !== undefined)
			patch.customer_phone = cleanOptionalText(
				customerPhone,
				'customerPhone',
				40,
			)
		if (customerEmail !== undefined) {
			const email = cleanOptionalText(customerEmail, 'customerEmail', 254)
			if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				throw new DomainValidationError('Invalid customer email address', 400)
			}
			patch.customer_email = email || ''
		}
		if (shippingAddress !== undefined) {
			const addr = cleanOptionalText(shippingAddress, 'shippingAddress', 1000)
			if (!addr)
				throw new DomainValidationError('Shipping address cannot be empty', 400)
			patch.shipping_address = addr
		}
		if (shippingCity !== undefined)
			patch.shipping_city = cleanOptionalText(shippingCity, 'shippingCity', 250)
		if (shippingState !== undefined)
			patch.shipping_state = cleanOptionalText(
				shippingState,
				'shippingState',
				250,
			)
		if (shippingPostalCode !== undefined)
			patch.shipping_postal_code = cleanOptionalText(
				shippingPostalCode,
				'shippingPostalCode',
				30,
			)
		if (shippingCountry !== undefined) {
			const country = cleanOptionalText(shippingCountry, 'shippingCountry', 100)
			if (!country)
				throw new DomainValidationError('Shipping country cannot be empty', 400)
			patch.shipping_country = country
		}

		// Commercial / Quote Mutations (only for wholesale_rfq + superadmin/admin, OR shipping/discount on D2C by superadmin/admin)
		const hasCommercialFields =
			items !== undefined ||
			shippingFee !== undefined ||
			discount !== undefined ||
			currency !== undefined ||
			hasQuoteFields

		if (hasCommercialFields) {
			// Check if any commercial value actually changed (or if CSKH is attempting to mutate commercial terms)
			let nextQuoteStatus: QuoteStatus | undefined
			if (quoteStatus !== undefined) {
				const rawQs = normalizeEnum(
					quoteStatus,
					[
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
					] as const,
					'quoteStatus',
				)
				const currentQs = (
					existing.quote_status || 'pending'
				).toLowerCase() as QuoteStatus
				if (rawQs !== currentQs) {
					if (!canEditCommercial) {
						return NextResponse.json(
							{
								success: false,
								message:
									'Forbidden: Only Admin/Superadmin can modify quotation status',
							},
							{ status: 403 },
						)
					}
					if (rawQs === 'approved') {
						return NextResponse.json(
							{
								success: false,
								message:
									'Use /api/orders/accept-quote to accept a quotation without marking it paid',
							},
							{ status: 422 },
						)
					}
					if (!ADMIN_MUTABLE_QUOTE_STATUSES.includes(rawQs as any)) {
						return NextResponse.json(
							{
								success: false,
								message: `Unsupported admin quote status: ${rawQs}`,
							},
							{ status: 400 },
						)
					}
					if (currentQs === 'approved') {
						return NextResponse.json(
							{ success: false, message: 'Approved quote status is immutable' },
							{ status: 409 },
						)
					}
					if (!canTransitionAdminQuote(currentQs, rawQs)) {
						return NextResponse.json(
							{
								success: false,
								message: `Cannot transition quote status from "${currentQs}" to "${rawQs}"`,
							},
							{ status: 422 },
						)
					}
					nextQuoteStatus = rawQs
					patch.quote_status = rawQs
				}
			}

			// Commercial pricing & line items
			const existingItemsRaw = JSON.parse(existing.items_json || '[]')
			const existingTrade = JSON.parse(existing.commerce_json || '{}') || {}
			let nextShippingCents = toCents(
				Number(existing.shipping_fee) || 0,
				'shippingFee',
			)
			let nextDiscountCents = toCents(
				Number(existing.discount) || 0,
				'discount',
			)

			if (shippingFee !== undefined) {
				const feeCents = toCents(shippingFee, 'shippingFee')
				if (feeCents !== nextShippingCents) {
					if (!canEditCommercial) {
						return NextResponse.json(
							{
								success: false,
								message:
									'Forbidden: Only Admin/Superadmin can change shipping fee',
							},
							{ status: 403 },
						)
					}
					nextShippingCents = feeCents
					patch.shipping_fee = fromCents(feeCents)
				}
			}

			if (discount !== undefined) {
				const discCents = toCents(discount, 'discount')
				if (discCents !== nextDiscountCents) {
					if (!canEditCommercial) {
						return NextResponse.json(
							{
								success: false,
								message: 'Forbidden: Only Admin/Superadmin can change discount',
							},
							{ status: 403 },
						)
					}
					nextDiscountCents = discCents
					patch.discount = fromCents(discCents)
				}
			}

			if (currency !== undefined) {
				const cur = cleanOptionalText(currency, 'currency', 10)?.toUpperCase()
				if (cur && cur !== 'USD') {
					throw new DomainValidationError(
						'Only USD currency is currently supported',
						422,
					)
				}
				if (cur && cur !== (existing.currency || 'USD').toUpperCase()) {
					patch.currency = cur
				}
			}

			let effectiveLines = existingItemsRaw
			let subtotalCents = toCents(Number(existing.subtotal) || 0, 'subtotal')
			if (items !== undefined) {
				if (!canEditCommercial || !isWholesaleRfq) {
					return NextResponse.json(
						{
							success: false,
							message:
								'Forbidden: Line item pricing can only be edited on B2B RFQ drafts',
						},
						{ status: 403 },
					)
				}
				const parsed = validateAndPriceOrderLines(items, {
					requirePositivePrice: nextQuoteStatus === 'sent',
				})
				effectiveLines = parsed.lines
				subtotalCents = parsed.subtotalCents
				patch.items_json = JSON.stringify(parsed.lines)
				patch.subtotal = fromCents(subtotalCents)
			} else if (nextQuoteStatus === 'sent') {
				const validatedExisting = validateAndPriceOrderLines(existingItemsRaw, {
					requirePositivePrice: true,
				})
				subtotalCents = validatedExisting.subtotalCents
			}

			// Recompute server-derived total whenever pricing fields are supplied
			const pricingTouched =
				items !== undefined ||
				patch.shipping_fee !== undefined ||
				patch.discount !== undefined ||
				clientSubmittedTotalCents !== undefined

			if (pricingTouched) {
				const derived = deriveOrderTotals({
					subtotalCents,
					shippingCents: nextShippingCents,
					discountCents: nextDiscountCents,
				})
				if (
					clientSubmittedTotalCents !== undefined &&
					clientSubmittedTotalCents !== derived.totalCents
				) {
					// On D2C or when client passes mismatched total, reject client override (DF-003)
					throw new DomainValidationError(
						`Submitted total (${fromCents(clientSubmittedTotalCents)}) does not match server-derived total (${derived.total})`,
						422,
					)
				}
				if (
					patch.items_json !== undefined ||
					patch.shipping_fee !== undefined ||
					patch.discount !== undefined ||
					derived.totalCents !== toCents(Number(existing.total) || 0, 'total')
				) {
					if (!canEditCommercial) {
						return NextResponse.json(
							{
								success: false,
								message:
									'Forbidden: Only Admin/Superadmin can alter pricing totals',
							},
							{ status: 403 },
						)
					}
					patch.subtotal = derived.subtotal
					patch.shipping_fee = derived.shippingFee
					patch.discount = derived.discount
					patch.total = derived.total
				}
			}

			// Payment terms & Trade metadata (B2B RFQ)
			if (paymentTerms !== undefined) {
				const nextTerms = cleanOptionalText(paymentTerms, 'paymentTerms', 500)
				if (nextTerms !== (existing.payment_terms || null)) {
					if (!canEditCommercial) {
						return NextResponse.json(
							{
								success: false,
								message:
									'Forbidden: Only Admin/Superadmin can change payment terms',
							},
							{ status: 403 },
						)
					}
					patch.payment_terms = nextTerms
				}
			}

			const nextTrade = { ...existingTrade }
			let tradeChanged = false
			if (incoterm !== undefined) {
				const inc = cleanOptionalText(incoterm, 'incoterm', 20)?.toUpperCase()
				if (inc && !INCOTERMS_2020.includes(inc as any)) {
					throw new DomainValidationError(`Invalid Incoterm: ${inc}`, 400)
				}
				if (inc && inc !== existingTrade.incoterm) {
					nextTrade.incoterm = inc
					tradeChanged = true
				}
			}
			if (portOfDestination !== undefined) {
				const port =
					cleanOptionalText(portOfDestination, 'portOfDestination', 250) || ''
				if (port !== (existingTrade.port || '')) {
					nextTrade.port = port
					tradeChanged = true
				}
			}
			if (targetDeliveryDate !== undefined) {
				const targetDate =
					cleanOptionalText(targetDeliveryDate, 'targetDeliveryDate', 100) || ''
				if (targetDate !== (existingTrade.targetDate || '')) {
					nextTrade.targetDate = targetDate
					tradeChanged = true
				}
			}
			if (deliveryTerms !== undefined) {
				const dt = cleanOptionalText(deliveryTerms, 'deliveryTerms', 1000) || ''
				if (dt !== (existingTrade.deliveryTerms || '')) {
					nextTrade.deliveryTerms = dt
					tradeChanged = true
				}
			}
			if (patch.items_json !== undefined) {
				const stillCustom =
					Array.isArray(effectiveLines) &&
					effectiveLines.some((l: any) => Number(l.price) <= 0)
				if (Boolean(nextTrade.customQuote) !== stillCustom) {
					nextTrade.customQuote = stillCustom
					tradeChanged = true
				}
			}
			if (tradeChanged) {
				if (!canEditCommercial) {
					return NextResponse.json(
						{
							success: false,
							message:
								'Forbidden: Only Admin/Superadmin can modify trade terms',
						},
						{ status: 403 },
					)
				}
				patch.commerce_json = JSON.stringify(nextTrade)
			}

			if (quoteValidUntil !== undefined) {
				const nextValid = cleanOptionalText(
					quoteValidUntil,
					'quoteValidUntil',
					60,
				)
				if (nextValid) {
					const ts = Date.parse(nextValid)
					if (!Number.isFinite(ts)) {
						throw new DomainValidationError(
							'Invalid quoteValidUntil timestamp',
							400,
						)
					}
				}
				if (nextValid !== (existing.quote_valid_until || null)) {
					if (!canEditCommercial) {
						return NextResponse.json(
							{
								success: false,
								message:
									'Forbidden: Only Admin/Superadmin can change quote validity',
							},
							{ status: 403 },
						)
					}
					patch.quote_valid_until = nextValid
				}
			}

			// Enforce complete commercial offer before issuing (`quoteStatus -> 'sent'`)
			if (nextQuoteStatus === 'sent') {
				const finalValidUntil =
					patch.quote_valid_until ?? existing.quote_valid_until
				if (!finalValidUntil) {
					patch.quote_valid_until = new Date(
						Date.now() + 14 * 86400000,
					).toISOString()
				} else if (Date.parse(finalValidUntil) <= Date.now()) {
					throw new DomainValidationError(
						'Quotation validity date must be in the future before issuing',
						422,
					)
				}
				const finalPaymentTerms =
					patch.payment_terms !== undefined
						? patch.payment_terms
						: existing.payment_terms
				if (!finalPaymentTerms || !String(finalPaymentTerms).trim()) {
					throw new DomainValidationError(
						'Payment terms are required before issuing a quotation',
						422,
					)
				}
				const finalTotal =
					patch.total !== undefined
						? Number(patch.total)
						: Number(existing.total)
				if (!Number.isFinite(finalTotal) || finalTotal <= 0) {
					throw new DomainValidationError(
						'Quotation total must be greater than 0 before issuing',
						422,
					)
				}
			}
		}

		// Fulfillment dispatch requires quote approval on B2B RFQ
		const effectiveFulfillment = (
			patch.fulfillment_status ||
			existing.fulfillment_status ||
			'pending'
		).toLowerCase()
		const effectiveQuoteStatus = (
			patch.quote_status ||
			existing.quote_status ||
			''
		).toLowerCase()
		if (
			isWholesaleRfq &&
			patch.fulfillment_status &&
			['processing', 'shipping', 'delivered'].includes(effectiveFulfillment) &&
			effectiveQuoteStatus !== 'approved'
		) {
			return NextResponse.json(
				{
					success: false,
					message:
						'Wholesale RFQ must be approved before releasing to warehouse fulfillment',
				},
				{ status: 422 },
			)
		}

		const updated = await ordersDb.update(
			existing.id,
			patch,
			parsedExpectedVersion,
		)
		if (!updated) {
			const latest = await ordersDb.getById(existing.id)
			if (!latest) {
				return NextResponse.json(
					{ success: false, message: 'Order not found' },
					{ status: 404 },
				)
			}
			const [notes, payments] = await Promise.all([
				orderNotesDb.listByOrderId(latest.id),
				orderPaymentsDb.listByOrderId(latest.id),
			])
			return NextResponse.json(
				{
					success: false,
					conflict: true,
					message:
						'This order was updated by another staff member. Latest data has been loaded.',
					currentVersion: latest.version ?? 1,
					order: formatAdminOrder(latest, { notes, payments }),
				},
				{ status: 409 },
			)
		}

		// Append-only internal note (DF-004)
		if (noteText) {
			await orderNotesDb.append({
				order_id: existing.id,
				author_id: session.id,
				author_name: finalAuthorName,
				content: noteText,
			})
		}

		if (patch.quote_status === 'sent' && existing.quote_status !== 'sent') {
			scheduleBackgroundTask(() => drainOutbox(5))
		}

		broadcastAdminEvent('ORDER_UPDATED', {
			id: existing.id,
			patch,
		})

		const [refetched, notes, payments] = await Promise.all([
			ordersDb.getById(existing.id),
			orderNotesDb.listByOrderId(existing.id),
			orderPaymentsDb.listByOrderId(existing.id),
		])

		return NextResponse.json({
			success: true,
			message: 'Order updated successfully',
			version: refetched?.version ?? (existing.version ?? 1) + 1,
			order: refetched
				? formatAdminOrder(refetched, { notes, payments })
				: undefined,
		})
	} catch (error: any) {
		if (error instanceof DomainValidationError) {
			return NextResponse.json(
				{ success: false, message: error.message },
				{ status: error.status },
			)
		}
		if (isConflictError(error)) {
			return NextResponse.json(
				{
					success: false,
					message:
						error.causeMessage ||
						error.message ||
						'Quotation state transition conflict',
				},
				{ status: 409 },
			)
		}
		if (isDomainTriggerError(error)) {
			return NextResponse.json(
				{
					success: false,
					message:
						error.causeMessage ||
						error.message ||
						'Order validation constraint rejected update',
				},
				{ status: 422 },
			)
		}
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API Order Update Error:', error)
		return NextResponse.json(
			{
				success: false,
				message:
					status === 503
						? 'Order database unavailable'
						: error.message || 'Error updating order status',
			},
			{ status },
		)
	}
}
