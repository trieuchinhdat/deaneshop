import 'server-only'
// Querying with "sanityFetch" will keep content automatically updated
// Before using it, import and render "<SanityLive />" in your layout, see
// https://github.com/sanity-io/next-sanity#live-content-api for more information.
import { defineLive } from 'next-sanity/live'
import { draftMode } from 'next/headers'
import { client } from './client'
import { token } from './token'
import { isStaticStorefront } from '@/lib/deployment-profile'

export const { sanityFetch, SanityLive } = defineLive({
	client: client.withConfig({
		// Live content is currently only available on the experimental API
		// https://www.sanity.io/docs/api-versioning
		apiVersion: '2025-10-23',
	}),
	serverToken: token,
	browserToken: token,
})

export async function sanityFetchLive<T>(
	args: Parameters<typeof sanityFetch>[0],
) {
	if (isStaticStorefront) {
		// A published build snapshot never reads cookies, drafts, or request-bound D1.
		return client.fetch<T>(args.query, args.params || {}, {
			perspective: 'published',
			stega: false,
			useCdn: false,
			token,
		})
	}
	const isDraftMode = (await draftMode()).isEnabled
	const preview = process.env.NODE_ENV === 'development' || isDraftMode
	const { perspective: requestedPerspective, ...safeArgs } = args
	const perspective = preview
		? requestedPerspective === 'published'
			? 'published'
			: 'drafts'
		: 'published'

	const { data } = await sanityFetch({
		...safeArgs,
		perspective,
	})

	return data as T
}
