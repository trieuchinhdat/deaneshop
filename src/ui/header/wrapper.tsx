'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface WrapperProps extends React.ComponentProps<'header'> {
	behavior?: string
	styleVariant?: string
	headerBackground?: string
	headerText?: string
}

export default function Wrapper({
	className,
	children,
	behavior = 'sticky',
	styleVariant = 'solid',
	headerBackground,
	headerText,
	style,
	...props
}: WrapperProps) {
	const ref = useRef<HTMLDivElement>(null)
	const pathname = usePathname()
	const [isVisible, setIsVisible] = useState(true)
	const lastScrollY = useRef(0)

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

	// smart sticky scroll listener
	useEffect(() => {
		if (behavior !== 'smart' || typeof window === 'undefined') return

		const handleScroll = () => {
			const currentScrollY = window.scrollY
			if (currentScrollY > 80 && currentScrollY > lastScrollY.current) {
				setIsVisible(false) // Scrolling down -> hide
			} else {
				setIsVisible(true) // Scrolling up -> show
			}
			lastScrollY.current = currentScrollY
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [behavior])

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

	const positionClass =
		behavior === 'static'
			? 'relative'
			: behavior === 'smart'
				? cn(
						'sticky top-0 z-10 transition-transform duration-300 ease-in-out',
						isVisible ? 'translate-y-0' : '-translate-y-full',
					)
				: 'sticky top-0 z-10'

	const styleClass =
		styleVariant === 'blur'
			? 'bg-header/80 backdrop-blur-md text-header-foreground'
			: styleVariant === 'transparent'
				? 'bg-transparent text-header-foreground'
				: 'bg-header text-header-foreground'

	const customStyle: React.CSSProperties = {
		...(style || {}),
		...(headerBackground
			? styleVariant === 'solid'
				? { backgroundColor: headerBackground, '--header-bg': headerBackground }
				: { '--header-bg': headerBackground }
			: {}),
		...(headerText ? { color: headerText, '--header-text': headerText } : {}),
	}

	return (
		<header
			ref={ref}
			className={cn(positionClass, styleClass, className)}
			style={customStyle}
			role="banner"
			{...props}
		>
			{children}
		</header>
	)
}
