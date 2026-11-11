'use client'
import { useEffect, useState } from 'react'
import { useConsentStore } from '@/store/use-consent-store'
export default function CookiePreferences() {
	const [open, setOpen] = useState(false)
	const { marketing, setMarketing } = useConsentStore()
	useEffect(() => {
		const show = () => setOpen(true)
		window.addEventListener('open-cookie-preferences', show)
		return () => window.removeEventListener('open-cookie-preferences', show)
	}, [])
	if (!open) return null
	const choose = (allowed: boolean) => {
		const reload = marketing && !allowed
		setMarketing(allowed); setOpen(false)
		// Unload previously executed vendor scripts when withdrawing permission.
		if (reload) window.location.reload()
	}
	return <dialog open aria-labelledby="cookie-title" className="fixed inset-0 z-[100] m-auto max-w-md rounded-xl border border-border bg-background p-6 text-foreground shadow-xl">
		<h2 id="cookie-title" className="text-lg font-semibold">Cookie preferences</h2>
		<p className="my-4">Essential storage keeps your cart and secure sessions working. Marketing cookies and journey tracking are optional and disabled until you allow them.</p>
		<div className="flex flex-wrap gap-3">
			<button type="button" onClick={() => choose(false)} className="rounded border p-3">Essential only</button>
			<button type="button" onClick={() => choose(true)} className="rounded bg-primary p-3 text-primary-foreground">Allow marketing</button>
			<button type="button" onClick={() => setOpen(false)} className="rounded border p-3">Close</button>
		</div>
	</dialog>
}
