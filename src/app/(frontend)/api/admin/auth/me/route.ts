import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'

export async function GET() {
	try {
		const session = await getAdminSession()

		if (!session) {
			return NextResponse.json(
				{ success: false, error: 'Chưa đăng nhập quyền Admin.' },
				{ status: 401 },
			)
		}

		return NextResponse.json({
			success: true,
			user: session,
		})
	} catch (error: any) {
		console.error('Lỗi API Admin Me:', error)
		return NextResponse.json(
			{ success: false, error: 'Lỗi kiểm tra phiên làm việc.' },
			{ status: 500 },
		)
	}
}
