import { PortableText, stegaClean } from 'next-sanity'
import { FiImage } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import type { CarouselBannerList } from '@/sanity/types'
import { moduleAttributes } from '.'
import CarouselBannerListClient from './carousel-banner-list-client'

export default function WrapCarouselBannerList({
	items = [],
	desktop,
	mobile,
	options,
	intro = [],
	backgroundColor,
	textColor,
	...props
}: CarouselBannerList) {
	if (!items.length) {
		return (
			<section className="section py-12 text-center" {...moduleAttributes(props)}>
				<div className="rounded-3xl border-2 border-dashed border-border/80 bg-muted/20 p-8 sm:p-12 space-y-3">
					<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<FiImage className="size-6" />
					</div>
					<h3 className="text-base sm:text-lg font-bold text-foreground">
						Media Slider Section
					</h3>
					<p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
						No slide banners added yet. Click this section in Sanity Studio to upload desktop and mobile banners.
					</p>
				</div>
			</section>
		)
	}

	const isFullWidth = options?.width === true
	const hasBackground = !!backgroundColor
	return (
		<section
			className={cn(isFullWidth ? 'w-full' : 'section')}
			{...moduleAttributes(props)}
		>
			<div
				className={cn(
					'relative space-y-2 lg:space-y-4',
					hasBackground && 'rounded-xl p-2 lg:p-4',
				)}
				style={{
					...(backgroundColor && { backgroundColor: stegaClean(backgroundColor) }),
					...(textColor && { color: stegaClean(textColor) }),
				}}
			>
				{/* Intro */}
				{intro?.length > 0 && (
					<header className="prose dark:prose-invert max-w-none">
						<PortableText value={intro} />
					</header>
				)}
				<CarouselBannerListClient
					items={items}
					desktop={desktop}
					mobile={mobile}
					options={{
						...options,
					}}
				/>
			</div>
		</section>
	)
}
