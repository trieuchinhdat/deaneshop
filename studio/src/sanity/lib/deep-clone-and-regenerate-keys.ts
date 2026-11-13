/**
 * Generates a clean 12-character alphanumeric key compatible with Sanity array requirements.
 */
export function generateRandomKey(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
	}
	return Math.random().toString(36).substring(2, 14)
}

/**
 * Deep-clones an array or object of modules, recursively regenerating all `_key`
 * attributes while preserving image references and cleaning empty references.
 */
export function deepCloneAndRegenerateKeys<T>(source: T): T {
	if (source === null || source === undefined) {
		return source
	}

	if (Array.isArray(source)) {
		return source
			.map((item) => deepCloneAndRegenerateKeys(item))
			.filter((item) => item !== undefined) as unknown as T
	}

	if (typeof source === 'object') {
		const clone: Record<string, any> = {}

		for (const [key, value] of Object.entries(source)) {
			// Skip internal revision or edit tracking properties if copied from an existing document
			if (key === '_rev' || key === '_createdAt' || key === '_updatedAt') {
				continue
			}

			// Regenerate _key whenever encountered on an object or module
			if (key === '_key') {
				clone._key = generateRandomKey()
				continue
			}

			// Clean broken or empty references
			if (
				value &&
				typeof value === 'object' &&
				(value as any)._type === 'reference' &&
				!(value as any)._ref
			) {
				continue
			}

			clone[key] = deepCloneAndRegenerateKeys(value)
		}

		// Ensure any object with a _type inside an array gets a valid _key if it was missing
		if (clone._type && !clone._key) {
			clone._key = generateRandomKey()
		}

		return clone as T
	}

	return source
}
