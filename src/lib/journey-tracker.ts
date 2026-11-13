/**
 * Client-side First-Party Session Journey Breadcrumbs Tracker
 * Stores visited pages & key on-site intent interactions in localStorage (with sliding 60-min expiry)
 * so cross-tab B2B research stays intact and is attached only when a visitor submits a form/RFQ/order.
 */

export interface JourneyBreadcrumb {
	path: string
	title: string
	timestamp: string
	event?: string
}

const STORAGE_KEY = 'deanflow_session_journey'
const MAX_BREADCRUMBS = 40
const SESSION_TTL_MS = 60 * 60 * 1000 // 60 min sliding window

const AD_PARAM_KEYS = new Set([
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_term',
	'utm_content',
	'fbclid',
	'gclid',
	'ttclid',
	'gbraid',
	'wbraid',
	'msclkid',
	'twclid',
])

function getCurrentJourneyPath(): string {
	const pathname = window.location.pathname || '/'
	const rawSearch = window.location.search || ''
	if (!rawSearch) return pathname.slice(0, 160)
	try {
		const params = new URLSearchParams(rawSearch)
		for (const key of AD_PARAM_KEYS) params.delete(key)
		const filtered = params.toString()
		return (filtered ? `${pathname}?${filtered}` : pathname).slice(0, 160)
	} catch {
		return pathname.slice(0, 160)
	}
}

function readStoredBreadcrumbs(): JourneyBreadcrumb[] {
	if (typeof window === 'undefined') return []
	try {
		const raw = window.localStorage?.getItem(STORAGE_KEY)
		if (raw) {
			const parsed = JSON.parse(raw)
			if (Array.isArray(parsed)) return parsed
			if (parsed && typeof parsed === 'object') {
				const envelope = parsed as { expiresAt?: number; items?: unknown }
				if (typeof envelope.expiresAt === 'number' && Date.now() > envelope.expiresAt) {
					window.localStorage.removeItem(STORAGE_KEY)
					return []
				}
				return Array.isArray(envelope.items) ? (envelope.items as JourneyBreadcrumb[]) : []
			}
		}
		// Graceful fallback from legacy sessionStorage key if still present
		const legacyRaw = window.sessionStorage?.getItem(STORAGE_KEY)
		if (legacyRaw) {
			const legacyParsed = JSON.parse(legacyRaw)
			if (Array.isArray(legacyParsed)) return legacyParsed
		}
	} catch {
		// Ignore storage access or malformed JSON errors
	}
	return []
}

function writeStoredBreadcrumbs(list: JourneyBreadcrumb[]): void {
	if (typeof window === 'undefined') return
	try {
		const trimmed = list.slice(-MAX_BREADCRUMBS)
		window.localStorage?.setItem(
			STORAGE_KEY,
			JSON.stringify({
				expiresAt: Date.now() + SESSION_TTL_MS,
				items: trimmed,
			}),
		)
	} catch {
		// Ignore localStorage quota or access errors
	}
}

export function recordPageVisit(title?: string): void {
	if (typeof window === 'undefined') return

	const currentPath = getCurrentJourneyPath()
	const currentTitle = title || document.title || currentPath
	const list = readStoredBreadcrumbs()

	// Don't add duplicate if refreshed same page
	const last = list[list.length - 1]
	if (
		last &&
		last.path === currentPath &&
		(!last.event || last.event === 'page_view')
	) {
		return
	}

	list.push({
		path: currentPath,
		title: currentTitle.replace(/\s*\|.*$/, '').trim(),
		timestamp: new Date().toISOString(),
		event: 'page_view',
	})

	writeStoredBreadcrumbs(list)
}

export function getSessionJourney(): JourneyBreadcrumb[] {
	return readStoredBreadcrumbs()
}

export function recordJourneyEvent(
	event: 'form_start' | 'cta_click' | 'contact_click' | 'catalog_download',
	label: string,
): void {
	if (typeof window === 'undefined') return
	const list = readStoredBreadcrumbs()
	const currentPath = getCurrentJourneyPath()
	const cleanLabel = label.trim().slice(0, 200) || event
	const last = list[list.length - 1]
	// Avoid double-logging identical interaction on rapid double-click
	if (last && last.event === event && last.title === cleanLabel && last.path === currentPath) {
		return
	}
	list.push({
		path: currentPath,
		title: cleanLabel,
		timestamp: new Date().toISOString(),
		event,
	})
	writeStoredBreadcrumbs(list)
}

export function clearSessionJourney(): void {
	if (typeof window !== 'undefined') {
		try {
			window.localStorage?.removeItem(STORAGE_KEY)
			window.sessionStorage?.removeItem(STORAGE_KEY)
		} catch {}
	}
}
