import { PortableText, stegaClean } from 'next-sanity'
import { cn } from '@/lib/utils'
import type { HeroSplit } from '@/sanity/types'
import CTAList from '@/ui/cta-list'
import ResponsiveImage from '@/ui/responsiveImage'
import { moduleAttributes } from '.'

export type HeroSplitProps = HeroSplit & {
	badge?: string
	trustText?: string
	desktopLayout?: 'mediaRight' | 'mediaLeft'
	mobileLayout?: 'textFirst' | 'mediaFirst'
	splitRatio?: '50-50' | '60-40' | '40-60'
	verticalAlignment?: 'center' | 'top'
	mediaAspectRatio?: 'auto' | '4/3' | '16/9' | '1/1' | '4/5'
	mediaCornerRadius?: 'none' | 'md' | 'xl' | '2xl'
	mediaElevation?: 'none' | 'shadow' | 'bordered'
	colorTheme?: 'transparent' | 'muted' | 'brand'
	loadingStrategy?: 'eager' | 'lazy'
	image?: HeroSplit['image'] & {
		mediaCaption?: string
	}
}

export default function HeroSplitModule({
	content = [],
	ctas,
	image,
	badge,
	trustText,
	desktopLayout,
	mobileLayout,
	splitRatio = '50-50',
	verticalAlignment = 'center',
	mediaAspectRatio = 'auto',
	mediaCornerRadius = 'xl',
	mediaElevation = 'shadow',
	colorTheme = 'transparent',
	loadingStrategy = 'eager',
	...props
}: HeroSplitProps) {
	const cleanBadge = stegaClean(badge)
	const cleanTrustText = stegaClean(trustText)
	const cleanMediaCaption = stegaClean(image?.mediaCaption)
	const cleanDesktopLayout = stegaClean(desktopLayout)
	const cleanMobileLayout = stegaClean(mobileLayout)
	const cleanSplitRatio = stegaClean(splitRatio) || '50-50'
	const cleanVerticalAlignment = stegaClean(verticalAlignment) || 'center'
	const cleanMediaAspectRatio = stegaClean(mediaAspectRatio) || 'auto'
	const cleanMediaCornerRadius = stegaClean(mediaCornerRadius) || 'xl'
	const cleanMediaElevation = stegaClean(mediaElevation) || 'shadow'
	const cleanColorTheme = stegaClean(colorTheme) || 'transparent'
	const cleanLoadingStrategy = stegaClean(loadingStrategy) || 'eager'

	// Backward-compatibility resolution
	const isMediaRight = cleanDesktopLayout
		? cleanDesktopLayout === 'mediaRight'
		: image?.onRight !== false

	const isTextFirst = cleanMobileLayout
		? cleanMobileLayout === 'textFirst'
		: image?.afterContent !== false

	const isPriority =
		cleanLoadingStrategy === 'eager' ||
		stegaClean(image?.loading) === 'eager' ||
		(cleanLoadingStrategy !== 'lazy' && stegaClean(image?.loading) !== 'lazy')

	const hasImage = Boolean(image?.asset || (image as any)?.url)

	const themeWrapperClasses =
		{
			transparent: '',
			muted: 'bg-surface/70 py-10 sm:py-16 lg:py-20 my-4 sm:my-8 rounded-3xl border border-border/50',
			brand: 'bg-primary/[0.04] py-10 sm:py-16 lg:py-20 my-4 sm:my-8 rounded-3xl border border-primary/10',
		}[cleanColorTheme] || ''

	const cornerRadiusClasses =
		{
			none: 'rounded-none',
			md: 'rounded-lg sm:rounded-xl',
			xl: 'rounded-2xl sm:rounded-3xl',
			'2xl': 'rounded-3xl sm:rounded-4xl',
		}[cleanMediaCornerRadius] || 'rounded-2xl sm:rounded-3xl'

	const elevationClasses =
		{
			none: '',
			shadow: 'shadow-2xl shadow-black/8 dark:shadow-black/30',
			bordered:
				'border border-border/80 shadow-2xl shadow-black/8 dark:shadow-black/30',
		}[cleanMediaElevation] || 'shadow-2xl shadow-black/8 dark:shadow-black/30'

	const aspectClasses =
		{
			auto: '',
			'4/3': 'aspect-[4/3]',
			'16/9': 'aspect-[16/9]',
			'1/1': 'aspect-square',
			'4/5': 'aspect-[4/5]',
		}[cleanMediaAspectRatio] || ''

	// Grid layout proportions
	const gridColsClasses = hasImage
		? cleanSplitRatio === '60-40'
			? 'grid-cols-1 md:grid-cols-12'
			: cleanSplitRatio === '40-60'
				? 'grid-cols-1 md:grid-cols-12'
				: 'grid-cols-1 md:grid-cols-2'
		: 'grid-cols-1'

	const contentColSpan = hasImage
		? cleanSplitRatio === '60-40'
			? 'md:col-span-7'
			: cleanSplitRatio === '40-60'
				? 'md:col-span-5'
				: 'md:col-span-1'
		: 'max-w-3xl mx-auto text-center'

	const mediaColSpan = hasImage
		? cleanSplitRatio === '60-40'
			? 'md:col-span-5'
			: cleanSplitRatio === '40-60'
				? 'md:col-span-7'
				: 'md:col-span-1'
		: ''

	// Responsive order classes
	const contentOrderClass = hasImage
		? cn(
				isTextFirst ? 'order-1' : 'order-2',
				isMediaRight ? 'md:order-1' : 'md:order-2',
			)
		: ''

	const mediaOrderClass = hasImage
		? cn(
				isTextFirst ? 'order-2' : 'order-1',
				isMediaRight ? 'md:order-2' : 'md:order-1',
			)
		: ''

	return (
		<section
			className={cn('relative w-full', themeWrapperClasses)}
			{...moduleAttributes(props)}
		>
			<div
				className={cn(
					'section grid gap-8 sm:gap-10 lg:gap-14 xl:gap-16',
					cleanVerticalAlignment === 'top' ? 'items-start' : 'items-center',
					gridColsClasses,
				)}
			>
				{/* Content Column */}
				<div
					className={cn(
						'flex flex-col space-y-6 sm:space-y-7',
						contentColSpan,
						contentOrderClass,
						!hasImage && 'items-center',
					)}
				>
					{/* Eyebrow Badge */}
					{cleanBadge && (
						<div>
							<span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold tracking-wide bg-primary/10 text-primary border border-primary/20 shadow-xs">
								<span
									className="h-2 w-2 rounded-full bg-primary animate-pulse"
									aria-hidden="true"
								/>
								<span>{cleanBadge}</span>
							</span>
						</div>
					)}

					{/* Rich Text Heading & Body */}
					{content?.length > 0 && (
						<div className="prose dark:prose-invert max-w-none space-y-4">
							<PortableText
								value={content}
								components={{
									block: {
										h1: ({ children }) => (
											<h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl sm:leading-[1.12]">
												{children}
											</h1>
										),
										h2: ({ children }) => (
											<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
												{children}
											</h2>
										),
										normal: ({ children }) => (
											<p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
												{children}
											</p>
										),
									},
								}}
							/>
						</div>
					)}

					{/* Action Buttons */}
					{ctas && ctas.length > 0 && (
						<div className="pt-2 sm:pt-3">
							<CTAList
								ctas={ctas}
								className={cn(
									'flex flex-wrap items-center gap-3.5',
									!hasImage && 'justify-center',
								)}
							/>
						</div>
					)}

					{/* Trust & Social Proof Micro-copy */}
					{cleanTrustText && (
						<div
							className={cn(
								'flex items-center gap-2 text-xs sm:text-sm text-muted-foreground pt-1 select-none',
								!hasImage && 'justify-center',
							)}
						>
							<span
								className="text-amber-500 text-sm font-bold tracking-wider"
								aria-hidden="true"
							>
								★★★★★
							</span>
							<span className="font-medium">{cleanTrustText}</span>
						</div>
					)}
				</div>

				{/* Visual Media Column */}
				{hasImage && (
					<figure
						className={cn(
							'relative w-full overflow-hidden transition-all duration-300',
							cornerRadiusClasses,
							elevationClasses,
							aspectClasses,
							mediaColSpan,
							mediaOrderClass,
						)}
					>
						<ResponsiveImage
							className="block h-full w-full"
							imgClassName={cn(
								'h-full w-full object-cover',
								aspectClasses,
								cornerRadiusClasses,
							)}
							image={image}
							desktop={{ width: 1200 }}
							mobile={{ width: 600 }}
							priority={isPriority}
							sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
						/>

						{/* Floating Media Caption / Micro-Card */}
						{cleanMediaCaption && (
							<figcaption className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs z-10 backdrop-blur-md bg-background/90 dark:bg-zinc-900/90 border border-border/70 rounded-xl p-3 shadow-lg text-xs font-medium text-foreground">
								{cleanMediaCaption}
							</figcaption>
						)}
					</figure>
				)}
			</div>
		</section>
	)
}
