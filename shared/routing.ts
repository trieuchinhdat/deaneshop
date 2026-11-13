import { ROUTES } from './routes'

export function normalizeSlugSegment(raw?: string | null): string {
	return (raw || '').trim().replace(/^\/+|\/+$/g, '')
}

export function normalizePathSlashes(path: string): string {
	if (!path) return '/'
	if (/^https?:\/\//i.test(path)) return path
	const [pathname, suffix = ''] = path.split(/(?=[?#])/, 2)
	const collapsed = `/${pathname.replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/')}`
	return `${collapsed === '//' ? '/' : collapsed}${suffix}`
}

export function joinBaseUrl(baseUrl: string, path: string): string {
	const cleanBase = (baseUrl || '').trim().replace(/\/+$/, '')
	const cleanPath = normalizePathSlashes(path)
	if (!cleanBase) return cleanPath
	return cleanPath === '/' ? cleanBase : `${cleanBase}${cleanPath}`
}

export function resolveEntityRoute(input: {
	type?: string | null
	slug?: string | null
	params?: string | null
}): string | undefined {
	const cleanSlug = normalizeSlugSegment(input.slug)
	const rawParams = (input.params || '').trim()
	if (!cleanSlug) return undefined

	let basePath: string
	switch (input.type) {
		case 'product':
			basePath = `/${ROUTES.products}/${cleanSlug}`
			break
		case 'collection':
			basePath = `/${ROUTES.collections}/${cleanSlug}`
			break
		case 'blog.post':
			basePath = `/${ROUTES.blog}/${cleanSlug}`
			break
		case 'blog.category':
			basePath = `/${ROUTES.blog}/category/${cleanSlug}`
			break
		case 'page':
		default:
			basePath =
				cleanSlug === 'index' || cleanSlug === 'home' ? '/' : `/${cleanSlug}`
			break
	}

	const normalizedBase = normalizePathSlashes(basePath)
	if (!rawParams) return normalizedBase
	const normalizedParams =
		rawParams.startsWith('?') || rawParams.startsWith('#')
			? rawParams
			: `?${rawParams}`
	return `${normalizedBase}${normalizedParams}`
}

export interface RawSanityRedirectEntry {
	source?: string | null
	destinationType?: 'internal' | 'external' | string | null
	internalType?: string | null
	internalSlug?: string | null
	params?: string | null
	external?: string | null
	destination?: string | null
	permanent?: boolean | null
}

export function normalizeRedirectEntry(entry: RawSanityRedirectEntry): {
	source: string
	destination: string
	permanent: boolean
} | null {
	const rawSource = (entry.source || '').trim()
	if (!rawSource) return null
	const source = rawSource.startsWith('/')
		? normalizePathSlashes(rawSource)
		: rawSource

	let destination: string | undefined
	if (
		entry.destinationType === 'internal' ||
		(!entry.external && entry.internalSlug)
	) {
		destination = resolveEntityRoute({
			type: entry.internalType,
			slug: entry.internalSlug,
			params: entry.params,
		})
	} else if (entry.external) {
		destination = entry.external.trim()
	} else if (entry.destination) {
		destination = entry.destination.trim().startsWith('http')
			? entry.destination.trim()
			: normalizePathSlashes(entry.destination.trim())
	}

	if (!destination) return null
	return {
		source,
		destination,
		permanent: entry.permanent !== false,
	}
}
