import {
	Award,
	BarChart3,
	CheckCircle2,
	Clock,
	Cpu,
	Droplets,
	Factory,
	FileText,
	Flame,
	FlaskConical,
	Globe,
	Heart,
	Layers,
	Leaf,
	Lock,
	Package,
	Recycle,
	RefreshCw,
	Scale,
	ShieldCheck,
	Snowflake,
	Sparkles,
	Star,
	Truck,
	Zap,
} from 'lucide-react'
import {
	PortableText,
	stegaClean,
	type PortableTextComponents,
} from 'next-sanity'
import { useId } from 'react'
import { cn, getBlockText } from '@/lib/utils'
import type { CardList } from '@/sanity/types'
import CTAList from '@/ui/cta-list'
import Img from '@/ui/img'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import { moduleAttributes, type ModuleProps } from '.'
import CardListCarousel from './card-list-carousel'

// Extended type for newly added schema fields
type EnhancedCardList = CardList & {
	desktopLayout?: 'grid' | 'carousel'
	showNavigationArrows?: boolean
}

// Render clean, high-utility Lucide preset icons
function renderPresetIcon(name?: string, className?: string) {
	if (!name || name === 'none') return null
	const iconProps = {
		className: className || 'size-6',
		'aria-hidden': true,
	}

	switch (name) {
		case 'shield':
			return <ShieldCheck {...iconProps} />
		case 'zap':
			return <Zap {...iconProps} />
		case 'check':
			return <CheckCircle2 {...iconProps} />
		case 'sparkles':
			return <Sparkles {...iconProps} />
		case 'leaf':
			return <Leaf {...iconProps} />
		case 'award':
			return <Award {...iconProps} />
		case 'truck':
			return <Truck {...iconProps} />
		case 'globe':
			return <Globe {...iconProps} />
		case 'lock':
			return <Lock {...iconProps} />
		case 'barchart':
			return <BarChart3 {...iconProps} />
		case 'clock':
			return <Clock {...iconProps} />
		case 'heart':
			return <Heart {...iconProps} />
		case 'refresh':
			return <RefreshCw {...iconProps} />
		case 'layers':
			return <Layers {...iconProps} />
		case 'cpu':
			return <Cpu {...iconProps} />
		case 'package':
			return <Package {...iconProps} />
		case 'star':
			return <Star {...iconProps} />
		case 'flame':
			return <Flame {...iconProps} />
		case 'snowflake':
			return <Snowflake {...iconProps} />
		case 'droplets':
			return <Droplets {...iconProps} />
		case 'flask':
			return <FlaskConical {...iconProps} />
		case 'recycle':
			return <Recycle {...iconProps} />
		case 'factory':
			return <Factory {...iconProps} />
		case 'fileText':
			return <FileText {...iconProps} />
		case 'scale':
			return <Scale {...iconProps} />
		default:
			return null
	}
}

// High-legibility PortableText styling tailored for card interiors
const cardPortableTextComponents: PortableTextComponents = {
	block: {
		h2: ({ children }) => (
			<h3 className="text-foreground mb-2 text-lg leading-snug font-bold tracking-tight sm:text-xl">
				{children}
			</h3>
		),
		h3: ({ children }) => (
			<h3 className="text-foreground mb-2 text-lg leading-snug font-bold tracking-tight sm:text-xl">
				{children}
			</h3>
		),
		h4: ({ children }) => (
			<h4 className="text-foreground mb-1.5 text-base leading-snug font-semibold tracking-tight sm:text-lg">
				{children}
			</h4>
		),
		normal: ({ children }) => (
			<p className="text-muted-foreground mb-2.5 text-sm leading-relaxed last:mb-0 sm:text-base">
				{children}
			</p>
		),
	},
	marks: {
		strong: ({ children }) => (
			<strong className="text-foreground font-semibold">{children}</strong>
		),
		em: ({ children }) => <em className="italic">{children}</em>,
		link: ({ value, children }) => {
			const target = (value?.href || '').startsWith('http')
				? '_blank'
				: undefined
			return (
				<a
					href={value?.href}
					target={target}
					rel={target === '_blank' ? 'noopener noreferrer' : undefined}
					className="text-primary hover:text-primary/80 focus-visible:ring-primary rounded-xs font-medium underline underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					{children}
				</a>
			)
		},
	},
	list: {
		bullet: ({ children }) => (
			<ul className="text-muted-foreground my-2.5 ml-4 list-disc space-y-1.5 text-sm">
				{children}
			</ul>
		),
		number: ({ children }) => (
			<ol className="text-muted-foreground my-2.5 ml-4 list-decimal space-y-1.5 text-sm">
				{children}
			</ol>
		),
	},
}

export default function CardListModule({
	badge,
	intro = [],
	cards,
	ctas,
	desktopLayout = 'grid',
	columns = 3,
	mobileLayout = 'stack',
	showNavigationArrows = true,
	cardLayout = 'stacked',
	headerAlign = 'center',
	textAlign = 'left',
	imageAspectRatio = '16/9',
	containerStyle = 'boxed',
	spacing = 'default',
	cardStyle = 'card',
	iconStyle = 'brand',
	sanityAttr,
	...props
}: EnhancedCardList & ModuleProps & { sanityAttr?: any }) {
	const rawHeadingId = useId()
	const headingId = `feature-heading-${props._key || rawHeadingId.replace(/:/g, '')}`

	// Stega clean configuration values for deterministic rendering
	const stegaDesktopLayout = stegaClean(desktopLayout) || 'grid'
	const stegaCols = Number(stegaClean(columns)) || 3
	const stegaMobileLayout = stegaClean(mobileLayout) || 'stack'
	const stegaShowArrows = stegaClean(showNavigationArrows) !== false
	const stegaCardLayout = stegaClean(cardLayout) || 'stacked'
	const stegaHeaderAlign =
		stegaClean(headerAlign) ||
		(stegaClean(textAlign) === 'center' ? 'center' : 'center')
	const stegaTextAlign = stegaClean(textAlign) || 'left'
	const stegaAspect = stegaClean(imageAspectRatio) || '16/9'
	const stegaContainer = stegaClean(containerStyle) || 'boxed'
	const stegaSpacing = stegaClean(spacing) || 'default'
	const stegaCard = stegaClean(cardStyle) || 'card'
	const stegaIcon = stegaClean(iconStyle) || 'brand'

	const isDesktopCarousel = stegaDesktopLayout === 'carousel'
	const isMobileCarousel = stegaMobileLayout === 'carousel'
	const isMobileGrid2 = stegaMobileLayout === 'grid-2'
	const isHeaderCentered = stegaHeaderAlign === 'center'
	const isCardCentered = stegaTextAlign === 'center'
	const isBoxed = stegaContainer === 'boxed'
	const isHorizontalCard = stegaCardLayout === 'horizontal'

	// Content presence checks
	const introPlainText =
		intro && intro.length > 0 ? getBlockText(intro as any) : ''
	const hasIntroText = Boolean(
		introPlainText && introPlainText.trim().length > 0,
	)

	// Section vertical spacing classes
	const spacingClasses =
		{
			default: 'py-12 sm:py-16 md:py-20',
			compact: 'py-6 sm:py-10 md:py-12',
			spacious: 'py-16 sm:py-24 md:py-32',
			none: 'py-0',
		}[stegaSpacing] || 'py-12 sm:py-16 md:py-20'

	// Image aspect ratio classes
	const aspectClasses =
		{
			'16/9': 'aspect-video',
			'4/3': 'aspect-[4/3]',
			'1/1': 'aspect-square',
			auto: 'aspect-auto',
		}[stegaAspect] || 'aspect-video'

	// Section intro PortableText components with accessible heading anchor
	const introPortableTextComponents: PortableTextComponents = {
		block: {
			h2: ({ children }) => (
				<h2
					id={headingId}
					className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
				>
					{children}
				</h2>
			),
			normal: ({ children }) => (
				<p className="text-muted-foreground mx-auto mt-2.5 max-w-2xl text-base leading-relaxed sm:text-lg">
					{children}
				</p>
			),
		},
	}

	return (
		<section
			className={cn('section', spacingClasses)}
			aria-labelledby={hasIntroText ? headingId : undefined}
			aria-label={!hasIntroText && badge ? badge : undefined}
			{...moduleAttributes(props)}
		>
			<div
				className={cn(
					'transition-all duration-300',
					isBoxed
						? 'border-border/70 bg-surface/50 space-y-8 rounded-3xl border p-6 shadow-xs sm:space-y-12 sm:p-8 lg:p-12'
						: 'space-y-8 sm:space-y-12',
				)}
			>
				{/* Section Header: Eyebrow Badge & Pitch */}
				{(badge || hasIntroText) && (
					<header
						className={cn(
							'flex flex-col gap-3',
							isHeaderCentered
								? 'mx-auto max-w-2xl items-center text-center'
								: 'max-w-3xl items-start text-left',
						)}
					>
						{badge && (
							<span className="bg-primary/10 text-primary ring-primary/20 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wider uppercase ring-1">
								{badge}
							</span>
						)}

						{hasIntroText && (
							<div
								className={cn(
									'prose dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none',
									isHeaderCentered ? 'text-center' : 'text-left',
								)}
							>
								<PortableText
									value={intro}
									components={introPortableTextComponents}
								/>
							</div>
						)}
					</header>
				)}

				{/* Cards Container: Carousel or Grid */}
				{!!cards?.length && (
					<CardListCarousel
						showArrows={stegaShowArrows}
						isDesktopCarousel={isDesktopCarousel}
						isMobileCarousel={isMobileCarousel}
						ariaLabel={introPlainText || 'Feature cards'}
					>
						<ul
							role="list"
							className={cn(
								'm-0 list-none p-0',
								// Desktop Carousel mode: smooth horizontal scroll on all viewports
								isDesktopCarousel && [
									'scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:gap-6',
								],
								// Mobile Carousel + Desktop Grid mode
								!isDesktopCarousel &&
									isMobileCarousel && [
										'scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:gap-6 sm:pb-0',
										'sm:grid',
										stegaCols === 1 && 'sm:mx-auto sm:max-w-3xl sm:grid-cols-1',
										stegaCols === 2 && 'sm:grid-cols-2',
										stegaCols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
										stegaCols === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
										stegaCols > 4 && 'sm:grid-cols-2 lg:grid-cols-3',
									],
								// Mobile 2-column Grid mode
								!isDesktopCarousel &&
									!isMobileCarousel &&
									isMobileGrid2 && [
										'grid gap-3.5 sm:gap-6 lg:gap-8',
										'grid-cols-2',
										stegaCols === 1 && 'sm:mx-auto sm:max-w-3xl sm:grid-cols-1',
										stegaCols === 2 && 'sm:grid-cols-2',
										stegaCols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
										stegaCols === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
										stegaCols > 4 && 'sm:grid-cols-2 lg:grid-cols-3',
									],
								// Standard Grid mode
								!isDesktopCarousel &&
									!isMobileCarousel &&
									!isMobileGrid2 && [
										'grid gap-6 sm:gap-6 lg:gap-8',
										stegaCols === 1 && 'mx-auto max-w-3xl grid-cols-1',
										stegaCols === 2 && 'grid-cols-1 md:grid-cols-2',
										stegaCols === 3 &&
											'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
										stegaCols === 4 &&
											'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
										stegaCols > 4 &&
											'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
									],
							)}
						>
							{cards.map((item) => {
								const hasImage = Boolean(item.image?.asset)
								const hasCustomIcon = Boolean(item.icon?.asset)
								const presetIconName = stegaClean(item.iconPreset)
								const hasPresetIcon = Boolean(
									presetIconName && presetIconName !== 'none',
								)
								const hasAnyIcon = hasCustomIcon || hasPresetIcon
								const cardBadge = stegaClean(item.badge)
								const cardTitle = getBlockText(item.content as any) || ''

								// Determine target link for clickable card
								const directLink = item.link as SanityLinkType | undefined
								const ctaLink = item.ctas?.[0]?.link as
									SanityLinkType | undefined
								const targetLink = directLink?.type ? directLink : ctaLink
								const isClickableCard = Boolean(
									item.linkEntireCard &&
									(targetLink?.internal || targetLink?.external),
								)

								// Card container styling variants
								const cardClass = cn(
									'group relative flex flex-col justify-between rounded-2xl transition-all duration-300',
									'motion-reduce:transition-none motion-reduce:transform-none',
									isMobileGrid2 ? 'p-4 sm:p-6 lg:p-7' : 'p-5 sm:p-6 lg:p-7',
									// Sizing when in desktop or mobile carousel
									isDesktopCarousel &&
										'snap-start shrink-0 w-[84vw] max-w-[320px] sm:w-[350px] md:w-[380px] lg:w-[400px]',
									!isDesktopCarousel &&
										isMobileCarousel &&
										'snap-start shrink-0 w-[84vw] max-w-[320px] sm:w-auto sm:shrink sm:max-w-none',
									// Visual styling modes
									stegaCard === 'card' &&
										'border border-border/70 bg-surface shadow-2xs hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5',
									stegaCard === 'elevated' &&
										'border border-border/40 bg-surface shadow-xs hover:shadow-lg hover:border-primary/40 hover:-translate-y-1',
									stegaCard === 'minimal' &&
										'bg-muted/40 hover:bg-muted/70 hover:-translate-y-0.5',
									stegaCard === 'glass' &&
										'border border-border/50 bg-surface/70 backdrop-blur-md shadow-2xs hover:border-primary/40 hover:bg-surface/90 hover:-translate-y-0.5',
									isClickableCard && 'cursor-pointer',
									isCardCentered &&
										!isHorizontalCard &&
										'text-center items-center',
								)

								// Icon container styling variants
								const iconClass = cn(
									'flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100',
									stegaIcon === 'brand' &&
										'h-12 w-12 sm:h-13 sm:w-13 rounded-2xl bg-primary/10 text-primary p-2.5 ring-1 ring-primary/20 shadow-2xs',
									stegaIcon === 'neutral' &&
										'h-12 w-12 sm:h-13 sm:w-13 rounded-2xl bg-muted text-foreground p-2.5 ring-1 ring-border shadow-2xs',
									stegaIcon === 'gradient' &&
										'h-12 w-12 sm:h-13 sm:w-13 rounded-2xl bg-linear-to-br from-primary/20 via-primary/10 to-primary/5 text-primary p-2.5 ring-1 ring-primary/30 shadow-2xs',
									stegaIcon === 'minimal' &&
										'h-10 w-10 sm:h-11 sm:w-11 text-primary p-0',
								)

								return (
									<li
										key={item._key}
										data-sanity={sanityAttr
											?.scope(`cards[_key=="${item._key}"]`)
											.toString()}
										className={cardClass}
									>
										{/* Accessible Stretched Card Link Overlay */}
										{isClickableCard && targetLink && (
											<SanityLink
												link={targetLink}
												className="focus-visible:ring-primary absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
												aria-label={cardTitle || 'Card link'}
											>
												<span className="sr-only">{cardTitle}</span>
											</SanityLink>
										)}

										<article
											className={cn(
												'flex h-full w-full flex-col justify-between',
												isCardCentered && !isHorizontalCard && 'items-center',
											)}
										>
											{/* Card Top Section: Visual Media & Text Content */}
											<div className="w-full">
												{/* Layout Mode 1: Horizontal (Icon beside heading & text) */}
												{isHorizontalCard && hasAnyIcon && !hasImage ? (
													<div className="flex items-start gap-4 sm:gap-4.5">
														<div className="shrink-0" aria-hidden="true">
															<div className={iconClass}>
																{hasCustomIcon ? (
																	<Img
																		className="h-full w-full object-contain"
																		image={item.icon}
																		width={48}
																		height={48}
																		alt=""
																	/>
																) : (
																	renderPresetIcon(presetIconName, 'size-6')
																)}
															</div>
														</div>
														<div
															className={cn(
																'min-w-0 flex-1',
																isCardCentered ? 'text-center' : 'text-left',
															)}
														>
															{cardBadge && (
																<div className="mb-2">
																	<span className="bg-primary/10 text-primary ring-primary/25 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1">
																		{cardBadge}
																	</span>
																</div>
															)}
															<PortableText
																value={item.content ?? []}
																components={cardPortableTextComponents}
															/>
														</div>
													</div>
												) : (
													/* Layout Mode 2: Stacked (Media on top, text below) */
													<div
														className={cn(
															'flex w-full flex-col',
															isCardCentered && 'items-center',
														)}
													>
														{/* Media Header: Image or Icon */}
														{hasImage ? (
															<div
																className={cn(
																	'bg-muted/40 border-border/30 mb-5 w-full overflow-hidden rounded-xl border',
																	aspectClasses,
																)}
															>
																<Img
																	className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
																	image={item.image}
																	width={
																		stegaCols === 1
																			? 800
																			: stegaCols === 2
																				? 650
																				: 500
																	}
																	alt={stegaClean(item.image?.alt) || ''}
																/>
															</div>
														) : hasAnyIcon ? (
															<div
																className={cn(
																	'mb-4.5 flex w-full',
																	isCardCentered
																		? 'justify-center'
																		: 'justify-start',
																)}
																aria-hidden="true"
															>
																<div className={iconClass}>
																	{hasCustomIcon ? (
																		<Img
																			className="h-full w-full object-contain"
																			image={item.icon}
																			width={52}
																			height={52}
																			alt=""
																		/>
																	) : (
																		renderPresetIcon(presetIconName, 'size-6.5')
																	)}
																</div>
															</div>
														) : null}

														{/* Optional Card Tag / Badge */}
														{cardBadge && (
															<div
																className={cn(
																	'mb-3 flex w-full',
																	isCardCentered
																		? 'justify-center'
																		: 'justify-start',
																)}
															>
																<span className="bg-primary/10 text-primary ring-primary/25 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1">
																	{cardBadge}
																</span>
															</div>
														)}

														{/* Card PortableText Content (Heading + Body copy) */}
														<div
															className={cn(
																'w-full max-w-none',
																isCardCentered ? 'text-center' : 'text-left',
															)}
														>
															<PortableText
																value={item.content ?? []}
																components={cardPortableTextComponents}
															/>
														</div>
													</div>
												)}
											</div>

											{/* Card Action CTAs (rendered at bottom) */}
											{item.ctas && item.ctas.length > 0 && (
												<div
													className={cn(
														'border-border/40 relative z-20 mt-5 flex w-full border-t pt-3.5',
														isClickableCard && 'pointer-events-none',
														isCardCentered ? 'justify-center' : 'justify-start',
													)}
												>
													<CTAList
														ctas={item.ctas}
														className={
															isCardCentered
																? 'justify-center'
																: 'justify-start'
														}
													/>
												</div>
											)}
										</article>
									</li>
								)
							})}
						</ul>
					</CardListCarousel>
				)}

				{/* Section Bottom Call-to-actions */}
				{ctas && ctas.length > 0 && (
					<div
						className={cn(
							'flex w-full pt-2',
							isHeaderCentered ? 'justify-center' : 'justify-start',
						)}
					>
						<CTAList
							ctas={ctas}
							className={isHeaderCentered ? 'justify-center' : 'justify-start'}
						/>
					</div>
				)}
			</div>
		</section>
	)
}
