'use client'

import { useState, useId } from 'react'
import { FiPlay, FiPause } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import type { Logo } from '@/sanity/types'
import Img from '@/ui/img'
import css from './logo-list.module.css'

export type LogoItem = Partial<Logo> & {
	url?: string
}

export interface LogoListClientProps {
	logos: LogoItem[]
	logoType?: 'default' | 'dark' | 'light'
	autoScroll?: boolean
	duration?: number
	speed?: 'slow' | 'medium' | 'fast' | 'custom'
	direction?: 'left' | 'right'
	pauseOnHover?: boolean
	showControls?: boolean
	gapSize?: 'compact' | 'normal' | 'spacious'
	logoHeight?: 'small' | 'medium' | 'large'
}

const GAP_STYLES: Record<string, string> = {
	compact: '1.5rem',
	normal: '3rem',
	spacious: '4.5rem',
}

const HEIGHT_CLASSES: Record<string, string> = {
	small: 'h-6 sm:h-8 max-h-6 sm:max-h-8',
	medium: 'h-8 sm:h-10 max-h-8 sm:max-h-10',
	large: 'h-10 sm:h-12 md:h-14 max-h-10 sm:max-h-12 md:max-h-14',
}

export default function LogoListClient({
	logos,
	logoType = 'default',
	autoScroll = true,
	duration = 25,
	speed = 'medium',
	direction = 'left',
	pauseOnHover = true,
	showControls = true,
	gapSize = 'normal',
	logoHeight = 'medium',
}: LogoListClientProps) {
	const [isPaused, setIsPaused] = useState(false)
	const regionId = useId()

	if (!logos || logos.length === 0) {
		return null
	}

	// Calculate speed duration
	const effectiveDuration = (() => {
		if (speed === 'slow') return 35
		if (speed === 'fast') return 15
		if (speed === 'medium') return 25
		if (duration && Number.isFinite(duration) && duration > 0) return duration
		return 25
	})()

	const gapValue = GAP_STYLES[gapSize] || GAP_STYLES.normal
	const heightClass = HEIGHT_CLASSES[logoHeight] || HEIGHT_CLASSES.medium
	const isReverse = direction === 'right'

	// Ensure at least 8 items per group so low logo counts fill ultra-wide screens
	const repeatFactor = autoScroll ? Math.max(1, Math.ceil(8 / logos.length)) : 1

	// Render a single logo element
	const renderLogo = (
		logo: LogoItem,
		key: string,
		isAccessible: boolean,
	) => {
		if (!logo.image) return null

		const imageSource = logo.image[logoType] ?? logo.image.default
		if (!imageSource) return null

		const title = logo.title?.trim() || 'Partner logo'
		const content = (
			<div className="flex items-center justify-center shrink-0 px-2 sm:px-4">
				<Img
					className={cn(
						'w-auto object-contain transition-all duration-300 pointer-events-auto',
						heightClass,
						'max-w-[130px] sm:max-w-[160px] md:max-w-[190px]',
						logoType === 'default'
							? 'opacity-80 hover:opacity-100 grayscale hover:grayscale-0'
							: 'opacity-70 hover:opacity-100'
					)}
					image={imageSource}
					width={240}
					alt={isAccessible ? title : ''}
					aria-hidden={!isAccessible ? true : undefined}
					loading="lazy"
				/>
			</div>
		)

		if (logo.url) {
			return (
				<li key={key} className="list-none shrink-0" role="none">
					<a
						href={logo.url}
						target="_blank"
						rel="noopener noreferrer"
						tabIndex={isAccessible ? 0 : -1}
						aria-label={isAccessible ? `${title} (opens in new tab)` : undefined}
						aria-hidden={!isAccessible ? true : undefined}
						className="inline-flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-transform hover:scale-105 active:scale-95"
					>
						{content}
					</a>
				</li>
			)
		}

		return (
			<li key={key} className="list-none shrink-0" role="none">
				{content}
			</li>
		)
	}

	// Static (No Marquee) Grid / Flex layout
	if (!autoScroll) {
		return (
			<ul
				className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-12 py-2"
				aria-label="Partner and client logos"
			>
				{logos.map((logo, idx) => renderLogo(logo, `static-${idx}`, true))}
			</ul>
		)
	}

	return (
		<div className="space-y-3">
			<div
				className={css.marqueeWrapper}
				role="region"
				aria-labelledby={regionId}
			>
				<div
					className={css.track}
					data-paused={isPaused ? 'true' : 'false'}
					data-pause-on-hover={pauseOnHover ? 'true' : 'false'}
					style={
						{
							'--marquee-gap': gapValue,
							'--marquee-duration': `${effectiveDuration}s`,
						} as React.CSSProperties
					}
				>
					{/* Group A (Primary Stream) */}
					<ul
						id={regionId}
						className={cn(css.group, isReverse && css.groupReverse)}
						aria-label="Partner and client logos"
					>
						{Array.from({ length: repeatFactor }).map((_, rIdx) =>
							logos.map((logo, lIdx) =>
								renderLogo(
									logo,
									`group-a-${rIdx}-${lIdx}`,
									rIdx === 0, // Only first occurrence is exposed to assistive tech
								)
							)
						)}
					</ul>

					{/* Group B (Duplicated loop twin for seamless infinite scroll) */}
					<ul
						className={cn(css.group, isReverse && css.groupReverse)}
						aria-hidden="true"
						data-duplicate="true"
					>
						{Array.from({ length: repeatFactor }).map((_, rIdx) =>
							logos.map((logo, lIdx) =>
								renderLogo(
									logo,
									`group-b-${rIdx}-${lIdx}`,
									false, // Purely decorative loop clone
								)
							)
						)}
					</ul>
				</div>
			</div>

			{/* Accessible Pause / Play Control (WCAG 2.2 AA - Guideline 2.2.2 Pause, Stop, Hide) */}
			{showControls && (
				<div className="flex justify-center sm:justify-end px-4">
					<button
						type="button"
						onClick={() => setIsPaused((prev) => !prev)}
						className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-background/80 hover:bg-background border border-border/80 text-muted-foreground hover:text-foreground shadow-xs transition-colors backdrop-blur-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer select-none"
						aria-label={isPaused ? 'Resume logo scroll animation' : 'Pause logo scroll animation'}
						aria-pressed={isPaused}
					>
						{isPaused ? (
							<>
								<FiPlay className="size-3 text-primary" aria-hidden="true" />
								<span>Resume animation</span>
							</>
						) : (
							<>
								<FiPause className="size-3 text-muted-foreground" aria-hidden="true" />
								<span>Pause animation</span>
							</>
						)}
					</button>
				</div>
			)}
		</div>
	)
}
