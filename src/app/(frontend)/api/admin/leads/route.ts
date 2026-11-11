import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { PersistenceError, d1Query, leadsDb } from '@/lib/d1'

const MAX_LEADS_LIMIT = 100

function parseStrictNonNegativeInt(
	raw: string | null,
	defaultVal: number,
	min: number,
	max: number,
): number | null {
	if (raw === null || raw === '') return defaultVal
	const trimmed = raw.trim()
	if (!/^\d+$/.test(trimmed)) return null
	const num = Number(trimmed)
	if (!Number.isSafeInteger(num) || num < min || num > max) return null
	return num
}

export async function GET(req: Request) {
	try {
		const auth = await requireAdminSession(['superadmin', 'admin', 'sales', 'marketing'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const { searchParams } = new URL(req.url)
		const status = searchParams.get('status') || 'all'
		const search = searchParams.get('search') || ''
		const queue = searchParams.get('queue') || 'assigned'
		const unassignedOnly = queue === 'unassigned'

		const limit = parseStrictNonNegativeInt(searchParams.get('limit'), 50, 1, MAX_LEADS_LIMIT)
		if (limit === null) {
			return NextResponse.json(
				{ success: false, error: `Invalid limit parameter; must be an integer between 1 and ${MAX_LEADS_LIMIT}.` },
				{ status: 400 },
			)
		}

		const offset = parseStrictNonNegativeInt(searchParams.get('offset'), 0, 0, 1000000)
		if (offset === null) {
			return NextResponse.json(
				{ success: false, error: 'Invalid offset parameter; must be a non-negative integer.' },
				{ status: 400 },
			)
		}

		const assigned_to = unassignedOnly
			? undefined
			: session.role === 'sales'
				? session.id
				: searchParams.get('assigned_to') || undefined

		const [leads, countRows] = await Promise.all([
			leadsDb.list({
				status,
				search,
				assigned_to,
				unassignedOnly,
				limit,
				offset,
			}),
			unassignedOnly
				? d1Query<{ status: string; count: number }>(
						`SELECT status, COUNT(*) as count FROM leads WHERE (assigned_to IS NULL OR assigned_to = '') GROUP BY status`,
					)
				: d1Query<{ status: string; count: number }>(
						`SELECT status, COUNT(*) as count FROM leads WHERE (? IS NULL OR assigned_to = ?) GROUP BY status`,
						[assigned_to || null, assigned_to || null],
					),
		])

		const counts: Record<string, number> = {
			all: 0,
			new: 0,
			contacted: 0,
			discovery: 0,
			proposal: 0,
			won: 0,
			lost: 0,
			closed: 0,
		}

		let total = 0
		for (const row of countRows.results || []) {
			const s = (row.status || '').toLowerCase()
			counts[s] = (counts[s] || 0) + (row.count || 0)
			total += row.count || 0
		}
		counts.all = total

		return NextResponse.json({
			success: true,
			leads,
			counts,
			total: counts.all,
			limit,
			offset,
		})
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API /api/admin/leads GET error:', error)
		return NextResponse.json(
			{ success: false, error: status === 503 ? 'Lead database unavailable.' : error?.message || 'Failed to fetch leads from Cloudflare D1.' },
			{ status },
		)
	}
}
