'use client'

import { useEffect } from 'react'
import { isStaticStorefront } from '@/lib/deployment-profile'
import { isRuntimePath } from '@/lib/static-runtime-routes'

/** Private pages use the Worker document route, never an exported RSC URL. */
export default function StaticRuntimeNavigation() {
	useEffect(() => {
		if (!isStaticStorefront) return
		const navigate = (event: MouseEvent) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
			const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null
			if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return
			const url = new URL(anchor.href, window.location.href)
			if (url.origin !== window.location.origin || !isRuntimePath(url.pathname)) return
			event.preventDefault()
			event.stopPropagation()
			window.location.assign(url.href)
		}
		window.addEventListener('click', navigate, true)
		return () => window.removeEventListener('click', navigate, true)
	}, [])
	return null
}
