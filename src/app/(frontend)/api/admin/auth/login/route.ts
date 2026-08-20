import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
	ADMIN_AUTH_COOKIE_NAME,
	createAdminSessionToken,
	DEFAULT_ADMIN_EMAIL,
	verifyAdminCredentials,
} from '@/lib/admin-auth'

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}))
		const { email, password } = body

		if (!password) {
			return NextResponse.json(
				{ success: false, error: 'Vui lòng nhập mật khẩu quản trị.' },
				{ status: 400 },
			)
		}

		const isValid = verifyAdminCredentials(password, email)

		if (!isValid) {
			return NextResponse.json(
				{
					success: false,
					error: 'Tài khoản hoặc mật khẩu quản trị không chính xác. Vui lòng thử lại.',
				},
				{ status: 401 },
			)
		}

		const adminUser = {
			id: 'admin-root',
			email: email && email.includes('@') ? email.trim() : DEFAULT_ADMIN_EMAIL,
			name: 'Admin CSKH',
			role: 'admin' as const,
			createdAt: new Date().toISOString(),
		}

		const token = await createAdminSessionToken(adminUser, 60 * 60 * 24 * 7) // 7 ngày

		const cookieStore = await cookies()
		cookieStore.set(ADMIN_AUTH_COOKIE_NAME, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7,
			path: '/',
		})

		return NextResponse.json({
			success: true,
			user: adminUser,
			message: 'Đăng nhập trang quản trị thành công!',
		})
	} catch (error: any) {
		console.error('Lỗi API Admin Login:', error)
		return NextResponse.json(
			{ success: false, error: error?.message || 'Có lỗi xảy ra khi xác thực.' },
			{ status: 500 },
		)
	}
}
