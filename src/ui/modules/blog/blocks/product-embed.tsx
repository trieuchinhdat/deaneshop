'use client'

import { ArrowRight, Check, ShoppingBag, Star } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { cn, formatPrice } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import { useCartStore } from '@/store/use-cart-store'
import Img from '@/ui/img'

interface ProductEmbedProps {
	product?: {
		_id: string
		title?: string
		price?: number
		salePrice?: number
		images?: any[]
		hasVariants?: boolean
		inStock?: boolean
		stock?: number
		metadata?: {
			slug?: {
				current?: string
			}
		}
		description?: string
	}
	layout?: 'card' | 'banner' | 'minimal'
	customBadge?: string
	customReviewSnippet?: string
}

export default function ProductEmbed({
	product,
	layout = 'card',
	customBadge,
	customReviewSnippet,
}: ProductEmbedProps) {
	const [added, setAdded] = useState(false)
	const addItem = useCartStore((state) => state.addItem)

	if (!product) return null

	const slug = product.metadata?.slug?.current || product._id
	const baseProductUrl = `/products/${slug}`
	// Use an internal reference query parameter instead of utm_* so blog embeds
	// never overwrite an active external ad campaign attribution.
	const productUrl = `${baseProductUrl}?ref_embed=${encodeURIComponent(`blog_product_embed:${slug}`)}`
	const primaryImage = product.images?.[0]
	const price = product.salePrice ?? product.price ?? 0
	const originalPrice =
		product.salePrice && product.price ? product.price : null
	const discount =
		originalPrice && originalPrice > price
			? Math.round(((originalPrice - price) / originalPrice) * 100)
			: null

	const isOutOfStock = product.inStock === false || product.stock === 0
	const hasVariants = Boolean(product.hasVariants)

	const handleAddToCart = (e: React.MouseEvent) => {
		e.preventDefault()
		if (isOutOfStock) return
		addItem({
			id: `${product._id}-default`,
			productId: product._id,
			productTitle: product.title || 'Product',
			title: product.title || 'Product',
			price: price,
			compareAtPrice: originalPrice || undefined,
			slug: slug,
			quantity: 1,
			image: primaryImage,
		})
		setAdded(true)
		setTimeout(() => setAdded(false), 2000)
	}

	// 1. MINIMAL LAYOUT
	if (layout === 'minimal') {
		return (
			<div className="not-prose my-4 inline-flex flex-wrap items-center gap-2.5 sm:gap-3 rounded-full border border-zinc-200 bg-zinc-50/80 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-2xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60">
				<span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-none">
					{product.title}
				</span>
				<span className="font-bold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
					{formatPrice(price)}
				</span>
				<Link
					href={productUrl}
					className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400 whitespace-nowrap"
				>
					View Product <ArrowRight className="size-3.5" />
				</Link>
			</div>
		)
	}

	// 2. HORIZONTAL BANNER LAYOUT
	if (layout === 'banner') {
		return (
			<div className="not-prose my-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:shadow-md sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
				<div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
					<div className="relative size-32 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:size-40 dark:bg-zinc-800">
						{primaryImage && (
							<Img
								image={primaryImage}
								width={320}
								height={320}
								alt={product.title ?? 'Product'}
								className="size-full object-cover transition-transform duration-300 hover:scale-105"
							/>
						)}
						{discount && (
							<span className="absolute top-2 left-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
								-{discount}%
							</span>
						)}
					</div>

					<div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
						{customBadge && (
							<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
								<Star className="size-3 fill-amber-500 text-amber-500" />
								{customBadge}
							</span>
						)}
						<h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 break-words">
							<Link href={productUrl} className="hover:underline">
								{product.title}
							</Link>
						</h4>
						{customReviewSnippet && (
							<p className="line-clamp-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
								{customReviewSnippet}
							</p>
						)}
						<div className="flex flex-wrap items-baseline justify-center gap-2 pt-1 sm:justify-start">
							<span className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
								{formatPrice(price)}
							</span>
							{originalPrice && (
								<span className="text-xs sm:text-sm text-zinc-400 line-through whitespace-nowrap">
									{formatPrice(originalPrice)}
								</span>
							)}
						</div>
					</div>

					<div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
						{isOutOfStock ? (
							<Link
								href={productUrl}
								className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-zinc-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 whitespace-nowrap"
							>
								Sold Out • Details
							</Link>
						) : hasVariants ? (
							<Link
								href={productUrl}
								className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white whitespace-nowrap"
							>
								<ShoppingBag className="size-4" /> Select Options
							</Link>
						) : (
							<button
								onClick={handleAddToCart}
								className={cn(
									'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap',
									added
										? 'bg-emerald-600 text-white'
										: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
								)}
							>
								{added ? (
									<>
										<Check className="size-4" /> Added to Cart
									</>
								) : (
									<>
										<ShoppingBag className="size-4" /> Add to Cart
									</>
								)}
							</button>
						)}
						<Link
							href={productUrl}
							className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 whitespace-nowrap"
						>
							View Specifications
						</Link>
					</div>
				</div>
			</div>
		)
	}

	// 3. STANDARD CARD LAYOUT (Default)
	return (
		<div className="not-prose mx-auto my-8 max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
			<div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
				{primaryImage && (
					<Img
						image={primaryImage}
						width={500}
						height={500}
						alt={product.title ?? 'Product'}
						className="size-full object-cover transition-transform duration-300 hover:scale-105"
					/>
				)}
				{discount && (
					<span className="absolute top-3 left-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
						-{discount}%
					</span>
				)}
				{customBadge && (
					<span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow-xs backdrop-blur-xs">
						<Star className="size-3 fill-white text-white" />
						{customBadge}
					</span>
				)}
			</div>

			<div className="space-y-3 p-4 sm:p-5">
				<h4 className="line-clamp-2 text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 break-words">
					<Link href={productUrl} className="hover:underline">
						{product.title}
					</Link>
				</h4>

				{customReviewSnippet && (
					<p className="line-clamp-2 text-xs text-zinc-600 italic dark:text-zinc-400">
						"{customReviewSnippet}"
					</p>
				)}

				<div className="flex items-baseline gap-2">
					<span className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
						{formatPrice(price)}
					</span>
					{originalPrice && (
						<span className="text-xs text-zinc-400 line-through whitespace-nowrap">
							{formatPrice(originalPrice)}
						</span>
					)}
				</div>

				<div className="grid grid-cols-2 gap-2 pt-1">
					{isOutOfStock ? (
						<Link
							href={productUrl}
							className="flex min-h-[38px] items-center justify-center rounded-xl bg-zinc-100 px-2 py-2 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 whitespace-nowrap truncate"
						>
							Sold Out
						</Link>
					) : hasVariants ? (
						<Link
							href={productUrl}
							className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-2 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white whitespace-nowrap truncate"
						>
							<ShoppingBag className="size-3.5 shrink-0" /> <span className="truncate">Options</span>
						</Link>
					) : (
						<button
							onClick={handleAddToCart}
							className={cn(
								'flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap truncate',
								added
									? 'bg-emerald-600 text-white'
									: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
							)}
						>
							{added ? (
								<>
									<Check className="size-3.5 shrink-0" /> <span className="truncate">Added</span>
								</>
							) : (
								<>
									<ShoppingBag className="size-3.5 shrink-0" /> <span className="truncate">Add to Cart</span>
								</>
							)}
						</button>
					)}
					<Link
						href={productUrl}
						className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-zinc-300 px-2 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 whitespace-nowrap truncate"
					>
						<span className="truncate">View Details</span> <ArrowRight className="size-3 shrink-0" />
					</Link>
				</div>
			</div>
		</div>
	)
}
