'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useMounted } from '@/hooks/useMounted'
import { ROUTES } from '@/lib/env'
import { formatVND, generateOrderId } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import { useCartStore } from '@/store/use-cart-store'
import CartVariantSelector from '@/ui/cart/cart-variant-selector'

const MySwal = withReactContent(Swal)

// Trích xuất an toàn URL hình ảnh cho sản phẩm tránh lỗi src=""
const getItemImageUrl = (image: any): string => {
	if (!image) return '/fallback-image.png'
	if (typeof image === 'string') return image.trim() || '/fallback-image.png'
	if (image?.asset?.url) return image.asset.url
	try {
		return urlFor(image).width(160).height(160).url()
	} catch {
		return '/fallback-image.png'
	}
}

type Props = {
	title?: string
	description?: string
	webhookUrl?: string
	submitText?: string
	showSummary?: boolean
	priceShipping?: number
}

export default function CartCheckoutClient({
	title,
	description,
	webhookUrl,
	submitText = 'Đặt hàng',
	priceShipping = 0,
}: Props) {
	const mounted = useMounted()
	const router = useRouter()
	const [isSubmitting, setIsSubmitting] = useState(false) // State quản lý loading overlay

	const { items, totalPrice, updateQuantity, removeItem, clearCart } =
		useCartStore()

	// Hàm xác nhận xóa sản phẩm khỏi giỏ hàng
	const handleRemoveItem = (id: string, title: string) => {
		MySwal.fire({
			title: 'Xóa sản phẩm?',
			text: `Bạn có chắc chắn muốn xóa "${title}" khỏi giỏ hàng?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#ef4444',
			cancelButtonColor: '#6b7280',
			confirmButtonText: 'Xóa sản phẩm',
			cancelButtonText: 'Hủy',
			customClass: {
				popup: 'rounded-2xl',
				confirmButton: 'rounded-lg px-5 py-2 font-medium cursor-pointer',
				cancelButton: 'rounded-lg px-5 py-2 font-medium cursor-pointer',
			},
		}).then((result) => {
			if (result.isConfirmed) {
				removeItem(id)
			}
		})
	}

	// Hàm xử lý gửi đơn hàng
	const handleCheckout = async (formData: any, resetForm: () => void) => {
		if (items.length === 0) return

		setIsSubmitting(true) // Bật lớp phủ mờ

		// Gom danh sách sản phẩm thành chuỗi (bao gồm mã SKU)
		const itemsString = items
			.map(
				(item) =>
					`${item.quantity}x ${item.title}${item.sku ? ` [SKU: ${item.sku}]` : ''}`,
			)
			.join('\n')

		const itemsTotal = totalPrice()
		const actualShipping = items.length > 0 ? priceShipping : 0
		const finalTotal = itemsTotal + actualShipping

		const orderData = {
			orderId: generateOrderId(),
			...formData, // Bao gồm: name, phone, email, address, note
			items: itemsString,
			itemsDetail: items.map((item) => ({
				id: item.id,
				title: item.title,
				sku: item.sku || item.id,
				price: item.price,
				quantity: item.quantity,
				image: getItemImageUrl(item.image),
			})),
			subtotal: itemsTotal,
			shippingFee: actualShipping,
			grandTotal: finalTotal,
			webhookUrl: webhookUrl?.trim() || '',
		}

		try {
			const res = await fetch('/api/orders/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(orderData),
			})

			const result = await res.json()

			if (!res.ok || !result.success) {
				throw new Error(result.message || 'Có lỗi khi khởi tạo đơn hàng')
			}

			// TỐI ƯU SIÊU NHANH: Xóa giỏ hàng ngầm & Chuyển hướng tức thì (0s delay) sang /order-success
			clearCart()
			resetForm()
			router.push(`/${ROUTES.orderSuccess}?orderId=${orderData.orderId}`)
		} catch (error: any) {
			setIsSubmitting(false)
			console.error('Error checkout:', error)
			MySwal.fire({
				title: 'Lỗi đặt hàng!',
				text: error?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.',
				icon: 'error',
				confirmButtonColor: '#d33',
				customClass: {
					popup: 'rounded-2xl',
				},
			})
		}
	}


	if (!mounted) return null

	return (
		<>
			{/* --- OVERLAY LOADING --- */}
			{isSubmitting && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
					<div className="flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-2xl">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
						<span className="text-sm font-medium text-gray-600">
							Đang xử lý...
						</span>
					</div>
				</div>
			)}

			<div className="rounded-xl bg-white p-2 lg:p-4">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
					{/* BÊN TRÁI: GIỎ HÀNG */}
					<div className="space-y-6 lg:col-span-3">
						{title && <h1 className="text-2xl font-bold">{title}</h1>}
						{description && <p className="text-gray-500">{description}</p>}

						<div className="space-y-4">
							{items.length === 0 ? (
								<div className="rounded-lg border bg-gray-50 py-10 text-center">
									<p className="text-gray-500 italic">
										Giỏ hàng của bạn đang trống.
									</p>
								</div>
							) : (
								items.map((item) => {
									const imgSrc = getItemImageUrl(item.image)

									return (
										<div
											key={item.id}
											className="flex items-center justify-between border-b pb-4 gap-2"
										>
											<div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
												<Link href={`${ROUTES.products}/${item.slug}`} className="shrink-0">
													<img
														src={imgSrc}
														alt={item.title ?? ''}
														width={80}
														height={80}
														className="h-14 w-14 rounded border object-cover lg:h-20 lg:w-20 bg-gray-50"
														onError={(e) => {
															;(e.currentTarget as HTMLImageElement).src =
																'/fallback-image.png'
														}}
														loading="lazy"
													/>
												</Link>
												<div className="pr-1 flex-1 min-w-0">
													<Link href={`${ROUTES.products}/${item.slug}`}>
														<p className="line-clamp-2 text-xs font-medium text-gray-900 lg:text-[16px] hover:text-primary transition-colors">
															{item.productTitle || item.title.replace(/\s*\([^)]*\)$/, '').trim()}
														</p>
													</Link>

													{/* Inline 1-Click Variant Selector */}
													<CartVariantSelector item={item} />

													<div className="flex items-center gap-2 mt-1">
														<p className="text-sm font-semibold text-red-600">
															{formatVND(item.price)}
														</p>
														{(item.compareAtPrice as number) > item.price && (
															<p className="text-xs text-gray-400 line-through">
																{formatVND(item.compareAtPrice as number)}
															</p>
														)}
													</div>
												</div>
											</div>

											<div className="flex items-center gap-1.5 lg:gap-3 shrink-0">
												<div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
													<button
														type="button"
														onClick={() =>
															updateQuantity(item.id, Math.max(1, item.quantity - 1))
														}
														className="flex h-8 w-7 cursor-pointer items-center justify-center font-bold text-gray-600 transition hover:bg-gray-200/80"
														aria-label="Giảm số lượng"
													>
														−
													</button>
													<input
														type="number"
														min={1}
														value={item.quantity}
														onChange={(e) => {
															const val = parseInt(e.target.value, 10)
															if (!isNaN(val)) {
																updateQuantity(item.id, Math.max(1, val))
															}
														}}
														onBlur={(e) => {
															const val = parseInt(e.target.value, 10)
															if (isNaN(val) || val < 1) {
																updateQuantity(item.id, 1)
															}
														}}
														className="h-8 w-8 text-center text-xs font-bold text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none lg:w-10 lg:text-sm"
													/>
													<button
														type="button"
														onClick={() =>
															updateQuantity(item.id, item.quantity + 1)
														}
														className="flex h-8 w-7 cursor-pointer items-center justify-center font-bold text-gray-600 transition hover:bg-gray-200/80"
														aria-label="Tăng số lượng"
													>
														+
													</button>
												</div>
												<button
													onClick={() => handleRemoveItem(item.id, item.title)}
													className="p-1 text-gray-400 transition-colors hover:text-red-500 cursor-pointer"
													title="Xóa sản phẩm"
												>
													✕
												</button>
											</div>
										</div>
									)
								})
							)}
						</div>
					</div>

					{/* BÊN PHẢI: FORM */}
					<div className="lg:col-span-2">
						<OrderForm
							itemsPrice={totalPrice()}
							priceShipping={priceShipping}
							submitText={submitText}
							onCheckout={handleCheckout}
							isCartEmpty={items.length === 0}
							isSubmitting={isSubmitting}
						/>
					</div>
				</div>
			</div>
		</>
	)
}

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENT: ORDER FORM                                                  */
/* -------------------------------------------------------------------------- */

type OrderFormProps = {
	itemsPrice: number
	priceShipping: number
	submitText: string
	onCheckout: (data: any, reset: () => void) => Promise<void>
	isCartEmpty: boolean
	isSubmitting: boolean
}

function OrderForm({
	itemsPrice,
	priceShipping,
	submitText,
	onCheckout,
	isCartEmpty,
	isSubmitting,
}: OrderFormProps) {
	const [form, setForm] = useState({
		name: '',
		phone: '',
		email: '',
		address: '',
		note: '',
	})

	const effectiveShipping = isCartEmpty ? 0 : priceShipping
	const finalTotal = itemsPrice + effectiveShipping

	const resetForm = () =>
		setForm({ name: '', phone: '', email: '', address: '', note: '' })

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (isCartEmpty || isSubmitting) return
		onCheckout(form, resetForm)
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="top-4 space-y-4 rounded-xl border bg-white p-6 shadow-sm lg:sticky"
		>
			<h2 className="border-b pb-3 text-xl font-semibold text-gray-800">
				Thông tin đơn hàng
			</h2>

			<div className="space-y-3">
				<input
					required
					type="text"
					placeholder="Tên *"
					className="w-full rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-black"
					value={form.name}
					onChange={(e) => setForm({ ...form, name: e.target.value })}
				/>
				<input
					required
					type="tel"
					placeholder="Số điện thoại *"
					className="w-full rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-black"
					value={form.phone}
					onChange={(e) => setForm({ ...form, phone: e.target.value })}
				/>
				<input
					type="email"
					placeholder="Email (tùy chọn)"
					className="w-full rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-black"
					value={form.email}
					onChange={(e) => setForm({ ...form, email: e.target.value })}
				/>
				<textarea
					required
					placeholder="Địa chỉ giao hàng chi tiết *"
					className="w-full rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-black"
					rows={3}
					value={form.address}
					onChange={(e) => setForm({ ...form, address: e.target.value })}
				/>
				<textarea
					placeholder="Ghi chú đơn hàng (tùy chọn)"
					className="w-full rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-black"
					rows={3}
					value={form.note}
					onChange={(e) => setForm({ ...form, note: e.target.value })}
				/>
			</div>

			<div className="space-y-3">
				<h2 className="border-b pb-3 text-xl font-semibold text-gray-800">
					Thông tin thanh toán
				</h2>
				<div className="flex items-center">
					<input
						checked
						readOnly
						type="radio"
						value="COD"
						className="mr-2 h-4 w-4 cursor-not-allowed"
					/>
					<span className="text-sm text-gray-600">
						Thanh toán khi nhận hàng (COD)
					</span>
				</div>
			</div>

			<div className="mt-2 space-y-2 border-t pt-4">
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-600">Tạm tính:</span>
					<span className="text-sm font-medium text-black">
						{formatVND(itemsPrice)}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-600">Phí vận chuyển:</span>
					<span className="text-sm font-medium text-black">
						{formatVND(effectiveShipping)}
					</span>
				</div>
			</div>

			<div className="fixed right-0 bottom-0 left-0 z-50 border-t border-[#f5f5f5] bg-white p-4 max-md:m-0 md:static md:z-0 md:border-0 md:bg-transparent md:p-0">
				<div className="mb-3 flex items-center justify-between md:mb-4">
					<span className="font-medium text-gray-600">Tổng cộng:</span>
					<span className="text-xl font-bold text-red-600">
						{formatVND(finalTotal)}
					</span>
				</div>

				<button
					disabled={isSubmitting || isCartEmpty}
					type="submit"
					className={`w-full rounded-none py-4 font-bold tracking-wider text-white uppercase transition-all md:rounded-lg ${
						isSubmitting || isCartEmpty
							? 'cursor-not-allowed bg-gray-300'
							: 'bg-black shadow-lg hover:bg-gray-900 active:scale-95'
					} `}
				>
					{isCartEmpty
						? 'Không có sản phẩm'
						: isSubmitting
							? 'Đang gửi...'
							: submitText}
				</button>
			</div>

			{isCartEmpty && (
				<p className="mt-2 text-center text-xs font-medium text-red-500">
					Vui lòng chọn sản phẩm trước khi thanh toán.
				</p>
			)}
		</form>
	)
}
