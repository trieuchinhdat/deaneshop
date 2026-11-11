export interface AttributionData {
	first_touch?: Omit<AttributionData, 'first_touch' | 'last_touch'>
	last_touch?: Omit<AttributionData, 'first_touch' | 'last_touch'>
	utm_source?: string | null
	utm_medium?: string | null
	utm_campaign?: string | null
	utm_term?: string | null
	utm_content?: string | null
	fbclid?: string | null
	gclid?: string | null
	ttclid?: string | null
	click_id?: string | null
	landing_page?: string | null
	referrer?: string | null
	first_touch_at?: string | null
	last_touch_at?: string | null
}

export const ATTRIBUTION_COOKIE_NAME = 'deanflow_attr'
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90 // 90 days

/**
 * Extracts attribution tracking data from URLSearchParams
 */
export function extractAttributionFromParams(
	searchParams: URLSearchParams,
	pathname = '/',
	referrer = '',
): AttributionData | null {
	const utmSource = searchParams.get('utm_source')?.slice(0, 100)
	const utmMedium = searchParams.get('utm_medium')?.slice(0, 100)
	const utmCampaign = searchParams.get('utm_campaign')?.slice(0, 100)
	const utmTerm = searchParams.get('utm_term')?.slice(0, 100)
	const utmContent = searchParams.get('utm_content')?.slice(0, 100)
	const fbclid = searchParams.get('fbclid')?.slice(0, 100)
	const gclid = searchParams.get('gclid')?.slice(0, 100)
	const ttclid = searchParams.get('ttclid')?.slice(0, 100)

	const clickId = fbclid || gclid || ttclid || searchParams.get('msclkid')?.slice(0, 100) || searchParams.get('twclid')?.slice(0, 100)

	// Only return attribution if at least one marketing tag exists
	if (!utmSource && !utmMedium && !utmCampaign && !clickId) {
		return null
	}

	const now = new Date().toISOString()
	return {
		utm_source: utmSource || (clickId ? (fbclid ? 'meta_ads' : gclid ? 'google_ads' : ttclid ? 'tiktok_ads' : 'paid_ads') : null),
		utm_medium: utmMedium || (clickId ? 'cpc' : null),
		utm_campaign: utmCampaign || null,
		utm_term: utmTerm || null,
		utm_content: utmContent || null,
		fbclid: fbclid || null,
		gclid: gclid || null,
		ttclid: ttclid || null,
		click_id: clickId || null,
		landing_page: pathname.slice(0, 100),
		referrer: referrer.split('?')[0].slice(0, 100) || null,
		first_touch_at: now,
		last_touch_at: now,
	}
}

/**
 * Safely parse attribution data from Cookie string (Server or Client)
 */
export function parseAttributionCookie(cookieHeader?: string | null): AttributionData | null {
	if (!cookieHeader) return null
	try {
		const match = cookieHeader.match(new RegExp(`(?:^|; )${ATTRIBUTION_COOKIE_NAME}=([^;]*)`))
		if (!match?.[1]) return null
		const decoded = decodeURIComponent(match[1])
		const parsed = JSON.parse(decoded)
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
		const cleaned: AttributionData = {}
		for (const key of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','gclid','ttclid','click_id','landing_page','referrer','first_touch_at','last_touch_at'] as const) {
			if (typeof parsed[key] === 'string') cleaned[key] = parsed[key].slice(0, 200)
		}
		for (const key of ['first_touch', 'last_touch'] as const) {
			if (parsed[key] && typeof parsed[key] === 'object') cleaned[key] = parseAttributionCookie(`${ATTRIBUTION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify({ ...parsed[key], first_touch: undefined, last_touch: undefined }))}`) || undefined
		}
		return cleaned
	} catch {
		return null
	}
}

/**
 * Merge new attribution with existing historical touchpoints (preserves first_touch_at)
 */
export function mergeAttribution(
	existing: AttributionData | null,
	incoming: AttributionData,
): AttributionData {
	// Current acquisition fields belong to the incoming touch, not an older campaign.
	const merged: AttributionData = {}
	for (const [key, value] of Object.entries(incoming)) {
		if (
			value !== null &&
			value !== undefined &&
			key !== 'first_touch' &&
			key !== 'last_touch' &&
			key !== 'first_touch_at'
		) {
			;(merged as any)[key] = value
		}
	}
	const cleanFirst = existing ? { ...existing, first_touch: undefined, last_touch: undefined } : incoming
	return {
		...merged,
		first_touch: existing?.first_touch || cleanFirst,
		last_touch: incoming,
		first_touch_at: existing?.first_touch_at || incoming.first_touch_at || new Date().toISOString(),
		last_touch_at: new Date().toISOString(),
	}
}

/**
 * Shared attribution capture helper used both at the Edge (`proxy.ts`) and when
 * marketing consent is newly granted client-side on the initial landing page (`use-consent-store.ts`).
 */
export function resolveAttributionForVisit(input: {
	searchParams: URLSearchParams
	pathname: string
	referrer?: string
	existingCookieValue?: string | null
}): AttributionData | null {
	const pathname = input.pathname || '/'
	const referrer = input.referrer || ''
	let newAttribution = extractAttributionFromParams(
		input.searchParams,
		pathname,
		referrer,
	)

	const existingAttribution = parseAttributionCookie(
		input.existingCookieValue
			? `${ATTRIBUTION_COOKIE_NAME}=${input.existingCookieValue}`
			: null,
	)

	// Capture a new external referral even when a prior campaign cookie exists.
	let externalReferrer = false
	try {
		const ref = new URL(referrer)
		const site = process.env.NEXT_PUBLIC_BASE_URL
		externalReferrer = Boolean(site && ref.hostname !== new URL(site).hostname)
	} catch {}
	if (!newAttribution && (!existingAttribution || externalReferrer)) {
		let source = 'direct'
		try {
			if (referrer) {
				source = new URL(referrer).hostname || 'direct'
			}
		} catch {}
		const now = new Date().toISOString()
		newAttribution = {
			utm_source: source.slice(0, 100),
			utm_medium: source === 'direct' ? 'direct' : /(^|\.)(google|bing|duckduckgo|yahoo)\./i.test(source) ? 'organic' : 'referral',
			landing_page: pathname.slice(0, 100),
			referrer: referrer.split('?')[0].slice(0, 100) || null,
			first_touch_at: now,
			last_touch_at: now,
		}
	}

	if (!newAttribution) return null
	return mergeAttribution(existingAttribution, newAttribution)
}

export function captureCurrentUrlAttribution(
	href: string,
	referrer = '',
	existingDocumentCookie = '',
): AttributionData | null {
	try {
		const url = new URL(href)
		const match = existingDocumentCookie.match(new RegExp(`(?:^|; )${ATTRIBUTION_COOKIE_NAME}=([^;]*)`))
		return resolveAttributionForVisit({
			searchParams: url.searchParams,
			pathname: url.pathname,
			referrer,
			existingCookieValue: match?.[1] || null,
		})
	} catch {
		return null
	}
}
