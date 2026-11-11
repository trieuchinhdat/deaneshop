import { formatAdminOrder } from '@/lib/admin-format'
import { requireAdminSession } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'
import { PersistenceError, ordersDb } from '@/lib/d1'

export async function GET(request: Request) {
	try {
		const auth = await requireAdminSession(['superadmin', 'admin', 'cskh'])
		if (!auth.ok) return NextResponse.json({ success: false }, { status: auth.status })
		const { searchParams } = new URL(request.url)
		const status = searchParams.get('status') || 'ALL'
		const search = searchParams.get('search') || ''
		const limit = Number(searchParams.get('limit')) || 100
		const offset = Number(searchParams.get('offset')) || 0

		// 1. Fetch from Cloudflare D1 (Primary fast edge query)
		const [d1Orders, d1Counts] = await Promise.all([
			ordersDb.list({
				status,
				search,
				limit,
				offset,
			}),
			ordersDb.counts(),
		])

		// Format D1 orders to match expected frontend structure
		const formattedOrders = (d1Orders || []).map((order) => formatAdminOrder(order))

		return NextResponse.json({ success: true, source: 'cloudflare-d1', orders: formattedOrders, counts: d1Counts })
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API Orders List Error:', error)
		return NextResponse.json(
			{ success: false, message: status === 503 ? 'Order database unavailable' : error.message || 'Error loading orders' },
			{ status },
		)
	}
}
