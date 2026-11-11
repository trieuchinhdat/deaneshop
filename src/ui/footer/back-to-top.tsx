'use client'

import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
	const scrollToTop = () => {
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' })
		}
	}

	return (
		<button
			type="button"
			onClick={scrollToTop}
			aria-label="Scroll back to top of page"
			className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-border/50 bg-surface/80 px-3 py-1 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-surface hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 cursor-pointer shadow-2xs select-none"
		>
			<span>Back to top</span>
			<ArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
		</button>
	)
}
