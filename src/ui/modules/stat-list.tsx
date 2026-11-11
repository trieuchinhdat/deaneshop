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
import type { StatList } from '@/sanity/types'
import CTAList from '@/ui/cta-list'
import Img from '@/ui/img'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import { moduleAttributes, type ModuleProps } from '.'
import { StatCarousel, StatCounter } from './stat-list-client'

// Extended StatList type to cover newly supported schema attributes
type EnhancedStatList = StatList & {
	layout?: 'grid' | 'split' | 'bento' | 'divider'
	columns?: number
	mobileLayout?: 'stack' | 'grid-2' | 'carousel'
	headerAlign?: 'center' | 'left'
	textAlign?: 'center' | 'left'
	containerStyle?: 'plain' | 'boxed'
	spacing?: 'default' | 'compact' | 'spacious' | 'none'
	cardStyle?: 'card' | 'elevated' | 'minimal' | 'outline'
	numberColor?: 'brand' | 'gradient' | 'neutral'
	numberSize?: 'default' | 'compact' | 'heroic'
	iconStyle?: 'brand' | 'neutral' | 'minimal'
	animateCounter?: boolean
}

// Render clean, high-utility Lucide vector icons
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
		case 'leaf':
			return <Leaf {...iconProps} />
		case 'award':
			return <Award {...iconProps} />
		case 'globe':
			return <Globe {...iconProps} />
		case 'factory':
			return <Factory {...iconProps} />
		case 'barchart':
			return <BarChart3 {...iconProps} />
		case 'truck':
			return <Truck {...iconProps} />
		case 'sparkles':
			return <Sparkles {...iconProps} />
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
		case 'recycle':
			return <Recycle {...iconProps} />
		case 'scale':
			return <Scale {...iconProps} />
		case 'flame':
			return <Flame {...iconProps} />
		case 'droplets':
			return <Droplets {...iconProps} />
		case 'flask':
			return <FlaskConical {...iconProps} />
		case 'star':
			return <Star {...iconProps} />
		case 'lock':
			return <Lock {...iconProps} />
		case 'fileText':
			return <FileText {...iconProps} />
		case 'snowflake':
			return <Snowflake {...iconProps} />
		default:
			return null
	}
}

// Custom PortableText components for compact, balanced metric card copy
const statPortableTextComponents: PortableTextComponents = {
	block: {
		h3: ({ children }) => (
			<h3 className="text-foreground mt-1 mb-1 text-sm font-semibold tracking-tight sm:text-base">
				{children}
			</h3>
		),
		normal: ({ children }) => (
			<p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
				{children}
			</p>
		),
	},
	list: {
		bullet: ({ children }) => (
			<ul className="text-muted-foreground list-disc space-y-1 pl-4 text-xs sm:text-sm">
				{children}
			</ul>
		),
	},
}

export default function StatListModule({
	badge,
	intro,
	stats = [],
	ctas,
	layout = 'grid',
	columns = 4,
	mobileLayout = 'stack',
	headerAlign = 'center',
	textAlign = 'center',
	containerStyle = 'plain',
	spacing = 'default',
	cardStyle = 'card',
	numberColor = 'brand',
	numberSize = 'default',
	iconStyle = 'brand',
	animateCounter = true,
	sanityAttr,
	...props
}: EnhancedStatList & ModuleProps & { sanityAttr?: any }) {
	const rawHeadingId = useId()
	const headingId = `stat-heading-${props._key || rawHeadingId.replace(/:/g, '')}`

	// Stega clean all configuration values for deterministic rendering
	const stegaLayout = (stegaClean(layout) || 'grid') as
		'grid' | 'split' | 'bento' | 'divider'
	const stegaCols = Number(stegaClean(columns)) || 4
	const stegaMobileLayout = (stegaClean(mobileLayout) || 'stack') as
		'stack' | 'grid-2' | 'carousel'
	const stegaHeaderAlign = (stegaClean(headerAlign) || 'center') as
		'center' | 'left'
	const stegaTextAlign = (stegaClean(textAlign) || 'center') as
		'center' | 'left'
	const stegaContainer = (stegaClean(containerStyle) || 'plain') as
		'plain' | 'boxed'
	const stegaSpacing = (stegaClean(spacing) || 'default') as
		'default' | 'compact' | 'spacious' | 'none'
	const stegaCardStyle = (stegaClean(cardStyle) || 'card') as
		'card' | 'elevated' | 'minimal' | 'outline'
	const stegaNumberColor = (stegaClean(numberColor) || 'brand') as
		'brand' | 'gradient' | 'neutral'
	const stegaNumberSize = (stegaClean(numberSize) || 'default') as
		'default' | 'compact' | 'heroic'
	const stegaIconStyle = (stegaClean(iconStyle) || 'brand') as
		'brand' | 'neutral' | 'minimal'
	const isAnimateCounter = stegaClean(animateCounter) !== false

	const isSplit = stegaLayout === 'split'
	const isDivider = stegaLayout === 'divider'
	const isBento = stegaLayout === 'bento'
	const isHeaderCentered = !isSplit && stegaHeaderAlign === 'center'
	const isTextCentered = stegaTextAlign === 'center'
	const isBoxed = stegaContainer === 'boxed'

	const hasStats = Boolean(stats && stats.length > 0)
	const introPlainText =
		intro && intro.length > 0 ? getBlockText(intro as any) : ''
	const hasIntro = Boolean(introPlainText && introPlainText.trim().length > 0)
	const hasBadge = Boolean(badge && badge.trim().length > 0)
	const hasCTAs = Boolean(ctas && ctas.length > 0)

	// Section vertical spacing classes
	const spacingClasses =
		{
			default: 'py-12 sm:py-16 lg:py-20',
			compact: 'py-6 sm:py-10 lg:py-12',
			spacious: 'py-16 sm:py-24 lg:py-32',
			none: 'py-0',
		}[stegaSpacing] || 'py-12 sm:py-16 lg:py-20'

	// Desktop column classes for standard grid
	const gridColsClass =
		{
			2: 'lg:grid-cols-2',
			3: 'lg:grid-cols-3',
			4: 'lg:grid-cols-4',
			5: 'lg:grid-cols-5',
		}[stegaCols] || 'lg:grid-cols-4'

	// Mobile grid classes
	const mobileGridClass =
		stegaMobileLayout === 'grid-2' ? 'grid-cols-2' : 'grid-cols-1'

	// Numeric styling classes
	const numberColorClass =
		{
			brand: 'text-primary',
			gradient:
				'bg-linear-to-br from-primary via-primary/95 to-secondary bg-clip-text text-transparent',
			neutral: 'text-foreground',
		}[stegaNumberColor] || 'text-primary'

	const numberSizeClass =
		{
			default: 'text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight',
			compact: 'text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight',
			heroic: 'text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight',
		}[stegaNumberSize] ||
		'text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight'

	// Card visual style classes
	const cardStyleClass = isDivider
		? 'relative flex flex-col p-5 sm:p-6 transition-colors duration-200'
		: {
				card: 'relative flex flex-col rounded-2xl border border-border/70 bg-surface dark:bg-zinc-900/80 p-6 sm:p-7 shadow-2xs transition-all duration-300 hover:border-primary/40 hover:shadow-md',
				elevated:
					'relative flex flex-col rounded-2xl border border-border/40 bg-surface dark:bg-zinc-900 shadow-md p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40',
				minimal:
					'relative flex flex-col rounded-2xl bg-muted/50 dark:bg-zinc-800/40 p-6 sm:p-7 transition-all duration-300 hover:bg-muted/80',
				outline:
					'relative flex flex-col rounded-2xl border-2 border-border/80 bg-transparent p-6 sm:p-7 transition-all duration-300 hover:border-primary hover:bg-surface/30',
			}[stegaCardStyle] ||
			'relative flex flex-col rounded-2xl border border-border/70 bg-surface dark:bg-zinc-900/80 p-6 sm:p-7 shadow-2xs'

	// Icon container style classes
	const iconContainerClass =
		{
			brand:
				'bg-primary/10 text-primary ring-1 ring-primary/25 rounded-xl p-2.5 size-11 inline-flex items-center justify-center shrink-0 mb-3.5',
			neutral:
				'bg-muted text-foreground ring-1 ring-border/80 rounded-xl p-2.5 size-11 inline-flex items-center justify-center shrink-0 mb-3.5',
			minimal:
				'text-primary size-7 inline-flex items-center justify-center shrink-0 mb-3',
		}[stegaIconStyle] ||
		'bg-primary/10 text-primary ring-1 ring-primary/25 rounded-xl p-2.5 size-11 inline-flex items-center justify-center shrink-0 mb-3.5'

	// Section intro component
	const SectionHeader = ({ className }: { className?: string }) => {
		if (!hasBadge && !hasIntro) return null

		return (
			<header
				className={cn(
					'space-y-3',
					isHeaderCentered ? 'mx-auto max-w-3xl text-center' : 'text-left',
					className,
				)}
			>
				{hasBadge && (
					<div
						className={cn(
							'flex',
							isHeaderCentered ? 'justify-center' : 'justify-start',
						)}
					>
						<span className="bg-primary/10 text-primary ring-primary/20 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase ring-1">
							{badge}
						</span>
					</div>
				)}

				{hasIntro && (
					<div className="prose dark:prose-invert max-w-none">
						<PortableText
							value={intro ?? []}
							components={{
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
										<p className="text-muted-foreground mt-2.5 text-base leading-relaxed sm:text-lg">
											{children}
										</p>
									),
								},
							}}
						/>
					</div>
				)}
			</header>
		)
	}

	// Single Metric Item Renderer
	const renderMetricCard = (
		item: EnhancedStatList['stats'] extends Array<infer T> ? T : any,
		index: number,
		extraClass?: string,
	) => {
		const {
			_key,
			prefix = '',
			value = '',
			suffix = '',
			label = '',
			content = [],
			iconPreset = 'none',
			icon,
			link,
			linkEntireCard = false,
		} = item || {}

		const hasCustomIcon = Boolean(icon?.asset)
		const hasPresetIcon = Boolean(iconPreset && iconPreset !== 'none')
		const hasIcon = hasCustomIcon || hasPresetIcon
		const hasLink = Boolean(link?.external || link?.internal?.slug)
		const isEntireCardClickable = Boolean(hasLink && linkEntireCard)
		const plainContent =
			content && content.length > 0 ? getBlockText(content as any) : ''
		const ariaText = `${prefix}${value}${suffix}${label ? `: ${label}` : ''}${plainContent ? `. ${plainContent}` : ''}`

		return (
			<div
				key={_key || index}
				data-sanity={sanityAttr?.scope(`stats[_key=="${_key}"]`).toString()}
				className={cn(
					cardStyleClass,
					isTextCentered ? 'items-center text-center' : 'items-start text-left',
					isEntireCardClickable &&
						'group hover:border-primary/60 focus-within:ring-primary cursor-pointer focus-within:ring-2 focus-within:outline-hidden',
					extraClass,
				)}
				aria-label={ariaText}
			>
				{/* Clickable link overlay if linkEntireCard is active */}
				{isEntireCardClickable && link && (
					<SanityLink
						link={link as SanityLinkType}
						className="focus-visible:ring-primary absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:outline-hidden"
						tabIndex={-1}
						aria-hidden="true"
					/>
				)}

				{/* Visual Media / Icon */}
				{hasIcon && (
					<div
						className={cn(
							'flex w-full',
							isTextCentered ? 'justify-center' : 'justify-start',
						)}
						aria-hidden="true"
					>
						<div className={iconContainerClass}>
							{hasCustomIcon ? (
								<Img
									className="size-6 object-contain"
									image={icon}
									width={48}
									height={48}
									alt=""
								/>
							) : (
								renderPresetIcon(
									iconPreset,
									stegaIconStyle === 'minimal' ? 'size-6.5' : 'size-5',
								)
							)}
						</div>
					</div>
				)}

				{/* Primary Metric Figure (Accessible Term / Highlight) */}
				<dt
					className={cn(
						'flex w-full items-baseline',
						isTextCentered ? 'justify-center' : 'justify-start',
					)}
				>
					<div
						className={cn(
							'inline-flex items-baseline font-mono font-black break-keep tabular-nums',
							numberColorClass,
							numberSizeClass,
						)}
					>
						<StatCounter
							value={value}
							prefix={prefix}
							suffix={suffix}
							enabled={isAnimateCounter}
						/>
					</div>
				</dt>

				{/* Metric Context, Label & Description */}
				{(label || (content && content.length > 0)) && (
					<dd
						className={cn(
							'mt-2.5 w-full space-y-1',
							isTextCentered ? 'text-center' : 'text-left',
						)}
					>
						{label && (
							<p className="text-foreground text-sm font-semibold tracking-tight sm:text-base">
								{label}
							</p>
						)}
						{content && content.length > 0 && (
							<div className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
								<PortableText
									value={content}
									components={statPortableTextComponents}
								/>
							</div>
						)}
					</dd>
				)}

				{/* Non-card link button if configured and entire card is not clickable */}
				{hasLink && !linkEntireCard && link && (
					<div
						className={cn(
							'relative z-20 mt-3 flex w-full pt-1',
							isTextCentered ? 'justify-center' : 'justify-start',
						)}
					>
						<SanityLink
							link={link as SanityLinkType}
							className="text-primary hover:text-primary/80 focus-visible:ring-primary inline-flex items-center text-xs font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-hidden"
						/>
					</div>
				)}
			</div>
		)
	}

	return (
		<section
			aria-labelledby={hasIntro ? headingId : undefined}
			className={cn(
				'section',
				spacingClasses,
				isBoxed &&
					'border-border/70 bg-surface/80 rounded-3xl border p-6 shadow-2xs backdrop-blur-xs sm:p-10 lg:p-14',
			)}
			{...moduleAttributes(props)}
		>
			{/* Layout Variant: Split (Narrative on Left, Metrics on Right) */}
			{isSplit ? (
				<div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
					{/* Left narrative & CTAs */}
					<div className="space-y-6 lg:sticky lg:top-24 lg:col-span-5">
						<SectionHeader className="text-left" />

						{hasCTAs && (
							<div className="pt-2">
								<CTAList ctas={ctas} className="justify-start" />
							</div>
						)}
					</div>

					{/* Right metrics grid */}
					<div className="lg:col-span-7">
						{hasStats && (
							<>
								{/* Mobile Swipe Carousel */}
								{stegaMobileLayout === 'carousel' ? (
									<div className="sm:hidden">
										<StatCarousel>
											{stats.map((item, idx) =>
												renderMetricCard(item, idx, 'h-full'),
											)}
										</StatCarousel>
									</div>
								) : null}

								{/* Responsive Grid */}
								<dl
									className={cn(
										'm-0 list-none gap-4 p-0 sm:gap-6',
										stegaMobileLayout === 'carousel'
											? 'hidden sm:grid sm:grid-cols-2'
											: cn('grid', mobileGridClass, 'sm:grid-cols-2'),
									)}
								>
									{stats.map((item, idx) => renderMetricCard(item, idx))}
								</dl>
							</>
						)}
					</div>
				</div>
			) : (
				/* Layout Variants: Grid, Bento, or Divider Strip */
				<div className="space-y-8 sm:space-y-10 lg:space-y-14">
					{/* Section Header */}
					<SectionHeader />

					{/* Metrics Display */}
					{hasStats && (
						<>
							{/* Mobile Carousel mode */}
							{stegaMobileLayout === 'carousel' ? (
								<div className="sm:hidden">
									<StatCarousel>
										{stats.map((item, idx) =>
											renderMetricCard(item, idx, 'h-full'),
										)}
									</StatCarousel>
								</div>
							) : null}

							{/* Desktop/Tablet Grid, Bento, or Divider Strip */}
							<dl
								className={cn(
									'm-0 list-none p-0',
									isDivider
										? 'divide-border/60 border-border/60 grid grid-cols-1 divide-y border-y py-2 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4'
										: isBento
											? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'
											: cn(
													'grid gap-4 sm:gap-6',
													mobileGridClass,
													'sm:grid-cols-2 md:grid-cols-3',
													gridColsClass,
												),
									stegaMobileLayout === 'carousel' && 'hidden sm:grid',
								)}
							>
								{stats.map((item, idx) => {
									// Bento heroic emphasis on first card if 3+ items
									const isFirstBentoItem =
										isBento && idx === 0 && stats.length >= 3
									const bentoClasses = isFirstBentoItem
										? 'sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-primary/5 dark:bg-primary/10 border-primary/25 p-8 sm:p-10 justify-center'
										: undefined

									return renderMetricCard(item, idx, bentoClasses)
								})}
							</dl>
						</>
					)}

					{/* Section CTAs */}
					{hasCTAs && (
						<div
							className={cn(
								'flex pt-2',
								isHeaderCentered ? 'justify-center' : 'justify-start',
							)}
						>
							<CTAList
								ctas={ctas}
								className={
									isHeaderCentered ? 'justify-center' : 'justify-start'
								}
							/>
						</div>
					)}
				</div>
			)}
		</section>
	)
}
