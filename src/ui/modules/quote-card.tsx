import { ArrowUpRight, CheckCircle2, Play, Quote, Star } from 'lucide-react'
import { PortableText } from 'next-sanity'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import Img from '@/ui/img'

export interface QuoteAuthor {
	name?: string
	title?: string
	company?: string
	country?: string
	image?: any
}

export interface QuoteItemData {
	_key?: string
	_id?: string
	_type?: string
	endorsementType?: 'customer' | 'press' | 'expert' | 'partner' | string
	headline?: string
	quote?: any
	rating?: number
	author?: QuoteAuthor
	verifiedBuyer?: boolean
	verifiedBadgeText?: string
	date?: string
	mediaLogo?: any
	sourceUrl?: string
	videoUrl?: string
	videoThumbnail?: any
	videoDuration?: string
}

interface QuoteCardProps {
	testimonial: QuoteItemData
	cardStyle?: 'bordered' | 'elevated' | 'minimal' | 'glass'
	showRating?: boolean
	showVerifiedBadge?: boolean
	showQuoteIcon?: boolean
	showMediaLogo?: boolean
	onPlayVideo?: (url: string) => void
	dataSanity?: string
	className?: string
}

/**
 * Derives a clean monogram from author or company name
 */
function getInitials(name?: string, fallback = 'CL'): string {
	if (!name || typeof name !== 'string') return fallback
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return fallback
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function QuoteCard({
	testimonial,
	cardStyle = 'bordered',
	showRating = true,
	showVerifiedBadge = true,
	showQuoteIcon = true,
	showMediaLogo = true,
	onPlayVideo,
	dataSanity,
	className,
}: QuoteCardProps) {
	const author = testimonial?.author
	const rating =
		typeof testimonial?.rating === 'number' ? testimonial.rating : 5
	const hasStars = showRating && rating > 0
	const headline = testimonial?.headline
	const quote = testimonial?.quote
	const date = testimonial?.date
	const sourceUrl = testimonial?.sourceUrl
	const verifiedBuyer = testimonial?.verifiedBuyer ?? true
	const verifiedBadgeText = testimonial?.verifiedBadgeText || 'Verified'

	const hasLogo = Boolean(testimonial?.mediaLogo?.asset)
	const logoUrl =
		hasLogo && showMediaLogo
			? urlFor(testimonial.mediaLogo).width(280).url()
			: null

	// Surface style classes
	const surfaceClasses = {
		bordered:
			'bg-card border border-border/80 text-foreground shadow-2xs hover:border-primary/40 hover:shadow-md',
		elevated:
			'bg-card border border-border/50 text-foreground shadow-sm hover:shadow-xl hover:border-primary/50',
		minimal:
			'bg-muted/40 border border-transparent text-foreground hover:bg-muted/70 hover:border-border/40',
		glass:
			'bg-card/60 backdrop-blur-md border border-border/60 text-foreground shadow-xs hover:border-primary/40',
	}[cardStyle]

	const initials = getInitials(
		author?.name || author?.company || 'Verified Client',
	)

	return (
		<figure
			data-sanity={dataSanity}
			className={cn(
				'group relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 sm:p-7',
				surfaceClasses,
				className,
			)}
		>
			<div className="flex flex-col gap-4">
				{/* Top Meta Bar: Stars, Media Logo, Verified Badge, and Quote Icon */}
				<div className="flex min-h-[32px] items-start justify-between gap-3">
					<div className="flex flex-wrap items-center gap-2.5">
						{/* Star Rating Display */}
						{hasStars && (
							<div
								className="flex items-center gap-0.5 text-amber-500"
								role="img"
								aria-label={`Rated ${rating} out of 5 stars`}
							>
								{Array.from({ length: 5 }).map((_, i) => (
									<Star
										key={i}
										className={cn(
											'size-4 transition-colors',
											i < rating
												? 'fill-amber-400 text-amber-400'
												: 'fill-muted/30 text-muted-foreground/30',
										)}
										aria-hidden="true"
									/>
								))}
							</div>
						)}

						{/* Verified Buyer Badge */}
						{showVerifiedBadge && verifiedBuyer && (
							<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
								<CheckCircle2
									className="size-3 text-emerald-600 dark:text-emerald-400"
									aria-hidden="true"
								/>
								<span>{verifiedBadgeText}</span>
							</span>
						)}
					</div>

					<div className="flex shrink-0 items-center gap-2">
						{/* Source Link */}
						{sourceUrl && (
							<Link
								href={sourceUrl}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Read original review or article from ${author?.company || author?.name || 'source'} (opens in a new tab)`}
								className="text-muted-foreground hover:text-primary focus-visible:ring-primary inline-flex items-center gap-0.5 rounded-md p-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
								title="Read original source"
							>
								<span>Source</span>
								<ArrowUpRight className="size-3.5" aria-hidden="true" />
							</Link>
						)}

						{/* Decorative Quote Icon Watermark */}
						{showQuoteIcon && (
							<Quote
								className="text-muted-foreground/20 group-hover:text-primary/30 size-6 transition-colors"
								aria-hidden="true"
							/>
						)}
					</div>
				</div>

				{/* Optional Media Logo */}
				{logoUrl && (
					<div className="relative my-0.5 h-7 w-auto max-w-[150px] opacity-80 grayscale transition-all hover:opacity-100 hover:grayscale-0">
						<Image
							src={logoUrl}
							alt={author?.company || author?.name || 'Media feature logo'}
							width={140}
							height={28}
							unoptimized
							className="h-7 w-auto object-contain object-left"
						/>
					</div>
				)}

				{/* Video Review Thumbnail & Play Trigger */}
				{testimonial?.videoUrl && (
					<div className="group/video border-border/70 relative my-2 overflow-hidden rounded-xl border bg-black/5 dark:bg-black/30">
						{testimonial.videoThumbnail?.asset ? (
							<div className="relative aspect-video w-full overflow-hidden">
								<Img
									image={testimonial.videoThumbnail}
									width={600}
									alt={`Video review by ${author?.name || author?.company || 'customer'}`}
									className="size-full object-cover transition-transform duration-300 group-hover/video:scale-105"
								/>
								<div className="absolute inset-0 bg-black/30 transition-opacity group-hover/video:bg-black/20" />
							</div>
						) : null}

						<button
							type="button"
							onClick={() => onPlayVideo?.(testimonial.videoUrl!)}
							className={cn(
								'focus-visible:ring-primary inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-wide shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:outline-hidden',
								testimonial.videoThumbnail?.asset
									? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 text-gray-950 backdrop-blur-xs hover:scale-105 hover:bg-white'
									: 'border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground my-1 w-full justify-center border py-2.5',
							)}
							aria-label={`Play video review by ${author?.name || author?.company || 'customer'}`}
						>
							<span className="bg-primary flex size-5 shrink-0 items-center justify-center rounded-full text-white shadow-xs">
								<Play
									className="ml-0.5 size-2.5 fill-current"
									aria-hidden="true"
								/>
							</span>
							<span>
								Watch Video Review
								{testimonial.videoDuration && (
									<span className="ml-1 font-normal opacity-75">
										({testimonial.videoDuration})
									</span>
								)}
							</span>
						</button>
					</div>
				)}

				{/* Headline & Quote Statement */}
				<blockquote className="mt-1 flex flex-col gap-2">
					{headline && (
						<h4 className="text-foreground text-base leading-snug font-bold tracking-tight sm:text-lg">
							{headline}
						</h4>
					)}

					<div className="text-foreground/90 text-sm leading-relaxed font-normal sm:text-base">
						{Array.isArray(quote) ? (
							<PortableText value={quote} />
						) : typeof quote === 'string' ? (
							<p className="whitespace-pre-line">{quote}</p>
						) : null}
					</div>
				</blockquote>
			</div>

			{/* Card Footer: Author Attribution, Location & Date */}
			{(author?.name || author?.company || author?.title || date) && (
				<figcaption className="border-border/50 mt-6 flex items-center justify-between gap-3 border-t pt-4">
					<div className="flex min-w-0 items-center gap-3">
						{/* Author Avatar or Initial Monogram */}
						{author?.image?.asset ? (
							<Img
								className="ring-border/80 aspect-square size-10 shrink-0 rounded-full object-cover shadow-2xs ring-1"
								image={author.image}
								width={48}
								alt={
									author.name
										? `${author.name}'s profile photo`
										: 'Reviewer avatar'
								}
							/>
						) : (
							<div
								className="bg-primary/10 text-primary ring-primary/20 flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 select-none"
								aria-hidden="true"
							>
								{initials}
							</div>
						)}

						{/* Author Name & Credentials */}
						<div className="flex min-w-0 flex-col">
							<p className="text-foreground truncate text-sm font-bold">
								{author?.name || author?.company || 'Verified Customer'}
							</p>

							{(author?.title || author?.company || author?.country) && (
								<p className="text-muted-foreground truncate text-xs">
									{[
										author?.title,
										author?.company !== author?.name ? author?.company : null,
										author?.country,
									]
										.filter(Boolean)
										.join(' • ')}
								</p>
							)}
						</div>
					</div>

					{/* Date Timestamp */}
					{date && (
						<time className="text-muted-foreground ml-2 shrink-0 text-[11px] font-medium select-none">
							{date}
						</time>
					)}
				</figcaption>
			)}
		</figure>
	)
}
