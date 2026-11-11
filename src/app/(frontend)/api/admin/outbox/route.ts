import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { getEnvVarSync } from '@/lib/cf-env'
import { PersistenceError, d1Query } from '@/lib/d1'
import { drainOutbox, processOutbox } from '@/lib/outbox'

export async function GET(req: Request) {
	const auth = await requireAdminSession(['superadmin', 'admin'])
	if (!auth.ok) return NextResponse.json({ success: false }, { status: auth.status })

	try {
		const { searchParams } = new URL(req.url)
		const statusFilter = searchParams.get('status') || 'all'
		const allowed = ['all', 'pending', 'processing', 'sent', 'failed', 'dead_letter', 'superseded']
		if (!allowed.includes(statusFilter)) {
			return NextResponse.json({ success: false, message: 'Invalid outbox status filter' }, { status: 400 })
		}

		const whereClause = statusFilter === 'all' ? '' : 'WHERE status = ?'
		const params = statusFilter === 'all' ? [] : [statusFilter]
		const [jobsRes, summaryRes] = await Promise.all([
			d1Query<{
				id: string
				event_type: string
				status: string
				attempts: number
				max_attempts: number
				failure_kind: string | null
				last_error: string | null
				available_at: string
				sent_at: string | null
				dead_lettered_at: string | null
				provider_message_id: string | null
			}>(
				`SELECT id, event_type, status, attempts, max_attempts, failure_kind, last_error, available_at, sent_at, dead_lettered_at, provider_message_id
				FROM outbox ${whereClause} ORDER BY available_at DESC LIMIT 100`,
				params,
			),
			d1Query<{ status: string; count: number }>(
				'SELECT status, COUNT(*) AS count FROM outbox GROUP BY status',
			),
		])

		return NextResponse.json({
			success: true,
			jobs: jobsRes.results || [],
			summary: summaryRes.results || [],
		})
	} catch (error) {
		const status = error instanceof PersistenceError ? 503 : 500
		return NextResponse.json({ success: false }, { status })
	}
}

export async function POST(req: Request) {
	const configured = getEnvVarSync('OUTBOX_CRON_SECRET') || ''
	const supplied = req.headers.get('authorization')?.replace(/^Bearer /, '') || ''
	const scheduler =
		configured.length >= 32 &&
		Buffer.byteLength(configured) === Buffer.byteLength(supplied) &&
		timingSafeEqual(Buffer.from(configured), Buffer.from(supplied))
	const auth = scheduler ? { ok: true as const } : await requireAdminSession(['superadmin', 'admin'])
	if (!auth.ok) return NextResponse.json({ success: false }, { status: auth.status })

	try {
		const body = await req.json().catch(() => ({}))
		if (body && typeof body.replayJobId === 'string' && body.replayJobId.trim()) {
			const jobId = body.replayJobId.trim()
			const now = new Date().toISOString()
			const resetRes = await d1Query(
				`UPDATE outbox
				SET status = 'pending',
					available_at = ?,
					locked_until = NULL,
					dead_lettered_at = NULL,
					attempts = 0,
					last_error = NULL
				WHERE id = ? AND status IN ('failed', 'dead_letter')`,
				[now, jobId],
			)
			if ((resetRes.meta?.changes ?? 0) !== 1) {
				return NextResponse.json(
					{ success: false, message: 'Outbox job not eligible for replay (missing or already sent/superseded)' },
					{ status: 404 },
				)
			}
			const result = await processOutbox(jobId)
			return NextResponse.json({ success: true, replayed: true, result })
		}

		return NextResponse.json({ success: true, ...(await drainOutbox(10)) })
	} catch {
		return NextResponse.json({ success: false }, { status: 503 })
	}
}
