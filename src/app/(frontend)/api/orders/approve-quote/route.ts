import { NextResponse } from 'next/server'
import { transitionQuote } from '@/lib/quote-transition'
import { assertOrdersApiEnabled } from '@/lib/orders-guard'
export async function POST(request: Request) {
	const disabled = assertOrdersApiEnabled()
	if (disabled) return disabled
	try {
		const result = await transitionQuote(await request.json(), 'approved')
		return NextResponse.json({ success: result.success, message: result.success ? 'Quotation updated.' : 'Quotation unavailable, unauthorized, or no longer open for this action.' }, { status: result.status })
	} catch { return NextResponse.json({ success: false, message: 'Quotation service unavailable' }, { status: 503 }) }
}
