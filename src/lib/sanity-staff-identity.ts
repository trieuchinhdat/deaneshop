import { validSanityUserId } from './admin-auth-mode'
import { getEnvVarSync } from './cf-env'

export class SanityIdentityError extends Error {
	constructor(public readonly status: number) {
		super(
			status === 401 || status === 403
				? 'Sanity account is not authorized for this workspace.'
				: 'Sanity authentication is unavailable. Try again later.',
		)
	}
}

async function sanityJson(
	path: string,
	token: string,
	maximumBytes: number,
): Promise<Record<string, unknown>> {
	const response = await fetch(`https://api.sanity.io/v2021-06-07${path}`, {
		headers: { Authorization: `Bearer ${token}` },
		cache: 'no-store',
		redirect: 'error',
		signal: AbortSignal.timeout(5000),
	})
	if (response.status === 401 || response.status === 403)
		throw new SanityIdentityError(401)
	if (
		!response.ok ||
		!response.headers.get('content-type')?.includes('application/json')
	)
		throw new SanityIdentityError(503)
	const reader = response.body?.getReader()
	if (!reader) throw new SanityIdentityError(503)
	const chunks: Uint8Array[] = []
	let size = 0
	try {
		while (true) {
			const next = await reader.read()
			if (next.done) break
			size += next.value.byteLength
			if (size > maximumBytes) throw new SanityIdentityError(503)
			chunks.push(next.value)
		}
	} finally {
		await reader.cancel().catch(() => {})
	}
	const data: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
	if (!data || typeof data !== 'object' || Array.isArray(data))
		throw new SanityIdentityError(503)
	return data as Record<string, unknown>
}

/** Verify a short-lived exchange; never log or persist the personal Sanity token. */
export async function verifySanityStaffToken(
	token: string,
): Promise<{ userId: string; projectId: string; email: string | null }> {
	const projectId = getEnvVarSync('NEXT_PUBLIC_SANITY_PROJECT_ID') || ''
	if (!/^[a-z0-9]{1,64}$/.test(projectId)) throw new SanityIdentityError(503)
	try {
		const user = await sanityJson('/users/me', token, 8192)
		const id = user.id ?? user._id
		if (
			!validSanityUserId(id) ||
			user.isRobot === true ||
			(user.id && user._id && user.id !== user._id)
		)
			throw new SanityIdentityError(401)
		const project = await sanityJson(
			`/projects/${projectId}?includeMembers=true&includeFeatures=false`,
			token,
			65536,
		)
		if (
			project.id !== projectId ||
			project.isBlocked ||
			project.isDisabled ||
			project.isDisabledByUser
		)
			throw new SanityIdentityError(403)
		if (
			!Array.isArray(project.members) ||
			!project.members.some((entry: unknown) => {
				if (!entry || typeof entry !== 'object') return false
				const member = entry as Record<string, unknown>
				return (
					member.id === id &&
					member.isCurrentUser === true &&
					member.isRobot === false
				)
			})
		)
			throw new SanityIdentityError(403)
		const email = typeof user.email === 'string' && user.email.length <= 254 &&
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())
			? user.email.toLowerCase().trim() : null
		return { userId: id, projectId, email }
	} catch (error) {
		if (error instanceof SanityIdentityError) throw error
		throw new SanityIdentityError(503)
	}
}
