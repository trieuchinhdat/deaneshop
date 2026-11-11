import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { adminUsersDb, d1Query, leadNotesDb, leadsDb } from '@/lib/d1'
import { leadDateWindow, type IntelligenceLead } from '@/lib/lead-intelligence'
import { leadStorageError } from '@/lib/lead-storage-error'

const roles = ['superadmin', 'admin', 'sales', 'marketing', 'cskh'] as const
export async function GET(req: Request) {
	const auth = await requireAdminSession([...roles])
	if (!auth.ok)
		return NextResponse.json({ error: auth.error }, { status: auth.status })
	try {
		const p = new URL(req.url).searchParams
		const scoped = auth.session.role === 'sales' || auth.session.role === 'cskh'
		const where = scoped ? ['l.assigned_to = ?'] : ['1=1']
		const args: (string | number)[] = scoped ? [auth.session.id] : []
		const id = p.get('id')
		if (id) {
			const lead = await leadsDb.getById(id)
			if (!lead || (scoped && lead.assigned_to !== auth.session.id))
				return NextResponse.json(
					{ error: 'Lead not available' },
					{ status: 404 },
				)
			const assessment = await d1Query(
				'SELECT qualification, priority, follow_up_at, next_action, reason, version AS assessment_version FROM lead_assessments WHERE lead_id = ?',
				[id],
			)
			const notes = await leadNotesDb.listByLeadId(id)
			return NextResponse.json({
				lead: {
					...lead,
					qualification: 'not_assessed',
					assessment_version: 0,
					priority: 'normal',
					next_action: '',
					reason: '',
					follow_up_at: null,
					...assessment.results?.[0],
				},
				notes,
			})
		}
		const timeframe = p.get('timeframe') || p.get('dateRange')
		const filter = p.get('filter')
		const actionWhere = [
			...where,
			"COALESCE(l.source,'') NOT IN ('newsletter','popup')",
		]
		const actionArgs = [...args]
		const window = leadDateWindow(timeframe)
		// Follow-ups are an operational queue, regardless of when the lead arrived.
		if (window && filter !== 'followups') {
			where.push(
				'julianday(l.created_at) >= julianday(?) AND julianday(l.created_at) < julianday(?)',
			)
			args.push(window.start, window.end)
		}
		if (p.get('view') === 'insights') {
			where.push("COALESCE(l.source,'') NOT IN ('newsletter','popup')")
			const result = await d1Query(
				`SELECT COALESCE(NULLIF(l.utm_source,''),'Unknown') AS source,
    COALESCE(NULLIF(l.utm_medium,''),'Unknown') AS medium, COUNT(*) AS total,
    SUM(CASE WHEN a.qualification IS NOT NULL AND a.qualification != 'not_assessed' THEN 1 ELSE 0 END) AS assessed,
    SUM(CASE WHEN a.qualification = 'qualified' THEN 1 ELSE 0 END) AS qualified,
    SUM(CASE WHEN a.qualification = 'spam' THEN 1 ELSE 0 END) AS spam
    FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${where.join(' AND ')} GROUP BY 1,2 ORDER BY total DESC`,
				args,
			)
			return NextResponse.json({ sources: result.results || [] })
		}
		if (p.get('view') === 'analytics') {
			where.push("COALESCE(l.source,'') NOT IN ('newsletter','popup')")
			const isHourly = timeframe === 'today' || timeframe === 'yesterday'
			const timeFormat = isHourly ? '%H' : '%Y-%m-%d'
			const [sourcesRes, trendsRes, stagesRes, qualRes, prioRes, followupsRes] =
				await Promise.all([
					d1Query(
						`SELECT COALESCE(NULLIF(l.utm_source,''),'Unknown') AS source,
    COALESCE(NULLIF(l.utm_medium,''),'Unknown') AS medium, COUNT(*) AS total,
    SUM(CASE WHEN a.qualification IS NOT NULL AND a.qualification != 'not_assessed' THEN 1 ELSE 0 END) AS assessed,
    SUM(CASE WHEN a.qualification = 'qualified' THEN 1 ELSE 0 END) AS qualified,
    SUM(CASE WHEN a.qualification = 'spam' THEN 1 ELSE 0 END) AS spam
    FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${where.join(' AND ')} GROUP BY 1,2 ORDER BY total DESC`,
						args,
					),
					d1Query(
						`SELECT strftime('${timeFormat}', l.created_at) AS bucket,
    COUNT(*) AS total,
    SUM(CASE WHEN a.qualification = 'qualified' THEN 1 ELSE 0 END) AS qualified,
    SUM(CASE WHEN a.priority = 'high' THEN 1 ELSE 0 END) AS urgent
    FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${where.join(' AND ')} AND l.created_at IS NOT NULL
    GROUP BY 1 ORDER BY 1 ASC`,
						args,
					),
					d1Query(
						`SELECT COALESCE(l.status, 'new') AS status, COUNT(*) AS count
    FROM leads l
    WHERE ${where.join(' AND ')}
    GROUP BY 1`,
						args,
					),
					d1Query(
						`SELECT COALESCE(a.qualification, 'not_assessed') AS qualification, COUNT(*) AS count
    FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${where.join(' AND ')}
    GROUP BY 1`,
						args,
					),
					d1Query(
						`SELECT COALESCE(a.priority, 'normal') AS priority, COUNT(*) AS count
    FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${where.join(' AND ')}
    GROUP BY 1`,
						args,
					),
					d1Query<{ total: number; overdue: number }>(
						`SELECT COUNT(*) AS total,
    COALESCE(SUM(CASE WHEN julianday(a.follow_up_at) < julianday('now') THEN 1 ELSE 0 END),0) AS overdue
    FROM leads l JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${actionWhere.join(' AND ')} AND a.follow_up_at IS NOT NULL AND l.status NOT IN ('closed','lost','won')`,
						actionArgs,
					),
				])

			return NextResponse.json({
				sources: sourcesRes.results || [],
				trends: trendsRes.results || [],
				stages: stagesRes.results || [],
				qualifications: qualRes.results || [],
				priorities: prioRes.results || [],
				followups: followupsRes.results?.[0] || { total: 0, overdue: 0 },
				timeZone: 'UTC',
			})
		}
		const search = (p.get('search') || '').trim().slice(0, 200)
		if (search) {
			where.push(
				'(l.name LIKE ? OR l.email LIKE ? OR l.company_name LIKE ? OR l.phone LIKE ?)',
			)
			args.push(...Array(4).fill(`%${search}%`))
		}
		where.push(
			filter === 'subscribers'
				? "l.source IN ('newsletter','popup')"
				: "COALESCE(l.source,'') NOT IN ('newsletter','popup')",
		)
		if (filter === 'new') where.push("l.status = 'new'")
		if (filter === 'unassigned')
			where.push("(l.assigned_to IS NULL OR l.assigned_to = '')")
		if (filter === 'qualified') where.push("a.qualification = 'qualified'")
		if (filter === 'assessed') where.push("a.qualification != 'not_assessed'")
		if (filter === 'contacted')
			where.push("l.status IN ('contacted','discovery')")
		if (filter === 'won') where.push("l.status = 'won'")
		if (filter === 'wholesale_rfq') where.push("l.source = 'wholesale_rfq'")
		if (filter === 'followups')
			where.push(
				"a.follow_up_at IS NOT NULL AND l.status NOT IN ('closed','lost','won')",
			)
		const page = Math.max(1, Math.min(10000, Number(p.get('page')) || 1))
		if (!Number.isInteger(page))
			return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
		const base = `FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id WHERE ${where.join(' AND ')}`
		const [rows, count, staff] = await Promise.all([
			d1Query<IntelligenceLead>(
				`SELECT l.*, COALESCE(a.version,0) AS assessment_version, COALESCE(a.qualification,'not_assessed') AS qualification, COALESCE(a.priority,'normal') AS priority, a.follow_up_at, COALESCE(a.next_action,'') AS next_action, COALESCE(a.reason,'') AS reason ${base} ORDER BY ${filter === 'followups' ? 'a.follow_up_at ASC' : 'l.created_at DESC'} LIMIT 25 OFFSET ?`,
				[...args, (page - 1) * 25],
			),
			d1Query<{ total: number }>(`SELECT COUNT(*) AS total ${base}`, args),
			adminUsersDb.list(),
		])
		return NextResponse.json({
			items: rows.results || [],
			total: count.results?.[0]?.total || 0,
			staff: staff
				.filter((s) => s.status === 'active')
				.map((s) => ({ id: s.id, name: s.full_name })),
		})
	} catch (error) {
		const failure = leadStorageError(error)
		console.error('[Lead intelligence GET]', failure.code)
		return NextResponse.json(failure, {
			status: 503,
			headers: { 'Cache-Control': 'no-store' },
		})
	}
}

export async function POST(req: Request) {
	const auth = await requireAdminSession([
		'superadmin',
		'admin',
		'sales',
		'cskh',
	])
	if (!auth.ok)
		return NextResponse.json({ error: auth.error }, { status: auth.status })
	try {
		const b = await req.json()
		if (!b || typeof b.id !== 'string')
			return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
		const lead = await leadsDb.getById(b.id)
		if (!lead)
			return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
		if (
			['sales', 'cskh'].includes(auth.session.role) &&
			lead.assigned_to !== auth.session.id
		)
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		if (!Number.isSafeInteger(b.assessment_version) || b.assessment_version < 0)
			return NextResponse.json(
				{ error: 'Assessment version required' },
				{ status: 400 },
			)
		if (
			!['not_assessed', 'qualified', 'not_a_fit', 'spam'].includes(
				b.qualification,
			) ||
			!['high', 'normal', 'low'].includes(b.priority) ||
			typeof b.reason !== 'string' ||
			b.reason.length > 1000 ||
			typeof b.next_action !== 'string' ||
			b.next_action.length > 500 ||
			(b.follow_up_at !== null &&
				(typeof b.follow_up_at !== 'string' ||
					!Number.isFinite(Date.parse(b.follow_up_at))))
		)
			return NextResponse.json({ error: 'Invalid assessment' }, { status: 400 })
		if (b.qualification !== 'not_assessed' && !b.reason.trim())
			return NextResponse.json(
				{ error: 'Add a reason for this assessment' },
				{ status: 400 },
			)
		const now = new Date().toISOString()
		const saved = await d1Query(
			`INSERT INTO lead_assessments (lead_id,qualification,priority,follow_up_at,next_action,reason,updated_at,updated_by) SELECT ?,?,?,?,?,?,?,? WHERE ? = 0 OR EXISTS (SELECT 1 FROM lead_assessments WHERE lead_id = ? AND version = ?)
   ON CONFLICT(lead_id) DO UPDATE SET qualification=excluded.qualification, priority=excluded.priority, follow_up_at=excluded.follow_up_at, next_action=excluded.next_action, reason=excluded.reason, updated_at=excluded.updated_at, updated_by=excluded.updated_by, version=lead_assessments.version+1 WHERE lead_assessments.version = ? RETURNING version`,
			[
				b.id,
				b.qualification,
				b.priority,
				b.follow_up_at ? new Date(b.follow_up_at).toISOString() : null,
				b.next_action.trim(),
				b.reason.trim(),
				now,
				auth.session.id,
				b.assessment_version,
				b.id,
				b.assessment_version,
				b.assessment_version,
			],
		)
		if (!saved.results?.length)
			return NextResponse.json(
				{ error: 'This assessment changed. Reopen the lead before saving.' },
				{ status: 409 },
			)
		return NextResponse.json({ success: true })
	} catch (error) {
		return NextResponse.json(leadStorageError(error), { status: 503 })
	}
}
