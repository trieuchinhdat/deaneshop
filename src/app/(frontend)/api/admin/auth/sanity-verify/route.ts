import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
	ADMIN_AUTH_COOKIE_NAME,
	createAdminSessionToken,
} from '@/lib/admin-auth'
import { getAdminAuthMode } from '@/lib/admin-auth-mode'
import { adminUsersDb } from '@/lib/d1'
import { takeRateLimit } from '@/lib/rate-limit'
import { adminLoginError } from '@/lib/admin-login-error'
import { resolveSanityStaff } from '@/lib/sanity-staff-access'
import {
	SanityIdentityError,
	verifySanityStaffToken,
} from '@/lib/sanity-staff-identity'

export async function POST(request: Request) {
	let stage = 'configuration'
	const reply = (data: object, status: number) =>
		NextResponse.json(data, {
			status,
			headers: { 'Cache-Control': 'no-store' },
		})
	try {
		if (getAdminAuthMode() !== 'sanity')
			return reply(
				{ success: false, error: 'Sanity sign-in is disabled.' },
				403,
			)
		if (request.headers.get('origin') !== new URL(request.url).origin)
			return reply({ success: false, error: 'Invalid request origin.' }, 403)
		const authorization = request.headers.get('authorization') || ''
		if (!/^Bearer [A-Za-z0-9._~-]{20,4096}$/.test(authorization))
			return reply(
				{ success: false, error: 'A personal Sanity session is required.' },
				401,
			)
		const ip = request.headers.get('cf-connecting-ip') || 'unknown'
		stage = 'rate-limit'
		if (!(await takeRateLimit('sanity-login-ip', ip, 20, 60)))
			return reply(
				{ success: false, error: 'Too many attempts. Try again later.' },
				429,
			)
		stage = 'sanity-verification'
		const identity = await verifySanityStaffToken(authorization.slice(7))
		if (!(await takeRateLimit('sanity-login-user', identity.userId, 5)))
			return reply(
				{ success: false, error: 'Too many attempts. Try again later.' },
				429,
			)
		stage = 'staff-lookup'
		let user = await adminUsersDb.getBySanityId(identity.userId)
		if (!user) {
			stage = 'staff-provisioning'
			user = await resolveSanityStaff(identity)
		}
		if (!user || user.status !== 'active')
			return reply(
				{
					success: false,
					error:
						'Your staff account is inactive, has a conflicting identity, or Sanity did not provide an email. Contact your administrator.',
				},
				403,
			)
		const session = {
			id: user.id,
			email: user.email,
			name: user.full_name,
			role: user.role,
			createdAt: user.created_at,
		}
		stage = 'session'
		const token = await createAdminSessionToken(session, 3600, identity)
		stage = 'last-login'
		await adminUsersDb.update(user.id, {
			last_login_at: new Date().toISOString(),
		})
		stage = 'cookie'
		;(await cookies()).set(ADMIN_AUTH_COOKIE_NAME, token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 3600,
			path: '/',
		})
		return reply({ success: true, user: session }, 200)
	} catch (error) {
		if (error instanceof SanityIdentityError)
			return reply({ success: false, error: error.message }, error.status)
		const failure = adminLoginError(error)
		console.error('[Sanity sign-in]', { stage, code: failure.code })
		return reply({ success: false, ...failure }, 503)
	}
}
