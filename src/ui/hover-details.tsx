'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { useIsDesktop } from '@/hooks/useMatchMedia'
import { cn } from '@/lib/utils'
import css from './hover-details.module.css'

/**
 * @param safeAreaOnHover - Adds a safe area around the details element to prevent it from closing when the mouse leaves the element
 * @param closeAfterNavigate - Closes the details element after a navigation event
 */
export default function ({
	safeAreaOnHover,
	closeAfterNavigate,
	delay,
	closeDelay = 150,
	className,
	...props
}: {
	safeAreaOnHover?: boolean
	closeAfterNavigate?: boolean
	delay?: number
	closeDelay?: number
} & ComponentProps<'details'>) {
	const isDesktop = useIsDesktop()
	const [open, setOpen] = useState(false)
	const openTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const events = isDesktop
		? {
				onMouseEnter: () => {
					if (closeTimeoutRef.current) {
						clearTimeout(closeTimeoutRef.current)
						closeTimeoutRef.current = null
					}
					if (delay) {
						openTimeoutRef.current = setTimeout(() => setOpen(true), delay)
					} else {
						setOpen(true)
					}
				},
				onMouseLeave: () => {
					if (openTimeoutRef.current) {
						clearTimeout(openTimeoutRef.current)
						openTimeoutRef.current = null
					}
					closeTimeoutRef.current = setTimeout(() => {
						setOpen(false)
					}, closeDelay)
				},
			}
		: {}

	useEffect(() => {
		return () => {
			if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current)
			if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
		}
	}, [])

	// Close after navigation
	const pathname = usePathname()
	useEffect(() => {
		if (closeAfterNavigate) setOpen(false)
	}, [pathname])

	return (
		<details
			className={cn(safeAreaOnHover && css.safearea, className)}
			open={open}
			onToggle={(e) => {
				if (!isDesktop) {
					setOpen(e.currentTarget.open)
				}
			}}
			{...events}
			{...props}
		/>
	)
}
