'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import {
	clearSessionJourney,
	recordJourneyEvent,
	recordPageVisit,
} from '@/lib/journey-tracker'
import { useConsentStore } from '@/store/use-consent-store'

function TrackerInner() {
	const marketing = useConsentStore((s) => s.marketing)
	const pathname = usePathname()
	const searchParams = useSearchParams()

	useEffect(() => {
		if (!marketing) {
			clearSessionJourney()
			return
		}
		const timer = setTimeout(() => {
			recordPageVisit(document.title)
		}, 100)

		return () => clearTimeout(timer)
	}, [pathname, searchParams, marketing])

	useEffect(() => {
		if (!marketing) return
		const started = new WeakSet<HTMLFormElement>()
		const onFocus = (e: FocusEvent) => {
			const form = e.target instanceof Element ? e.target.closest('form') : null
			if (form && !started.has(form)) {
				started.add(form)
				recordJourneyEvent(
					'form_start',
					form.getAttribute('data-form-id') || form.id || 'Website form',
				)
			}
		}
		const onClick = (e: MouseEvent) => {
			const element =
				e.target instanceof Element ? e.target.closest('a,button') : null
			if (!element) return
			const href = element.getAttribute('href') || ''
			if (/^(tel:|mailto:|https:\/\/(wa.me|api.whatsapp.com))/.test(href))
				recordJourneyEvent('contact_click', 'Contact link opened')
			else if (element.hasAttribute('download'))
				recordJourneyEvent('catalog_download', 'Download link clicked')
			else if (element.hasAttribute('data-track-cta'))
				recordJourneyEvent(
					'cta_click',
					element.getAttribute('data-track-cta') || 'CTA',
				)
		}
		document.addEventListener('focusin', onFocus)
		document.addEventListener('click', onClick)
		return () => {
			document.removeEventListener('focusin', onFocus)
			document.removeEventListener('click', onClick)
		}
	}, [marketing])

	return null
}

export default function JourneyTracker() {
	return (
		<Suspense fallback={null}>
			<TrackerInner />
		</Suspense>
	)
}
