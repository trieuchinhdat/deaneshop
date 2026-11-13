import { webUrl } from '../env'

// Preserve the non-secret transaction state if Studio authentication rewrites its URL.
// The browser verifier and CRM session remain HttpOnly cookies on the website.
const storageKey = `deanflow-login-state:${webUrl}`
export function captureLoginState() {
	if (typeof window === 'undefined') return ''
	const state = new URLSearchParams(window.location.search).get('state')
	try {
		if (state && /^[A-Za-z0-9_-]{43}$/.test(state)) {
			window.sessionStorage.setItem(storageKey, state)
			return state
		}
		return window.sessionStorage.getItem(storageKey) || ''
	} catch {
		return state && /^[A-Za-z0-9_-]{43}$/.test(state) ? state : ''
	}
}

export function clearLoginState() {
	try {
		window.sessionStorage.removeItem(storageKey)
	} catch {}
}
