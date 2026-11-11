import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { getEnvVarSync } from './cf-env'
import { adminUsersDb } from './d1'
import { ROLE_PERMITTED_TABS, type AdminRole } from './admin-roles'
export * from './admin-roles'

export interface AdminSessionUser {
	id: string
	email: string
	name: string
	role: AdminRole
	createdAt: string
}
export const ADMIN_AUTH_COOKIE_NAME = 'deanflow_admin_session'
function secret(): string {
	const value = getEnvVarSync('ADMIN_JWT_SECRET')
	if (!value || Buffer.byteLength(value) < 32) throw new Error('ADMIN_JWT_SECRET must contain at least 32 bytes')
	return value
}
function credentialVersion(hash: string): string {
	return crypto.createHmac('sha256', secret()).update(hash).digest('hex')
}
export async function createAdminSessionToken(user: AdminSessionUser, expiresInSeconds = 28800): Promise<string> {
	const current = await adminUsersDb.getById(user.id)
	if (!current || current.status !== 'active') throw new Error('Account unavailable')
	const now = Math.floor(Date.now() / 1000)
	const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
	const payload = Buffer.from(JSON.stringify({ sub: current.id, role: current.role, iat: now,
		exp: now + Math.min(expiresInSeconds, 28800), credentials: credentialVersion(current.password_hash) })).toString('base64url')
	const data = `${header}.${payload}`
	return `${data}.${crypto.createHmac('sha256', secret()).update(data).digest('base64url')}`
}
export async function verifyAdminSessionToken(token?: string | null): Promise<AdminSessionUser | null> {
	if (!token || token.length > 4096) return null
	try {
		const parts = token.split('.')
		if (parts.length !== 3) return null
		const [header, payload, signature] = parts
		const h = JSON.parse(Buffer.from(header, 'base64url').toString())
		if (h.alg !== 'HS256' || h.typ !== 'JWT') return null
		const expected = crypto.createHmac('sha256', secret()).update(`${header}.${payload}`).digest()
		const actual = Buffer.from(signature, 'base64url')
		if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null
		const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
		const now = Math.floor(Date.now() / 1000)
		if (!Number.isFinite(claims.exp) || claims.exp <= now || !Number.isFinite(claims.iat) || claims.iat > now || typeof claims.sub !== 'string') return null
		const user = await adminUsersDb.getById(claims.sub)
		if (!user || user.status !== 'active' || !Object.hasOwn(ROLE_PERMITTED_TABS, user.role) || user.role !== claims.role || claims.credentials !== credentialVersion(user.password_hash)) return null
		return { id: user.id, email: user.email, name: user.full_name, role: user.role, createdAt: user.created_at }
	} catch { return null }
}
export async function getAdminSession(): Promise<AdminSessionUser | null> {
	return verifyAdminSessionToken((await cookies()).get(ADMIN_AUTH_COOKIE_NAME)?.value)
}
export async function requireAdminSession(roles?: AdminRole[]): Promise<
	{ ok: true; session: AdminSessionUser } | { ok: false; error: string; status: number }
> {
	const session = await getAdminSession()
	if (!session) return { ok: false, error: 'Unauthorized', status: 401 }
	if (roles?.length && !roles.includes(session.role)) return { ok: false, error: 'Forbidden', status: 403 }
	return { ok: true, session }
}
