/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * Sanity Studio is loaded strictly on the client via a no-SSR dynamic wrapper so the
 * full Studio bundle and config schema graph are excluded from Cloudflare Workers SSR.
 */

import type { Metadata, Viewport } from 'next'
import StudioLoader from './studio-loader'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	referrer: 'same-origin',
	robots: 'noindex',
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
}

export default function StudioPage() {
	return <StudioLoader />
}
