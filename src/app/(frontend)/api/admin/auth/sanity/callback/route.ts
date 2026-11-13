import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_AUTH_COOKIE_NAME, createAdminSessionToken } from '@/lib/admin-auth'
import { getAdminAuthMode } from '@/lib/admin-auth-mode'
import { adminUsersDb } from '@/lib/d1'
import { redeemSanityLoginCode, validLoginNonce, SANITY_LOGIN_COOKIE } from '@/lib/sanity-login-bridge'
import { sanityLoginConfig, loginResponseHeaders } from '@/lib/sanity-login-config'
import { getEnvVarSync } from '@/lib/cf-env'

export async function GET(request: Request) {
	try {
		const { web } = sanityLoginConfig()
		const url = new URL(request.url)
		if (getAdminAuthMode() !== 'sanity' || url.origin !== web.origin)
			return NextResponse.json({ error: 'Sign-in is unavailable.' }, { status: 403, headers: loginResponseHeaders })
		const state = url.searchParams.get('state')
		const code = url.searchParams.get('code')
		const jar = await cookies()
		const verifier = jar.get(SANITY_LOGIN_COOKIE)?.value
		if (!validLoginNonce(state) || !validLoginNonce(code) || !validLoginNonce(verifier))
			return NextResponse.redirect(new URL('/admin?login=expired', web), { status: 303, headers: loginResponseHeaders })
		const grant = await redeemSanityLoginCode(state, code, verifier)
		if (!grant || grant.project_id !== getEnvVarSync('NEXT_PUBLIC_SANITY_PROJECT_ID'))
			return NextResponse.redirect(new URL('/admin?login=expired', web), { status: 303, headers: loginResponseHeaders })
		const user = await adminUsersDb.getById(grant.staff_id)
		if (!user || user.status !== 'active' || user.sanity_user_id !== grant.sanity_user_id)
			return NextResponse.redirect(new URL('/admin?login=expired', web), { status: 303, headers: loginResponseHeaders })
		const session = { id: user.id, email: user.email, name: user.full_name, role: user.role, createdAt: user.created_at }
		const token = await createAdminSessionToken(session, 3600, { userId: grant.sanity_user_id, projectId: grant.project_id })
		await adminUsersDb.update(user.id, { last_login_at: new Date().toISOString() })
		jar.set(ADMIN_AUTH_COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 3600, path: '/' })
		jar.set(SANITY_LOGIN_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' })
		return NextResponse.redirect(new URL('/admin', web), { status: 303, headers: loginResponseHeaders })
	} catch {
		return NextResponse.json({ error: 'Sign-in unavailable. Start again from /admin.' }, { status: 503, headers: loginResponseHeaders })
	}
}
