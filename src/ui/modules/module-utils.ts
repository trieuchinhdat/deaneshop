import { stegaClean } from 'next-sanity'
import type { ModuleAttributes } from '@/sanity/types'

export type ModuleProps = {
	_key?: string
	_type?: string
	hidden?: boolean
	attributes?: ModuleAttributes
}

export function moduleAttributes({
	_key,
	_type,
	attributes,
	...rest
}: ModuleProps & Record<string, any>) {
	return {
		id: stegaClean(attributes?.uid) || `module-${_key}`,
		'data-module': _type,
		hidden: attributes?.hidden,
		'data-sanity': rest['data-sanity'],
	}
}
