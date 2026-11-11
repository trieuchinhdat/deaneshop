'use client'

import { usePathname } from 'next/navigation'
import { stegaClean } from 'next-sanity'
import { useEffect, useState } from 'react'
import {
	HiOutlineDocumentText,
	HiOutlineShoppingBag,
	HiOutlineShoppingCart,
	HiOutlineUser,
} from 'react-icons/hi2'
import { IoIosSearch } from 'react-icons/io'
import { cn } from '@/lib/utils'
import type { Cta } from '@/sanity/types'
import { useCartStore } from '@/store/use-cart-store'
import SanityLink, { type SanityLinkType } from './sanity-link'

type ExtendedCta = Cta & {
	_key?: string
	iconType?: string
	actionType?: string
}

export default function CtaList({
	ctas,
	showSearch = true,
	showCart = true,
	showAccount = false,
	cartIconType = 'rfq',
	highlightCta,
	className,
	onOpenCart,
	onOpenSearch,
	mobileSearchDisplay = 'icon',
}: {
	ctas?: ExtendedCta[]
	showSearch?: boolean
	showCart?: boolean
	showAccount?: boolean
	cartIconType?: 'rfq' | 'bag' | 'cart' | string
	highlightCta?: any
	className?: string
	onOpenCart?: () => void
	onOpenSearch?: () => void
	mobileSearchDisplay?: 'bar' | 'icon'
} & React.ComponentProps<'div'>) {
	const pathname = usePathname()
	const [mounted, setMounted] = useState(false)
	const items = useCartStore((state) => state.items)
	const totalQuantity = items.reduce((total, item) => total + item.quantity, 0)

	useEffect(() => {
		setMounted(true)
	}, [])

	const cleanCartIconType = stegaClean(cartIconType) || 'rfq'

	const cartAriaLabel =
		cleanCartIconType === 'bag'
			? 'Shopping Bag'
			: cleanCartIconType === 'cart'
				? 'Shopping Cart'
				: 'Wholesale Quote List (RFQ)'

	const baseBtnClass =
		'p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-header-foreground cursor-pointer select-none'

	return (
		<div className={cn('flex flex-wrap items-center gap-1 sm:gap-1.5', className)}>
			{/* 1. Quick Search Icon Trigger */}
			{showSearch && onOpenSearch && (
				<button
					type="button"
					onClick={onOpenSearch}
					className={cn(
						baseBtnClass,
						mobileSearchDisplay === 'bar' && 'max-md:hidden'
					)}
					aria-label="Search"
					title="Search"
				>
					<span className="relative text-xl flex items-center justify-center">
						<IoIosSearch />
					</span>
				</button>
			)}

			{/* 2. User Account Icon */}
			{showAccount && (
				<a
					href="/account"
					className={cn(baseBtnClass, 'max-md:hidden')}
					aria-label="Customer Account / Sign In"
					title="Customer Account / Sign In"
				>
					<span className="relative text-xl flex items-center justify-center">
						<HiOutlineUser />
					</span>
				</a>
			)}

			{/* 3. Cart / Wholesale RFQ Quote List Drawer Trigger with Real-Time Badge */}
			{showCart && (
				<button
					type="button"
					onClick={onOpenCart}
					className={baseBtnClass}
					aria-label={cartAriaLabel}
					title={cartAriaLabel}
				>
					<span className="relative text-xl flex items-center justify-center">
						{cleanCartIconType === 'bag' ? (
							<HiOutlineShoppingBag className="text-2xl" />
						) : cleanCartIconType === 'cart' ? (
							<HiOutlineShoppingCart className="text-2xl" />
						) : (
							<HiOutlineDocumentText className="text-2xl" />
						)}
						{mounted && (
							<span
								className={cn(
									'absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-xs transition-all duration-300',
									totalQuantity > 0 ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
								)}
							>
								{totalQuantity > 9 ? '9+' : totalQuantity}
							</span>
						)}
					</span>
				</button>
			)}

			{/* 4. Optional Highlight Action Button (Desktop Only) */}
			{highlightCta?.link && (
				<div className="hidden lg:flex items-center ml-1">
					<SanityLink
						link={highlightCta.link as SanityLinkType}
						className={cn(
							highlightCta.style
								? stegaClean(highlightCta.style)
								: 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs',
							'px-3.5 py-1.5 rounded-xl text-xs transition-all active:scale-95 inline-flex items-center justify-center min-h-[36px]'
						)}
					>
						<span>{highlightCta.link.label || 'Explore'}</span>
					</SanityLink>
				</div>
			)}

			{/* 5. Legacy CTAs Fallback (if any remaining configured) */}
			{ctas &&
				ctas.map((cta, index) => {
					const linkData = cta.link as SanityLinkType
					const labelClean = linkData?.label?.toLowerCase().trim() || ''
					const configuredIcon = cta.iconType || 'auto'

					// Skip items already handled by primary utility toggles
					if (
						configuredIcon === 'cart' ||
						configuredIcon === 'search' ||
						labelClean === 'cart' ||
						labelClean === 'search'
					) {
						return null
					}

					const ctaKey = cta._key || `cta-legacy-${index}`
					const customBtnClass = cn(
						stegaClean(cta.style),
						'p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-header-foreground cursor-pointer select-none text-xs font-semibold'
					)

					return (
						<SanityLink
							link={linkData}
							className={customBtnClass}
							key={ctaKey}
							aria-label={linkData?.label}
						>
							{linkData?.label}
						</SanityLink>
					)
				})}
		</div>
	)
}


