'use client'

import { stegaClean } from 'next-sanity'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'


interface WrapperProps extends React.ComponentProps<'header'> {
	behavior?: string
	styleVariant?: string
	headerThemeStyle?: string
	headerBackground?: string
	headerText?: string
	enableScrolledEffect?: boolean
	transparentOnHome?: boolean
	topBar?: React.ReactNode
	topbarSticky?: boolean
}

export default function Wrapper({
	className,
	children,
	behavior = 'sticky',
	styleVariant = 'solid',
	headerThemeStyle = 'default',
	headerBackground,
	headerText,
	enableScrolledEffect = true,
	transparentOnHome = false,
	topBar,
	topbarSticky = false,
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
	const cleanTheme = headerThemeStyle ? stegaClean(headerThemeStyle).trim() : 'default'

	// Check if transparent header on homepage hero is active
	const isTransparentActive = Boolean(transparentOnHome && pathname === '/' && !isScrolled)

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

		// ResizeObserver tracks dynamic height change (e.g. mobile search bar, window resize, topbar collapse)
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

	const styleClass = isTransparentActive
		? 'bg-transparent text-white border-transparent shadow-none'
		: cleanTheme === 'light'
			? cn(
					'bg-white text-gray-900 border-b border-gray-200/70',
					isScrolled && enableScrolledEffect && 'shadow-md border-gray-200'
				)
			: cleanTheme === 'dark'
				? cn(
						'bg-slate-950 text-slate-100 border-b border-slate-800/80',
						isScrolled && enableScrolledEffect && 'shadow-lg border-slate-800'
					)
				: styleVariant === 'blur'
					? cn(
							'bg-header/85 backdrop-blur-md text-header-foreground border-b border-transparent',
							isScrolled && enableScrolledEffect && 'bg-header/95 backdrop-blur-lg shadow-md border-stroke/15'
						)
					: cn(
							'bg-header text-header-foreground border-b border-transparent',
							isScrolled && enableScrolledEffect && 'shadow-md border-stroke/15'
						)

	const customStyle: React.CSSProperties = {
		...(style || {}),
		...(!isTransparentActive && cleanBg
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
		...(!isTransparentActive && cleanText
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
			id="site-header"
			data-scrolled={isScrolled ? 'true' : 'false'}
			className={cn(
				'w-full transition-all duration-300 print:hidden',
				isTransparentActive && '-mb-[var(--header-height,64px)]',
				positionClass,
				styleClass,
				className
			)}
			style={customStyle}
			role="banner"
			{...props}
		>
			{/* Skip link for keyboard & screen reader accessibility */}
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:shadow-2xl focus:font-bold focus:outline-none focus:ring-2 focus:ring-white transition-all"
			>
				Skip to main content
			</a>

			{/* Top Announcement Bar Container with smooth scroll collapse */}
			{topBar && (
				<div
					className={cn(
						'transition-all duration-300 ease-in-out overflow-hidden',
						!topbarSticky && isScrolled
							? 'max-h-0 opacity-0 pointer-events-none'
							: 'max-h-16 opacity-100'
					)}
				>
					{topBar}
				</div>
			)}

			{children}
		</header>
	)
}



