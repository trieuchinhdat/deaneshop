import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { broadcastAdminEvent } from '@/lib/admin-events'
import { PersistenceError, d1Query, leadNotesDb, leadsDb } from '@/lib/d1'

export async function POST(req: Request) {
	try {
		const auth = await requireAdminSession(['superadmin', 'admin', 'sales'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const body = await req.json().catch(() => null)
		const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : ''
		if (!leadId) {
			return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 })
		}

		const targetAssignee =
			session.role === 'sales'
				? session.id
				: typeof body?.staffId === 'string' && body.staffId.trim()
					? body.staffId.trim()
					: session.id

		const existing = await leadsDb.getById(leadId)
		if (!existing) {
			return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
		}

		const claimed = await leadsDb.claimUnassigned(leadId, targetAssignee)
		if (!claimed) {
			return NextResponse.json(
				{ success: false, error: 'Lead is already assigned to another representative' },
				{ status: 409 },
			)
		}

		await leadNotesDb
			.append({
				lead_id: leadId,
				author_id: session.id,
				author_name: session.name,
				content: `Claimed unassigned lead (assigned to ${targetAssignee})`,
			})
			.catch(() => {})

		broadcastAdminEvent('LEAD_UPDATED', { id: leadId, assigned_to: targetAssignee })

		const [updated, latestEventRes] = await Promise.all([
			leadsDb.getById(leadId),
			d1Query<{ latestEventId: number | null }>(
				'SELECT COALESCE(MAX(id), 0) AS latestEventId FROM admin_events',
			).catch(() => null),
		])
		const latestEventId =
			typeof latestEventRes?.results?.[0]?.latestEventId === 'number'
				? latestEventRes.results[0].latestEventId
				: null
		return NextResponse.json(
			{
				success: true,
				message: 'Lead claimed successfully',
				lead: updated,
				...(latestEventId !== null ? { latestEventId } : {}),
			},
			{ headers: { 'Cache-Control': 'no-store' } },
		)
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		return NextResponse.json(
			{ success: false, error: status === 503 ? 'Lead database unavailable' : error?.message || 'Failed to claim lead' },
			{ status },
		)
	}
}

