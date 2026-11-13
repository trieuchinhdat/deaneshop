'use client'

import { getEffectiveAttribution } from './attribution'
import { detectDeviceClass } from './vitals'
import type { AnalyticsEventType } from './analytics-engine'

const BEACON_ENDPOINT = '/api/analytics/beacon'
const recentSent = new Map<string, number>()

/**
 * Dispatches lightweight funnel telemetry to Cloudflare Workers Analytics Engine
 * via /api/analytics/beacon using non-blocking keepalive / sendBeacon.
 */
export function sendAnalyticsBeacon(input: {
	event: AnalyticsEventType
	path?: string
	placement?: string
	label?: string
	value?: number
}): void {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') return
	try {
		const path = (input.path || window.location.pathname || '/').slice(0, 120)
		// Dedupe identical events emitted within 1500ms on the same path
		const dedupeKey = `${input.event}:${path}:${input.label || ''}`
		const now = Date.now()
		const prev = recentSent.get(dedupeKey)
		if (prev && now - prev < 1500) return
		recentSent.set(dedupeKey, now)

		const attr = getEffectiveAttribution()
		const payload = JSON.stringify({
			event: input.event,
			path,
			utm_source: attr?.utm_source || '',
			utm_medium: attr?.utm_medium || '',
			utm_campaign: attr?.utm_campaign || '',
			device: detectDeviceClass(),
			placement: input.placement || '',
			label: input.label || '',
			value: input.value,
		})

		if (typeof navigator.sendBeacon === 'function') {
			navigator.sendBeacon(
				BEACON_ENDPOINT,
				new Blob([payload], { type: 'application/json' }),
			)
			return
		}

		void fetch(BEACON_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: payload,
			keepalive: true,
		}).catch(() => {})
	} catch {
		// Never block user interaction or form submission on telemetry failures
	}
}
