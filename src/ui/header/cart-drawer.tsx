'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { HiOutlineShoppingBag, HiOutlineTrash, HiXMark } from 'react-icons/hi2'
import { ROUTES } from '@/lib/env'
import { formatVND } from '@/lib/utils'
import { useCartStore } from '@/store/use-cart-store'
import ResponsiveImage from '../responsiveImage'

interface CartDrawerProps {
	isOpen: boolean
	onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
	const [mounted, setMounted] = useState(false)
	const items = useCartStore((state) => state.items)
	const removeItem = useCartStore((state) => state.removeItem)
	const updateQuantity = useCartStore((state) => state.updateQuantity)
	const totalPrice = useCartStore((state) => state.totalPrice)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	if (!mounted || !isOpen) return null

	const total = totalPrice()

	return (
		<div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
				onClick={onClose}
			/>

			<div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
				<div className="w-screen max-w-md bg-background text-foreground shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out">
					{/* Header */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-stroke/20">
						<div className="flex items-center gap-2">
							<HiOutlineShoppingBag className="text-xl text-primary" />
							<h2 className="text-lg font-bold">Giỏ hàng của bạn ({items.length})</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
							aria-label="Đóng giỏ hàng"
						>
							<HiXMark className="text-xl" />
						</button>
					</div>

					{/* Cart Items List */}
					<div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-stroke/15">
						{items.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-center py-12">
								<HiOutlineShoppingBag className="text-5xl opacity-30 mb-3" />
								<p className="text-base font-medium opacity-70">Giỏ hàng của bạn đang trống</p>
								<button
									type="button"
									onClick={onClose}
									className="mt-4 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
								>
									Khám phá sản phẩm
								</button>
							</div>
						) : (
							items.map((item) => (
								<div key={item.id} className="py-4 flex gap-4 items-center">
									{/* Item Image */}
									<div className="w-16 h-16 rounded-lg overflow-hidden border border-stroke/20 shrink-0 relative bg-black/5">
										{item.image ? (
											<ResponsiveImage
												image={item.image}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-xs opacity-40">
												No image
											</div>
										)}
									</div>

									{/* Item Details */}
									<div className="flex-1 min-w-0">
										<h3 className="text-sm font-semibold truncate hover:text-primary">
											<Link href={`/${ROUTES.products}/${item.slug || ''}`} onClick={onClose}>
												{item.title}
											</Link>
										</h3>

										{item.variantTitle && (
											<p className="text-xs text-muted-foreground mt-0.5">
												Phân loại: {item.variantTitle}
											</p>
										)}

										<div className="flex items-center justify-between mt-2">
											{/* Quantity controls */}
											<div className="flex items-center border border-stroke/30 rounded-md overflow-hidden">
												<button
													type="button"
													className="px-2 py-0.5 text-xs hover:bg-black/5 dark:hover:bg-white/10"
													onClick={() => updateQuantity(item.id, item.quantity - 1)}
												>
													-
												</button>
												<span className="px-2 text-xs font-semibold">{item.quantity}</span>
												<button
													type="button"
													className="px-2 py-0.5 text-xs hover:bg-black/5 dark:hover:bg-white/10"
													onClick={() => updateQuantity(item.id, item.quantity + 1)}
												>
													+
												</button>
											</div>

											{/* Price */}
											<div className="text-right">
												<span className="text-sm font-bold text-primary">
													{formatVND(item.price * item.quantity)}
												</span>
											</div>
										</div>
									</div>

									{/* Remove button */}
									<button
										type="button"
										onClick={() => removeItem(item.id)}
										className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
										title="Xóa khỏi giỏ hàng"
									>
										<HiOutlineTrash className="text-base" />
									</button>
								</div>
							))
						)}
					</div>

					{/* Footer Checkout */}
					{items.length > 0 && (
						<div className="p-6 border-t border-stroke/20 bg-background">
							<div className="flex justify-between items-center mb-4">
								<span className="text-sm font-medium opacity-80">Tổng tiền tạm tính:</span>
								<span className="text-lg font-extrabold text-primary">
									{formatVND(total)}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<Link
									href={`/${ROUTES.checkout}`}
									onClick={onClose}
									className="w-full text-center py-2.5 px-4 rounded-lg border border-stroke/40 font-semibold text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
								>
									Xem giỏ hàng
								</Link>
								<Link
									href={`/${ROUTES.checkout}`}
									onClick={onClose}
									className="w-full text-center py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-md"
								>
									Thanh toán
								</Link>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

