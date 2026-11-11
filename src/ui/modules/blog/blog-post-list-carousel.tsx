'use client'

import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type KeyboardEvent,
	type ReactNode,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlogPostListCarouselProps {
	children: ReactNode
	showArrows?: boolean
	isDesktopCarousel?: boolean
	isMobileCarousel?: boolean
	ariaLabel?: string
	className?: string
}

export default function BlogPostListCarousel({
	children,
	showArrows = true,
	isDesktopCarousel = false,
	isMobileCarousel = false,
	ariaLabel = 'Articles carousel',
	className,
}: BlogPostListCarouselProps) {
	const scrollRef = useRef<HTMLDivElement>(null)
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(true)

	const checkScrollBounds = useCallback(() => {
		const el = scrollRef.current
		if (!el) return
		const tolerance = 4
		const atLeft = el.scrollLeft <= tolerance
		const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance

		setCanScrollLeft(!atLeft)
		setCanScrollRight(!atRight)
	}, [])

	useEffect(() => {
		const el = scrollRef.current
		if (!el) return

		checkScrollBounds()
		el.addEventListener('scroll', checkScrollBounds, { passive: true })
		window.addEventListener('resize', checkScrollBounds)

		return () => {
			el.removeEventListener('scroll', checkScrollBounds)
			window.removeEventListener('resize', checkScrollBounds)
		}
	}, [checkScrollBounds])

	const scrollPrev = () => {
		const el = scrollRef.current
		if (!el) return
		const scrollDistance = Math.max(el.clientWidth * 0.75, 280)
		el.scrollBy({ left: -scrollDistance, behavior: 'smooth' })
	}

	const scrollNext = () => {
		const el = scrollRef.current
		if (!el) return
		const scrollDistance = Math.max(el.clientWidth * 0.75, 280)
		el.scrollBy({ left: scrollDistance, behavior: 'smooth' })
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'ArrowLeft') {
			e.preventDefault()
			scrollPrev()
		} else if (e.key === 'ArrowRight') {
			e.preventDefault()
			scrollNext()
		}
	}

	const hasCarouselActive = isDesktopCarousel || isMobileCarousel

	if (!hasCarouselActive) {
		return <div className={className}>{children}</div>
	}

	return (
		<div className={cn('group/carousel relative', className)}>
			{/* Floating Desktop / Tablet Navigation Arrow: Previous */}
			{showArrows && (
				<button
					type="button"
					onClick={scrollPrev}
					disabled={!canScrollLeft}
					aria-label="Previous articles"
					className={cn(
						'absolute top-1/2 -left-3.5 z-20 -translate-y-1/2 sm:-left-5',
						'flex size-10 sm:size-11 items-center justify-center rounded-full',
						'border border-zinc-200/90 bg-white/95 text-zinc-800 shadow-md backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:text-zinc-100',
						'hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer',
						'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none',
						'disabled:pointer-events-none disabled:opacity-0',
						isDesktopCarousel ? 'flex' : 'hidden sm:flex',
						!canScrollLeft && 'pointer-events-none opacity-0',
					)}
				>
					<ChevronLeft className="size-5" />
				</button>
			)}

			{/* Scrollable Track */}
			<div
				ref={scrollRef}
				tabIndex={0}
				role="region"
				aria-roledescription="carousel"
				aria-label={ariaLabel}
				onKeyDown={handleKeyDown}
				className={cn(
					'scrollbar-none snap-x snap-mandatory overflow-x-auto rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none',
					isMobileCarousel && !isDesktopCarousel && 'max-sm:-mx-4 max-sm:px-4 max-sm:pb-4',
					isDesktopCarousel && 'pb-4',
				)}
			>
				{children}
			</div>

			{/* Floating Desktop / Tablet Navigation Arrow: Next */}
			{showArrows && (
				<button
					type="button"
					onClick={scrollNext}
					disabled={!canScrollRight}
					aria-label="Next articles"
					className={cn(
						'absolute top-1/2 -right-3.5 z-20 -translate-y-1/2 sm:-right-5',
						'flex size-10 sm:size-11 items-center justify-center rounded-full',
						'border border-zinc-200/90 bg-white/95 text-zinc-800 shadow-md backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:text-zinc-100',
						'hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer',
						'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none',
						'disabled:pointer-events-none disabled:opacity-0',
						isDesktopCarousel ? 'flex' : 'hidden sm:flex',
						!canScrollRight && 'pointer-events-none opacity-0',
					)}
				>
					<ChevronRight className="size-5" />
				</button>
			)}
		</div>
	)
}
