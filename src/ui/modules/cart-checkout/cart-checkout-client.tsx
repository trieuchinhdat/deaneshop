'use client'

import Link from 'next/link'
import { useState } from 'react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useMounted } from '@/hooks/useMounted'
import { ROUTES } from '@/lib/env'
import { formatVND, generateOrderId } from '@/lib/utils'
import { useCartStore } from '@/store/use-cart-store'

const MySwal = withReactContent(Swal)

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
	submitText = 'Place Order',
	priceShipping = 0,
}: Props) {
	const mounted = useMounted()
	const [isSubmitting, setIsSubmitting] = useState(false) // State quản lý loading overlay

	const { items, totalPrice, updateQuantity, removeItem, clearCart } =
		useCartStore()

	// Hàm xử lý gửi đơn hàng
	const handleCheckout = async (formData: any, resetForm: () => void) => {
		if (items.length === 0) return

		setIsSubmitting(true) // Bật lớp phủ mờ

		// Gom danh sách sản phẩm thành chuỗi
		const itemsString = items
			.map((item) => `${item.quantity}x ${item.title}`)
			.join('\n')

		const itemsTotal = totalPrice()
		// Nếu có sản phẩm mới tính ship
		const actualShipping = items.length > 0 ? priceShipping : 0
		const finalTotal = itemsTotal + actualShipping

		// Dữ liệu gửi đi (Đã bỏ paymentMethod)
		const orderData = {
			orderId: generateOrderId(),
			...formData, // Bao gồm: name, phone, email, address, note
			items: itemsString,
			total: formatVND(finalTotal),
			shipping: formatVND(actualShipping),
		}

		try {
			const GOOGLE_SHEET_URL = webhookUrl || ''

			await fetch(GOOGLE_SHEET_URL, {
				method: 'POST',
				mode: 'no-cors',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(orderData),
			})

			// Tắt overlay trước khi hiện thông báo
			setIsSubmitting(false)

			// Hiển thị thông báo thành công (Icon nhỏ tinh tế)
			MySwal.fire({
				icon: undefined, // Tắt icon mặc định
				title: (
					<div className="flex flex-col items-center gap-2">
						{/* Icon SVG Checkmark nhỏ */}
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={2}
								stroke="currentColor"
								className="h-6 w-6"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M4.5 12.75l6 6 9-13.5"
								/>
							</svg>
						</div>
						<span className="text-xl font-bold text-gray-800">
							Order Placed!
						</span>
					</div>
				),
				html: (
					<div className="mt-4 space-y-2 border-t pt-4 text-left text-sm text-gray-600">
						<div className="grid grid-cols-3 gap-2">
							<span className="font-semibold text-gray-900">Order ID:</span>
							<span className="col-span-2">{orderData.orderId}</span>
						</div>
						<div className="grid grid-cols-3 gap-2">
							<span className="font-semibold text-gray-900">Name:</span>
							<span className="col-span-2">{formData.name}</span>
						</div>
						<div className="grid grid-cols-3 gap-2">
							<span className="font-semibold text-gray-900">Phone:</span>
							<span className="col-span-2">{formData.phone}</span>
						</div>
						<div className="grid grid-cols-3 gap-2">
							<span className="font-semibold text-gray-900">Address:</span>
							<span className="col-span-2">{formData.address}</span>
						</div>

						<div className="py-2">
							<span className="font-semibold text-gray-900">Products:</span>
							<ul className="mt-1 ml-4 list-disc space-y-1 text-gray-500">
								{items.map((item, i) => (
									<li key={i}>
										{item.quantity}x {item.title}
									</li>
								))}
							</ul>
						</div>

						<div className="py-2">
							<span className="font-semibold text-gray-900">Note:</span>
							<p className="mt-1 text-gray-500">{formData.note || 'No note'}</p>
						</div>

						<div className="flex justify-between border-t pt-2">
							<span>Shipping:</span>
							<span>{orderData.shipping}</span>
						</div>
						<div className="flex justify-between border-t pt-2">
							<span>Payment Method:</span>
							<span>COD</span>
						</div>

						<div className="flex justify-between text-base font-bold text-red-600">
							<span>Total:</span>
							<span>{orderData.total}</span>
						</div>
					</div>
				),
				confirmButtonText: 'Done',
				confirmButtonColor: '#000000',
				customClass: {
					popup: 'rounded-xl',
					confirmButton: 'rounded-lg px-6 py-2',
				},
			})

			clearCart()
			resetForm()
		} catch (error) {
			setIsSubmitting(false)
			console.error('Error checkout:', error)
			MySwal.fire({
				title: 'Error!',
				text: 'Error placing order. Please try again.',
				icon: 'error',
				confirmButtonColor: '#d33',
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
							Submitting order...
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
									<p className="text-gray-500 italic">Your cart is empty.</p>
								</div>
							) : (
								items.map((item) => (
									<div
										key={item.id}
										className="flex items-center justify-between border-b pb-4"
									>
										<div className="flex items-center gap-2 lg:gap-4">
											<Link href={`${ROUTES.products}/${item.slug}`}>
												<img
													src={item.image}
													alt={item.image?.alt ?? ''}
													className="h-14 w-14 rounded border object-cover lg:h-20 lg:w-20"
												/>
											</Link>
											<div className="pr-1">
												<Link href={`${ROUTES.products}/${item.slug}`}>
													<p className="line-clamp-2 text-xs font-medium text-gray-900 lg:text-[16px]">
														{item.title}
													</p>
												</Link>
												<span className="text-xs text-gray-500">
													SKU: {item.id}
												</span>
												<div className="flex items-center gap-2">
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

										<div className="flex items-center gap-1 lg:gap-3">
											<input
												type="number"
												min={1}
												value={item.quantity}
												onChange={(e) =>
													updateQuantity(item.id, Number(e.target.value))
												}
												className="h-8 w-8 rounded border text-center text-sm focus:outline-black lg:h-8 lg:w-12"
											/>
											<button
												onClick={() => removeItem(item.id)}
												className="text-gray-400 transition-colors hover:text-red-500"
											>
												✕
											</button>
										</div>
									</div>
								))
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
				Customer Information
			</h2>

			<div className="space-y-3">
				<input
					required
					type="text"
					placeholder="Name *"
					className="w-full rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-black"
					value={form.name}
					onChange={(e) => setForm({ ...form, name: e.target.value })}
				/>
				<input
					required
					type="tel"
					placeholder="Phone number *"
					className="w-full rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-black"
					value={form.phone}
					onChange={(e) => setForm({ ...form, phone: e.target.value })}
				/>
				<input
					type="email"
					placeholder="Email (optional)"
					className="w-full rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-black"
					value={form.email}
					onChange={(e) => setForm({ ...form, email: e.target.value })}
				/>
				<textarea
					required
					placeholder="Detailed delivery address *"
					className="w-full rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-black"
					rows={3}
					value={form.address}
					onChange={(e) => setForm({ ...form, address: e.target.value })}
				/>
				<textarea
					placeholder="Order notes (optional)"
					className="w-full rounded-lg border px-4 py-2 text-sm transition-all outline-none focus:border-black"
					rows={3}
					value={form.note}
					onChange={(e) => setForm({ ...form, note: e.target.value })}
				/>
			</div>

			<div className="space-y-3">
				<h2 className="border-b pb-3 text-xl font-semibold text-gray-800">
					Payment Information
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
						Payment upon receipt (COD)
					</span>
				</div>
			</div>

			<div className="mt-2 space-y-2 border-t pt-4">
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-600">Temporarily:</span>
					<span className="text-sm font-medium text-black">
						{formatVND(itemsPrice)}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-600">Shipping:</span>
					<span className="text-sm font-medium text-black">
						{formatVND(effectiveShipping)}
					</span>
				</div>
			</div>

			<div className="fixed right-0 bottom-0 left-0 z-50 border-t border-[#f5f5f5] bg-white p-4 max-md:m-0 md:static md:z-0 md:border-0 md:bg-transparent md:p-0">
				<div className="mb-3 flex items-center justify-between md:mb-4">
					<span className="font-medium text-gray-600">Total:</span>
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
						? 'No products'
						: isSubmitting
							? 'Sending...'
							: submitText}
				</button>
			</div>

			{isCartEmpty && (
				<p className="mt-2 text-center text-xs font-medium text-red-500">
					Please select products before checkout.
				</p>
			)}
		</form>
	)
}
