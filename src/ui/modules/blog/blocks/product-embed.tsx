'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowRight, Star, Check } from 'lucide-react'
import { useState } from 'react'
import { cn, formatVND } from '@/lib/utils'
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
	const productUrl = `/products/${slug}`
	const primaryImage = product.images?.[0]
	const price = product.salePrice ?? product.price ?? 0
	const originalPrice = product.salePrice && product.price ? product.price : null
	const discount =
		originalPrice && originalPrice > price
			? Math.round(((originalPrice - price) / originalPrice) * 100)
			: null

	const handleAddToCart = (e: React.MouseEvent) => {
		e.preventDefault()
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
			<div className="my-4 inline-flex flex-wrap items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50/80 px-4 py-2 text-sm shadow-2xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60">
				<span className="font-semibold text-zinc-900 dark:text-zinc-100">
					{product.title}
				</span>
				<span className="font-bold text-zinc-900 dark:text-zinc-50">
					{formatVND(price)}
				</span>
				<Link
					href={productUrl}
					className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
				>
					View Product <ArrowRight className="size-3.5" />
				</Link>
			</div>
		)
	}

	// 2. HORIZONTAL BANNER LAYOUT
	if (layout === 'banner') {
		return (
			<div className="my-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-xs transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
				<div className="flex flex-col sm:flex-row items-center gap-6">
					<div className="relative size-32 sm:size-40 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
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

					<div className="flex-1 space-y-2 text-center sm:text-left">
						{customBadge && (
							<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
								<Star className="size-3 fill-amber-500 text-amber-500" />
								{customBadge}
							</span>
						)}
						<h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
							<Link href={productUrl} className="hover:underline">
								{product.title}
							</Link>
						</h4>
						{customReviewSnippet && (
							<p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
								{customReviewSnippet}
							</p>
						)}
						<div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-2 pt-1">
							<span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
								{formatVND(price)}
							</span>
							{originalPrice && (
								<span className="text-sm text-zinc-400 line-through">
									{formatVND(originalPrice)}
								</span>
							)}
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
						<button
							onClick={handleAddToCart}
							className={cn(
								'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-xs',
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
						<Link
							href={productUrl}
							className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
						>
							Details
						</Link>
					</div>
				</div>
			</div>
		)
	}

	// 3. STANDARD CARD LAYOUT (Default)
	return (
		<div className="my-8 mx-auto max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
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
					<span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-white shadow-xs">
						<Star className="size-3 fill-white text-white" />
						{customBadge}
					</span>
				)}
			</div>

			<div className="p-5 space-y-3">
				<h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 line-clamp-2">
					<Link href={productUrl} className="hover:underline">
						{product.title}
					</Link>
				</h4>

				{customReviewSnippet && (
					<p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 italic">
						"{customReviewSnippet}"
					</p>
				)}

				<div className="flex items-baseline gap-2">
					<span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
						{formatVND(price)}
					</span>
					{originalPrice && (
						<span className="text-xs text-zinc-400 line-through">
							{formatVND(originalPrice)}
						</span>
					)}
				</div>

				<div className="grid grid-cols-2 gap-2 pt-1">
					<button
						onClick={handleAddToCart}
						className={cn(
							'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all shadow-xs',
							added
								? 'bg-emerald-600 text-white'
								: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white',
						)}
					>
						{added ? (
							<>
								<Check className="size-3.5" /> Added
							</>
						) : (
							<>
								<ShoppingBag className="size-3.5" /> Quick Add
							</>
						)}
					</button>
					<Link
						href={productUrl}
						className="flex items-center justify-center gap-1 rounded-xl border border-zinc-300 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
					>
						View Product <ArrowRight className="size-3" />
					</Link>
				</div>
			</div>
		</div>
	)
}
