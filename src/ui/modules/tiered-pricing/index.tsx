'use client'

import Link from 'next/link'
import { useEffect, useId, useMemo, useState } from 'react'
import {
	HiOutlineArrowRight,
	HiOutlineBuildingStorefront,
	HiOutlineCalculator,
	HiOutlineCheck,
	HiOutlineCheckCircle,
	HiOutlineGlobeAlt,
	HiOutlineInformationCircle,
	HiOutlineShieldCheck,
	HiOutlineShoppingBag,
	HiOutlineSparkles,
} from 'react-icons/hi2'
import { stegaClean } from 'next-sanity'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/use-cart-store'
import { urlFor } from '@/sanity/lib/image'
import { moduleAttributes, type ModuleProps } from '../module-utils'

export type TierItem = {
	_key?: string
	minQty: number
	maxQty?: number
	unitPrice?: number
	discountPercent?: number
	incoterm?: string
	badge?: string
	features?: string[]
	isCustomQuote?: boolean
}

export type TieredPricingProps = ModuleProps & {
	badge?: string
	eyebrow?: string
	headline?: string
	heading?: string
	subtitle?: string
	subheading?: string
	currency?: string
	enableCurrencySelector?: boolean
	tiers?: TierItem[]
	actionType?: 'rfq' | 'cart'
	linkedProduct?: {
		_id: string
		title: string
		price?: number
		compareAtPrice?: number
		sku?: string
		slug?: string
		images?: any[]
	}
	ctaText?: string
	ctaLink?: string
	tableStyle?: 'cards' | 'table' | 'minimal'
	layoutStyle?: 'cards' | 'table' | 'minimal'
	highlightBestValue?: boolean
	showCalculator?: boolean
	colorTheme?: 'default' | 'surface' | 'brand'
	defaultIncoterm?: string
	customQuoteThreshold?: number
	termsNotice?: string
	footnote?: string
	sanityAttr?: any
	'data-sanity'?: string
}

// Global commercial exchange rate baselines for live visitor preview
const EXCHANGE_RATES: Record<string, number> = {
	USD: 1.0,
	GBP: 0.79,
	EUR: 0.92,
	CAD: 1.36,
	AUD: 1.52,
}

const SUPPORTED_CURRENCIES = [
	{ code: 'USD', label: 'USD ($)', symbol: '$' },
	{ code: 'GBP', label: 'GBP (£)', symbol: '£' },
	{ code: 'EUR', label: 'EUR (€)', symbol: '€' },
	{ code: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
	{ code: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
]

export default function TieredPricingModule(props: TieredPricingProps) {
	const {
		badge,
		eyebrow,
		headline = 'Transparent Volume-Based Pricing',
		heading,
		subtitle = 'Higher manufacturing economies of scale unlock lower per-unit export costs. All tiers based on standard export packaging and FOB terms.',
		subheading,
		currency = 'USD',
		enableCurrencySelector = true,
		tiers = [],
		actionType = 'rfq',
		linkedProduct,
		ctaText = 'Request Official Quotation (RFQ)',
		ctaLink = '#lead-form',
		tableStyle = 'cards',
		layoutStyle,
		highlightBestValue = true,
		showCalculator = true,
		colorTheme = 'default',
		defaultIncoterm = 'FOB',
		customQuoteThreshold,
		termsNotice,
		footnote,
		sanityAttr,
		...restProps
	} = props

	// Stega-clean all logic, themes, and configuration variables
	const cleanLayout = (stegaClean(tableStyle) ||
		stegaClean(layoutStyle) ||
		'cards') as 'cards' | 'table' | 'minimal'
	const cleanBaseCurrency = stegaClean(currency) || 'USD'
	const cleanIncoterm = stegaClean(defaultIncoterm) || 'FOB'
	const cleanTheme = (stegaClean(colorTheme) || 'default') as
		| 'default'
		| 'surface'
		| 'brand'
	const cleanActionType = (stegaClean(actionType) || 'rfq') as 'rfq' | 'cart'
	const cleanCtaLink = stegaClean(ctaLink) || '#lead-form'
	const cleanCtaText = stegaClean(ctaText) || 'Request Official Quotation (RFQ)'
	const cleanHighlightBestValue = stegaClean(highlightBestValue) !== false
	const cleanShowCalculator = stegaClean(showCalculator) !== false
	const cleanEnableCurrencySelector = stegaClean(enableCurrencySelector) !== false
	const cleanThreshold = customQuoteThreshold
		? Number(stegaClean(customQuoteThreshold))
		: undefined

	// Cart store integration
	const addItem = useCartStore((s) => s.addItem)
	const [addedTierKey, setAddedTierKey] = useState<string | null>(null)

	// Display labels with backward-compatible fallback
	const displayBadge = badge || eyebrow || 'B2B Wholesale & Volume Discounts'
	const displayHeadline = headline || heading || 'Transparent Volume-Based Pricing'
	const displaySubtitle = subtitle || subheading
	const displayTerms =
		termsNotice ||
		footnote ||
		'All wholesale prices are quoted on FOB standard export packaging basis. International sea/air freight, customs clearance, and local duties will be confirmed prior to final proforma invoice issuance.'

	// Accessible ID generation
	const instanceId = useId()
	const calculatorInputId = `vol-calc-${instanceId}`
	const currencySelectId = `curr-sel-${instanceId}`

	// Data Sanity root path for Click-to-Edit Visual Editing
	const rootSanityAttr =
		(restProps as Record<string, any>)['data-sanity'] ||
		(typeof sanityAttr === 'string' ? sanityAttr : undefined)

	// Active visitor currency state with localStorage persistence
	const [activeCurrency, setActiveCurrency] = useState<string>(() => cleanBaseCurrency)

	useEffect(() => {
		if (!cleanEnableCurrencySelector || typeof window === 'undefined') return
		try {
			const saved = localStorage.getItem('visitor_currency')
			if (saved && EXCHANGE_RATES[saved]) {
				setActiveCurrency(saved)
			}
		} catch {
			// Ignore localStorage access restrictions in private mode
		}
	}, [cleanEnableCurrencySelector])

	const handleCurrencyChange = (newCurr: string) => {
		setActiveCurrency(newCurr)
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem('visitor_currency', newCurr)
			} catch {}
		}
	}

	// Live price conversion helper
	const convertRate = useMemo(() => {
		const base = EXCHANGE_RATES[cleanBaseCurrency] || 1.0
		const target = EXCHANGE_RATES[activeCurrency] || 1.0
		return target / base
	}, [cleanBaseCurrency, activeCurrency])

	const convertPrice = (val: number | undefined | null): number => {
		if (val === undefined || val === null) return 0
		return Number(val) * convertRate
	}

	// Sort tiers in ascending order of minimum quantity
	const sortedTiers = useMemo(() => {
		if (!tiers || !Array.isArray(tiers) || tiers.length === 0) return []
		return [...tiers].sort((a, b) => (a.minQty || 0) - (b.minQty || 0))
	}, [tiers])

	// Base tier (Tier 1) for calculating baseline wholesale savings
	const baseTier = sortedTiers[0]

	// Determine best value tier index based on savings percent or badge
	const bestValueIndex = useMemo(() => {
		if (!cleanHighlightBestValue || sortedTiers.length === 0) return -1
		let maxDiscountIdx = -1
		let maxDiscount = -1

		sortedTiers.forEach((t, idx) => {
			if (t.badge && t.badge.toLowerCase().includes('best value')) {
				maxDiscountIdx = idx
				maxDiscount = 999
				return
			}
			const discount = t.discountPercent ?? 0
			if (discount > maxDiscount) {
				maxDiscount = discount
				maxDiscountIdx = idx
			}
		})
		return maxDiscountIdx >= 0 ? maxDiscountIdx : -1
	}, [cleanHighlightBestValue, sortedTiers])

	// Selected tier state
	const [selectedMinQty, setSelectedMinQty] = useState<number | null>(() =>
		sortedTiers.length > 0 ? sortedTiers[0].minQty : null,
	)

	// Interactive calculator quantity state
	const [calcQty, setCalcQty] = useState<number>(() =>
		sortedTiers.length > 0 ? sortedTiers[0].minQty : 1000,
	)

	// Helper to find tier by quantity
	const findTierForQty = (qty: number): TierItem | undefined => {
		if (sortedTiers.length === 0) return undefined
		for (let i = sortedTiers.length - 1; i >= 0; i--) {
			if (qty >= sortedTiers[i].minQty) {
				return sortedTiers[i]
			}
		}
		return sortedTiers[0]
	}

	// Active tier matched by calculator quantity
	const activeCalcTier = useMemo(
		() => findTierForQty(calcQty),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[calcQty, sortedTiers],
	)

	// Handle tier selection
	const handleSelectTier = (tier: TierItem) => {
		setSelectedMinQty(tier.minQty)
		setCalcQty(tier.minQty)
	}

	// Calculate batch economics (in active converted currency)
	const batchEconomics = useMemo(() => {
		if (!activeCalcTier) return null
		const isCustom =
			activeCalcTier.isCustomQuote ||
			(cleanThreshold && calcQty >= cleanThreshold)

		if (isCustom || !activeCalcTier.unitPrice) {
			return {
				isCustom: true,
				unitPrice: null,
				totalBatchCost: null,
				savingsAmount: null,
				savingsPercent: activeCalcTier.discountPercent ?? null,
				incoterm: activeCalcTier.incoterm || cleanIncoterm,
			}
		}

		const unitPrice = convertPrice(activeCalcTier.unitPrice)
		const totalBatchCost = calcQty * unitPrice
		const basePrice = convertPrice(baseTier?.unitPrice ?? activeCalcTier.unitPrice)
		const baseCost = calcQty * basePrice
		const savingsAmount = Math.max(0, baseCost - totalBatchCost)
		const savingsPercent =
			activeCalcTier.discountPercent ??
			(basePrice > 0 && savingsAmount > 0
				? Math.round((savingsAmount / baseCost) * 100)
				: 0)

		return {
			isCustom: false,
			unitPrice,
			totalBatchCost,
			savingsAmount,
			savingsPercent,
			incoterm: activeCalcTier.incoterm || cleanIncoterm,
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeCalcTier, calcQty, cleanThreshold, cleanIncoterm, baseTier, convertRate])

	// Preset quantity chips for calculator
	const calculatorPresets = useMemo(() => {
		const set = new Set<number>()
		sortedTiers.forEach((t) => {
			if (t.minQty) set.add(t.minQty)
		})
		if (sortedTiers.length > 0) {
			const highest = sortedTiers[sortedTiers.length - 1].minQty
			if (highest < 50000) set.add(highest * 2)
		}
		return Array.from(set).sort((a, b) => a - b).slice(0, 5)
	}, [sortedTiers])

	// Action dispatch handler (Cart addition vs. RFQ prefill scroll)
	const isCartMode = cleanActionType === 'cart' && Boolean(linkedProduct)

	const handleActionClick = (tier: TierItem, quantity: number, e: React.MouseEvent) => {
		const isCustom =
			tier.isCustomQuote ||
			(Boolean(cleanThreshold) && quantity >= (cleanThreshold ?? Infinity))

		if (isCartMode && !isCustom && linkedProduct) {
			e.preventDefault()
			const effectiveUnitPrice = tier.unitPrice ?? linkedProduct.price ?? 0
			const cartItemId = `${linkedProduct._id}-${tier.minQty}`
			const itemImage = linkedProduct.images?.[0]
				? urlFor(linkedProduct.images[0]).url()
				: undefined

			addItem({
				id: cartItemId,
				productId: linkedProduct._id,
				productTitle: linkedProduct.title,
				title: linkedProduct.title,
				sku: linkedProduct.sku,
				price: effectiveUnitPrice,
				quantity,
				image: itemImage,
				slug: linkedProduct.slug,
				moq: sortedTiers[0]?.minQty,
				priceTiers: sortedTiers.map((t) => ({
					minQty: t.minQty,
					maxQty: t.maxQty,
					unitPrice: t.unitPrice ?? 0,
					incoterm: t.incoterm || cleanIncoterm,
					discountPercent: t.discountPercent,
					badge: t.badge,
					isCustomQuote: t.isCustomQuote,
				})),
			})

			setAddedTierKey(tier._key || `${tier.minQty}`)
			setTimeout(() => setAddedTierKey(null), 3000)

			// Open global cart drawer
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('cart:open'))
			}
			return
		}

		// RFQ Mode: Dispatch detailed quotation payload & smooth scroll
		if (typeof window !== 'undefined') {
			const unitRateStr = tier.unitPrice
				? `${formatPrice(convertPrice(tier.unitPrice), activeCurrency)} / unit (${
						tier.incoterm || cleanIncoterm
					})`
				: 'VIP Custom Factory Quote'
			const totalStr = tier.unitPrice
				? formatPrice(convertPrice(quantity * tier.unitPrice), activeCurrency)
				: 'Quoted upon RFQ review'
			const savingsStr = tier.discountPercent
				? `Save ${tier.discountPercent}%`
				: undefined

			window.dispatchEvent(
				new CustomEvent('tiered-pricing:select', {
					detail: {
						quantity,
						unitPrice: unitRateStr,
						totalCost: totalStr,
						savings: savingsStr,
						currency: activeCurrency,
						incoterm: tier.incoterm || cleanIncoterm,
					},
				}),
			)

			if (cleanCtaLink.startsWith('#')) {
				e.preventDefault()
				const targetEl = document.querySelector(cleanCtaLink)
				if (targetEl) {
					targetEl.scrollIntoView({ behavior: 'smooth' })
				}
			}
		}
	}

	if (sortedTiers.length === 0) return null

	// Background container theme classes
	const themeStyles = {
		default: 'bg-white text-gray-900',
		surface: 'bg-gray-50/70 text-gray-900 border-y border-gray-200/60',
		brand: 'bg-primary/5 text-gray-900 border-y border-primary/10',
	}[cleanTheme]

	return (
		<section
			className={`section py-12 sm:py-16 lg:py-20 transition-colors ${themeStyles}`}
			{...moduleAttributes({ ...restProps, 'data-sanity': rootSanityAttr })}
		>
			<div className="container mx-auto max-w-6xl px-4 sm:px-6">
				{/* Section Header */}
				<div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
					{displayBadge && (
						<div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3.5 shadow-xs">
							<HiOutlineSparkles className="text-sm flex-none" aria-hidden="true" />
							<span>{displayBadge}</span>
						</div>
					)}
					{displayHeadline && (
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
							{displayHeadline}
						</h2>
					)}
					{displaySubtitle && (
						<p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
							{displaySubtitle}
						</p>
					)}
				</div>

				{/* Interactive Order Batch Calculator (CRO Conversion Driver) */}
				{cleanShowCalculator && (
					<div className="mb-10 lg:mb-12 rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-7 shadow-xs hover:border-gray-300 transition-all">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5">
							<div className="flex items-center gap-2.5">
								<div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-none">
									<HiOutlineCalculator className="text-lg" aria-hidden="true" />
								</div>
								<div>
									<h3 className="text-sm sm:text-base font-bold text-gray-900">
										Interactive Order Batch Simulator
									</h3>
									<p className="text-xs text-gray-500">
										Simulate your custom volume to calculate wholesale rates and scale savings.
									</p>
								</div>
							</div>

							{/* International Trade Terms & Currency Selector Pill */}
							<div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
								{cleanEnableCurrencySelector && (
									<div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200/70 text-xs font-semibold text-gray-700">
										<HiOutlineGlobeAlt className="text-sm text-primary flex-none" aria-hidden="true" />
										<label htmlFor={currencySelectId} className="sr-only">
											Select display currency:
										</label>
										<select
											id={currencySelectId}
											value={activeCurrency}
											onChange={(e) => handleCurrencyChange(e.target.value)}
											className="bg-transparent text-gray-800 font-bold focus:outline-hidden cursor-pointer text-xs"
										>
											{SUPPORTED_CURRENCIES.map((c) => (
												<option key={c.code} value={c.code}>
													{c.label}
												</option>
											))}
										</select>
									</div>
								)}

								<div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/70">
									<HiOutlineShieldCheck className="text-sm text-emerald-600 flex-none" aria-hidden="true" />
									<span>Standard {cleanIncoterm} Terms</span>
								</div>
							</div>
						</div>

						{/* Calculator Controls & Output Grid */}
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
							{/* Input & Preset Steppers */}
							<div className="lg:col-span-7 space-y-3">
								<label
									htmlFor={calculatorInputId}
									className="block text-xs font-bold uppercase tracking-wider text-gray-700"
								>
									Target Order Quantity (Units):
								</label>
								<div className="flex items-center gap-3">
									<div className="relative flex-1">
										<input
											id={calculatorInputId}
											type="number"
											min={1}
											step={100}
											value={calcQty}
											onChange={(e) => {
												const val = Math.max(1, Number(e.target.value) || 1)
												setCalcQty(val)
												const matching = findTierForQty(val)
												if (matching) setSelectedMinQty(matching.minQty)
											}}
											className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-gray-50/50 text-gray-900 font-bold text-base focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden"
											aria-label="Order Quantity in units"
										/>
										<span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none">
											pcs
										</span>
									</div>

									{/* Action CTA within simulator */}
									{activeCalcTier && (
										<Link
											href={cleanCtaLink}
											onClick={(e) => handleActionClick(activeCalcTier, calcQty, e)}
											className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all inline-flex items-center justify-center gap-1.5 flex-none"
										>
											{isCartMode ? (
												<>
													<HiOutlineShoppingBag className="text-sm" aria-hidden="true" />
													<span>Add {calcQty.toLocaleString('en-US')} to Cart</span>
												</>
											) : (
												<>
													<span>Lock Rate</span>
													<HiOutlineArrowRight className="text-sm" aria-hidden="true" />
												</>
											)}
										</Link>
									)}
								</div>

								{/* Quick preset chips */}
								{calculatorPresets.length > 0 && (
									<div className="flex flex-wrap items-center gap-1.5 pt-1">
										<span className="text-[11px] font-medium text-gray-400 mr-1">
											Quick MOQ breaks:
										</span>
										{calculatorPresets.map((qty) => (
											<button
												key={qty}
												type="button"
												onClick={() => {
													setCalcQty(qty)
													const matching = findTierForQty(qty)
													if (matching) setSelectedMinQty(matching.minQty)
												}}
												className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
													calcQty === qty
														? 'bg-primary text-white shadow-xs'
														: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
												}`}
											>
												{qty.toLocaleString('en-US')} pcs
											</button>
										))}
									</div>
								)}
							</div>

							{/* Output Economics Summary */}
							<div className="lg:col-span-5 bg-gray-50/90 rounded-xl p-4 sm:p-5 border border-gray-200/80">
								{batchEconomics?.isCustom ? (
									<div className="text-center py-1">
										<span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider mb-1.5">
											Enterprise Scale Rate
										</span>
										<p className="text-lg font-black text-gray-900">
											VIP Custom Direct Quotation
										</p>
										<p className="text-xs text-gray-500 mt-1">
											Qualifies for specialized mold tooling & dedicated container shipping.
										</p>
									</div>
								) : (
									<div className="space-y-2">
										<div className="flex items-baseline justify-between text-xs">
											<span className="text-gray-500">Effective Unit Rate:</span>
											<span className="text-sm font-extrabold text-gray-900">
												{formatPrice(batchEconomics?.unitPrice ?? 0, activeCurrency)}{' '}
												<span className="text-[10px] text-gray-500 font-normal">
													/{batchEconomics?.incoterm}
												</span>
											</span>
										</div>

										<div className="flex items-baseline justify-between text-xs">
											<span className="text-gray-500">
												Est. Batch Total ({calcQty.toLocaleString('en-US')} units):
											</span>
											<span className="text-base font-black text-gray-900">
												{formatPrice(batchEconomics?.totalBatchCost ?? 0, activeCurrency)}
											</span>
										</div>

										{batchEconomics?.savingsAmount && batchEconomics.savingsAmount > 0 ? (
											<div className="flex items-baseline justify-between text-xs pt-1.5 border-t border-gray-200/80 text-emerald-700 font-bold">
												<span className="flex items-center gap-1">
													<HiOutlineCheck className="text-sm" aria-hidden="true" />
													Estimated Wholesale Savings:
												</span>
												<span>
													Save {formatPrice(batchEconomics.savingsAmount, activeCurrency)} (
													{batchEconomics.savingsPercent}%)
												</span>
											</div>
										) : null}
									</div>
								)}
							</div>
						</div>

						{/* Live Exchange Rate Transparency Footnote */}
						{activeCurrency !== cleanBaseCurrency && (
							<div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-gray-400">
								<HiOutlineInformationCircle className="text-xs flex-none" />
								<span>
									Real-time visitor preview: 1 {cleanBaseCurrency} ≈ {convertRate.toFixed(2)}{' '}
									{activeCurrency}. Commercial contract and settlement issued in{' '}
									{cleanBaseCurrency}.
								</span>
							</div>
						)}
					</div>
				)}

				{/* -------------------------------------------------------- */}
				{/* LAYOUT 1: ELEVATED CARDS GRID (DEFAULT)                  */}
				{/* -------------------------------------------------------- */}
				{(cleanLayout === 'cards' || cleanLayout === 'minimal') && (
					<div
						role="radiogroup"
						aria-label="Wholesale pricing tiers"
						className={`grid gap-5 sm:gap-6 ${
							sortedTiers.length >= 4
								? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
								: sortedTiers.length === 3
									? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
									: 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
						}`}
					>
						{sortedTiers.map((tier, idx) => {
							const isSelected = selectedMinQty === tier.minQty
							const isBestValue = idx === bestValueIndex
							const isCustom =
								tier.isCustomQuote ||
								(Boolean(cleanThreshold) && tier.minQty >= (cleanThreshold ?? Infinity))

							const formattedMin = tier.minQty.toLocaleString('en-US')
							const formattedMax = tier.maxQty ? tier.maxQty.toLocaleString('en-US') : null
							const rangeLabel = formattedMax
								? `${formattedMin} – ${formattedMax} units`
								: `${formattedMin}+ units`

							const tierSanityAttr =
								rootSanityAttr && tier._key
									? `${rootSanityAttr}.tiers[_key=="${tier._key}"]`
									: undefined

							const isAdded = addedTierKey === (tier._key || `${tier.minQty}`)
							const convertedUnitPrice = convertPrice(tier.unitPrice)

							// Accessible label
							const tierPriceLabel = isCustom
								? 'VIP Custom Quotation'
								: `${formatPrice(convertedUnitPrice, activeCurrency)} per unit`
							const accessibilityLabel = `${rangeLabel}: ${tierPriceLabel}. ${
								tier.discountPercent ? `Save ${tier.discountPercent} percent.` : ''
							} ${isSelected ? 'Currently selected.' : 'Click to select this volume tier.'}`

							return (
								<div
									key={tier._key || idx}
									data-sanity={tierSanityAttr}
									role="radio"
									aria-checked={isSelected}
									tabIndex={0}
									aria-label={accessibilityLabel}
									onClick={() => handleSelectTier(tier)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											handleSelectTier(tier)
										}
									}}
									className={`relative flex flex-col justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
										isSelected
											? 'border-primary bg-primary/[0.03] shadow-lg -translate-y-1'
											: isBestValue
												? 'border-primary/50 bg-white hover:border-primary shadow-sm hover:-translate-y-0.5'
												: 'border-gray-200/90 bg-white hover:border-gray-300 shadow-xs hover:-translate-y-0.5'
									}`}
								>
									{/* Top Highlight Badge */}
									{(tier.badge || (isBestValue && !tier.badge)) && (
										<div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-primary text-white text-[11px] font-bold shadow-xs tracking-wide">
											{tier.badge || 'Best Value'}
										</div>
									)}

									<div>
										{/* Status Header */}
										<div className="flex items-center justify-between gap-2 mb-3">
											<span className="text-xs font-bold uppercase tracking-wider text-gray-500">
												Volume Tier #{idx + 1}
											</span>
											{Boolean(tier.discountPercent && tier.discountPercent > 0) && (
												<span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
													Save {tier.discountPercent}%
												</span>
											)}
										</div>

										{/* Range */}
										<p className="text-lg font-black text-gray-900 mb-1">{rangeLabel}</p>

										{/* Price Display */}
										<div className="flex items-baseline gap-1.5 my-3">
											{isCustom ? (
												<span className="text-2xl font-black text-primary">
													VIP Custom Quote
												</span>
											) : (
												<>
													<span className="text-3xl font-extrabold text-gray-900 tracking-tight">
														{formatPrice(convertedUnitPrice, activeCurrency)}
													</span>
													<span className="text-xs text-gray-500 font-medium">
														/ unit ({tier.incoterm || cleanIncoterm})
													</span>
												</>
											)}
										</div>

										{/* Minimum Order Batch Investment Hint */}
										{!isCustom && tier.unitPrice ? (
											<p className="text-[11px] text-gray-500 mb-4 font-medium">
												Min. batch: {formatPrice(tier.minQty * convertedUnitPrice, activeCurrency)}
											</p>
										) : null}

										{/* Inclusions / Bullet features */}
										<ul className="space-y-2.5 mt-4 text-xs text-gray-600 border-t border-gray-100 pt-4">
											{tier.features && tier.features.length > 0 ? (
												tier.features.map((feature, fIdx) => (
													<li key={fIdx} className="flex items-start gap-2">
														<HiOutlineCheckCircle className="text-emerald-500 text-sm flex-none mt-0.5" />
														<span>{feature}</span>
													</li>
												))
											) : (
												<>
													<li className="flex items-start gap-2">
														<HiOutlineCheckCircle className="text-emerald-500 text-sm flex-none mt-0.5" />
														<span>Standard sea-worthy export carton packaging</span>
													</li>
													<li className="flex items-start gap-2">
														<HiOutlineCheckCircle className="text-emerald-500 text-sm flex-none mt-0.5" />
														<span>Quality inspection report & CoO certification</span>
													</li>
													{isCustom ? (
														<li className="flex items-start gap-2 font-semibold text-primary">
															<HiOutlineBuildingStorefront className="text-sm flex-none mt-0.5" />
															<span>Dedicated factory line & custom mold tooling</span>
														</li>
													) : (
														<li className="flex items-start gap-2">
															<HiOutlineCheckCircle className="text-emerald-500 text-sm flex-none mt-0.5" />
															<span>Factory-direct production scheduling</span>
														</li>
													)}
												</>
											)}
										</ul>
									</div>

									{/* Card Footer CTA */}
									<div className="mt-6 pt-4 border-t border-gray-100">
										<Link
											href={cleanCtaLink}
											onClick={(e) => {
												e.stopPropagation()
												handleActionClick(tier, tier.minQty, e)
											}}
											className={`w-full h-10 px-4 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
												isAdded
													? 'bg-emerald-600 text-white'
													: isSelected
														? 'bg-primary text-white shadow-md hover:opacity-90'
														: 'bg-gray-100 hover:bg-gray-200 text-gray-800'
											}`}
										>
											{isCustom ? (
												<>
													<span>Inquire VIP Rate</span>
													<HiOutlineArrowRight className="text-xs" aria-hidden="true" />
												</>
											) : isCartMode ? (
												isAdded ? (
													<>
														<HiOutlineCheck className="text-sm" />
														<span>Added to Cart!</span>
													</>
												) : (
													<>
														<HiOutlineShoppingBag className="text-sm" />
														<span>Add to Cart ({formattedMin} pcs)</span>
													</>
												)
											) : (
												<>
													<span>{cleanCtaText}</span>
													<HiOutlineArrowRight className="text-xs" aria-hidden="true" />
												</>
											)}
										</Link>
									</div>
								</div>
							)
						})}
					</div>
				)}

				{/* -------------------------------------------------------- */}
				{/* LAYOUT 2: COMMERCIAL COMPARISON TABLE                    */}
				{/* -------------------------------------------------------- */}
				{cleanLayout === 'table' && (
					<div className="space-y-4">
						{/* Desktop Table View (Hidden on mobile <640px for responsive hygiene) */}
						<div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
							<table className="w-full text-left text-sm border-collapse">
								<caption className="sr-only">
									B2B Volume Wholesale Pricing Breakdown by Quantity Breaks
								</caption>
								<thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase text-gray-500 tracking-wider">
									<tr>
										<th scope="col" className="px-6 py-4">
											Volume Tier Break
										</th>
										<th scope="col" className="px-6 py-4">
											Unit Price ({cleanIncoterm})
										</th>
										<th scope="col" className="px-6 py-4">
											Min. Batch Total
										</th>
										<th scope="col" className="px-6 py-4">
											Wholesale Savings
										</th>
										<th scope="col" className="px-6 py-4">
											Tier Inclusions
										</th>
										<th scope="col" className="px-6 py-4 text-right">
											Commercial Action
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{sortedTiers.map((tier, idx) => {
										const isSelected = selectedMinQty === tier.minQty
										const isBestValue = idx === bestValueIndex
										const isCustom =
											tier.isCustomQuote ||
											(Boolean(cleanThreshold) && tier.minQty >= (cleanThreshold ?? Infinity))

										const formattedMin = tier.minQty.toLocaleString('en-US')
										const formattedMax = tier.maxQty ? tier.maxQty.toLocaleString('en-US') : null
										const rangeLabel = formattedMax
											? `${formattedMin} – ${formattedMax} units`
											: `${formattedMin}+ units`

										const tierSanityAttr =
											rootSanityAttr && tier._key
												? `${rootSanityAttr}.tiers[_key=="${tier._key}"]`
												: undefined

										const convertedUnitPrice = convertPrice(tier.unitPrice)
										const isAdded = addedTierKey === (tier._key || `${tier.minQty}`)

										return (
											<tr
												key={tier._key || idx}
												data-sanity={tierSanityAttr}
												tabIndex={0}
												aria-label={`${rangeLabel}: ${
													isCustom
														? 'VIP Custom Quote'
														: `${formatPrice(convertedUnitPrice, activeCurrency)} per unit`
												}`}
												onClick={() => handleSelectTier(tier)}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault()
														handleSelectTier(tier)
													}
												}}
												className={`cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
													isSelected
														? 'bg-primary/5 font-medium'
														: 'hover:bg-gray-50/70'
												}`}
											>
												<td className="px-6 py-4">
													<div className="flex items-center gap-2">
														<span className="font-extrabold text-gray-900">{rangeLabel}</span>
														{tier.badge && (
															<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
																{tier.badge}
															</span>
														)}
														{isBestValue && !tier.badge && (
															<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
																Best Value
															</span>
														)}
													</div>
													<span className="text-[11px] text-gray-400">
														Tier #{idx + 1}
													</span>
												</td>
												<td className="px-6 py-4">
													{isCustom ? (
														<span className="font-bold text-primary">VIP Custom Quote</span>
													) : (
														<span className="font-extrabold text-gray-900">
															{formatPrice(convertedUnitPrice, activeCurrency)}{' '}
															<span className="text-xs text-gray-500 font-normal">
																/{tier.incoterm || cleanIncoterm}
															</span>
														</span>
													)}
												</td>
												<td className="px-6 py-4 text-gray-700 font-semibold">
													{!isCustom && tier.unitPrice
														? formatPrice(tier.minQty * convertedUnitPrice, activeCurrency)
														: 'Upon RFQ'}
												</td>
												<td className="px-6 py-4">
													{tier.discountPercent && tier.discountPercent > 0 ? (
														<span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
															Save {tier.discountPercent}%
														</span>
													) : (
														<span className="text-gray-400 text-xs">Standard</span>
													)}
												</td>
												<td className="px-6 py-4 text-xs text-gray-600">
													{isCustom ? (
														<span className="text-primary font-medium">
															Custom mold tooling & priority QC
														</span>
													) : (
														<span>Standard export packaging & CoO</span>
													)}
												</td>
												<td className="px-6 py-4 text-right">
													<Link
														href={cleanCtaLink}
														onClick={(e) => {
															e.stopPropagation()
															handleActionClick(tier, tier.minQty, e)
														}}
														className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all ${
															isAdded
																? 'bg-emerald-600 text-white'
																: 'bg-primary text-white hover:opacity-90'
														}`}
													>
														{isCartMode ? (
															isAdded ? (
																<>
																	<HiOutlineCheck className="text-xs" />
																	<span>Added</span>
																</>
															) : (
																<>
																	<HiOutlineShoppingBag className="text-xs" />
																	<span>Add to Cart</span>
																</>
															)
														) : (
															<>
																<span>RFQ</span>
																<HiOutlineArrowRight className="text-xs" aria-hidden="true" />
															</>
														)}
													</Link>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>

						{/* Mobile Table Fallback Cards (<640px) */}
						<div className="sm:hidden space-y-3">
							{sortedTiers.map((tier, idx) => {
								const isSelected = selectedMinQty === tier.minQty
								const isCustom =
									tier.isCustomQuote ||
									(Boolean(cleanThreshold) && tier.minQty >= (cleanThreshold ?? Infinity))

								const formattedMin = tier.minQty.toLocaleString('en-US')
								const formattedMax = tier.maxQty ? tier.maxQty.toLocaleString('en-US') : null
								const rangeLabel = formattedMax
									? `${formattedMin} – ${formattedMax} pcs`
									: `${formattedMin}+ pcs`

								const convertedUnitPrice = convertPrice(tier.unitPrice)
								const isAdded = addedTierKey === (tier._key || `${tier.minQty}`)

								return (
									<div
										key={tier._key || idx}
										role="button"
										tabIndex={0}
										aria-label={`${rangeLabel}: ${
											isCustom
												? 'VIP Custom Quote'
												: `${formatPrice(convertedUnitPrice, activeCurrency)} per unit`
										}`}
										onClick={() => handleSelectTier(tier)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault()
												handleSelectTier(tier)
											}
										}}
										className={`p-4 rounded-xl border transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
											isSelected
												? 'border-primary bg-primary/5 shadow-xs'
												: 'border-gray-200 bg-white'
										}`}
									>
										<div className="flex items-center justify-between mb-1.5">
											<span className="font-bold text-gray-900 text-sm">{rangeLabel}</span>
											{tier.discountPercent && tier.discountPercent > 0 && (
												<span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
													Save {tier.discountPercent}%
												</span>
											)}
										</div>
										<div className="flex items-baseline justify-between gap-3">
											<span className="text-base font-extrabold text-gray-900">
												{isCustom
													? 'VIP Custom Quote'
													: `${formatPrice(convertedUnitPrice, activeCurrency)} / unit`}
											</span>
											<Link
												href={cleanCtaLink}
												onClick={(e) => {
													e.stopPropagation()
													handleActionClick(tier, tier.minQty, e)
												}}
												className={`px-3 py-1 rounded-lg text-xs font-bold shadow-xs inline-flex items-center gap-1 ${
													isAdded
														? 'bg-emerald-600 text-white'
														: 'bg-primary text-white'
												}`}
											>
												{isCartMode ? (
													isAdded ? 'Added' : 'Add to Cart'
												) : (
													'RFQ'
												)}
											</Link>
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}

				{/* Commercial & Shipping Terms Footnote */}
				{displayTerms && (
					<div className="mt-10 sm:mt-12 pt-6 border-t border-gray-200/70 text-center">
						<div className="inline-flex items-start sm:items-center gap-2 text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto text-left sm:text-center">
							<HiOutlineInformationCircle
								className="text-base text-gray-400 flex-none mt-0.5 sm:mt-0"
								aria-hidden="true"
							/>
							<span>{displayTerms}</span>
						</div>
					</div>
				)}
			</div>
		</section>
	)
}
