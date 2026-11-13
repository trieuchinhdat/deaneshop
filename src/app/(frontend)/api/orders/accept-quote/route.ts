import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { assertOrdersApiEnabled } from '@/lib/orders-guard'
import { broadcastAdminEvent } from '@/lib/admin-events'
import { formatAdminOrder } from '@/lib/admin-format'
import {
	PersistenceError,
	d1Query,
	orderNotesDb,
	orderPaymentsDb,
	ordersDb,
} from '@/lib/d1'
import {
	DomainValidationError,
	cleanOptionalText,
	resolveOrderIntent,
	validateAndPriceOrderLines,
} from '@/lib/order-domain'

export async function POST(request: Request) {
	const disabled = assertOrdersApiEnabled()
	if (disabled) return disabled
	try {
		const auth = await requireAdminSession(['superadmin', 'admin'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, message: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const body = await request.json().catch(() => null)
		if (!body || typeof body !== 'object' || Array.isArray(body)) {
			return NextResponse.json({ success: false, message: 'Invalid JSON request body' }, { status: 400 })
		}

		const targetId = cleanOptionalText(body.orderId || body.docId, 'orderId', 150)
		if (!targetId) {
			return NextResponse.json({ success: false, message: 'Missing orderId' }, { status: 400 })
		}

		let expectedVersion: number | undefined
		if (body.expectedVersion !== undefined && body.expectedVersion !== null) {
			if (
				typeof body.expectedVersion !== 'number' ||
				!Number.isSafeInteger(body.expectedVersion) ||
				body.expectedVersion < 1
			) {
				return NextResponse.json({ success: false, message: 'Invalid expectedVersion' }, { status: 400 })
			}
			expectedVersion = body.expectedVersion
		}

		const approvedBy = cleanOptionalText(body.approvedBy, 'approvedBy', 200) || session.name
		const notes = cleanOptionalText(body.notes, 'notes', 2000)

		const existing = (await ordersDb.getById(targetId)) || (await ordersDb.getByOrderNumber(targetId))
		if (!existing) {
			return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
		}

		if (resolveOrderIntent(existing) !== 'wholesale_rfq') {
			return NextResponse.json(
				{ success: false, message: 'Only wholesale RFQ orders can be accepted as quotations' },
				{ status: 422 },
			)
		}

		const currentQuoteStatus = (existing.quote_status || '').toLowerCase()
		if (!['sent', 'viewed', 'negotiating'].includes(currentQuoteStatus)) {
			return NextResponse.json(
				{
					success: false,
					message: `Quotation must be issued (sent/viewed/negotiating) before acceptance. Current status: ${currentQuoteStatus || 'none'}`,
				},
				{ status: 409 },
			)
		}

		const now = new Date().toISOString()
		if (!existing.quote_valid_until || Date.parse(existing.quote_valid_until) <= Date.now()) {
			return NextResponse.json(
				{ success: false, message: 'Quotation has expired and cannot be accepted without renewal' },
				{ status: 409 },
			)
		}

		const snapshotRes = await d1Query<{ version: number; snapshot: string }>(
			'SELECT version, snapshot FROM quote_versions WHERE order_id = ? ORDER BY version DESC LIMIT 1',
			[existing.id],
		)
		const latestSnapshot = snapshotRes.results[0]
		if (!latestSnapshot) {
			return NextResponse.json(
				{ success: false, message: 'No issued quotation snapshot exists to accept' },
				{ status: 409 },
			)
		}

		const parsedItems = JSON.parse(existing.items_json || '[]')
		validateAndPriceOrderLines(parsedItems, { requirePositivePrice: true })
		if (!(Number(existing.total) > 0)) {
			throw new DomainValidationError('Cannot accept a zero-total quotation', 422)
		}

		const targetVersion = expectedVersion ?? (existing.version ?? 1)
		const result = await d1Query(
			`UPDATE orders
			SET quote_status = 'approved',
				quote_approved_by = ?,
				quote_approved_at = ?,
				fulfillment_status = CASE WHEN fulfillment_status = 'pending' THEN 'confirmed' ELSE fulfillment_status END,
				version = COALESCE(version, 1) + 1,
				updated_at = ?
			WHERE id = ?
				AND deleted_at IS NULL
				AND COALESCE(version, 1) = ?
				AND quote_status IN ('sent', 'viewed', 'negotiating')
				AND quote_valid_until > ?`,
			[approvedBy, now, now, existing.id, targetVersion, now],
		)

		if ((result.meta?.changes ?? 0) !== 1) {
			const latest = await ordersDb.getById(existing.id)
			return NextResponse.json(
				{
					success: false,
					conflict: true,
					message: 'Quotation state or version changed concurrently; please refresh',
					currentVersion: latest?.version ?? targetVersion,
				},
				{ status: 409 },
			)
		}

		await orderNotesDb.append({
			order_id: existing.id,
			author_id: session.id,
			author_name: session.name,
			content: `Quotation v${latestSnapshot.version} accepted (${approvedBy}). Payment remains ${existing.payment_status} until payment transaction is recorded.${notes ? ` Note: ${notes}` : ''}`,
		})

		broadcastAdminEvent('ORDER_UPDATED', { id: existing.id, action: 'quote_accepted' })

		const [refetched, orderNotes, payments] = await Promise.all([
			ordersDb.getById(existing.id),
			orderNotesDb.listByOrderId(existing.id),
			orderPaymentsDb.listByOrderId(existing.id),
		])

		return NextResponse.json({
			success: true,
			message: 'Quotation accepted. Payment status remains governed by recorded payment transactions.',
			order: refetched ? formatAdminOrder(refetched, { notes: orderNotes, payments }) : undefined,
		})
	} catch (error: any) {
		if (error instanceof DomainValidationError) {
			return NextResponse.json({ success: false, message: error.message }, { status: error.status })
		}
		const status = error instanceof PersistenceError ? 503 : 500
		return NextResponse.json(
			{ success: false, message: status === 503 ? 'Order database unavailable' : error?.message || 'Unable to accept quote' },
			{ status },
		)
	}
}

