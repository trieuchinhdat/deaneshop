'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
	HiOutlineBars3,
	HiOutlineFolder,
	HiOutlineSquares2X2,
} from 'react-icons/hi2'
import { VscChevronDown, VscChevronRight } from 'react-icons/vsc'
import { urlFor } from '@/sanity/lib/image'
import type { LinkList, Megamenu, Page } from '@/sanity/types'
import HoverDetails from '@/ui/hover-details'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

interface CategoryDropdownProps {
	items?: any[] | null
	label?: string
	icon?: string
	buttonStyle?: 'soft' | 'solid' | 'outline'
	className?: string
}

export default function CategoryDropdown({
	items,
	label = 'Danh mục sản phẩm',
	icon = 'grid',
	buttonStyle = 'soft',
	className,
}: CategoryDropdownProps) {
	const pathname = usePathname()
	const [activeIndex, setActiveIndex] = useState(0)
	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Clear intent timer on unmount
	useEffect(() => {
		return () => {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current)
			}
		}
	}, [])

	// Reset to first category on route change
	useEffect(() => {
		setActiveIndex(0)
	}, [pathname])

	if (!items || items.length === 0) return null

	const handleCategoryHover = (index: number) => {
		if (index === activeIndex) return

		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current)
		}

		// Intent debounce (~70ms) to prevent accidental switching when moving mouse diagonally
		hoverTimeoutRef.current = setTimeout(() => {
			setActiveIndex(index)
		}, 70)
	}

	const renderIcon = () => {
		switch (icon) {
			case 'menu':
				return <HiOutlineBars3 className="text-lg shrink-0" />
			case 'folder':
				return <HiOutlineFolder className="text-lg shrink-0" />
			case 'grid':
			default:
				return <HiOutlineSquares2X2 className="text-lg shrink-0" />
		}
	}

	const activeItem = items[activeIndex] || items[0]

	const getItemLabel = (item: any): string => {
		if (!item) return ''
		if (item.link?.label) return item.link.label
		if (item.label) return item.label
		if (item.link?.internal?.title) return item.link.internal.title
		if (item.title) return item.title
		return 'Danh mục'
	}

	const buttonStyleClasses =
		buttonStyle === 'solid'
			? 'bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm border border-primary/90'
			: buttonStyle === 'outline'
				? 'bg-background hover:bg-black/5 dark:hover:bg-white/5 text-foreground hover:text-primary font-semibold border border-stroke/30 shadow-2xs group-open/catmenu:border-primary group-open/catmenu:text-primary'
				: 'bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary font-bold border border-primary/20 shadow-xs group-open/catmenu:bg-primary group-open/catmenu:text-primary-foreground'

	return (
		<HoverDetails
			name="header-category"
			className={`group/catmenu static ${className || ''}`}
			safeAreaOnHover
			closeDelay={180}
		>
			{/* Trigger Button */}
			<summary
				className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer select-none list-none ${buttonStyleClasses}`}
			>
				{renderIcon()}
				<span className="font-semibold">{label}</span>
				<VscChevronDown className="text-xs transition-transform duration-300 group-open/catmenu:rotate-180 opacity-80" />
			</summary>

			{/* Master-Detail Panel (Khớp 100% Khung Container Header: left-0 right-0 w-full ngay dưới Hàng 1) */}
			<div className="anim-fade-to-b absolute top-full left-0 right-0 mt-2 z-50 w-full bg-background text-foreground border border-stroke/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-['']">
				<div className="flex w-full min-h-[460px] max-h-[calc(100vh-var(--header-height,64px)-48px)] overflow-hidden">
					{/* LEFT COLUMN: Master Categories Sidebar (~280px) */}
					<div className="w-[260px] lg:w-[280px] shrink-0 border-r border-stroke/15 bg-black/[0.02] dark:bg-white/[0.02] p-2.5 flex flex-col gap-1 overflow-y-auto">
						<div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-0.5">
							Tất cả danh mục
						</div>

						{items.map((item: any, idx: number) => {
							const itemLabel = getItemLabel(item)
							const isActive = idx === activeIndex
							const badge = item.badge
							const itemKey = item._key || `cat-${idx}`

							return (
								<div
									key={itemKey}
									onMouseEnter={() => handleCategoryHover(idx)}
									className={`group/item flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer select-none ${
										isActive
											? 'bg-primary text-primary-foreground font-bold shadow-xs'
											: 'text-foreground/90 hover:bg-black/5 dark:hover:bg-white/10 hover:text-primary'
									}`}
								>
									<div className="flex items-center gap-2 min-w-0">
										<span className="truncate">{itemLabel}</span>
										{badge && (
											<span
												className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md leading-none shrink-0 ${
													isActive
														? 'bg-white/20 text-white'
														: 'bg-primary/10 text-primary'
												}`}
											>
												{badge}
											</span>
										)}
									</div>

									<VscChevronRight
										className={`text-xs shrink-0 transition-transform ${
											isActive
												? 'translate-x-0.5 opacity-100'
												: 'opacity-40 group-hover/item:opacity-80 group-hover/item:translate-x-0.5'
										}`}
									/>
								</div>
							)
						})}
					</div>

					{/* RIGHT CANVAS: Subgroups Grid & Promo Banner */}
					<div className="flex-1 p-6 overflow-y-auto bg-background flex flex-col justify-between gap-6">
						{activeItem && (
							<div className="flex-1 flex flex-col gap-6">
								{/* Active Category Header Bar */}
								<div className="flex items-center justify-between border-b border-stroke/15 pb-3">
									<div className="flex items-center gap-2.5">
										<h3 className="text-base font-bold text-foreground">
											{getItemLabel(activeItem)}
										</h3>
										{activeItem.badge && (
											<span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
												{activeItem.badge}
											</span>
										)}
									</div>

									{/* Direct link to view all in category */}
									{activeItem.link && (activeItem.link.internal || activeItem.link.external) && (
										<SanityLink
											link={activeItem.link as SanityLinkType}
											className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 group/all"
										>
											<span>Xem tất cả sản phẩm</span>
											<VscChevronRight className="text-xs group-hover/all:translate-x-0.5 transition-transform" />
										</SanityLink>
									)}
								</div>

								{/* Main Content: Subgroups Grid (Trái) & Optional Promo Banner (Phải) */}
								<div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
									{/* Subgroup Link Lists */}
									<div className="flex-1 w-full">
										{activeItem._type === 'megamenu' && Array.isArray(activeItem.items) && activeItem.items.length > 0 ? (
											<div
												className={`grid gap-6 ${
													activeItem.banner?.image?.asset
														? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
														: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
												}`}
											>
												{activeItem.items.map((subGroup: any, sIdx: number) => (
													<div key={subGroup._key || `sub-${sIdx}`} className="flex flex-col gap-2.5">
														<div className="font-bold text-sm text-foreground tracking-wide border-b border-stroke/15 pb-1">
															<SanityLink
																link={subGroup.link as unknown as SanityLinkType}
																className="hover:text-primary transition-colors inline-block"
															/>
														</div>

														<ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
															{subGroup.links?.map((subLink: any, lIdx: number) => (
																<li key={subLink._key || `link-${lIdx}`}>
																	<SanityLink
																		link={subLink as unknown as SanityLinkType}
																		className="hover:text-primary hover:translate-x-0.5 transition-all py-0.5 inline-block text-xs font-medium"
																	/>
																</li>
															))}
														</ul>
													</div>
												))}
											</div>
										) : activeItem._type === 'link.list' && Array.isArray(activeItem.links) && activeItem.links.length > 0 ? (
											<div
												className={`grid gap-4 ${
													activeItem.banner?.image?.asset
														? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
														: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
												}`}
											>
												{activeItem.links.map((linkItem: any, lIdx: number) => (
													<SanityLink
														key={linkItem._key || `link-${lIdx}`}
														link={linkItem as unknown as SanityLinkType}
														className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium text-foreground/90 hover:text-primary transition-colors flex items-center justify-between"
													>
														<span>{linkItem.label || linkItem.internal?.title}</span>
														<VscChevronRight className="text-xs opacity-40" />
													</SanityLink>
												))}
											</div>
										) : (
											<div className="py-8 text-center text-xs text-muted-foreground">
												Đang cập nhật danh mục con...
											</div>
										)}
									</div>

									{/* Promo Banner / Featured Card (Hiển thị bên PHẢI khi có cấu hình Banner ảnh) */}
									{activeItem.banner?.image?.asset && (
										<div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 rounded-2xl border border-stroke/20 bg-black/[0.02] dark:bg-white/[0.02] p-3.5 flex flex-col gap-3 overflow-hidden group/banner shadow-xs">
											<div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
												<Image
													src={urlFor(activeItem.banner.image).width(600).height(450).url()}
													alt={activeItem.banner.title || getItemLabel(activeItem)}
													fill
													className="object-cover group-hover/banner:scale-105 transition-transform duration-500"
												/>
											</div>

											{(activeItem.banner.title || activeItem.banner.subtitle) && (
												<div className="flex flex-col gap-0.5 pt-1">
													{activeItem.banner.title && (
														<span className="font-bold text-sm text-foreground line-clamp-1">
															{activeItem.banner.title}
														</span>
													)}
													{activeItem.banner.subtitle && (
														<span className="text-xs text-muted-foreground line-clamp-1">
															{activeItem.banner.subtitle}
														</span>
													)}
												</div>
											)}

											{activeItem.banner.link && (
												<SanityLink
													link={activeItem.banner.link as SanityLinkType}
													className="mt-1 inline-flex items-center justify-center py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
												>
													<span>{activeItem.banner.link.label || 'Khám phá ngay'}</span>
												</SanityLink>
											)}
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</HoverDetails>
	)
}
