'use client'

import { Autoplay, Grid, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/grid'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Link from 'next/link'
import ResponsiveImage from '@/ui/responsiveImage'

/* ---------------- Types ---------------- */

type CarouselBannerItem = {
	_key: string
	alt?: string
	url?: string
	loading?: 'lazy' | 'eager'
	mobileImage?: any
	asset?: any
}

type LayoutConfig = {
	bannersPerRow?: number
	rows?: number
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
		case 'product': // Nếu là sản phẩm
			return `/products/${slug}`
		case 'blog.post': // Nếu là bài viết (check tên schema trong sanity của bạn)
			return `/blog/${slug}`
		case 'page': // Nếu là page thường
			return slug === 'home' || slug === 'index' ? '/' : `/${slug}`
		default: // Mặc định
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

	/* 1. XÁC ĐỊNH SỐ CỘT (COLUMNS) */
	const desktopCols = desktop?.bannersPerRow ?? 4
	const mobileCols = mobile?.bannersPerRow ?? 1
	const desktopRows = desktop?.rows ?? 1
	const mobileRows = mobile?.rows ?? 1

	/* 2. TỰ ĐỘNG TÍNH GAP (LOGIC BẠN YÊU CẦU) */
	const desktopGap = desktopCols === 1 ? 0 : 16
	const mobileGap = mobileCols === 1 ? 0 : 8

	/* 3. SET BIẾN CSS (CHO LÚC CHƯA LOAD JS) */
	const cssVars = {
		'--desktop-cols': desktopCols,
		'--mobile-cols': mobileCols,
		'--desktop-rows': desktopRows,
		'--mobile-rows': mobileRows,
		'--desktop-gap': `${desktopGap}px`, // Truyền gap đã tính
		'--mobile-gap': `${mobileGap}px`, // Truyền gap đã tính
	} as React.CSSProperties

	/* ---------- Options ---------- */
	const {
		navigation = true,
		pagination = true,
		autoSlide = false,
	} = options ?? {}

	/* ---------- Swiper modules ---------- */
	const modules = [
		Grid,
		navigation && Navigation,
		pagination && Pagination,
		autoSlide && Autoplay,
	].filter(Boolean) as any

	return (
		<div className="carousel-banner-list" style={cssVars}>
			<Swiper
				modules={modules}
				navigation={navigation}
				pagination={pagination ? { clickable: true } : false}
				autoplay={
					autoSlide
						? {
								delay: 4000,
								disableOnInteraction: false,
							}
						: false
				}
				slidesPerView={desktopCols}
				grid={{
					rows: desktopRows,
					fill: 'row',
				}}
				spaceBetween={desktopGap}
				breakpoints={{
					0: {
						slidesPerView: mobileCols,
						grid: {
							rows: mobileRows,
							fill: 'row',
						},
						spaceBetween: mobileGap,
					},
					1024: {
						slidesPerView: desktopCols,
						grid: {
							rows: desktopRows,
							fill: 'row',
						},
						spaceBetween: desktopGap,
					},
				}}
			>
				{items.map((item) => {
					const image = item
					let bannerHref = null

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
					const banner = bannerHref ? (
						<Link
							href={bannerHref}
							target={image.type === 'external' ? '_blank' : undefined}
						>
							<ResponsiveImage
								image={image}
								className="w-full rounded-md"
								desktop={{ width: 1920 }}
								mobile={{ width: 390 }}
							/>
						</Link>
					) : (
						<ResponsiveImage
							image={image}
							className="w-full rounded-md"
							desktop={{ width: 1920 }}
							mobile={{ width: 390 }}
						/>
					)

					return (
						<SwiperSlide key={item._key}>
							<div
								className={
									options?.borderRadius ? 'overflow-hidden rounded-xl' : ''
								}
							>
								{banner}
							</div>
						</SwiperSlide>
					)
				})}
			</Swiper>
		</div>
	)
}
