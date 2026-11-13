import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAdminAuthMode } from '@/lib/admin-auth-mode'
import { takeRateLimit } from '@/lib/rate-limit'
import { beginSanityLogin, SANITY_LOGIN_COOKIE } from '@/lib/sanity-login-bridge'
import { sanityLoginConfig, loginResponseHeaders } from '@/lib/sanity-login-config'

export async function GET(request: Request) {
	try {
		if (getAdminAuthMode() !== 'sanity')
			return NextResponse.json({ error: 'Sanity sign-in is disabled.' }, { status: 403, headers: loginResponseHeaders })
		const { studio, web } = sanityLoginConfig()
		if (new URL(request.url).origin !== web.origin)
			return NextResponse.json({ error: 'Invalid website origin.' }, { status: 403, headers: loginResponseHeaders })
		if (!(await takeRateLimit('sanity-login-start', request.headers.get('cf-connecting-ip') || 'unknown', 20, 60)))
			return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429, headers: loginResponseHeaders })
		const { state, verifier } = await beginSanityLogin()
		;(await cookies()).set(SANITY_LOGIN_COOKIE, verifier, {
			httpOnly: true, secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax', maxAge: 300, path: '/',
		})
		const target = new URL('/workspace-login', studio)
		target.searchParams.set('state', state)
		return NextResponse.redirect(target, { status: 303, headers: loginResponseHeaders })
	} catch {
		return NextResponse.json({ error: 'Sign-in unavailable. Check Studio configuration and migration 0014.' }, { status: 503, headers: loginResponseHeaders })
	}
}
