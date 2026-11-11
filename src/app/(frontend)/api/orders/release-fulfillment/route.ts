import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { broadcastAdminEvent } from '@/lib/admin-events'
import { formatAdminOrder } from '@/lib/admin-format'
import {
	PersistenceError,
	orderNotesDb,
	orderPaymentsDb,
	ordersDb,
} from '@/lib/d1'
import {
	DomainValidationError,
	canTransitionFulfillment,
	cleanOptionalText,
	normalizeEnum,
	resolveOrderIntent,
} from '@/lib/order-domain'

export async function POST(request: Request) {
	try {
		const auth = await requireAdminSession(['superadmin', 'admin', 'cskh'])
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

		const targetStatus = normalizeEnum(
			body.fulfillmentStatus || 'processing',
			['confirmed', 'processing'] as const,
			'fulfillmentStatus',
		)
		const notes = cleanOptionalText(body.notes, 'notes', 1000)

		const existing = (await ordersDb.getById(targetId)) || (await ordersDb.getByOrderNumber(targetId))
		if (!existing) {
			return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
		}

		const intent = resolveOrderIntent(existing)
		if (intent === 'wholesale_rfq' && existing.quote_status !== 'approved') {
			return NextResponse.json(
				{ success: false, message: 'Wholesale RFQ must be accepted/approved before releasing to warehouse fulfillment' },
				{ status: 422 },
			)
		}

		if (!canTransitionFulfillment(existing.fulfillment_status, targetStatus)) {
			return NextResponse.json(
				{ success: false, message: `Cannot release fulfillment from status "${existing.fulfillment_status}"` },
				{ status: 422 },
			)
		}

		const targetVersion = expectedVersion ?? (existing.version ?? 1)
		const updated = await ordersDb.update(existing.id, { fulfillment_status: targetStatus }, targetVersion)
		if (!updated) {
			const latest = await ordersDb.getById(existing.id)
			return NextResponse.json(
				{
					success: false,
					conflict: true,
					message: 'Order was updated concurrently; please refresh',
					currentVersion: latest?.version ?? targetVersion,
				},
				{ status: 409 },
			)
		}

		await orderNotesDb.append({
			order_id: existing.id,
			author_id: session.id,
			author_name: session.name,
			content: `Released to warehouse fulfillment (${targetStatus.toUpperCase()}). Payment status remains ${existing.payment_status.toUpperCase()}.${notes ? ` Note: ${notes}` : ''}`,
		})

		broadcastAdminEvent('ORDER_UPDATED', { id: existing.id, action: 'fulfillment_released' })

		const [refetched, orderNotes, payments] = await Promise.all([
			ordersDb.getById(existing.id),
			orderNotesDb.listByOrderId(existing.id),
			orderPaymentsDb.listByOrderId(existing.id),
		])

		return NextResponse.json({
			success: true,
			message: `Order released to ${targetStatus.toUpperCase()}`,
			order: refetched ? formatAdminOrder(refetched, { notes: orderNotes, payments }) : undefined,
		})
	} catch (error: any) {
		if (error instanceof DomainValidationError) {
			return NextResponse.json({ success: false, message: error.message }, { status: error.status })
		}
		const status = error instanceof PersistenceError ? 503 : 500
		return NextResponse.json(
			{ success: false, message: status === 503 ? 'Order database unavailable' : error?.message || 'Unable to release fulfillment' },
			{ status },
		)
	}
}

