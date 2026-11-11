import { FiImage } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import { moduleAttributes, type ModuleProps } from '..'
import HeroSliderClient from './hero-slider-client'

export type HeroSlideItem = {
	_key: string
	image?: any
	mobileImage?: any
	alt?: string
	eyebrow?: string
	title?: string
	description?: string
	ctas?: any[]
	textPosition?: 'bottom' | 'center'
	textAlign?: 'left' | 'center'
	overlay?: 'gradient' | 'dark' | 'deep-dark' | 'none'
}

export type HeroSliderProps = {
	slides?: HeroSlideItem[]
	fullWidth?: boolean
	height?: 'dvh-80' | 'dvh-100' | 'ratio'
	autoSlide?: boolean
	interval?: number
	navigation?: boolean
	pagination?: boolean
} & ModuleProps & { sanityAttr?: any }

export default function HeroSlider({
	slides = [],
	fullWidth = true,
	height = 'dvh-80',
	autoSlide = true,
	interval = 6,
	navigation = true,
	pagination = true,
	sanityAttr,
	...props
}: HeroSliderProps) {
	if (!slides.length) {
		return (
			<section className="section py-12 text-center" {...moduleAttributes(props)}>
				<div className="rounded-3xl border-2 border-dashed border-border/80 bg-muted/20 p-8 sm:p-12 space-y-3">
					<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<FiImage className="size-6" />
					</div>
					<h3 className="text-base sm:text-lg font-bold text-foreground">
						Hero Slider Section
					</h3>
					<p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
						No hero slides added yet. Add slides in Sanity Studio with desktop and mobile banners, headlines, and call-to-actions.
					</p>
				</div>
			</section>
		)
	}

	return (
		<section
			className={cn(fullWidth ? 'w-full' : 'section py-4 sm:py-6')}
			{...moduleAttributes(props)}
		>
			<HeroSliderClient
				slides={slides}
				fullWidth={fullWidth}
				height={height}
				autoSlide={autoSlide}
				interval={interval}
				navigation={navigation}
				pagination={pagination}
				sanityAttr={sanityAttr}
			/>
		</section>
	)
}
