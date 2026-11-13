import { NextResponse, type NextRequest } from 'next/server'
import {
	ATTRIBUTION_COOKIE_NAME,
	ATTRIBUTION_MAX_AGE,
	resolveAttributionForVisit,
} from './lib/attribution'

export function proxy(request: NextRequest) {
	const response = NextResponse.next()
	const { searchParams, pathname } = request.nextUrl
	if (request.cookies.get('deanflow_consent')?.value !== 'marketing' || pathname.startsWith('/api/') || pathname.startsWith('/admin')) return response

	const merged = resolveAttributionForVisit({
		searchParams,
		pathname,
		referrer: request.headers.get('referer') || '',
		existingCookieValue: request.cookies.get(ATTRIBUTION_COOKIE_NAME)?.value || null,
	})

	if (merged) {
		// Set 90-day First-Party Cookie at the Edge
		response.cookies.set({
			name: ATTRIBUTION_COOKIE_NAME,
			value: encodeURIComponent(JSON.stringify(merged)),
			maxAge: ATTRIBUTION_MAX_AGE,
			path: '/',
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			httpOnly: false, // Accessible client-side for dynamic forms
		})
	}

	return response
}

export const config = {
	matcher: [
		{
			// Match before loading Node.js middleware: attribution is only needed
			// for consenting visitors to public pages, never API/admin or prefetches.
			source: '/((?!api(?:/|$)|admin(?:/|$)|studio(?:/|$)|_next/|favicon.ico|sitemap.xml|robots.txt).*)',
			has: [{ type: 'cookie', key: 'deanflow_consent', value: 'marketing' }],
			missing: [
				{ type: 'header', key: 'next-router-prefetch' },
				{ type: 'header', key: 'purpose', value: 'prefetch' },
			],
		},
	],
}
