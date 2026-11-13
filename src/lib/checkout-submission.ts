// Persist the submission identity across retries/reloads; retire only on confirmed receipt.
async function computeFingerprint(payload: Record<string, unknown>): Promise<string> {
	const {
		orderId: _orderId,
		expectedTotal: _expectedTotal,
		expectedCustomQuote: _expectedCustomQuote,
		requirePriceMatch: _requirePriceMatch,
		attribution_json: _attributionJson,
		journey_json: _journeyJson,
		landing_page_url: _landingPageUrl,
		utm_source: _utmSource,
		utm_medium: _utmMedium,
		utm_campaign: _utmCampaign,
		utm_term: _utmTerm,
		utm_content: _utmContent,
		click_id: _clickId,
		marketing_consent: _marketingConsent,
		...stable
	} = payload
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(JSON.stringify(stable)),
	)
	return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function checkoutKey(payload: Record<string, unknown>): Promise<string> {
	const fingerprint = await computeFingerprint(payload)
	const storageKey = `checkout-submission:${fingerprint}`
	try {
		const previous = sessionStorage.getItem(storageKey)
		if (previous) return previous
	} catch {}
	const key = crypto.randomUUID()
	try {
		sessionStorage.setItem(storageKey, key)
	} catch {}
	return key
}

export async function retireCheckoutKey(payload: Record<string, unknown>): Promise<void> {
	const fingerprint = await computeFingerprint(payload)
	const storageKey = `checkout-submission:${fingerprint}`
	try {
		sessionStorage.removeItem(storageKey)
	} catch {}
}
