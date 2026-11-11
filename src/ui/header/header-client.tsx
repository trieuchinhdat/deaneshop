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

	// Global event listener to open cart drawer from anywhere (e.g. Volume Pricing, PDP)
	useEffect(() => {
		const handleOpenCart = () => setIsCartOpen(true)
		window.addEventListener('cart:open', handleOpenCart)
		return () => window.removeEventListener('cart:open', handleOpenCart)
	}, [])

	// Layout Config Settings
	const desktopLayout =
		stegaClean(headerSettings?.desktopLayout) ||
		(stegaClean(headerSettings?.layout) === 'center' ? 'layout02' : 'layout01')
	const desktopMenuAlign = stegaClean(headerSettings?.desktopMenuAlign) || 'center'
	const desktopSearchVariant = stegaClean(headerSettings?.desktopSearchVariant) || 'input'

	const mobileLayout = stegaClean(headerSettings?.mobileLayout) || 'layout01'
	const mobileLogoAlign = stegaClean(headerSettings?.mobileLogoAlign) || 'center'
	const mobileSearchDisplay = stegaClean(headerSettings?.mobileSearchDisplay) || 'icon'

	// Dynamic Padding & Logo Heights
	const headerPaddingDesktop = headerSettings?.headerPaddingDesktop || 'default'
	const headerPaddingMobile = headerSettings?.headerPaddingMobile || 'default'
	const logoHeightDesktop = headerSettings?.logoHeightDesktop ?? 40
	const logoHeightMobile = headerSettings?.logoHeightMobile ?? 32
	const enableScrolledEffect = headerSettings?.enableScrolledEffect ?? true
	const transparentOnHome = headerSettings?.transparentOnHome ?? false
	const headerThemeStyle = headerSettings?.headerThemeStyle || 'default'
	const topbarSticky = headerSettings?.topbarSticky ?? false

	// Clean Color Scheme Overrides from Sanity Stega encoding
	const cleanHeaderBg = headerSettings?.headerBackground
		? stegaClean(headerSettings.headerBackground).trim()
		: undefined
	const cleanHeaderText = headerSettings?.headerText
		? stegaClean(headerSettings.headerText).trim()
		: undefined

	const showTopBar = headerSettings?.showTopBar ?? true

	// Utility Toggles & Action Controls
	const showSearch = headerSettings?.showSearch ?? true
	const showCart = headerSettings?.showCart ?? true
	const showAccount = headerSettings?.showAccount ?? false
	const cartIconType = headerSettings?.cartIconType || 'rfq'
	const highlightCta = headerSettings?.highlightCta
	const mobileDrawerFooterLinks = headerSettings?.mobileDrawerFooterLinks
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
			: headerPaddingDesktop === 'spacious'
				? 'md:py-5'
				: 'md:py-3.5'

	const mobilePaddingClass =
		headerPaddingMobile === 'compact'
			? 'py-2'
			: headerPaddingMobile === 'comfortable'
				? 'py-3.5'
				: 'py-2.5'

	const row2AlignClass =
		desktopMenuAlign === 'left'
			? 'justify-start'
			: desktopMenuAlign === 'right'
				? 'justify-end'
				: 'justify-center'

	return (
		<>
			{/* Main Header Bar (wraps Topbar Announcement inside landmark for accurate height calculation) */}
			<Wrapper
				behavior={headerSettings?.behavior || 'sticky'}
				styleVariant={headerSettings?.style || 'solid'}
				headerThemeStyle={headerThemeStyle}
				headerBackground={cleanHeaderBg}
				headerText={cleanHeaderText}
				enableScrolledEffect={enableScrolledEffect}
				transparentOnHome={transparentOnHome}
				topbarSticky={topbarSticky}
				topBar={
					showTopBar ? (
						<Announcement
							key="topbar-announcement"
							announcements={headerSettings?.announcements}
							allowDismiss={headerSettings?.allowDismiss ?? true}
							autoPlayInterval={headerSettings?.autoPlayInterval ?? 4}
						/>
					) : null
				}
				className="max-md:header-open:shadow-xl"
			>
				<div
					className={cn(
						'container-max flex flex-col gap-2.5 sm:gap-3 max-sm:px-3',
						mobilePaddingClass,
						desktopPaddingClass
					)}
				>
					{/* ================= DESKTOP HEADER ================= */}

					{/* DESKTOP LAYOUT 01: SINGLE ROW DTC STANDARD (Logo - Navigation - Utilities) */}
					{desktopLayout === 'layout01' && (
						<div className="hidden w-full items-center gap-x-6 lg:gap-x-8 md:grid md:grid-cols-[auto_1fr_auto]">
							<Logo
								site={site}
								logoHeightDesktop={logoHeightDesktop}
								logoHeightMobile={logoHeightMobile}
								className="max-w-[220px]"
							/>

							<div className="flex w-full items-center">{navigation}</div>

							<CTAListHeader
								ctas={ctas}
								showSearch={showSearch}
								showCart={showCart}
								showAccount={showAccount}
								cartIconType={cartIconType}
								highlightCta={highlightCta}
								onOpenCart={handleOpenCart}
								onOpenSearch={handleOpenSearch}
								mobileSearchDisplay={mobileSearchDisplay}
							/>
						</div>
					)}

					{/* DESKTOP LAYOUT 02: TWO-TIER (Row 1: Logo - Search Box - Utilities | Row 2: Navigation) */}
					{desktopLayout === 'layout02' && (
						<div className="hidden w-full gap-3 md:flex md:flex-col">
							{/* Row 1: Logo (Left) - Search Box (Center) - Utilities (Right) */}
							<div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-6 lg:gap-x-8 relative">
								<Logo
									site={site}
									logoHeightDesktop={logoHeightDesktop}
									logoHeightMobile={logoHeightMobile}
									className="max-w-[200px]"
								/>

								{/* Box Search Center */}
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
												placeholder="Search products, collections, brands..."
												className="w-full rounded-full border border-stroke/20 bg-white text-gray-900 placeholder:text-gray-400 px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all shadow-xs"
											/>
											<button
												type="submit"
												className="text-primary absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1.5 hover:opacity-80 transition-opacity"
												aria-label="Search"
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
												Search products, collections, brands...
											</span>
										</button>
									)}
								</div>

								<CTAListHeader
									ctas={ctas}
									showSearch={showSearch}
									showCart={showCart}
									showAccount={showAccount}
									cartIconType={cartIconType}
									highlightCta={highlightCta}
									onOpenCart={handleOpenCart}
									onOpenSearch={handleOpenSearch}
									mobileSearchDisplay={mobileSearchDisplay}
								/>
							</div>

							{/* Row 2: Navigation Menu with dynamic alignment */}
							<div className={cn('border-stroke/15 flex w-full items-center border-t pt-2.5', row2AlignClass)}>
								{navigation}
							</div>
						</div>
					)}

					{/* ================= MOBILE HEADER ================= */}

					{/* MOBILE LAYOUT 01: SINGLE ROW (Menu Toggle - Logo - Utilities) */}
					{mobileLayout === 'layout01' && (
						mobileLogoAlign === 'left' ? (
							<div className="flex w-full items-center justify-between gap-2.5 md:hidden">
								<div className="flex items-center gap-2 min-w-0">
									<MobileToggle
										isOpen={isMobileNavOpen}
										onToggle={handleToggleMobileNav}
									/>
									<Logo
										site={site}
										logoHeightDesktop={logoHeightDesktop}
										logoHeightMobile={logoHeightMobile}
										className="max-w-[170px] text-left"
									/>
								</div>

								<CTAListHeader
									ctas={ctas}
									showSearch={showSearch}
									showCart={showCart}
									showAccount={showAccount}
									cartIconType={cartIconType}
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
										className="max-w-[170px] justify-center mx-auto text-center"
									/>
								</div>

								<div className="flex items-center justify-end">
									<CTAListHeader
										ctas={ctas}
										showSearch={showSearch}
										showCart={showCart}
										showAccount={showAccount}
										cartIconType={cartIconType}
										onOpenCart={handleOpenCart}
										onOpenSearch={handleOpenSearch}
										mobileSearchDisplay={mobileSearchDisplay}
									/>
								</div>
							</div>
						)
					)}

					{/* MOBILE LAYOUT 02 (Thumb-friendly): [Logo] - [Utilities] - [Menu Toggle] */}
					{mobileLayout === 'layout02' && (
						<div className="flex w-full items-center justify-between gap-2.5 md:hidden">
							<Logo
								site={site}
								logoHeightDesktop={logoHeightDesktop}
								logoHeightMobile={logoHeightMobile}
								className="max-w-[170px] text-left"
							/>

							<div className="flex items-center gap-1.5">
								<CTAListHeader
									ctas={ctas}
									showSearch={showSearch}
									showCart={showCart}
									showAccount={showAccount}
									cartIconType={cartIconType}
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

					{/* MOBILE FULL-WIDTH SEARCH BAR (Optional Row 2) */}
					{mobileSearchDisplay === 'bar' && showSearch && (
						<div className="w-full pt-1 pb-0.5 md:hidden">
							<button
								type="button"
								onClick={handleOpenSearch}
								className="border-stroke/20 flex w-full cursor-pointer items-center gap-2.5 rounded-full border bg-white text-gray-700 px-3.5 py-2 text-xs font-medium shadow-xs transition-all hover:bg-gray-50 active:scale-[0.99]"
							>
								<IoIosSearch className="text-primary text-base opacity-90 shrink-0" />
								<span className="grow truncate text-left text-gray-500">
									Search products, collections, brands...
								</span>
							</button>
						</div>
					)}
				</div>
			</Wrapper>

			{/* Floating Mobile Navigation Drawer (Single Source of Truth with Custom Override) */}
			<MobileNav
				isOpen={isMobileNavOpen}
				onClose={() => setIsMobileNavOpen(false)}
				items={headerSettings?.mobileMenu?.items || headerSettings?.menu?.items}
				footerLinks={mobileDrawerFooterLinks}
				highlightCta={highlightCta}
				showAccount={showAccount}
				onOpenSearch={showSearch ? handleOpenSearch : undefined}
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


