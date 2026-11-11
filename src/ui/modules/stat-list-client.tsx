'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCounterProps {
	value?: string
	prefix?: string
	suffix?: string
	enabled?: boolean
	className?: string
}

/**
 * Animated counter that smoothly increments numbers when scrolled into view.
 * - Progressive enhancement: renders full static text in SSR (zero CLS, SEO safe).
 * - Honors prefers-reduced-motion automatically.
 * - Handles comma-separated numbers (500,000), decimals (99.4), and mixed characters.
 */
export function StatCounter({
	value = '',
	prefix = '',
	suffix = '',
	enabled = true,
	className,
}: StatCounterProps) {
	const ref = useRef<HTMLSpanElement>(null)
	const [hasAnimated, setHasAnimated] = useState(false)
	const [displayNumber, setDisplayNumber] = useState<string>(value)

	// Clean numbers and detect formatting
	const cleanNumericString = value.replace(/,/g, '').trim()
	const numericTarget = parseFloat(cleanNumericString)
	const isNumeric = !Number.isNaN(numericTarget) && numericTarget > 0

	// Check if original had decimals or commas
	const decimalParts = cleanNumericString.split('.')
	const decimalPlaces = decimalParts.length > 1 ? decimalParts[1].length : 0
	const hasCommas = value.includes(',')

	const formatNumber = useCallback(
		(num: number): string => {
			const fixed = num.toFixed(decimalPlaces)
			if (!hasCommas) return fixed
			const [intPart, decPart] = fixed.split('.')
			const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
			return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
		},
		[decimalPlaces, hasCommas],
	)

	useEffect(() => {
		if (!enabled || !isNumeric || hasAnimated) return

		// Check reduced motion preference
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
		if (mediaQuery.matches) {
			setDisplayNumber(value)
			setHasAnimated(true)
			return
		}

		const element = ref.current
		if (!element) return

		let animationFrameId: number
		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries
				if (!entry.isIntersecting) return

				// Disconnect once triggered
				observer.disconnect()
				setHasAnimated(true)

				const startTime = performance.now()
				const duration = 1400 // ms

				const animate = (currentTime: number) => {
					const elapsed = currentTime - startTime
					const progress = Math.min(elapsed / duration, 1)

					// Ease out cubic: 1 - (1 - t)^3
					const easeOut = 1 - Math.pow(1 - progress, 3)
					const currentVal = easeOut * numericTarget

					setDisplayNumber(formatNumber(currentVal))

					if (progress < 1) {
						animationFrameId = requestAnimationFrame(animate)
					} else {
						setDisplayNumber(value)
					}
				}

				animationFrameId = requestAnimationFrame(animate)
			},
			{ threshold: 0.15 },
		)

		observer.observe(element)

		return () => {
			observer.disconnect()
			if (animationFrameId) cancelAnimationFrame(animationFrameId)
		}
	}, [enabled, isNumeric, hasAnimated, numericTarget, value, formatNumber])

	const accessibleLabel = `${prefix}${value}${suffix}`

	return (
		<span
			ref={ref}
			className={cn('inline-flex items-baseline tabular-nums', className)}
			aria-label={accessibleLabel}
		>
			{prefix && (
				<span className="mr-0.5 opacity-85 select-none" aria-hidden="true">
					{prefix}
				</span>
			)}
			<span aria-hidden="true">{displayNumber || value}</span>
			{suffix && (
				<span className="ml-0.5 opacity-85 select-none" aria-hidden="true">
					{suffix}
				</span>
			)}
		</span>
	)
}

interface StatCarouselProps {
	children: ReactNode[]
	className?: string
}

/**
 * Mobile swipe carousel for compact, touch-friendly metric viewing.
 * - Hardware accelerated CSS scroll snap.
 * - Touch indicator dots with active page state.
 * - Left/Right chevrons for accessibility and fine control.
 */
export function StatCarousel({ children, className }: StatCarouselProps) {
	const scrollRef = useRef<HTMLDivElement>(null)
	const [activeIndex, setActiveIndex] = useState(0)
	const totalSlides = children.length

	const handleScroll = useCallback(() => {
		const el = scrollRef.current
		if (!el) return
		const scrollLeft = el.scrollLeft
		const slideWidth = el.offsetWidth * 0.82 // ~80% width per slide
		const newIndex = Math.round(scrollLeft / slideWidth)
		setActiveIndex(Math.min(Math.max(0, newIndex), totalSlides - 1))
	}, [totalSlides])

	const scrollToSlide = (index: number) => {
		const el = scrollRef.current
		if (!el) return
		const slideWidth = el.offsetWidth * 0.82
		el.scrollTo({
			left: index * slideWidth,
			behavior: 'smooth',
		})
	}

	return (
		<div className={cn('relative w-full', className)}>
			{/* Scroll container */}
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className="scrollbar-none -mx-1 flex w-full touch-pan-x snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pt-1 pb-3"
				style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
			>
				{children.map((child, index) => (
					<div
						key={index}
						className="w-[84vw] max-w-[340px] shrink-0 snap-center first:pl-0"
					>
						{child}
					</div>
				))}
			</div>

			{/* Navigation Controls: Dots & Chevrons */}
			{totalSlides > 1 && (
				<div className="mt-4 flex items-center justify-between px-2">
					{/* Chevrons */}
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={() => scrollToSlide(activeIndex - 1)}
							disabled={activeIndex === 0}
							className="border-border/60 bg-surface/90 text-foreground hover:bg-muted focus-visible:ring-primary inline-flex size-8 items-center justify-center rounded-full border shadow-2xs transition-colors focus-visible:ring-2 focus-visible:outline-hidden disabled:opacity-30"
							aria-label="Previous metric"
						>
							<ChevronLeft className="size-4" />
						</button>
						<button
							type="button"
							onClick={() => scrollToSlide(activeIndex + 1)}
							disabled={activeIndex === totalSlides - 1}
							className="border-border/60 bg-surface/90 text-foreground hover:bg-muted focus-visible:ring-primary inline-flex size-8 items-center justify-center rounded-full border shadow-2xs transition-colors focus-visible:ring-2 focus-visible:outline-hidden disabled:opacity-30"
							aria-label="Next metric"
						>
							<ChevronRight className="size-4" />
						</button>
					</div>

					{/* Dot pagination */}
					<div
						className="flex items-center gap-1.5"
						role="tablist"
						aria-label="Metric carousel pagination"
					>
						{children.map((_, idx) => (
							<button
								key={idx}
								type="button"
								onClick={() => scrollToSlide(idx)}
								className={cn(
									'focus-visible:ring-primary h-1.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:outline-hidden',
									activeIndex === idx
										? 'bg-primary w-6'
										: 'bg-muted-foreground/30 hover:bg-muted-foreground/60 w-1.5',
								)}
								aria-label={`Go to metric ${idx + 1} of ${totalSlides}`}
								aria-selected={activeIndex === idx}
								role="tab"
							/>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
