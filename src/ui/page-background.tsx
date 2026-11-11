import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'

export type PageAppearanceData = {
	colorScheme?: 'light' | 'dark'
	backgroundType?: 'default' | 'color' | 'image'
	solidColor?: string
	image?: any
	mobileImage?: any
	displayMode?: 'hero-fade' | 'fixed' | 'scroll'
	imageFit?: 'cover' | 'repeat'
	overlayStyle?: 'dark' | 'light' | 'none'
	overlayOpacity?: number
	blurBackdrop?: boolean
	hideOnMobile?: boolean
	headerMode?: 'default' | 'transparent' | 'hidden'
	hideFooter?: boolean
	scrollReveal?: 'none' | 'fade-up' | 'fade' | 'scale-up' | 'blur-reveal'
	scrollRevealSpeed?: 'fast' | 'standard' | 'relaxed'
	scrollRevealOffset?: '20%' | '12%' | '5%' | string
}

export default function PageBackground({
	appearance,
}: {
	appearance?: PageAppearanceData
}) {
	if (!appearance) return null

	const {
		backgroundType = 'default',
		solidColor,
		image,
		mobileImage,
		displayMode = 'hero-fade',
		imageFit = 'cover',
		overlayStyle = 'dark',
		overlayOpacity = 40,
		blurBackdrop = false,
		hideOnMobile = false,
	} = appearance

	// 1. Theme default: do not render extra background layers
	if (backgroundType === 'default') {
		return null
	}

	// 2. Solid color mode
	if (backgroundType === 'color' && solidColor) {
		return (
			<div
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 -z-10 h-full w-full transition-colors duration-300"
				style={{ backgroundColor: solidColor }}
			/>
		)
	}

	// 3. Image mode
	if (backgroundType === 'image') {
		const desktopUrl = image?.asset
			? urlFor(image).width(2400).quality(85).auto('format').url()
			: null

		const mobileUrl = mobileImage?.asset
			? urlFor(mobileImage).width(1080).quality(85).auto('format').url()
			: null

		if (!desktopUrl && !mobileUrl && !solidColor) {
			return null
		}

		// Container positioning based on displayMode
		const isHeroFade = displayMode === 'hero-fade'
		const isFixed = displayMode === 'fixed'

		const containerClasses = cn(
			'pointer-events-none -z-10 overflow-hidden',
			isHeroFade &&
				'absolute inset-x-0 top-0 h-[75vh] sm:h-[88vh] lg:h-[105vh] w-full',
			isFixed && 'fixed inset-0 h-full w-full',
			!isHeroFade && !isFixed && 'absolute inset-0 h-full w-full',
			hideOnMobile && 'hidden md:block',
		)

		const heroFadeMask: React.CSSProperties = isHeroFade
			? {
					maskImage:
						'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
					WebkitMaskImage:
						'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
				}
			: {}

		const clampedOpacity = Math.min(
			Math.max((overlayOpacity ?? 40) / 100, 0),
			0.95,
		)

		return (
			<>
				{/* Solid fallback color if specified */}
				{solidColor && (
					<div
						aria-hidden="true"
						className="pointer-events-none fixed inset-0 -z-20 h-full w-full"
						style={{ backgroundColor: solidColor }}
					/>
				)}

				{/* Visual Canvas Layer */}
				<div
					aria-hidden="true"
					className={containerClasses}
					style={heroFadeMask}
				>
					{imageFit === 'repeat' && (desktopUrl || mobileUrl) ? (
						<div
							className={cn(
								'absolute inset-0 h-full w-full bg-repeat',
								blurBackdrop && 'blur-xs scale-105',
							)}
							style={{
								backgroundImage: `url(${desktopUrl || mobileUrl})`,
								backgroundSize: 'auto',
							}}
						/>
					) : (
						<picture className="absolute inset-0 h-full w-full">
							{mobileUrl && (
								<source media="(max-width: 767px)" srcSet={mobileUrl} />
							)}
							{desktopUrl && (
								<img
									src={desktopUrl}
									alt=""
									aria-hidden="true"
									loading="eager"
									fetchPriority={isHeroFade ? 'high' : 'auto'}
									className={cn(
										'h-full w-full object-cover object-center transition-transform duration-700',
										blurBackdrop && 'blur-sm scale-105',
									)}
								/>
							)}
						</picture>
					)}

					{/* Scrim Overlay Mask (Dark / Light Tint for WCAG 2.1 AA legibility) */}
					{overlayStyle !== 'none' && (
						<div
							className={cn(
								'absolute inset-0 pointer-events-none transition-opacity duration-300',
								overlayStyle === 'light' ? 'bg-white' : 'bg-black',
							)}
							style={{ opacity: clampedOpacity }}
						/>
					)}

					{/* Subtle bottom gradient falloff for hero-fade mode */}
					{isHeroFade && (
						<div
							aria-hidden="true"
							className="absolute inset-x-0 bottom-0 h-32 sm:h-48 bg-linear-to-b from-transparent to-background pointer-events-none"
						/>
					)}
				</div>
			</>
		)
	}

	return null
}
