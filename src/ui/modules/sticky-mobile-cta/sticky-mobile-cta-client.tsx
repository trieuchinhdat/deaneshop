'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
	FiArrowRight,
	FiCheck,
	FiExternalLink,
	FiHelpCircle,
	FiPhone,
	FiShield,
	FiX,
} from 'react-icons/fi'
import { FaStar, FaWhatsapp } from 'react-icons/fa6'
import { cn, formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/use-cart-store'
import Img from '@/ui/img'

export interface StickyMobileCTAClientProps {
	title?: string
	image?: any
	linkedProduct?: any
	badge?: string
	price?: string
	originalPrice?: string
	ratingScore?: string
	ratingCount?: string
	ratingText?: string
	trustNote?: string
	actionType?: 'anchor' | 'direct_cart' | 'link'
	primaryButtonText?: string
	primaryButtonLink?: string
	primaryButtonSubtext?: string
	secondaryButtonType?: 'none' | 'whatsapp' | 'phone' | 'link'
	secondaryButtonLabel?: string
	secondaryButtonValue?: string
	barPosition?: 'bottom' | 'top'
	barStyle?: 'docked' | 'floating'
	deviceVisibility?: 'all' | 'mobile_only' | 'desktop_only'
	themeStyle?: 'light' | 'dark' | 'brand' | 'urgent'
	buttonStyle?: 'accent' | 'dark' | 'pulse'
	triggerMode?: 'scroll' | 'target_element' | 'always'
	scrollThreshold?: number
	targetElementId?: string
	autoHideOnTarget?: boolean
	syncWithProduct?: boolean
	allowDismiss?: boolean
	dismissDurationHours?: number
	moduleKey?: string
}

export default function StickyMobileCTAClient({
	title = 'Special Promo Package',
	image,
	linkedProduct,
	badge = 'Save 30%',
	price = '$49.00',
	originalPrice,
	ratingScore = '4.9',
	ratingCount = '(2.4k+ reviews)',
	ratingText,
	trustNote = 'Free shipping & 30-day guarantee',
	actionType = 'anchor',
	primaryButtonText = 'Order Now',
	primaryButtonLink = '#lead-form',
	primaryButtonSubtext,
	secondaryButtonType = 'whatsapp',
	secondaryButtonLabel = 'Chat',
	secondaryButtonValue = '',
	barPosition = 'bottom',
	barStyle = 'docked',
	deviceVisibility = 'all',
	themeStyle = 'light',
	buttonStyle = 'accent',
	triggerMode = 'scroll',
	scrollThreshold = 250,
	targetElementId = 'lead-form',
	autoHideOnTarget = true,
	syncWithProduct = true,
	allowDismiss = false,
	dismissDurationHours = 24,
	moduleKey,
}: StickyMobileCTAClientProps) {
	const addItem = useCartStore((s) => s.addItem)

	const [isMounted, setIsMounted] = useState(false)
	const [isVisible, setIsVisible] = useState(triggerMode === 'always')
	const [isDismissed, setIsDismissed] = useState(false)
	const [isTargetInView, setIsTargetInView] = useState(false)

	// Live Variant & PDP Sync State
	const [livePrice, setLivePrice] = useState<string | null>(null)
	const [liveOriginalPrice, setLiveOriginalPrice] = useState<string | null>(null)
	const [liveBadge, setLiveBadge] = useState<string | null>(null)
	const [liveTitle, setLiveTitle] = useState<string | null>(null)
	const [liveImage, setLiveImage] = useState<any>(null)
	const [liveVariantData, setLiveVariantData] = useState<any>(null)
	const [isAddedFeedback, setIsAddedFeedback] = useState(false)

	const dismissedStorageKey = `sticky_buy_bar_dismissed_${moduleKey || 'global'}`

	// 1. Initial hydration and session dismiss check
	useEffect(() => {
		setIsMounted(true)
		if (allowDismiss) {
			try {
				const storedDismiss = localStorage.getItem(dismissedStorageKey)
				if (storedDismiss) {
					const dismissTime = parseInt(storedDismiss, 10)
					const now = Date.now()
					const maxAge = (dismissDurationHours || 24) * 60 * 60 * 1000
					if (now - dismissTime < maxAge) {
						setIsDismissed(true)
					}
				}
			} catch {
				// Local storage disabled or error
			}
		}
	}, [allowDismiss, dismissDurationHours, dismissedStorageKey])

	// 2. Real-time active variant & PDP synchronization
	useEffect(() => {
		if (!syncWithProduct || typeof window === 'undefined') return

		const handleVariantChange = (e: Event) => {
			const detail = (e as CustomEvent).detail
			if (!detail) return

			if (typeof detail.price === 'number' && detail.price > 0) {
				setLivePrice(formatPrice(detail.price))
			}
			if (
				typeof detail.compareAtPrice === 'number' &&
				detail.compareAtPrice > detail.price
			) {
				setLiveOriginalPrice(formatPrice(detail.compareAtPrice))
				const discount = Math.round(
					((detail.compareAtPrice - detail.price) / detail.compareAtPrice) * 100,
				)
				if (discount > 0) {
					setLiveBadge(`Save ${discount}%`)
				}
			} else if (detail.compareAtPrice) {
				setLiveOriginalPrice(formatPrice(detail.compareAtPrice))
			}
			if (detail.image) {
				setLiveImage(detail.image)
			}
			if (detail.variantTitle) {
				setLiveTitle(`${title} • ${detail.variantTitle}`)
			} else if (detail.title) {
				setLiveTitle(detail.title)
			}
			setLiveVariantData(detail)
		}

		window.addEventListener('product:variant-change', handleVariantChange)
		return () =>
			window.removeEventListener('product:variant-change', handleVariantChange)
	}, [syncWithProduct, title])

	// 3. High-performance scroll detection with requestAnimationFrame
	useEffect(() => {
		if (triggerMode === 'always') {
			setIsVisible(true)
			return
		}

		let ticking = false

		const checkVisibility = () => {
			if (triggerMode === 'target_element') {
				const targetEl =
					document.getElementById(targetElementId || 'lead-form') ||
					document.querySelector(`#${targetElementId || 'lead-form'}`)
				if (targetEl) {
					const rect = targetEl.getBoundingClientRect()
					// Show bar once the trigger element has scrolled past top
					setIsVisible(rect.bottom < 0)
					return
				}
			}

			// Default: Scroll Distance Threshold
			const threshold = scrollThreshold ?? 250
			setIsVisible(window.scrollY > threshold)
		}

		const handleScroll = () => {
			if (!ticking) {
				window.requestAnimationFrame(() => {
					checkVisibility()
					ticking = false
				})
				ticking = true
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		checkVisibility() // Initial run
		return () => window.removeEventListener('scroll', handleScroll)
	}, [triggerMode, scrollThreshold, targetElementId])

	// 4. Auto-hide when target checkout/form section is currently visible in viewport
	useEffect(() => {
		if (!autoHideOnTarget || !primaryButtonLink?.startsWith('#')) {
			setIsTargetInView(false)
			return
		}

		const targetId = primaryButtonLink.replace('#', '')
		const targetEl = document.getElementById(targetId)

		if (!targetEl) return

		const observer = new IntersectionObserver(
			([entry]) => {
				// Auto-hide when target element is in view
				setIsTargetInView(entry.isIntersecting)
			},
			{ threshold: [0, 0.1, 0.5] },
		)

		observer.observe(targetEl)
		return () => observer.disconnect()
	}, [autoHideOnTarget, primaryButtonLink])

	// Handle dismiss click
	const handleDismiss = useCallback(() => {
		setIsDismissed(true)
		try {
			localStorage.setItem(dismissedStorageKey, Date.now().toString())
		} catch {
			// Storage error fallback
		}
	}, [dismissedStorageKey])

	// Handle primary CTA smooth click, anchor scroll, or 1-click cart addition
	const handlePrimaryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		// 1. Direct Add to Cart Action
		if (
			actionType === 'direct_cart' ||
			(syncWithProduct && liveVariantData?.productId)
		) {
			const targetProductId = liveVariantData?.productId || linkedProduct?._id
			if (targetProductId) {
				e.preventDefault()
				const currentItemPrice =
					liveVariantData?.price ?? linkedProduct?.price ?? 0
				const currentVariant = liveVariantData?.variant
				const variantId =
					currentVariant?._key || currentVariant?.sku || liveVariantData?.sku
				const cartItemId = variantId
					? `${targetProductId}-${variantId}`
					: targetProductId
				const cartImage = liveImage || image || linkedProduct?.images?.[0]
				const itemPriceNum =
					typeof currentItemPrice === 'number'
						? currentItemPrice
						: parseFloat(String(currentItemPrice).replace(/[^0-9.]/g, '')) || 0

				addItem({
					id: cartItemId,
					productId: targetProductId,
					productTitle: liveVariantData?.title || linkedProduct?.title || title,
					title: liveVariantData?.title || linkedProduct?.title || title,
					variantId,
					variantTitle: liveVariantData?.variantTitle,
					selectedOptions: liveVariantData?.selectedOptions,
					sku: liveVariantData?.sku || linkedProduct?.sku || '',
					price: itemPriceNum,
					compareAtPrice:
						liveVariantData?.compareAtPrice ?? linkedProduct?.compareAtPrice,
					quantity: 1,
					image: cartImage,
					slug: liveVariantData?.slug || linkedProduct?.slug,
				})

				setIsAddedFeedback(true)
				setTimeout(() => setIsAddedFeedback(false), 2500)

				if (typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('cart:open'))
				}
				return
			}
		}

		// 2. Anchor smooth scrolling
		if (primaryButtonLink?.startsWith('#')) {
			e.preventDefault()
			const targetId = primaryButtonLink.replace('#', '')
			const element =
				document.getElementById(targetId) ||
				document.querySelector(primaryButtonLink)
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'start' })
				if (window.history && window.history.pushState) {
					window.history.pushState(null, '', primaryButtonLink)
				}
			} else {
				window.location.hash = primaryButtonLink
			}
		}
	}

	// Format secondary action link
	const getSecondaryHref = () => {
		if (!secondaryButtonValue) return '#'
		if (secondaryButtonType === 'phone') {
			return `tel:${secondaryButtonValue.replace(/[^\d+]/g, '')}`
		}
		if (secondaryButtonType === 'whatsapp') {
			if (secondaryButtonValue.startsWith('http')) {
				return secondaryButtonValue
			}
			const [phonePart, queryPart] = secondaryButtonValue.split('?')
			const cleanPhone = phonePart.replace(/[^\d]/g, '')
			return `https://wa.me/${cleanPhone}${queryPart ? `?${queryPart}` : ''}`
		}
		return secondaryButtonValue
	}

	// Dynamic presentation values
	const displayTitle = liveTitle || linkedProduct?.title || title
	const displayImage = liveImage || image || linkedProduct?.images?.[0]
	const displayPrice =
		livePrice ||
		(typeof linkedProduct?.price === 'number'
			? formatPrice(linkedProduct.price)
			: price)
	const displayOriginalPrice =
		liveOriginalPrice ||
		(typeof linkedProduct?.compareAtPrice === 'number'
			? formatPrice(linkedProduct.compareAtPrice)
			: originalPrice)
	const displayBadge = liveBadge || badge

	// Determine if the bar should currently be visually displayed
	const shouldShow = isMounted && !isDismissed && isVisible && !isTargetInView

	// Device visibility classes
	const deviceClass =
		deviceVisibility === 'mobile_only'
			? 'lg:hidden'
			: deviceVisibility === 'desktop_only'
				? 'hidden lg:block'
				: 'block'

	// Color theme surface styles
	const themeStyles = {
		light:
			'border-gray-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 text-gray-950 dark:text-zinc-50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]',
		dark: 'border-zinc-800 bg-zinc-950/98 text-white shadow-[0_-8px_35px_rgba(0,0,0,0.4)]',
		brand:
			'border-primary/20 bg-primary/95 text-primary-foreground shadow-[0_-8px_30px_rgba(0,0,0,0.18)]',
		urgent:
			'border-amber-500/40 bg-amber-50/95 dark:bg-zinc-950/95 text-amber-950 dark:text-amber-100 shadow-[0_-8px_30px_rgba(245,158,11,0.15)]',
	}[themeStyle]

	// Button styling
	const buttonStyles = {
		accent:
			'bg-cta text-cta-foreground hover:brightness-105 active:scale-[0.98] shadow-md hover:shadow-lg',
		dark: 'bg-zinc-900 text-white hover:bg-black active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-md',
		pulse:
			'bg-cta text-cta-foreground hover:brightness-105 active:scale-[0.98] shadow-md ring-2 ring-cta/40 animate-pulse hover:animate-none',
	}[buttonStyle]

	// Layout container and positioning
	const isFloating = barStyle === 'floating'
	const isTop = barPosition === 'top'

	const positionClasses = isFloating
		? isTop
			? 'fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] sm:w-[94%] max-w-5xl rounded-2xl sm:rounded-full border backdrop-blur-xl'
			: 'fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] sm:w-[94%] max-w-5xl rounded-2xl sm:rounded-full border backdrop-blur-xl'
		: isTop
			? 'fixed top-0 inset-x-0 w-full border-b backdrop-blur-xl'
			: 'fixed bottom-0 inset-x-0 w-full border-t backdrop-blur-xl'

	// Transition animation states (Smooth slide-in & slide-out)
	const animationClasses = shouldShow
		? 'translate-y-0 opacity-100 pointer-events-auto visible'
		: isTop
			? '-translate-y-full opacity-0 pointer-events-none invisible'
			: 'translate-y-full opacity-0 pointer-events-none invisible'

	// Padding with safe-area support
	const containerPadding =
		!isFloating && isTop
			? {
					paddingTop: 'calc(0.625rem + env(safe-area-inset-top, 0px))',
					paddingBottom: '0.625rem',
				}
			: !isFloating && !isTop
				? {
						paddingTop: '0.625rem',
						paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))',
					}
				: undefined

	return (
		<aside
			role="region"
			aria-label="Quick purchase bar"
			aria-hidden={!shouldShow}
			className={cn(
				'z-40 print:hidden transition-all duration-300 ease-out motion-reduce:transition-none',
				positionClasses,
				themeStyles,
				animationClasses,
				deviceClass,
			)}
			style={containerPadding}
		>
			<div
				className={cn(
					'mx-auto flex items-center justify-between gap-3 sm:gap-6',
					isFloating
						? 'px-3.5 sm:px-6 py-2 sm:py-2.5'
						: 'max-w-7xl px-3 sm:px-6 lg:px-8',
				)}
			>
				{/* ================= LEFT SECTION: Product, Price & Trust ================= */}
				<div className="flex min-w-0 flex-1 items-center gap-3">
					{/* Optional Product Thumbnail */}
					{displayImage && (
						<div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/30 shadow-2xs sm:h-12 sm:w-12">
							<Img
								image={displayImage}
								width={96}
								height={96}
								alt={displayImage?.alt || displayTitle || 'Product thumbnail'}
								className="h-full w-full object-cover"
							/>
						</div>
					)}

					{/* Title, Pricing & Ratings */}
					<div className="min-w-0 flex-1">
						{/* Row 1: Pricing + Badges + Star Rating */}
						<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
							{/* Current Price */}
							{displayPrice && (
								<span className="text-base font-black tracking-tight sm:text-lg">
									{displayPrice}
								</span>
							)}

							{/* Strike-through Original Price */}
							{displayOriginalPrice && (
								<span className="text-xs font-semibold text-muted-foreground/80 line-through sm:text-sm">
									{displayOriginalPrice}
								</span>
							)}

							{/* Highlight / Savings Badge */}
							{displayBadge && (
								<span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
									{displayBadge}
								</span>
							)}

							{/* Star Rating Display */}
							{(ratingScore || ratingText) && (
								<div className="hidden items-center gap-1 sm:flex">
									<FaStar className="h-3 w-3 text-amber-400 fill-amber-400" />
									<span className="text-xs font-bold text-amber-600 dark:text-amber-400">
										{ratingScore || ratingText}
									</span>
									{ratingCount && (
										<span className="text-[11px] text-muted-foreground">
											{ratingCount}
										</span>
									)}
								</div>
							)}
						</div>

						{/* Row 2: Headline & Trust Guarantee */}
						<div className="flex items-center gap-2">
							{displayTitle && (
								<p className="line-clamp-1 text-xs font-bold text-foreground/90 sm:text-sm">
									{displayTitle}
								</p>
							)}

							{trustNote && (
								<span className="hidden items-center gap-1 text-[11px] text-muted-foreground md:inline-flex">
									<span className="text-muted-foreground/40">•</span>
									<FiShield className="h-3.5 w-3.5 text-emerald-500" />
									<span>{trustNote}</span>
								</span>
							)}
						</div>
					</div>
				</div>

				{/* ================= RIGHT SECTION: Action Buttons & Dismiss ================= */}
				<div className="flex shrink-0 items-center gap-2 sm:gap-3">
					{/* Secondary Contact Action */}
					{secondaryButtonType &&
						secondaryButtonType !== 'none' &&
						secondaryButtonValue && (
							<a
								href={getSecondaryHref()}
								target={secondaryButtonType === 'phone' ? undefined : '_blank'}
								rel="noopener noreferrer"
								tabIndex={shouldShow ? 0 : -1}
								aria-label={secondaryButtonLabel || 'Contact support'}
								className={cn(
									'flex h-10 sm:h-11 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 sm:px-4 text-xs font-bold text-foreground transition-all duration-200 hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
								)}
							>
								{secondaryButtonType === 'whatsapp' ? (
									<FaWhatsapp className="h-4 w-4 text-emerald-500 fill-emerald-500" />
								) : secondaryButtonType === 'phone' ? (
									<FiPhone className="h-4 w-4 text-primary" />
								) : (
									<FiHelpCircle className="h-4 w-4 text-muted-foreground" />
								)}
								<span className="hidden xs:inline">{secondaryButtonLabel}</span>
							</a>
						)}

					{/* Primary High-Conversion CTA */}
					<a
						href={primaryButtonLink}
						onClick={handlePrimaryClick}
						tabIndex={shouldShow ? 0 : -1}
						aria-label={
							isAddedFeedback ? 'Item added to cart' : primaryButtonText
						}
						className={cn(
							'flex h-10 sm:h-11 items-center justify-center gap-1.5 rounded-xl px-4 sm:px-6 text-xs sm:text-sm font-black tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
							isAddedFeedback
								? 'bg-emerald-600 text-white shadow-md active:scale-95'
								: buttonStyles,
						)}
					>
						<div className="flex flex-col items-center">
							<span className="flex items-center gap-1.5">
								{isAddedFeedback ? (
									<>
										<FiCheck className="h-4 w-4 text-white" />
										<span>Added to Cart!</span>
									</>
								) : (
									<>
										<span>{primaryButtonText}</span>
										<FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
									</>
								)}
							</span>
							{!isAddedFeedback && primaryButtonSubtext && (
								<span className="text-[9px] font-normal opacity-90 leading-none">
									{primaryButtonSubtext}
								</span>
							)}
						</div>
					</a>

					{/* Optional Close / Dismiss Button */}
					{allowDismiss && (
						<button
							type="button"
							onClick={handleDismiss}
							tabIndex={shouldShow ? 0 : -1}
							aria-label="Dismiss sticky purchase bar"
							className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/80 hover:text-foreground active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						>
							<FiX className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>
		</aside>
	)
}
