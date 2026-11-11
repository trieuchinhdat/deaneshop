import { createHash } from 'node:crypto'
import { d1Query } from './d1'
import { getAdminSession } from './admin-auth'

export { issueQuoteAccess } from './quote-token'

export interface ResolvedQuoteAccess {
	authorized: boolean
	isStaff: boolean
	tokenVersion: number | null
	latestIssuedVersion: number | null
	isSuperseded: boolean
	isExpiredToken: boolean
}

export async function resolveQuoteAccess(
	orderId: string,
	token?: string | null,
	nowDate?: Date,
): Promise<ResolvedQuoteAccess> {
	const session = await getAdminSession()
	const latestRes = await d1Query<{ version: number }>(
		'SELECT MAX(version) AS version FROM quote_versions WHERE order_id = ?',
		[orderId],
	)
	const latestIssuedVersion = latestRes.results?.[0]?.version ?? null

	if (session && ['admin', 'superadmin', 'cskh'].includes(session.role)) {
		return {
			authorized: true,
			isStaff: true,
			tokenVersion: latestIssuedVersion,
			latestIssuedVersion,
			isSuperseded: false,
			isExpiredToken: false,
		}
	}

	if (!token || !/^[a-f0-9]{64}$/.test(token)) {
		return {
			authorized: false,
			isStaff: false,
			tokenVersion: null,
			latestIssuedVersion,
			isSuperseded: false,
			isExpiredToken: false,
		}
	}

	const tokenHash = createHash('sha256').update(token).digest('hex')
	const accessRes = await d1Query<{
		order_id: string
		expires_at: string
		revoked_at: string | null
		version: number
	}>(
		'SELECT order_id, expires_at, revoked_at, version FROM quote_access WHERE order_id = ? AND token_hash = ? LIMIT 1',
		[orderId, tokenHash],
	)
	const row = accessRes.results?.[0]
	if (!row || row.revoked_at) {
		return {
			authorized: false,
			isStaff: false,
			tokenVersion: null,
			latestIssuedVersion,
			isSuperseded: false,
			isExpiredToken: false,
		}
	}

	const nowIso = (nowDate ?? new Date()).toISOString()
	const isExpiredToken = row.expires_at <= nowIso
	const isSuperseded =
		latestIssuedVersion !== null && row.version > 0 && row.version < latestIssuedVersion

	if (isExpiredToken) {
		return {
			authorized: false,
			isStaff: false,
			tokenVersion: row.version,
			latestIssuedVersion,
			isSuperseded,
			isExpiredToken: true,
		}
	}

	return {
		authorized: true,
		isStaff: false,
		tokenVersion: row.version,
		latestIssuedVersion,
		isSuperseded,
		isExpiredToken: false,
	}
}

export async function canAccessQuote(
	orderId: string,
	token?: string | null,
	nowDate?: Date,
): Promise<boolean> {
	const session = await getAdminSession()
	if (session && ['admin', 'superadmin', 'cskh'].includes(session.role)) return true
	if (!token || !/^[a-f0-9]{64}$/.test(token)) return false
	const nowIso = (nowDate ?? new Date()).toISOString()
	const result = await d1Query(
		`SELECT order_id FROM quote_access WHERE order_id = ? AND token_hash = ? AND revoked_at IS NULL AND expires_at > ? AND version = (SELECT MAX(version) FROM quote_versions WHERE order_id = quote_access.order_id) LIMIT 1`,
		[orderId, createHash('sha256').update(token).digest('hex'), nowIso],
	)
	return result.results.length === 1
}
