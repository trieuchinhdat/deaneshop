'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

export default function ({
	className,
	children,
}: React.ComponentProps<'header'>) {
	const ref = useRef<HTMLDivElement>(null)
	const pathname = usePathname()

	// set --header-height
	useEffect(() => {
		if (typeof window === 'undefined') return

		function setHeight() {
			if (!ref.current) return
			document.documentElement.style.setProperty(
				'--header-height',
				`${ref.current.offsetHeight ?? 0}px`,
			)
		}
		setHeight()
		window.addEventListener('resize', setHeight)

		return () => window.removeEventListener('resize', setHeight)
	}, [])

	// close menus after navigation
	useEffect(() => {
		if (typeof document === 'undefined') return
		const toggle = document.querySelector('#header-open') as HTMLInputElement
		if (toggle) toggle.checked = false

		if (!ref.current) return
		ref.current
			.querySelectorAll('details.group\\/dropdown, details.group\\/megamenu')
			.forEach((element) => {
				const detailsElement = element as HTMLDetailsElement
				if (detailsElement.open) detailsElement.open = false
			})
	}, [pathname])

	return (
		<header ref={ref} className={cn('relative', className)} role="banner">
			{children}
		</header>
	)
}
