'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
	HiOutlineBuildingStorefront,
	HiOutlineCheckCircle,
	HiOutlineDocumentText,
	HiOutlineInformationCircle,
	HiOutlineShoppingBag,
	HiOutlineSparkles,
	HiOutlineTruck,
} from 'react-icons/hi2'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useMounted } from '@/hooks/useMounted'
import { checkoutKey, retireCheckoutKey } from '@/lib/checkout-submission'
import { ROUTES } from '@/lib/env'
import { escapeHtml } from '@/lib/toast'
import { cn, formatPrice } from '@/lib/utils'
import { recordCheckoutTiming } from '@/lib/vitals'
import { urlFor } from '@/sanity/lib/image'
import { useCartStore } from '@/store/use-cart-store'
import CartVariantSelector from '@/ui/cart/cart-variant-selector'

const MySwal = withReactContent(Swal)

// Safe image URL extractor
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

// Corporate work email detector
const isCorporateEmail = (email: string): boolean => {
	if (!email || !email.includes('@')) return false
	const domain = email.split('@')[1]?.toLowerCase().trim()
	const freeProviders = [
		'gmail.com',
		'yahoo.com',
		'hotmail.com',
		'outlook.com',
		'icloud.com',
		'aol.com',
		'mail.com',
		'protonmail.com',
		'zoho.com',
		'yandex.com',
	]
	return Boolean(
		domain && !freeProviders.includes(domain) && domain.includes('.'),
	)
}

type Props = {
	title?: string
	description?: string
	webhookUrl?: string
	submitText?: string
	showSummary?: boolean
	priceShipping?: number
}

export type CheckoutType = 'direct' | 'rfq'

export default function CartCheckoutClient({
	title,
	description,
	webhookUrl,
	submitText = 'Complete Order',
	priceShipping = 0,
}: Props) {
	const mounted = useMounted()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [checkoutType, setCheckoutType] = useState<CheckoutType>('direct')

	const {
		items,
		totalPrice,
		updateQuantity,
		removeItem,
		clearCart,
		getItemEffectivePrice,
		getItemTierUpsell,
		getMoqValidation,
		roundUpToMoq,
	} = useCartStore()

	// Sync mode from URL search param (?mode=rfq or ?type=rfq)
	useEffect(() => {
		const paramMode = searchParams.get('mode') || searchParams.get('type')
		if (paramMode === 'rfq' || paramMode === 'wholesale_rfq') {
			setCheckoutType('rfq')
		} else if (paramMode === 'sample' || paramMode === 'direct') {
			setCheckoutType('direct')
		}
	}, [searchParams])

	useEffect(() => {
		useCartStore
			.getState()
			.setMode(
				checkoutType === 'rfq'
					? 'wholesale_rfq'
					: searchParams.get('mode') === 'sample'
						? 'sample'
						: 'direct',
			)
	}, [checkoutType, searchParams])

	const { deficits } = getMoqValidation()
	const hasMoqDeficit = deficits.length > 0

	// Check if any item in cart has unlocked a volume tier
	const hasActiveTierInCart = items.some(
		(item) => getItemEffectivePrice(item) < item.price,
	)

	// Confirm remove item from cart
	const handleRemoveItem = (id: string, itemTitle: string) => {
		MySwal.fire({
			title: 'Remove item?',
			text: `Are you sure you want to remove "${itemTitle}" from your cart?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#ef4444',
			cancelButtonColor: '#6b7280',
			confirmButtonText: 'Remove',
			cancelButtonText: 'Cancel',
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

	// Handle order submission
	const handleCheckout = async (formData: any, resetForm: () => void) => {
		if (items.length === 0) return
		if (hasMoqDeficit) {
			MySwal.fire({
				icon: 'warning',
				title: 'Minimum quantity required',
				text: 'Increase quantities to the listed MOQ, or request a sample.',
			})
			return
		}

		setIsSubmitting(true)

		const isRfq = checkoutType === 'rfq'
		const itemsString = items
			.map(
				(item) =>
					`${item.quantity}x ${item.title}${item.sku ? ` [SKU: ${item.sku}]` : ''} @ ${formatPrice(getItemEffectivePrice(item))}/unit`,
			)
			.join('\n')

		const itemsTotal = totalPrice()
		const actualShipping = isRfq ? 0 : items.length > 0 ? priceShipping : 0
		const finalTotal = itemsTotal + actualShipping

		// Format clean combined address
		const combinedAddress = [
			formData.address,
			formData.apartment,
			formData.city,
			formData.state,
			formData.postalCode,
			formData.country,
		]
			.filter(Boolean)
			.join(', ')

		let orderId = ''

		const orderData = {
			intentType: isRfq ? 'B2B_RFQ' : 'ORDER_REQUEST',
			mode: isRfq
				? 'wholesale_rfq'
				: searchParams.get('mode') === 'sample'
					? 'sample'
					: 'direct',
			companyName: formData.companyName?.trim() || '',
			taxId: formData.taxId?.trim() || '',
			incoterm: isRfq ? formData.incoterm || 'FOB' : undefined,
			portOfDestination: isRfq
				? formData.portOfDestination?.trim() || ''
				: undefined,
			targetDeliveryDate: isRfq
				? formData.targetDeliveryDate?.trim() || ''
				: undefined,
			customizationRequirements:
				formData.customizationRequirements?.trim() || '',
			name: formData.name.trim(),
			email: formData.email.trim(),
			phone: formData.phone.trim(),
			address: combinedAddress,
			shippingAddress: formData.address,
			shippingApartment: formData.apartment,
			shippingCity: formData.city,
			shippingState: formData.state,
			shippingPostalCode: formData.postalCode,
			shippingCountry: formData.country,
			note: formData.note?.trim() || '',
			items: itemsString,
			itemsDetail: items.map((item) => ({
				id: item.id,
				productId: item.productId || item.id,
				variantId: item.variantId,
				title: item.title,
				sku: item.sku || item.id,
				price: getItemEffectivePrice(item),
				quantity: item.quantity,
				image: getItemImageUrl(item.image),
				moq: item.moq,
			})),
			subtotal: itemsTotal,
			shippingFee: actualShipping,
			grandTotal: finalTotal,
			expectedTotal: finalTotal,
			expectedCustomQuote: items.some(
				(item) => getItemEffectivePrice(item) <= 0,
			),
			requirePriceMatch: true,
			currency: 'USD',
			paymentMethod: isRfq ? 'b2b_rfq_negotiation' : 'cod',
			paymentStatus: 'unpaid',
		}

		const startedAt =
			typeof performance !== 'undefined' ? performance.now() : Date.now()
		try {
			const idempotencyKey = await checkoutKey(orderData)
			let res = await fetch('/api/orders/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Idempotency-Key': idempotencyKey,
				},
				body: JSON.stringify(orderData),
			})

			let result = await res.json()

			if (res.status === 409 && result?.priceChanged && result?.serverPricing) {
				setIsSubmitting(false)
				const srv = result.serverPricing
				const confirmResult = await MySwal.fire({
					title: 'Updated Pricing Confirmation',
					html: `<p class="text-sm text-gray-600">Current verified pricing on the server differs from your cart preview:<br/><br/><b>Subtotal:</b> ${escapeHtml(formatPrice(srv.subtotal))}<br/><b>Shipping:</b> ${escapeHtml(formatPrice(srv.shipping))}<br/><b>Final Total (USD):</b> <b class="text-primary">${escapeHtml(srv.total === 0 && srv.customQuote ? 'Custom Quote (TBD)' : formatPrice(srv.total))}</b></p>`,
					icon: 'info',
					showCancelButton: true,
					confirmButtonText: 'Confirm Updated Total & Submit',
					cancelButtonText: 'Cancel & Review Cart',
					confirmButtonColor: '#0f172a',
				})
				if (!confirmResult.isConfirmed) {
					return
				}
				setIsSubmitting(true)
				const confirmedPayload = {
					...orderData,
					expectedTotal: srv.total,
					expectedCustomQuote: Boolean(srv.customQuote),
				}
				res = await fetch('/api/orders/create', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Idempotency-Key': idempotencyKey,
					},
					body: JSON.stringify(confirmedPayload),
				})
				result = await res.json()
			}

			if (!res.ok || !result.success) {
				throw new Error(
					result.message || 'Failed to submit order or quotation request',
				)
			}

			await retireCheckoutKey(orderData)

			recordCheckoutTiming(
				(typeof performance !== 'undefined' ? performance.now() : Date.now()) -
					startedAt,
			)

			orderId = result.orderId
			const receiptQuery = result.receiptToken
				? `&rt=${encodeURIComponent(result.receiptToken)}`
				: ''

			// Broadcast to open admin tabs on same device/browser
			if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
				try {
					const adminChannel = new BroadcastChannel('deanflow-admin-sync')
					adminChannel.postMessage({ type: 'NEW_ORDER', orderId })
					adminChannel.close()
				} catch {}
			}

			clearCart()
			resetForm()

			if (isRfq) {
				const safeOrderId = escapeHtml(orderId)
				const safeEmail = escapeHtml(formData.email)
				setIsSubmitting(false)
				MySwal.fire({
					title: 'Quotation Request Received!',
					html: `<p class="text-sm text-gray-600 dark:text-gray-300">Reference Number: <b class="font-mono text-primary">${safeOrderId}</b>.<br/>Your request has been saved. We will contact <b>${safeEmail}</b> after review. Our dedicated commercial export manager will reach out within 4–12 business hours.</p>`,
					icon: 'success',
					confirmButtonText: 'View Request Confirmation',
					confirmButtonColor: '#0f172a',
				}).then(() => {
					router.push(
						`/${ROUTES.orderSuccess}?orderId=${encodeURIComponent(orderId)}${receiptQuery}`,
					)
				})
			} else {
				router.push(
					`/${ROUTES.orderSuccess}?orderId=${encodeURIComponent(orderId)}${receiptQuery}`,
				)
			}
		} catch (error: any) {
			setIsSubmitting(false)
			console.error('Error during checkout:', error)
			MySwal.fire({
				title: 'Submission Failed',
				text:
					error?.message ||
					'An error occurred while submitting your order. Please try again.',
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
					<div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-2xl">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
						<span className="text-sm font-semibold text-gray-700">
							{checkoutType === 'rfq'
								? 'Submitting quotation request...'
								: 'Processing your order...'}
						</span>
					</div>
				</div>
			)}

			<div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs lg:p-7">
				{/* Top Notice: Automatic Tier Pricing & Variant Pooling */}
				<div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
					<div className="flex items-center gap-2.5">
						<div className="shrink-0 rounded-xl bg-emerald-100 p-2 text-emerald-800">
							<HiOutlineSparkles className="text-base" />
						</div>
						<div>
							<p className="font-bold">
								Automated Volume Tier Pricing & Pooling Active
							</p>
							<p className="text-[11px] text-emerald-800">
								Tier discounts apply automatically to your quantities across all
								variants. You can place a direct delivery order or request an
								official Corporate RFQ below.
							</p>
						</div>
					</div>
					{hasActiveTierInCart && (
						<span className="hidden shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white sm:inline-flex">
							<HiOutlineCheckCircle />
							Tier Unlocked
						</span>
					)}
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
					{/* LEFT: CART ITEMS */}
					<div className="space-y-6 lg:col-span-3">
						<div className="flex items-center justify-between border-b pb-3">
							<div>
								<h1 className="text-xl font-bold text-gray-900">
									{title || 'Order Review & Items'}
								</h1>
								<p className="mt-0.5 text-xs text-gray-500">
									{items.length} {items.length === 1 ? 'item' : 'items'} in your
									cart
								</p>
							</div>
						</div>

						<div className="space-y-4">
							{items.length === 0 ? (
								<div className="rounded-xl border bg-gray-50 py-12 text-center">
									<HiOutlineShoppingBag className="mx-auto mb-2 text-4xl text-gray-300" />
									<p className="font-medium text-gray-500">
										Your cart is currently empty.
									</p>
									<Link
										href={`/${ROUTES.products}`}
										className="bg-primary mt-3 inline-block rounded-lg px-5 py-2 text-xs font-bold text-white"
									>
										Browse Products
									</Link>
								</div>
							) : (
								items.map((item) => {
									const imgSrc = getItemImageUrl(item.image)
									const effectivePrice = getItemEffectivePrice(item)
									const tierInfo = getItemTierUpsell(item)
									const isTierDiscounted = effectivePrice < item.price

									return (
										<div key={item.id} className="space-y-2.5 border-b pb-4">
											<div className="flex items-start justify-between gap-3">
												<div className="flex min-w-0 flex-1 items-start gap-3 lg:gap-4">
													<Link
														href={`${ROUTES.products}/${item.slug}`}
														className="shrink-0"
													>
														<img
															src={imgSrc}
															alt={item.title ?? ''}
															width={80}
															height={80}
															className="h-16 w-16 rounded-xl border bg-gray-50 object-cover lg:h-20 lg:w-20"
															onError={(e) => {
																;(e.currentTarget as HTMLImageElement).src =
																	'/fallback-image.png'
															}}
															loading="lazy"
														/>
													</Link>
													<div className="min-w-0 flex-1 pr-1">
														<Link href={`${ROUTES.products}/${item.slug}`}>
															<p className="hover:text-primary line-clamp-2 text-xs font-bold text-gray-900 transition-colors lg:text-[15px]">
																{item.productTitle ||
																	item.title
																		.replace(/\s*\([^)]*\)$/, '')
																		.trim()}
															</p>
														</Link>

														<div className="mt-1 flex flex-wrap items-center gap-2">
															{item.sku && (
																<span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
																	SKU: {item.sku}
																</span>
															)}
															{tierInfo.isTierActive && (
																<span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
																	Volume Tier Active
																</span>
															)}
														</div>

														<div className="mt-2">
															<CartVariantSelector item={item} />
														</div>

														<div className="mt-2 flex items-center gap-2 lg:hidden">
															<span className="text-primary text-xs font-bold">
																{formatPrice(effectivePrice)}
															</span>
															{isTierDiscounted && (
																<span className="text-[10px] text-gray-400 line-through">
																	{formatPrice(item.price)}
																</span>
															)}
														</div>
													</div>
												</div>

												{/* Right Column: Qty & Price Desktop */}
												<div className="flex shrink-0 flex-col items-end gap-2">
													<div className="hidden text-right lg:block">
														<div className="flex items-center justify-end gap-1.5">
															{isTierDiscounted && (
																<span className="text-xs text-gray-400 line-through">
																	{formatPrice(item.price * item.quantity)}
																</span>
															)}
															<span className="text-primary text-base font-extrabold">
																{formatPrice(effectivePrice * item.quantity)}
															</span>
														</div>
														<span className="block text-[11px] text-gray-500">
															{formatPrice(effectivePrice)} / unit
														</span>
													</div>

													<div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white shadow-2xs">
														<button
															type="button"
															onClick={() =>
																updateQuantity(
																	item.id,
																	Math.max(1, item.quantity - 1),
																)
															}
															className="flex size-7 cursor-pointer items-center justify-center text-xs font-bold text-gray-600 transition hover:bg-gray-100"
															aria-label="Decrease quantity"
														>
															-
														</button>
														<input
															type="number"
															className="w-14 [appearance:textfield] border-none py-1 text-center text-xs font-bold text-gray-900 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
															value={item.quantity}
															onChange={(e) => {
																const val = parseInt(e.target.value, 10)
																if (!isNaN(val) && val >= 1) {
																	updateQuantity(item.id, val)
																}
															}}
														/>
														<button
															type="button"
															onClick={() =>
																updateQuantity(item.id, item.quantity + 1)
															}
															className="flex size-7 cursor-pointer items-center justify-center text-xs font-bold text-gray-600 transition hover:bg-gray-100"
															aria-label="Increase quantity"
														>
															+
														</button>
													</div>

													<button
														type="button"
														onClick={() =>
															handleRemoveItem(item.id, item.title)
														}
														className="cursor-pointer text-[11px] text-red-500 hover:text-red-700 hover:underline"
													>
														Remove
													</button>
												</div>
											</div>

											{/* Smart Upsell Banner if next tier exists */}
											{tierInfo.nextTier &&
												typeof tierInfo.unitsNeeded === 'number' &&
												tierInfo.unitsNeeded > 0 && (
													<div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200/70 bg-amber-50/70 p-2 text-[11px] text-amber-900">
														<span>
															Add{' '}
															<b className="font-bold">
																{tierInfo.unitsNeeded} more
															</b>{' '}
															to unlock{' '}
															<b className="text-primary font-bold">
																{formatPrice(tierInfo.nextTier.unitPrice)}/unit
															</b>
															{tierInfo.savingsPercent
																? ` (Save ${tierInfo.savingsPercent}%)`
																: ''}
														</span>
														<button
															type="button"
															onClick={() =>
																updateQuantity(
																	item.id,
																	item.quantity + tierInfo.unitsNeeded!,
																)
															}
															className="shrink-0 cursor-pointer rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white transition hover:bg-amber-700"
														>
															+ Add {tierInfo.unitsNeeded}
														</button>
													</div>
												)}
										</div>
									)
								})
							)}
						</div>
					</div>

					{/* RIGHT: ADAPTIVE ORDER FORM */}
					<div className="lg:col-span-2">
						<OrderForm
							checkoutType={checkoutType}
							setCheckoutType={setCheckoutType}
							itemsPrice={totalPrice()}
							priceShipping={priceShipping}
							submitText={submitText}
							onCheckout={handleCheckout}
							isCartEmpty={items.length === 0}
							isSubmitting={isSubmitting}
							hasActiveTierInCart={hasActiveTierInCart}
						/>
					</div>
				</div>
			</div>
		</>
	)
}

type OrderFormProps = {
	checkoutType: CheckoutType
	setCheckoutType: (type: CheckoutType) => void
	itemsPrice: number
	priceShipping: number
	submitText?: string
	onCheckout: (form: any, resetForm: () => void) => void
	isCartEmpty: boolean
	isSubmitting: boolean
	hasActiveTierInCart: boolean
}

function OrderForm({
	checkoutType,
	setCheckoutType,
	itemsPrice,
	priceShipping,
	onCheckout,
	isCartEmpty,
	isSubmitting,
	hasActiveTierInCart,
}: OrderFormProps) {
	const isRfq = checkoutType === 'rfq'

	const [form, setForm] = useState({
		name: '',
		email: '',
		phone: '',
		companyName: '',
		taxId: '',
		incoterm: 'FOB',
		portOfDestination: '',
		targetDeliveryDate: '',
		customizationRequirements: '',
		country: 'United States',
		address: '',
		apartment: '',
		city: '',
		state: '',
		postalCode: '',
		note: '',
	})

	const isCorp = isCorporateEmail(form.email)

	const effectiveShipping = isRfq || isCartEmpty ? 0 : priceShipping
	const finalTotal = itemsPrice + effectiveShipping

	const resetForm = () =>
		setForm({
			name: '',
			email: '',
			phone: '',
			companyName: '',
			taxId: '',
			incoterm: 'FOB',
			portOfDestination: '',
			targetDeliveryDate: '',
			customizationRequirements: '',
			country: 'United States',
			address: '',
			apartment: '',
			city: '',
			state: '',
			postalCode: '',
			note: '',
		})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (isCartEmpty || isSubmitting) return
		onCheckout(form, resetForm)
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="top-4 space-y-4 rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:p-6"
		>
			{/* Order type selector */}
			<div>
				<label className="mb-2 block text-xs font-bold tracking-wider text-gray-700 uppercase">
					Choose how you would like to order
				</label>
				<div className="grid grid-cols-2 gap-2">
					<button
						type="button"
						onClick={() => setCheckoutType('direct')}
						className={cn(
							'flex cursor-pointer flex-col justify-between gap-1.5 rounded-xl border p-3 text-left transition-all',
							!isRfq
								? 'border-primary bg-primary/5 ring-primary shadow-2xs ring-1'
								: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
						)}
					>
						<div className="flex items-center justify-between">
							<HiOutlineTruck
								className={cn(
									'text-lg',
									!isRfq ? 'text-primary' : 'text-gray-400',
								)}
							/>
							<span
								className={cn(
									'rounded px-1.5 py-0.5 text-[10px] font-bold',
									!isRfq
										? 'bg-primary text-white'
										: 'bg-gray-100 text-gray-600',
								)}
							>
								Sample or retail order
							</span>
						</div>
						<div>
							<p className="text-xs font-bold text-gray-900">Place an order</p>
							<p className="text-[10px] leading-tight text-gray-500">
								For retail purchases and evaluation samples. We will confirm
								availability, shipping and payment before processing.
							</p>
						</div>
					</button>

					<button
						type="button"
						onClick={() => setCheckoutType('rfq')}
						className={cn(
							'flex cursor-pointer flex-col justify-between gap-1.5 rounded-xl border p-3 text-left transition-all',
							isRfq
								? 'border-primary bg-primary/5 ring-primary shadow-2xs ring-1'
								: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
						)}
					>
						<div className="flex items-center justify-between">
							<HiOutlineBuildingStorefront
								className={cn(
									'text-lg',
									isRfq ? 'text-primary' : 'text-gray-400',
								)}
							/>
							<span
								className={cn(
									'rounded px-1.5 py-0.5 text-[10px] font-bold',
									isRfq ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600',
								)}
							>
								Wholesale inquiry
							</span>
						</div>
						<div>
							<p className="text-xs font-bold text-gray-900">
								Request a wholesale quote
							</p>
							<p className="text-[10px] leading-tight text-gray-500">
								For bulk or custom orders. No payment now; we will confirm
								pricing, freight and terms.
							</p>
						</div>
					</button>
				</div>
			</div>

			{/* Smart Suggestion for Corporate Domain */}
			{isCorp && !isRfq && (
				<div className="flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-xs text-blue-900">
					<div className="flex items-center gap-1.5">
						<HiOutlineBuildingStorefront className="shrink-0 text-blue-600" />
						<span className="text-[11px]">
							Corporate email detected. Would you like an official Proforma
							Quote?
						</span>
					</div>
					<button
						type="button"
						onClick={() => setCheckoutType('rfq')}
						className="shrink-0 text-[10px] font-bold text-blue-700 hover:underline"
					>
						Switch to RFQ
					</button>
				</div>
			)}

			<div className="border-b pt-1 pb-2">
				<h2 className="text-sm font-bold text-gray-900">
					{isRfq
						? 'Corporate Buyer & Quotation Profile'
						: 'Shipping Address & Contact Details'}
				</h2>
				<p className="text-[11px] text-gray-500">
					{isRfq
						? 'Business details help us prepare your wholesale quotation and estimate freight'
						: 'Please provide delivery destination for direct courier dispatch'}
				</p>
			</div>

			<div className="space-y-3">
				{/* Name & Company */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<label className="mb-1 block text-xs font-semibold text-gray-700">
							Full Name / Contact Person *
						</label>
						<input
							required
							type="text"
							placeholder="John Smith"
							className="focus:border-primary focus:ring-primary w-full rounded-xl border border-gray-300 px-3 py-2 text-xs transition-all outline-none focus:ring-1"
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
						/>
					</div>

					<div>
						<label className="mb-1 block text-xs font-semibold text-gray-700">
							Company Name {isRfq ? '*' : '(Optional)'}
						</label>
						<input
							required={isRfq}
							type="text"
							placeholder="Acme Distribution LLC"
							className="focus:border-primary focus:ring-primary w-full rounded-xl border border-gray-300 px-3 py-2 text-xs transition-all outline-none focus:ring-1"
							value={form.companyName}
							onChange={(e) =>
								setForm({ ...form, companyName: e.target.value })
							}
						/>
					</div>
				</div>

				{/* Email & Phone */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<label className="mb-1 block text-xs font-semibold text-gray-700">
							Email Address *
						</label>
						<input
							required
							type="email"
							placeholder="buyer@company.com"
							className="focus:border-primary focus:ring-primary w-full rounded-xl border border-gray-300 px-3 py-2 text-xs transition-all outline-none focus:ring-1"
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
						/>
					</div>

					<div>
						<label className="mb-1 block text-xs font-semibold text-gray-700">
							Phone / WhatsApp Number *
						</label>
						<input
							required
							type="tel"
							placeholder="+1 555-019-2834"
							className="focus:border-primary focus:ring-primary w-full rounded-xl border border-gray-300 px-3 py-2 text-xs transition-all outline-none focus:ring-1"
							value={form.phone}
							onChange={(e) => setForm({ ...form, phone: e.target.value })}
						/>
					</div>
				</div>

				{/* B2B Logistics Terms (Only in RFQ Mode) */}
				{isRfq && (
					<div className="space-y-3 rounded-xl border border-gray-200/80 bg-gray-50 p-3">
						<span className="block text-[11px] font-bold tracking-wider text-gray-800 uppercase">
							Trade Terms & Logistics Specifications
						</span>

						<div className="grid grid-cols-2 gap-2.5">
							<div>
								<label className="mb-1 block text-[11px] font-semibold text-gray-700">
									Incoterms Rule
								</label>
								<select
									value={form.incoterm}
									onChange={(e) =>
										setForm({ ...form, incoterm: e.target.value })
									}
									className="focus:border-primary w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium outline-none"
								>
									<option value="FOB">FOB (Port of Origin - Vietnam)</option>
									<option value="CIF">CIF (Cost, Insurance & Freight)</option>
									<option value="EXW">EXW (Ex Works - Factory Gate)</option>
									<option value="DDP">DDP (Delivered Duty Paid)</option>
								</select>
							</div>

							<div>
								<label className="mb-1 block text-[11px] font-semibold text-gray-700">
									Destination Port / Terminal
								</label>
								<input
									type="text"
									placeholder="e.g. Long Beach / Rotterdam"
									className="focus:border-primary w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none"
									value={form.portOfDestination}
									onChange={(e) =>
										setForm({ ...form, portOfDestination: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2.5">
							<div>
								<label className="mb-1 block text-[11px] font-semibold text-gray-700">
									Target Delivery Schedule
								</label>
								<input
									type="text"
									placeholder="e.g. Next Month / Q3"
									className="focus:border-primary w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none"
									value={form.targetDeliveryDate}
									onChange={(e) =>
										setForm({ ...form, targetDeliveryDate: e.target.value })
									}
								/>
							</div>

							<div>
								<label className="mb-1 block text-[11px] font-semibold text-gray-700">
									Corporate Tax / VAT ID
								</label>
								<input
									type="text"
									placeholder="e.g. VAT / EIN Number"
									className="focus:border-primary w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none"
									value={form.taxId}
									onChange={(e) => setForm({ ...form, taxId: e.target.value })}
								/>
							</div>
						</div>

						<div>
							<label className="mb-1 block text-[11px] font-semibold text-gray-700">
								OEM Customization / Packaging Notes
							</label>
							<textarea
								placeholder="Specify custom carton branding, logo embossing, private labeling..."
								className="focus:border-primary w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none"
								rows={2}
								value={form.customizationRequirements}
								onChange={(e) =>
									setForm({
										...form,
										customizationRequirements: e.target.value,
									})
								}
							/>
						</div>
					</div>
				)}

				<div>
					<label className="mb-1 block text-xs font-semibold text-gray-700">
						Destination Country / Region *
					</label>
					<input
						required
						type="text"
						placeholder="United States / Australia / Germany"
						className="focus:border-primary w-full rounded-xl border border-gray-300 px-3 py-2 text-xs transition-all outline-none"
						value={form.country}
						onChange={(e) => setForm({ ...form, country: e.target.value })}
					/>
				</div>

				<div>
					<label className="mb-1 block text-xs font-semibold text-gray-700">
						Delivery / Registered Address *
					</label>
					<input
						required
						type="text"
						placeholder="Street address, building, suite..."
						className="focus:border-primary w-full rounded-xl border border-gray-300 px-3 py-2 text-xs transition-all outline-none"
						value={form.address}
						onChange={(e) => setForm({ ...form, address: e.target.value })}
					/>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="mb-1 block text-xs font-semibold text-gray-700">
							City / Port *
						</label>
						<input
							required
							type="text"
							placeholder="Los Angeles / Hamburg"
							className="focus:border-primary w-full rounded-xl border border-gray-300 px-3 py-2 text-xs transition-all outline-none"
							value={form.city}
							onChange={(e) => setForm({ ...form, city: e.target.value })}
						/>
					</div>

					<div>
						<label className="mb-1 block text-xs font-semibold text-gray-700">
							Postal / ZIP Code
						</label>
						<input
							type="text"
							placeholder="90001"
							className="focus:border-primary w-full rounded-xl border border-gray-300 px-3 py-2 text-xs transition-all outline-none"
							value={form.postalCode}
							onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
						/>
					</div>
				</div>

				<div>
					<label className="mb-1 block text-xs font-semibold text-gray-700">
						Order Notes (Optional)
					</label>
					<textarea
						placeholder="Special delivery instructions or requirements..."
						className="focus:border-primary w-full rounded-xl border border-gray-300 px-3 py-2 text-xs transition-all outline-none"
						rows={2}
						value={form.note}
						onChange={(e) => setForm({ ...form, note: e.target.value })}
					/>
				</div>
			</div>

			{/* Payment Disclaimer */}
			<div className="space-y-1.5 border-t pt-3">
				<div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
					<HiOutlineInformationCircle className="text-primary mt-0.5 shrink-0 text-base" />
					{isRfq ? (
						<span>
							<b>No upfront payment required today.</b> Your RFQ will be
							reviewed by our commercial team before a formal proforma quotation
							is issued. All transactions are quoted and settled in USD.
						</span>
					) : (
						<span>
							<b>Order request (USD).</b> Submitting this request does not charge
							you. Our team will confirm product availability, shipping costs and
							payment options before processing.
						</span>
					)}
				</div>
			</div>

			{/* Price summary */}
			<div className="space-y-1.5 border-t pt-3">
				<div className="flex items-center justify-between text-xs text-gray-600">
					<span>
						{isRfq ? 'Goods Subtotal (FOB Basis):' : 'Items Subtotal:'}
					</span>
					<span className="font-bold text-gray-900">
						{formatPrice(itemsPrice)}
					</span>
				</div>
				{!isRfq && (
					<div className="flex items-center justify-between text-xs text-gray-600">
						<span>Estimated shipping:</span>
						<span className="font-bold text-gray-900">
							{effectiveShipping === 0
								? 'Free'
								: formatPrice(effectiveShipping)}
						</span>
					</div>
				)}
				<div className="flex items-center justify-between border-t border-dashed pt-1">
					<span className="text-sm font-bold text-gray-900">
						{isRfq ? 'Estimated goods subtotal:' : 'Estimated order total:'}
					</span>
					<span className="text-primary text-lg font-black">
						{formatPrice(finalTotal)}
					</span>
				</div>
			</div>

			<button
				disabled={isSubmitting || isCartEmpty}
				type="submit"
				className={cn(
					'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-xs font-bold tracking-wider text-white uppercase shadow-md transition-all',
					isSubmitting || isCartEmpty
						? 'cursor-not-allowed bg-gray-300 shadow-none'
						: 'bg-primary hover:opacity-95 active:scale-[0.99]',
				)}
			>
				{isCartEmpty
					? 'Cart is empty'
					: isSubmitting
						? 'Processing...'
						: isRfq
							? 'Submit Quotation Request (USD)'
							: 'Submit order request'}
			</button>
		</form>
	)
}
