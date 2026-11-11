import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
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
	PAYMENT_METHODS,
	cleanOptionalText,
	derivePaymentStatus,
	fromCents,
	normalizeEnum,
	toCents,
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

		const amountCents = toCents(body.amount, 'amount')
		if (amountCents <= 0) {
			return NextResponse.json({ success: false, message: 'Payment amount must be greater than 0' }, { status: 422 })
		}

		const kindRaw = body.kind === undefined ? 'payment' : body.kind
		const kind = normalizeEnum(kindRaw, ['payment', 'refund'] as const, 'kind')
		const method = normalizeEnum(body.method || 'bank_transfer', PAYMENT_METHODS, 'method')
		const reference = cleanOptionalText(body.reference, 'reference', 120)
		if (!reference) {
			return NextResponse.json({ success: false, message: 'Payment reference / transaction ID is required' }, { status: 400 })
		}
		const notes = cleanOptionalText(body.notes, 'notes', 1000)

		const existing = (await ordersDb.getById(targetId)) || (await ordersDb.getByOrderNumber(targetId))
		if (!existing) {
			return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
		}

		const orderCurrency = (existing.currency || 'USD').toUpperCase()
		const submittedCurrency = cleanOptionalText(body.currency, 'currency', 10)?.toUpperCase() || orderCurrency
		if (submittedCurrency !== orderCurrency) {
			return NextResponse.json(
				{ success: false, message: `Currency mismatch: order requires ${orderCurrency}` },
				{ status: 422 },
			)
		}

		const totalCents = toCents(Number(existing.total) || 0, 'total')
		if (totalCents <= 0) {
			return NextResponse.json(
				{ success: false, message: 'Cannot record payment for a zero-total or unpriced order' },
				{ status: 422 },
			)
		}

		const currentPaidCents =
			typeof existing.paid_cents === 'number' && Number.isSafeInteger(existing.paid_cents)
				? existing.paid_cents
				: existing.payment_status === 'paid'
					? totalCents
					: 0

		const nextPaidCents = kind === 'payment' ? currentPaidCents + amountCents : currentPaidCents - amountCents
		if (kind === 'payment' && nextPaidCents > totalCents) {
			return NextResponse.json(
				{
					success: false,
					message: `Payment exceeds remaining balance due (${fromCents(totalCents - currentPaidCents)} ${orderCurrency})`,
				},
				{ status: 422 },
			)
		}
		if (kind === 'refund' && nextPaidCents < 0) {
			return NextResponse.json(
				{
					success: false,
					message: `Refund exceeds recorded paid amount (${fromCents(currentPaidCents)} ${orderCurrency})`,
				},
				{ status: 422 },
			)
		}

		const nextPaymentStatus = derivePaymentStatus(nextPaidCents, totalCents, kind)
		const targetVersion = expectedVersion ?? (existing.version ?? 1)
		const now = new Date().toISOString()

		const updateRes = await d1Query(
			`UPDATE orders
			SET paid_cents = ?,
				payment_status = ?,
				version = COALESCE(version, 1) + 1,
				updated_at = ?
			WHERE id = ? AND deleted_at IS NULL AND COALESCE(version, 1) = ?`,
			[nextPaidCents, nextPaymentStatus, now, existing.id, targetVersion],
		)

		if ((updateRes.meta?.changes ?? 0) !== 1) {
			const latest = await ordersDb.getById(existing.id)
			return NextResponse.json(
				{
					success: false,
					conflict: true,
					message: 'Order was updated concurrently; refresh before recording payment',
					currentVersion: latest?.version ?? targetVersion,
				},
				{ status: 409 },
			)
		}

		const paymentId = `pay_${randomUUID()}`
		await d1Query(
			`INSERT INTO order_payments (id, order_id, amount_cents, currency, method, reference, kind, actor_id, actor_name, notes, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				paymentId,
				existing.id,
				amountCents,
				orderCurrency,
				method,
				reference,
				kind,
				session.id,
				session.name,
				notes,
				now,
			],
		)

		await orderNotesDb.append({
			order_id: existing.id,
			author_id: session.id,
			author_name: session.name,
			content: `Recorded ${kind} of ${fromCents(amountCents)} ${orderCurrency} via ${method} (Ref: ${reference}). Status: ${nextPaymentStatus.toUpperCase()} (${fromCents(nextPaidCents)}/${fromCents(totalCents)} ${orderCurrency}).`,
		})

		broadcastAdminEvent('ORDER_UPDATED', { id: existing.id, action: 'payment_recorded' })

		const [refetched, orderNotes, payments] = await Promise.all([
			ordersDb.getById(existing.id),
			orderNotesDb.listByOrderId(existing.id),
			orderPaymentsDb.listByOrderId(existing.id),
		])

		return NextResponse.json({
			success: true,
			message: `Recorded ${kind} successfully`,
			payment: {
				id: paymentId,
				amount: fromCents(amountCents),
				amountCents,
				currency: orderCurrency,
				method,
				reference,
				kind,
				actorName: session.name,
				createdAt: now,
			},
			order: refetched ? formatAdminOrder(refetched, { notes: orderNotes, payments }) : undefined,
		})
	} catch (error: any) {
		if (error instanceof DomainValidationError) {
			return NextResponse.json({ success: false, message: error.message }, { status: error.status })
		}
		const status = error instanceof PersistenceError ? 503 : 500
		return NextResponse.json(
			{ success: false, message: status === 503 ? 'Order database unavailable' : error?.message || 'Unable to record payment' },
			{ status },
		)
	}
}

