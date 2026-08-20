import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_AUTH_COOKIE_NAME } from '@/lib/admin-auth'

export async function POST() {
	try {
		const cookieStore = await cookies()
		cookieStore.set(ADMIN_AUTH_COOKIE_NAME, '', {
			path: '/',
			maxAge: 0,
			expires: new Date(0),
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
		})

		return NextResponse.json({
			success: true,
			message: 'Đăng xuất tài khoản Admin thành công.',
		})
	} catch (error: any) {
		console.error('Lỗi API Admin Logout:', error)
		return NextResponse.json(
			{ success: false, error: 'Không thể đăng xuất.' },
			{ status: 500 },
		)
	}
}
