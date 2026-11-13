/** Safe diagnostics: never return raw SQL, credentials, provider responses, or staff data. */
export function adminLoginError(error: unknown) {
	const detail = error as { message?: unknown; causeMessage?: unknown } | null
	const cause = `${typeof detail?.message === 'string' ? detail.message : ''} ${typeof detail?.causeMessage === 'string' ? detail.causeMessage : ''}`
	if (/no such (?:table|column)|has no column named/i.test(cause)) return {
		code: 'AUTH_SCHEMA_OUTDATED',
		error: 'Staff database schema is missing or outdated. Apply all pending D1 migrations, including identity migration 0011, to the database used by this environment.',
	}
	if (/D1 is not configured/i.test(cause)) return {
		code: 'AUTH_STORAGE_NOT_CONFIGURED',
		error: 'Staff database is not configured for this environment.',
	}
	if (/ADMIN_JWT_SECRET|Invalid admin authentication mode|Verified Sanity identity required/i.test(cause)) return {
		code: 'AUTH_CONFIGURATION_ERROR',
		error: 'Staff session configuration is unavailable. Check the authentication mode, signing secret, project and linked staff identity.',
	}
	return { code: 'AUTH_UNAVAILABLE', error: 'Authentication service unavailable. Check the database connection and server logs, then retry.' }
}
