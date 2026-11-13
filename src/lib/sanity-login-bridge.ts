import { createHash, randomBytes } from 'node:crypto'
import { d1Query } from './d1'

export const SANITY_LOGIN_COOKIE =
	process.env.NODE_ENV === 'production'
		? '__Host-deanflow_sanity_login'
		: 'deanflow_sanity_login'
export const loginNonce = () => randomBytes(32).toString('base64url')
export const validLoginNonce = (value: unknown): value is string =>
	typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
export const loginHash = (value: string) =>
	createHash('sha256').update(value).digest('hex')

export interface LoginGrant {
	staff_id: string
	sanity_user_id: string
	project_id: string
}

// No personal Sanity token or application session is persisted in this table.
export async function beginSanityLogin() {
	const state = loginNonce()
	const verifier = loginNonce()
	const now = Math.floor(Date.now() / 1000)
	await d1Query('DELETE FROM sanity_login_transactions WHERE expires_at <= ?', [
		now,
	])
	await d1Query(
		'INSERT INTO sanity_login_transactions(state_hash, verifier_hash, expires_at) VALUES (?, ?, ?)',
		[loginHash(state), loginHash(verifier), now + 300],
	)
	return { state, verifier }
}

export async function issueSanityLoginCode(state: string, grant: LoginGrant) {
	const code = loginNonce()
	const now = Math.floor(Date.now() / 1000)
	const result = await d1Query<{ state_hash: string }>(
		`UPDATE sanity_login_transactions SET code_hash = ?, code_expires_at = ?,
   staff_id = ?, sanity_user_id = ?, project_id = ?
   WHERE state_hash = ? AND expires_at > ? AND code_hash IS NULL RETURNING state_hash`,
		[
			loginHash(code),
			now + 60,
			grant.staff_id,
			grant.sanity_user_id,
			grant.project_id,
			loginHash(state),
			now,
		],
	)
	return result.results?.length ? code : null
}

export async function redeemSanityLoginCode(
	state: string,
	code: string,
	verifier: string,
) {
	const now = Math.floor(Date.now() / 1000)
	const result = await d1Query<LoginGrant>(
		`DELETE FROM sanity_login_transactions WHERE state_hash = ? AND code_hash = ?
   AND verifier_hash = ? AND expires_at > ? AND code_expires_at > ?
   RETURNING staff_id, sanity_user_id, project_id`,
		[loginHash(state), loginHash(code), loginHash(verifier), now, now],
	)
	return result.results?.[0] || null
}
