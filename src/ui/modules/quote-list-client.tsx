'use client'

import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
} from 'react'
import { cn } from '@/lib/utils'
import ReviewVideoLightbox from '@/ui/modules/product/review-video-lightbox'
import QuoteCard, { type QuoteItemData } from './quote-card'
import styles from './quote-list.module.css'

interface QuoteListClientProps {
	testimonials: QuoteItemData[]
	layout?: 'masonry' | 'grid' | 'carousel' | 'marquee'
	columns?: 2 | 3 | 4
	mobileLayout?: 'carousel' | 'stack'
	cardStyle?: 'bordered' | 'elevated' | 'minimal' | 'glass'
	showRating?: boolean
	showVerifiedBadge?: boolean
	showQuoteIcon?: boolean
	showMediaLogo?: boolean
	enableCategoryFilter?: boolean
	sanityAttrMap?: Record<string, string>
	anchorKey?: string
}

const CATEGORY_LABELS: Record<string, string> = {
	all: 'All Endorsements',
	video: 'Video Stories',
	customer: 'Verified Buyers',
	press: 'Press & Media',
	expert: 'Industry Experts',
	partner: 'Brand Partners',
}

export default function QuoteListClient({
	testimonials = [],
	layout = 'masonry',
	columns = 3,
	mobileLayout = 'carousel',
	cardStyle = 'bordered',
	showRating = true,
	showVerifiedBadge = true,
	showQuoteIcon = true,
	showMediaLogo = true,
	enableCategoryFilter = false,
	sanityAttrMap,
	anchorKey,
}: QuoteListClientProps) {
	const carouselId = useId()
	const [activeCategory, setActiveCategory] = useState<string>('all')
	const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)

	// Carousel navigation state
	const scrollRef = useRef<HTMLDivElement>(null)
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(true)
	const [activeIndex, setActiveIndex] = useState(0)

	// Available filter categories computed dynamically from items
	const availableCategories = useMemo(() => {
		const cats = new Set<string>()
		let hasVideos = false
		testimonials.forEach((item) => {
			if (item.videoUrl) hasVideos = true
			if (item.endorsementType) {
				cats.add(item.endorsementType)
			}
		})
		const result = ['all']
		if (hasVideos) result.push('video')
		return [...result, ...Array.from(cats)]
	}, [testimonials])

	// Filtered list
	const filteredTestimonials = useMemo(() => {
		if (!enableCategoryFilter || activeCategory === 'all') {
			return testimonials
		}
		if (activeCategory === 'video') {
			return testimonials.filter((item) => Boolean(item.videoUrl))
		}
		return testimonials.filter(
			(item) => item.endorsementType === activeCategory,
		)
	}, [testimonials, activeCategory, enableCategoryFilter])

	// Carousel bounds checking
	const checkScrollBounds = useCallback(() => {
		const el = scrollRef.current
		if (!el) return
		const tolerance = 6
		const atLeft = el.scrollLeft <= tolerance
		const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance

		setCanScrollLeft(!atLeft)
		setCanScrollRight(!atRight)

		// Calculate active dot index
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
		const el = scrollRef.current
		if (!el) return

		checkScrollBounds()
		el.addEventListener('scroll', checkScrollBounds, { passive: true })
		window.addEventListener('resize', checkScrollBounds)

		return () => {
			el.removeEventListener('scroll', checkScrollBounds)
			window.removeEventListener('resize', checkScrollBounds)
		}
	}, [checkScrollBounds, filteredTestimonials])

	const scrollPrev = () => {
		const el = scrollRef.current
		if (!el) return
		const scrollDistance = Math.max(el.clientWidth * 0.75, 290)
		el.scrollBy({ left: -scrollDistance, behavior: 'smooth' })
	}

	const scrollNext = () => {
		const el = scrollRef.current
		if (!el) return
		const scrollDistance = Math.max(el.clientWidth * 0.75, 290)
		el.scrollBy({ left: scrollDistance, behavior: 'smooth' })
	}

	const scrollToSlide = (idx: number) => {
		const el = scrollRef.current
		if (!el) return
		const targetChild = el.children[idx] as HTMLElement | undefined
		if (targetChild) {
			targetChild.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: 'center',
			})
		}
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

	// Desktop column class resolution
	const columnClass = {
		2: 'sm:columns-2 lg:columns-2',
		3: 'sm:columns-2 lg:columns-3',
		4: 'sm:columns-2 lg:columns-3 xl:columns-4',
	}[columns]

	const gridColumnClass = {
		2: 'sm:grid-cols-2',
		3: 'sm:grid-cols-2 lg:grid-cols-3',
		4: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
	}[columns]

	const isCarousel = layout === 'carousel'
	const isMarquee = layout === 'marquee'
	const isGrid = layout === 'grid'
	const isMasonry = layout === 'masonry'

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			{/* Category Filter Tabs */}
			{enableCategoryFilter && availableCategories.length > 2 && (
				<nav
					aria-label="Testimonial categories"
					className="flex flex-wrap items-center justify-center gap-2 pb-2"
				>
					{availableCategories.map((cat) => {
						const isActive = activeCategory === cat
						const count =
							cat === 'all'
								? testimonials.length
								: testimonials.filter((i) => i.endorsementType === cat).length

						return (
							<button
								key={cat}
								type="button"
								onClick={() => setActiveCategory(cat)}
								aria-pressed={isActive}
								className={cn(
									'focus-visible:ring-primary inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:outline-hidden',
									isActive
										? 'bg-primary text-primary-foreground shadow-xs'
										: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
								)}
							>
								<span>{CATEGORY_LABELS[cat] || cat}</span>
								<span
									className={cn(
										'py-0.2 rounded-full px-1.5 text-[10px] font-bold',
										isActive
											? 'bg-primary-foreground/20 text-primary-foreground'
											: 'bg-foreground/10 text-muted-foreground',
									)}
								>
									{count}
								</span>
							</button>
						)
					})}
				</nav>
			)}

			{/* Empty Filtered State */}
			{filteredTestimonials.length === 0 && (
				<div className="border-border/80 bg-muted/20 rounded-2xl border border-dashed py-12 text-center">
					<p className="text-muted-foreground text-sm font-medium">
						No testimonials found in this category.
					</p>
				</div>
			)}

			{/* 1. CONTINUOUS MARQUEE TICKER LAYOUT */}
			{isMarquee && filteredTestimonials.length > 0 && (
				<div
					className={styles.marqueeWrapper}
					role="region"
					aria-label="Continuous testimonials ticker"
					tabIndex={0}
				>
					<div className={styles.marqueeTrack}>
						{/* Group 1 */}
						<div className={styles.marqueeGroup}>
							{filteredTestimonials.map((item, idx) => (
								<QuoteCard
									key={item._key || `marquee-1-${idx}`}
									testimonial={item}
									cardStyle={cardStyle}
									showRating={showRating}
									showVerifiedBadge={showVerifiedBadge}
									showQuoteIcon={showQuoteIcon}
									showMediaLogo={showMediaLogo}
									onPlayVideo={(url) => setActiveVideoUrl(url)}
									className="w-[320px] shrink-0 sm:w-[380px]"
								/>
							))}
						</div>

						{/* Group 2 (Duplicate loop for seamless infinite scroll) */}
						<div
							className={styles.marqueeGroup}
							data-duplicate="true"
							aria-hidden="true"
						>
							{filteredTestimonials.map((item, idx) => (
								<QuoteCard
									key={`marquee-dup-${item._key || idx}`}
									testimonial={item}
									cardStyle={cardStyle}
									showRating={showRating}
									showVerifiedBadge={showVerifiedBadge}
									showQuoteIcon={showQuoteIcon}
									showMediaLogo={showMediaLogo}
									onPlayVideo={(url) => setActiveVideoUrl(url)}
									className="w-[320px] shrink-0 sm:w-[380px]"
								/>
							))}
						</div>
					</div>
				</div>
			)}

			{/* 2. INTERACTIVE CAROUSEL LAYOUT */}
			{isCarousel && filteredTestimonials.length > 0 && (
				<div className="relative flex flex-col gap-4">
					{/* Carousel Container */}
					<div
						ref={scrollRef}
						id={carouselId}
						role="region"
						aria-roledescription="carousel"
						aria-label="Customer testimonials"
						tabIndex={0}
						onKeyDown={handleKeyDown}
						className="no-scrollbar focus-visible:ring-primary flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth rounded-xl pt-1 pb-4 focus-visible:ring-2 focus-visible:outline-hidden"
					>
						{filteredTestimonials.map((item, idx) => {
							const cardSanity = item._key
								? sanityAttrMap?.[item._key]
								: undefined

							return (
								<div
									key={item._key || `carousel-${idx}`}
									className="w-[85vw] max-w-[340px] shrink-0 snap-center sm:max-w-[380px] md:max-w-[420px]"
									role="group"
									aria-roledescription="slide"
									aria-label={`${idx + 1} of ${filteredTestimonials.length}`}
								>
									<QuoteCard
										testimonial={item}
										cardStyle={cardStyle}
										showRating={showRating}
										showVerifiedBadge={showVerifiedBadge}
										showQuoteIcon={showQuoteIcon}
										showMediaLogo={showMediaLogo}
										onPlayVideo={(url) => setActiveVideoUrl(url)}
										dataSanity={cardSanity}
										className="h-full"
									/>
								</div>
							)
						})}
					</div>

					{/* Navigation Controls: Arrows and Indicator Dots */}
					<div className="flex items-center justify-between pt-2">
						{/* Indicator Dots */}
						<div
							className="flex items-center gap-1.5"
							role="tablist"
							aria-label="Testimonial slides"
						>
							{filteredTestimonials.map((_, dotIdx) => (
								<button
									key={dotIdx}
									type="button"
									onClick={() => scrollToSlide(dotIdx)}
									role="tab"
									aria-selected={activeIndex === dotIdx}
									aria-label={`Go to testimonial ${dotIdx + 1}`}
									className={cn(
										'focus-visible:ring-primary h-2 cursor-pointer rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:outline-hidden',
										activeIndex === dotIdx
											? 'bg-primary w-6'
											: 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2',
									)}
								/>
							))}
						</div>

						{/* Prev / Next Circular Arrow Buttons */}
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={scrollPrev}
								disabled={!canScrollLeft}
								aria-label="Previous testimonials"
								aria-controls={carouselId}
								className="border-border/80 bg-background text-foreground hover:bg-muted hover:border-border focus-visible:ring-primary flex size-9 cursor-pointer items-center justify-center rounded-full border shadow-2xs transition-all focus-visible:ring-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-30"
							>
								<ChevronLeft className="size-4" aria-hidden="true" />
							</button>

							<button
								type="button"
								onClick={scrollNext}
								disabled={!canScrollRight}
								aria-label="Next testimonials"
								aria-controls={carouselId}
								className="border-border/80 bg-background text-foreground hover:bg-muted hover:border-border focus-visible:ring-primary flex size-9 cursor-pointer items-center justify-center rounded-full border shadow-2xs transition-all focus-visible:ring-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-30"
							>
								<ChevronRight className="size-4" aria-hidden="true" />
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 3. WALL OF LOVE MASONRY LAYOUT */}
			{isMasonry && filteredTestimonials.length > 0 && (
				<div
					className={cn(
						'w-full',
						// Mobile carousel fallback if selected
						mobileLayout === 'carousel'
							? 'max-md:full-bleed no-scrollbar max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-6 max-md:overflow-x-auto max-md:px-4 max-md:pb-4'
							: 'max-md:flex max-md:flex-col max-md:gap-6',
						'md:block',
						styles.masonryColumns,
						columnClass,
					)}
					data-anchor-name={anchorKey}
				>
					{filteredTestimonials.map((item, idx) => {
						const cardSanity = item._key
							? sanityAttrMap?.[item._key]
							: undefined

						return (
							<div
								key={item._key || `masonry-${idx}`}
								className={cn(
									mobileLayout === 'carousel'
										? 'max-md:w-[85vw] max-md:max-w-[340px] max-md:shrink-0 max-md:snap-center'
										: '',
									styles.masonryItem,
								)}
							>
								<QuoteCard
									testimonial={item}
									cardStyle={cardStyle}
									showRating={showRating}
									showVerifiedBadge={showVerifiedBadge}
									showQuoteIcon={showQuoteIcon}
									showMediaLogo={showMediaLogo}
									onPlayVideo={(url) => setActiveVideoUrl(url)}
									dataSanity={cardSanity}
								/>
							</div>
						)
					})}
				</div>
			)}

			{/* 4. UNIFORM GRID LAYOUT */}
			{isGrid && filteredTestimonials.length > 0 && (
				<div
					className={cn(
						// Mobile carousel fallback if selected
						mobileLayout === 'carousel'
							? 'max-md:full-bleed no-scrollbar max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-6 max-md:overflow-x-auto max-md:px-4 max-md:pb-4'
							: 'max-md:flex max-md:flex-col max-md:gap-6',
						'md:grid md:gap-6',
						gridColumnClass,
					)}
					data-anchor-name={anchorKey}
				>
					{filteredTestimonials.map((item, idx) => {
						const cardSanity = item._key
							? sanityAttrMap?.[item._key]
							: undefined

						return (
							<div
								key={item._key || `grid-${idx}`}
								className={cn(
									mobileLayout === 'carousel'
										? 'max-md:w-[85vw] max-md:max-w-[340px] max-md:shrink-0 max-md:snap-center'
										: '',
									'h-full',
								)}
							>
								<QuoteCard
									testimonial={item}
									cardStyle={cardStyle}
									showRating={showRating}
									showVerifiedBadge={showVerifiedBadge}
									showQuoteIcon={showQuoteIcon}
									showMediaLogo={showMediaLogo}
									onPlayVideo={(url) => setActiveVideoUrl(url)}
									dataSanity={cardSanity}
									className="h-full"
								/>
							</div>
						)
					})}
				</div>
			)}

			{/* Lightbox Video Player */}
			<ReviewVideoLightbox
				isOpen={Boolean(activeVideoUrl)}
				videoUrl={activeVideoUrl}
				onClose={() => setActiveVideoUrl(null)}
			/>
		</div>
	)
}
