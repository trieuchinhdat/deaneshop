'use client'

import { stegaClean } from 'next-sanity'
import { useEffect, useState } from 'react'
import { HiOutlineShoppingBag } from 'react-icons/hi2' // Icon Cart (hoặc dùng icon bạn thích)
import { IoIosSearch } from 'react-icons/io'
import { cn } from '@/lib/utils'
import type { Cta } from '@/sanity/types'
import { useCartStore } from '@/store/use-cart-store'
import SanityLink, { type SanityLinkType } from './sanity-link'

export default function CtaList({
	ctas,
	className,
}: {
	ctas?: (Cta & { _key?: string })[]
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
				'flex flex-wrap items-center gap-x-[.5em] gap-y-[.25em]',
				className,
			)}
		>
			{ctas.map((cta) => {
				const linkData = cta.link as SanityLinkType
				const labelClean = linkData?.label?.toLowerCase().trim() || ''

				// 1. Xác định loại nút
				const isCart = labelClean === 'giỏ hàng' || labelClean === 'cart'
				const isSearch = labelClean === 'tìm kiếm' || labelClean === 'search'

				// 2. Nội dung hiển thị mặc định (cho các nút thường)
				let content: React.ReactNode = linkData.label

				// 3. Xử lý riêng cho Cart & Search (Responsive)
				if (isCart || isSearch) {
					content = (
						<span className="flex items-center justify-center">
							{/* --- HIỂN THỊ ICON --- */}
							<span className="relative text-xl">
								{isSearch && <IoIosSearch />}
								{isCart && <HiOutlineShoppingBag />}

								{/* Badge số lượng cho Cart  */}
								{isCart && mounted && totalQuantity > 0 && (
									<span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
										{totalQuantity > 9 ? '9+' : totalQuantity}
									</span>
								)}
							</span>
						</span>
					)
				}

				return (
					<SanityLink
						link={linkData}
						className={cn(stegaClean(cta.style), 'p-2')}
						key={cta._key}
					>
						{/* Truyền content vào children để override label mặc định */}
						{content}
					</SanityLink>
				)
			})}
		</div>
	)
}
