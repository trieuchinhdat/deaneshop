'use client'

import { useEffect, useMemo, useState } from 'react'
import {
	FiAlertCircle,
	FiCheck,
	FiInfo,
	FiLoader,
	FiMinus,
	FiPlus,
	FiRefreshCw,
	FiX,
} from 'react-icons/fi'
import { showSimpleToast } from '@/lib/toast'
import { cn, formatPrice } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import {
	CartItem,
	ProductOption,
	ProductVariant,
	useCartStore,
} from '@/store/use-cart-store'

interface CartVariantModalProps {
	isOpen: boolean
	item: CartItem | null
	onClose: () => void
}

function getColorCode(colorName: string): string {
	const map: Record<string, string> = {
		Black: '#000000',
		White: '#FFFFFF',
		Red: '#EF4444',
		Blue: '#3B82F6',
		Green: '#10B981',
		Navy: '#1E3A8A',
		Yellow: '#F59E0B',
		Pink: '#EC4899',
		Gray: '#6B7280',
		Orange: '#F97316',
		Purple: '#8B5CF6',
		Brown: '#78350F',
		Beige: '#F5F5DC',
		Cream: '#FFFDD0',
		Silver: '#CBD5E1',
		Teal: '#06B6D4',
		Olive: '#4D7C0F',
	}
	return map[colorName] || map[colorName?.trim()] || '#D1D5DB'
}

export default function CartVariantModal({
	isOpen,
	item,
	onClose,
}: CartVariantModalProps) {
	const cartItems = useCartStore((state) => state.items)
	const updateVariant = useCartStore((state) => state.updateVariant)
	const updateItemData = useCartStore((state) => state.updateItemData)

	const [shouldRender, setShouldRender] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [fetchedProduct, setFetchedProduct] = useState<any>(null)
	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string>
	>({})
	const [quantity, setQuantity] = useState(1)

	// Manage slide/fade animation
	useEffect(() => {
		let timer: NodeJS.Timeout
		if (isOpen && item) {
			setShouldRender(true)
			setQuantity(item.quantity || 1)
			setSelectedOptions(item.selectedOptions || {})
			document.body.style.overflow = 'hidden'

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsVisible(true)
				})
			})
		} else {
			setIsVisible(false)
			document.body.style.overflow = ''
			timer = setTimeout(() => {
				setShouldRender(false)
				setFetchedProduct(null)
			}, 300)
		}

		return () => {
			clearTimeout(timer)
			document.body.style.overflow = ''
		}
	}, [isOpen, item])

	// Smooth close
	const handleClose = () => {
		setIsVisible(false)
		setTimeout(() => {
			onClose()
		}, 300)
	}

	// Escape key listener
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				handleClose()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen])

	// Automatically fetch options & variants if CartItem does not have them cached
	useEffect(() => {
		if (!isOpen || !item) return

		const hasExistingVariants =
			Array.isArray(item.variants) && item.variants.length > 0
		if (hasExistingVariants) {
			return
		}

		let isCancelled = false
		setIsLoading(true)

		const params = new URLSearchParams()
		if (item.productId) params.set('productId', item.productId)
		if (item.slug) params.set('slug', item.slug)

		fetch(`/api/products/variants?${params.toString()}`)
			.then((res) => res.json())
			.then((data) => {
				if (isCancelled) return
				if (data.success && data.product) {
					setFetchedProduct(data.product)
					// Update store metadata for future reuse
					updateItemData(item.id, {
						options: data.product.options || [],
						variants: data.product.variants || [],
						productTitle: data.product.title,
						hasVariants:
							data.product.hasVariants ||
							Boolean(data.product.variants?.length),
					})
				}
				setIsLoading(false)
			})
			.catch((err) => {
				console.error('[FETCH_VARIANTS_ERROR]', err)
				if (!isCancelled) setIsLoading(false)
			})

		return () => {
			isCancelled = true
		}
	}, [isOpen, item?.id, item?.productId, item?.slug, item?.variants])

	// Unified options & variants source
	const availableVariants: ProductVariant[] = useMemo(() => {
		if (item?.variants && item.variants.length > 0) return item.variants
		if (fetchedProduct?.variants && fetchedProduct.variants.length > 0)
			return fetchedProduct.variants
		return []
	}, [item?.variants, fetchedProduct?.variants])

	const availableOptions: ProductOption[] = useMemo(() => {
		if (item?.options && item.options.length > 0) return item.options
		if (fetchedProduct?.options && fetchedProduct.options.length > 0)
			return fetchedProduct.options

		if (availableVariants.length > 0) {
			const optionsMap = new Map<string, Set<string>>()
			availableVariants.forEach((v) => {
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

			const result: ProductOption[] = []
			optionsMap.forEach((valuesSet, name) => {
				result.push({ name, values: Array.from(valuesSet) })
			})
			return result
		}

		return []
	}, [item?.options, fetchedProduct?.options, availableVariants])

	// Initialize selected options if incomplete
	useEffect(() => {
		if (availableOptions.length > 0) {
			setSelectedOptions((prev) => {
				const next = { ...prev }
				let hasChanges = false

				availableOptions.forEach((opt) => {
					if (!next[opt.name] && opt.values && opt.values.length > 0) {
						next[opt.name] = opt.values[0]
						hasChanges = true
					}
				})

				// If item has variantTitle and options only has 1 group
				if (item?.variantTitle && availableOptions.length === 1) {
					const singleOpt = availableOptions[0]
					if (
						singleOpt.values.includes(item.variantTitle) &&
						next[singleOpt.name] !== item.variantTitle
					) {
						next[singleOpt.name] = item.variantTitle
						hasChanges = true
					}
				}

				return hasChanges ? next : prev
			})
		}
	}, [availableOptions, item?.variantTitle])

	// Find Variant matching Selected Options
	const activeVariant = useMemo(() => {
		if (!availableVariants.length) return null

		const matched = availableVariants.find((v) => {
			if (!v.options || v.options.length === 0) {
				if (
					v.title &&
					(selectedOptions['Variant'] === v.title.trim() ||
						selectedOptions['Option'] === v.title.trim())
				)
					return true
				if (
					v.title &&
					availableOptions[0]?.name &&
					selectedOptions[availableOptions[0].name] === v.title.trim()
				) {
					return true
				}
				return false
			}
			return v.options.every(
				(opt) =>
					opt.name && opt.value && selectedOptions[opt.name] === opt.value,
			)
		})

		return matched || availableVariants[0]
	}, [availableVariants, selectedOptions, availableOptions])

	if (!shouldRender || !item) return null

	// Safely extract image URL
	const getItemImageUrl = (image: any): string => {
		if (!image) return '/fallback-image.png'
		if (typeof image === 'string') return image
		if (image?.asset?.url) return image.asset.url
		try {
			return urlFor(image).width(200).height(200).url()
		} catch {
			return '/fallback-image.png'
		}
	}

	const displayImage = activeVariant?.image
		? getItemImageUrl(activeVariant.image)
		: getItemImageUrl(item.image)

	const displayPrice =
		typeof activeVariant?.price === 'number' && activeVariant.price > 0
			? activeVariant.price
			: item.price

	const displayCompareAtPrice =
		typeof activeVariant?.compareAtPrice === 'number' &&
		activeVariant.compareAtPrice > 0
			? activeVariant.compareAtPrice
			: item.compareAtPrice

	const hasDiscount =
		Boolean(displayCompareAtPrice) &&
		(displayCompareAtPrice as number) > displayPrice &&
		displayPrice > 0

	const discountPercent = hasDiscount
		? Math.round(
				(((displayCompareAtPrice as number) - displayPrice) /
					(displayCompareAtPrice as number)) *
					100,
			)
		: 0

	const stockCount =
		typeof activeVariant?.stock === 'number' ? activeVariant.stock : undefined
	const isOutOfStock = stockCount !== undefined && stockCount <= 0

	// Check if newly selected variant is identical to current item variant
	const isSameAsCurrent = Boolean(
		activeVariant &&
			(activeVariant._key === item.variantId ||
				activeVariant.sku === item.variantId ||
				activeVariant.title === item.variantTitle) &&
			quantity === item.quantity,
	)

	// Check if newly selected variant already exists in another cart line item
	const targetCartItemId =
		item.productId && activeVariant
			? `${item.productId}_${activeVariant._key || activeVariant.sku}`
			: activeVariant?.sku || activeVariant?._key || ''

	const existingOtherItem = cartItems.find(
		(ci) => ci.id === targetCartItemId && ci.id !== item.id,
	)

	const handleOptionSelect = (groupName: string, value: string) => {
		setSelectedOptions((prev) => ({
			...prev,
			[groupName]: value,
		}))
	}

	const handleConfirmUpdate = () => {
		if (!activeVariant) return

		const newVariantId = (activeVariant._key ||
			activeVariant.sku ||
			activeVariant.title ||
			'default') as string

		const itemSku = activeVariant.sku || item.sku || ''
		const baseTitle =
			item.productTitle || item.title.replace(/\s*\([^)]*\)$/, '').trim()
		const newTitle = activeVariant.title
			? `${baseTitle} (${activeVariant.title})`
			: baseTitle

		const newImage = activeVariant.image || item.image

		updateVariant(item.id, {
			variantId: newVariantId,
			variantTitle: activeVariant.title,
			selectedOptions,
			sku: itemSku,
			title: newTitle,
			price: displayPrice,
			compareAtPrice: displayCompareAtPrice,
			image: newImage,
			quantity,
		})

		handleClose()

		showSimpleToast({
			title: 'Variant updated',
			subtitle: activeVariant.title || 'New variant',
			timer: 3000,
		})
	}

	return (
		<div
			className="fixed inset-0 z-[120] overflow-y-auto overflow-x-hidden flex items-end md:items-center justify-center"
			role="dialog"
			aria-modal="true"
		>
			{/* Backdrop Overlay */}
			<div
				className={cn(
					'fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out',
					isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
				)}
				onClick={handleClose}
				aria-hidden="true"
			/>

			{/* Modal Card / Bottom Sheet Container */}
			<div
				className={cn(
					'relative z-10 w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out max-h-[90vh] flex flex-col',
					isVisible
						? 'translate-y-0 opacity-100 scale-100'
						: 'translate-y-full md:translate-y-4 opacity-0 md:scale-95 pointer-events-none',
				)}
			>
				{/* Mobile Drag Indicator */}
				<div className="md:hidden flex justify-center pt-3 pb-1">
					<div className="w-12 h-1.5 rounded-full bg-gray-300/80" />
				</div>

				{/* Modal Header */}
				<div className="flex items-center justify-between px-5 py-3.5 border-b border-stroke/20 bg-gray-50/70">
					<div className="flex items-center gap-2">
						<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<FiRefreshCw className="text-sm" />
						</span>
						<h3 className="text-sm font-bold text-gray-900">
							Change Product Variant
						</h3>
					</div>
					<button
						type="button"
						onClick={handleClose}
						className="size-11 flex items-center justify-center rounded-full text-gray-600 hover:text-gray-900 hover:bg-black/5 transition-colors cursor-pointer"
						aria-label="Close modal"
					>
						<FiX className="text-xl" />
					</button>
				</div>

				{/* Modal Body */}
				<div className="flex-1 overflow-y-auto p-5 space-y-5">
					{/* Product Preview Card */}
					<div className="flex gap-4 p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/70">
						<div className="relative w-20 h-20 rounded-lg overflow-hidden border border-stroke/30 bg-white shrink-0 shadow-2xs">
							<img
								src={displayImage}
								alt={item.title}
								className="w-full h-full object-cover transition-transform duration-200"
								onError={(e) => {
									;(e.currentTarget as HTMLImageElement).src =
										'/fallback-image.png'
								}}
							/>
							{hasDiscount && (
								<span className="absolute top-1 left-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
									-{discountPercent}%
								</span>
							)}
						</div>

						<div className="flex-1 min-w-0">
							<h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
								{item.productTitle ||
									item.title.replace(/\s*\([^)]*\)$/, '').trim()}
							</h4>

							<div className="flex items-baseline gap-2 mt-1.5">
								<span className="text-base font-extrabold text-primary">
									{formatPrice(displayPrice)}
								</span>
								{hasDiscount && (
									<span className="text-xs text-gray-600 line-through">
										{formatPrice(displayCompareAtPrice as number)}
									</span>
								)}
							</div>

							<div className="flex items-center gap-2 mt-1">
								{activeVariant?.title && (
									<span className="inline-flex items-center text-[11px] font-medium text-gray-600 bg-white px-2 py-0.5 rounded border border-stroke/30">
										Selected:{' '}
										<strong className="ml-1 text-gray-900">
											{activeVariant.title}
										</strong>
									</span>
								)}

								{isOutOfStock ? (
									<span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
										Out of stock
									</span>
								) : typeof stockCount === 'number' && stockCount <= 5 ? (
									<span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
										Only {stockCount} items left
									</span>
								) : (
									<span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
										In stock
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Loading State */}
					{isLoading && (
						<div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-400">
							<FiLoader className="text-2xl animate-spin text-primary" />
							<span className="text-xs font-medium">
								Loading product options...
							</span>
						</div>
					)}

					{/* Options Selector List */}
					{!isLoading && availableOptions.length > 0 && (
						<div className="space-y-4">
							{availableOptions.map((group) => {
								const isColorGroup =
									group.name.toLowerCase().includes('color')

								return (
									<div key={group.name} className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
												{group.name}:
											</span>
											<span className="text-xs font-semibold text-primary">
												{selectedOptions[group.name] || 'Select'}
											</span>
										</div>

										<div className="flex flex-wrap gap-2">
											{group.values.map((val) => {
												const isSelected = selectedOptions[group.name] === val
												const colorHex = isColorGroup
													? getColorCode(val)
													: null

												if (isColorGroup) {
													return (
														<button
															key={val}
															type="button"
															onClick={() =>
																handleOptionSelect(group.name, val)
															}
															className={cn(
																'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer',
																isSelected
																	? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-2xs font-semibold'
																	: 'border-stroke/40 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50',
															)}
														>
															<span
																className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
																style={{ backgroundColor: colorHex || '#ccc' }}
															/>
															<span>{val}</span>
															{isSelected && (
																<FiCheck className="text-primary text-xs" />
															)}
														</button>
													)
												}

												return (
													<button
														key={val}
														type="button"
														onClick={() => handleOptionSelect(group.name, val)}
														className={cn(
															'px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer',
															isSelected
																? 'border-primary bg-primary text-white shadow-2xs font-semibold'
																: 'border-stroke/40 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50',
														)}
													>
														{val}
													</button>
												)
											})}
										</div>
									</div>
								)
							})}
						</div>
					)}

					{/* No Variants Fallback */}
					{!isLoading && availableOptions.length === 0 && (
						<div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-amber-800 text-xs">
							<FiInfo className="text-base shrink-0 mt-0.5" />
							<div>
								<p className="font-semibold">
									This item is available in a single variant only.
								</p>
								<p className="text-amber-700 mt-0.5">
									You can adjust the quantity or verify item specifications.
								</p>
							</div>
						</div>
					)}

					{/* Quantity Control */}
					<div className="flex items-center justify-between pt-2 border-t border-stroke/20">
						<div>
							<span className="text-xs font-bold text-gray-800">
								Quantity:
							</span>
							<p className="text-[11px] text-gray-500">
								Estimated Subtotal:{' '}
								<strong className="text-primary font-bold">
									{formatPrice(displayPrice * quantity)}
								</strong>
							</p>
						</div>

						<div className="flex items-center border border-stroke/40 rounded-xl overflow-hidden bg-white shadow-2xs">
							<button
								type="button"
								onClick={() => setQuantity((q) => Math.max(1, q - 1))}
								className="size-11 flex items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
								aria-label="Decrease quantity"
							>
								<FiMinus className="text-sm" />
							</button>
							<span className="px-3 py-1 text-sm font-bold text-gray-900 min-w-[36px] text-center select-none">
								{quantity}
							</span>
							<button
								type="button"
								onClick={() => setQuantity((q) => q + 1)}
								className="size-11 flex items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
								aria-label="Increase quantity"
							>
								<FiPlus className="text-sm" />
							</button>
						</div>
					</div>

					{/* Existing Variant Merge Notification */}
					{existingOtherItem && (
						<div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-800 text-xs flex items-start gap-2">
							<FiAlertCircle className="text-sm shrink-0 mt-0.5 text-blue-600" />
							<div>
								<p className="font-semibold">
									This variant is already in your cart ({existingOtherItem.quantity}{' '}
									units).
								</p>
								<p className="text-blue-700 mt-0.5">
									Upon confirmation, quantities will automatically merge to{' '}
									<strong>{existingOtherItem.quantity + quantity}</strong> units.
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className="p-4 border-t border-stroke/20 bg-gray-50/70 flex items-center gap-3">
					<button
						type="button"
						onClick={handleClose}
						className="flex-1 py-2.5 px-4 rounded-xl border border-stroke/40 bg-white font-semibold text-xs text-gray-700 hover:bg-gray-100 transition-all shadow-2xs cursor-pointer"
					>
						Cancel
					</button>

					<button
						type="button"
						disabled={Boolean(isOutOfStock || isSameAsCurrent)}
						onClick={handleConfirmUpdate}
						className={cn(
							'flex-[2] py-2.5 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer',
							isOutOfStock
								? 'bg-gray-300 text-gray-500 cursor-not-allowed'
								: isSameAsCurrent
									? 'bg-gray-200 text-gray-500 cursor-not-allowed'
									: 'bg-primary hover:opacity-90 active:scale-[0.98]',
						)}
					>
						{isOutOfStock ? (
							'Variant is Out of Stock'
						) : isSameAsCurrent ? (
							'Current Selection'
						) : (
							<>
								<FiCheck className="text-sm" />
								<span>Confirm Changes</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}
