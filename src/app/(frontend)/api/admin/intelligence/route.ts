import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { adminUsersDb, d1Query, leadNotesDb, leadsDb } from '@/lib/d1'
import { leadDateWindow, type IntelligenceLead } from '@/lib/lead-intelligence'
import { leadStorageError } from '@/lib/lead-storage-error'

const roles = ['superadmin', 'admin', 'sales', 'marketing'] as const

function jsonNoStore(body: unknown, init?: ResponseInit) {
	const headers = new Headers(init?.headers)
	headers.set('Cache-Control', 'no-store')
	return NextResponse.json(body, { ...init, headers })
}

async function getLatestAdminEventId(): Promise<number> {
	const res = await d1Query<{ latestEventId: number | null }>(
		'SELECT COALESCE(MAX(id), 0) AS latestEventId FROM admin_events',
	)
	const val = Number(res.results?.[0]?.latestEventId ?? 0)
	return Number.isSafeInteger(val) && val >= 0 ? val : 0
}

export async function GET(req: Request) {
	const auth = await requireAdminSession([...roles])
	if (!auth.ok)
		return jsonNoStore({ error: auth.error }, { status: auth.status })
	try {
		const p = new URL(req.url).searchParams
		const scoped = auth.session.role === 'sales'
		if (p.get('view') === 'events') {
			const rawAfter = p.get('after')
			let after: number | null = null
			if (rawAfter !== null && rawAfter !== '') {
				if (!/^\d+$/.test(rawAfter.trim())) {
					return jsonNoStore({ error: 'Invalid after cursor' }, { status: 400 })
				}
				const parsed = Number(rawAfter.trim())
				if (!Number.isSafeInteger(parsed) || parsed < 0) {
					return jsonNoStore({ error: 'Invalid after cursor' }, { status: 400 })
				}
				after = parsed
			}

			const maxId = await getLatestAdminEventId()
			if (after === null || after >= maxId) {
				return jsonNoStore({
					latestEventId: maxId,
					hasNewLead: false,
					hasLeadUpdated: false,
					cursorReset: after !== null && after > maxId,
				})
			}

			const deltaRes = scoped
				? await d1Query<{
						latestEventId: number | null
						hasNewLead: number
						hasLeadUpdated: number
					}>(
						`SELECT
       COALESCE(MAX(e.id), ?) AS latestEventId,
       COALESCE(MAX(CASE WHEN e.type = 'NEW_LEAD' AND l.assigned_to = ? THEN 1 ELSE 0 END), 0) AS hasNewLead,
       COALESCE(MAX(CASE WHEN e.type = 'LEAD_UPDATED' AND l.assigned_to = ? THEN 1 ELSE 0 END), 0) AS hasLeadUpdated
      FROM admin_events e
      LEFT JOIN leads l ON e.type IN ('NEW_LEAD', 'LEAD_UPDATED') AND e.resource_id = l.id
      WHERE e.id > ?`,
						[after, auth.session.id, auth.session.id, after],
					)
				: await d1Query<{
						latestEventId: number | null
						hasNewLead: number
						hasLeadUpdated: number
					}>(
						`SELECT
       COALESCE(MAX(id), ?) AS latestEventId,
       COALESCE(MAX(CASE WHEN type = 'NEW_LEAD' THEN 1 ELSE 0 END), 0) AS hasNewLead,
       COALESCE(MAX(CASE WHEN type = 'LEAD_UPDATED' THEN 1 ELSE 0 END), 0) AS hasLeadUpdated
      FROM admin_events
      WHERE id > ?`,
						[after, after],
					)

			const row = deltaRes.results?.[0]
			const latestEventId =
				typeof row?.latestEventId === 'number' &&
				Number.isSafeInteger(row.latestEventId) &&
				row.latestEventId >= 0
					? row.latestEventId
					: maxId

			return jsonNoStore({
				latestEventId,
				hasNewLead: Boolean(Number(row?.hasNewLead)),
				hasLeadUpdated: Boolean(Number(row?.hasLeadUpdated)),
				cursorReset: false,
			})
		}

		const where = scoped ? ['l.assigned_to = ?'] : ['1=1']
		const args: (string | number)[] = scoped ? [auth.session.id] : []
		const id = p.get('id')
		if (id) {
			const lead = await leadsDb.getById(id)
			if (!lead || (scoped && lead.assigned_to !== auth.session.id))
				return jsonNoStore(
					{ error: 'Lead not available' },
					{ status: 404 },
				)
			const assessment = await d1Query(
				'SELECT qualification, priority, follow_up_at, next_action, reason, version AS assessment_version FROM lead_assessments WHERE lead_id = ?',
				[id],
			)
			const notes = await leadNotesDb.listByLeadId(id)
			return jsonNoStore({
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
			const leadWhere = [
				...where,
				"COALESCE(l.source,'') NOT IN ('newsletter','popup')",
			]
			const [latestEventId, result, campaignsRes, placementsRes, countriesRes] =
				await Promise.all([
					getLatestAdminEventId(),
					d1Query(
						`SELECT COALESCE(NULLIF(l.utm_source,''),'Unknown') AS source,
    COALESCE(NULLIF(l.utm_medium,''),'Unknown') AS medium, COUNT(*) AS total,
    SUM(CASE WHEN a.qualification IS NOT NULL AND a.qualification != 'not_assessed' THEN 1 ELSE 0 END) AS assessed,
    SUM(CASE WHEN a.qualification = 'qualified' THEN 1 ELSE 0 END) AS qualified,
    SUM(CASE WHEN a.qualification = 'spam' THEN 1 ELSE 0 END) AS spam
    FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${leadWhere.join(' AND ')} GROUP BY 1,2 ORDER BY total DESC`,
						args,
					),
					d1Query(
						`SELECT COALESCE(NULLIF(l.utm_campaign,''),'(none)') AS campaign,
    COALESCE(NULLIF(l.utm_source,''),'Unknown') AS source,
    COALESCE(NULLIF(l.utm_medium,''),'Unknown') AS medium,
    COUNT(*) AS total,
    SUM(CASE WHEN a.qualification = 'qualified' THEN 1 ELSE 0 END) AS qualified,
    ROUND(AVG(COALESCE(l.ai_score, 0)), 1) AS avg_score
    FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${leadWhere.join(' AND ')} GROUP BY 1,2,3 ORDER BY total DESC`,
						args,
					),
					d1Query(
						`SELECT COALESCE(NULLIF(l.source,''),'landing_page') AS placement,
    COUNT(*) AS total,
    SUM(CASE WHEN a.qualification = 'qualified' THEN 1 ELSE 0 END) AS qualified,
    ROUND(AVG(COALESCE(l.ai_score, 0)), 1) AS avg_score
    FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${where.join(' AND ')} GROUP BY 1 ORDER BY total DESC`,
						args,
					),
					d1Query(
						`SELECT COALESCE(NULLIF(l.ip_country,''), NULLIF(l.country,''), 'Unknown') AS country,
    COUNT(*) AS total,
    SUM(CASE WHEN a.qualification = 'qualified' THEN 1 ELSE 0 END) AS qualified
    FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${leadWhere.join(' AND ')} GROUP BY 1 ORDER BY total DESC`,
						args,
					),
				])
			return jsonNoStore({
				sources: result.results || [],
				campaigns: campaignsRes.results || [],
				placements: placementsRes.results || [],
				countries: countriesRes.results || [],
				latestEventId,
			})
		}
		if (p.get('view') === 'analytics') {
			where.push("COALESCE(l.source,'') NOT IN ('newsletter','popup')")
			const isHourly = timeframe === 'today' || timeframe === 'yesterday'
			const timeFormat = isHourly ? '%H' : '%Y-%m-%d'
			const [
				sourcesRes,
				trendsRes,
				stagesRes,
				qualRes,
				prioRes,
				followupsRes,
				urgentRes,
				followupItemsRes,
				latestEventId,
			] = await Promise.all([
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
				d1Query<{ status: string; count: number }>(
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
				d1Query<IntelligenceLead>(
					`SELECT l.*, COALESCE(a.version,0) AS assessment_version, COALESCE(a.qualification,'not_assessed') AS qualification, COALESCE(a.priority,'normal') AS priority, a.follow_up_at, COALESCE(a.next_action,'') AS next_action, COALESCE(a.reason,'') AS reason
    FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${where.join(' AND ')} AND (a.priority = 'high' OR COALESCE(l.status, 'new') = 'new')
    ORDER BY CASE WHEN a.priority = 'high' THEN 0 ELSE 1 END, l.created_at DESC LIMIT 5`,
					args,
				),
				d1Query<IntelligenceLead>(
					`SELECT l.*, COALESCE(a.version,0) AS assessment_version, COALESCE(a.qualification,'not_assessed') AS qualification, COALESCE(a.priority,'normal') AS priority, a.follow_up_at, COALESCE(a.next_action,'') AS next_action, COALESCE(a.reason,'') AS reason
    FROM leads l JOIN lead_assessments a ON a.lead_id=l.id
    WHERE ${actionWhere.join(' AND ')} AND a.follow_up_at IS NOT NULL AND l.status NOT IN ('closed','lost','won')
    ORDER BY a.follow_up_at ASC LIMIT 5`,
					actionArgs,
				),
				getLatestAdminEventId(),
			])

			const total = (stagesRes.results || []).reduce(
				(acc, row) => acc + (Number(row.count) || 0),
				0,
			)

			return jsonNoStore({
				sources: sourcesRes.results || [],
				trends: trendsRes.results || [],
				stages: stagesRes.results || [],
				qualifications: qualRes.results || [],
				priorities: prioRes.results || [],
				followups: followupsRes.results?.[0] || { total: 0, overdue: 0 },
				total,
				urgentItems: urgentRes.results || [],
				followupItems: followupItemsRes.results || [],
				latestEventId,
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
		const utmSource = (p.get('utmSource') || '').trim().slice(0, 200)
		if (utmSource === '__unknown__') {
			where.push("(l.utm_source IS NULL OR TRIM(l.utm_source) = '')")
		} else if (utmSource) {
			where.push('LOWER(TRIM(l.utm_source)) = LOWER(TRIM(?))')
			args.push(utmSource)
		}
		const utmMedium = (p.get('utmMedium') || '').trim().slice(0, 200)
		if (utmMedium === '__unknown__') {
			where.push("(l.utm_medium IS NULL OR TRIM(l.utm_medium) = '')")
		} else if (utmMedium) {
			where.push('LOWER(TRIM(l.utm_medium)) = LOWER(TRIM(?))')
			args.push(utmMedium)
		}
		const utmCampaign = (p.get('utmCampaign') || '').trim().slice(0, 200)
		if (utmCampaign === '__none__') {
			where.push("(l.utm_campaign IS NULL OR TRIM(l.utm_campaign) = '')")
		} else if (utmCampaign) {
			where.push('LOWER(TRIM(l.utm_campaign)) = LOWER(TRIM(?))')
			args.push(utmCampaign)
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
			return jsonNoStore({ error: 'Invalid page' }, { status: 400 })
		const base = `FROM leads l LEFT JOIN lead_assessments a ON a.lead_id=l.id WHERE ${where.join(' AND ')}`
		const [rows, count, staff, latestEventId] = await Promise.all([
			d1Query<IntelligenceLead>(
				`SELECT l.*, COALESCE(a.version,0) AS assessment_version, COALESCE(a.qualification,'not_assessed') AS qualification, COALESCE(a.priority,'normal') AS priority, a.follow_up_at, COALESCE(a.next_action,'') AS next_action, COALESCE(a.reason,'') AS reason ${base} ORDER BY ${filter === 'followups' ? 'a.follow_up_at ASC' : 'l.created_at DESC'} LIMIT 25 OFFSET ?`,
				[...args, (page - 1) * 25],
			),
			d1Query<{ total: number }>(`SELECT COUNT(*) AS total ${base}`, args),
			adminUsersDb.list(),
			getLatestAdminEventId(),
		])
		return jsonNoStore({
			items: rows.results || [],
			total: count.results?.[0]?.total || 0,
			staff: staff
				.filter((s) => s.status === 'active')
				.map((s) => ({ id: s.id, name: s.full_name })),
			latestEventId,
		})
	} catch (error) {
		const failure = leadStorageError(error)
		console.error('[Lead intelligence GET]', failure.code)
		return jsonNoStore(failure, { status: 503 })
	}
}

export async function POST(req: Request) {
	const auth = await requireAdminSession([
		'superadmin',
		'admin',
		'sales',
	])
	if (!auth.ok)
		return jsonNoStore({ error: auth.error }, { status: auth.status })
	try {
		const b = await req.json()
		if (!b || typeof b.id !== 'string')
			return jsonNoStore({ error: 'Lead ID required' }, { status: 400 })
		const lead = await leadsDb.getById(b.id)
		if (!lead)
			return jsonNoStore({ error: 'Lead not found' }, { status: 404 })
		if (
			auth.session.role === 'sales' &&
			lead.assigned_to !== auth.session.id
		)
			return jsonNoStore({ error: 'Forbidden' }, { status: 403 })
		if (!Number.isSafeInteger(b.assessment_version) || b.assessment_version < 0)
			return jsonNoStore(
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
			return jsonNoStore({ error: 'Invalid assessment' }, { status: 400 })
		if (b.qualification !== 'not_assessed' && !b.reason.trim())
			return jsonNoStore(
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
			return jsonNoStore(
				{ error: 'This assessment changed. Reopen the lead before saving.' },
				{ status: 409 },
			)
		return jsonNoStore({ success: true })
	} catch (error) {
		return jsonNoStore(leadStorageError(error), { status: 503 })
	}
}
