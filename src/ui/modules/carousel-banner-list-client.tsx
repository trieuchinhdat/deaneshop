'use client'

import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Link from 'next/link'
import ResponsiveImage from '@/ui/responsiveImage'
import { MotionBanner } from '@/ui/motion/theme-motion'

/* ---------------- Types ---------------- */

type LayoutConfig = {
	bannersPerRow?: number
}

type CarouselOptions = {
	width?: boolean
	borderRadius?: boolean
	navigation?: boolean
	pagination?: boolean
	autoSlide?: boolean
}

type Props = {
	items: any[]
	desktop?: LayoutConfig
	mobile?: LayoutConfig
	options?: CarouselOptions
}

/* ---------------- Component ---------------- */
const resolveInternalLink = (slug: string, type: string) => {
	switch (type) {
		case 'product':
			return `/products/${slug}`
		case 'blog.post':
			return `/blog/${slug}`
		case 'page':
			return slug === 'home' || slug === 'index' ? '/' : `/${slug}`
		default:
			return `/${slug}`
	}
}

export default function CarouselBannerListClient({
	items,
	desktop,
	mobile,
	options,
}: Props) {
	if (!items?.length) return null

	const desktopCols = desktop?.bannersPerRow ?? 1
	const mobileCols = mobile?.bannersPerRow ?? 1

	const desktopGap = desktopCols === 1 ? 0 : 16
	const mobileGap = mobileCols === 1 ? 0 : 10

	const {
		navigation = true,
		pagination = true,
		autoSlide = false,
	} = options ?? {}

	const modules = [
		navigation && Navigation,
		pagination && Pagination,
		autoSlide && Autoplay,
	].filter(Boolean) as any

	return (
		<div
			className="carousel-banner-list relative"
			style={{
				touchAction: 'pan-y',
			}}
		>
			<Swiper
				modules={modules}
				navigation={navigation}
				pagination={pagination ? { clickable: true } : false}
				autoplay={
					autoSlide
						? {
								delay: 4500,
								disableOnInteraction: false,
								pauseOnMouseEnter: true,
							}
						: false
				}
				slidesPerView={mobileCols}
				spaceBetween={mobileGap}
				breakpoints={{
					768: {
						slidesPerView: Math.min(2, desktopCols),
						spaceBetween: 12,
					},
					1024: {
						slidesPerView: desktopCols,
						spaceBetween: desktopGap,
					},
				}}
				className="w-full"
			>
				{items.map((item, index) => {
					const image = item
					let bannerHref: string | null = null
					const isFirst = index < desktopCols

					const targetDesktopWidth =
						desktopCols === 1 ? 1440 : Math.min(1440, Math.round(1440 / desktopCols) * 2)
					const targetMobileWidth =
						mobileCols === 1 ? 600 : Math.min(600, Math.round(600 / mobileCols) * 2)

					const bannerSizes =
						desktopCols === 1 && mobileCols === 1
							? '100vw'
							: `(max-width: 768px) ${Math.round(100 / mobileCols)}vw, ${Math.round(100 / desktopCols)}vw`

					if (image.linkBannerType === 'external' && image?.external) {
						bannerHref = image.external
					} else if (
						image?.linkBannerType === 'internal' &&
						image?.internalSlug
					) {
						bannerHref = resolveInternalLink(
							image.internalSlug,
							image.internalType,
						)
					}

					const imageElement = (
						<ResponsiveImage
							image={{
								...image,
								mobileImage: image.mobileImage,
								alt: image.alt || 'Media Banner',
							}}
							className="w-full"
							imgClassName="theme-banner-img w-full h-auto object-cover"
							desktop={{ width: targetDesktopWidth }}
							mobile={{ width: targetMobileWidth }}
							priority={isFirst}
							sizes={bannerSizes}
						/>
					)

					const banner = bannerHref ? (
						<Link
							href={bannerHref}
							target={image.linkBannerType === 'external' ? '_blank' : undefined}
							className="block overflow-hidden"
						>
							{imageElement}
						</Link>
					) : (
						<div className="overflow-hidden">{imageElement}</div>
					)

					return (
						<SwiperSlide key={item._key || index}>
							<MotionBanner
								className={
									options?.borderRadius !== false
										? 'rounded-xl sm:rounded-2xl'
										: ''
								}
							>
								{banner}
							</MotionBanner>
						</SwiperSlide>
					)
				})}
			</Swiper>
		</div>
	)
}
