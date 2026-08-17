'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { HiOutlineShoppingBag, HiOutlineTrash, HiXMark } from 'react-icons/hi2'
import { ROUTES } from '@/lib/env'
import { cn, formatVND } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import { useCartStore } from '@/store/use-cart-store'
import CartVariantSelector from '@/ui/cart/cart-variant-selector'

interface CartDrawerProps {
	isOpen: boolean
	onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
	const [shouldRender, setShouldRender] = useState(false)
	const [isVisible, setIsVisible] = useState(false)

	const items = useCartStore((state) => state.items)
	const removeItem = useCartStore((state) => state.removeItem)
	const updateQuantity = useCartStore((state) => state.updateQuantity)
	const totalPrice = useCartStore((state) => state.totalPrice)

	// Điều khiển vòng đời mở / đóng để chạy animation slide trượt mượt mà
	useEffect(() => {
		let timer: NodeJS.Timeout
		if (isOpen) {
			setShouldRender(true)
			document.body.style.overflow = 'hidden'
			// 2 frames requestAnimationFrame để đảm bảo browser đã paint xong DOM trước khi kích hoạt CSS transition
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsVisible(true)
				})
			})
		} else {
			setIsVisible(false)
			document.body.style.overflow = ''
			timer = setTimeout(() => {
				setShouldRender(false)
			}, 300)
		}

		return () => {
			clearTimeout(timer)
			document.body.style.overflow = ''
		}
	}, [isOpen])

	// Hàm đóng mượt mà: kích hoạt trượt ra ngoài trước rồi mới báo cho cha
	const handleClose = () => {
		setIsVisible(false)
		setTimeout(() => {
			onClose()
		}, 300)
	}

	// Đóng giỏ hàng khi nhấn phím ESC
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				handleClose()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen])

	if (!shouldRender) return null

	const total = totalPrice()

	// Trích xuất an toàn URL hình ảnh cho sản phẩm
	const getItemImageUrl = (image: any): string => {
		if (!image) return '/fallback-image.png'
		if (typeof image === 'string') return image
		if (image?.asset?.url) return image.asset.url
		try {
			return urlFor(image).width(180).height(180).url()
		} catch {
			return '/fallback-image.png'
		}
	}

	return (
		<div
			className="fixed inset-0 z-[100] overflow-hidden"
			role="dialog"
			aria-modal="true"
		>
			{/* Backdrop Overlay với Fade Transition */}
			<div
				className={cn(
					'fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out',
					isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
				)}
				onClick={handleClose}
				aria-hidden="true"
			/>

			{/* Sliding Drawer Container */}
			<div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
				<div
					className={cn(
						'pointer-events-auto w-screen max-w-md bg-white text-gray-900 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out',
						isVisible ? 'translate-x-0' : 'translate-x-full',
					)}
				>
					{/* Header */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-stroke/20 bg-gray-50/50">
						<div className="flex items-center gap-2.5">
							<div className="p-2 rounded-lg bg-primary/10 text-primary">
								<HiOutlineShoppingBag className="text-xl" />
							</div>
							<div>
								<h2 className="text-base font-bold text-gray-900">
									Giỏ hàng của bạn
								</h2>
								<p className="text-xs text-gray-500">
									{items.length} sản phẩm
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={handleClose}
							className="size-11 flex items-center justify-center rounded-full text-gray-600 hover:text-gray-900 hover:bg-black/5 transition-colors cursor-pointer"
							aria-label="Đóng giỏ hàng"
						>
							<HiXMark className="text-xl" />
						</button>
					</div>

					<div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-stroke/15">
						{items.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-center py-16">
								<div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
									<HiOutlineShoppingBag className="text-3xl" />
								</div>
								<p className="text-base font-semibold text-gray-900 mb-1">
									Giỏ hàng trống
								</p>
								<p className="text-xs text-gray-500 max-w-[240px] mb-6">
									Hiện tại bạn chưa có sản phẩm nào trong giỏ hàng.
								</p>
								<button
									type="button"
									onClick={handleClose}
									className="py-2.5 px-6 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
								>
									Bắt đầu mua sắm
								</button>
							</div>
						) : (
							items.map((item) => {
								const imgSrc = getItemImageUrl(item.image)

								return (
									<div
										key={item.id}
										className="py-4 flex gap-3.5 items-center first:pt-0 last:pb-0"
									>
										<div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-stroke/30 shrink-0">
											<img
												src={imgSrc}
												alt={item.title}
												className="w-full h-full object-cover"
												onError={(e) => {
													;(e.currentTarget as HTMLImageElement).src =
														'/fallback-image.png'
												}}
												loading="lazy"
											/>
										</div>

										<div className="flex-1 min-w-0">
											<h3 className="text-sm font-semibold text-gray-900 truncate">
												{item.productTitle ||
													item.title.replace(/\s*\([^)]*\)$/, '').trim()}
											</h3>

											<CartVariantSelector item={item} />

											<div className="flex justify-between items-center mt-2.5">
												<div className="flex items-center border border-stroke/40 rounded-lg overflow-hidden bg-white shadow-2xs">
													<button
														type="button"
														className="size-8 flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
														onClick={() =>
															updateQuantity(item.id, item.quantity - 1)
														}
														aria-label="Giảm số lượng"
													>
														-
													</button>
													<span className="px-2.5 py-0.5 text-xs font-bold text-gray-900 min-w-[24px] text-center select-none">
														{item.quantity}
													</span>
													<button
														type="button"
														className="size-8 flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
														onClick={() =>
															updateQuantity(item.id, item.quantity + 1)
														}
														aria-label="Tăng số lượng"
													>
														+
													</button>
												</div>

												<div className="text-right">
													<span className="text-sm font-bold text-primary">
														{formatVND(item.price * item.quantity)}
													</span>
												</div>
											</div>
										</div>

										<button
											type="button"
											onClick={() => removeItem(item.id)}
											className="size-10 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer"
											title="Xóa khỏi giỏ hàng"
											aria-label="Xóa khỏi giỏ hàng"
										>
											<HiOutlineTrash className="text-lg" />
										</button>
									</div>
								)
							})
						)}
					</div>

					{items.length > 0 && (
						<div className="p-5 border-t border-stroke/20 bg-gray-50/50">
							<div className="flex justify-between items-center mb-4">
								<span className="text-sm font-medium text-gray-600">
									Tổng tiền tạm tính:
								</span>
								<span className="text-lg font-extrabold text-primary">
									{formatVND(total)}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<Link
									href={`/${ROUTES.checkout}`}
									onClick={handleClose}
									className="w-full text-center py-2.5 px-4 rounded-lg border border-stroke/40 bg-white font-semibold text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-2xs"
								>
									Xem giỏ hàng
								</Link>
								<Link
									href={`/${ROUTES.checkout}`}
									onClick={handleClose}
									className="w-full text-center py-2.5 px-4 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
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

