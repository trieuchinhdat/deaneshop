import 'server-only'
import type { QueryParams } from 'next-sanity'
import { client } from './client'
import { token } from './token'

/** Build-time published content. Preview options never change this perspective. */
export async function sanityFetchPublished<T>(args: {
	query: string
	params?: QueryParams
	perspective?: string
}) {
	return client.fetch<T>(args.query, args.params || {}, {
		perspective: 'published', stega: false, useCdn: false, token,
	})
}
