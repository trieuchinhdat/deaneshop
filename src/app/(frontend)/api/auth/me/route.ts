import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth'
import { writeClient } from '@/sanity/lib/write-client'

export async function GET(request: NextRequest) {
	try {
		const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
		if (!token) {
			return NextResponse.json({ user: null })
		}

		const session = await verifySessionToken(token)
		if (!session) {
			const res = NextResponse.json({ user: null })
			res.cookies.delete(AUTH_COOKIE_NAME)
			return res
		}

		// Lấy dữ liệu mới nhất của customer từ Sanity (đơn hàng, chi tiêu, v.v.)
		let customerData = null
		try {
			if (session.id && !session.id.startsWith('cust-google-')) {
				customerData = await writeClient.fetch(
					`*[_type == "customer" && _id == $id][0]{
						_id,
						name,
						email,
						phone,
						avatar,
						authProvider,
						cskhStatus,
						orderCount,
						totalSpent,
						address,
						couponReceived,
						createdAt,
						lastLoginAt
					}`,
					{ id: session.id },
				)
			}
		} catch (err) {
			console.error('Lỗi fetch customer từ Sanity trong api/auth/me:', err)
		}

		return NextResponse.json({
			user: {
				id: session.id,
				email: customerData?.email || session.email,
				name: customerData?.name || session.name || 'Khách hàng',
				avatar: customerData?.avatar || session.avatar || '',
				phone: customerData?.phone || session.phone || '',
				address: customerData?.address || '',
				authProvider: customerData?.authProvider || session.authProvider,
				cskhStatus: customerData?.cskhStatus || 'customer',
				orderCount: customerData?.orderCount || 0,
				totalSpent: customerData?.totalSpent || 0,
				couponReceived: customerData?.couponReceived || '',
				createdAt: customerData?.createdAt || session.createdAt,
			},
		})
	} catch (error) {
		console.error('Lỗi kiểm tra session:', error)
		return NextResponse.json({ user: null }, { status: 500 })
	}
}
