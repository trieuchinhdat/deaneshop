'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function ScrollToTop() {
	const pathname = usePathname()

	useEffect(() => {
		// Only scroll to top if there is no hash anchor in the URL
		if (typeof window !== 'undefined' && !window.location.hash) {
			window.scrollTo({
				top: 0,
				left: 0,
				behavior: 'instant',
			})
		}
	}, [pathname])

	return null
}
