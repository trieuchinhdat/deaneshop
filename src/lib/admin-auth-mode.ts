import { getEnvVarSync } from './cf-env'

export type AdminAuthMode = 'password' | 'sanity'

export function getAdminAuthMode(): AdminAuthMode {
	const mode = getEnvVarSync('NEXT_PUBLIC_ADMIN_AUTH_MODE') || 'password'
	if (mode !== 'password' && mode !== 'sanity')
		throw new Error('Invalid admin authentication mode')
	return mode
}

export function validSanityUserId(value: unknown): value is string {
	return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value)
}
