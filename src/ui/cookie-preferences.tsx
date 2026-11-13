'use client'
import { useEffect, useState } from 'react'
import { useConsentStore } from '@/store/use-consent-store'

export default function CookiePreferences() {
	const [dialogOpen, setDialogOpen] = useState(false)
	const [hydrated, setHydrated] = useState(false)
	const [dismissedBanner, setDismissedBanner] = useState(false)
	const { marketing, decided, setMarketing } = useConsentStore()

	useEffect(() => {
		const markHydrated = () => setHydrated(true)
		if (useConsentStore.persist?.hasHydrated?.()) {
			markHydrated()
		} else {
			const unsub = useConsentStore.persist?.onFinishHydration?.(markHydrated)
			return () => {
				if (typeof unsub === 'function') unsub()
			}
		}
	}, [])

	useEffect(() => {
		const show = () => setDialogOpen(true)
		window.addEventListener('open-cookie-preferences', show)
		return () => window.removeEventListener('open-cookie-preferences', show)
	}, [])

	const choose = (allowed: boolean) => {
		const reload = marketing && !allowed
		setMarketing(allowed)
		setDialogOpen(false)
		setDismissedBanner(false)
		// Unload previously executed vendor scripts when withdrawing permission.
		if (reload) window.location.reload()
	}

	const showAutoBanner = hydrated && !decided && !dialogOpen && !dismissedBanner

	if (!dialogOpen && !showAutoBanner) return null

	if (showAutoBanner) {
		return (
			<aside
				aria-label="Cookie preferences notice"
				className="fixed bottom-4 left-4 right-4 z-[90] max-w-md rounded-xl border border-border bg-background/95 p-4 text-foreground shadow-xl backdrop-blur-sm sm:right-auto"
			>
				<div className="flex items-start justify-between gap-3">
					<div>
						<h2 className="text-sm font-semibold">Privacy &amp; Cookie Settings</h2>
						<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
							Essential storage keeps your cart and request forms working. Allow marketing cookies to enable partner attribution cookies &amp; third-party analytics.
						</p>
					</div>
					<button
						type="button"
						aria-label="Dismiss cookie notice"
						onClick={() => setDismissedBanner(true)}
						className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted"
					>
						×
					</button>
				</div>
				<div className="mt-3 flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => choose(false)}
						className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
					>
						Essential only
					</button>
					<button
						type="button"
						onClick={() => choose(true)}
						className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
					>
						Allow marketing
					</button>
				</div>
			</aside>
		)
	}

	return (
		<dialog
			open
			aria-labelledby="cookie-title"
			className="fixed inset-0 z-[100] m-auto max-w-md rounded-xl border border-border bg-background p-6 text-foreground shadow-xl"
		>
			<h2 id="cookie-title" className="text-lg font-semibold">Cookie preferences</h2>
			<p className="my-4 text-sm text-muted-foreground">
				Essential storage keeps your cart, inquiry forms, and secure sessions working. Marketing cookies and external tracking tags are optional and remain disabled until you allow them.
			</p>
			<div className="flex flex-wrap gap-3">
				<button type="button" onClick={() => choose(false)} className="rounded border px-3 py-2 text-sm">Essential only</button>
				<button type="button" onClick={() => choose(true)} className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Allow marketing</button>
				<button type="button" onClick={() => setDialogOpen(false)} className="rounded border px-3 py-2 text-sm">Close</button>
			</div>
		</dialog>
	)
}
