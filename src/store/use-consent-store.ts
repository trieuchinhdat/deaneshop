'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
	ATTRIBUTION_COOKIE_NAME,
	ATTRIBUTION_MAX_AGE,
	captureCurrentUrlAttribution,
} from '@/lib/attribution'

export function syncAttributionForConsent(
	allowed: boolean,
	options?: { checkExternalReferrer?: boolean },
) {
	if (typeof document === 'undefined' || typeof window === 'undefined') return
	const secureAttr = window.location?.protocol === 'https:' ? '; Secure' : ''
	document.cookie = `deanflow_consent=${allowed ? 'marketing' : 'essential'}; Path=/; Max-Age=31536000; SameSite=Lax${secureAttr}`

	if (!allowed) {
		document.cookie = `${ATTRIBUTION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secureAttr}`
		// Keep short-lived first-party session attribution only in local session memory (no persistent marketing cookie).
		captureCurrentUrlAttribution(
			window.location.href,
			document.referrer || '',
			'',
			{ checkExternalReferrer: options?.checkExternalReferrer ?? true, persistSession: true },
		)
		return
	}

	const merged = captureCurrentUrlAttribution(
		window.location.href,
		document.referrer || '',
		document.cookie || '',
		{ checkExternalReferrer: options?.checkExternalReferrer ?? true, persistSession: true },
	)
	if (merged) {
		document.cookie = `${ATTRIBUTION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(merged))}; Path=/; Max-Age=${ATTRIBUTION_MAX_AGE}; SameSite=Lax${secureAttr}`
	}
}

export const useConsentStore = create<{
	marketing: boolean
	decided: boolean
	setMarketing: (allowed: boolean) => void
}>()(
	persist(
		(set) => ({
			marketing: false,
			decided: false,
			setMarketing: (allowed) => {
				syncAttributionForConsent(allowed)
				set({ marketing: allowed, decided: true })
			},
		}),
		{ name: 'deanflow-consent', version: 1 },
	),
)
