import { useConsentStore } from '@/store/use-consent-store'

/**
 * Client-side Session Journey Breadcrumbs Tracker
 * Stores visited pages in sessionStorage to provide full-funnel attribution
 * when a user submits a lead or contact form.
 */

export interface JourneyBreadcrumb {
	path: string
	title: string
	timestamp: string
	event?: string
}

const STORAGE_KEY = 'deanflow_session_journey'
const MAX_BREADCRUMBS = 40

export function recordPageVisit(title?: string): void {
	if (typeof window === 'undefined' || !useConsentStore.getState().marketing)
		return

	try {
		const currentPath = window.location.pathname
		const currentTitle = title || document.title || currentPath
		const raw = sessionStorage.getItem(STORAGE_KEY)
		let list: JourneyBreadcrumb[] = []

		if (raw) {
			try {
				list = JSON.parse(raw)
			} catch {
				list = []
			}
		}

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

		if (list.length > MAX_BREADCRUMBS) {
			list = list.slice(list.length - MAX_BREADCRUMBS)
		}

		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list))
	} catch {
		// Ignore sessionStorage quota or access errors
	}
}

export function getSessionJourney(): JourneyBreadcrumb[] {
	if (typeof window === 'undefined' || !useConsentStore.getState().marketing)
		return []

	try {
		const raw = sessionStorage.getItem(STORAGE_KEY)
		if (!raw) return []
		return JSON.parse(raw)
	} catch {
		return []
	}
}

export function recordJourneyEvent(
	event: 'form_start' | 'cta_click' | 'contact_click' | 'catalog_download',
	label: string,
): void {
	if (typeof window === 'undefined' || !useConsentStore.getState().marketing)
		return
	try {
		const list = getSessionJourney()
		list.push({
			path: window.location.pathname,
			title: label.slice(0, 200),
			timestamp: new Date().toISOString(),
			event,
		})
		sessionStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(list.slice(-MAX_BREADCRUMBS)),
		)
	} catch {}
}
export function clearSessionJourney(): void {
	if (typeof window !== 'undefined') {
		try {
			sessionStorage.removeItem(STORAGE_KEY)
		} catch {}
	}
}
