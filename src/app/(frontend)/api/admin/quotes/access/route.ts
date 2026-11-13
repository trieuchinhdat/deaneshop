import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { d1Query, ordersDb } from '@/lib/d1'
import { issueQuoteAccess } from '@/lib/quote-access'

export async function POST(req: Request) {
	const auth = await requireAdminSession(['superadmin', 'admin'])
	if (!auth.ok) return NextResponse.json({ success: false }, { status: auth.status })
	try {
		const { orderId, revoke } = await req.json()
		if (typeof orderId !== 'string') return NextResponse.json({ success: false }, { status: 400 })
		const order = await ordersDb.getById(orderId)
		if (!order || !order.quote_status) return NextResponse.json({ success: false }, { status: 404 })
		if (revoke) {
			await d1Query('UPDATE quote_access SET revoked_at = ? WHERE order_id = ?', [new Date().toISOString(), order.id])
			return NextResponse.json({ success: true })
		}
		const token = await issueQuoteAccess(order.id)
		return NextResponse.json({ success: true, path: `/quote/${encodeURIComponent(order.order_number)}?token=${token}` }, { headers: { 'Cache-Control': 'no-store' } })
	} catch { return NextResponse.json({ success: false }, { status: 503 }) }
}
