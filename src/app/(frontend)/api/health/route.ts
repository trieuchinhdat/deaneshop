import { NextResponse } from 'next/server'
import { getEnvVarSync } from '@/lib/cf-env'
import { d1Query, getD1RuntimeMode } from '@/lib/d1'

export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		const mode = await getD1RuntimeMode()
		const nodeEnv = getEnvVarSync('NODE_ENV') || process.env.NODE_ENV
		if (
			mode === 'unconfigured' ||
			(nodeEnv === 'production' && mode === 'memory')
		) {
			return NextResponse.json(
				{ ok: false, database: 'unavailable' },
				{ status: 503, headers: { 'Cache-Control': 'no-store' } },
			)
		}

		await d1Query(
			'SELECT submission_key, submission_hash, submission_result, dossier_payload FROM leads LIMIT 0',
		)
		await d1Query('SELECT lead_id FROM lead_assessments LIMIT 0')
		await d1Query('SELECT lead_id FROM wholesale_rfq_lead_projection LIMIT 0')
		const triggers = await d1Query<{ count: number }>(
			"SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'trigger' AND name IN ('lead_dossier_job','wholesale_rfq_to_lead','wholesale_rfq_lead_priority')",
		)
		if (triggers.results[0]?.count !== 3)
			throw new Error('Required database migrations are missing')
		return NextResponse.json(
			{ ok: true, database: 'connected' },
			{ status: 200, headers: { 'Cache-Control': 'no-store' } },
		)
	} catch {
		return NextResponse.json(
			{ ok: false, database: 'unavailable' },
			{ status: 503, headers: { 'Cache-Control': 'no-store' } },
		)
	}
}
