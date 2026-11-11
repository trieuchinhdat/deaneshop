'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
	HiOutlineBuildingStorefront,
	HiOutlineCheckCircle,
	HiOutlineDocumentText,
	HiOutlineInformationCircle,
	HiOutlineShoppingBag,
	HiOutlineSparkles,
	HiOutlineTrash,
	HiXMark,
} from 'react-icons/hi2'
import { ROUTES } from '@/lib/env'
import { cn, formatPrice } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import { useCartStore } from '@/store/use-cart-store'
import CartVariantSelector from '@/ui/cart/cart-variant-selector'

interface CartDrawerProps {
	isOpen: boolean
	onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
	const [shouldRender, setShouldRender] = useState(false)
	const [isVisible, setIsVisible] = useState(false)

	const items = useCartStore((state) => state.items)
	const removeItem = useCartStore((state) => state.removeItem)
	const updateQuantity = useCartStore((state) => state.updateQuantity)
	const totalPrice = useCartStore((state) => state.totalPrice)
	const getItemEffectivePrice = useCartStore(
		(state) => state.getItemEffectivePrice,
	)
	const getItemTierUpsell = useCartStore((state) => state.getItemTierUpsell)
	const totalItemsCount = useCartStore((state) => state.totalItemsCount)

	// Control open / close lifecycle for smooth transition
	useEffect(() => {
		let timer: NodeJS.Timeout
		if (isOpen) {
			setShouldRender(true)
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
			}, 300)
		}

		return () => {
			clearTimeout(timer)
			document.body.style.overflow = ''
		}
	}, [isOpen])

	const handleClose = () => {
		setIsVisible(false)
		setTimeout(() => {
			onClose()
		}, 300)
	}

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				handleClose()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen])

	if (!shouldRender) return null

	const total = totalPrice()
	const totalCount = totalItemsCount()

	const getItemImageUrl = (image: any): string => {
		if (!image) return '/fallback-image.png'
		if (typeof image === 'string') return image
		if (image?.asset?.url) return image.asset.url
		try {
			return urlFor(image).width(180).height(180).url()
		} catch {
			return '/fallback-image.png'
		}
	}

	return (
		<div
			className="fixed inset-0 z-[100] overflow-hidden"
			role="dialog"
			aria-modal="true"
		>
			{/* Backdrop Overlay */}
			<div
				className={cn(
					'fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out',
					isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
				)}
				onClick={handleClose}
				aria-hidden="true"
			/>

			{/* Sliding Drawer Container */}
			<div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
				<div
					className={cn(
						'pointer-events-auto flex w-screen max-w-md transform flex-col justify-between bg-white text-gray-900 shadow-2xl transition-transform duration-300 ease-in-out',
						isVisible ? 'translate-x-0' : 'translate-x-full',
					)}
				>
					{/* Header */}
					<div className="border-stroke/20 border-b bg-gray-50/80 px-6 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<div className="rounded-xl bg-slate-900 p-2 text-white">
									<HiOutlineDocumentText className="text-xl text-emerald-400" />
								</div>
								<div>
									<h2 className="text-base font-bold text-gray-900">
										Wholesale Quote List (RFQ)
									</h2>
									<p className="text-xs text-gray-500">
										{items.length} {items.length === 1 ? 'item' : 'items'} (
										{totalCount.toLocaleString()}{' '}
										{totalCount === 1 ? 'unit' : 'units'})
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={handleClose}
								className="flex size-9 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900"
								aria-label="Close quote list"
							>
								<HiXMark className="text-xl" />
							</button>
						</div>

						{/* Automated Smart Pricing Notice */}
						<div className="mt-3 flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-800">
							<HiOutlineSparkles className="flex-none text-xs text-emerald-600" />
							<span>
								Volume tier discounts & variant pooling automatically applied.
							</span>
						</div>
					</div>

					{/* List Items */}
					<div className="divide-stroke/15 flex-1 divide-y overflow-y-auto px-6 py-4">
						{items.length === 0 ? (
							<div className="flex h-full flex-col items-center justify-center py-16 text-center">
								<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
									<HiOutlineDocumentText className="text-3xl" />
								</div>
								<p className="mb-1 text-base font-semibold text-gray-900">
									Your quote list is empty
								</p>
								<p className="mb-6 max-w-[260px] text-xs text-gray-500">
									Explore our catalog to add wholesale items or sample packages
									to your RFQ inquiry.
								</p>
								<button
									type="button"
									onClick={handleClose}
									className="cursor-pointer rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-slate-800"
								>
									Explore Catalog
								</button>
							</div>
						) : (
							items.map((item) => {
								const imgSrc = getItemImageUrl(item.image)
								const effectivePrice = getItemEffectivePrice(item)
								const tierInfo = getItemTierUpsell(item)
								const isTierDiscounted = effectivePrice < item.price

								return (
									<div
										key={item.id}
										className="space-y-2.5 py-4 first:pt-0 last:pb-0"
									>
										<div className="flex items-center gap-3.5">
											<div className="border-stroke/30 relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-gray-100">
												<img
													src={imgSrc}
													alt={item.title}
													className="h-full w-full object-cover"
													onError={(e) => {
														;(e.currentTarget as HTMLImageElement).src =
															'/fallback-image.png'
													}}
													loading="lazy"
												/>
											</div>

											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-1.5">
													<h3 className="truncate text-sm font-semibold text-gray-900">
														{item.productTitle ||
															item.title.replace(/\s*\([^)]*\)$/, '').trim()}
													</h3>
												</div>

												{tierInfo.isTierActive && (
													<span className="mt-0.5 inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
														<HiOutlineCheckCircle className="text-[11px]" />
														Volume Tier Unlocked
													</span>
												)}

												<CartVariantSelector item={item} />

												<div className="mt-2 flex items-center justify-between">
													<div className="border-stroke/40 flex items-center overflow-hidden rounded-lg border bg-white shadow-2xs">
														<button
															type="button"
															className="flex size-7 cursor-pointer items-center justify-center text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
															onClick={() =>
																updateQuantity(item.id, item.quantity - 1)
															}
															aria-label="Decrease quantity"
														>
															-
														</button>
														<input
															type="number"
															className="focus:ring-primary/40 w-12 [appearance:textfield] border-none py-0.5 text-center text-xs font-bold text-gray-900 outline-none focus:ring-1 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
															value={item.quantity}
															onChange={(e) => {
																const val = parseInt(e.target.value, 10)
																if (!isNaN(val) && val >= 1) {
																	updateQuantity(item.id, val)
																}
															}}
														/>
														<button
															type="button"
															className="flex size-7 cursor-pointer items-center justify-center text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
															onClick={() =>
																updateQuantity(item.id, item.quantity + 1)
															}
															aria-label="Increase quantity"
														>
															+
														</button>
													</div>

													<div className="text-right">
														<div className="flex items-center justify-end gap-1">
															{isTierDiscounted && (
																<span className="text-[11px] text-gray-400 line-through">
																	{formatPrice(item.price * item.quantity)}
																</span>
															)}
															<span className="text-primary text-sm font-bold">
																{formatPrice(effectivePrice * item.quantity)}
															</span>
														</div>
														<div className="text-[10px] text-gray-500">
															{formatPrice(effectivePrice)} / unit
														</div>
													</div>
												</div>
											</div>

											<button
												type="button"
												onClick={() => removeItem(item.id)}
												className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
												title="Remove item"
												aria-label="Remove item"
											>
												<HiOutlineTrash className="text-base" />
											</button>
										</div>

										{/* Smart Next Tier Upsell Hint */}
										{tierInfo.nextTier &&
											typeof tierInfo.unitsNeeded === 'number' &&
											tierInfo.unitsNeeded > 0 && (
												<div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200/60 bg-amber-50/70 p-2 text-[11px] text-amber-900">
													<div className="line-clamp-1">
														Add{' '}
														<b className="font-bold text-amber-950">
															{tierInfo.unitsNeeded} more
														</b>{' '}
														for{' '}
														<b className="text-primary font-bold">
															{formatPrice(tierInfo.nextTier.unitPrice)}/unit
														</b>
														{tierInfo.savingsPercent
															? ` (Save ${tierInfo.savingsPercent}%)`
															: ''}
													</div>
													<button
														type="button"
														onClick={() =>
															updateQuantity(
																item.id,
																item.quantity + tierInfo.unitsNeeded!,
															)
														}
														className="shrink-0 cursor-pointer rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white transition hover:bg-amber-700"
													>
														+ Add {tierInfo.unitsNeeded}
													</button>
												</div>
											)}
									</div>
								)
							})
						)}
					</div>

					{/* Footer Summary & CTAs */}
					{items.length > 0 && (
						<div className="border-stroke/20 border-t bg-gray-50/80 p-5">
							<div className="mb-1 flex items-center justify-between">
								<span className="text-xs font-semibold text-gray-700">
									Estimated Batch Total (FOB):
								</span>
								<span className="text-lg font-black text-slate-900">
									{formatPrice(total)}
								</span>
							</div>
							<p className="mb-3.5 text-[11px] leading-snug text-gray-500">
								No payment required today. An export specialist calculates
								door-to-door or container shipping rates and issues an official
								Proforma Invoice.
							</p>

							<div className="grid grid-cols-1 gap-2.5">
								<Link
									href={`/${ROUTES.checkout}?mode=rfq`}
									onClick={handleClose}
									className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-center text-xs font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg"
								>
									<HiOutlineDocumentText className="text-base text-emerald-400" />
									<span>Submit Multi-Item RFQ</span>
								</Link>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
