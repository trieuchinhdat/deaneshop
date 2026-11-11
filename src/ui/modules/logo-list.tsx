import { PortableText } from 'next-sanity'
import type { Logo, LogoList } from '@/sanity/types'
import { FiLayers } from 'react-icons/fi'
import { moduleAttributes, type ModuleProps } from '.'
import LogoListClient, { type LogoItem } from './logo-list-client'

export interface ExtendedLogoList extends LogoList {
	speed?: 'slow' | 'medium' | 'fast' | 'custom'
	direction?: 'left' | 'right'
	pauseOnHover?: boolean
	showControls?: boolean
	gapSize?: 'compact' | 'normal' | 'spacious'
	logoHeight?: 'small' | 'medium' | 'large'
}

export default function LogoListModule({
	intro,
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
	...props
}: ExtendedLogoList & ModuleProps) {
	// Filter valid logos that have at least one renderable image
	const validLogos = (logos as unknown as LogoItem[])?.filter(
		(logo) => Boolean(logo && logo.image && (logo.image[logoType] || logo.image.default))
	) || []

	if (!logos || logos.length === 0 || validLogos.length === 0) {
		return (
			<section className="section py-10 text-center" {...moduleAttributes(props)}>
				<div className="rounded-3xl border-2 border-dashed border-border/80 bg-muted/20 p-8 sm:p-10 space-y-3">
					<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<FiLayers className="size-6" />
					</div>
					<h3 className="text-base sm:text-lg font-bold text-foreground">
						Logo Marquee Section
					</h3>
					<p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
						No partner or client logos selected yet. Click this section in Sanity Studio to link brand logos.
					</p>
				</div>
			</section>
		)
	}

	return (
		<section
			className="section py-8 lg:py-12 space-y-6 lg:space-y-8 text-center"
			{...moduleAttributes(props)}
		>
			{intro && (
				<header className="prose dark:prose-invert max-w-2xl mx-auto">
					<PortableText value={intro} />
				</header>
			)}

			<LogoListClient
				logos={validLogos}
				logoType={logoType}
				autoScroll={autoScroll}
				duration={duration}
				speed={speed}
				direction={direction}
				pauseOnHover={pauseOnHover}
				showControls={showControls}
				gapSize={gapSize}
				logoHeight={logoHeight}
			/>
		</section>
	)
}
