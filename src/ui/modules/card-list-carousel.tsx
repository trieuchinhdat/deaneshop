'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type KeyboardEvent,
	type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

interface CardListCarouselProps {
	children: ReactNode
	showArrows?: boolean
	isDesktopCarousel?: boolean
	isMobileCarousel?: boolean
	ariaLabel?: string
	className?: string
}

export default function CardListCarousel({
	children,
	showArrows = true,
	isDesktopCarousel = false,
	isMobileCarousel = false,
	ariaLabel = 'Feature cards',
	className,
}: CardListCarouselProps) {
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
			{/* Floating Desktop Navigation Arrow: Previous */}
			{showArrows && (
				<button
					type="button"
					onClick={scrollPrev}
					disabled={!canScrollLeft}
					aria-label="Previous feature cards"
					className={cn(
						'absolute top-1/2 -left-3.5 z-20 -translate-y-1/2 sm:-left-5',
						'size-10 items-center justify-center rounded-full sm:size-11',
						'border-border/80 bg-surface/90 text-foreground border shadow-md backdrop-blur-md',
						'hover:bg-surface transition-all duration-200 hover:scale-105 active:scale-95',
						'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
						'disabled:pointer-events-none disabled:opacity-0',
						isDesktopCarousel ? 'flex' : 'hidden sm:flex',
						!canScrollLeft && 'pointer-events-none opacity-0',
					)}
				>
					<ChevronLeft className="size-5" />
				</button>
			)}

			{/* Scrollable Carousel Track */}
			<div
				ref={scrollRef}
				tabIndex={0}
				role="region"
				aria-roledescription="carousel"
				aria-label={ariaLabel}
				onKeyDown={handleKeyDown}
				className={cn(
					'scrollbar-none focus-visible:ring-primary/40 snap-x snap-mandatory overflow-x-auto rounded-2xl focus-visible:ring-1 focus-visible:outline-none',
					isMobileCarousel &&
						!isDesktopCarousel &&
						'max-sm:-mx-4 max-sm:px-4 max-sm:pb-4',
					isDesktopCarousel && 'pb-4',
				)}
			>
				{children}
			</div>

			{/* Floating Desktop Navigation Arrow: Next */}
			{showArrows && (
				<button
					type="button"
					onClick={scrollNext}
					disabled={!canScrollRight}
					aria-label="Next feature cards"
					className={cn(
						'absolute top-1/2 -right-3.5 z-20 -translate-y-1/2 sm:-right-5',
						'size-10 items-center justify-center rounded-full sm:size-11',
						'border-border/80 bg-surface/90 text-foreground border shadow-md backdrop-blur-md',
						'hover:bg-surface transition-all duration-200 hover:scale-105 active:scale-95',
						'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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
