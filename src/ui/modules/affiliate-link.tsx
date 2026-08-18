'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Copy, ExternalLink, Sparkles, Star, Tag, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'

export interface AffiliateLinkBlockProps {
	sourceMode?: 'affiliate' | 'custom'
	affiliateRef?: {
		_id: string
		title?: string
		merchant?: string
		url?: string
		price?: string
		originalPrice?: string
		couponCode?: string
		rating?: number
		ratingCount?: number
		badge?: string
		highlights?: string[]
		description?: string
		image?: any
	}
	customUrl?: string
	customTitle?: string
	customImage?: any
	customPrice?: string
	customOriginalPrice?: string
	customHighlights?: string[]
	customRating?: number
	badge?: string
	couponCode?: string
	customVerdict?: string
	layout?: 'verdict' | 'strip' | 'button'
	buttonText?: string
	buttonTheme?: 'primary' | 'emerald' | 'amber' | 'rose'
}

export default function AffiliateLinkBlock({
	sourceMode = 'affiliate',
	affiliateRef,
	customUrl,
	customTitle,
	customImage,
	customPrice,
	customOriginalPrice,
	customHighlights,
	customRating,
	badge: overrideBadge,
	couponCode: overrideCoupon,
	customVerdict,
	layout = 'verdict',
	buttonText,
	buttonTheme = 'primary',
}: AffiliateLinkBlockProps) {
	const [copied, setCopied] = useState(false)

	// 1. Resolve Effective Values based on sourceMode
	let title = ''
	let targetUrl = '#'
	let image: any = null
	let price: string | undefined = undefined
	let originalPrice: string | undefined = undefined
	let rating: number | undefined = undefined
	let ratingCount: number | undefined = undefined
	let badge: string | undefined = overrideBadge
	let couponCode: string | undefined = overrideCoupon
	let highlights: string[] = []
	let verdictText: string | undefined = customVerdict

	if (sourceMode === 'affiliate' && affiliateRef) {
		title = affiliateRef.title || 'Recommended Affiliate Product'
		targetUrl = affiliateRef.url || '#'
		image = affiliateRef.image
		price = affiliateRef.price
		originalPrice = affiliateRef.originalPrice
		rating = affiliateRef.rating ?? 4.9
		ratingCount = affiliateRef.ratingCount
		badge = overrideBadge || affiliateRef.badge || "Editor's Choice"
		couponCode = overrideCoupon || affiliateRef.couponCode
		highlights = affiliateRef.highlights || []
		verdictText = customVerdict || affiliateRef.description
	} else {
		// Custom mode
		title = customTitle || 'Recommended Product / Deal'
		targetUrl = customUrl || '#'
		image = customImage
		price = customPrice
		originalPrice = customOriginalPrice
		rating = customRating ?? 4.9
		badge = overrideBadge || 'Special Offer'
		couponCode = overrideCoupon
		highlights = customHighlights || []
	}

	if (!targetUrl || targetUrl === '#') {
		if (!title) return null
	}

	// 2. Resolve CTA Button text
	const defaultButtonLabel = couponCode
		? 'Claim Exclusive Deal'
		: 'Check Latest Price'
	const finalButtonText = buttonText || defaultButtonLabel

	// 3. Theme Classes
	const themeClasses = {
		primary:
			'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-zinc-900/10',
		emerald:
			'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20',
		amber:
			'bg-amber-500 text-zinc-950 font-bold hover:bg-amber-600 shadow-amber-500/20',
		rose:
			'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20',
	}

	const handleCopy = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!couponCode) return
		navigator.clipboard.writeText(couponCode)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	// ================= LAYOUT 1: MINIMAL CTA BUTTON =================
	if (layout === 'button') {
		return (
			<div className="my-6 flex flex-col items-center justify-center gap-2">
				<Link
					href={targetUrl}
					target="_blank"
					rel="nofollow sponsored noopener noreferrer"
					className={cn(
						'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-7 py-3 text-sm font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer',
						themeClasses[buttonTheme],
					)}
				>
					<span>{finalButtonText}</span>
					<ExternalLink className="size-4 transition-transform group-hover:translate-x-0.5" />
				</Link>

				<span className="text-[11px] text-zinc-500 dark:text-zinc-400">
					Affiliate partner link • May earn commission
				</span>
			</div>
		)
	}

	// ================= LAYOUT 2: COMPACT DEAL STRIP =================
	if (layout === 'strip') {
		return (
			<aside className="my-6 overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-2xs">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div className="flex items-center gap-2.5 min-w-0">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
							<Zap className="size-4" />
						</div>
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								{badge && (
									<span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase dark:bg-blue-950/60 dark:text-blue-300">
										{badge}
									</span>
								)}
								<h4 className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">
									{title}
								</h4>
							</div>
							{(price || originalPrice) && (
								<div className="flex items-baseline gap-2 pt-0.5 text-xs">
									{price && (
										<span className="font-bold text-emerald-600 dark:text-emerald-400">
											{price}
										</span>
									)}
									{originalPrice && (
										<span className="text-zinc-400 line-through">
											{originalPrice}
										</span>
									)}
								</div>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						{couponCode && (
							<button
								type="button"
								onClick={handleCopy}
								className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
								aria-label="Copy coupon code"
							>
								<Tag className="size-3 text-zinc-400" />
								<code className="font-mono font-bold">{couponCode}</code>
								{copied ? (
									<span className="text-[11px] text-emerald-600 font-bold">Copied!</span>
								) : (
									<span className="text-[11px] text-zinc-600 dark:text-zinc-400">Copy</span>
								)}
							</button>
						)}

						<Link
							href={targetUrl}
							target="_blank"
							rel="nofollow sponsored noopener noreferrer"
							className={cn(
								'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold shadow-xs transition hover:-translate-y-0.5 active:scale-98 cursor-pointer',
								themeClasses[buttonTheme],
							)}
						>
							<span>{finalButtonText}</span>
							<ExternalLink className="size-3" />
						</Link>
					</div>
				</div>
			</aside>
		)
	}

	// ================= LAYOUT 3: THE VERDICT BOX (DEFAULT) =================
	return (
		<aside className="my-8 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-7 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
			{/* Top Header: Badge + Rating */}
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
				{badge && (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold tracking-wider text-blue-700 uppercase dark:bg-blue-950/60 dark:text-blue-300">
						<Sparkles className="size-3.5 text-blue-600 dark:text-blue-400" />
						{badge}
					</span>
				)}

				{rating !== undefined && rating > 0 && (
					<div className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
						<Star className="size-3.5 fill-amber-400 text-amber-400" />
						<span>{rating} / 5.0 Rating</span>
						{ratingCount && (
							<span className="text-zinc-600 dark:text-zinc-400 font-normal">
								({ratingCount.toLocaleString()} reviews)
							</span>
						)}
					</div>
				)}
			</div>

			{/* Main Body */}
			<div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-12 items-start">
				{/* Product Image */}
				{image?.asset && (
					<div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-2 sm:col-span-4 border border-zinc-100 dark:border-zinc-800">
						<Image
							src={urlFor(image).width(400).height(300).url()}
							alt={title}
							fill
							unoptimized
							className="object-contain p-2 transition-transform duration-500 hover:scale-105"
						/>
					</div>
				)}

				{/* Content, Pricing & Bullet Points */}
				<div className={cn('space-y-3.5', image?.asset ? 'sm:col-span-8' : 'sm:col-span-12')}>
					<h3 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
						{title}
					</h3>

					{/* Pricing Row */}
					{(price || originalPrice) && (
						<div className="flex items-baseline gap-2.5">
							{price && (
								<span className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
									{price}
								</span>
							)}
							{originalPrice && (
								<span className="text-sm font-medium text-zinc-600 line-through dark:text-zinc-400">
									{originalPrice}
								</span>
							)}
						</div>
					)}

					{/* Feature Bullet Points */}
					{highlights.length > 0 && (
						<ul className="space-y-2 pt-1 text-sm text-zinc-600 dark:text-zinc-300">
							{highlights.map((item, idx) => (
								<li key={idx} className="flex items-center gap-2">
									<Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
									<span>{item}</span>
								</li>
							))}
						</ul>
					)}

					{/* Verdict Note */}
					{verdictText && (
						<p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 italic pt-1 leading-relaxed">
							"{verdictText}"
						</p>
					)}

					{/* Coupon Code Box */}
					{couponCode && (
						<div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-800/60 border border-dashed border-zinc-300 dark:border-zinc-700">
							<span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Coupon Code:</span>
							<code className="font-mono text-sm font-bold text-zinc-950 dark:text-zinc-50">
								{couponCode}
							</code>
							<button
								type="button"
								onClick={handleCopy}
								className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
								aria-label="Copy coupon code"
							>
								{copied ? (
									<>
										<Check className="size-3.5 text-emerald-600" />
										<span className="text-emerald-600 font-bold">Copied!</span>
									</>
								) : (
									<>
										<Copy className="size-3.5" />
										<span>Copy Code</span>
									</>
								)}
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Bottom CTA & Disclosure */}
			<div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
				<Link
					href={targetUrl}
					target="_blank"
					rel="nofollow sponsored noopener noreferrer"
					className={cn(
						'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer',
						themeClasses[buttonTheme],
					)}
				>
					<span>{finalButtonText}</span>
					<ExternalLink className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
				</Link>

				<p className="text-center text-[11px] text-zinc-600 dark:text-zinc-400">
					Transparency: We may earn an affiliate commission when you purchase through our links at no extra cost to you.
				</p>
			</div>
		</aside>
	)
}
