'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { sendVitalsBeacon, updateVitalsSnapshot } from '@/lib/vitals'

export default function WebVitalsReporter() {
	const pathname = usePathname()

	useEffect(() => {
		if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return

		let lcp: number | undefined
		let cls = 0
		let inp = 0
		let flushed = false

		const flush = () => {
			if (flushed) return
			flushed = true
			const snap = updateVitalsSnapshot({
				path: pathname || window.location.pathname,
				...(lcp !== undefined ? { lcp: Math.round(lcp) } : {}),
				cls: Number(cls.toFixed(4)),
				...(inp > 0 ? { inp: Math.round(inp) } : {}),
			})
			if (snap.lcp !== undefined || snap.inp !== undefined || (snap.cls ?? 0) > 0) {
				sendVitalsBeacon(snap)
			}
		}

		const observers: PerformanceObserver[] = []

		try {
			const lcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries()
				const last = entries.at(-1)
				if (last) {
					lcp = last.startTime
					updateVitalsSnapshot({ lcp: Math.round(lcp), path: pathname || window.location.pathname })
				}
			})
			lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
			observers.push(lcpObserver)
		} catch {}

		try {
			const clsObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) {
					if (!entry.hadRecentInput && typeof entry.value === 'number') {
						cls += entry.value
					}
				}
				updateVitalsSnapshot({ cls: Number(cls.toFixed(4)), path: pathname || window.location.pathname })
			})
			clsObserver.observe({ type: 'layout-shift', buffered: true })
			observers.push(clsObserver)
		} catch {}

		try {
			const inpObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries() as Array<PerformanceEntry & { duration?: number; interactionId?: number }>) {
					if (entry.interactionId && typeof entry.duration === 'number' && entry.duration > inp) {
						inp = entry.duration
					}
				}
				if (inp > 0) {
					updateVitalsSnapshot({ inp: Math.round(inp), path: pathname || window.location.pathname })
				}
			})
			inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit)
			observers.push(inpObserver)
		} catch {}

		const onVisibilityChange = () => {
			if (document.visibilityState === 'hidden') flush()
		}

		window.addEventListener('pagehide', flush, { once: true })
		document.addEventListener('visibilitychange', onVisibilityChange)

		return () => {
			flush()
			for (const observer of observers) observer.disconnect()
			window.removeEventListener('pagehide', flush)
			document.removeEventListener('visibilitychange', onVisibilityChange)
		}
	}, [pathname])

	return null
}

