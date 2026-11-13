import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_AUTH_COOKIE_NAME, createAdminSessionToken } from '@/lib/admin-auth'
import { adminUsersDb } from '@/lib/d1'
import { takeRateLimit } from '@/lib/rate-limit'
import { getAdminAuthMode } from '@/lib/admin-auth-mode'

export async function POST(req: Request) {
	const reply = (body: object, status = 200, headers: Record<string, string> = {}) =>
		NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
	try {
		if (getAdminAuthMode() !== 'password') return reply({ success: false, error: 'Password sign-in is disabled.' }, 403)
		if (req.headers.has('origin') && req.headers.get('origin') !== new URL(req.url).origin)
			return reply({ success: false, error: 'Invalid request origin.' }, 403)
		const body: unknown = await req.json().catch(() => null)
		if (!body || typeof body !== 'object' || !('email' in body) || !('password' in body)) {
			return reply({ success: false, error: 'Invalid credentials' }, 400)
		}
		const { email, password } = body
		if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
			typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
			return reply({ success: false, error: 'Invalid credentials' }, 400)
		}
		const cleanEmail = email.trim().toLowerCase()
		if (!(await takeRateLimit('login-ip', req.headers.get('cf-connecting-ip') || 'unknown', 30)) ||
			!(await takeRateLimit('login', cleanEmail, 5)))
			return reply({ success: false, error: 'Too many attempts. Try again later.' }, 429, { 'Retry-After': '900' })
		const user = await adminUsersDb.getByEmail(cleanEmail)
		if (!user || user.status !== 'active') {
			return reply({ success: false, error: 'Invalid credentials' }, 401)
		}
		const { verifyPassword } = await import('@/lib/passwords')
		if (!(await verifyPassword(password, user.password_hash))) {
			return reply({ success: false, error: 'Invalid credentials' }, 401)
		}
		const session = { id: user.id, email: user.email, name: user.full_name, role: user.role, createdAt: user.created_at }
		const token = await createAdminSessionToken(session)
		await adminUsersDb.update(user.id, { last_login_at: new Date().toISOString() })
		;(await cookies()).set(ADMIN_AUTH_COOKIE_NAME, token, {
			httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 28800, path: '/',
		})
		return reply({ success: true, user: session })
	} catch {
		return reply({ success: false, error: 'Authentication service unavailable' }, 503)
	}
}
