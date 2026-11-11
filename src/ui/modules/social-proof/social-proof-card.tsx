import { CheckCircle2, Play, Star, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import Img from '@/ui/img'

export interface SocialProofReviewItem {
	_key?: string
	authorName?: string
	authorRole?: string
	authorCompany?: string
	authorCountry?: string
	authorAvatar?: any
	rating?: number
	title?: string
	quote?: string
	verifiedBuyer?: boolean
	verifiedBadgeText?: string
	productTag?: string
	date?: string
	helpfulCount?: number
	videoUrl?: string
	videoThumbnail?: any
	videoDuration?: string
}

interface SocialProofCardProps {
	review: SocialProofReviewItem
	isDark?: boolean
	cardElevation?: 'bordered' | 'elevated' | 'subtle'
	className?: string
	dataSanity?: string
	onPlayVideo?: (url: string) => void
}

export function SocialProofCard({
	review,
	isDark = false,
	cardElevation = 'bordered',
	className,
	dataSanity,
	onPlayVideo,
}: SocialProofCardProps) {
	const rating = Math.min(Math.max(review.rating ?? 5, 1), 5)

	// Clean initials generation
	const initials = (review.authorName || 'Customer')
		.trim()
		.split(/\s+/)
		.map((part) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase() || 'C'

	// Author credentials formatting
	const authorMeta = [
		review.authorRole,
		review.authorCompany,
		review.authorCountry,
	]
		.filter(Boolean)
		.join(' • ')

	// Elevation tone mapping
	const elevationClasses = {
		bordered: isDark
			? 'bg-gray-900/90 border-gray-800 text-white shadow-md hover:border-gray-700'
			: 'bg-card border-border/80 text-foreground shadow-xs hover:border-primary/40 hover:shadow-md',
		elevated: isDark
			? 'bg-gray-900 border-gray-700/80 text-white shadow-xl shadow-black/40 hover:border-amber-400/40'
			: 'bg-card border-border/50 text-foreground shadow-md hover:border-primary/50 hover:shadow-xl',
		subtle: isDark
			? 'bg-gray-900/50 border-gray-800/80 text-white hover:bg-gray-900/80'
			: 'bg-surface/70 border-border/60 text-foreground hover:bg-surface hover:border-border',
	}[cardElevation]

	const hasValidAvatar = Boolean(
		review.authorAvatar?.asset?._ref ||
			review.authorAvatar?.asset?.url ||
			review.authorAvatar?.asset?._id,
	)

	return (
		<figure
			data-sanity={dataSanity}
			className={cn(
				'flex flex-col justify-between rounded-2xl border p-6 sm:p-7 transition-all duration-200',
				elevationClasses,
				className,
			)}
		>
			<div className="flex-1 flex flex-col">
				{/* Top Header: Star Rating, Verified Badge & Date */}
				<div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
					<div
						className="flex items-center gap-1"
						role="img"
						aria-label={`Rated ${rating} out of 5 stars`}
					>
						{Array.from({ length: 5 }).map((_, i) => (
							<Star
								key={i}
								className={cn(
									'size-4 shrink-0 transition-colors',
									i < rating
										? 'fill-amber-400 text-amber-400'
										: isDark
											? 'fill-gray-800 text-gray-700'
											: 'fill-gray-200 text-gray-200',
								)}
								aria-hidden="true"
							/>
						))}
						<span className="sr-only">{rating} out of 5 stars</span>
					</div>

					<div className="flex items-center gap-2">
						{review.verifiedBuyer !== false && (
							<div
								className={cn(
									'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
									isDark
										? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
										: 'bg-emerald-50 text-emerald-800 border border-emerald-200/90',
								)}
							>
								<CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
								<span>{review.verifiedBadgeText || 'Verified Buyer'}</span>
							</div>
						)}

						{review.date && (
							<span
								className={cn(
									'text-xs whitespace-nowrap',
									isDark ? 'text-gray-400' : 'text-gray-500',
								)}
							>
								{review.date}
							</span>
						)}
					</div>
				</div>

				{/* Review Hook / Title */}
				{review.title && (
					<h3
						className={cn(
							'text-base font-bold tracking-tight sm:text-lg mb-2 leading-snug',
							isDark ? 'text-white' : 'text-gray-950',
						)}
					>
						“{review.title.replace(/^["“]+|["”]+$/g, '')}”
					</h3>
				)}

				{/* UGC Video Review Trigger (Optional) */}
				{review.videoUrl && (
					<div className="relative mb-3 group/video overflow-hidden rounded-xl border border-border/70 bg-black/5 dark:bg-black/30">
						{review.videoThumbnail?.asset ? (
							<div className="relative aspect-video w-full overflow-hidden">
								<Img
									image={review.videoThumbnail}
									width={600}
									alt={`Video review by ${review.authorName || 'customer'}`}
									className="size-full object-cover transition-transform duration-300 group-hover/video:scale-105"
								/>
								<div className="absolute inset-0 bg-black/30 transition-opacity group-hover/video:bg-black/20" />
							</div>
						) : null}
						<button
							type="button"
							onClick={() => onPlayVideo?.(review.videoUrl!)}
							className={cn(
								'flex items-center gap-2 rounded-full px-4 py-2 font-bold text-xs tracking-wide shadow-md transition-all duration-200 cursor-pointer',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
								review.videoThumbnail?.asset
									? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 text-gray-950 hover:bg-white hover:scale-105 backdrop-blur-xs'
									: 'w-full justify-center bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 py-2.5 my-2',
							)}
							aria-label={`Play video review by ${review.authorName || 'customer'}`}
						>
							<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-xs">
								<Play className="size-2.5 fill-current ml-0.5" aria-hidden="true" />
							</span>
							<span>
								Watch Video Review
								{review.videoDuration && (
									<span className="opacity-75 font-normal ml-1">({review.videoDuration})</span>
								)}
							</span>
						</button>
					</div>
				)}

				{/* Review Quote Body */}
				<blockquote
					className={cn(
						'text-sm leading-relaxed mb-6 flex-1',
						isDark ? 'text-gray-300' : 'text-gray-600',
					)}
				>
					<p>{review.quote}</p>
				</blockquote>
			</div>

			{/* Review Author & Metadata Footer */}
			<figcaption
				className={cn(
					'pt-4 border-t flex flex-wrap items-center justify-between gap-3 mt-auto',
					isDark ? 'border-gray-800/90' : 'border-border/60',
				)}
			>
				<div className="flex items-center gap-3 min-w-0">
					{hasValidAvatar ? (
						<div
							className={cn(
								'size-10 shrink-0 overflow-hidden rounded-full border',
								isDark ? 'border-gray-700 bg-gray-800' : 'border-border bg-muted',
							)}
						>
							<Img
								image={review.authorAvatar}
								width={80}
								height={80}
								alt={review.authorName || 'Verified customer avatar'}
								className="size-full object-cover"
							/>
						</div>
					) : (
						<div
							className={cn(
								'flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold tracking-wider shadow-2xs select-none',
								isDark
									? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30'
									: 'bg-primary/10 text-primary ring-1 ring-primary/20',
							)}
							aria-hidden="true"
						>
							{initials}
						</div>
					)}

					<div className="min-w-0">
						<p
							className={cn(
								'text-sm font-bold leading-tight truncate',
								isDark ? 'text-white' : 'text-gray-900',
							)}
						>
							{review.authorName || 'Customer'}
						</p>
						{authorMeta && (
							<p
								className={cn(
									'text-xs leading-tight truncate mt-0.5',
									isDark ? 'text-gray-400' : 'text-gray-500',
								)}
							>
								{authorMeta}
							</p>
						)}
					</div>
				</div>

				{/* Right Footer Signals: Product Tag or Helpful Vote */}
				<div className="flex items-center gap-2">
					{review.productTag && (
						<span
							className={cn(
								'rounded-md px-2 py-0.5 text-[11px] font-semibold max-w-[150px] truncate',
								isDark
									? 'bg-gray-800 text-gray-300 border border-gray-700/60'
									: 'bg-slate-100 text-slate-700 border border-slate-200/70',
							)}
						>
							{review.productTag}
						</span>
					)}

					{typeof review.helpfulCount === 'number' && review.helpfulCount > 0 && (
						<span
							className={cn(
								'inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap',
								isDark ? 'text-gray-400' : 'text-gray-500',
							)}
							title={`${review.helpfulCount} customers found this review helpful`}
						>
							<ThumbsUp className="size-3 shrink-0" aria-hidden="true" />
							<span>{review.helpfulCount}</span>
						</span>
					)}
				</div>
			</figcaption>
		</figure>
	)
}
