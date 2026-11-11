export { defineModulePreview } from './define-module-preview'
export { MODULE_FRIENDLY_NAMES, getFriendlyModuleName } from './module-preview-config'

/**
 * Decorator to automatically inject a `hidden` field and updated preview
 * into Sanity module schemas without touching each module file individually.
 */
export function withModuleHidden<T extends Record<string, any>>(schema: T): T {
	const hasHidden = schema.fields?.some((f: any) => f.name === 'hidden')
	const targetGroup =
		schema.groups?.find((g: any) => g.name === 'settings')?.name ||
		schema.groups?.find((g: any) => g.default)?.name ||
		schema.groups?.[0]?.name

	const hiddenField: any = {
		name: 'hidden',
		title: 'Hide module',
		description: 'Hide this module from the page without removing it',
		type: 'boolean',
		initialValue: false,
		...(targetGroup ? { group: targetGroup } : {}),
	}

	const originalPrepare = schema.preview?.prepare
	const originalSelect = schema.preview?.select || {}

	const preview = schema.preview
		? {
				...schema.preview,
				select: {
					...originalSelect,
					_hidden: 'hidden',
					_attrHidden: 'attributes.hidden',
				},
				prepare: (selection: any, viewOptions?: any) => {
					const prepared = originalPrepare
						? originalPrepare(selection, viewOptions)
						: { title: selection?.title || schema.title || schema.name }
					const isHidden = Boolean(selection?._hidden || selection?._attrHidden)
					if (isHidden) {
						const sub = prepared.subtitle
						const prefixedSubtitle = sub
							? sub.startsWith('[Hidden]')
								? sub
								: `[Hidden] ${sub}`
							: '[Hidden]'
						return {
							...prepared,
							subtitle: prefixedSubtitle,
						}
					}
					return prepared
				},
			}
		: {
				select: {
					_hidden: 'hidden',
					_attrHidden: 'attributes.hidden',
				},
				prepare: (selection: any) => {
					const isHidden = Boolean(selection?._hidden || selection?._attrHidden)
					return {
						title: schema.title || schema.name,
						subtitle: isHidden ? 'Hidden' : undefined,
					}
				},
			}

	return {
		...schema,
		fields: hasHidden ? schema.fields : [hiddenField, ...(schema.fields || [])],
		preview,
	}
}
