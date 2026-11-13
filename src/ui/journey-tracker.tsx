'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'
import { sendAnalyticsBeacon } from '@/lib/analytics-client'
import { captureCurrentUrlAttribution } from '@/lib/attribution'
import { recordJourneyEvent, recordPageVisit } from '@/lib/journey-tracker'
import { syncAttributionForConsent, useConsentStore } from '@/store/use-consent-store'

const CONTACT_CHANNEL_PATTERNS: Array<{ re: RegExp; prefix: string }> = [
	{ re: /^tel:/i, prefix: 'Phone' },
	{ re: /^mailto:/i, prefix: 'Email' },
	{ re: /^sms:/i, prefix: 'SMS' },
	{ re: /^https?:\/\/(wa\.me|api\.whatsapp\.com)\b/i, prefix: 'WhatsApp' },
	{ re: /^https?:\/\/(zalo\.me|chat\.zalo\.me)\b/i, prefix: 'Zalo' },
	{ re: /^https?:\/\/(m\.me|www\.messenger\.com)\b/i, prefix: 'Messenger' },
	{ re: /^https?:\/\/(t\.me|telegram\.me)\b/i, prefix: 'Telegram' },
	{ re: /^https?:\/\/(www\.)?instagram\.com\b/i, prefix: 'Instagram' },
]

function extractContactLabel(element: Element, href: string): string | null {
	for (const { re, prefix } of CONTACT_CHANNEL_PATTERNS) {
		if (re.test(href)) {
			const cleanText =
				element.getAttribute('aria-label') ||
				element.textContent?.replace(/\s+/g, ' ').trim() ||
				''
			const shortTarget = href.replace(/^(tel:|mailto:|sms:|https?:\/\/)/i, '').split('?')[0].slice(0, 60)
			const detail = cleanText ? `${prefix}: ${cleanText}` : `${prefix}: ${shortTarget}`
			return detail.slice(0, 120)
		}
	}
	return null
}

function TrackerInner() {
	const marketing = useConsentStore((s) => s.marketing)
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const isInitialMountRef = useRef(true)

	useEffect(() => {
		const checkExternalReferrer = isInitialMountRef.current
		isInitialMountRef.current = false

		if (marketing) {
			// Persist 90-day attribution cookie if marketing consent is granted,
			// checking external referrer ONLY on initial hard-load (never on SPA transitions).
			syncAttributionForConsent(true, { checkExternalReferrer })
		} else {
			// Keep first-party session attribution in localStorage without setting persistent marketing cookies.
			captureCurrentUrlAttribution(window.location.href, document.referrer || '', '', {
				checkExternalReferrer,
				persistSession: true,
			})
		}

		const timer = setTimeout(() => {
			recordPageVisit(document.title)
			sendAnalyticsBeacon({
				event: 'page_view',
				path: pathname || window.location.pathname,
				label: (document.title || '').slice(0, 120),
			})
		}, 60)

		return () => clearTimeout(timer)
	}, [pathname, searchParams, marketing])

	useEffect(() => {
		const started = new WeakSet<HTMLFormElement>()
		const onFocus = (e: FocusEvent) => {
			const form = e.target instanceof Element ? e.target.closest('form') : null
			if (form && !started.has(form)) {
				started.add(form)
				const formLabel =
					form.getAttribute('data-form-id') ||
					form.getAttribute('aria-label') ||
					form.id ||
					'Website form'
				recordJourneyEvent('form_start', formLabel)
				sendAnalyticsBeacon({
					event: 'form_start',
					placement: form.getAttribute('data-form-id') || form.id || '',
					label: formLabel,
				})
			}
		}
		const onClick = (e: MouseEvent) => {
			const element =
				e.target instanceof Element ? e.target.closest('a,button') : null
			if (!element) return
			const href = element.getAttribute('href') || ''
			const contactLabel = href ? extractContactLabel(element, href) : null
			if (contactLabel) {
				recordJourneyEvent('contact_click', contactLabel)
				sendAnalyticsBeacon({
					event: 'contact_click',
					label: contactLabel,
				})
			} else if (
				element.hasAttribute('download') ||
				/\.pdf($|\?)/i.test(href)
			) {
				const fileLabel =
					element.getAttribute('download') ||
					element.textContent?.replace(/\s+/g, ' ').trim() ||
					href.split('/').pop()?.split('?')[0] ||
					'Document download'
				recordJourneyEvent('catalog_download', fileLabel.slice(0, 120))
				sendAnalyticsBeacon({
					event: 'catalog_download',
					label: fileLabel.slice(0, 120),
				})
			} else if (element.hasAttribute('data-track-cta')) {
				const ctaLabel =
					element.getAttribute('data-track-cta') ||
					element.textContent?.replace(/\s+/g, ' ').trim() ||
					'CTA'
				recordJourneyEvent('cta_click', ctaLabel)
				sendAnalyticsBeacon({
					event: 'cta_click',
					label: ctaLabel.slice(0, 120),
				})
			}
		}
		document.addEventListener('focusin', onFocus)
		document.addEventListener('click', onClick)
		return () => {
			document.removeEventListener('focusin', onFocus)
			document.removeEventListener('click', onClick)
		}
	}, [])

	return null
}

export default function JourneyTracker() {
	return (
		<Suspense fallback={null}>
			<TrackerInner />
		</Suspense>
	)
}
