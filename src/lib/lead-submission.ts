// Keep submission identity stable when journey/attribution changes during a retry.
export function stableLeadSubmission(payload: Record<string, unknown>) {
	const fields = [
		'name',
		'email',
		'phone',
		'country',
		'company_name',
		'companyName',
		'company_size',
		'companySize',
		'budget_range',
		'budgetRange',
		'source',
		'landing_page_url',
		'landingPageUrl',
		'message',
		'assetId',
		'asset_id',
		'consent',
		'dossierConsent',
	] as const
	return Object.fromEntries(
		fields.map((key) => [
			key,
			typeof payload[key] === 'string'
				? payload[key].trim()
				: (payload[key] ?? null),
		]),
	)
}

const pending = new Map<string, string>()
async function storageKey(payload: Record<string, unknown>) {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(JSON.stringify(stableLeadSubmission(payload))),
	)
	return `lead-submission:${Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')}`
}

export async function leadSubmissionKey(payload: Record<string, unknown>) {
	const slot = await storageKey(payload)
	let key = pending.get(slot)
	try {
		key = sessionStorage.getItem(slot) || key
	} catch {}
	if (!key) key = crypto.randomUUID()
	pending.set(slot, key)
	try {
		sessionStorage.setItem(slot, key)
	} catch {}
	return key
}

export async function retireLeadSubmission(payload: Record<string, unknown>) {
	const slot = await storageKey(payload)
	pending.delete(slot)
	try {
		sessionStorage.removeItem(slot)
	} catch {}
}
