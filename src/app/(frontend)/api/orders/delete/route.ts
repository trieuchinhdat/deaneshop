import { NextResponse } from 'next/server'
import { requireAdminSession, type AdminSessionUser } from '@/lib/admin-auth'
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
	MAX_BULK_ORDER_IDS,
	cleanOptionalText,
	getOrderDeletionEligibility,
} from '@/lib/order-domain'

function isIneligibleTriggerError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false
	const err = error as { message?: unknown; causeMessage?: unknown }
	const msg = `${typeof err.message === 'string' ? err.message : ''} ${typeof err.causeMessage === 'string' ? err.causeMessage : ''}`
	return /Cannot delete paid, approved, or in-transit\/delivered orders/i.test(msg)
}

function isDeletedOrderConflictError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false
	const err = error as { message?: unknown; causeMessage?: unknown }
	const msg = `${typeof err.message === 'string' ? err.message : ''} ${typeof err.causeMessage === 'string' ? err.causeMessage : ''}`
	return /Cannot modify a deleted order/i.test(msg)
}

type SingleDeleteOutcome =
	| { status: 'deleted'; id: string; orderNumber: string; version: number }
	| { status: 'not_found'; id: string; message: string }
	| { status: 'invalid'; id: string; message: string }
	| { status: 'conflict'; id: string; message: string; currentVersion?: number; order?: any }

async function softDeleteSingleOrder(params: {
	targetId: string
	session: AdminSessionUser
	expectedVersion?: number
	reason: string | null
	confirmOrderNumber?: string | null
}): Promise<SingleDeleteOutcome> {
	const { targetId, session, expectedVersion, reason, confirmOrderNumber } = params

	const existing = (await ordersDb.getById(targetId)) || (await ordersDb.getByOrderNumber(targetId))
	if (!existing) {
		return { status: 'not_found', id: targetId, message: 'Order not found or already deleted' }
	}

	if (confirmOrderNumber && confirmOrderNumber !== existing.order_number) {
		return {
			status: 'invalid',
			id: targetId,
			message: `Confirmation order number must match "${existing.order_number}"`,
		}
	}

	const payments = await orderPaymentsDb.listByOrderId(existing.id)
	const eligibility = getOrderDeletionEligibility(existing, payments.length)
	if (!eligibility.eligible) {
		return {
			status: 'invalid',
			id: targetId,
			message: eligibility.reason || 'Order is not eligible for deletion',
		}
	}

	try {
		const deleted = await ordersDb.softDelete(existing.id, {
			deletedBy: `${session.name} (${session.email})`,
			reason,
			expectedVersion,
		})

		if (!deleted) {
			const latest = await ordersDb.getById(existing.id, { includeDeleted: true })
			if (!latest || latest.deleted_at) {
				return { status: 'not_found', id: targetId, message: 'Order not found or already deleted' }
			}
			const latestPayments = await orderPaymentsDb.listByOrderId(latest.id)
			const latestNotes = await orderNotesDb.listByOrderId(latest.id)
			return {
				status: 'conflict',
				id: targetId,
				message: 'This order was updated concurrently by another staff member. Refresh and retry.',
				currentVersion: latest.version ?? 1,
				order: formatAdminOrder(latest, { notes: latestNotes, payments: latestPayments }),
			}
		}

		// Ensure quote tokens and outbox items are also cleaned up when running against dev memory store
		const now = new Date().toISOString()
		await Promise.all([
			d1Query(
				'UPDATE quote_access SET revoked_at = COALESCE(revoked_at, ?) WHERE order_id = ? AND revoked_at IS NULL',
				[now, existing.id],
			).catch(() => {}),
			d1Query(
				`UPDATE outbox SET status = 'superseded', locked_until = NULL, last_error = 'Order deleted by superadmin'
				WHERE status IN ('pending', 'failed')
				  AND (id IN (?, ?) OR (event_type = 'quote.email' AND json_valid(payload) = 1 AND json_extract(payload, '$.orderId') = ?))`,
				[`order:${existing.id}`, `order-email:${existing.id}`, existing.id],
			).catch(() => {}),
			orderNotesDb
				.append({
					order_id: existing.id,
					author_id: session.id,
					author_name: session.name,
					content: `[SOFT DELETED by ${session.name} (${session.role})]${reason ? ` Reason: ${reason}` : ''}`,
				})
				.catch(() => {}),
		])

		return {
			status: 'deleted',
			id: existing.id,
			orderNumber: existing.order_number,
			version: (existing.version ?? 1) + 1,
		}
	} catch (err: any) {
		if (isIneligibleTriggerError(err)) {
			return {
				status: 'invalid',
				id: targetId,
				message: err?.causeMessage || err?.message || 'Cannot delete paid, approved, or in-transit/delivered orders',
			}
		}
		if (isDeletedOrderConflictError(err)) {
			return { status: 'not_found', id: targetId, message: 'Order has already been deleted' }
		}
		throw err
	}
}

async function handleDeleteOrder(request: Request) {
	try {
		const auth = await requireAdminSession(['superadmin'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, message: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const rawText = await request.text().catch(() => '')
		const url = new URL(request.url)
		const queryOrderId = url.searchParams.get('orderId') || url.searchParams.get('docId')

		let body: Record<string, unknown> | null = null
		if (rawText.trim()) {
			try {
				const parsed = JSON.parse(rawText)
				if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
					body = parsed as Record<string, unknown>
				}
			} catch {
				return NextResponse.json({ success: false, message: 'Invalid JSON request body' }, { status: 400 })
			}
		} else if (queryOrderId) {
			body = { orderId: queryOrderId }
		}

		if (!body) {
			return NextResponse.json({ success: false, message: 'Invalid JSON request body' }, { status: 400 })
		}

		const reason = cleanOptionalText(body.reason, 'reason', 500)

		// =========================================================================
		// 1. BULK SOFT DELETE (SUPERADMIN ONLY)
		// =========================================================================
		if (body.orderIds !== undefined) {
			if (!Array.isArray(body.orderIds) || body.orderIds.length === 0) {
				return NextResponse.json({ success: false, message: 'orderIds must be a non-empty array' }, { status: 400 })
			}
			if (body.orderIds.length > MAX_BULK_ORDER_IDS) {
				return NextResponse.json(
					{ success: false, message: `Bulk deletion is limited to ${MAX_BULK_ORDER_IDS} orders per request` },
					{ status: 400 },
				)
			}

			const cleanIds = [
				...new Set(body.orderIds.map((id) => (typeof id === 'string' ? id.trim() : '')).filter(Boolean)),
			]
			if (cleanIds.length === 0) {
				return NextResponse.json({ success: false, message: 'No valid order IDs provided' }, { status: 400 })
			}

			const versionMap =
				body.expectedVersions && typeof body.expectedVersions === 'object' && !Array.isArray(body.expectedVersions)
					? (body.expectedVersions as Record<string, unknown>)
					: {}

			const results: Array<{
				id: string
				orderNumber?: string
				status: 'deleted' | 'conflict' | 'not_found' | 'invalid'
				message?: string
			}> = []

			let deletedCount = 0
			let conflictCount = 0
			let notFoundCount = 0
			let failedCount = 0

			for (const id of cleanIds) {
				const rawExpVer = versionMap[id]
				let expectedVer: number | undefined
				if (rawExpVer !== undefined && rawExpVer !== null) {
					if (typeof rawExpVer !== 'number' || !Number.isSafeInteger(rawExpVer) || rawExpVer < 1) {
						failedCount++
						results.push({ id, status: 'invalid', message: 'Invalid expectedVersion' })
						continue
					}
					expectedVer = rawExpVer
				}

				const outcome = await softDeleteSingleOrder({
					targetId: id,
					session,
					expectedVersion: expectedVer,
					reason,
				})

				if (outcome.status === 'deleted') {
					deletedCount++
					results.push({ id, orderNumber: outcome.orderNumber, status: 'deleted' })
				} else if (outcome.status === 'conflict') {
					conflictCount++
					results.push({ id, status: 'conflict', message: outcome.message })
				} else if (outcome.status === 'not_found') {
					notFoundCount++
					results.push({ id, status: 'not_found', message: outcome.message })
				} else {
					failedCount++
					results.push({ id, status: 'invalid', message: outcome.message })
				}
			}

			if (deletedCount > 0) {
				broadcastAdminEvent('ORDER_UPDATED', {
					action: 'soft_deleted_bulk',
					ids: results.filter((r) => r.status === 'deleted').map((r) => r.id),
					deletedCount,
				})
			}

			const httpStatus =
				deletedCount > 0
					? 200
					: notFoundCount === cleanIds.length
						? 404
						: conflictCount > 0
							? 409
							: 422

			return NextResponse.json(
				{
					success: deletedCount > 0 && conflictCount === 0 && failedCount === 0 && notFoundCount === 0,
					partial: deletedCount > 0 && (conflictCount > 0 || failedCount > 0 || notFoundCount > 0),
					message: `Processed ${cleanIds.length} orders: ${deletedCount} deleted, ${conflictCount} conflicts, ${failedCount + notFoundCount} skipped/ineligible`,
					deletedCount,
					conflictCount,
					failedCount: failedCount + notFoundCount,
					results,
				},
				{ status: httpStatus },
			)
		}

		// =========================================================================
		// 2. SINGLE ORDER SOFT DELETE (SUPERADMIN ONLY)
		// =========================================================================
		const targetId = cleanOptionalText(body.docId || body.orderId, 'order identifier', 150)
		if (!targetId) {
			return NextResponse.json(
				{ success: false, message: 'Missing order identifier (docId or orderId)' },
				{ status: 400 },
			)
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

		const confirmOrderNumber = cleanOptionalText(body.confirmOrderNumber, 'confirmOrderNumber', 150)

		const outcome = await softDeleteSingleOrder({
			targetId,
			session,
			expectedVersion,
			reason,
			confirmOrderNumber,
		})

		if (outcome.status === 'not_found') {
			return NextResponse.json({ success: false, message: outcome.message }, { status: 404 })
		}
		if (outcome.status === 'invalid') {
			const statusCode = confirmOrderNumber && outcome.message.startsWith('Confirmation order number') ? 400 : 422
			return NextResponse.json({ success: false, message: outcome.message }, { status: statusCode })
		}
		if (outcome.status === 'conflict') {
			return NextResponse.json(
				{
					success: false,
					conflict: true,
					message: outcome.message,
					currentVersion: outcome.currentVersion,
					order: outcome.order,
				},
				{ status: 409 },
			)
		}

		broadcastAdminEvent('ORDER_UPDATED', {
			action: 'soft_deleted',
			id: outcome.id,
			orderNumber: outcome.orderNumber,
		})

		return NextResponse.json({
			success: true,
			message: `Order ${outcome.orderNumber} deleted successfully`,
			deletedId: outcome.id,
			orderNumber: outcome.orderNumber,
			version: outcome.version,
		})
	} catch (error: any) {
		if (error instanceof DomainValidationError) {
			return NextResponse.json({ success: false, message: error.message }, { status: error.status })
		}
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API Order Delete Error:', error)
		return NextResponse.json(
			{
				success: false,
				message: status === 503 ? 'Order database unavailable' : error?.message || 'Error deleting order',
			},
			{ status },
		)
	}
}

export async function POST(request: Request) {
	return handleDeleteOrder(request)
}

export async function DELETE(request: Request) {
	return handleDeleteOrder(request)
}

