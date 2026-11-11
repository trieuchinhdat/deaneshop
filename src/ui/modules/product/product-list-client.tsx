'use client'

import { parseAsString, useQueryState } from 'nuqs'
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import Swal from 'sweetalert2'
import { Autoplay, Grid, Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/grid'
import {
	FiAlertCircle,
	FiChevronDown,
	FiChevronLeft,
	FiChevronRight,
	FiFilter,
	FiLoader,
	FiPause,
	FiPlay,
	FiRotateCcw,
} from 'react-icons/fi'
import { getProductPricing } from '@/lib/product-pricing'
import ProductCard, { type Product } from './product-card'
import QuickViewModal from './quick-view-modal'

export type { Product } from './product-card'

// 2. Sort Options
const SORT_OPTIONS = [
	{ value: 'default', label: 'Default' },
	{ value: 'newest', label: 'Newest Arrivals' },
	{ value: 'price_asc', label: 'Price: Low to High' },
	{ value: 'price_desc', label: 'Price: High to Low' },
	{ value: 'title_asc', label: 'Alphabetical: A-Z' },
	{ value: 'title_desc', label: 'Alphabetical: Z-A' },
]

export type ProductListClientProps = {
	products: Product[] | undefined
	collectionId?: string
	initialTotalCount?: number
	initialCategories?: Array<{ title: string; slug: string; count?: number }>
	layout?: string
	columnsDesktop?: number
	columnsMobile?: number
	itemsPerPage?: number
	rowsDesktop?: number
	rowsMobile?: number
	autoSlide?: boolean
	autoSlideInterval?: number
	enableFilter?: boolean
	enableSort?: boolean
	defaultSort?: string
	productSettings?: any
}

function ProductListClientContent({
	products: initialProducts = [],
	collectionId,
	initialTotalCount,
	initialCategories = [],
	layout = 'grid',
	columnsDesktop = 4,
	columnsMobile = 2,
	itemsPerPage = 8,
	rowsDesktop = 1,
	rowsMobile = 1,
	autoSlide = false,
	autoSlideInterval = 5,
	enableFilter = false,
	enableSort = false,
	defaultSort = 'default',
	productSettings,
}: ProductListClientProps) {
	const [urlCategory, setUrlCategory] = useQueryState(
		'category',
		parseAsString.withOptions({ shallow: true }),
	)
	const [urlSort, setUrlSort] = useQueryState(
		'sort',
		parseAsString.withDefault(defaultSort).withOptions({ shallow: true }),
	)
	const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

	// Determine effective filter and sort values
	const activeCategory = enableFilter ? urlCategory : null
	const activeSort = urlSort || defaultSort

	// Server-side faceted pagination state
	const [displayProducts, setDisplayProducts] =
		useState<Product[]>(initialProducts)
	const [totalMatchingCount, setTotalMatchingCount] = useState<number>(
		initialTotalCount ?? initialProducts.length,
	)
	const [isLoadingFacet, setIsLoadingFacet] = useState(false)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [facetError, setFacetError] = useState<string | null>(null)

	// Ref to track if user has interacted with filters/sort
	const isMountedRef = useRef(false)
	const facetRequestRef = useRef(0)

	// Check if this collection requires server-side faceted fetching
	// (True if total catalog count exceeds initial products OR user is actively filtering/sorting)
	const isLargeCatalog =
		(initialTotalCount ?? initialProducts.length) > initialProducts.length

	// Swiper controls state
	const [swiperInstance, setSwiperInstance] = useState<any>(null)
	const [isBeginning, setIsBeginning] = useState(true)
	const [isEnd, setIsEnd] = useState(false)
	const [isAutoplayRunning, setIsAutoplayRunning] = useState(autoSlide)

	// Build Category Tabs: Prioritize initialCategories from server query
	const categoryTabs = useMemo(() => {
		if (initialCategories && initialCategories.length > 0) {
			return initialCategories
		}
		// Fallback: extract from initialProducts
		const map = new Map<
			string,
			{ title: string; slug: string; count: number }
		>()
		initialProducts.forEach((p) => {
			if (Array.isArray(p.categories)) {
				p.categories.forEach((cat) => {
					const slug =
						typeof cat.slug === 'string' ? cat.slug : (cat.slug as any)?.current
					if (slug && cat.title) {
						if (!map.has(slug)) {
							map.set(slug, { title: cat.title, slug, count: 0 })
						}
						map.get(slug)!.count += 1
					}
				})
			}
		})
		return Array.from(map.values())
	}, [initialCategories, initialProducts])

	// Fetch Faceted Products from Server API
	const fetchFacetedProducts = useCallback(
		async (cat: string | null, srt: string, offset = 0, append = false) => {
			const requestId = ++facetRequestRef.current
			try {
				if (append) {
					setIsLoadingMore(true)
				} else {
					setIsLoadingFacet(true)
				}
				setFacetError(null)

				const queryParams = new URLSearchParams()
				if (collectionId) queryParams.set('collectionId', collectionId)
				if (cat) queryParams.set('category', cat)
				if (srt && srt !== 'default') queryParams.set('sort', srt)
				queryParams.set('offset', String(offset))
				queryParams.set('limit', String(itemsPerPage))

				const res = await fetch(
					`/api/products/showcase?${queryParams.toString()}`,
				)
				if (!res.ok) {
					throw new Error(`Failed to query showcase products (${res.status})`)
				}

				const data = await res.json()
				if (requestId !== facetRequestRef.current) return
				const newProducts: Product[] = data.products || []
				const newTotal: number =
					typeof data.total === 'number' ? data.total : newProducts.length

				setTotalMatchingCount(newTotal)
				if (append) {
					setDisplayProducts((prev) => [...prev, ...newProducts])
				} else {
					setDisplayProducts(newProducts)
				}
			} catch (err: any) {
				if (requestId !== facetRequestRef.current) return
				console.error('[Showcase Fetch Error]:', err)
				setFacetError(
					err?.message || 'Failed to load products. Please try again.',
				)
			} finally {
				if (requestId === facetRequestRef.current) {
					setIsLoadingFacet(false)
					setIsLoadingMore(false)
				}
			}
		},
		[collectionId, itemsPerPage],
	)

	// Trigger faceted query when activeCategory or activeSort changes
	useEffect(() => {
		// On initial mount: if large catalog with active category in URL, fetch from server
		if (!isMountedRef.current) {
			isMountedRef.current = true
			if (activeCategory || (activeSort && activeSort !== 'default')) {
				fetchFacetedProducts(activeCategory, activeSort, 0, false)
			}
			return
		}

		// On subsequent user interactions:
		// If total products fits completely in initial batch and no collection pagination needed, filter in-memory
		if (!isLargeCatalog && !collectionId) {
			++facetRequestRef.current
			setIsLoadingFacet(false)
			setIsLoadingMore(false)
			setFacetError(null)
			let result = [...initialProducts]
			if (activeCategory) {
				result = result.filter((p) =>
					p.categories?.some((c: any) => {
						const slug = typeof c.slug === 'string' ? c.slug : c.slug?.current
						return slug === activeCategory
					}),
				)
			}
			if (activeSort === 'price_asc') {
				result.sort(
					(a, b) => getProductPricing(a).price - getProductPricing(b).price,
				)
			} else if (activeSort === 'price_desc') {
				result.sort(
					(a, b) => getProductPricing(b).price - getProductPricing(a).price,
				)
			} else if (activeSort === 'title_asc') {
				result.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
			} else if (activeSort === 'title_desc') {
				result.sort((a, b) => (b.title ?? '').localeCompare(a.title ?? ''))
			} else if (activeSort === 'newest') {
				result.sort((a, b) => {
					const dateA = new Date(a._createdAt || 0).getTime()
					const dateB = new Date(b._createdAt || 0).getTime()
					return dateB - dateA
				})
			}
			setDisplayProducts(result)
			setTotalMatchingCount(result.length)
			return
		}

		// Otherwise, perform server-side faceted query
		fetchFacetedProducts(activeCategory, activeSort, 0, false)
	}, [
		activeCategory,
		activeSort,
		isLargeCatalog,
		collectionId,
		initialProducts,
		fetchFacetedProducts,
	])

	// Handle Load More
	const handleLoadMore = () => {
		if (isLoadingMore || isLoadingFacet) return

		// If all products are already loaded in memory
		if (!isLargeCatalog && displayProducts.length >= totalMatchingCount) {
			return
		}

		// Fetch next page chunk from server
		fetchFacetedProducts(
			activeCategory,
			activeSort,
			displayProducts.length,
			true,
		)
	}

	const isFinished = displayProducts.length >= totalMatchingCount

	// Pause autoplay if user prefers reduced motion
	useEffect(() => {
		if (typeof window === 'undefined') return
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
		if (mediaQuery.matches && swiperInstance?.autoplay) {
			swiperInstance.autoplay.stop()
			setIsAutoplayRunning(false)
		}
	}, [swiperInstance])

	const toggleAutoplay = () => {
		if (!swiperInstance?.autoplay) return
		if (isAutoplayRunning) {
			swiperInstance.autoplay.stop()
			setIsAutoplayRunning(false)
		} else {
			swiperInstance.autoplay.start()
			setIsAutoplayRunning(true)
		}
	}

	const cssVars = {
		'--mobile-rows': rowsMobile ?? 1,
		'--desktop-rows': rowsDesktop ?? 1,
	} as React.CSSProperties

	// Grid layout classes based on columnsDesktop & columnsMobile
	const gridColsClass = useMemo(() => {
		const mobileClass = columnsMobile === 1 ? 'grid-cols-1' : 'grid-cols-2'
		let desktopClass = 'md:grid-cols-3 lg:grid-cols-4'
		if (columnsDesktop === 2) desktopClass = 'md:grid-cols-2 lg:grid-cols-2'
		else if (columnsDesktop === 3)
			desktopClass = 'md:grid-cols-3 lg:grid-cols-3'
		else if (columnsDesktop === 5)
			desktopClass = 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
		return `${mobileClass} ${desktopClass}`
	}, [columnsDesktop, columnsMobile])

	if (!initialProducts?.length && !displayProducts.length && !isLoadingFacet) {
		return (
			<div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
				<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
					No products available in this showcase.
				</p>
			</div>
		)
	}

	const showHeaderControls = enableFilter || enableSort

	return (
		<div className="space-y-6">
			{/* Top Filtering & Sorting Controls Bar */}
			{showHeaderControls && (
				<div className="flex flex-col gap-4 border-b border-gray-100 pb-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
					{/* Category Filter Tabs */}
					{enableFilter && categoryTabs.length > 0 ? (
						<nav
							role="tablist"
							aria-label="Category filter tabs"
							className="scrollbar-none flex items-center gap-1.5 overflow-x-auto pb-1"
						>
							<button
								type="button"
								role="tab"
								aria-selected={!activeCategory}
								aria-controls="product-grid-section"
								onClick={() => setUrlCategory(null)}
								className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
									!activeCategory
										? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
								}`}
							>
								<span>All Products</span>
								<span
									className={`py-0.2 rounded-full px-1.5 text-[10px] font-bold ${
										!activeCategory
											? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
											: 'bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
									}`}
								>
									{initialTotalCount ?? initialProducts.length}
								</span>
							</button>

							{categoryTabs.map((tab) => {
								const isActive = activeCategory === tab.slug
								return (
									<button
										key={tab.slug}
										type="button"
										role="tab"
										aria-selected={isActive}
										aria-controls="product-grid-section"
										onClick={() => setUrlCategory(tab.slug)}
										className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
											isActive
												? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
												: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
										}`}
									>
										<span>{tab.title}</span>
										{typeof tab.count === 'number' && (
											<span
												className={`py-0.2 rounded-full px-1.5 text-[10px] font-bold ${
													isActive
														? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
														: 'bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
												}`}
											>
												{tab.count}
											</span>
										)}
									</button>
								)
							})}
						</nav>
					) : (
						<div className="text-xs text-gray-500 dark:text-gray-400">
							Showing <strong>{displayProducts.length}</strong> of{' '}
							<strong>{totalMatchingCount}</strong> items
						</div>
					)}

					{/* Right Side: Sort Control & Active Filters */}
					<div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
						{/* Active category pill with clear option */}
						{activeCategory && (
							<button
								type="button"
								onClick={() => setUrlCategory(null)}
								className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
								title="Reset filter"
							>
								<FiRotateCcw className="h-3 w-3" />
								<span>Reset Filter</span>
							</button>
						)}

						{/* Sort Dropdown */}
						{enableSort && (
							<div className="flex items-center gap-2">
								<label
									htmlFor="product-sort-select"
									className="text-xs font-medium whitespace-nowrap text-gray-600 dark:text-gray-300"
								>
									Sort by:
								</label>
								<div className="relative">
									<select
										id="product-sort-select"
										value={activeSort}
										onChange={(e) => setUrlSort(e.target.value)}
										className="appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pr-8 pl-3 text-xs font-semibold text-gray-800 shadow-2xs transition-colors focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
									>
										{SORT_OPTIONS.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
									<FiChevronDown
										className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500"
										aria-hidden="true"
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Error State Banner */}
			{facetError && (
				<div
					role="alert"
					className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
				>
					<div className="flex items-center gap-2">
						<FiAlertCircle className="h-4 w-4 shrink-0" />
						<span>{facetError}</span>
					</div>
					<button
						type="button"
						onClick={() =>
							fetchFacetedProducts(activeCategory, activeSort, 0, false)
						}
						className="rounded-md bg-red-100 px-2.5 py-1 font-bold hover:bg-red-200 dark:bg-red-900/60"
					>
						Retry
					</button>
				</div>
			)}

			{/* Products Section with Loading Overlay */}
			<div id="product-grid-section" aria-live="polite" className="relative">
				{isLoadingFacet ? (
					/* Faceted Search Loading Skeleton */
					<div
						className={`grid gap-3 sm:gap-4 lg:gap-5 ${gridColsClass}`}
						aria-hidden="true"
					>
						{[...Array(columnsDesktop * 2)].map((_, i) => (
							<div
								key={i}
								className="flex flex-col space-y-3 rounded-xl border border-gray-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
							>
								<div className="aspect-square w-full animate-pulse rounded-lg bg-gray-200 dark:bg-slate-800" />
								<div className="h-4 w-3/4 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
								<div className="h-3 w-1/2 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
								<div className="h-4 w-1/3 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
							</div>
						))}
					</div>
				) : displayProducts.length === 0 ? (
					/* Empty State when filtering returns no results */
					<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-14 text-center dark:border-slate-800 dark:bg-slate-900/40">
						<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-gray-300">
							<FiFilter className="size-5" />
						</div>
						<h3 className="text-base font-bold text-gray-900 dark:text-white">
							No products found
						</h3>
						<p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
							We couldn't find any items matching your selected category. Try
							selecting another filter or viewing all products.
						</p>
						{activeCategory && (
							<button
								type="button"
								onClick={() => setUrlCategory(null)}
								className="mt-4 cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
							>
								View All Products
							</button>
						)}
					</div>
				) : layout === 'carousel' ? (
					/* --- CAROUSEL VIEW --- */
					<div
						className="group/carousel carousel-list-product relative"
						style={cssVars}
					>
						<Swiper
							modules={[Navigation, Grid, Autoplay]}
							spaceBetween={12}
							slidesPerView={2}
							grid={{ rows: rowsMobile ?? 1, fill: 'row' }}
							autoplay={
								autoSlide
									? {
											delay: autoSlideInterval * 1000,
											disableOnInteraction: false,
											pauseOnMouseEnter: true,
										}
									: false
							}
							breakpoints={{
								0: {
									slidesPerView: 2,
									spaceBetween: 10,
									grid: { rows: rowsMobile ?? 1, fill: 'row' },
								},
								640: {
									slidesPerView: 3,
									spaceBetween: 14,
									grid: { rows: rowsDesktop ?? 1, fill: 'row' },
								},
								1024: {
									slidesPerView: 4,
									spaceBetween: 16,
									grid: { rows: rowsDesktop ?? 1, fill: 'row' },
								},
							}}
							onSwiper={(swiper) => {
								setSwiperInstance(swiper)
								setIsBeginning(swiper.isBeginning)
								setIsEnd(swiper.isEnd)
							}}
							onSlideChange={(swiper) => {
								setIsBeginning(swiper.isBeginning)
								setIsEnd(swiper.isEnd)
							}}
							className="!px-0.5 !pt-0.5 !pb-1"
						>
							{displayProducts.map((product) => (
								<SwiperSlide key={product._id} className="!h-auto">
									<ProductCard
										product={product}
										productSettings={productSettings}
										onOpenQuickView={(p) => setQuickViewProduct(p)}
									/>
								</SwiperSlide>
							))}
						</Swiper>

						{/* Custom Accessible Navigation Bar */}
						<div className="mt-4 flex items-center justify-between pt-2">
							<div className="text-xs text-gray-500 dark:text-gray-400">
								<span>
									Showing <strong>{displayProducts.length}</strong> items in
									carousel
								</span>
							</div>

							<div className="flex items-center gap-2">
								{/* Autoplay Pause/Play Toggle Button (WCAG 2.2 Criterion 2.2.2) */}
								{autoSlide && (
									<button
										type="button"
										onClick={toggleAutoplay}
										aria-label={
											isAutoplayRunning
												? 'Pause automated slideshow'
												: 'Play automated slideshow'
										}
										className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-2xs transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
										title={
											isAutoplayRunning ? 'Pause Autoplay' : 'Resume Autoplay'
										}
									>
										{isAutoplayRunning ? (
											<FiPause className="size-3.5" />
										) : (
											<FiPlay className="size-3.5 translate-x-0.5" />
										)}
									</button>
								)}

								{/* Prev Slide Button */}
								<button
									type="button"
									onClick={() => swiperInstance?.slidePrev()}
									disabled={isBeginning}
									aria-label="Previous products"
									className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-2xs transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
								>
									<FiChevronLeft className="size-4" />
								</button>

								{/* Next Slide Button */}
								<button
									type="button"
									onClick={() => swiperInstance?.slideNext()}
									disabled={isEnd}
									aria-label="Next products"
									className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-2xs transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
								>
									<FiChevronRight className="size-4" />
								</button>
							</div>
						</div>
					</div>
				) : (
					/* --- GRID VIEW --- */
					<div className="grid-list-product space-y-6">
						<div className={`grid gap-3 sm:gap-4 lg:gap-5 ${gridColsClass}`}>
							{displayProducts.map((product) => (
								<div key={product._id} className="h-full">
									<ProductCard
										product={product}
										productSettings={productSettings}
										onOpenQuickView={(p) => setQuickViewProduct(p)}
									/>
								</div>
							))}
						</div>

						{/* Load More Button */}
						{!isFinished && (
							<div className="flex flex-col items-center justify-center gap-2 pt-2">
								<button
									type="button"
									onClick={handleLoadMore}
									disabled={isLoadingMore}
									className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3 text-xs font-bold text-gray-900 shadow-xs transition hover:border-slate-900 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
								>
									{isLoadingMore ? (
										<>
											<FiLoader className="h-3.5 w-3.5 animate-spin text-slate-700 dark:text-slate-200" />
											<span>Loading Products...</span>
										</>
									) : (
										<span>
											Load More Products (
											{totalMatchingCount - displayProducts.length} remaining)
										</span>
									)}
								</button>
								<span className="text-[11px] text-gray-500 dark:text-gray-400">
									Showing {displayProducts.length} of {totalMatchingCount}
								</span>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Quick View Modal Popup */}
			<QuickViewModal
				isOpen={Boolean(quickViewProduct)}
				product={quickViewProduct}
				productSettings={productSettings}
				onClose={() => setQuickViewProduct(null)}
			/>
		</div>
	)
}

export default function ProductListClient(props: ProductListClientProps) {
	return (
		<Suspense fallback={null}>
			<ProductListClientContent {...props} />
		</Suspense>
	)
}

export { ProductCard } from './product-card'
