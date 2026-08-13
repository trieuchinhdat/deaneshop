'use client'

import { useState } from 'react'
import { HiOutlinePhone } from 'react-icons/hi2'
import { IoIosSearch } from 'react-icons/io'
import { cn } from '@/lib/utils'
import type { Cta } from '@/sanity/types'
import CTAListHeader from '@/ui/cta-list-header'
import Logo from '@/ui/logo'
import CartDrawer from './cart-drawer'
import css from './header.module.css'
import MobileToggle from './mobile-toggle'
import SearchModal from './search-modal'
import Wrapper from './wrapper'

interface HeaderClientProps {
	site: any
	headerSettings: any
	navigation: React.ReactNode
	announcement: React.ReactNode
}

export default function HeaderClient({
	site,
	headerSettings,
	navigation,
	announcement,
}: HeaderClientProps) {
	const [isCartOpen, setIsCartOpen] = useState(false)
	const [isSearchOpen, setIsSearchOpen] = useState(false)

	// Layout Config Settings
	const desktopLayout =
		headerSettings?.desktopLayout ||
		(headerSettings?.layout === 'center' ? 'layout02' : 'layout01')
	const desktopSearchVariant = headerSettings?.desktopSearchVariant || 'input'

	const mobileLayout = headerSettings?.mobileLayout || 'layout01'
	const mobileLogoAlign = headerSettings?.mobileLogoAlign || 'center'
	const mobileSearchDisplay = headerSettings?.mobileSearchDisplay || 'bar'

	const showTopBar = headerSettings?.showTopBar ?? true
	const enableCartDrawer = headerSettings?.enableCartDrawer ?? true
	const enableSearchModal = headerSettings?.enableSearchModal ?? true

	const ctas = (headerSettings?.ctas || []) as Cta[]

	const handleOpenCart = enableCartDrawer
		? () => setIsCartOpen(true)
		: undefined
	const handleOpenSearch = enableSearchModal
		? () => setIsSearchOpen(true)
		: undefined

	return (
		<>
			{/* Top Bar Hotline & Announcement */}
			{showTopBar && (
				<div className="border-b border-white/10 bg-black/90 px-4 py-1.5 text-xs text-white">
					<div className="section flex flex-wrap items-center justify-between gap-2">
						{/* Hotline / Phone */}
						{headerSettings?.phoneContact && (
							<a
								href={`tel:${headerSettings.phoneContact.replace(/[^0-9+]/g, '')}`}
								className="flex items-center gap-1.5 font-medium opacity-90 transition-opacity hover:underline hover:opacity-100"
							>
								<HiOutlinePhone className="text-sm" />
								<span>{headerSettings.phoneContact}</span>
							</a>
						)}

						{/* Announcement Slot */}
						<div className="flex-1 text-center">{announcement}</div>
					</div>
				</div>
			)}

			{/* Main Header Bar */}
			<Wrapper
				behavior={headerSettings?.behavior || 'sticky'}
				styleVariant={headerSettings?.style || 'solid'}
				headerBackground={headerSettings?.headerBackground}
				headerText={headerSettings?.headerText}
				className="max-md:header-open:shadow-xl shadow-sm"
			>
				<div className="section flex flex-col gap-3 p-4">
					{/* ================= DESKTOP HEADER ================= */}

					{/* DESKTOP LAYOUT 01: 1 HÀNG (Logo - Menu - CTAs) */}
					{desktopLayout === 'layout01' && (
						<div className="hidden w-full items-center gap-x-6 md:grid md:grid-cols-[auto_1fr_auto]">
							<Logo site={site} className="max-w-[220px] has-[img]:h-[2.5lh]" />

							<div className="flex w-full items-center">{navigation}</div>

							<CTAListHeader
								ctas={ctas}
								onOpenCart={handleOpenCart}
								onOpenSearch={handleOpenSearch}
								mobileSearchDisplay={mobileSearchDisplay}
							/>
						</div>
					)}

					{/* DESKTOP LAYOUT 02: 2 HÀNG SUPERSTORE (Hàng 1: Logo - Box Search - CTAs | Hàng 2: Menu) */}
					{desktopLayout === 'layout02' && (
						<div className="hidden w-full gap-3 md:flex md:flex-col">
							{/* Hàng 1: Logo (Trái) - Box Search (Giữa) - CTAs (Phải) */}
							<div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-8">
								<Logo
									site={site}
									className="max-w-[220px] has-[img]:h-[2.5lh]"
								/>

								{/* Box Search Center */}
								<div className="mx-auto w-full max-w-lg">
									{desktopSearchVariant === 'input' ? (
										<form
											action="/search"
											method="GET"
											className="relative w-full"
										>
											<input
												type="search"
												name="q"
												placeholder="Tìm kiếm sản phẩm, thương hiệu..."
												className="text-foreground focus:ring-primary/40 border-stroke/15 w-full rounded-full border bg-black/5 px-4 py-2 pr-10 text-sm focus:ring-2 focus:outline-none dark:bg-white/10"
											/>
											<button
												type="submit"
												className="text-primary absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1.5 hover:opacity-80"
											>
												<IoIosSearch className="text-xl" />
											</button>
										</form>
									) : (
										<button
											type="button"
											onClick={handleOpenSearch}
											className="text-header-foreground/80 border-stroke/15 flex w-full cursor-pointer items-center gap-2.5 rounded-full border bg-black/5 px-4 py-2 text-sm transition-all hover:bg-black/10 dark:bg-white/10"
										>
											<IoIosSearch className="text-primary text-lg" />
											<span className="grow truncate text-left">
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

							{/* Hàng 2: Navigation Menu */}
							<div className="border-stroke/15 flex w-full items-center justify-center border-t pt-2.5">
								{navigation}
							</div>
						</div>
					)}

					{/* ================= MOBILE HEADER ================= */}

					{/* MOBILE LAYOUT 01 (Classic): [Menu Toggle] - [Logo (Left/Center)] - [Cart/CTAs] */}
					{mobileLayout === 'layout01' && (
						<div className="flex w-full items-center justify-between gap-3 has-[img]:h-[2lh] md:hidden">
							{mobileLogoAlign === 'left' ? (
								<div className="flex items-center gap-2">
									<MobileToggle />
									<Logo
										site={site}
										className="max-w-[200px] text-left has-[img]:-my-2 has-[img]:h-[2lh]"
									/>
								</div>
							) : (
								<>
									<MobileToggle />
									<Logo
										site={site}
										className="max-w-[200px] grow text-center has-[img]:-my-2 has-[img]:h-[2lh]"
									/>
								</>
							)}

							<CTAListHeader
								ctas={ctas}
								onOpenCart={handleOpenCart}
								onOpenSearch={handleOpenSearch}
								mobileSearchDisplay={mobileSearchDisplay}
							/>
						</div>
					)}

					{/* MOBILE LAYOUT 02 (Thumb-friendly): [Logo (Left)] - [Cart/CTAs] - [Menu Toggle] */}
					{mobileLayout === 'layout02' && (
						<div className="flex w-full items-center justify-between gap-3 has-[img]:h-[2lh] md:hidden">
							<Logo
								site={site}
								className="max-w-[200px] text-left has-[img]:-my-2 has-[img]:h-[2lh]"
							/>

							<div className="flex items-center gap-2">
								<CTAListHeader
									ctas={ctas}
									onOpenCart={handleOpenCart}
									onOpenSearch={handleOpenSearch}
									mobileSearchDisplay={mobileSearchDisplay}
								/>
								<MobileToggle />
							</div>
						</div>
					)}

					{/* MOBILE FULL-WIDTH SEARCH BAR (Hiển thị khi mobileSearchDisplay === 'bar') */}
					{mobileSearchDisplay === 'bar' && enableSearchModal && (
						<div className="w-full pt-1 pb-0.5 md:hidden">
							<button
								type="button"
								onClick={handleOpenSearch}
								className="text-header-foreground/80 border-stroke/10 flex w-full cursor-pointer items-center gap-2.5 rounded-full border bg-black/5 px-3.5 py-2 text-xs font-medium shadow-xs transition-all hover:bg-black/10 active:scale-[0.99] dark:bg-white/10"
							>
								<IoIosSearch className="text-primary text-base opacity-90" />
								<span className="grow truncate text-left">
									Tìm kiếm sản phẩm, thương hiệu...
								</span>
							</button>
						</div>
					)}

					{/* MOBILE NAVIGATION DRAWER CONTAINER */}
					<div className="md:hidden">{navigation}</div>
				</div>
			</Wrapper>

			{/* Interactive Drawers & Modals */}
			{enableCartDrawer && (
				<CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
			)}
			{enableSearchModal && (
				<SearchModal
					isOpen={isSearchOpen}
					onClose={() => setIsSearchOpen(false)}
				/>
			)}
		</>
	)
}
