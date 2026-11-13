import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { queryAnalyticsEngineOverview } from '@/lib/analytics-engine'

export async function GET(req: Request) {
	const auth = await requireAdminSession([
		'superadmin',
		'admin',
		'marketing',
		'sales',
	])
	if (!auth.ok) {
		return NextResponse.json(
			{ error: auth.error },
			{ status: auth.status, headers: { 'Cache-Control': 'no-store' } },
		)
	}

	const url = new URL(req.url)
	const days = Number(url.searchParams.get('days') || '7')
	const summary = await queryAnalyticsEngineOverview(
		Number.isFinite(days) ? days : 7,
	)

	return NextResponse.json(summary, {
		status: 200,
		headers: { 'Cache-Control': 'no-store' },
	})
}

