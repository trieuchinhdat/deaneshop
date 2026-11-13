import { NextResponse } from 'next/server'
import { getAdminAuthMode } from '@/lib/admin-auth-mode'
import { adminUsersDb } from '@/lib/d1'
import { takeRateLimit } from '@/lib/rate-limit'
import { issueSanityLoginCode, validLoginNonce } from '@/lib/sanity-login-bridge'
import { sanityLoginConfig, loginResponseHeaders } from '@/lib/sanity-login-config'
import { resolveSanityStaff } from '@/lib/sanity-staff-access'
import { verifySanityStaffToken, SanityIdentityError } from '@/lib/sanity-staff-identity'

function corsHeaders(request: Request) {
	const { studio, web } = sanityLoginConfig()
	if (request.headers.get('origin') !== studio.origin || new URL(request.url).origin !== web.origin)
		return null
	return {
		...loginResponseHeaders,
		'Access-Control-Allow-Origin': studio.origin,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Authorization, Content-Type',
		Vary: 'Origin',
	}
}

export async function OPTIONS(request: Request) {
	try {
		const headers = corsHeaders(request)
		return new Response(null, { status: headers ? 204 : 403, headers: headers || loginResponseHeaders })
	} catch {
		return new Response(null, { status: 503, headers: loginResponseHeaders })
	}
}

export async function POST(request: Request) {
	let headers: Record<string, string> = loginResponseHeaders
	const reply = (data: object, status: number) => NextResponse.json(data, { status, headers })
	try {
		const allowed = corsHeaders(request)
		if (!allowed) return reply({ error: 'Invalid Studio origin.' }, 403)
		headers = allowed
		if (getAdminAuthMode() !== 'sanity') return reply({ error: 'Sanity sign-in is disabled.' }, 403)
		const authorization = request.headers.get('authorization') || ''
		if (!/^Bearer [A-Za-z0-9._~-]{20,4096}$/.test(authorization))
			return reply({ error: 'A personal Sanity session is required.' }, 401)
		const state = new URL(request.url).searchParams.get('state')
		if (!validLoginNonce(state)) return reply({ error: 'Start sign-in from the website again.' }, 400)
		if (!(await takeRateLimit('sanity-login-ip', request.headers.get('cf-connecting-ip') || 'unknown', 20, 60)))
			return reply({ error: 'Too many attempts. Try again later.' }, 429)
		const identity = await verifySanityStaffToken(authorization.slice(7))
		if (!(await takeRateLimit('sanity-login-user', identity.userId, 5)))
			return reply({ error: 'Too many attempts. Try again later.' }, 429)
		const user = await adminUsersDb.getBySanityId(identity.userId) || await resolveSanityStaff(identity)
		if (!user || user.status !== 'active' || user.sanity_user_id !== identity.userId)
			return reply({ error: 'Staff account unavailable. Contact your administrator.' }, 403)
		const code = await issueSanityLoginCode(state, {
			staff_id: user.id, sanity_user_id: identity.userId, project_id: identity.projectId,
		})
		if (!code) return reply({ error: 'Sign-in expired or already used. Start again.' }, 400)
		return reply({ code }, 200)
	} catch (error) {
		if (error instanceof SanityIdentityError) return reply({ error: error.message }, error.status)
		return reply({ error: 'Sign-in unavailable. Check configuration and migration 0014.' }, 503)
	}
}
