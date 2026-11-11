import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { d1Query, getD1RuntimeMode } from '@/lib/d1'

export const dynamic = 'force-dynamic'

const REQUIRED_TABLES = [
	'leads',
	'admin_users',
	'orders',
	'reviews',
	'comments',
	'request_limits',
	'quote_access',
	'quote_versions',
	'quote_events',
	'outbox',
	'admin_events',
	'order_payments',
	'order_notes',
	'lead_notes',
	'lead_assessments',
	'import_batches',
]

const REQUIRED_TRIGGERS = [
	'record_quote_transition',
	'order_committed',
	'order_changed',
	'lead_committed',
	'lead_changed',
	'issued_quote_snapshot',
	'quote_snapshot_immutable_update',
	'quote_snapshot_immutable_delete',
	'order_email_job',
	'quote_email_job',
	'lock_issued_commercial_terms',
	'lock_approved_quote',
	'lead_notify_job',
	'lead_dossier_job',
	'validate_order_financials_insert',
	'validate_order_financials_update',
	'prevent_last_superadmin_demotion',
	'prevent_last_superadmin_delete',
	'prevent_ineligible_order_soft_delete',
	'prevent_deleted_order_mutation',
	'cleanup_soft_deleted_order',
	'wholesale_rfq_to_lead',
	'wholesale_rfq_lead_priority',
]

export async function GET() {
	const auth = await requireAdminSession(['superadmin', 'admin'])
	if (!auth.ok)
		return NextResponse.json({ healthy: false }, { status: auth.status })

	const d1Mode = await getD1RuntimeMode()
	if (
		d1Mode === 'unconfigured' ||
		(process.env.NODE_ENV === 'production' && d1Mode === 'memory')
	) {
		return NextResponse.json(
			{
				healthy: false,
				d1Mode,
				reason: 'D1 persistent storage is not configured',
			},
			{ status: 503, headers: { 'Cache-Control': 'no-store' } },
		)
	}

	try {
		await d1Query(
			'SELECT lead_id, version, qualification, priority, follow_up_at, next_action, reason FROM lead_assessments LIMIT 0',
		)
		await d1Query('SELECT request_hash, commerce_json FROM orders LIMIT 0')
		await d1Query('SELECT attribution_json, consent_json FROM leads LIMIT 0')
		await d1Query(
			'SELECT submission_key, submission_hash, submission_result, dossier_payload FROM leads LIMIT 0',
		)
		await d1Query('SELECT lead_id FROM wholesale_rfq_lead_projection LIMIT 0')
		await d1Query('SELECT version FROM quote_access LIMIT 0')
		await d1Query(
			'SELECT order_id, version, snapshot FROM quote_versions LIMIT 0',
		)
		await d1Query('SELECT id, action FROM quote_events LIMIT 0')

		const [objectsRes, queueRes] = await Promise.all([
			d1Query<{ type: string; name: string }>(
				`SELECT type, name FROM sqlite_master WHERE type IN ('table', 'trigger')`,
			),
			d1Query<{ status: string; count: number }>(
				'SELECT status, COUNT(*) AS count FROM outbox GROUP BY status',
			),
		])

		const existingTables = new Set(
			objectsRes.results.filter((o) => o.type === 'table').map((o) => o.name),
		)
		const existingTriggers = new Set(
			objectsRes.results.filter((o) => o.type === 'trigger').map((o) => o.name),
		)

		const missingTables = REQUIRED_TABLES.filter((t) => !existingTables.has(t))
		const missingTriggers = REQUIRED_TRIGGERS.filter(
			(t) => !existingTriggers.has(t),
		)

		let appliedMigrations: string[] = []
		if (existingTables.has('d1_migrations')) {
			const migRes = await d1Query<{ name: string }>(
				'SELECT name FROM d1_migrations ORDER BY id ASC',
			).catch(() => ({ results: [] }))
			appliedMigrations = migRes.results.map((m) => m.name)
		}

		const healthy = missingTables.length === 0 && missingTriggers.length === 0
		return NextResponse.json(
			{
				healthy,
				d1Mode,
				missingTables,
				missingTriggers,
				appliedMigrations,
				queue: queueRes.results,
			},
			{
				status: healthy ? 200 : 503,
				headers: { 'Cache-Control': 'no-store' },
			},
		)
	} catch {
		return NextResponse.json(
			{ healthy: false, d1Mode },
			{ status: 503, headers: { 'Cache-Control': 'no-store' } },
		)
	}
}
