'use client'

export default function CookiePreferencesTrigger() {
	return (
		<button
			type="button"
			onClick={() => {
				if (typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('open-cookie-preferences'))
				}
			}}
			className="inline-flex min-h-[32px] md:min-h-0 items-center text-xs text-muted-foreground hover:text-foreground transition-colors hover:underline cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
			aria-label="Open Cookie Preferences settings"
		>
			Cookie Preferences
		</button>
	)
}
