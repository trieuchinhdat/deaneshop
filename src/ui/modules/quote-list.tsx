import {
	ArrowUpRight,
	CheckCircle2,
	MessageSquareHeart,
	ShieldCheck,
	Star,
} from 'lucide-react'
import { PortableText } from 'next-sanity'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { QuoteList } from '@/sanity/types'
import CTAList from '@/ui/cta-list'
import { moduleAttributes, type ModuleProps } from '.'
import QuoteListClient from './quote-list-client'

export type EnhancedQuoteListProps = QuoteList &
	ModuleProps & {
		_key: string
		headline?: string
		badge?: string
		subtitle?: string
		showTrustScore?: boolean
		trustScoreValue?: string
		trustScoreLabel?: string
		trustPlatform?:
			'none' | 'trustpilot' | 'google' | 'feefo' | 'clutch' | string
		trustPlatformScore?: string
		trustPlatformUrl?: string
		enableCategoryFilter?: boolean
		layout?: 'masonry' | 'grid' | 'carousel' | 'marquee'
		columns?: 2 | 3 | 4
		mobileLayout?: 'carousel' | 'stack'
		cardStyle?: 'bordered' | 'elevated' | 'minimal' | 'glass'
		spacing?: 'compact' | 'default' | 'relaxed'
		headerAlign?: 'center' | 'left'
		showRating?: boolean
		showVerifiedBadge?: boolean
		showQuoteIcon?: boolean
		showMediaLogo?: boolean
		ctas?: any[]
		sanityAttr?: any
	}

export default function QuoteListComponent({
	intro = [],
	headline,
	badge,
	subtitle,
	showTrustScore = true,
	trustScoreValue = '4.9 / 5.0',
	trustScoreLabel = 'Average rating from 2,500+ verified orders across the US & UK',
	trustPlatform = 'none',
	trustPlatformScore = '4.9',
	trustPlatformUrl,
	enableCategoryFilter = false,
	testimonials,
	layout = 'masonry',
	columns = 3,
	mobileLayout = 'carousel',
	cardStyle = 'bordered',
	spacing = 'default',
	headerAlign = 'center',
	showRating = true,
	showVerifiedBadge = true,
	showQuoteIcon = true,
	showMediaLogo = true,
	ctas,
	_key,
	sanityAttr,
	...props
}: EnhancedQuoteListProps) {
	// Spacing variation
	const spacingClasses = {
		compact: 'py-8 sm:py-12 md:py-14',
		default: 'py-12 sm:py-16 md:py-20',
		relaxed: 'py-16 sm:py-20 md:py-28',
	}[spacing]

	// Header alignment classes
	const isLeftAligned = headerAlign === 'left'

	// Studio empty state when no testimonials are linked
	if (!testimonials || testimonials.length === 0) {
		return (
			<section
				className={cn('section', spacingClasses)}
				{...moduleAttributes({ _key, ...props })}
			>
				<div className="border-border/80 bg-muted/20 mx-auto max-w-2xl space-y-3 rounded-3xl border-2 border-dashed p-8 text-center sm:p-12">
					<div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-2xl">
						<MessageSquareHeart className="size-6" />
					</div>
					<h3 className="text-foreground text-base font-bold sm:text-lg">
						Wall of Love (Testimonials)
					</h3>
					<p className="text-muted-foreground mx-auto max-w-md text-xs sm:text-sm">
						No testimonials configured yet. Select this section in Sanity Studio
						to add verified reviews, press features, or customer quotes.
					</p>
				</div>
			</section>
		)
	}

	const hasHeaderContent =
		Boolean(badge) ||
		Boolean(headline) ||
		Boolean(subtitle) ||
		(Array.isArray(intro) && intro.length > 0) ||
		Boolean(showTrustScore)

	return (
		<section
			className={cn('section space-y-8 sm:space-y-12', spacingClasses)}
			{...moduleAttributes({ _key, ...props })}
		>
			{/* Header Hook */}
			{hasHeaderContent && (
				<header
					className={cn(
						'flex flex-col gap-3.5',
						isLeftAligned
							? 'max-w-3xl text-left'
							: 'mx-auto max-w-3xl items-center text-center',
					)}
				>
					{/* Header Badge */}
					{badge && (
						<div className="inline-flex">
							<span className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase">
								<CheckCircle2 className="size-3.5" aria-hidden="true" />
								<span>{badge}</span>
							</span>
						</div>
					)}

					{/* Section Headline */}
					{headline && (
						<h2 className="text-foreground text-2xl leading-[1.15] font-extrabold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
							{headline}
						</h2>
					)}

					{/* Subtitle Description */}
					{subtitle && (
						<p className="text-muted-foreground max-w-2xl text-base leading-relaxed sm:text-lg">
							{subtitle}
						</p>
					)}

					{/* Backward-compatible Rich Text Intro */}
					{intro && intro.length > 0 && (
						<div className="prose prose-base sm:prose-lg dark:prose-invert text-muted-foreground max-w-2xl">
							<PortableText value={intro} />
						</div>
					)}

					{/* Aggregate Trust Score Pill */}
					{showTrustScore && (
						<div
							className={cn(
								'border-border/80 bg-surface/80 text-foreground mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border px-4 py-1.5 text-xs shadow-2xs backdrop-blur-xs sm:text-sm',
								isLeftAligned ? 'self-start' : 'self-center',
							)}
						>
							<div
								className="flex items-center gap-0.5 text-amber-500"
								role="img"
								aria-label="5 out of 5 stars average rating"
							>
								{Array.from({ length: 5 }).map((_, i) => (
									<Star
										key={i}
										className="size-3.5 fill-amber-400 text-amber-400"
										aria-hidden="true"
									/>
								))}
							</div>

							{trustScoreValue && (
								<strong className="text-foreground font-extrabold">
									{trustScoreValue}
								</strong>
							)}

							{trustScoreLabel && (
								<span className="text-muted-foreground text-xs sm:text-sm">
									• {trustScoreLabel}
								</span>
							)}

							{/* External Review Platform Badge */}
							{trustPlatform && trustPlatform !== 'none' && (
								<div className="border-border/80 ml-1 flex items-center gap-1.5 border-l pl-2">
									{trustPlatform === 'trustpilot' && (
										<span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
											<span className="flex size-4 items-center justify-center rounded-xs bg-[#00b67a] text-white">
												★
											</span>
											<span>Trustpilot</span>
											{trustPlatformScore && (
												<span className="font-extrabold">
													{trustPlatformScore}
												</span>
											)}
										</span>
									)}

									{trustPlatform === 'google' && (
										<span className="text-foreground inline-flex items-center gap-1 text-[11px] font-bold">
											<span className="font-extrabold text-blue-600">G</span>
											<span>Reviews</span>
											{trustPlatformScore && (
												<span className="font-extrabold">
													{trustPlatformScore}
												</span>
											)}
										</span>
									)}

									{(trustPlatform === 'feefo' ||
										trustPlatform === 'clutch') && (
										<span className="text-foreground inline-flex items-center gap-1 text-[11px] font-bold">
											<ShieldCheck
												className="text-primary size-3.5"
												aria-hidden="true"
											/>
											<span className="capitalize">{trustPlatform}</span>
											{trustPlatformScore && (
												<span className="font-extrabold">
													{trustPlatformScore}
												</span>
											)}
										</span>
									)}

									{trustPlatformUrl && (
										<Link
											href={trustPlatformUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-primary ml-0.5 inline-flex items-center transition-colors"
											aria-label={`View verified reviews on ${trustPlatform} (opens in a new tab)`}
											title={`View on ${trustPlatform}`}
										>
											<ArrowUpRight className="size-3.5" aria-hidden="true" />
										</Link>
									)}
								</div>
							)}
						</div>
					)}
				</header>
			)}

			{/* Interactive / Responsive Testimonial Presentations */}
			<QuoteListClient
				testimonials={testimonials}
				layout={layout}
				columns={columns}
				mobileLayout={mobileLayout}
				cardStyle={cardStyle}
				showRating={showRating}
				showVerifiedBadge={showVerifiedBadge}
				showQuoteIcon={showQuoteIcon}
				showMediaLogo={showMediaLogo}
				enableCategoryFilter={enableCategoryFilter}
				sanityAttrMap={
					sanityAttr
						? testimonials.reduce<Record<string, string>>((acc, item: any) => {
								if (item?._key) {
									try {
										acc[item._key] = sanityAttr
											.scope(`testimonials[_key=="${item._key}"]`)
											.toString()
									} catch {
										// Ignore visual editing scope errors
									}
								}
								return acc
							}, {})
						: undefined
				}
				anchorKey={`-quote-list-${_key}`}
			/>

			{/* Bottom Call to Actions */}
			{ctas && ctas.length > 0 && (
				<div
					className={cn(
						'flex pt-2 sm:pt-4',
						isLeftAligned ? 'justify-start' : 'justify-center',
					)}
				>
					<CTAList ctas={ctas} />
				</div>
			)}
		</section>
	)
}
