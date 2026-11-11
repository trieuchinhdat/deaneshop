import Link from 'next/link'
import { ArrowRight, CheckCircle2, ShieldCheck, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { moduleAttributes, type ModuleProps } from '@/ui/modules'
import SocialProofClient from './social-proof-client'
import type { SocialProofReviewItem } from './social-proof-card'

export type { SocialProofReviewItem }

export interface SocialProofTrustStat {
	_key?: string
	value?: string
	label?: string
	sublabel?: string
}

export interface SocialProofProps extends ModuleProps {
	badge?: string
	badgeIcon?: 'star' | 'shield' | 'check' | 'none'
	headline?: string
	subtitle?: string
	description?: string
	headerAlignment?: 'center' | 'left'
	showTrustStats?: boolean
	trustStats?: SocialProofTrustStat[]
	reviews?: SocialProofReviewItem[]
	layout?: 'grid' | 'carousel'
	columns?: 2 | 3 | 4
	showCarouselArrows?: boolean
	showCarouselDots?: boolean
	carouselAutoplay?: boolean
	bgStyle?: 'white' | 'slate' | 'dark' | 'gradient'
	cardElevation?: 'bordered' | 'elevated' | 'subtle'
	showCta?: boolean
	ctaLabel?: string
	ctaLink?: string
	trustFootnote?: string
	sanityAttr?: any
}

// Fallback high-converting default reviews
const DEFAULT_REVIEWS: SocialProofReviewItem[] = [
	{
		_key: 'default-rev-1',
		authorName: 'Sarah Jenkins',
		authorRole: 'Procurement Specialist',
		authorCompany: 'Aura Living Co.',
		authorCountry: 'United States',
		rating: 5,
		title: 'Exceptional craftsmanship and seamless shipping',
		quote:
			'The build quality and attention to detail completely surpassed our expectations. Delivery to New York was expedited smoothly, and the customer experience team went above and beyond to answer every query.',
		verifiedBuyer: true,
		verifiedBadgeText: 'Verified Purchase',
		productTag: 'Signature Series Bundle',
		date: '3 days ago',
		helpfulCount: 24,
	},
	{
		_key: 'default-rev-2',
		authorName: 'Oliver Harrington',
		authorRole: 'Operations Director',
		authorCompany: 'Kensington Brand House',
		authorCountry: 'London, United Kingdom',
		rating: 5,
		title: 'Transformed our brand perception overnight',
		quote:
			'We spent months searching for a reliable supplier that met strict sustainability standards. These products exceeded all compliance marks. Our clients have consistently praised the premium texture and durability.',
		verifiedBuyer: true,
		verifiedBadgeText: 'Verified Buyer',
		productTag: 'Enterprise Package',
		date: '1 week ago',
		helpfulCount: 19,
	},
	{
		_key: 'default-rev-3',
		authorName: 'Dr. Michael Vance',
		authorRole: 'Creative Director',
		authorCompany: 'Vance & Studio',
		authorCountry: 'Austin, Texas',
		rating: 5,
		title: 'Unrivaled reliability and stellar communication',
		quote:
			'From unboxing to full operational deployment, everything felt intentional and world-class. It is rare to encounter a team so deeply invested in customer satisfaction. Will definitely be placing regular reorders.',
		verifiedBuyer: true,
		verifiedBadgeText: 'Verified Purchase',
		productTag: 'Premier Set',
		date: '2 weeks ago',
		helpfulCount: 12,
	},
]

const DEFAULT_TRUST_STATS: SocialProofTrustStat[] = [
	{
		_key: 'stat-1',
		value: '4.9 / 5',
		label: 'Average Client Rating',
		sublabel: 'Over 2,500+ verified ratings',
	},
	{
		_key: 'stat-2',
		value: '10,000+',
		label: 'Orders Delivered',
		sublabel: 'Fast US & UK fulfillment',
	},
	{
		_key: 'stat-3',
		value: '99.4%',
		label: 'Satisfaction Rate',
		sublabel: 'Based on post-delivery surveys',
	},
	{
		_key: 'stat-4',
		value: '24/7',
		label: 'Direct Support',
		sublabel: 'Dedicated account specialists',
	},
]

export default function SocialProof({
	badge = '4.9/5 RATED BY 2,500+ VERIFIED BUYERS',
	badgeIcon = 'star',
	headline = 'Loved by Customers Across the US & UK',
	subtitle,
	description,
	headerAlignment = 'center',
	showTrustStats = true,
	trustStats = DEFAULT_TRUST_STATS,
	reviews = [],
	layout = 'grid',
	columns = 3,
	showCarouselArrows = true,
	showCarouselDots = true,
	carouselAutoplay = false,
	bgStyle = 'white',
	cardElevation = 'bordered',
	showCta = false,
	ctaLabel,
	ctaLink,
	trustFootnote,
	sanityAttr,
	...props
}: SocialProofProps) {
	const isDark = bgStyle === 'dark'
	const resolvedSubtitle =
		subtitle ||
		description ||
		'Real verified stories from individuals and commercial partners who trust our quality, delivery, and dedicated customer support.'

	const bgContainerClasses = {
		white: 'bg-background text-foreground',
		slate: 'bg-surface/50 text-foreground border-y border-border/60',
		dark: 'bg-gray-950 text-white border-y border-gray-800',
		gradient:
			'bg-linear-to-b from-primary/5 via-background to-background text-foreground border-y border-border/40',
	}[bgStyle]

	const displayReviews =
		reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS

	// Build serializable data-sanity string mapping for client reviews
	const sanityAttrMap =
		typeof sanityAttr?.scope === 'function'
			? displayReviews.reduce<Record<string, string>>((acc, rev) => {
					if (rev._key) {
						acc[rev._key] = sanityAttr
							.scope(`reviews[_key=="${rev._key}"]`)
							.toString()
					}
					return acc
				}, {})
			: undefined

	const renderBadgeIcon = () => {
		switch (badgeIcon) {
			case 'shield':
				return (
					<ShieldCheck
						className={cn('size-3.5 shrink-0', isDark ? 'text-amber-300' : 'text-primary')}
						aria-hidden="true"
					/>
				)
			case 'check':
				return (
					<CheckCircle2
						className="size-3.5 shrink-0 text-emerald-500"
						aria-hidden="true"
					/>
				)
			case 'none':
				return null
			case 'star':
			default:
				return (
					<Star
						className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
						aria-hidden="true"
					/>
				)
		}
	}

	return (
		<section
			className={cn('w-full py-12 sm:py-16 md:py-20 transition-colors', bgContainerClasses)}
			{...moduleAttributes(props)}
		>
			<div className="section space-y-10 sm:space-y-12">
				{/* Section Header */}
				<header
					className={cn(
						'space-y-4',
						headerAlignment === 'left'
							? 'text-left max-w-3xl'
							: 'mx-auto max-w-3xl text-center',
					)}
				>
					{badge && (
						<div
							className={cn(
								'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-2xs',
								isDark
									? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
									: 'bg-amber-50/80 text-amber-900 border border-amber-200/80',
							)}
						>
							{renderBadgeIcon()}
							<span>{badge.replace(/^⭐\s*/, '')}</span>
						</div>
					)}

					<h2
						className={cn(
							'text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-balance',
							isDark ? 'text-white' : 'text-gray-950',
						)}
					>
						{headline}
					</h2>

					{resolvedSubtitle && (
						<p
							className={cn(
								'text-base leading-relaxed sm:text-lg text-balance',
								isDark ? 'text-gray-300' : 'text-gray-600',
							)}
						>
							{resolvedSubtitle}
						</p>
					)}
				</header>

				{/* Key Metric Counters Row */}
				{showTrustStats && trustStats && trustStats.length > 0 && (
					<div
						className={cn(
							'grid grid-cols-2 gap-3 sm:gap-6',
							trustStats.length === 2 && 'sm:grid-cols-2 max-w-2xl mx-auto',
							trustStats.length === 3 && 'sm:grid-cols-3 max-w-4xl mx-auto',
							trustStats.length >= 4 && 'sm:grid-cols-2 lg:grid-cols-4',
						)}
					>
						{trustStats.map((stat, idx) => (
							<div
								key={stat._key || idx}
								data-sanity={sanityAttr?.scope(`trustStats[_key=="${stat._key}"]`).toString()}
								className={cn(
									'flex flex-col items-center justify-center rounded-2xl border p-4 sm:p-6 text-center transition-all duration-200',
									isDark
										? 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
										: 'bg-surface/80 border-border/70 hover:border-border hover:shadow-xs',
								)}
							>
								<span
									className={cn(
										'font-mono tabular-nums text-2xl font-black sm:text-3xl lg:text-4xl tracking-tight',
										isDark ? 'text-amber-400' : 'text-primary',
									)}
								>
									{stat.value}
								</span>
								<span
									className={cn(
										'mt-1.5 text-xs font-semibold uppercase tracking-wider',
										isDark ? 'text-gray-300' : 'text-gray-700',
									)}
								>
									{stat.label}
								</span>
								{stat.sublabel && (
									<span
										className={cn(
											'mt-1 text-[11px] leading-tight',
											isDark ? 'text-gray-400' : 'text-muted-foreground',
										)}
									>
										{stat.sublabel}
									</span>
								)}
							</div>
						))}
					</div>
				)}

				{/* Review Items: Grid or Interactive Carousel with UGC Video Lightbox */}
				<SocialProofClient
					reviews={displayReviews}
					layout={layout}
					columns={columns}
					isDark={isDark}
					cardElevation={cardElevation}
					showArrows={showCarouselArrows}
					showDots={showCarouselDots}
					autoplay={carouselAutoplay}
					sanityAttrMap={sanityAttrMap}
				/>

				{/* Optional Call to Action & Trust Disclaimer */}
				{(showCta && ctaLabel && ctaLink) || trustFootnote ? (
					<footer className="pt-6 sm:pt-8 text-center space-y-4">
						{showCta && ctaLabel && ctaLink && (
							<div>
								<Link
									href={ctaLink}
									className={cn(
										'inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer',
										'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
										isDark
											? 'bg-amber-400 text-gray-950 hover:bg-amber-300'
											: 'bg-primary text-primary-foreground hover:bg-primary/90',
									)}
								>
									<span>{ctaLabel}</span>
									<ArrowRight className="size-4" aria-hidden="true" />
								</Link>
							</div>
						)}

						{trustFootnote && (
							<p
								className={cn(
									'text-xs leading-relaxed max-w-xl mx-auto',
									isDark ? 'text-gray-400' : 'text-muted-foreground',
								)}
							>
								{trustFootnote}
							</p>
						)}
					</footer>
				) : null}
			</div>
		</section>
	)
}
