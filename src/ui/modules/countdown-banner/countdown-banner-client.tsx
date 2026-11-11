'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { stegaClean } from 'next-sanity'
import { FiArrowRight, FiClock, FiShield, FiZap, FiCheckCircle } from 'react-icons/fi'
import { FaFire } from 'react-icons/fa6'
import { cn } from '@/lib/utils'

export interface CountdownBannerClientProps {
	moduleKey?: string
	badge?: string
	headline?: string
	subheadline?: string
	countdownType?: 'fixed' | 'evergreen'
	targetDate?: string
	fallbackHours?: number
	urgencyNote?: string
	showProgressBar?: boolean
	stockRemaining?: number
	stockTotal?: number
	ctaText?: string
	ctaLink?: string
	ctaSubtext?: string
	themeStyle?: 'urgent' | 'brand' | 'dark' | 'light' | 'accent'
	layout?: 'card' | 'split' | 'strip'
	expiredAction?: 'show_message' | 'hide' | 'evergreen_fallback'
	expiredMessage?: string
}

interface TimeRemaining {
	days: number
	hours: number
	minutes: number
	seconds: number
	isExpired: boolean
}

export default function CountdownBannerClient({
	moduleKey = 'countdown-banner',
	badge = 'LIMITED TIME OFFER',
	headline = 'Special Launch Offer — Save Up To 40% Today',
	subheadline = 'Claim your exclusive introductory discount before the promotional period ends. Pricing automatically increases once timer hits zero.',
	countdownType = 'fixed',
	targetDate,
	fallbackHours = 48,
	urgencyNote = 'Only 8 packages remaining at launch pricing',
	showProgressBar = false,
	stockRemaining = 8,
	stockTotal = 50,
	ctaText = 'Claim This Deal Now',
	ctaLink = '#lead-form',
	ctaSubtext = 'Instant confirmation • 30-day money-back guarantee',
	themeStyle = 'brand',
	layout = 'card',
	expiredAction = 'show_message',
	expiredMessage = 'This promotional offer has officially concluded. Stay tuned for our next seasonal event!',
}: CountdownBannerClientProps) {
	const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
		isExpired: false,
	})
	const [mounted, setMounted] = useState(false)

	// Clean props for stega strings and safety
	const cleanTargetDate = targetDate ? stegaClean(targetDate) : undefined
	const cleanCountdownType = stegaClean(countdownType) || (cleanTargetDate ? 'fixed' : 'evergreen')
	const cleanExpiredAction = stegaClean(expiredAction) || 'show_message'
	const cleanModuleKey = stegaClean(moduleKey) || 'countdown-banner'
	const cleanFallbackHours = Number(stegaClean(fallbackHours)) || 48
	const cleanCtaLink = stegaClean(ctaLink) || '#lead-form'
	const cleanThemeStyle = (stegaClean(themeStyle) || 'brand') as
		| 'urgent'
		| 'brand'
		| 'dark'
		| 'light'
		| 'accent'
	const cleanLayout = (stegaClean(layout) || 'card') as 'card' | 'split' | 'strip'

	useEffect(() => {
		setMounted(true)

		const calculateDestination = (): number => {
			const storageKey = `deanflow_timer_${cleanModuleKey}`

			if (cleanCountdownType === 'fixed' && cleanTargetDate) {
				const parsed = new Date(cleanTargetDate).getTime()
				if (!isNaN(parsed)) {
					if (parsed > Date.now()) {
						return parsed
					}
					// Fixed date has already passed
					if (cleanExpiredAction === 'evergreen_fallback') {
						const offset = cleanFallbackHours * 3600 * 1000
						return Date.now() + offset
					}
					return parsed // expired timestamp <= Date.now()
				}
			}

			// Evergreen Mode: Personalized rolling timer per visitor with localStorage persistence
			const offset = cleanFallbackHours * 3600 * 1000
			try {
				const stored = window.localStorage.getItem(storageKey)
				if (stored) {
					const parsedStored = parseInt(stored, 10)
					if (!isNaN(parsedStored)) {
						if (parsedStored > Date.now()) {
							return parsedStored
						}
						// Stored evergreen time expired
						if (cleanExpiredAction === 'evergreen_fallback') {
							const newTarget = Date.now() + offset
							window.localStorage.setItem(storageKey, newTarget.toString())
							return newTarget
						}
						return parsedStored // expired
					}
				}
				// Initial visit: establish destination and persist
				const newTarget = Date.now() + offset
				window.localStorage.setItem(storageKey, newTarget.toString())
				return newTarget
			} catch {
				return Date.now() + offset
			}
		}

		const destination = calculateDestination()

		const updateCountdown = () => {
			const now = Date.now()
			const diff = destination - now

			if (diff <= 0) {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
				return true // indicates expired
			}

			const days = Math.floor(diff / (1000 * 60 * 60 * 24))
			const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
			const seconds = Math.floor((diff % (1000 * 60)) / 1000)

			setTimeLeft({ days, hours, minutes, seconds, isExpired: false })
			return false
		}

		const initialExpired = updateCountdown()
		if (initialExpired) return

		const timer = setInterval(() => {
			const isDone = updateCountdown()
			if (isDone) {
				clearInterval(timer)
			}
		}, 1000)

		return () => clearInterval(timer)
	}, [cleanTargetDate, cleanCountdownType, cleanFallbackHours, cleanModuleKey, cleanExpiredAction])

	const pad = (n: number) => n.toString().padStart(2, '0')

	// Calculated stock progress percentage
	const claimedPercentage = useMemo(() => {
		const total = Number(stockTotal) || 50
		const remaining = Number(stockRemaining) || 8
		if (total <= 0) return 84
		const claimed = Math.max(0, total - remaining)
		const pct = Math.round((claimed / total) * 100)
		return Math.min(96, Math.max(10, pct))
	}, [stockTotal, stockRemaining])

	// Theme color variants with guaranteed WCAG 2.2 AA contrast in both light & dark environments
	const themeClasses = useMemo(() => {
		return {
			urgent: {
				container:
					'bg-linear-to-br from-red-600 via-rose-700 to-orange-700 border-red-500/40 text-white shadow-xl',
				badge: 'bg-white/20 text-white border-white/30 backdrop-blur-xs',
				timerBox: 'bg-black/20 border-white/20 text-white backdrop-blur-md',
				timerNum: 'text-white',
				timerLabel: 'text-rose-100',
				ctaBtn:
					'bg-white text-red-700 hover:bg-rose-50 shadow-lg shadow-black/20 font-bold focus-visible:ring-white',
				headline: 'text-white',
				subheadline: 'text-rose-100/90',
				progressBg: 'bg-black/25',
				progressFill: 'bg-linear-to-r from-amber-300 to-yellow-200',
			},
			brand: {
				container:
					'bg-linear-to-br from-blue-700 via-indigo-700 to-slate-900 border-blue-500/30 text-white shadow-xl',
				badge: 'bg-white/20 text-white border-white/30 backdrop-blur-xs',
				timerBox: 'bg-white/10 border-white/20 text-white backdrop-blur-md',
				timerNum: 'text-white',
				timerLabel: 'text-blue-100',
				ctaBtn:
					'bg-white text-indigo-900 hover:bg-blue-50 shadow-lg shadow-black/20 font-bold focus-visible:ring-white',
				headline: 'text-white',
				subheadline: 'text-blue-100/90',
				progressBg: 'bg-white/20',
				progressFill: 'bg-linear-to-r from-amber-400 to-yellow-300',
			},
			dark: {
				container:
					'bg-slate-950 border-slate-800 text-white shadow-2xl',
				badge: 'bg-slate-800 text-slate-200 border-slate-700',
				timerBox: 'bg-slate-900/90 border-slate-700 text-white',
				timerNum: 'text-amber-400',
				timerLabel: 'text-slate-400',
				ctaBtn:
					'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 focus-visible:ring-amber-400',
				headline: 'text-white',
				subheadline: 'text-slate-300',
				progressBg: 'bg-slate-800',
				progressFill: 'bg-linear-to-r from-amber-500 to-amber-400',
			},
			light: {
				container:
					'bg-surface border-border/90 text-foreground shadow-sm',
				badge: 'bg-primary/10 text-primary border-primary/20',
				timerBox: 'bg-background border-border text-foreground shadow-xs',
				timerNum: 'text-primary',
				timerLabel: 'text-muted-foreground',
				ctaBtn:
					'bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md focus-visible:ring-primary',
				headline: 'text-foreground',
				subheadline: 'text-muted-foreground',
				progressBg: 'bg-muted',
				progressFill: 'bg-primary',
			},
			accent: {
				container:
					'bg-linear-to-br from-amber-600 via-orange-600 to-red-600 border-orange-500/30 text-white shadow-xl',
				badge: 'bg-white/20 text-white border-white/30 backdrop-blur-xs',
				timerBox: 'bg-white/10 border-white/20 text-white backdrop-blur-md',
				timerNum: 'text-white',
				timerLabel: 'text-orange-100',
				ctaBtn:
					'bg-white text-orange-950 hover:bg-orange-50 shadow-lg shadow-black/20 font-bold focus-visible:ring-white',
				headline: 'text-white',
				subheadline: 'text-orange-100/90',
				progressBg: 'bg-white/25',
				progressFill: 'bg-linear-to-r from-yellow-300 to-amber-200',
			},
		}[cleanThemeStyle] || {
			container: 'bg-linear-to-br from-blue-700 via-indigo-700 to-slate-900 border-blue-500/30 text-white shadow-xl',
			badge: 'bg-white/20 text-white border-white/30',
			timerBox: 'bg-white/10 border-white/20 text-white',
			timerNum: 'text-white',
			timerLabel: 'text-blue-100',
			ctaBtn: 'bg-white text-indigo-900 hover:bg-blue-50 font-bold',
			headline: 'text-white',
			subheadline: 'text-blue-100/90',
			progressBg: 'bg-white/20',
			progressFill: 'bg-linear-to-r from-amber-400 to-yellow-300',
		}
	}, [cleanThemeStyle])

	// If expired and merchant configured module to disappear
	if (mounted && timeLeft.isExpired && cleanExpiredAction === 'hide') {
		return null
	}

	const isExternalLink = /^https?:\/\//.test(cleanCtaLink)

	const timeUnits = [
		{ label: 'Days', value: pad(timeLeft.days) },
		{ label: 'Hours', value: pad(timeLeft.hours) },
		{ label: 'Mins', value: pad(timeLeft.minutes) },
		{ label: 'Secs', value: pad(timeLeft.seconds) },
	]

	// Screen-reader announcement (polite, avoids intrusive 1-second vocal bombardment)
	const srAnnouncement = mounted
		? timeLeft.isExpired
			? expiredMessage
			: `Limited time promotion. Time remaining: ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds.`
		: 'Limited time countdown loading.'

	// ==========================================
	// LAYOUT 1: COMPACT STRIP (Slim Bar)
	// ==========================================
	if (cleanLayout === 'strip') {
		return (
			<div
				className={cn(
					'relative overflow-hidden rounded-2xl border px-4 py-3.5 sm:px-6 sm:py-4 transition-all duration-300',
					themeClasses.container,
				)}
				role="region"
				aria-label="Limited Time Offer Banner"
			>
				<span className="sr-only" aria-live="polite">
					{srAnnouncement}
				</span>

				<div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
					{/* Left: Badge & Headline */}
					<div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
						{badge && (
							<span
								className={cn(
									'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider shrink-0',
									themeClasses.badge,
								)}
							>
								<FiZap className="size-3 shrink-0" aria-hidden="true" />
								<span>{badge}</span>
							</span>
						)}
						<h3 className={cn('text-sm font-semibold sm:text-base leading-snug truncate max-w-xl', themeClasses.headline)}>
							{timeLeft.isExpired ? expiredMessage : headline}
						</h3>
					</div>

					{/* Right: Digits & CTA */}
					<div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-between md:justify-end">
						{!timeLeft.isExpired && (
							<div
								className="flex items-center gap-1.5 font-mono tabular-nums text-xs sm:text-sm font-bold shrink-0"
								aria-hidden="true"
							>
								<FiClock className="size-4 opacity-80 shrink-0" />
								<span>
									{mounted ? (
										`${pad(timeLeft.days)}d : ${pad(timeLeft.hours)}h : ${pad(timeLeft.minutes)}m : ${pad(timeLeft.seconds)}s`
									) : (
										'--d : --h : --m : --s'
									)}
								</span>
							</div>
						)}

						{ctaText && !timeLeft.isExpired && (
							<Link
								href={cleanCtaLink}
								target={isExternalLink ? '_blank' : undefined}
								rel={isExternalLink ? 'noopener noreferrer' : undefined}
								className={cn(
									'inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:text-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 w-full sm:w-auto text-center',
									themeClasses.ctaBtn,
								)}
							>
								<span>{ctaText}</span>
								<FiArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
							</Link>
						)}
					</div>
				</div>
			</div>
		)
	}

	// ==========================================
	// LAYOUT 2: SPLIT BANNER (Side-by-Side)
	// ==========================================
	if (cleanLayout === 'split') {
		return (
			<div
				className={cn(
					'relative overflow-hidden rounded-3xl border p-5 sm:p-8 md:p-10 transition-all duration-300',
					themeClasses.container,
				)}
				role="region"
				aria-label="Promotional Flash Offer"
			>
				<span className="sr-only" aria-live="polite">
					{srAnnouncement}
				</span>

				<div className="grid gap-6 sm:gap-8 lg:grid-cols-12 lg:items-center">
					{/* Left info */}
					<div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
						{badge && (
							<div
								className={cn(
									'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider',
									themeClasses.badge,
								)}
							>
								<FiZap className="size-3.5 shrink-0" aria-hidden="true" />
								<span>{timeLeft.isExpired ? 'OFFER CONCLUDED' : badge}</span>
							</div>
						)}

						<h2
							className={cn(
								'text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl leading-tight',
								themeClasses.headline,
							)}
						>
							{timeLeft.isExpired ? 'Promotion Ended' : headline}
						</h2>

						<p className={cn('text-sm leading-relaxed sm:text-base opacity-95', themeClasses.subheadline)}>
							{timeLeft.isExpired ? expiredMessage : subheadline}
						</p>

						{urgencyNote && !timeLeft.isExpired && (
							<div className="flex items-center gap-2 text-xs font-semibold sm:text-sm opacity-95">
								<FaFire className="size-4 text-orange-400 shrink-0" aria-hidden="true" />
								<span>{urgencyNote}</span>
							</div>
						)}

						{/* Optional Stock Progress Bar */}
						{showProgressBar && !timeLeft.isExpired && (
							<div className="max-w-md pt-1">
								<div className="flex justify-between text-xs font-semibold mb-1.5 opacity-90">
									<span>Limited Promotional Batch</span>
									<span>{stockRemaining} units left ({claimedPercentage}% claimed)</span>
								</div>
								<div className={cn('h-2 w-full overflow-hidden rounded-full', themeClasses.progressBg)}>
									<div
										className={cn('h-full rounded-full transition-all duration-700 ease-out', themeClasses.progressFill)}
										style={{ width: `${claimedPercentage}%` }}
										role="progressbar"
										aria-valuenow={claimedPercentage}
										aria-valuemin={0}
										aria-valuemax={100}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Right Timer & CTA */}
					<div className="lg:col-span-5 flex flex-col items-center justify-center space-y-5">
						{!timeLeft.isExpired ? (
							<>
								<div
									className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-sm"
									role="timer"
									aria-label="Time remaining"
								>
									{timeUnits.map((u, i) => (
										<div
											key={i}
											className={cn(
												'flex flex-col items-center justify-center rounded-2xl border p-2 sm:p-3 text-center transition-all min-w-0',
												themeClasses.timerBox,
											)}
										>
											<span
												className={cn(
													'font-mono tabular-nums text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight',
													themeClasses.timerNum,
												)}
												aria-hidden="true"
											>
												{mounted ? u.value : '--'}
											</span>
											<span
												className={cn(
													'mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate max-w-full',
													themeClasses.timerLabel,
												)}
											>
												{u.label}
											</span>
										</div>
									))}
								</div>

								{ctaText && (
									<div className="w-full max-w-sm text-center">
										<Link
											href={cleanCtaLink}
											target={isExternalLink ? '_blank' : undefined}
											rel={isExternalLink ? 'noopener noreferrer' : undefined}
											className={cn(
												'group flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-center text-sm font-bold transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
												themeClasses.ctaBtn,
											)}
										>
											<span>{ctaText}</span>
											<FiArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
										</Link>
										{ctaSubtext && (
											<p className="mt-2 text-center text-xs opacity-85 flex items-center justify-center gap-1.5">
												<FiShield className="size-3.5 shrink-0" aria-hidden="true" />
												<span>{ctaSubtext}</span>
											</p>
										)}
									</div>
								)}
							</>
						) : (
							<div className="flex flex-col items-center justify-center rounded-2xl border p-6 text-center w-full max-w-sm bg-black/10 border-white/15">
								<FiCheckCircle className="size-8 text-amber-400 mb-2" aria-hidden="true" />
								<p className="text-sm font-bold text-white mb-3">Promotion Concluded</p>
								<Link
									href={cleanCtaLink}
									className="inline-flex min-h-[40px] items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white transition-all"
								>
									Explore Available Products
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	// ==========================================
	// LAYOUT 3: FEATURED HERO CARD (Stacked Center - Default)
	// ==========================================
	return (
		<div
			className={cn(
				'theme-banner relative overflow-hidden rounded-3xl border p-5 sm:p-8 md:p-12 text-center transition-all duration-300',
				themeClasses.container,
			)}
			role="region"
			aria-label="Promotional Countdown Offer"
		>
			<span className="sr-only" aria-live="polite">
				{srAnnouncement}
			</span>

			<div className="relative z-10 mx-auto max-w-2xl space-y-5 sm:space-y-6">
				{badge && (
					<div
						className={cn(
							'inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider',
							themeClasses.badge,
						)}
					>
						<FiZap className="size-3.5 shrink-0" aria-hidden="true" />
						<span>{timeLeft.isExpired ? 'OFFER CONCLUDED' : badge}</span>
					</div>
				)}

				<h2
					className={cn(
						'text-2xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-tight',
						themeClasses.headline,
					)}
				>
					{timeLeft.isExpired ? 'Special Promotion Concluded' : headline}
				</h2>

				<p className={cn('text-sm leading-relaxed sm:text-base md:text-lg opacity-95', themeClasses.subheadline)}>
					{timeLeft.isExpired ? expiredMessage : subheadline}
				</p>

				{/* Countdown Digit Blocks */}
				{!timeLeft.isExpired ? (
					<>
						<div
							className="mx-auto grid max-w-md grid-cols-4 gap-2 sm:gap-3.5 py-1"
							role="timer"
							aria-label="Time remaining"
						>
							{timeUnits.map((u, i) => (
								<div
									key={i}
									className={cn(
										'flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 text-center transition-all min-w-0',
										themeClasses.timerBox,
									)}
								>
									<span
										className={cn(
											'font-mono tabular-nums text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight',
											themeClasses.timerNum,
										)}
										aria-hidden="true"
									>
										{mounted ? u.value : '--'}
									</span>
									<span
										className={cn(
											'mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate max-w-full',
											themeClasses.timerLabel,
										)}
									>
										{u.label}
									</span>
								</div>
							))}
						</div>

						{/* Stock Quota / Scarcity Proof Bar */}
						{showProgressBar && (
							<div className="mx-auto max-w-md pt-1">
								<div className="flex justify-between text-xs font-semibold mb-1.5 opacity-90">
									<span>Promotional Stock Status</span>
									<span>{stockRemaining} units left ({claimedPercentage}% claimed)</span>
								</div>
								<div className={cn('h-2.5 w-full overflow-hidden rounded-full', themeClasses.progressBg)}>
									<div
										className={cn('h-full rounded-full transition-all duration-700 ease-out', themeClasses.progressFill)}
										style={{ width: `${claimedPercentage}%` }}
										role="progressbar"
										aria-valuenow={claimedPercentage}
										aria-valuemin={0}
										aria-valuemax={100}
									/>
								</div>
							</div>
						)}

						{urgencyNote && (
							<div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold sm:text-sm opacity-95">
								<FaFire className="size-4 text-orange-400 shrink-0" aria-hidden="true" />
								<span>{urgencyNote}</span>
							</div>
						)}

						{ctaText && (
							<div className="mx-auto max-w-md pt-1">
								<Link
									href={cleanCtaLink}
									target={isExternalLink ? '_blank' : undefined}
									rel={isExternalLink ? 'noopener noreferrer' : undefined}
									className={cn(
										'group flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-center text-sm sm:text-base font-bold transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
										themeClasses.ctaBtn,
									)}
								>
									<span>{ctaText}</span>
									<FiArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
								</Link>
								{ctaSubtext && (
									<p className="mt-2.5 text-center text-xs opacity-85 flex items-center justify-center gap-1.5">
										<FiShield className="size-3.5 shrink-0" aria-hidden="true" />
										<span>{ctaSubtext}</span>
									</p>
								)}
							</div>
						)}
					</>
				) : (
					<div className="mx-auto max-w-md rounded-2xl border p-6 bg-black/10 border-white/15">
						<FiCheckCircle className="size-10 text-amber-400 mx-auto mb-2" aria-hidden="true" />
						<p className="text-base font-bold text-white mb-2">Deal Concluded</p>
						<p className="text-xs text-white/80 mb-4">{expiredMessage}</p>
						<Link
							href={cleanCtaLink}
							className="inline-flex min-h-[42px] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-white/20 hover:bg-white/30 text-white transition-all"
						>
							View Current Offers
						</Link>
					</div>
				)}
			</div>
		</div>
	)
}
