'use client'

import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type KeyboardEvent,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReviewVideoLightbox from '@/ui/modules/product/review-video-lightbox'
import {
	SocialProofCard,
	type SocialProofReviewItem,
} from './social-proof-card'

interface SocialProofClientProps {
	reviews: SocialProofReviewItem[]
	layout?: 'grid' | 'carousel'
	columns?: 2 | 3 | 4
	isDark?: boolean
	cardElevation?: 'bordered' | 'elevated' | 'subtle'
	showArrows?: boolean
	showDots?: boolean
	autoplay?: boolean
	sanityAttrMap?: Record<string, string>
}

export default function SocialProofClient({
	reviews,
	layout = 'grid',
	columns = 3,
	isDark = false,
	cardElevation = 'bordered',
	showArrows = true,
	showDots = true,
	autoplay = false,
	sanityAttrMap,
}: SocialProofClientProps) {
	// Video Lightbox State
	const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)

	// Carousel Scroll State
	const scrollRef = useRef<HTMLDivElement>(null)
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(true)
	const [activeIndex, setActiveIndex] = useState(0)
	const [isPaused, setIsPaused] = useState(false)

	const checkScrollBounds = useCallback(() => {
		const el = scrollRef.current
		if (!el) return

		const tolerance = 6
		const atLeft = el.scrollLeft <= tolerance
		const atRight =
			el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance

		setCanScrollLeft(!atLeft)
		setCanScrollRight(!atRight)

		// Calculate active card index based on scroll position
		const children = Array.from(el.children) as HTMLElement[]
		if (children.length > 0) {
			const scrollCenter = el.scrollLeft + el.clientWidth / 2
			let closestIdx = 0
			let minDiff = Infinity

			children.forEach((child, idx) => {
				const childCenter = child.offsetLeft + child.clientWidth / 2
				const diff = Math.abs(scrollCenter - childCenter)
				if (diff < minDiff) {
					minDiff = diff
					closestIdx = idx
				}
			})
			setActiveIndex(closestIdx)
		}
	}, [])

	useEffect(() => {
		if (layout !== 'carousel') return
		const el = scrollRef.current
		if (!el) return

		checkScrollBounds()
		el.addEventListener('scroll', checkScrollBounds, { passive: true })
		window.addEventListener('resize', checkScrollBounds)

		return () => {
			el.removeEventListener('scroll', checkScrollBounds)
			window.removeEventListener('resize', checkScrollBounds)
		}
	}, [layout, checkScrollBounds])

	// Scroll actions
	const scrollPrev = useCallback(() => {
		const el = scrollRef.current
		if (!el) return
		const scrollAmount = Math.max(el.clientWidth * 0.8, 300)
		el.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
	}, [])

	const scrollNext = useCallback(() => {
		const el = scrollRef.current
		if (!el) return
		const scrollAmount = Math.max(el.clientWidth * 0.8, 300)
		el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
	}, [])

	const scrollToIndex = useCallback((index: number) => {
		const el = scrollRef.current
		if (!el) return
		const children = Array.from(el.children) as HTMLElement[]
		const targetChild = children[index]
		if (targetChild) {
			targetChild.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: 'start',
			})
		}
	}, [])

	// Autoplay mechanism with pause on hover/focus & reduced motion support
	useEffect(() => {
		if (layout !== 'carousel' || !autoplay || isPaused || reviews.length <= 1) return

		// Check if user prefers reduced motion
		if (
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			return
		}

		const interval = setInterval(() => {
			const el = scrollRef.current
			if (!el) return

			if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
				// Loop back smoothly to the beginning
				el.scrollTo({ left: 0, behavior: 'smooth' })
			} else {
				scrollNext()
			}
		}, 5500)

		return () => clearInterval(interval)
	}, [layout, autoplay, isPaused, reviews.length, scrollNext])

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'ArrowLeft') {
			e.preventDefault()
			scrollPrev()
		} else if (e.key === 'ArrowRight') {
			e.preventDefault()
			scrollNext()
		}
	}

	const gridColClasses = {
		2: 'grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto pt-2',
		3: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-2',
		4: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-2',
	}[columns] || 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-2'

	return (
		<>
			{layout === 'carousel' ? (
				<div
					className="group/carousel relative"
					onMouseEnter={() => setIsPaused(true)}
					onMouseLeave={() => setIsPaused(false)}
					onFocus={() => setIsPaused(true)}
					onBlur={() => setIsPaused(false)}
					tabIndex={0}
					onKeyDown={handleKeyDown}
					role="region"
					aria-roledescription="carousel"
					aria-label="Customer verified reviews carousel"
				>
					{/* Previous Navigation Button */}
					{showArrows && reviews.length > 1 && (
						<button
							type="button"
							onClick={scrollPrev}
							disabled={!canScrollLeft}
							aria-label="Previous customer review"
							className={cn(
								'absolute top-1/2 -left-3.5 sm:-left-5 z-20 -translate-y-1/2 flex size-10 items-center justify-center rounded-full border shadow-md transition-all duration-200 cursor-pointer',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
								isDark
									? 'bg-gray-900/95 border-gray-700 text-white hover:bg-gray-800 disabled:border-gray-800 disabled:text-gray-600 disabled:opacity-40'
									: 'bg-background/95 border-border text-foreground hover:bg-surface disabled:border-border/40 disabled:text-muted-foreground/30 disabled:opacity-40',
								!canScrollLeft && 'cursor-not-allowed',
							)}
						>
							<ChevronLeft className="size-5" aria-hidden="true" />
						</button>
					)}

					{/* Review Cards Carousel Container */}
					<div
						ref={scrollRef}
						className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory scroll-smooth scrollbar-none px-1"
						tabIndex={-1}
					>
						{reviews.map((review, idx) => (
							<div
								key={review._key || idx}
								role="group"
								aria-roledescription="slide"
								aria-label={`Review ${idx + 1} of ${reviews.length}`}
								className="w-[85vw] max-w-[360px] min-w-[270px] sm:w-[380px] sm:min-w-[340px] shrink-0 snap-start flex flex-col h-auto"
							>
								<SocialProofCard
									review={review}
									isDark={isDark}
									cardElevation={cardElevation}
									className="h-full"
									dataSanity={review._key ? sanityAttrMap?.[review._key] : undefined}
									onPlayVideo={setActiveVideoUrl}
								/>
							</div>
						))}
					</div>

					{/* Next Navigation Button */}
					{showArrows && reviews.length > 1 && (
						<button
							type="button"
							onClick={scrollNext}
							disabled={!canScrollRight}
							aria-label="Next customer review"
							className={cn(
								'absolute top-1/2 -right-3.5 sm:-right-5 z-20 -translate-y-1/2 flex size-10 items-center justify-center rounded-full border shadow-md transition-all duration-200 cursor-pointer',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
								isDark
									? 'bg-gray-900/95 border-gray-700 text-white hover:bg-gray-800 disabled:border-gray-800 disabled:text-gray-600 disabled:opacity-40'
									: 'bg-background/95 border-border text-foreground hover:bg-surface disabled:border-border/40 disabled:text-muted-foreground/30 disabled:opacity-40',
								!canScrollRight && 'cursor-not-allowed',
							)}
						>
							<ChevronRight className="size-5" aria-hidden="true" />
						</button>
					)}

					{/* Pagination Dots Indicator */}
					{showDots && reviews.length > 1 && (
						<div
							className="mt-6 flex items-center justify-center gap-2"
							role="tablist"
							aria-label="Review pagination"
						>
							{reviews.map((_, idx) => (
								<button
									key={idx}
									type="button"
									role="tab"
									aria-selected={activeIndex === idx}
									aria-label={`Go to review ${idx + 1} of ${reviews.length}`}
									onClick={() => scrollToIndex(idx)}
									className={cn(
										'h-2 rounded-full transition-all duration-300 cursor-pointer',
										'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
										activeIndex === idx
											? isDark
												? 'w-7 bg-amber-400'
												: 'w-7 bg-primary'
											: isDark
												? 'w-2 bg-gray-700 hover:bg-gray-600'
												: 'w-2 bg-border hover:bg-muted-foreground/50',
									)}
								/>
							))}
						</div>
					)}
				</div>
			) : (
				<div className={gridColClasses}>
					{reviews.map((rev, idx) => (
						<SocialProofCard
							key={rev._key || idx}
							review={rev}
							isDark={isDark}
							cardElevation={cardElevation}
							className="h-full"
							dataSanity={rev._key ? sanityAttrMap?.[rev._key] : undefined}
							onPlayVideo={setActiveVideoUrl}
						/>
					))}
				</div>
			)}

			{/* UGC Review Video Lightbox Modal */}
			<ReviewVideoLightbox
				isOpen={Boolean(activeVideoUrl)}
				videoUrl={activeVideoUrl}
				onClose={() => setActiveVideoUrl(null)}
			/>
		</>
	)
}
