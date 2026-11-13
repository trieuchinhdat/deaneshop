import { vitalsSampleRate } from './deployment-profile'

// Make one sampling decision per document, shared by navigation and checkout beacons.
let sampled: boolean | undefined

export type WebVitalsSnapshot = {
	lcp?: number
	inp?: number
	cls?: number
	checkoutMs?: number
	device: 'mobile' | 'desktop'
	path: string
	updatedAt: string
}

export function detectDeviceClass(): 'mobile' | 'desktop' {
	if (typeof window === 'undefined') return 'desktop'
	return window.innerWidth < 768 ? 'mobile' : 'desktop'
}

export function updateVitalsSnapshot(patch: Partial<WebVitalsSnapshot>): WebVitalsSnapshot {
	const current: WebVitalsSnapshot = {
		device: detectDeviceClass(),
		path: typeof window !== 'undefined' ? window.location.pathname : '/',
		updatedAt: new Date().toISOString(),
		...(typeof window !== 'undefined' ? window.__DEANFLOW_VITALS__ : {}),
		...patch,
	}
	if (typeof window !== 'undefined') {
		window.__DEANFLOW_VITALS__ = current
	}
	return current
}

export function sendVitalsBeacon(snapshot: WebVitalsSnapshot): void {
	if (typeof navigator === 'undefined' || typeof window === 'undefined') return
	if (sampled === undefined) sampled = Math.random() < vitalsSampleRate()
	if (!sampled) return
	try {
		const payload = JSON.stringify(snapshot)
		if (typeof navigator.sendBeacon === 'function') {
			navigator.sendBeacon('/api/vitals', new Blob([payload], { type: 'application/json' }))
			return
		}
		void fetch('/api/vitals', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: payload,
			keepalive: true,
		}).catch(() => {})
	} catch {}
}

export function recordCheckoutTiming(durationMs: number): void {
	if (!Number.isFinite(durationMs) || durationMs < 0) return
	const rounded = Math.round(durationMs)
	if (typeof performance !== 'undefined' && typeof performance.measure === 'function') {
		try {
			performance.mark('deanflow-checkout-complete')
		} catch {}
	}
	const snap = updateVitalsSnapshot({ checkoutMs: rounded })
	sendVitalsBeacon(snap)
}

