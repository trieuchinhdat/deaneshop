import { getEnvVarSync } from './cf-env'
import { sanityStudioUrl } from './sanity-studio-url'

function trustedUrl(value: string) {
	const url = new URL(value)
	const local =
		process.env.NODE_ENV !== 'production' &&
		['localhost', '127.0.0.1'].includes(url.hostname)
	if (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
		throw new Error('HTTPS is required for Sanity login')
	if (
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		url.pathname !== '/'
	)
		throw new Error('Sanity login requires an origin without a path')
	return url
}

export function sanityLoginConfig() {
	const studio = trustedUrl(
		getEnvVarSync('SANITY_STUDIO_ORIGIN') || sanityStudioUrl,
	)
	const web = trustedUrl(
		getEnvVarSync('NEXT_PUBLIC_BASE_URL') ||
			(process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : ''),
	)
	if (studio.origin === web.origin)
		throw new Error('Standalone Studio requires its own origin')
	return { studio, web }
}

export const loginResponseHeaders = {
	'Cache-Control': 'no-store',
	'Referrer-Policy': 'no-referrer',
}
