'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FiCheck, FiFilm, FiMinus, FiPlay, FiPlus, FiShoppingBag, FiX } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { ROUTES } from '@/lib/env'
import { formatVND } from '@/lib/utils'
import { useCartStore } from '@/store/use-cart-store'
import ResponsiveImage from '@/ui/responsiveImage'
import { parseVideoMedia } from '@/ui/img'

type Product = {
	_id: string
	title: string
	slug: string
	price: number
	compareAtPrice?: number
	images?: any[]
	categories?: { title?: string; slug: string }[]
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

type QuickViewModalProps = {
	isOpen: boolean
	product: Product | null
	productSettings?: any
	onClose: () => void
}

function getColorCode(colorName: string): string {
	const map: Record<string, string> = {
		Đen: '#000000',
		Black: '#000000',
		Trắng: '#FFFFFF',
		White: '#FFFFFF',
		Đỏ: '#EF4444',
		Red: '#EF4444',
		Xanh: '#3B82F6',
		Blue: '#3B82F6',
		'Xanh lá': '#10B981',
		Green: '#10B981',
		Vàng: '#F59E0B',
		Yellow: '#F59E0B',
		Hồng: '#EC4899',
		Pink: '#EC4899',
		Xám: '#6B7280',
		Gray: '#6B7280',
		Cam: '#F97316',
		Orange: '#F97316',
		Tím: '#8B5CF6',
		Purple: '#8B5CF6',
		Nâu: '#78350F',
		Brown: '#78350F',
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

	const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
	const [activeImage, setActiveImage] = useState<any>(null)
	const [quantity, setQuantity] = useState(1)

	// Trích xuất Effective Options từ product.options HOẶC tự động từ product.variants
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
				const name = 'Biến thể'
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

	// Khởi tạo Selected Options khi Product được mở
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

	// Khóa cuộn trang Body khi mở Modal & lắng nghe phím Escape
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

	// Tìm Variant khớp với Selected Options
	const activeVariant = useMemo(() => {
		if (!product?.variants?.length) return null
		return (
			product.variants.find((v) => {
				if (!v.options?.length) {
					if (v.title && selectedOptions['Biến thể'] === v.title.trim()) return true
					return false
				}
				return v.options.every(
					(opt) => opt.name && opt.value && selectedOptions[opt.name] === opt.value,
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

	// Giá hiển thị
	const displayPrice =
		activeVariant && typeof activeVariant.price === 'number' && activeVariant.price > 0
			? activeVariant.price
			: product.price

	const displayCompareAtPrice =
		activeVariant &&
		typeof activeVariant.compareAtPrice === 'number' &&
		activeVariant.compareAtPrice > 0
			? activeVariant.compareAtPrice
			: product.compareAtPrice

	const hasSale = Boolean(
		cardShowDiscountBadge &&
			displayCompareAtPrice &&
			displayCompareAtPrice > displayPrice &&
			displayPrice > 0,
	)

	// Đánh giá & Số bán
	const totalReviews = product.reviews?.length ?? 0
	const averageRating =
		totalReviews > 0
			? product.reviews!.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
				totalReviews
			: 0

	// Media hiển thị chính (Ảnh hoặc Video)
	const mainMediaItem = activeImage || activeVariant?.image || product.images?.[0]
	const mainMedia = parseVideoMedia(mainMediaItem)

	// Tồn kho biến thể
	const variantStock =
		activeVariant?.stock !== undefined ? activeVariant.stock : product.stock
	const isVariantOutOfStock = variantStock !== undefined && variantStock <= 0

	const handleOptionSelect = (optionName: string, value: string) => {
		const updated = { ...selectedOptions, [optionName]: value }
		setSelectedOptions(updated)

		// Tự động chọn ảnh của variant nếu khớp
		const matchedVar = product.variants?.find((v) => {
			if (!v.options?.length) {
				return v.title && value === v.title.trim()
			}
			return v.options.every((o) => o.name && o.value && updated[o.name] === o.value)
		})
		if (matchedVar?.image) {
			setActiveImage(matchedVar.image)
		}
	}

	const handleAddToCart = () => {
		const variantId = activeVariant?._key || activeVariant?.sku
		const cartItemId = variantId ? `${product._id}_${variantId}` : product._id || product.slug

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
		})

		onClose()

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
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
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

				{/* Cột Trái: Media Gallery */}
				<div className="flex w-full flex-col bg-gray-50 p-4 md:w-1/2 md:p-6 justify-center border-b md:border-b-0 md:border-r border-gray-100">
					<div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white shadow-xs flex items-center justify-center">
						{mainMedia?.type === 'video' || mainMedia?.type === 'videoUrl' ? (
							<div className="relative h-full w-full bg-black flex items-center justify-center">
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
									? `- ${formatVND(displayCompareAtPrice - displayPrice)}`
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
								const isVideo = media?.type === 'video' || media?.type === 'videoUrl'
								const isSelected =
									activeImage === img || (!activeImage && idx === 0)

								return (
									<button
										key={idx}
										type="button"
										onClick={() => setActiveImage(img)}
										className={`relative h-14 w-14 flex-none overflow-hidden rounded-lg border-2 transition ${
											isSelected
												? 'border-black ring-2 ring-black/10 opacity-100'
												: 'border-transparent opacity-60 hover:opacity-100'
										}`}
									>
										{isVideo ? (
											<div className="relative h-full w-full bg-black overflow-hidden rounded-md">
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
													<div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white shadow-xs backdrop-blur-2xs">
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

				{/* Cột Phải: Product Info & Order Actions */}
				<div className="flex w-full flex-col overflow-y-auto p-5 md:w-1/2 md:p-6 justify-between">
					<div>
						{/* Category */}
						{cardShowCategory && product.categories?.[0]?.title && (
							<span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
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
									<span className="text-yellow-400">★</span>
									<span>{averageRating.toFixed(1)}</span>
									<span className="text-gray-400">({totalReviews} đánh giá)</span>
								</div>
							)}
							{cardShowRating && cardShowSoldCount && totalReviews > 0 && (
								<span>•</span>
							)}
							{cardShowSoldCount && typeof product.sold === 'number' && (
								<span>Đã bán {product.sold}</span>
							)}
							{activeVariant?.sku && (
								<>
									<span>•</span>
									<span className="font-mono text-gray-400">SKU: {activeVariant.sku}</span>
								</>
							)}
						</div>

						{/* Price Display */}
						<div className="mt-3 flex items-baseline gap-2">
							<span className="text-xl font-extrabold text-red-600 md:text-2xl">
								{displayPrice === 0 ? 'Liên hệ' : formatVND(displayPrice)}
							</span>
							{hasSale && displayCompareAtPrice && (
								<span className="text-sm font-medium text-gray-400 line-through">
									{formatVND(displayCompareAtPrice)}
								</span>
							)}
						</div>

						{/* Options & Variants Selector (Dạng Text như trang chi tiết sản phẩm) */}
						{effectiveOptions && effectiveOptions.length > 0 && (
							<div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-gray-50/60 p-3.5 sm:p-4">
								{effectiveOptions.map((opt) => (
									<div key={opt.name} className="flex flex-col gap-2">
										<div className="flex items-center justify-between text-xs font-semibold text-gray-700">
											<span>
												{opt.name}:{' '}
												<strong className="font-bold text-gray-900">
													{selectedOptions[opt.name] || 'Chọn'}
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

												// Nếu có thiết lập hình ảnh màu -> Hiển thị hình ảnh
												if (hasVariantImage) {
													return (
														<button
															key={val}
															type="button"
															onClick={() => handleOptionSelect(opt.name, val)}
															className={`relative flex h-10 w-10 flex-none cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all ${
																isSelected
																	? 'border-blue-600 ring-2 ring-blue-600/30 shadow-xs scale-105'
																	: isOptionOutOfStock
																		? 'border-gray-200 opacity-40 grayscale'
																		: 'border-gray-200 hover:border-blue-400'
															}`}
															title={`${val}${isOptionOutOfStock ? ' (Hết hàng)' : ''}`}
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

												// Ngược lại (không có hình ảnh màu) -> Hiển thị dạng Text
												return (
													<button
														key={val}
														type="button"
														onClick={() => handleOptionSelect(opt.name, val)}
														className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all ${
															isSelected
																? 'border-blue-600 bg-blue-600 font-semibold text-white shadow-xs'
																: isOptionOutOfStock
																	? 'border-gray-200 bg-gray-100 text-gray-400 line-through opacity-60'
																	: 'border-gray-300 bg-white text-gray-800 hover:border-blue-500 hover:text-blue-600'
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
								<span className="text-xs font-semibold text-gray-700">Số lượng:</span>
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
										isVariantOutOfStock ? 'text-red-500 font-semibold' : 'text-gray-500'
									}`}
								>
									{isVariantOutOfStock ? 'Hết hàng' : `Còn ${variantStock} sản phẩm`}
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
							<span>{isVariantOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}</span>
						</button>

						<Link
							href={`/${ROUTES.products}/${product.slug}`}
							onClick={onClose}
							className="block text-center text-xs font-semibold text-blue-600 transition hover:underline"
						>
							Xem thông tin chi tiết sản phẩm →
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
