'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
	FiCheck,
	FiFilm,
	FiMinus,
	FiPlay,
	FiPlus,
	FiShoppingBag,
	FiStar,
	FiX,
} from 'react-icons/fi'
import { ROUTES } from '@/lib/env'
import { getProductPricing } from '@/lib/product-pricing'
import { showCartToast } from '@/lib/toast'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/use-cart-store'
import { parseVideoMedia } from '@/ui/img'
import ResponsiveImage from '@/ui/responsiveImage'
import type { Product } from './product-card'

type QuickViewModalProps = {
	isOpen: boolean
	product: Product | null
	productSettings?: any
	onClose: () => void
}

function getColorCode(colorName: string): string {
	const map: Record<string, string> = {
		Black: '#000000',
		White: '#FFFFFF',
		Red: '#EF4444',
		Blue: '#3B82F6',
		Green: '#10B981',
		Yellow: '#F59E0B',
		Pink: '#EC4899',
		Gray: '#6B7280',
		Orange: '#F97316',
		Purple: '#8B5CF6',
		Brown: '#78350F',
		Beige: '#F5F5DC',
		Cream: '#FFFDD0',
		Silver: '#CBD5E1',
		Navy: '#1E3A8A',
	}
	return map[colorName] || '#D1D5DB'
}

export default function QuickViewModal({
	isOpen,
	product,
	productSettings,
	onClose,
}: QuickViewModalProps) {
	const addItem = useCartStore((s) => s.addItem)

	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string>
	>({})
	const [activeImage, setActiveImage] = useState<any>(null)
	const [quantity, setQuantity] = useState(1)

	// Extract Effective Options from product.options OR automatically from product.variants
	const effectiveOptions = useMemo(() => {
		if (product?.options && product.options.length > 0) {
			return product.options
		}
		if (!product?.variants?.length) return []

		const optionsMap = new Map<string, Set<string>>()
		product.variants.forEach((v) => {
			if (v.options && Array.isArray(v.options) && v.options.length > 0) {
				v.options.forEach((opt) => {
					if (opt.name && opt.value) {
						if (!optionsMap.has(opt.name)) {
							optionsMap.set(opt.name, new Set())
						}
						optionsMap.get(opt.name)!.add(opt.value)
					}
				})
			} else if (v.title) {
				const name = 'Variant'
				if (!optionsMap.has(name)) optionsMap.set(name, new Set())
				optionsMap.get(name)!.add(v.title.trim())
			}
		})

		const result: Array<{ name: string; values: string[] }> = []
		optionsMap.forEach((valuesSet, name) => {
			result.push({ name, values: Array.from(valuesSet) })
		})
		return result
	}, [product?.options, product?.variants])

	// Initialize Selected Options when Product opens
	useEffect(() => {
		if (product) {
			setQuantity(1)
			setActiveImage(null)

			const initialOptions: Record<string, string> = {}
			if (effectiveOptions.length > 0) {
				effectiveOptions.forEach((opt) => {
					if (opt.values && opt.values.length > 0) {
						initialOptions[opt.name] = opt.values[0]
					}
				})
			}
			setSelectedOptions(initialOptions)
		}
	}, [product, effectiveOptions])

	// Lock Body Scroll when Modal is open & listen for Escape key
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === 'Escape') onClose()
			}
			window.addEventListener('keydown', handleKeyDown)
			return () => {
				document.body.style.overflow = ''
				window.removeEventListener('keydown', handleKeyDown)
			}
		} else {
			document.body.style.overflow = ''
		}
	}, [isOpen, onClose])

	// Find active Variant matching Selected Options
	const activeVariant = useMemo(() => {
		if (!product?.variants?.length) return null
		return (
			product.variants.find((v) => {
				if (!v.options?.length) {
					if (
						v.title &&
						(selectedOptions['Variant'] === v.title.trim() ||
							selectedOptions['Option'] === v.title.trim())
					)
						return true
					return false
				}
				return v.options.every(
					(opt) =>
						opt.name && opt.value && selectedOptions[opt.name] === opt.value,
				)
			}) || product.variants[0]
		)
	}, [product?.variants, selectedOptions])

	if (!isOpen || !product) return null

	const {
		cardShowCategory = true,
		cardShowRating = true,
		cardShowSoldCount = true,
		cardShowDiscountBadge = true,
		cardDiscountStyle = 'percent',
	} = productSettings ?? {}

	const pricing = getProductPricing(product, activeVariant)
	const displayPrice = pricing.price
	const displayCompareAtPrice = pricing.compareAtPrice
	const hasSale = cardShowDiscountBadge && pricing.hasSale

	// Reviews & Sold Count
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

	// Main Media (Image or Video)
	const mainMediaItem =
		activeImage || activeVariant?.image || product.images?.[0]
	const mainMedia = parseVideoMedia(mainMediaItem)

	// Variant Stock
	const variantStock =
		activeVariant?.stock !== undefined ? activeVariant.stock : product.stock
	const isVariantOutOfStock = variantStock !== undefined && variantStock <= 0

	const handleOptionSelect = (optionName: string, value: string) => {
		const updated = { ...selectedOptions, [optionName]: value }
		setSelectedOptions(updated)

		// Automatically select variant image if matching
		const matchedVar = product.variants?.find((v) => {
			if (!v.options?.length) {
				return v.title && value === v.title.trim()
			}
			return v.options.every(
				(o) => o.name && o.value && updated[o.name] === o.value,
			)
		})
		if (matchedVar?.image) {
			setActiveImage(matchedVar.image)
		}
	}

	const handleAddToCart = () => {
		const variantId = activeVariant?._key || activeVariant?.sku
		const cartItemId = variantId
			? `${product._id}_${variantId}`
			: product._id || product.slug

		const itemImage = activeVariant?.image?.asset?.url
			? activeVariant.image.asset.url
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
			variantTitle: activeVariant?.title,
			selectedOptions,
			sku: activeVariant?.sku || product.slug,
			title: activeVariant?.title
				? `${product.title} (${activeVariant.title})`
				: product.title,
			price: displayPrice,
			compareAtPrice: displayCompareAtPrice,
			image: itemImage,
			quantity,
			slug: product.slug,
			hasVariants: product.hasVariants || Boolean(product.variants?.length),
			options: effectiveOptions,
			variants: product.variants,
		})

		onClose()

		showCartToast({
			title: 'Added to Cart',
			subtitle: product.title,
			checkoutUrl: '/checkout',
			checkoutLabel: 'View Cart',
		})
	}

	return (
		<div
			className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm duration-200 sm:p-4"
			onClick={onClose}
		>
			<div
				className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:flex-row"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 shadow-sm transition hover:bg-gray-200 hover:text-gray-900"
					aria-label="Close"
				>
					<FiX className="h-4 w-4" />
				</button>

				{/* Left Column: Media Gallery */}
				<div className="flex w-full flex-col justify-center border-b border-gray-100 bg-gray-50 p-4 md:w-1/2 md:border-r md:border-b-0 md:p-6">
					<div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white shadow-xs">
						{mainMedia?.type === 'video' || mainMedia?.type === 'videoUrl' ? (
							<div className="relative flex h-full w-full items-center justify-center bg-black">
								{mainMedia.isIframe ? (
									<iframe
										src={mainMedia.embedUrl}
										className="h-full w-full border-0"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
										title="Product video"
									/>
								) : (
									<video
										src={mainMedia.url || mainMedia.embedUrl}
										controls
										preload="metadata"
										autoPlay={false}
										className="h-full w-full object-contain"
										playsInline
									/>
								)}
							</div>
						) : (
							<ResponsiveImage
								className="h-full w-full object-cover"
								image={mainMediaItem}
								desktop={{ width: 800 }}
								mobile={{ width: 400 }}
							/>
						)}

						{/* Discount Badge */}
						{hasSale && displayCompareAtPrice && (
							<span className="absolute top-3 left-3 z-10 rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
								{cardDiscountStyle === 'amount'
									? `- ${formatPrice((displayCompareAtPrice ?? 0) - displayPrice, product.currency)}`
									: `-${Math.round(
											((displayCompareAtPrice - displayPrice) /
												displayCompareAtPrice) *
												100,
										)}%`}
							</span>
						)}
					</div>

					{/* Thumbnail Rows */}
					{product.images && product.images.length > 1 && (
						<div className="mt-3 flex gap-2 overflow-x-auto pb-1">
							{product.images.slice(0, 8).map((img, idx) => {
								const media = parseVideoMedia(img)
								const isVideo =
									media?.type === 'video' || media?.type === 'videoUrl'
								const isSelected =
									activeImage === img || (!activeImage && idx === 0)

								return (
									<button
										key={idx}
										type="button"
										onClick={() => setActiveImage(img)}
										className={`relative h-14 w-14 flex-none overflow-hidden rounded-lg border-2 transition ${
											isSelected
												? 'border-black opacity-100 ring-2 ring-black/10'
												: 'border-transparent opacity-60 hover:opacity-100'
										}`}
									>
										{isVideo ? (
											<div className="relative h-full w-full overflow-hidden rounded-md bg-black">
												{media?.poster ? (
													<img
														src={media.poster}
														alt={product.title}
														className="h-full w-full object-cover opacity-80"
													/>
												) : media?.url ? (
													<video
														src={media.url}
														preload="metadata"
														className="h-full w-full object-cover opacity-80"
													/>
												) : (
													<div className="h-full w-full bg-gray-900" />
												)}

												{/* Dark Overlay */}
												<div className="absolute inset-0 bg-black/20" />

												{/* Center Play Button Circle */}
												<div className="absolute inset-0 flex items-center justify-center">
													<div className="backdrop-blur-2xs flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white shadow-xs">
														<FiPlay className="ml-0.5 h-2.5 w-2.5 fill-white text-white" />
													</div>
												</div>

												{/* Bottom Right Badge Pill */}
												<div className="absolute right-0.5 bottom-0.5 flex items-center gap-0.5 rounded bg-black/80 px-1 py-0.5 text-[8px] font-semibold text-white shadow-2xs">
													<FiFilm className="h-2 w-2" />
													<span>VIDEO</span>
												</div>
											</div>
										) : (
											<ResponsiveImage
												className="h-full w-full object-cover"
												image={img}
												desktop={{ width: 100 }}
												mobile={{ width: 100 }}
											/>
										)}
									</button>
								)
							})}
						</div>
					)}
				</div>

				{/* Right Column: Product Info & Order Actions */}
				<div className="flex w-full flex-col justify-between overflow-y-auto p-5 md:w-1/2 md:p-6">
					<div>
						{/* Category */}
						{cardShowCategory && product.categories?.[0]?.title && (
							<span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
								{product.categories[0].title}
							</span>
						)}

						{/* Product Title */}
						<h2 className="mt-1 text-lg font-bold text-gray-900 md:text-xl">
							{product.title}
						</h2>

						{/* Ratings & Sold & SKU */}
						<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
							{cardShowRating && totalReviews > 0 && (
								<div className="flex items-center gap-1 font-medium text-gray-700">
									<FiStar className="inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />
									<span>{averageRating.toFixed(1)}</span>
									<span className="text-gray-400">
										({totalReviews} reviews)
									</span>
								</div>
							)}
							{cardShowRating && cardShowSoldCount && totalReviews > 0 && (
								<span>•</span>
							)}
							{cardShowSoldCount && typeof product.sold === 'number' && (
								<span>{product.sold.toLocaleString()} sold</span>
							)}
							{activeVariant?.sku && (
								<>
									<span>•</span>
									<span className="font-mono text-gray-400">
										SKU: {activeVariant.sku}
									</span>
								</>
							)}
						</div>

						{/* Price Display */}
						<div className="mt-3 flex items-baseline gap-2">
							<span className="text-xl font-extrabold text-red-600 md:text-2xl">
								{pricing.label}
							</span>
							{hasSale && displayCompareAtPrice && (
								<span className="text-sm font-medium text-gray-400 line-through">
									{formatPrice(displayCompareAtPrice, product.currency)}
								</span>
							)}
						</div>

						{/* Options & Variants Selector */}
						{effectiveOptions && effectiveOptions.length > 0 && (
							<div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-gray-50/60 p-3.5 sm:p-4">
								{effectiveOptions.map((opt) => (
									<div key={opt.name} className="flex flex-col gap-2">
										<div className="flex items-center justify-between text-xs font-semibold text-gray-700">
											<span>
												{opt.name}:{' '}
												<strong className="font-bold text-gray-900">
													{selectedOptions[opt.name] || 'Select'}
												</strong>
											</span>
										</div>

										<div className="flex flex-wrap gap-2">
											{opt.values.map((val) => {
												const isSelected = selectedOptions[opt.name] === val
												const testOptions = {
													...selectedOptions,
													[opt.name]: val,
												}
												const matchedVariant = product.variants?.find((v) => {
													if (!v.options?.length) {
														return v.title && val === v.title.trim()
													}
													return v.options.every(
														(o) =>
															o.name &&
															o.value &&
															testOptions[o.name]?.trim().toLowerCase() ===
																o.value.trim().toLowerCase(),
													)
												})
												const isOptionOutOfStock =
													matchedVariant &&
													typeof matchedVariant.stock === 'number' &&
													matchedVariant.stock <= 0

												const variantImg = matchedVariant?.image
												const hasVariantImage = Boolean(
													variantImg &&
													(variantImg.asset ||
														variantImg.url ||
														typeof variantImg === 'string'),
												)

												// If variant has an image -> Show image swatch
												if (hasVariantImage) {
													return (
														<button
															key={val}
															type="button"
															onClick={() => handleOptionSelect(opt.name, val)}
															className={`relative flex h-10 w-10 flex-none cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all ${
																isSelected
																	? 'scale-105 border-blue-600 shadow-xs ring-2 ring-blue-600/30'
																	: isOptionOutOfStock
																		? 'border-gray-200 opacity-40 grayscale'
																		: 'border-gray-200 hover:border-blue-400'
															}`}
															title={`${val}${isOptionOutOfStock ? ' (Out of stock)' : ''}`}
														>
															<ResponsiveImage
																image={variantImg}
																desktop={{ width: 80 }}
																mobile={{ width: 80 }}
																className="h-full w-full object-cover"
															/>
															{isOptionOutOfStock && (
																<div className="absolute inset-0 flex items-center justify-center bg-black/40">
																	<div className="h-0.5 w-full -rotate-45 bg-white" />
																</div>
															)}
														</button>
													)
												}

												// Otherwise -> Show text button
												return (
													<button
														key={val}
														type="button"
														onClick={() => handleOptionSelect(opt.name, val)}
														className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all ${
															isSelected
																? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
																: isOptionOutOfStock
																	? 'border-gray-200 bg-gray-100 text-gray-400 line-through opacity-60'
																	: 'border-border bg-surface text-foreground hover:border-primary hover:text-primary'
														}`}
													>
														{val}
													</button>
												)
											})}
										</div>
									</div>
								))}
							</div>
						)}

						{/* Quantity Stepper */}
						<div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
							<div className="flex items-center gap-3">
								<span className="text-xs font-semibold text-gray-700">
									Quantity:
								</span>
								<div className="flex items-center rounded-lg border border-gray-200 bg-gray-50">
									<button
										type="button"
										onClick={() => setQuantity((q) => Math.max(1, q - 1))}
										className="flex h-8 w-8 items-center justify-center text-gray-600 hover:text-black"
									>
										<FiMinus className="h-3 w-3" />
									</button>
									<span className="w-8 text-center text-xs font-bold text-gray-900">
										{quantity}
									</span>
									<button
										type="button"
										onClick={() => setQuantity((q) => q + 1)}
										className="flex h-8 w-8 items-center justify-center text-gray-600 hover:text-black"
									>
										<FiPlus className="h-3 w-3" />
									</button>
								</div>
							</div>

							{/* Variant Stock Status */}
							{variantStock !== undefined && (
								<span
									className={`text-xs font-medium ${
										isVariantOutOfStock
											? 'font-semibold text-red-500'
											: 'text-gray-500'
									}`}
								>
									{isVariantOutOfStock
										? 'Out of stock'
										: `${variantStock} in stock`}
								</span>
							)}
						</div>
					</div>

					{/* Action Buttons & Link */}
					<div className="mt-6 flex flex-col gap-2.5 border-t border-gray-100 pt-4">
						<button
							type="button"
							onClick={handleAddToCart}
							disabled={isVariantOutOfStock}
							className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition active:scale-[0.99] ${
								isVariantOutOfStock
									? 'cursor-not-allowed bg-gray-300'
									: 'bg-black hover:bg-gray-900'
							}`}
						>
							<FiShoppingBag className="h-4 w-4" />
							<span>
								{isVariantOutOfStock ? 'Out of stock' : 'Add to Cart'}
							</span>
						</button>

						<Link
							href={`/${ROUTES.products}/${product.slug}`}
							onClick={onClose}
							className="text-primary block text-center text-xs font-semibold transition hover:underline"
						>
							View product details →
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
