import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { broadcastAdminEvent } from '@/lib/admin-events'
import { PersistenceError, leadNotesDb, leadsDb } from '@/lib/d1'

const VALID_LEAD_STATUSES = ['new', 'contacted', 'discovery', 'proposal', 'won', 'lost', 'closed'] as const

export async function POST(req: Request) {
	try {
		const auth = await requireAdminSession(['superadmin', 'admin', 'sales', 'cskh'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const body = await req.json().catch(() => ({}))
		const {
			leadId,
			id,
			customerId,
			expectedVersion,
			status,
			assigned_to,
			assignedTo,
			company_name,
			budget_range,
			last_contacted_at,
			recordContact,
			internal_notes,
			internalNotes,
			newNote,
		} = body as Record<string, unknown>

		const targetId = typeof (leadId || id || customerId) === 'string' ? String(leadId || id || customerId).trim() : ''
		if (!targetId) {
			return NextResponse.json(
				{ success: false, error: 'Missing lead identifier (leadId).' },
				{ status: 400 },
			)
		}

		let parsedExpectedVersion: number | undefined
		if (expectedVersion !== undefined && expectedVersion !== null) {
			if (typeof expectedVersion !== 'number' || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
				return NextResponse.json({ success: false, error: 'Invalid expectedVersion' }, { status: 400 })
			}
			parsedExpectedVersion = expectedVersion
		}

		const existing = await leadsDb.getById(targetId)
		if (!existing) return NextResponse.json({ success: false }, { status: 404 })

		// Sales can only update leads already assigned to them; unassigned leads must be claimed via /api/admin/leads/claim
		if (['sales', 'cskh'].includes(session.role) && existing.assigned_to !== session.id) {
			return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
		}

		const patch: Record<string, any> = {}

		if (status !== undefined) {
			if (typeof status !== 'string' || !VALID_LEAD_STATUSES.includes(status.toLowerCase().trim() as any)) {
				return NextResponse.json(
					{ success: false, error: `Invalid lead status: ${String(status)}` },
					{ status: 400 },
				)
			}
			patch.status = status.toLowerCase().trim()
		}

		// Only Admin/Superadmin can reassign leads via update endpoint
		const newAssignedTo = assigned_to !== undefined ? assigned_to : assignedTo
		if (newAssignedTo !== undefined) {
			if (['sales', 'cskh'].includes(session.role)) {
				if (newAssignedTo !== session.id) {
					return NextResponse.json(
						{ success: false, error: 'Only Administrators can reassign leads to other staff members.' },
						{ status: 403 },
					)
				}
			} else {
				patch.assigned_to = newAssignedTo ? String(newAssignedTo).trim() : null
			}
		}

		if (company_name !== undefined) {
			patch.company_name = typeof company_name === 'string' ? company_name.trim() || null : null
		}
		if (budget_range !== undefined) {
			patch.budget_range = typeof budget_range === 'string' ? budget_range.trim() || null : null
		}
		if (last_contacted_at !== undefined) {
			patch.last_contacted_at = typeof last_contacted_at === 'string' ? last_contacted_at.trim() || null : null
		}

		const noteRaw = internal_notes || internalNotes || newNote
		const noteText = typeof noteRaw === 'string' ? noteRaw.trim().slice(0, 2000) : ''

		if (recordContact === true) {
			if (!noteText) return NextResponse.json({ success:false, error:'Contact outcome required' }, {status:400})
			patch.last_contacted_at = new Date().toISOString()
		}

		const updated = await leadsDb.update(targetId, patch, parsedExpectedVersion)
		if (!updated) {
			const latest = await leadsDb.getById(targetId)
			if (!latest) return NextResponse.json({ success: false }, { status: 404 })
			return NextResponse.json(
				{
					success: false,
					conflict: true,
					message: 'Lead was updated concurrently; please refresh',
					lead: latest,
				},
				{ status: 409 },
			)
		}

		if (noteText) {
			await leadNotesDb.append({
				lead_id: targetId,
				author_id: session.id,
				author_name: session.name,
				content: noteText,
			})
		}

		broadcastAdminEvent('LEAD_UPDATED', { id: targetId, patch })

		return NextResponse.json({
			success: true,
			message: 'Lead updated successfully.',
			patch,
		})
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API /api/admin/leads/update error:', error)
		return NextResponse.json(
			{ success: false, error: status === 503 ? 'Lead database unavailable.' : error?.message || 'Failed to update lead.' },
			{ status },
		)
	}
}
