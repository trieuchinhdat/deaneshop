import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_AUTH_COOKIE_NAME, createAdminSessionToken } from '@/lib/admin-auth'
import { adminUsersDb } from '@/lib/d1'
import { verifyPassword } from '@/lib/passwords'
import { takeRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
	try {
		const { email, password } = await req.json()
		if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || password.length > 256) {
			return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 400 })
		}
		const cleanEmail = email.trim().toLowerCase()
		if (!(await takeRateLimit('login', cleanEmail, 5))) return NextResponse.json({ success: false, error: 'Too many attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': '900' } })
		const user = await adminUsersDb.getByEmail(cleanEmail)
		if (!user || user.status !== 'active' || !(await verifyPassword(password, user.password_hash))) {
			return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
		}
		const session = { id: user.id, email: user.email, name: user.full_name, role: user.role, createdAt: user.created_at }
		const token = await createAdminSessionToken(session)
		await adminUsersDb.update(user.id, { last_login_at: new Date().toISOString() })
		;(await cookies()).set(ADMIN_AUTH_COOKIE_NAME, token, {
			httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 28800, path: '/',
		})
		return NextResponse.json({ success: true, user: session })
	} catch {
		return NextResponse.json({ success: false, error: 'Authentication service unavailable' }, { status: 503 })
	}
}
