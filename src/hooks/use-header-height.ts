// hooks/use-header-height.ts
import { useEffect, useState } from 'react'

export function useHeaderHeight() {
	const [height, setHeight] = useState(0)

	useEffect(() => {
		// Update header height
		const updateHeight = () => {
			// Find header element (<header> or id="site-header")
			const header =
				document.querySelector('header') ||
				document.getElementById('site-header')

			if (header) {
				setHeight(header.offsetHeight)
			}
		}

		// 1. Measure on initial mount
		updateHeight()

		// 2. Measure on window resize
		window.addEventListener('resize', updateHeight)

		// 3. Observe header DOM resize
		const header = document.querySelector('header')
		let observer: ResizeObserver | null = null

		if (header) {
			observer = new ResizeObserver(updateHeight)
			observer.observe(header)
		}

		return () => {
			window.removeEventListener('resize', updateHeight)
			if (observer) observer.disconnect()
		}
	}, [])

	return height
}
