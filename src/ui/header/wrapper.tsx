'use client'

import { stegaClean } from 'next-sanity'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'


interface WrapperProps extends React.ComponentProps<'header'> {
	behavior?: string
	styleVariant?: string
	headerBackground?: string
	headerText?: string
	enableScrolledEffect?: boolean
}

export default function Wrapper({
	className,
	children,
	behavior = 'sticky',
	styleVariant = 'solid',
	headerBackground,
	headerText,
	enableScrolledEffect = true,
	style,
	...props
}: WrapperProps) {
	const ref = useRef<HTMLDivElement>(null)
	const pathname = usePathname()
	const [isVisible, setIsVisible] = useState(true)
	const [isScrolled, setIsScrolled] = useState(false)
	const lastScrollY = useRef(0)
	const rafId = useRef<number | null>(null)

	// Clean stega characters from Sanity visual editing
	const cleanBg = headerBackground ? stegaClean(headerBackground).trim() : undefined
	const cleanText = headerText ? stegaClean(headerText).trim() : undefined

	// Set and sync --header-height using ResizeObserver with default fallback
	useEffect(() => {
		if (typeof window === 'undefined' || !ref.current) return

		const updateHeight = () => {
			if (ref.current) {
				const height = ref.current.offsetHeight
				document.documentElement.style.setProperty(
					'--header-height',
					`${height}px`,
				)
				ref.current.style.setProperty(
					'--header-height',
					`${height}px`,
				)
			}
		}

		updateHeight()

		// ResizeObserver tracks dynamic height change (e.g. mobile search bar, window resize)
		const resizeObserver = new ResizeObserver(() => {
			updateHeight()
		})
		resizeObserver.observe(ref.current)

		return () => {
			resizeObserver.disconnect()
		}
	}, [])

	// Scroll listener: handles smart sticky & isScrolled state
	useEffect(() => {
		if (typeof window === 'undefined') return

		const handleScroll = () => {
			if (rafId.current !== null) return

			rafId.current = window.requestAnimationFrame(() => {
				const currentScrollY = window.scrollY
				const delta = currentScrollY - lastScrollY.current

				// 1. Scrolled state (> 15px)
				if (currentScrollY > 15) {
					setIsScrolled(true)
				} else {
					setIsScrolled(false)
				}

				// 2. Smart sticky hide/reveal
				if (behavior === 'smart') {
					if (currentScrollY > 80 && delta > 5) {
						setIsVisible((prev) => (prev ? false : prev)) // Scrolling down -> hide
					} else if (delta < -5 || currentScrollY <= 80) {
						setIsVisible((prev) => (!prev ? true : prev)) // Scrolling up or at top -> show
					}
				}

				lastScrollY.current = currentScrollY
				rafId.current = null
			})
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => {
			window.removeEventListener('scroll', handleScroll)
			if (rafId.current !== null) {
				window.cancelAnimationFrame(rafId.current)
				rafId.current = null
			}
		}
	}, [behavior])

	// Close menus & open dropdowns on route navigation
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

	const positionClass =
		behavior === 'static'
			? 'relative z-[60]'
			: behavior === 'smart'
				? cn(
						'sticky top-0 z-[60] transition-transform duration-300 ease-in-out',
						isVisible ? 'translate-y-0' : '-translate-y-full',
					)
				: 'sticky top-0 z-[60]'

	const styleClass =
		styleVariant === 'blur'
			? cn(
					'bg-header/85 backdrop-blur-md text-header-foreground',
					isScrolled && enableScrolledEffect && 'bg-header/95 backdrop-blur-lg shadow-md border-b border-stroke/15'
				)
			: styleVariant === 'transparent'
				? cn(
						'bg-transparent text-header-foreground',
						isScrolled && enableScrolledEffect && 'bg-header/90 backdrop-blur-md shadow-md border-b border-stroke/15'
					)
				: cn(
						'bg-header text-header-foreground',
						isScrolled && enableScrolledEffect && 'shadow-md border-b border-stroke/15'
					)

	const customStyle: React.CSSProperties = {
		...(style || {}),
		...(cleanBg
			? styleVariant === 'solid'
				? ({
						backgroundColor: cleanBg,
						'--header-bg': cleanBg,
						'--color-header': cleanBg,
					} as React.CSSProperties)
				: ({
						'--header-bg': cleanBg,
						'--color-header': cleanBg,
					} as React.CSSProperties)
			: {}),
		...(cleanText
			? ({
					color: cleanText,
					'--header-text': cleanText,
					'--color-header-foreground': cleanText,
				} as React.CSSProperties)
			: {}),
	}

	return (
		<header
			ref={ref}
			className={cn('w-full transition-all duration-300', positionClass, styleClass, className)}
			style={customStyle}
			role="banner"
			{...props}
		>
			{children}
		</header>
	)
}



