'use client'

import { stegaClean } from 'next-sanity'
import { useEffect, useState } from 'react'
import { HiOutlineHeart, HiOutlinePhone, HiOutlineShoppingBag, HiOutlineUser } from 'react-icons/hi2'
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
	className,
	onOpenCart,
	onOpenSearch,
	mobileSearchDisplay = 'bar',
}: {
	ctas?: ExtendedCta[]
	className?: string
	onOpenCart?: () => void
	onOpenSearch?: () => void
	mobileSearchDisplay?: 'bar' | 'icon'
} & React.ComponentProps<'div'>) {
	const [mounted, setMounted] = useState(false)
	const items = useCartStore((state) => state.items)
	const totalQuantity = items.reduce((total, item) => total + item.quantity, 0)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!ctas?.length) return null

	return (
		<div
			className={cn(
				'flex flex-wrap items-center gap-1 sm:gap-1.5',
				className,
			)}
		>
			{ctas.map((cta, index) => {
				const linkData = cta.link as SanityLinkType
				const labelClean = linkData?.label?.toLowerCase().trim() || ''
				const configuredIcon = cta.iconType || 'auto'
				const actionType = cta.actionType || 'link'

				// Determine actual icon type with fallback
				let effectiveIcon = configuredIcon
				if (configuredIcon === 'auto') {
					if (labelClean === 'giỏ hàng' || labelClean === 'cart') {
						effectiveIcon = 'cart'
					} else if (labelClean === 'tìm kiếm' || labelClean === 'search') {
						effectiveIcon = 'search'
					} else if (labelClean === 'tài khoản' || labelClean === 'account' || labelClean === 'user') {
						effectiveIcon = 'user'
					} else if (labelClean === 'yêu thích' || labelClean === 'wishlist') {
						effectiveIcon = 'wishlist'
					} else if (labelClean === 'điện thoại' || labelClean === 'phone' || labelClean === 'hotline') {
						effectiveIcon = 'phone'
					} else {
						effectiveIcon = 'none'
					}
				}

				// Check if item triggers drawer/modal
				const shouldOpenCart =
					onOpenCart && (effectiveIcon === 'cart' || actionType === 'cart-drawer')
				const shouldOpenSearch =
					onOpenSearch && (effectiveIcon === 'search' || actionType === 'search-modal')

				// Render icon content
				let content: React.ReactNode = linkData?.label

				if (effectiveIcon !== 'none') {
					content = (
						<span className="flex items-center justify-center" title={linkData?.label}>
							<span className="relative text-xl flex items-center justify-center">
								{effectiveIcon === 'search' && <IoIosSearch />}
								{effectiveIcon === 'cart' && <HiOutlineShoppingBag />}
								{effectiveIcon === 'user' && <HiOutlineUser />}
								{effectiveIcon === 'wishlist' && <HiOutlineHeart />}
								{effectiveIcon === 'phone' && <HiOutlinePhone />}

								{/* Badge số lượng cho Cart với smooth transition */}
								{effectiveIcon === 'cart' && mounted && (
									<span
										className={cn(
											'absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs transition-all duration-300',
											totalQuantity > 0 ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
										)}
									>
										{totalQuantity > 9 ? '9+' : totalQuantity}
									</span>
								)}
							</span>
						</span>
					)
				}

				const isMobileHiddenIcon =
					effectiveIcon === 'user' ||
					(effectiveIcon === 'search' && mobileSearchDisplay !== 'icon')

				const baseBtnClass = cn(
					stegaClean(cta.style),
					'p-2 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-header-foreground cursor-pointer',
					isMobileHiddenIcon && 'max-md:hidden',
				)

				const ctaKey = cta._key || `cta-${index}`

				if (shouldOpenCart) {
					return (
						<button
							key={ctaKey}
							type="button"
							onClick={onOpenCart}
							className={baseBtnClass}
							aria-label={linkData?.label || 'Giỏ hàng'}
							title={linkData?.label || 'Giỏ hàng'}
						>
							{content}
						</button>
					)
				}

				if (shouldOpenSearch) {
					return (
						<button
							key={ctaKey}
							type="button"
							onClick={onOpenSearch}
							className={baseBtnClass}
							aria-label={linkData?.label || 'Tìm kiếm'}
							title={linkData?.label || 'Tìm kiếm'}
						>
							{content}
						</button>
					)
				}

				return (
					<SanityLink
						link={linkData}
						className={baseBtnClass}
						key={ctaKey}
						aria-label={linkData?.label}
					>
						{content}
					</SanityLink>
				)
			})}
		</div>
	)
}

