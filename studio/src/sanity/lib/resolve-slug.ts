import { resolveEntityRoute } from '@shared/routing'

export default function resolveSlug({
	_type,
	internal,
	params,
	external,
}: {
	// internal
	_type?: string
	internal?: string
	params?: string
	// external
	external?: string
}) {
	if (external) return external

	if (internal) {
		return resolveEntityRoute({
			type: _type,
			slug: internal,
			params,
		})
	}

	return undefined
}
