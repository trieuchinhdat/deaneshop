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
			message: 'Admin signed out successfully.',
		})
	} catch (error: any) {
		console.error('API Admin Logout error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to sign out.' },
			{ status: 500 },
		)
	}
}
