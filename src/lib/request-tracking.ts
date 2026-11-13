import { writeAnalyticsDataPoint } from './analytics-engine'
import {
	type AttributionData,
	parseAttributionCookie,
	parseAttributionFromObject,
} from './attribution'
import { CommerceError, textField } from './commerce'

const ALLOWED_JOURNEY_EVENTS = new Set([
	'page_view',
	'form_start',
	'cta_click',
	'contact_click',
	'catalog_download',
])

export interface ResolvedRequestTracking {
	cfCountry: string | null
	cfCity: string | null
	referer: string | null
	landingPageUrl: string | null
	utmSource: string | null
	utmMedium: string | null
	utmCampaign: string | null
	utmTerm: string | null
	utmContent: string | null
	clickId: string | null
	attribution: AttributionData | null
	attributionJson: string
	journeyJson: string | null
	consentJson: string
}

function cleanStr(value: unknown, maxLen = 200): string | null {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	return trimmed ? trimmed.slice(0, maxLen) : null
}

/**
 * Validates and normalizes `journey_json` submitted from client forms/checkout.
 */
export function sanitizeJourneyPayload(rawJourney: unknown): string | null {
	if (rawJourney === undefined || rawJourney === null || rawJourney === '') {
		return null
	}
	let journey: unknown = rawJourney
	if (typeof rawJourney === 'string') {
		try {
			journey = JSON.parse(rawJourney)
		} catch {
			throw new CommerceError('Invalid journey')
		}
	}
	if (!Array.isArray(journey) || journey.length > 40) {
		throw new CommerceError('Invalid journey')
	}
	if (journey.length === 0) return null

	for (const step of journey) {
		if (
			!step ||
			typeof step !== 'object' ||
			typeof (step as any).path !== 'string' ||
			!(step as any).path.startsWith('/') ||
			typeof (step as any).timestamp !== 'string' ||
			!Number.isFinite(Date.parse((step as any).timestamp))
		) {
			throw new CommerceError('Invalid journey entry')
		}
	}

	return JSON.stringify(
		journey.map((step: any) => ({
			path: textField(step.path, 'journey path', true, 160),
			title: textField(step.title, 'journey title', false, 200),
			timestamp: textField(step.timestamp, 'journey timestamp', true, 40),
			event: ALLOWED_JOURNEY_EVENTS.has(step.event) ? step.event : 'page_view',
		})),
	)
}

/**
 * Resolves unified attribution, geo, landing URL, session journey, and consent
 * across cookie + body fallback for `/api/leads`, `/api/popup/lead`, and `/api/orders/create`.
 */
export function resolveRequestTrackingContext(
	req: Request,
	body: Record<string, unknown>,
	options?: {
		formSource?: string
		policyVersion?: string
		strictJourney?: boolean
	},
): ResolvedRequestTracking {
	const cfCountry = cleanStr(req.headers.get('cf-ipcountry'), 64)
	const cfCity = cleanStr(req.headers.get('cf-ipcity'), 120)
	const referer = cleanStr(req.headers.get('referer'), 500)

	const cookieAttr = parseAttributionCookie(req.headers.get('cookie'))
	const bodyAttr = parseAttributionFromObject(body.attribution_json ?? body.attribution)
	const baseAttr = cookieAttr || bodyAttr

	const landingPageUrl =
		cleanStr(body.landing_page_url, 500) ||
		cleanStr(body.landingPageUrl, 500) ||
		cleanStr(body.pageUrl, 500) ||
		referer ||
		null

	const utmSource =
		cleanStr(body.utm_source ?? body.utmSource, 100) || baseAttr?.utm_source || null
	const utmMedium =
		cleanStr(body.utm_medium ?? body.utmMedium, 100) || baseAttr?.utm_medium || null
	const utmCampaign =
		cleanStr(body.utm_campaign ?? body.utmCampaign, 100) ||
		baseAttr?.utm_campaign ||
		null
	const utmTerm =
		cleanStr(body.utm_term ?? body.utmTerm, 100) || baseAttr?.utm_term || null
	const utmContent =
		cleanStr(body.utm_content ?? body.utmContent, 100) ||
		baseAttr?.utm_content ||
		null
	const clickId =
		cleanStr(body.click_id ?? body.clickId, 100) || baseAttr?.click_id || null

	let effectiveAttr: AttributionData | null = baseAttr ? { ...baseAttr } : null
	if (
		!effectiveAttr &&
		(utmSource || utmMedium || utmCampaign || utmTerm || utmContent || clickId || landingPageUrl)
	) {
		const now = new Date().toISOString()
		let landingPath: string | null = null
		if (landingPageUrl) {
			try {
				landingPath = new URL(landingPageUrl).pathname.slice(0, 100)
			} catch {
				landingPath = landingPageUrl.startsWith('/') ? landingPageUrl.slice(0, 100) : null
			}
		}
		effectiveAttr = {
			...(utmSource ? { utm_source: utmSource } : {}),
			...(utmMedium ? { utm_medium: utmMedium } : {}),
			...(utmCampaign ? { utm_campaign: utmCampaign } : {}),
			...(utmTerm ? { utm_term: utmTerm } : {}),
			...(utmContent ? { utm_content: utmContent } : {}),
			...(clickId ? { click_id: clickId } : {}),
			...(landingPath ? { landing_page: landingPath } : {}),
			...(referer ? { referrer: referer.split('?')[0].slice(0, 100) } : {}),
			first_touch_at: now,
			last_touch_at: now,
		}
	}

	let journeyJson: string | null = null
	const rawJourney = body.journey_json ?? body.journeyJson
	if (options?.strictJourney !== false) {
		journeyJson = sanitizeJourneyPayload(rawJourney)
	} else {
		try {
			journeyJson = sanitizeJourneyPayload(rawJourney)
		} catch {
			journeyJson = null
		}
	}

	const cookieConsentHeader = req.headers.get('cookie') || ''
	const marketingCookie =
		/(?:^|;\s*)deanflow_consent=marketing\b/.test(cookieConsentHeader) ||
		body.marketing_consent === true
	const dossierCommunication =
		body.dossierConsent === true ||
		(options?.formSource === 'compliance_vault_gated' && body.consent === true)

	const consentPayload: Record<string, unknown> = {
		marketing: body.consent === true,
		marketingCookie,
		dossierCommunication,
		policyVersion: options?.policyVersion || '2026-11-10',
		capturedAt: new Date().toISOString(),
	}
	if (options?.formSource) {
		consentPayload.form = options.formSource
	}
	const consentText = cleanStr(body.consentText, 2000)
	if (consentText) {
		consentPayload.consentText = consentText
	}

	return {
		cfCountry,
		cfCity,
		referer,
		landingPageUrl,
		utmSource,
		utmMedium,
		utmCampaign,
		utmTerm,
		utmContent,
		clickId,
		attribution: effectiveAttr,
		attributionJson: JSON.stringify(effectiveAttr || {}),
		journeyJson,
		consentJson: JSON.stringify(consentPayload),
	}
}

/**
 * Records an authoritative server-accepted conversion event in Cloudflare
 * Analytics Engine (zero D1 writes, never throws).
 */
export async function trackServerConversion(
	tracking: ResolvedRequestTracking,
	details: {
		placement: string
		label?: string
		value?: number
	},
): Promise<void> {
	let path = '/'
	if (tracking.landingPageUrl) {
		try {
			path = new URL(tracking.landingPageUrl).pathname.slice(0, 120) || '/'
		} catch {
			if (tracking.landingPageUrl.startsWith('/')) {
				path = tracking.landingPageUrl.split('?')[0].slice(0, 120)
			}
		}
	}
	await writeAnalyticsDataPoint({
		event: 'conversion',
		path,
		utm_source: tracking.utmSource || '',
		utm_medium: tracking.utmMedium || '',
		utm_campaign: tracking.utmCampaign || '',
		country: tracking.cfCountry || '',
		device: 'desktop',
		placement: details.placement.slice(0, 60),
		label: (details.label || details.placement).slice(0, 120),
		value: details.value,
	})
}
