'use client'

import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { useEffect, useMemo, useState, Suspense } from 'react'
import Swal from 'sweetalert2'
import { Autoplay, Grid, Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import { ROUTES } from '@/lib/env'
import { formatVND } from '@/lib/utils'
import { useCartStore } from '@/store/use-cart-store'
import { showWishlistToast, useWishlistStore } from '@/store/use-wishlist-store'
import ResponsiveImage from '@/ui/responsiveImage'
import { parseVideoMedia } from '@/ui/img'
import QuickViewModal from './quick-view-modal'

function getHoverMediaItem(images: any[] | undefined, mainImage: any): any | null {
	if (!Array.isArray(images) || images.length < 2) return null

	for (let i = 1; i < images.length; i++) {
		const item = images[i]
		if (!item || item === mainImage) continue

		const videoMedia = parseVideoMedia(item)

		// 1. Bỏ qua hoàn toàn nếu là Video dạng Link (YouTube / TikTok / Vimeo / embed url)
		if (videoMedia?.type === 'videoUrl' || item._type === 'videoUrl' || item.videoUrl) {
			continue
		}

		// 2. Chấp nhận nếu là File Video tải lên (MP4/WebM)
		if (videoMedia?.type === 'video' || item._type === 'video') {
			return item
		}

		// 3. Chấp nhận nếu là Ảnh tiêu chuẩn
		if (item._type === 'image' || item.asset || typeof item === 'string') {
			return item
		}
	}

	return null
}

// 1. Định nghĩa Type Product
export type Product = {
	_id: string
	title: string
	slug: string
	price: number
	compareAtPrice?: number
	images?: any[]
	categories?: { title?: string; slug: string }[]
	_createdAt?: string
	reviews?: any[]
	sold?: number
	stock?: number
	hasVariants?: boolean
	options?: Array<{ name: string; values: string[] }>
	variants?: Array<{
		_key?: string
		sku?: string
		title?: string
		price?: number
		compareAtPrice?: number
		stock?: number
		image?: any
		options?: Array<{ name?: string; value?: string }>
	}>
}

const formatSold = (sold?: number) => {
	if (typeof sold !== 'number' || sold <= 0) return null
	if (sold >= 1000) {
		const formatted = (sold / 1000).toFixed(1).replace(/\.0$/, '')
		return `${formatted}k+ sold`
	}
	return `${sold} sold`
}

const COLOR_MAP: Record<string, string> = {
	đỏ: '#ef4444',
	red: '#ef4444',
	xanh: '#3b82f6',
	blue: '#3b82f6',
	'xanh lá': '#22c55e',
	green: '#22c55e',
	'xanh dương': '#2563eb',
	'xanh ngọc': '#14b8a6',
	đen: '#18181b',
	black: '#18181b',
	trắng: '#ffffff',
	white: '#ffffff',
	vàng: '#eab308',
	yellow: '#eab308',
	hồng: '#ec4899',
	pink: '#ec4899',
	cam: '#f97316',
	orange: '#f97316',
	xám: '#6b7280',
	grey: '#6b7280',
	gray: '#6b7280',
	tím: '#a855f7',
	purple: '#a855f7',
	nâu: '#78350f',
	brown: '#78350f',
	kem: '#fef3c7',
	beige: '#fef3c7',
}

function getColorCode(colorName?: string): string {
	if (!colorName) return '#d1d5db'
	const nameLower = colorName.toLowerCase().trim()
	for (const [key, code] of Object.entries(COLOR_MAP)) {
		if (nameLower.includes(key)) return code
	}
	return '#9ca3af'
}

// 2. Options Sắp xếp
const SORT_OPTIONS = [
	{ value: 'default', label: 'Mặc định' },
	{ value: 'price_asc', label: 'Giá: Thấp đến Cao' },
	{ value: 'price_desc', label: 'Giá: Cao đến Thấp' },
	{ value: 'title_asc', label: 'Tên: A-Z' },
	{ value: 'title_desc', label: 'Tên: Z-A' },
]

type ProductListClientProps = {
	products: any[] | undefined
	layout: string
	itemsPerPage?: number
	rowsDesktop: number
	rowsMobile: number
	autoSlide: boolean
	enableFilter: boolean
	productSettings?: any
}

function ProductListClientContent({
	products,
	layout,
	itemsPerPage = 4,
	rowsDesktop,
	rowsMobile,
	autoSlide = false,
	enableFilter = false,
	productSettings,
}: ProductListClientProps) {
	// 3. Vẫn gọi Hooks (Bắt buộc phải gọi ở top-level, không được đưa vào if)
	const [urlCategory] = useQueryState('category')
	const [urlSort, setUrlSort] = useQueryState('sort', {
		defaultValue: 'default',
	})
	const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

	// 4. LOGIC QUAN TRỌNG: Quyết định giá trị sử dụng dựa trên enableFilter
	// Nếu enableFilter tắt, ta bỏ qua giá trị từ URL và dùng mặc định
	const activeCategory = enableFilter ? urlCategory : null
	const activeSort = enableFilter ? urlSort : 'default'

	// 5. Logic Xử lý dữ liệu
	const processedProducts = useMemo(() => {
		if (!products) return []

		// A. Filter (Dùng activeCategory)
		let result = products.filter((product) => {
			if (!activeCategory) return true
			return product.categories?.some((c: any) => {
				const categorySlug = typeof c.slug === 'string' ? c.slug : c.slug?.current
				return categorySlug === activeCategory
			})
		})

		// B. Sort (Dùng activeSort)
		switch (activeSort) {
			case 'price_asc':
				result = [...result].sort((a, b) => a.price - b.price)
				break
			case 'price_desc':
				result = [...result].sort((a, b) => b.price - a.price)
				break
			case 'title_asc':
				result = [...result].sort((a, b) => a.title.localeCompare(b.title))
				break
			case 'title_desc':
				result = [...result].sort((a, b) => b.title.localeCompare(a.title))
				break
			case 'newest':
				result = [...result].sort((a, b) => {
					const dateA = new Date(a._createdAt || 0).getTime()
					const dateB = new Date(b._createdAt || 0).getTime()
					return dateB - dateA
				})
				break
			default:
				break
		}

		return result
	}, [products, activeCategory, activeSort]) // Dependency thay đổi theo biến đã qua xử lý

	if (!products?.length) return null

	// 6. Pagination Logic (Load More)
	const [visibleCount, setVisibleCount] = useState(itemsPerPage)

	useEffect(() => {
		setVisibleCount(itemsPerPage)
	}, [itemsPerPage, activeCategory, activeSort])

	const visibleProducts = useMemo(() => {
		return processedProducts.slice(0, visibleCount)
	}, [processedProducts, visibleCount])

	const handleLoadMore = () => {
		setVisibleCount((prev: number) => prev + itemsPerPage)
	}

	const isFinished = visibleCount >= processedProducts.length

	const cssVars = {
		'--mobile-rows': rowsMobile ?? 1,
		'--desktop-rows': rowsDesktop ?? 1,
	} as React.CSSProperties

	return (
		<div className="space-y-6">
			{/* Chỉ hiển thị UI Filter/Sort khi enableFilter = true */}
			{enableFilter && (
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="text-sm">
						Hiển thị <strong>{visibleProducts.length}</strong> of{' '}
						<strong>{processedProducts.length}</strong> sản phẩm
					</div>

					<div className="flex items-center gap-2">
						<label htmlFor="sort-select" className="text-sm whitespace-nowrap">
							Sắp xếp:
						</label>
						<div className="relative">
							<select
								id="sort-select"
								// Dùng activeSort để hiển thị đúng giá trị
								value={activeSort || 'default'}
								// Gọi setUrlSort để cập nhật URL
								onChange={(e) => setUrlSort(e.target.value)}
								className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pr-8 pl-3 text-sm focus:border-black focus:outline-none"
							>
								{SORT_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
								<svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
									<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
								</svg>
							</div>
						</div>
					</div>
				</div>
			)}

			{processedProducts.length === 0 ? (
				<div className="py-12 text-center">
					<p className="text-gray-500">Không tìm thấy sản phẩm phù hợp.</p>
				</div>
			) : (
				<>
					{layout === 'carousel' ? (
						/* --- CAROUSEL VIEW --- */
						<div className="carousel-list-product" style={cssVars}>
							<Swiper
								modules={[Navigation, Grid, Autoplay]}
								navigation
								spaceBetween={8}
								slidesPerView={2}
								grid={{ rows: rowsMobile ?? 1, fill: 'row' }}
								autoplay={
									autoSlide
										? { delay: 3000, disableOnInteraction: false }
										: false
								}
								breakpoints={{
									0: {
										slidesPerView: 2,
										spaceBetween: 8,
										grid: { rows: rowsMobile ?? 1, fill: 'row' },
									},
									1024: {
										slidesPerView: 4,
										spaceBetween: 16,
										grid: { rows: rowsDesktop ?? 1, fill: 'row' },
									},
								}}
								className="!px-0.5 !pt-0.5"
							>
								{processedProducts.map((product) => (
									<SwiperSlide key={product._id} className="!h-auto">
										<ProductCard
											product={product}
											productSettings={productSettings}
											onOpenQuickView={(p) => setQuickViewProduct(p)}
										/>
									</SwiperSlide>
								))}
							</Swiper>
						</div>
					) : (
						/* --- GRID VIEW --- */
						<div className="grid-list-product space-y-4">
							<div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
								{visibleProducts.map((product) => (
									<div key={product._id} className="h-full">
										<ProductCard
											product={product}
											productSettings={productSettings}
											onOpenQuickView={(p) => setQuickViewProduct(p)}
										/>
									</div>
								))}
							</div>

							{!isFinished && (
								<div className="flex justify-center">
									<button
										onClick={handleLoadMore}
										className="rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-medium transition hover:bg-gray-50"
									>
										Xem thêm ({processedProducts.length - visibleCount} sản
										phẩm)
									</button>
								</div>
							)}
						</div>
					)}
				</>
			)}

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

export function ProductCard({
	product,
	productSettings,
	onOpenQuickView,
}: {
	product: Product
	productSettings?: any
	onOpenQuickView?: (product: Product) => void
}) {
	const [activeImage, setActiveImage] = useState<any>(null)
	const isWishlisted = useWishlistStore((s) => s.items.some((i) => i._id === product._id))
	const toggleWishlist = useWishlistStore((s) => s.toggleItem)
	const addItem = useCartStore((s) => s.addItem)

	const {
		cardShowCategory = true,
		cardShowRating = true,
		cardShowSoldCount = true,
		cardShowSecondaryImageHover = true,
		cardShowWishlist = true,
		cardQuickActionMode = 'quickAdd',
		cardQuickAddText = 'Thêm vào giỏ',
		cardShowDiscountBadge = true,
		cardDiscountStyle = 'percent',
		cardShowOutOfStock = true,
		cardShowColorSwatches = true,
		cardMaxColorSwatches = 4,
		cardContentAlignment = 'center',
		cardImageAspectRatio = '1:1',
	} = productSettings ?? {}

	const totalReviews = product.reviews?.length ?? 0
	const averageRating =
		totalReviews > 0
			? product.reviews!.reduce(
					(sum: number, r: any) => sum + (r.rating || 0),
					0,
				) / totalReviews
			: 0

	const soldText = formatSold(product.sold)
	const hasRating = cardShowRating && totalReviews > 0
	const hasSold = cardShowSoldCount && Boolean(soldText)

	// Tồn kho & Kiểm tra hết hàng
	const totalStock =
		typeof product.stock === 'number'
			? product.stock
			: (product.variants?.reduce(
					(sum: number, v: any) => sum + (v.stock ?? 0),
					0,
				) ?? 1)
	const isOutOfStock = cardShowOutOfStock && totalStock <= 0

	// Lấy biến thể đầu tiên
	const firstVariant =
		product.hasVariants ||
		(Array.isArray(product.variants) && product.variants.length > 0)
			? product.variants?.[0]
			: null

	const displayPrice =
		firstVariant && typeof firstVariant.price === 'number' && firstVariant.price > 0
			? firstVariant.price
			: product.price

	const displayCompareAtPrice =
		firstVariant &&
		typeof firstVariant.compareAtPrice === 'number' &&
		firstVariant.compareAtPrice > 0
			? firstVariant.compareAtPrice
			: product.compareAtPrice

	const hasSale = Boolean(
		cardShowDiscountBadge &&
			displayCompareAtPrice &&
			displayCompareAtPrice > displayPrice &&
			displayPrice > 0,
	)

	// Quản lý Ảnh đại diện & Media hover thứ 2 (Lọc bỏ Video Link, chỉ nhận Ảnh hoặc File Video MP4)
	const mainImage = activeImage || product.images?.[0]
	const secondaryImage = useMemo(
		() => getHoverMediaItem(product.images, mainImage),
		[product.images, mainImage],
	)

	// Trích xuất Swatch Màu sắc
	const colorSwatches = useMemo(() => {
		if (!cardShowColorSwatches || !product.variants?.length) return []
		const swatches: { name: string; color: string; image?: any }[] = []
		const seen = new Set<string>()

		for (const variant of product.variants) {
			const colorOption =
				variant.options?.find(
					(o: any) =>
						o.name?.toLowerCase().includes('màu') ||
						o.name?.toLowerCase().includes('color'),
				) ||
				(variant.title ? { value: variant.title.split('/')[0].trim() } : null)

			if (colorOption?.value && !seen.has(colorOption.value)) {
				seen.add(colorOption.value)
				const swatchImg =
					variant.image && (variant.image.asset || variant.image.url)
						? variant.image
						: null
				swatches.push({
					name: colorOption.value,
					color: getColorCode(colorOption.value),
					image: swatchImg,
				})
			}
		}
		return swatches
	}, [product.variants, product.images, cardShowColorSwatches])

	// Tỷ lệ khung hình Ảnh
	const aspectClass =
		cardImageAspectRatio === '3:4'
			? 'aspect-[3/4]'
			: cardImageAspectRatio === '4:3'
				? 'aspect-[4/3]'
				: 'aspect-square'

	// Căn chỉnh văn bản
	const alignClass =
		cardContentAlignment === 'left'
			? 'text-left items-start'
			: 'text-center items-center'

	const flexAlignClass =
		cardContentAlignment === 'left' ? 'justify-start' : 'justify-center'

	const handleQuickAddToCart = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		// Nếu sản phẩm có biến thể, mở Quick View để khách hàng chọn tùy chọn biến thể
		if ((product.hasVariants || Boolean(product.variants?.length)) && onOpenQuickView) {
			onOpenQuickView(product)
			return
		}

		const variantId = firstVariant?._key || firstVariant?.sku
		const cartItemId = variantId ? `${product._id}_${variantId}` : product._id || product.slug

		const itemImage = firstVariant?.image?.asset?.url
			? firstVariant.image.asset.url
			: product.images?.[0]?.asset?.url
				? product.images[0].asset.url
				: typeof product.images?.[0] === 'string'
					? product.images[0]
					: '/fallback-image.png'

		addItem({
			id: cartItemId,
			productId: product._id,
			productTitle: product.title,
			variantId,
			variantTitle: firstVariant?.title,
			sku: firstVariant?.sku || product.slug,
			title: product.title,
			price: displayPrice,
			compareAtPrice: displayCompareAtPrice,
			image: itemImage,
			quantity: 1,
			slug: product.slug,
			hasVariants:
				product.hasVariants || Boolean(product.variants?.length),
			options: product.options,
			variants: product.variants,
		})

		Swal.fire({
			toast: true,
			position: 'top-end',
			showConfirmButton: false,
			timer: 4000,
			timerProgressBar: false,
			customClass: {
				popup:
					'!p-3 !rounded-2xl !border !border-gray-200/90 !shadow-xl !bg-white !w-auto !min-w-[250px]',
				container: 'mt-20 md:mt-24 z-[999]',
			},
			html: `
				<div class="flex flex-col gap-3 p-1 font-sans text-left">
					<div class="flex items-center gap-2.5">
						<div class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
							<svg class="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
							</svg>
						</div>
						<span class="text-sm sm:text-base font-semibold text-gray-900 leading-none">Đã thêm vào giỏ hàng</span>
					</div>
					<a href="/checkout" class="flex h-10 w-full items-center justify-center rounded-xl bg-[#e8f2ff] hover:bg-[#d8e8ff] text-blue-600 font-bold text-sm transition no-underline shadow-2xs">
						Xem giỏ hàng
					</a>
				</div>
			`,
		})
	}

	return (
		<div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
			<Link href={`/${ROUTES.products}/${product.slug}`} className="block flex-1">
				{/* Image Container */}
				<div className={`relative ${aspectClass} overflow-hidden bg-gray-50`}>
					<ResponsiveImage
						className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
							isOutOfStock ? 'opacity-60 grayscale' : ''
						}`}
						image={mainImage}
						desktop={{ width: 600 }}
						mobile={{ width: 300 }}
					/>

					{/* Secondary Hover Image (Desktop Only) */}
					{cardShowSecondaryImageHover && secondaryImage && !activeImage && (
						<div className="hidden md:block absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
							<ResponsiveImage
								className={`h-full w-full object-cover ${
									isOutOfStock ? 'opacity-60 grayscale' : ''
								}`}
								image={secondaryImage}
								desktop={{ width: 600 }}
								mobile={{ width: 300 }}
							/>
						</div>
					)}

					{/* Out of Stock Overlay / Badge */}
					{isOutOfStock && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
							<span className="rounded-md bg-black/80 px-2.5 py-1 text-xs font-semibold tracking-wide text-white uppercase shadow">
								Hết hàng
							</span>
						</div>
					)}

					{/* Discount Badge */}
					{!isOutOfStock && hasSale && displayCompareAtPrice && (
						<span className="absolute top-2 left-2 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm lg:text-xs">
							{cardDiscountStyle === 'amount'
								? `- ${formatVND(displayCompareAtPrice - displayPrice)}`
								: `-${Math.round(
										((displayCompareAtPrice - displayPrice) /
											displayCompareAtPrice) *
											100,
									)}%`}
						</span>
					)}

					{/* Wishlist Button */}
					{cardShowWishlist && (
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								const isAdded = toggleWishlist(product._id)
								showWishlistToast(isAdded, product.title)
							}}
							className="absolute top-1.5 right-1.5 flex size-10 items-center justify-center rounded-full bg-white/90 text-gray-700 backdrop-blur-sm transition-transform hover:scale-110 hover:bg-white hover:text-red-500 shadow-sm cursor-pointer z-10"
							aria-label="Thêm vào yêu thích"
						>
							<svg
								className={`h-4 w-4 transition-colors duration-200 ${isWishlisted ? 'fill-red-500 text-red-500' : 'fill-none stroke-current stroke-2'}`}
								viewBox="0 0 24 24"
							>
								<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
							</svg>
						</button>
					)}

					{/* Quick Actions Hover Overlay Icons (When cardQuickActionMode === 'both') */}
					{cardQuickActionMode === 'both' && !isOutOfStock && (
						<div className="absolute inset-x-0 bottom-2 flex justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
							<button
								type="button"
								onClick={handleQuickAddToCart}
								className="flex size-10 items-center justify-center rounded-full bg-black text-white shadow-md transition-transform hover:scale-110 hover:bg-gray-800 cursor-pointer"
								title="Thêm nhanh vào giỏ"
								aria-label="Thêm nhanh vào giỏ"
							>
								<svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
									<path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
								</svg>
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									if (onOpenQuickView) {
										onOpenQuickView(product)
									} else {
										window.location.href = `/${ROUTES.products}/${product.slug}`
									}
								}}
								className="flex size-10 items-center justify-center rounded-full bg-white text-gray-800 shadow-md transition-transform hover:scale-110 hover:bg-gray-100 cursor-pointer"
								title="Xem nhanh sản phẩm"
								aria-label="Xem nhanh sản phẩm"
							>
								<svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
									<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							</button>
						</div>
					)}
				</div>

				{/* Card Body */}
				<div className={`flex flex-col p-3 ${alignClass}`}>
					{/* Category if enabled & available */}
					{cardShowCategory && product.categories?.[0]?.title && (
						<span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
							{product.categories[0].title}
						</span>
					)}

					<h3 className="line-clamp-2 text-xs font-semibold text-gray-900 lg:text-sm">
						{product.title}
					</h3>

					{/* Color Swatches */}
					{colorSwatches.length > 0 && (
						<div className={`mt-1.5 flex flex-wrap items-center gap-1.5 ${flexAlignClass}`}>
							{colorSwatches.slice(0, cardMaxColorSwatches).map((swatch, idx) => (
								<button
									key={idx}
									type="button"
									onMouseEnter={() => {
										if (swatch.image) setActiveImage(swatch.image)
									}}
									onMouseLeave={() => setActiveImage(null)}
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										if (swatch.image) setActiveImage(swatch.image)
									}}
									className="size-4 rounded-full border border-gray-300 shadow-xs transition-transform hover:scale-125 focus:outline-none cursor-pointer"
									style={{ backgroundColor: swatch.color }}
									title={swatch.name}
									aria-label={swatch.name}
								/>
							))}
							{colorSwatches.length > cardMaxColorSwatches && (
								<span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
									+{colorSwatches.length - cardMaxColorSwatches}
								</span>
							)}
						</div>
					)}

					{/* Rating & Sold count */}
					{(hasRating || hasSold) && (
						<div className={`mt-1.5 flex flex-wrap items-center gap-1 text-[11px] lg:text-xs ${flexAlignClass}`}>
							{hasRating && (
								<div className="flex items-center gap-0.5">
									<span className="font-semibold text-gray-800 dark:text-gray-200">
										{averageRating.toFixed(1)}
									</span>
									<span className="text-amber-500">★</span>
									<span className="text-gray-600 dark:text-gray-300">({totalReviews})</span>
								</div>
							)}

							{hasRating && hasSold && (
								<span className="text-gray-400">|</span>
							)}

							{hasSold && (
								<span className="text-gray-600 dark:text-gray-300 font-medium">{soldText}</span>
							)}
						</div>
					)}

					{/* Pricing */}
					<div className="mt-2">
						{hasSale && displayCompareAtPrice ? (
							<div className={`flex flex-wrap items-baseline gap-1.5 ${flexAlignClass}`}>
								<span className="text-sm font-bold text-red-600 lg:text-base">
									{formatVND(displayPrice)}
								</span>
								<span className="text-[10px] text-gray-600 dark:text-gray-400 line-through lg:text-xs">
									{formatVND(displayCompareAtPrice)}
								</span>
							</div>
						) : (
							<span className="text-sm font-semibold text-red-600 lg:text-base">
								{displayPrice === 0 ? 'Liên hệ' : formatVND(displayPrice)}
							</span>
						)}
					</div>
				</div>
			</Link>

			{/* Quick Add Button (Bottom Bar) */}
			{cardQuickActionMode === 'quickAdd' && !isOutOfStock && (
				<div className="p-3 pt-0">
					<button
						type="button"
						onClick={handleQuickAddToCart}
						className="w-full rounded-lg bg-gray-900 py-2 text-xs font-semibold text-white transition hover:bg-black active:scale-[0.98]"
					>
						{cardQuickAddText}
					</button>
				</div>
			)}

			{/* Quick View Button (Bottom Bar) */}
			{cardQuickActionMode === 'quickView' && !isOutOfStock && (
				<div className="p-3 pt-0">
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							if (onOpenQuickView) {
								onOpenQuickView(product)
							} else {
								window.location.href = `/${ROUTES.products}/${product.slug}`
							}
						}}
						className="block w-full rounded-lg border border-gray-300 bg-white py-2 text-center text-xs font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.98]"
					>
						Xem nhanh
					</button>
				</div>
			)}
		</div>
	)
}
