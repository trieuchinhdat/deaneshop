'use client'

import { useState } from 'react'
import { A11y, Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import CTAList from '@/ui/cta-list'
import ResponsiveImage from '@/ui/responsiveImage'
import type { HeroSlideItem, HeroSliderProps } from './index'

export default function HeroSliderClient({
	slides = [],
	fullWidth = true,
	height = 'dvh-80',
	autoSlide = true,
	interval = 6,
	navigation = true,
	pagination = true,
	sanityAttr,
}: HeroSliderProps) {
	const [swiperInstance, setSwiperInstance] = useState<any>(null)
	const [isPlaying, setIsPlaying] = useState(autoSlide)

	const toggleAutoplay = () => {
		if (!swiperInstance?.autoplay) return
		if (isPlaying) {
			swiperInstance.autoplay.stop()
			setIsPlaying(false)
		} else {
			swiperInstance.autoplay.start()
			setIsPlaying(true)
		}
	}

	const heightClasses = {
		'dvh-80': 'min-h-[500px] h-[78dvh] max-h-[820px]',
		'dvh-100': 'min-h-[560px] h-[100dvh]',
		ratio: 'aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[460px]',
	}[height] || 'min-h-[500px] h-[78dvh] max-h-[820px]'

	return (
		<div
			className={cn(
				'hero-slider-container group relative overflow-hidden',
				!fullWidth && 'rounded-2xl sm:rounded-3xl',
				heightClasses,
			)}
			role="region"
			aria-roledescription="carousel"
			aria-label="Featured Hero Slider"
			style={{ touchAction: 'pan-y' }}
		>
			<Swiper
				modules={[Autoplay, Navigation, Pagination, A11y]}
				onSwiper={setSwiperInstance}
				navigation={
					navigation
						? {
								prevEl: '.hero-slider-prev',
								nextEl: '.hero-slider-next',
							}
						: false
				}
				pagination={
					pagination
						? {
								clickable: true,
								bulletClass: 'hero-slider-bullet',
								bulletActiveClass: 'hero-slider-bullet-active',
							}
						: false
				}
				autoplay={
					autoSlide
						? {
								delay: interval * 1000,
								disableOnInteraction: false,
								pauseOnMouseEnter: true,
							}
						: false
				}
				loop={slides.length > 1}
				slidesPerView={1}
				speed={600}
				className="h-full w-full"
			>
				{slides.map((slide, index) => {
					const isFirst = index === 0
					const overlay = slide.overlay || 'gradient'
					const textAlign = slide.textAlign || 'left'
					const textPosition = slide.textPosition || 'bottom'

					const overlayClass = {
						gradient:
							'bg-linear-to-t from-black/90 via-black/40 to-transparent',
						dark: 'bg-black/35',
						'deep-dark': 'bg-black/60',
						none: '',
					}[overlay]

					return (
						<SwiperSlide
							key={slide._key || index}
							className="relative h-full w-full select-none"
							data-sanity={sanityAttr?.scope(`slides[_key=="${slide._key}"]`).toString()}
						>
							{/* Background Visual (Responsive Desktop / Mobile) */}
							<div className="absolute inset-0 h-full w-full">
								<ResponsiveImage
									image={{
										...slide.image,
										mobileImage: slide.mobileImage,
										alt: slide.alt || slide.title || 'Hero Banner',
									}}
									className="h-full w-full"
									imgClassName="h-full w-full object-cover object-center"
									priority={isFirst}
									loading={isFirst ? 'eager' : 'lazy'}
									desktop={{ width: 1600 }}
									mobile={{ width: 750 }}
									sizes="100vw"
								/>
							</div>

							{/* Contrast Overlay for WCAG 2.1 AA Compliance */}
							{overlayClass && (
								<div
									className={cn('absolute inset-0 pointer-events-none', overlayClass)}
									aria-hidden="true"
								/>
							)}

							{/* Slide Content (Anchored in Thumb Zone for Mobile Ergonomics) */}
							<div
								className={cn(
									'relative z-10 flex h-full w-full max-w-7xl mx-auto',
									'px-5 sm:px-8 md:px-12 lg:px-16',
									textPosition === 'bottom'
										? 'items-end pb-14 sm:pb-16 md:pb-20'
										: 'items-center py-12',
									textAlign === 'center'
										? 'justify-center text-center'
										: 'justify-start text-left',
								)}
							>
								<div
									className={cn(
										'max-w-2xl text-white space-y-3 sm:space-y-4',
										textAlign === 'center' && 'mx-auto flex flex-col items-center',
									)}
								>
									{/* Eyebrow Tag */}
									{slide.eyebrow && (
										<div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-white backdrop-blur-md shadow-2xs">
											{slide.eyebrow}
										</div>
									)}

									{/* Main Headline */}
									{slide.title && (
										<h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-white drop-shadow-sm">
											{slide.title}
										</h2>
									)}

									{/* Supporting Pitch */}
									{slide.description && (
										<p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed max-w-xl drop-shadow-xs line-clamp-3">
											{slide.description}
										</p>
									)}

									{/* Action CTAs (Touch target min 48px on Mobile) */}
									{slide.ctas && slide.ctas.length > 0 && (
										<div
											className={cn(
												'pt-2 sm:pt-4',
												textAlign === 'center' && 'justify-center',
											)}
										>
											<CTAList
												ctas={slide.ctas}
												className={cn(
													'gap-3',
													textAlign === 'center' && 'justify-center',
												)}
											/>
										</div>
									)}
								</div>
							</div>
						</SwiperSlide>
					)
				})}
			</Swiper>

			{/* Desktop Navigation Arrows (Hidden on Mobile to prevent fat-finger miss-clicks) */}
			{navigation && slides.length > 1 && (
				<>
					<button
						type="button"
						aria-label="Previous slide"
						className="hero-slider-prev hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 size-11 items-center justify-center rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md transition-all duration-200 border border-white/20 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
					>
						<ChevronLeft className="size-6" />
					</button>
					<button
						type="button"
						aria-label="Next slide"
						className="hero-slider-next hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 size-11 items-center justify-center rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md transition-all duration-200 border border-white/20 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
					>
						<ChevronRight className="size-6" />
					</button>
				</>
			)}

			{/* ADA Play/Pause Toggle for WCAG compliance */}
			{autoSlide && slides.length > 1 && (
				<button
					type="button"
					onClick={toggleAutoplay}
					aria-label={isPlaying ? 'Pause auto-rotation' : 'Play auto-rotation'}
					className="absolute bottom-4 right-4 z-20 size-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-md transition-all border border-white/20 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
				>
					{isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
				</button>
			)}
		</div>
	)
}
