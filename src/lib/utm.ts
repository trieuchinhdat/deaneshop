/**
 * Appends UTM tracking parameters to internal or external URLs for marketing attribution.
 */
export function appendUtm(
	url: string,
	utmParams: {
		source?: string
		medium?: string
		campaign?: string
		content?: string
	},
): string {
	if (!url) return ''

	try {
		// Use a dummy base for relative URLs (e.g. /products/slug)
		const isRelative = url.startsWith('/')
		const parsedUrl = new URL(url, 'https://deanflow.local')

		if (utmParams.source && !parsedUrl.searchParams.has('utm_source')) {
			parsedUrl.searchParams.set('utm_source', utmParams.source)
		}
		if (utmParams.medium && !parsedUrl.searchParams.has('utm_medium')) {
			parsedUrl.searchParams.set('utm_medium', utmParams.medium)
		}
		if (utmParams.campaign && !parsedUrl.searchParams.has('utm_campaign')) {
			parsedUrl.searchParams.set('utm_campaign', utmParams.campaign)
		}
		if (utmParams.content && !parsedUrl.searchParams.has('utm_content')) {
			parsedUrl.searchParams.set('utm_content', utmParams.content)
		}

		if (isRelative) {
			return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
		}

		return parsedUrl.toString()
	} catch {
		return url
	}
}
