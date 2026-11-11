import { NextResponse } from 'next/server'

const METRIC_BUDGETS = {
	lcpMs: 2500,
	inpMs: 200,
	cls: 0.1,
	checkoutMs: 60000,
}

export async function POST(req: Request) {
	try {
		const raw = await req.json().catch(() => null)
		if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
			return NextResponse.json({ ok: false }, { status: 400 })
		}

		const lcp = typeof raw.lcp === 'number' && Number.isFinite(raw.lcp) && raw.lcp >= 0 && raw.lcp <= 120000 ? raw.lcp : undefined
		const inp = typeof raw.inp === 'number' && Number.isFinite(raw.inp) && raw.inp >= 0 && raw.inp <= 60000 ? raw.inp : undefined
		const cls = typeof raw.cls === 'number' && Number.isFinite(raw.cls) && raw.cls >= 0 && raw.cls <= 10 ? raw.cls : undefined
		const checkoutMs =
			typeof raw.checkoutMs === 'number' && Number.isFinite(raw.checkoutMs) && raw.checkoutMs >= 0 && raw.checkoutMs <= 600000
				? raw.checkoutMs
				: undefined
		const device = raw.device === 'mobile' ? 'mobile' : 'desktop'
		const path = typeof raw.path === 'string' ? raw.path.slice(0, 120) : '/'

		const withinBudget =
			(lcp === undefined || lcp <= METRIC_BUDGETS.lcpMs) &&
			(inp === undefined || inp <= METRIC_BUDGETS.inpMs) &&
			(cls === undefined || cls <= METRIC_BUDGETS.cls) &&
			(checkoutMs === undefined || checkoutMs <= METRIC_BUDGETS.checkoutMs)

		if (!withinBudget) {
			console.warn('[WebVitals Budget Warning]', { path, device, lcp, inp, cls, checkoutMs })
		}

		return NextResponse.json({ ok: true, withinBudget }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
	} catch {
		return NextResponse.json({ ok: false }, { status: 400 })
	}
}

