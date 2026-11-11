'use client'

import Link from 'next/link'
import { memo, useId, useMemo, useState } from 'react'
import {
	FiCheck,
	FiEye,
	FiFileText,
	FiImage,
	FiShoppingBag,
	FiStar,
} from 'react-icons/fi'
import { ROUTES } from '@/lib/env'
import { getProductPricing } from '@/lib/product-pricing'
import { showCartToast } from '@/lib/toast'
import { formatPrice } from '@/lib/utils'
import type { ProductVariant, Product as SanityProduct } from '@/sanity/types'
import { useCartStore } from '@/store/use-cart-store'
import { parseVideoMedia } from '@/ui/img'
import ResponsiveImage from '@/ui/responsiveImage'

export type Product = Pick<
	SanityProduct,
	'currency' | 'maxPrice' | 'priceTiers' | 'pricingModel'
> & {
	_id: string
	title: string
	slug: string
	price: number
	compareAtPrice?: number
	images?: any[]
	metadata?: {
		image?: any
		slug?: { current?: string }
	}
	categories?: { title?: string; slug?: string }[]
	_createdAt?: string
	reviews?: Array<{ rating?: number }>
	reviewSummary?: { count: number; avgRating: number }
	sold?: number
	stock?: number
	inStock?: boolean
	hasVariants?: boolean
	tags?: string[]
	badge?: string
	options?: Array<{ name: string; values: string[] }>
	variants?: Array<
		Pick<
			ProductVariant,
			'sku' | 'title' | 'price' | 'compareAtPrice' | 'stock'
		> & {
			_key?: string
			image?: any
			options?: Array<{ name?: string; value?: string }>
		}
	>
}

export type ProductCardSettings = {
	// Product Info
	cardShowCategory?: boolean
	cardShowRating?: boolean
	cardShowSoldCount?: boolean
	// Media
	cardImageAspectRatio?: '1:1' | '3:4' | '4:3' | string
	cardImageFit?: 'cover' | 'contain' | string
	cardShowSecondaryImageHover?: boolean
	cardHoverEffect?: 'lift' | 'zoom' | 'none' | string
	// Pricing
	cardShowPrice?: boolean
	cardShowCompareAtPrice?: boolean
	// Badges
	cardShowDiscountBadge?: boolean
	cardDiscountStyle?: 'percent' | 'amount' | string
	cardBadgePosition?: 'topLeft' | 'topRight' | string
	cardShowCustomBadges?: boolean
	cardShowOutOfStock?: boolean
	cardShowColorSwatches?: boolean
	cardMaxColorSwatches?: number
	// Actions
	cardQuickActionMode?: 'none' | 'quickAdd' | 'quickView' | 'both' | string
	cardQuickAddText?: string
	cardQuickViewText?: string
	cardShowWishlist?: boolean
	// Layout & Style
	cardContentAlignment?: 'left' | 'center' | string
	cardStyle?: 'standard' | 'bordered' | 'flat' | string
}

export type ProductCardProps = {
	product: Product
	productSettings?: ProductCardSettings
	onOpenQuickView?: (product: Product) => void
	priorityImage?: boolean
	className?: string
}

export function formatSold(sold?: number): string | null {
	if (typeof sold !== 'number' || sold <= 0) return null
	if (sold >= 1000) {
		const formatted = (sold / 1000).toFixed(1).replace(/\.0$/, '')
		return `${formatted}k+ sold`
	}
	return `${sold} sold`
}

const COLOR_MAP: Record<string, string> = {
	red: '#ef4444',
	blue: '#3b82f6',
	green: '#22c55e',
	teal: '#14b8a6',
	cyan: '#06b6d4',
	black: '#18181b',
	white: '#ffffff',
	yellow: '#eab308',
	pink: '#ec4899',
	orange: '#f97316',
	grey: '#6b7280',
	gray: '#6b7280',
	purple: '#a855f7',
	brown: '#78350f',
	beige: '#fef3c7',
	cream: '#fffdd0',
	navy: '#1e3a8a',
	silver: '#cbd5e1',
}

export function getColorCode(colorName?: string): string {
	if (!colorName) return '#d1d5db'
	const nameLower = colorName.toLowerCase().trim()
	for (const [key, code] of Object.entries(COLOR_MAP)) {
		if (nameLower.includes(key)) return code
	}
	return '#9ca3af'
}

export function getHoverMediaItem(
	images: any[] | undefined,
	mainImage: any,
): any | null {
	if (!Array.isArray(images) || images.length < 2) return null

	for (let i = 1; i < images.length; i++) {
		const item = images[i]
		if (!item || item === mainImage) continue

		const videoMedia = parseVideoMedia(item)

		// 1. Skip external video link (YouTube / TikTok / Vimeo / embed url)
		if (
			videoMedia?.type === 'videoUrl' ||
			item._type === 'videoUrl' ||
			item.videoUrl
		) {
			continue
		}

		// 2. Accept uploaded video file (MP4/WebM)
		if (videoMedia?.type === 'video' || item._type === 'video') {
			return item
		}

		// 3. Accept standard image
		if (item._type === 'image' || item.asset || typeof item === 'string') {
			return item
		}
	}

	return null
}

function resolveProductHref(slug?: string): string {
	if (!slug) return '#'
	if (slug.startsWith('/')) return slug
	return `/${ROUTES.products}/${slug}`
}

function resolveCustomBadge(product: Product): string | null {
	if (product.badge) return product.badge

	if (Array.isArray(product.tags) && product.tags.length > 0) {
		for (const rawTag of product.tags) {
			const tag = rawTag.toLowerCase().trim()
			if (tag === 'new' || tag === 'new arrival') return 'NEW'
			if (tag === 'bestseller' || tag === 'best seller') return 'BEST SELLER'
			if (tag === 'featured') return 'FEATURED'
			if (tag === 'trending' || tag === 'hot') return 'HOT'
		}
	}
	return null
}

function ProductCardComponent({
	product,
	productSettings,
	onOpenQuickView,
	priorityImage = false,
	className = '',
}: ProductCardProps) {
	const addItem = useCartStore((s) => s.addItem)
	const [activeImage, setActiveImage] = useState<any>(null)
	const [activeSwatchIndex, setActiveSwatchIndex] = useState<number | null>(
		null,
	)
	const [isAddedFeedback, setIsAddedFeedback] = useState(false)
	const titleId = useId()

	const {
		cardShowCategory = true,
		cardShowRating = true,
		cardShowSoldCount = true,
		cardImageAspectRatio = '1:1',
		cardImageFit = 'cover',
		cardShowSecondaryImageHover = true,
		cardHoverEffect = 'lift',
		cardShowPrice = true,
		cardShowCompareAtPrice = true,
		cardShowDiscountBadge = true,
		cardDiscountStyle = 'percent',
		cardBadgePosition = 'topLeft',
		cardShowCustomBadges = true,
		cardShowOutOfStock = true,
		cardShowColorSwatches = true,
		cardMaxColorSwatches = 4,
		cardQuickActionMode = 'quickAdd',
		cardQuickAddText = '+ Add to Quote List',
		cardQuickViewText = 'Quick View',
		cardContentAlignment = 'left',
		cardStyle = 'standard',
	} = productSettings ?? {}

	// Ratings calculation
	const totalReviews =
		product.reviewSummary?.count ?? product.reviews?.length ?? 0
	const averageRating =
		product.reviewSummary && product.reviewSummary.count > 0
			? product.reviewSummary.avgRating
			: (product.reviews?.length ?? 0) > 0
				? product.reviews!.reduce(
						(sum: number, r: any) => sum + (r.rating || 0),
						0,
					) / product.reviews!.length
				: 0

	const soldText = formatSold(product.sold)
	const hasRating = cardShowRating && totalReviews > 0
	const hasSold = cardShowSoldCount && Boolean(soldText)

	// Inventory & Out of Stock Calculation
	const isExplicitOutOfStock = product.inStock === false
	const calculatedStock =
		typeof product.stock === 'number'
			? product.stock
			: (product.variants?.reduce(
					(sum: number, v: any) => sum + (v.stock ?? 0),
					0,
				) ?? 1)
	const isOutOfStock =
		cardShowOutOfStock && (isExplicitOutOfStock || calculatedStock <= 0)

	// Variant calculation
	const hasVariants = Boolean(
		product.hasVariants ||
		(Array.isArray(product.variants) && product.variants.length > 0),
	)
	const firstVariant = hasVariants ? product.variants?.[0] : null

	const pricing = getProductPricing(product)
	const displayPrice = pricing.price
	const displayCompareAtPrice = pricing.compareAtPrice
	const hasSale = cardShowDiscountBadge && pricing.hasSale

	// Effective Images
	const allImages =
		Array.isArray(product.images) && product.images.length > 0
			? product.images
			: product.metadata?.image
				? [product.metadata.image]
				: []

	const mainImage = activeImage || allImages[0] || null
	const secondaryImage = useMemo(
		() => getHoverMediaItem(allImages, mainImage),
		[allImages, mainImage],
	)

	// Color Swatches
	const colorSwatches = useMemo(() => {
		if (!cardShowColorSwatches || !product.variants?.length) return []
		const swatches: { name: string; color: string; image?: any }[] = []
		const seen = new Set<string>()

		for (const variant of product.variants) {
			const colorOption =
				variant.options?.find((o: any) =>
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
	}, [product.variants, cardShowColorSwatches])

	// Custom Badge (New, Best Seller, etc.)
	const customBadge = cardShowCustomBadges ? resolveCustomBadge(product) : null

	// Style Classes
	const aspectClass =
		cardImageAspectRatio === '3:4'
			? 'aspect-[3/4]'
			: cardImageAspectRatio === '4:3'
				? 'aspect-[4/3]'
				: 'aspect-square'

	const fitClass =
		cardImageFit === 'contain'
			? 'object-contain p-2.5 bg-white dark:bg-slate-900'
			: 'object-cover'

	const alignClass =
		cardContentAlignment === 'center'
			? 'text-center items-center'
			: 'text-left items-start'

	const flexAlignClass =
		cardContentAlignment === 'center' ? 'justify-center' : 'justify-start'

	const cardContainerStyle =
		cardStyle === 'flat'
			? 'bg-transparent border-0 shadow-none'
			: cardStyle === 'bordered'
				? 'border border-gray-200/90 bg-white/50 backdrop-blur-xs shadow-none dark:border-slate-800 dark:bg-slate-900/50'
				: 'border border-gray-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900'

	const hoverMotionClass =
		cardHoverEffect === 'none'
			? ''
			: cardHoverEffect === 'zoom'
				? 'transition-shadow duration-300 hover:shadow-md'
				: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg'

	const productHref = resolveProductHref(
		product.slug || product.metadata?.slug?.current,
	)

	// Quick Add Handler
	const handleQuickAddToCart = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (isOutOfStock) return

		// If product has multiple variants, open Quick View modal so buyer chooses options
		if (hasVariants && onOpenQuickView) {
			onOpenQuickView(product)
			return
		}

		const variantId = firstVariant?._key || firstVariant?.sku
		const cartItemId = variantId
			? `${product._id}_${variantId}`
			: product._id || product.slug

		const itemImage = firstVariant?.image?.asset?.url
			? firstVariant.image.asset.url
			: allImages[0]?.asset?.url
				? allImages[0].asset.url
				: typeof allImages[0] === 'string'
					? allImages[0]
					: '/fallback-image.png'

		addItem({
			id: cartItemId,
			productId: product._id,
			productTitle: product.title,
			variantId,
			variantTitle: firstVariant?.title,
			sku: firstVariant?.sku || product.slug,
			title: product.title,
			price: getProductPricing(product, firstVariant || {}).price,
			compareAtPrice: firstVariant?.compareAtPrice ?? product.compareAtPrice,
			image: itemImage,
			quantity: 1,
			slug: product.slug,
			hasVariants: hasVariants,
			options: product.options,
			variants: product.variants,
		})

		// Trigger visual confirmation
		setIsAddedFeedback(true)
		setTimeout(() => setIsAddedFeedback(false), 2000)

		// Commercial notification toast
		showCartToast({
			title: 'Added to Cart',
			subtitle: product.title,
			checkoutUrl: '/checkout',
			checkoutLabel: 'Proceed to Checkout →',
		})
	}

	const handleOpenQuickView = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (onOpenQuickView) {
			onOpenQuickView(product)
		} else {
			window.location.href = productHref
		}
	}

	// Discount text calculations
	const discountLabel = useMemo(() => {
		if (!hasSale || !displayCompareAtPrice) return null
		const diff = displayCompareAtPrice - displayPrice
		if (diff <= 0) return null

		if (cardDiscountStyle === 'amount') {
			return `Save ${formatPrice(diff, product.currency)}`
		}
		const percent = Math.round((diff / displayCompareAtPrice) * 100)
		return `${percent}% OFF`
	}, [hasSale, displayCompareAtPrice, displayPrice, cardDiscountStyle])

	// Badge positioning classes
	const badgeCornerClass =
		cardBadgePosition === 'topRight' ? 'top-2.5 right-2.5' : 'top-2.5 left-2.5'
	const secondaryBadgeCornerClass =
		cardBadgePosition === 'topRight' ? 'top-2.5 left-2.5' : 'top-2.5 right-2.5'

	return (
		<article
			aria-labelledby={titleId}
			className={`group relative flex h-full flex-col overflow-hidden rounded-xl ${cardContainerStyle} ${hoverMotionClass} focus-within:ring-2 focus-within:ring-slate-900 focus-within:ring-offset-2 dark:focus-within:ring-white dark:focus-within:ring-offset-slate-950 ${className}`}
		>
			{/* Thumbnail Image Container */}
			<div
				className={`relative w-full ${aspectClass} overflow-hidden bg-gray-50 dark:bg-slate-800`}
			>
				<Link
					href={productHref}
					aria-label={`View ${product.title}`}
					className="block h-full w-full focus:outline-none"
				>
					{mainImage ? (
						<ResponsiveImage
							className={`h-full w-full ${fitClass} transition-transform duration-500 ${
								cardHoverEffect === 'zoom' ? 'group-hover:scale-105' : ''
							} ${isOutOfStock ? 'opacity-55 grayscale' : ''}`}
							image={mainImage}
							priority={priorityImage}
							desktop={{ width: 600 }}
							mobile={{ width: 300 }}
						/>
					) : (
						/* Accessible Branded Placeholder if image is missing */
						<div
							className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500"
							aria-label="No product photograph available"
						>
							<FiImage className="size-8 stroke-1" aria-hidden="true" />
							<span className="text-[11px] font-medium tracking-wide">
								No image available
							</span>
						</div>
					)}

					{/* Secondary Flip Image on Hover (Desktop Only) */}
					{cardShowSecondaryImageHover && secondaryImage && !activeImage && (
						<div
							className="absolute inset-0 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block"
							aria-hidden="true"
						>
							<ResponsiveImage
								className={`h-full w-full ${fitClass} ${
									isOutOfStock ? 'opacity-55 grayscale' : ''
								}`}
								image={secondaryImage}
								desktop={{ width: 600 }}
								mobile={{ width: 300 }}
							/>
						</div>
					)}
				</Link>

				{/* Promotional Discount Badge */}
				{!isOutOfStock && hasSale && discountLabel && (
					<span
						className={`pointer-events-none absolute ${badgeCornerClass} z-10 inline-flex items-center rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs lg:text-xs`}
						aria-label={`Promotional discount: ${discountLabel}`}
					>
						{discountLabel}
					</span>
				)}

				{/* Custom Badge (e.g. New, Best Seller) */}
				{!isOutOfStock && customBadge && (
					<span
						className={`pointer-events-none absolute ${
							hasSale ? secondaryBadgeCornerClass : badgeCornerClass
						} z-10 inline-flex items-center gap-1 rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 uppercase shadow-xs backdrop-blur-xs lg:text-xs dark:bg-white dark:text-slate-900`}
					>
						<span aria-hidden="true">★</span> {customBadge}
					</span>
				)}

				{/* Out of Stock Overlay / Dimming */}
				{isOutOfStock && (
					<div
						className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
						aria-label="Product is currently sold out"
					>
						<span className="rounded-lg bg-black/90 px-3 py-1.5 text-[11px] font-bold tracking-widest text-white uppercase shadow-md lg:text-xs">
							Sold Out
						</span>
					</div>
				)}

				{/* Floating Dual Actions Bar (cardQuickActionMode === 'both') */}
				{cardQuickActionMode === 'both' && !isOutOfStock && (
					<div className="absolute inset-x-0 bottom-2.5 z-20 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
						<button
							type="button"
							onClick={handleQuickAddToCart}
							disabled={isOutOfStock}
							className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition-transform hover:scale-110 hover:bg-black focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100"
							title={hasVariants ? 'Select Options' : cardQuickAddText}
							aria-label={`${
								hasVariants ? 'Choose options for' : cardQuickAddText
							} ${product.title}`}
						>
							{isAddedFeedback ? (
								<FiCheck className="size-4 text-emerald-400" />
							) : hasVariants ? (
								<FiShoppingBag className="size-4" />
							) : (
								<FiFileText className="size-4" />
							)}
						</button>
						<button
							type="button"
							onClick={handleOpenQuickView}
							className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white text-gray-800 shadow-md transition-transform hover:scale-110 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none active:scale-95 dark:bg-slate-800 dark:text-gray-100 dark:hover:bg-slate-700"
							title={cardQuickViewText}
							aria-label={`${cardQuickViewText} for ${product.title}`}
						>
							<FiEye className="size-4" />
						</button>
					</div>
				)}
			</div>

			{/* Card Body */}
			<div className={`flex flex-1 flex-col p-3 sm:p-3.5 ${alignClass}`}>
				{/* Category Pill */}
				{cardShowCategory && product.categories?.[0]?.title && (
					<span className="mb-1 text-[10px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
						{product.categories[0].title}
					</span>
				)}

				{/* Product Title Heading */}
				<h3
					id={titleId}
					className="line-clamp-2 text-xs leading-snug font-semibold text-gray-900 transition-colors sm:text-sm dark:text-white"
				>
					<Link
						href={productHref}
						className="rounded-xs transition-colors hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none dark:hover:text-slate-300"
					>
						{product.title}
					</Link>
				</h3>

				{/* Interactive Color Swatches */}
				{colorSwatches.length > 0 && (
					<div
						className={`mt-2 flex flex-wrap items-center gap-1.5 ${flexAlignClass}`}
						role="group"
						aria-label="Available color variations"
					>
						{colorSwatches.slice(0, cardMaxColorSwatches).map((swatch, idx) => {
							const isSelected = activeSwatchIndex === idx
							return (
								<button
									key={idx}
									type="button"
									onMouseEnter={() => {
										if (swatch.image) setActiveImage(swatch.image)
									}}
									onMouseLeave={() => {
										if (activeSwatchIndex === null) {
											setActiveImage(null)
										} else if (colorSwatches[activeSwatchIndex]?.image) {
											setActiveImage(colorSwatches[activeSwatchIndex].image)
										}
									}}
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										setActiveSwatchIndex(idx)
										if (swatch.image) setActiveImage(swatch.image)
									}}
									className={`size-4.5 cursor-pointer rounded-full border shadow-2xs transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
										isSelected
											? 'ring-2 ring-slate-900 ring-offset-1 dark:ring-white dark:ring-offset-slate-900'
											: 'border-gray-300 dark:border-slate-600'
									}`}
									style={{ backgroundColor: swatch.color }}
									title={swatch.name}
									aria-label={`Select color ${swatch.name}`}
									aria-pressed={isSelected}
								/>
							)
						})}
						{colorSwatches.length > cardMaxColorSwatches && (
							<span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
								+{colorSwatches.length - cardMaxColorSwatches}
							</span>
						)}
					</div>
				)}

				{/* Social Proof: Rating Stars & Sold Count */}
				{(hasRating || hasSold) && (
					<div
						className={`mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] lg:text-xs ${flexAlignClass}`}
					>
						{hasRating && (
							<div
								className="flex items-center gap-1"
								aria-label={`Rated ${averageRating.toFixed(1)} out of 5 stars from ${totalReviews} customer reviews`}
							>
								<span className="font-semibold text-gray-900 dark:text-gray-100">
									{averageRating.toFixed(1)}
								</span>
								<FiStar
									className="inline size-3 fill-amber-400 text-amber-400"
									aria-hidden="true"
								/>
								<span className="text-gray-500 dark:text-gray-400">
									({totalReviews})
								</span>
							</div>
						)}

						{hasRating && hasSold && (
							<span
								className="text-gray-300 dark:text-slate-600"
								aria-hidden="true"
							>
								•
							</span>
						)}

						{hasSold && (
							<span className="font-medium text-gray-600 dark:text-gray-400">
								{soldText}
							</span>
						)}
					</div>
				)}

				{/* Pricing Presentation */}
				{cardShowPrice && (
					<div className="mt-auto pt-2.5">
						{hasSale && displayCompareAtPrice && cardShowCompareAtPrice ? (
							<div
								className={`flex flex-wrap items-baseline gap-1.5 ${flexAlignClass}`}
							>
								<span className="text-sm font-bold text-red-600 lg:text-base dark:text-red-400">
									<span className="sr-only">Discounted price: </span>
									{pricing.label}
								</span>
								<span className="text-[11px] text-gray-500 line-through lg:text-xs dark:text-gray-400">
									<span className="sr-only">Original price: </span>
									{formatPrice(displayCompareAtPrice, product.currency)}
								</span>
							</div>
						) : (
							<span className="text-sm font-bold text-slate-900 lg:text-base dark:text-white">
								{pricing.label}
							</span>
						)}
					</div>
				)}
			</div>

			{/* Bottom Action: Quick Add Button */}
			{cardQuickActionMode === 'quickAdd' && !isOutOfStock && (
				<div className="p-3 pt-0">
					<button
						type="button"
						onClick={handleQuickAddToCart}
						className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold shadow-2xs transition-all focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none active:scale-[0.98] ${
							isAddedFeedback
								? 'bg-emerald-600 text-white'
								: 'bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100'
						}`}
						aria-label={`${
							hasVariants ? 'Choose options for' : cardQuickAddText
						} ${product.title}`}
					>
						{isAddedFeedback ? (
							<>
								<FiCheck className="size-3.5" /> Added to Cart
							</>
						) : (
							<>
								{hasVariants ? (
									<>
										<FiShoppingBag className="size-3.5" /> Select Options
									</>
								) : (
									cardQuickAddText
								)}
							</>
						)}
					</button>
				</div>
			)}

			{/* Bottom Action: Quick View Button */}
			{cardQuickActionMode === 'quickView' && !isOutOfStock && (
				<div className="p-3 pt-0">
					<button
						type="button"
						onClick={handleOpenQuickView}
						className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white py-2 text-center text-xs font-semibold text-gray-800 shadow-2xs transition-all hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
						aria-label={`${cardQuickViewText} for ${product.title}`}
					>
						<FiEye className="size-3.5" /> {cardQuickViewText}
					</button>
				</div>
			)}

			{/* Out of Stock Action State */}
			{isOutOfStock && (
				<div className="p-3 pt-0">
					<Link
						href={productHref}
						className="flex w-full items-center justify-center rounded-lg bg-gray-100 py-2 text-center text-xs font-medium text-gray-500 transition hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700"
					>
						Sold Out • View Details
					</Link>
				</div>
			)}
		</article>
	)
}

export const ProductCard = memo(ProductCardComponent)
export default ProductCard
