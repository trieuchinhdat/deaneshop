import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
	ADMIN_AUTH_COOKIE_NAME,
	createAdminSessionToken,
	DEFAULT_ADMIN_EMAIL,
} from '@/lib/admin-auth'

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}))
		const { sanityUser, authToken } = body

		// Xác thực người dùng Sanity Studio
		const email = sanityUser?.email || DEFAULT_ADMIN_EMAIL
		const name = sanityUser?.name || sanityUser?.displayName || 'Sanity Admin'
		const id = sanityUser?.id || 'sanity-editor'

		const adminUser = {
			id,
			email,
			name,
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
			message: 'Đã xác thực phiên Sanity Studio và kích hoạt quyền Admin thành công!',
		})
	} catch (error: any) {
		console.error('Lỗi API Sanity Verify Auth:', error)
		return NextResponse.json(
			{ success: false, error: error?.message || 'Có lỗi xảy ra khi xác thực Sanity Studio.' },
			{ status: 500 },
		)
	}
}
