import { PortableText } from 'next-sanity'
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
	if (!items.length) return null

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
					...(backgroundColor && { backgroundColor }),
					...(textColor && { color: textColor }),
				}}
			>
				{/* Intro */}
				{intro?.length > 0 && (
					<header className="prose">
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
