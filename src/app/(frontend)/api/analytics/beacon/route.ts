import { NextResponse } from 'next/server'
import {
	normalizeAnalyticsEvent,
	writeAnalyticsDataPoint,
} from '@/lib/analytics-engine'

function readCountryHeader(req: Request): string {
	const cf = (req as Request & { cf?: { country?: string } }).cf
	const raw = cf?.country || req.headers.get('cf-ipcountry') || ''
	const clean = raw.trim().toUpperCase()
	return /^[A-Z]{2}$/.test(clean) ? clean : ''
}

export async function POST(req: Request) {
	try {
		const raw = await req.json().catch(() => null)
		const normalized = normalizeAnalyticsEvent(raw)
		if (!normalized) {
			return NextResponse.json(
				{ ok: false, error: 'Invalid telemetry payload' },
				{ status: 400, headers: { 'Cache-Control': 'no-store' } },
			)
		}

		const country = normalized.country || readCountryHeader(req)
		const recorded = await writeAnalyticsDataPoint({
			...normalized,
			country,
		})

		return NextResponse.json(
			{ ok: true, recorded },
			{ status: 202, headers: { 'Cache-Control': 'no-store' } },
		)
	} catch {
		return NextResponse.json(
			{ ok: false },
			{ status: 400, headers: { 'Cache-Control': 'no-store' } },
		)
	}
}

