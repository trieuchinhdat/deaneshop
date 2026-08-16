'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { IoChevronBack, IoChevronForward, IoClose } from 'react-icons/io5'
import { cn } from '@/lib/utils'
import ResponsiveImage from '../responsiveImage'

// ================= TYPES =================
export interface AnnouncementItemData {
	_id?: string
	_key?: string
	enabled?: boolean
	variant?: 'text' | 'image'
	badgeText?: string
	badgeBgColor?: string
	badgeTextColor?: string
	content?: string
	backgroundColor?: string
	textColor?: string
	image?: any
	linkBannerType?: 'internal' | 'external'
	internalType?: string
	internalSlug?: string
	external?: string
}

interface AnnouncementProps {
	announcements?: AnnouncementItemData[]
	allowDismiss?: boolean
	autoPlayInterval?: number // In seconds, 0 = disabled
}

// ================= LINK RESOLVER =================
const resolveInternalLink = (slug: string, type?: string) => {
	if (!slug) return '/'
	switch (type) {
		case 'product':
			return `/products/${slug}`
		case 'collection':
			return `/collections/${slug}`
		case 'blog.post':
			return `/blog/${slug}`
		case 'page':
			return slug === 'home' || slug === 'index' ? '/' : `/${slug}`
		default:
			return `/${slug}`
	}
}

const getBannerHref = (item: AnnouncementItemData): string | null => {
	if (item.linkBannerType === 'external' && item.external) {
		return item.external
	}
	if (item.linkBannerType === 'internal' && item.internalSlug) {
		return resolveInternalLink(item.internalSlug, item.internalType)
	}
	return null
}

// ================= 1. SINGLE ITEM RENDERER =================
function AnnouncementItemCard({ item }: { item: AnnouncementItemData }) {
	const bannerHref = getBannerHref(item)
	const isExternal = item.linkBannerType === 'external'

	// A. IMAGE VARIANT (Đồng bộ chiều cao chuẩn với Topbar, tràn viền không padding)
	if (item.variant === 'image' && item.image?.asset) {
		const imgElement = (
			<div
				className="flex h-[38px] md:h-[42px] w-full items-center justify-center p-0 m-0 overflow-hidden leading-none"
				style={{
					backgroundColor: item.backgroundColor || 'transparent',
				}}
			>
				<ResponsiveImage
					image={item.image}
					className="flex h-[38px] md:h-[42px] w-full justify-center items-center object-cover p-0 m-0 block"
					imgClassName="h-[38px] md:h-[42px] w-full object-cover max-h-[42px]"
					priority={true}
				/>
			</div>
		)

		if (bannerHref) {
			return (
				<Link
					href={bannerHref}
					target={isExternal ? '_blank' : undefined}
					rel={isExternal ? 'noopener noreferrer' : undefined}
					className="block h-[38px] md:h-[42px] w-full p-0 m-0 leading-none"
				>
					{imgElement}
				</Link>
			)
		}
		return imgElement
	}

	// B. TEXT VARIANT (Đồng bộ chiều cao chuẩn h-[38px] md:h-[42px], căn giữa)
	const textContent = (
		<div
			className="flex h-[38px] md:h-[42px] flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center text-xs md:text-sm font-medium leading-tight px-14"
			style={{ color: item.textColor || 'inherit' }}
		>
			{/* Badge */}
			{item.badgeText && (
				<span
					className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs"
					style={{
						backgroundColor: item.badgeBgColor || 'var(--color-primary, #059669)',
						color: item.badgeTextColor || '#ffffff',
					}}
				>
					{item.badgeText}
				</span>
			)}

			{/* Main Text Message */}
			<span className="truncate-2-lines inline-block">{item.content || 'Special Announcement'}</span>
		</div>
	)

	if (bannerHref) {
		return (
			<Link
				href={bannerHref}
				target={isExternal ? '_blank' : undefined}
				rel={isExternal ? 'noopener noreferrer' : undefined}
				className="inline-flex h-[38px] md:h-[42px] items-center justify-center transition-opacity hover:opacity-80 hover:underline"
			>
				{textContent}
			</Link>
		)
	}

	return textContent
}

// ================= 2. MAIN TOPBAR ANNOUNCEMENT =================
export default function Announcement({
	announcements = [],
	allowDismiss = true,
	autoPlayInterval = 4,
}: AnnouncementProps) {
	// Filter active items
	const activeItems = useMemo(
		() => announcements.filter((item) => item && item.enabled !== false),
		[announcements]
	)

	const [currentIndex, setCurrentIndex] = useState(0)
	const [isPaused, setIsPaused] = useState(false)
	const [dismissed, setDismissed] = useState(false)
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	// Check sessionStorage for dismissed status on client mount (scoped per announcement list)
	useEffect(() => {
		try {
			if (typeof window !== 'undefined' && allowDismiss && activeItems.length > 0) {
				const itemKey = activeItems.map((i) => i._id || i._key || '').sort().join('_')
				const isDismissed = sessionStorage.getItem(`ecocros_topbar_dismissed_${itemKey}`)
				if (isDismissed === 'true') {
					setDismissed(true)
				}
			}
		} catch {
			// Ignore sessionStorage errors in private mode
		}
	}, [allowDismiss, activeItems])

	const handleDismiss = () => {
		setDismissed(true)
		try {
			if (typeof window !== 'undefined') {
				const itemKey = activeItems.map((i) => i._id || i._key || '').sort().join('_')
				sessionStorage.setItem(`ecocros_topbar_dismissed_${itemKey}`, 'true')
			}
		} catch {
			// Ignore
		}
	}

	const nextSlide = useCallback(() => {
		if (activeItems.length <= 1) return
		setCurrentIndex((prev) => (prev + 1) % activeItems.length)
	}, [activeItems.length])

	const prevSlide = useCallback(() => {
		if (activeItems.length <= 1) return
		setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length)
	}, [activeItems.length])

	// Auto-Play Slides
	useEffect(() => {
		if (activeItems.length <= 1 || isPaused || !autoPlayInterval || autoPlayInterval <= 0) {
			if (timerRef.current) clearInterval(timerRef.current)
			return
		}

		timerRef.current = setInterval(() => {
			nextSlide()
		}, autoPlayInterval * 1000)

		return () => {
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [activeItems.length, autoPlayInterval, isPaused, nextSlide])

	if (activeItems.length === 0 || dismissed) return null

	const currentItem = activeItems[currentIndex] || activeItems[0]
	const isImage = currentItem.variant === 'image'
	const hasMultiple = activeItems.length > 1

	return (
		<aside
			role="region"
			aria-label="Announcement"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
			onFocus={() => setIsPaused(true)}
			onBlur={() => setIsPaused(false)}
			className={cn(
				'group relative z-30 w-full h-[38px] md:h-[42px] overflow-hidden transition-all duration-300',
				isImage ? 'p-0 m-0 border-0 leading-none block' : 'p-0 m-0 border-b border-stroke/15'
			)}
			style={{
				backgroundColor: currentItem.backgroundColor || (isImage ? 'transparent' : 'var(--color-header-foreground-5, rgba(0,0,0,0.04))'),
				color: currentItem.textColor || 'inherit',
			}}
		>
			{/* Container chính: Đảm bảo toàn bộ nội dung và nút điều hướng nằm gọn bên trong khung section */}
			<div className="section mx-auto relative h-full flex items-center justify-center">
				{/* Active Announcement Slide Content */}
				<div className="w-full h-full flex items-center justify-center text-center transition-all duration-500 ease-in-out">
					<AnnouncementItemCard
						key={currentItem._id || currentItem._key || `slide-${currentIndex}`}
						item={currentItem}
					/>
				</div>

				{/* Previous Arrow Button (Nằm bên trong container chính, nổi lên trên z-40) */}
				{hasMultiple && (
					<button
						type="button"
						onClick={prevSlide}
						aria-label="Previous announcement"
						className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-40 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white shadow-md backdrop-blur-xs transition-all hover:bg-black/75 hover:scale-110 focus:outline-hidden"
					>
						<IoChevronBack className="h-4 w-4" />
					</button>
				)}

				{/* Next Arrow Button (Nằm bên trong container chính, nổi lên trên z-40) */}
				{hasMultiple && (
					<button
						type="button"
						onClick={nextSlide}
						aria-label="Next announcement"
						className={cn(
							'absolute top-1/2 -translate-y-1/2 z-40 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white shadow-md backdrop-blur-xs transition-all hover:bg-black/75 hover:scale-110 focus:outline-hidden',
							allowDismiss ? 'right-10 md:right-12' : 'right-2 md:right-4'
						)}
					>
						<IoChevronForward className="h-4 w-4" />
					</button>
				)}

				{/* Dismiss / Close Button (Nằm bên trong container chính, nổi lên trên z-40) */}
				{allowDismiss && (
					<button
						type="button"
						onClick={handleDismiss}
						aria-label="Dismiss announcement"
						className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-40 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white shadow-md backdrop-blur-xs transition-all hover:bg-black/75 hover:scale-110 focus:outline-hidden"
					>
						<IoClose className="h-4 w-4" />
					</button>
				)}
			</div>
		</aside>
	)
}
