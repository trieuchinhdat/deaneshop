import { d1Query, orderNotesDb, ordersDb } from './d1'
import { canAccessQuote } from './quote-access'

export async function transitionQuote(
	body: Record<string, unknown>,
	action: 'approved' | 'revision_requested',
	nowDate?: Date,
) {
	const id = body.quoteId || body.orderNumber
	if (typeof id !== 'string' || id.length > 150) return { status: 400, success: false }
	const order = (await ordersDb.getByOrderNumber(id)) || (await ordersDb.getById(id))
	if (!order) return { status: 404, success: false }
	const token = typeof body.token === 'string' ? body.token : null
	if (!(await canAccessQuote(order.id, token))) return { status: 403, success: false }
	const actor = action === 'approved' ? body.approvedBy : body.customerName
	const notes = action === 'approved' ? body.notes : body.requestedChanges
	if (
		typeof actor !== 'string' ||
		!actor.trim() ||
		actor.length > 200 ||
		(notes !== undefined && (typeof notes !== 'string' || notes.length > 4000))
	) {
		return { status: 400, success: false }
	}
	if (action === 'revision_requested' && (typeof notes !== 'string' || notes.trim().length < 5)) {
		return { status: 400, success: false }
	}
	if (!Number.isSafeInteger(body.version) || Number(body.version) < 1) {
		return { status: 409, success: false }
	}

	const now = (nowDate ?? new Date()).toISOString()

	// Verify immutable snapshot validity matching the exact accepted version
	const snapRes = await d1Query<{ version: number; snapshot: string }>(
		'SELECT version, snapshot FROM quote_versions WHERE order_id = ? AND version = ? LIMIT 1',
		[order.id, Number(body.version)],
	).catch(() => ({ results: [] as Array<{ version: number; snapshot: string }> }))
	const snapRow = snapRes?.results?.[0]
	if (snapRow?.snapshot) {
		try {
			const snap = JSON.parse(snapRow.snapshot)
			if (snap?.validUntil && String(snap.validUntil) <= now) {
				return { status: 409, success: false, message: 'Quotation validity period has expired' }
			}
		} catch {
			return { status: 409, success: false }
		}
	}

	// Only issued quotes may be accepted. Pending or draft inquiries are not commercial offers.
	const result = await d1Query(
		`UPDATE orders SET quote_status = ?, quote_approved_by = ?, quote_approved_at = ?,
		fulfillment_status = CASE WHEN ? = 'approved' THEN 'confirmed' ELSE fulfillment_status END,
		version = COALESCE(version, 1) + 1,
		updated_at = ?
		WHERE id = ? AND deleted_at IS NULL AND quote_status IN ('sent', 'viewed', 'negotiating') AND quote_valid_until > ? AND (SELECT MAX(version) FROM quote_versions WHERE order_id = orders.id) = ?`,
		[
			action,
			actor.trim(),
			action === 'approved' ? now : null,
			action,
			now,
			order.id,
			now,
			body.version,
		],
	)
	const changed = result.meta?.changes === 1
	if (changed && orderNotesDb?.append) {
		await orderNotesDb
			.append({
				order_id: order.id,
				author_id: 'buyer',
				author_name: actor.trim(),
				content: `[Buyer ${action} v${body.version}] ${notes ? notes.trim() : ''}`.trim(),
			})
			.catch(() => {})
	}
	return { status: changed ? 200 : 409, success: changed }
}
