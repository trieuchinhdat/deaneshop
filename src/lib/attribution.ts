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
	internal_ref?: string | null
	first_touch_at?: string | null
	last_touch_at?: string | null
}

export const ATTRIBUTION_COOKIE_NAME = 'deanflow_attr'
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90 // 90 days
export const SESSION_ATTRIBUTION_KEY = 'deanflow_session_attr'
const SESSION_ATTRIBUTION_TTL_MS = 60 * 60 * 1000 // 60 min sliding window

const ATTRIBUTION_STRING_KEYS = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_term',
	'utm_content',
	'fbclid',
	'gclid',
	'ttclid',
	'click_id',
	'landing_page',
	'referrer',
	'internal_ref',
	'first_touch_at',
	'last_touch_at',
] as const

/**
 * Sanitize an arbitrary object into a safe AttributionData payload (used by cookie & request-body parsers).
 */
export function parseAttributionFromObject(raw: unknown): AttributionData | null {
	if (typeof raw === 'string') {
		try {
			raw = JSON.parse(raw)
		} catch {
			return null
		}
	}
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
	const record = raw as Record<string, unknown>
	const cleaned: AttributionData = {}
	for (const key of ATTRIBUTION_STRING_KEYS) {
		const val = record[key]
		if (typeof val === 'string' && val.trim()) {
			cleaned[key] = val.trim().slice(0, 200)
		}
	}
	for (const key of ['first_touch', 'last_touch'] as const) {
		const nested = record[key]
		if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
			const cleanNested: Omit<AttributionData, 'first_touch' | 'last_touch'> = {}
			for (const sKey of ATTRIBUTION_STRING_KEYS) {
				const sVal = (nested as Record<string, unknown>)[sKey]
				if (typeof sVal === 'string' && sVal.trim()) {
					cleanNested[sKey] = sVal.trim().slice(0, 200)
				}
			}
			if (Object.keys(cleanNested).length > 0) {
				cleaned[key] = cleanNested
			}
		}
	}
	return Object.keys(cleaned).length > 0 ? cleaned : null
}

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
	const internalRef = searchParams.get('ref_embed')?.slice(0, 120)

	const clickId = fbclid || gclid || ttclid || searchParams.get('msclkid')?.slice(0, 100) || searchParams.get('twclid')?.slice(0, 100)

	// Only return attribution if at least one marketing tag exists
	if (!utmSource && !utmMedium && !utmCampaign && !utmTerm && !utmContent && !clickId) {
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
		...(internalRef ? { internal_ref: internalRef } : {}),
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
		return parseAttributionFromObject(parsed) || {}
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
 * Shared attribution capture helper used both at the Edge (`proxy.ts`) and in-browser.
 * `checkExternalReferrer` should be false during client SPA route transitions so the initial
 * external `document.referrer` never overwrites an existing paid/campaign attribution.
 */
export function resolveAttributionForVisit(input: {
	searchParams: URLSearchParams
	pathname: string
	referrer?: string
	existingCookieValue?: string | null
	existingAttribution?: AttributionData | null
	checkExternalReferrer?: boolean
}): AttributionData | null {
	const pathname = input.pathname || '/'
	const referrer = input.referrer || ''
	const checkExternalReferrer = input.checkExternalReferrer !== false
	let newAttribution = extractAttributionFromParams(
		input.searchParams,
		pathname,
		referrer,
	)

	const rawExistingAttribution =
		input.existingAttribution ||
		parseAttributionCookie(
			input.existingCookieValue
				? `${ATTRIBUTION_COOKIE_NAME}=${input.existingCookieValue}`
				: null,
		)
	const existingAttribution =
		rawExistingAttribution && Object.keys(rawExistingAttribution).length > 0
			? rawExistingAttribution
			: null

	const internalRef = input.searchParams.get('ref_embed')?.trim().slice(0, 120) || null

	// Capture a new external referral on hard loads / initial landing when requested.
	let externalReferrer = false
	if (checkExternalReferrer) {
		try {
			const ref = new URL(referrer)
			const site = process.env.NEXT_PUBLIC_BASE_URL
			externalReferrer = Boolean(site && ref.hostname !== new URL(site).hostname)
		} catch {}
	}
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
			...(internalRef ? { internal_ref: internalRef } : {}),
			first_touch_at: now,
			last_touch_at: now,
		}
	}

	if (!newAttribution) {
		if (internalRef && existingAttribution) {
			return { ...existingAttribution, internal_ref: internalRef }
		}
		return null
	}
	const merged = mergeAttribution(existingAttribution, newAttribution)
	if (internalRef && !merged.internal_ref) {
		merged.internal_ref = internalRef
	}
	return merged
}

export function readSessionAttribution(): AttributionData | null {
	if (typeof window === 'undefined') return null
	try {
		const raw = window.localStorage?.getItem(SESSION_ATTRIBUTION_KEY)
		if (!raw) return null
		const parsed = JSON.parse(raw) as { expiresAt?: number; data?: unknown }
		if (!parsed || typeof parsed !== 'object') return null
		if (typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt) {
			window.localStorage.removeItem(SESSION_ATTRIBUTION_KEY)
			return null
		}
		return parseAttributionFromObject(parsed.data)
	} catch {
		return null
	}
}

export function writeSessionAttribution(data: AttributionData | null): void {
	if (typeof window === 'undefined' || !data) return
	try {
		window.localStorage?.setItem(
			SESSION_ATTRIBUTION_KEY,
			JSON.stringify({
				expiresAt: Date.now() + SESSION_ATTRIBUTION_TTL_MS,
				data,
			}),
		)
	} catch {}
}

export function captureCurrentUrlAttribution(
	href: string,
	referrer = '',
	existingDocumentCookie = '',
	options?: { checkExternalReferrer?: boolean; persistSession?: boolean },
): AttributionData | null {
	try {
		const url = new URL(href)
		const rawCookieAttr = parseAttributionCookie(existingDocumentCookie)
		const cookieAttr = rawCookieAttr && Object.keys(rawCookieAttr).length > 0 ? rawCookieAttr : null
		const sessionAttr = options?.persistSession === false ? null : readSessionAttribution()
		const existingAttribution = cookieAttr || sessionAttr
		const resolved = resolveAttributionForVisit({
			searchParams: url.searchParams,
			pathname: url.pathname,
			referrer,
			existingAttribution,
			checkExternalReferrer: options?.checkExternalReferrer ?? true,
		})
		const effective = resolved || existingAttribution
		if (effective && options?.persistSession !== false) {
			writeSessionAttribution(effective)
		}
		return resolved
	} catch {
		return null
	}
}

export function getEffectiveAttribution(
	href?: string,
	existingDocumentCookie?: string,
): AttributionData | null {
	const cookieStr =
		existingDocumentCookie !== undefined
			? existingDocumentCookie
			: typeof document !== 'undefined'
				? document.cookie || ''
				: ''
	const rawCookieAttr = parseAttributionCookie(cookieStr)
	const cookieAttr = rawCookieAttr && Object.keys(rawCookieAttr).length > 0 ? rawCookieAttr : null
	const sessionAttr = readSessionAttribution()
	const base = cookieAttr || sessionAttr

	const currentHref =
		href || (typeof window !== 'undefined' ? window.location.href : '')
	if (currentHref) {
		try {
			const url = new URL(currentHref)
			const resolved = resolveAttributionForVisit({
				searchParams: url.searchParams,
				pathname: url.pathname,
				referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
				existingAttribution: base,
				checkExternalReferrer: !base,
			})
			if (resolved) return resolved
		} catch {}
	}
	return base
}
