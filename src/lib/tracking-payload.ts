'use client'

import { type AttributionData, getEffectiveAttribution } from '@/lib/attribution'
import { type JourneyBreadcrumb, getSessionJourney } from '@/lib/journey-tracker'
import { useConsentStore } from '@/store/use-consent-store'

export interface ClientTrackingPayload {
	landing_page_url?: string
	utm_source?: string
	utm_medium?: string
	utm_campaign?: string
	utm_term?: string
	utm_content?: string
	click_id?: string
	attribution_json?: AttributionData
	journey_json?: JourneyBreadcrumb[]
	marketing_consent: boolean
}

/**
 * Shared client helper to collect consistent attribution, session journey,
 * landing page URL, and marketing consent state across all lead/popup/checkout forms.
 */
export function buildTrackingPayload(): ClientTrackingPayload {
	const marketingConsent = Boolean(useConsentStore.getState().marketing)
	const attr = getEffectiveAttribution()
	const journey = getSessionJourney()
	const currentUrl =
		typeof window !== 'undefined' ? window.location.href : undefined

	return {
		...(currentUrl ? { landing_page_url: currentUrl } : {}),
		...(attr?.utm_source ? { utm_source: attr.utm_source } : {}),
		...(attr?.utm_medium ? { utm_medium: attr.utm_medium } : {}),
		...(attr?.utm_campaign ? { utm_campaign: attr.utm_campaign } : {}),
		...(attr?.utm_term ? { utm_term: attr.utm_term } : {}),
		...(attr?.utm_content ? { utm_content: attr.utm_content } : {}),
		...(attr?.click_id ? { click_id: attr.click_id } : {}),
		...(attr ? { attribution_json: attr } : {}),
		...(journey.length > 0 ? { journey_json: journey } : {}),
		marketing_consent: marketingConsent,
	}
}

