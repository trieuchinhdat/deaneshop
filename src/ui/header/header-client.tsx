'use client'

import { stegaClean } from 'next-sanity'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { IoIosSearch } from 'react-icons/io'
import { cn } from '@/lib/utils'
import type { Cta } from '@/sanity/types'
import CTAListHeader from '@/ui/cta-list-header'
import Logo from '@/ui/logo'
import Announcement from './announcement'
import CategoryDropdown from './category-dropdown'
import MobileNav from './mobile-nav'
import MobileToggle from './mobile-toggle'
import Wrapper from './wrapper'

// Lazy-load Drawers & Modals on-demand to reduce critical bundle size
const CartDrawer = dynamic(() => import('./cart-drawer'), {
	ssr: false,
})

const SearchModal = dynamic(() => import('./search-modal'), {
	ssr: false,
})

interface HeaderClientProps {
	site: any
	headerSettings: any
	navigation: React.ReactNode
}

export default function HeaderClient({
	site,
	headerSettings,
	navigation,
}: HeaderClientProps) {
	const router = useRouter()
	const pathname = usePathname()
	const [isCartOpen, setIsCartOpen] = useState(false)
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
	const [desktopSearchQuery, setDesktopSearchQuery] = useState('')

	// Auto-close drawers/menus on navigation
	useEffect(() => {
		setIsMobileNavOpen(false)
		setIsSearchOpen(false)
	}, [pathname])

	// Layout Config Settings
	const desktopLayout =
		stegaClean(headerSettings?.desktopLayout) ||
		(stegaClean(headerSettings?.layout) === 'center' ? 'layout02' : 'layout01')
	const desktopSearchVariant = stegaClean(headerSettings?.desktopSearchVariant) || 'input'

	const mobileLayout = stegaClean(headerSettings?.mobileLayout) || 'layout01'
	const mobileLogoAlign = stegaClean(headerSettings?.mobileLogoAlign) || 'center'
	const mobileSearchDisplay = stegaClean(headerSettings?.mobileSearchDisplay) || 'bar'

	// Dynamic Padding & Logo Heights
	const headerPaddingDesktop = headerSettings?.headerPaddingDesktop || 'default'
	const headerPaddingMobile = headerSettings?.headerPaddingMobile || 'default'
	const logoHeightDesktop = headerSettings?.logoHeightDesktop ?? 48
	const logoHeightMobile = headerSettings?.logoHeightMobile ?? 36
	const enableScrolledEffect = headerSettings?.enableScrolledEffect ?? true

	// Clean Color Scheme Overrides from Sanity Stega encoding
	const cleanHeaderBg = headerSettings?.headerBackground
		? stegaClean(headerSettings.headerBackground).trim()
		: undefined
	const cleanHeaderText = headerSettings?.headerText
		? stegaClean(headerSettings.headerText).trim()
		: undefined

	const showTopBar = headerSettings?.showTopBar ?? true

	// Category Menu Settings for Layout 02
	const showCategoryMenu = headerSettings?.showCategoryMenu ?? true
	const categoryButtonLabel = headerSettings?.categoryButtonLabel || 'Danh mục sản phẩm'
	const categoryButtonIcon = headerSettings?.categoryButtonIcon || 'grid'
	const categoryButtonStyle = headerSettings?.categoryButtonStyle || 'soft'
	const showDesktopRow2Navigation = headerSettings?.showDesktopRow2Navigation ?? true
	const categoryMenuItems = headerSettings?.categoryMenu?.items

	const ctas = (headerSettings?.ctas || []) as Cta[]

	const handleOpenCart = () => {
		setIsMobileNavOpen(false)
		setIsCartOpen(true)
	}
	const handleOpenSearch = () => {
		setIsMobileNavOpen(false)
		setIsSearchOpen(true)
	}
	const handleToggleMobileNav = () => {
		setIsMobileNavOpen((prev) => !prev)
	}

	// Responsive padding class mappings
	const desktopPaddingClass =
		headerPaddingDesktop === 'compact'
			? 'md:py-2.5'
			: headerPaddingDesktop === 'comfortable'
				? 'md:py-4'
				: 'md:py-3'

	const mobilePaddingClass =
		headerPaddingMobile === 'compact'
			? 'py-2'
			: headerPaddingMobile === 'comfortable'
				? 'py-3.5'
				: 'py-2.5'

	return (
		<>
			{/* Top Bar Announcement */}
			{showTopBar && (
				<Announcement
					key="topbar-announcement"
					announcements={headerSettings?.announcements}
					allowDismiss={headerSettings?.allowDismiss ?? true}
					autoPlayInterval={headerSettings?.autoPlayInterval ?? 4}
				/>
			)}

			{/* Main Header Bar */}
			<Wrapper
				behavior={headerSettings?.behavior || 'sticky'}
				styleVariant={headerSettings?.style || 'solid'}
				headerBackground={cleanHeaderBg}
				headerText={cleanHeaderText}
				enableScrolledEffect={enableScrolledEffect}
				className="max-md:header-open:shadow-xl"
			>

				<div
					className={cn(
						'section mx-auto relative flex flex-col gap-2.5 sm:gap-3 px-3 sm:px-4',
						mobilePaddingClass,
						desktopPaddingClass
					)}
				>
					{/* ================= DESKTOP HEADER ================= */}

					{/* DESKTOP LAYOUT 01: 1 HÀNG (Logo - Menu - CTAs) */}
					{desktopLayout === 'layout01' && (
						<div className="hidden w-full items-center gap-x-6 md:grid md:grid-cols-[auto_1fr_auto]">
							<Logo
								site={site}
								logoHeightDesktop={logoHeightDesktop}
								logoHeightMobile={logoHeightMobile}
								className="max-w-[240px]"
							/>

							<div className="flex w-full items-center">{navigation}</div>

							<CTAListHeader
								ctas={ctas}
								onOpenCart={handleOpenCart}
								onOpenSearch={handleOpenSearch}
								mobileSearchDisplay={mobileSearchDisplay}
							/>
						</div>
					)}

					{/* DESKTOP LAYOUT 02: 2 HÀNG SUPERSTORE (Hàng 1: Logo + Nút Danh mục - Box Search - CTAs | Hàng 2: Menu) */}
					{desktopLayout === 'layout02' && (
						<div className="hidden w-full gap-3 md:flex md:flex-col">
							{/* Hàng 1: Logo + Nút Danh mục (Trái) - Box Search (Giữa) - CTAs (Phải) */}
							<div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-6 lg:gap-x-8 relative">
								<div className="flex items-center gap-3 lg:gap-4">
									<Logo
										site={site}
										logoHeightDesktop={logoHeightDesktop}
										logoHeightMobile={logoHeightMobile}
										className="max-w-[200px]"
									/>

									{showCategoryMenu && categoryMenuItems && categoryMenuItems.length > 0 && (
										<CategoryDropdown
											items={categoryMenuItems}
											label={categoryButtonLabel}
											icon={categoryButtonIcon}
											buttonStyle={categoryButtonStyle}
										/>
									)}
								</div>

								{/* Box Search Center - Always White Background for Layout 2 */}
								<div className="mx-auto w-full max-w-lg">
									{desktopSearchVariant === 'input' ? (
										<form
											action="/search"
											method="GET"
											onSubmit={(e) => {
												e.preventDefault()
												const trimmed = desktopSearchQuery.trim()
												if (trimmed) {
													router.push(`/search?query=${encodeURIComponent(trimmed)}`)
												} else {
													router.push('/search')
												}
											}}
											className="relative w-full"
										>
											<input
												type="search"
												name="query"
												value={desktopSearchQuery}
												onChange={(e) => setDesktopSearchQuery(e.target.value)}
												placeholder="Tìm kiếm sản phẩm, thương hiệu..."
												className="w-full rounded-full border border-stroke/20 bg-white text-gray-900 placeholder:text-gray-400 px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all shadow-xs"
											/>
											<button
												type="submit"
												className="text-primary absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1.5 hover:opacity-80 transition-opacity"
												aria-label="Tìm kiếm"
											>
												<IoIosSearch className="text-xl" />
											</button>
										</form>
									) : (
										<button
											type="button"
											onClick={handleOpenSearch}
											className="flex w-full cursor-pointer items-center gap-2.5 rounded-full border border-stroke/20 bg-white text-gray-700 px-4 py-2 text-sm shadow-xs transition-all hover:bg-gray-50 active:scale-[0.99]"
										>
											<IoIosSearch className="text-primary text-lg" />
											<span className="grow truncate text-left text-gray-500">
												Tìm kiếm sản phẩm, thương hiệu...
											</span>
										</button>
									)}
								</div>


								<CTAListHeader
									ctas={ctas}
									onOpenCart={handleOpenCart}
									onOpenSearch={handleOpenSearch}
									mobileSearchDisplay={mobileSearchDisplay}
								/>
							</div>

							{/* Hàng 2: Navigation Menu (Chỉ hiển thị khi showDesktopRow2Navigation bật) */}
							{showDesktopRow2Navigation && (
								<div className="border-stroke/15 flex w-full items-center justify-center border-t pt-2.5">
									{navigation}
								</div>
							)}
						</div>
					)}

					{/* ================= MOBILE HEADER ================= */}

					{/* MOBILE LAYOUT 01 (Classic): [Menu Toggle] - [Logo (Left/Center)] - [Cart/CTAs] */}
					{mobileLayout === 'layout01' && (
						mobileLogoAlign === 'left' ? (
							<div className="flex w-full items-center justify-between gap-2.5 md:hidden">
								<div className="flex items-center gap-1.5 min-w-0">
									<MobileToggle
										isOpen={isMobileNavOpen}
										onToggle={handleToggleMobileNav}
									/>
									<Logo
										site={site}
										logoHeightDesktop={logoHeightDesktop}
										logoHeightMobile={logoHeightMobile}
										className="max-w-[180px] text-left"
									/>
								</div>

								<CTAListHeader
									ctas={ctas}
									onOpenCart={handleOpenCart}
									onOpenSearch={handleOpenSearch}
									mobileSearchDisplay={mobileSearchDisplay}
								/>
							</div>
						) : (
							<div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-1.5 md:hidden">
								<div className="flex items-center justify-start">
									<MobileToggle
										isOpen={isMobileNavOpen}
										onToggle={handleToggleMobileNav}
									/>
								</div>

								<div className="flex items-center justify-center text-center overflow-hidden">
									<Logo
										site={site}
										logoHeightDesktop={logoHeightDesktop}
										logoHeightMobile={logoHeightMobile}
										className="max-w-[180px] justify-center mx-auto text-center"
									/>
								</div>

								<div className="flex items-center justify-end">
									<CTAListHeader
										ctas={ctas}
										onOpenCart={handleOpenCart}
										onOpenSearch={handleOpenSearch}
										mobileSearchDisplay={mobileSearchDisplay}
									/>
								</div>
							</div>
						)
					)}

					{/* MOBILE LAYOUT 02 (Thumb-friendly): [Logo (Left)] - [Cart/CTAs] - [Menu Toggle] */}
					{mobileLayout === 'layout02' && (
						<div className="flex w-full items-center justify-between gap-2.5 md:hidden">
							<Logo
								site={site}
								logoHeightDesktop={logoHeightDesktop}
								logoHeightMobile={logoHeightMobile}
								className="max-w-[180px] text-left"
							/>

							<div className="flex items-center gap-1.5">
								<CTAListHeader
									ctas={ctas}
									onOpenCart={handleOpenCart}
									onOpenSearch={handleOpenSearch}
									mobileSearchDisplay={mobileSearchDisplay}
								/>
								<MobileToggle
									isOpen={isMobileNavOpen}
									onToggle={handleToggleMobileNav}
								/>
							</div>
						</div>
					)}

					{/* MOBILE FULL-WIDTH SEARCH BAR (Hiển thị khi mobileSearchDisplay === 'bar') - Always White Background */}
					{mobileSearchDisplay === 'bar' && (
						<div className="w-full pt-1 pb-0.5 md:hidden">
							<button
								type="button"
								onClick={handleOpenSearch}
								className="border-stroke/20 flex w-full cursor-pointer items-center gap-2.5 rounded-full border bg-white text-gray-700 px-3.5 py-2 text-xs font-medium shadow-xs transition-all hover:bg-gray-50 active:scale-[0.99]"
							>
								<IoIosSearch className="text-primary text-base opacity-90 shrink-0" />
								<span className="grow truncate text-left text-gray-500">
									Tìm kiếm sản phẩm, thương hiệu...
								</span>
							</button>
						</div>
					)}
				</div>
			</Wrapper>

			{/* Floating Mobile Navigation Drawer (Overlay, Full Height, Zero Layout Shift) */}
			<MobileNav
				isOpen={isMobileNavOpen}
				onClose={() => setIsMobileNavOpen(false)}
				items={headerSettings?.mobileMenu?.items || headerSettings?.menu?.items}
				ctas={ctas}
			/>

			{/* Interactive Drawers & Modals (Loaded dynamically on-demand) */}
			<CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
			{isSearchOpen && (
				<SearchModal
					isOpen={isSearchOpen}
					onClose={() => setIsSearchOpen(false)}
				/>
			)}
		</>
	)
}


