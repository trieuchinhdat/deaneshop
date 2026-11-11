'use client'

import { useEffect, useState } from 'react'
import {
	FiCheck,
	FiClock,
	FiCopy,
	FiDollarSign,
	FiEdit2,
	FiExternalLink,
	FiFileText,
	FiMail,
	FiPackage,
	FiPhone,
	FiPrinter,
	FiRefreshCw,
	FiSave,
	FiShield,
	FiTag,
	FiTrash2,
	FiTruck,
	FiUser,
	FiX,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import type { AdminRole } from '@/lib/admin-roles'
import { getAdminOrderDeletionEligibility } from '@/lib/order-domain'
import { formatPrice } from '@/lib/utils'

type OrderDetailModalProps = {
	order: any
	userRole?: AdminRole
	onClose: () => void
	onOrderUpdated: (updatedOrder: any) => void
	onOpenPrint: (order: any) => void
	onRequestDelete?: (order: any) => void
}

export const INTERNATIONAL_CARRIERS = [
	'DHL Express',
	'FedEx',
	'UPS',
	'USPS',
	'Royal Mail',
	'Australia Post',
	'Canada Post',
	'Local Post / EMS',
	'Other Courier',
]

const INCOTERMS = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF']

export default function OrderDetailModal({
	order,
	userRole,
	onClose,
	onOrderUpdated,
	onOpenPrint,
	onRequestDelete,
}: OrderDetailModalProps) {
	const isB2BOrder = Boolean(
		order.orderIntent === 'wholesale_rfq' ||
			(!order.orderIntent &&
				(order.orderId?.startsWith('RFQ-') ||
					order.orderId?.startsWith('EST-') ||
					order.paymentMethod === 'B2B_RFQ_NEGOTIATION' ||
					order.quoteStatus)),
	)

	const [loadedVersion, setLoadedVersion] = useState<number>(order.version ?? 1)
	const [fulfillmentStatus, setFulfillmentStatus] = useState(
		(order.fulfillmentStatus || 'PENDING').toUpperCase(),
	)
	const [paymentStatus, setPaymentStatus] = useState(
		(order.paymentStatus || 'UNPAID').toUpperCase(),
	)
	const [paidCents, setPaidCents] = useState<number>(Number(order.paidCents) || 0)
	const [payments, setPayments] = useState<any[]>(Array.isArray(order.payments) ? order.payments : [])
	const [carrier, setCarrier] = useState(order.carrier || '')
	const [trackingCode, setTrackingCode] = useState(order.trackingCode || '')
	const [shippingFee, setShippingFee] = useState<number>(
		order.pricing?.shippingFee !== undefined ? Number(order.pricing.shippingFee) : 0,
	)
	const [discount, setDiscount] = useState<number>(
		order.pricing?.discount !== undefined ? Number(order.pricing.discount) : 0,
	)
	const [paymentTerms, setPaymentTerms] = useState<string>(
		isB2BOrder ? order.paymentTerms || 'T/T 30% advance, 70% before shipment' : '',
	)
	const [quoteStatus, setQuoteStatus] = useState<string>(
		isB2BOrder ? (order.quoteStatus || 'PENDING').toUpperCase() : '',
	)
	const [quoteValidUntil, setQuoteValidUntil] = useState<string>(
		isB2BOrder && order.quoteValidUntil ? String(order.quoteValidUntil).slice(0, 10) : '',
	)
	const [incoterm, setIncoterm] = useState<string>(order.incoterm || 'FOB')
	const [portOfDestination, setPortOfDestination] = useState<string>(order.portOfDestination || '')
	const [targetDeliveryDate, setTargetDeliveryDate] = useState<string>(order.targetDeliveryDate || '')
	const [deliveryTerms, setDeliveryTerms] = useState<string>(order.deliveryTerms || '')
	const [editableItems, setEditableItems] = useState<any[]>(
		Array.isArray(order?.items)
			? order.items.map((it: any) => ({
					...it,
					price: Number(it.price) || 0,
					quantity: Number(it.quantity) || 1,
				}))
			: [],
	)

	const [newNote, setNewNote] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
	const [saveError, setSaveError] = useState<string | null>(null)
	const [copiedLink, setCopiedLink] = useState(false)

	// Payment Ledger Input State (DF-001)
	const [showPaymentForm, setShowPaymentForm] = useState(false)
	const [payAmount, setPayAmount] = useState<string>('')
	const [payMethod, setPayMethod] = useState<string>(isB2BOrder ? 'wire_tt' : 'cod')
	const [payReference, setPayReference] = useState<string>('')
	const [payNotes, setPayNotes] = useState<string>('')

	// Editable Customer & Shipping Details
	const [isEditingCustomer, setIsEditingCustomer] = useState(false)
	const [customerName, setCustomerName] = useState(order.customer?.name || '')
	const [customerPhone, setCustomerPhone] = useState(order.customer?.phone || '')
	const [customerEmail, setCustomerEmail] = useState(order.customer?.email || '')
	const [shippingAddress, setShippingAddress] = useState(order.customer?.address || '')
	const [shippingCity, setShippingCity] = useState(order.customer?.city || '')
	const [shippingCountry, setShippingCountry] = useState(
		order.customer?.country || 'United States',
	)

	const syncFromServerOrder = (srv: any) => {
		if (!srv) return
		setLoadedVersion(srv.version ?? 1)
		setFulfillmentStatus((srv.fulfillmentStatus || 'PENDING').toUpperCase())
		setPaymentStatus((srv.paymentStatus || 'UNPAID').toUpperCase())
		setPaidCents(Number(srv.paidCents) || 0)
		setPayments(Array.isArray(srv.payments) ? srv.payments : [])
		setCarrier(srv.carrier || '')
		setTrackingCode(srv.trackingCode || '')
		setShippingFee(Number(srv.pricing?.shippingFee) || 0)
		setDiscount(Number(srv.pricing?.discount) || 0)
		if (isB2BOrder) {
			setPaymentTerms(srv.paymentTerms || '')
			setQuoteStatus((srv.quoteStatus || 'PENDING').toUpperCase())
			setQuoteValidUntil(srv.quoteValidUntil ? String(srv.quoteValidUntil).slice(0, 10) : '')
			setIncoterm(srv.incoterm || 'FOB')
			setPortOfDestination(srv.portOfDestination || '')
			setTargetDeliveryDate(srv.targetDeliveryDate || '')
			setDeliveryTerms(srv.deliveryTerms || '')
			if (Array.isArray(srv.items)) {
				setEditableItems(
					srv.items.map((it: any) => ({
						...it,
						price: Number(it.price) || 0,
						quantity: Number(it.quantity) || 1,
					})),
				)
			}
		}
		setCustomerName(srv.customer?.name || '')
		setCustomerPhone(srv.customer?.phone || '')
		setCustomerEmail(srv.customer?.email || '')
		setShippingAddress(srv.customer?.address || '')
		setShippingCity(srv.customer?.city || '')
		setShippingCountry(srv.customer?.country || 'United States')
	}

	// Keep in sync when parent list updates cleanly for same order ID
	useEffect(() => {
		if (order?.version && order.version > loadedVersion) {
			syncFromServerOrder(order)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [order?._id, order?.version])

	const subtotalCents = editableItems.reduce(
		(sum, item) => sum + Math.round((Number(item.price) || 0) * 100) * Math.max(1, Math.trunc(Number(item.quantity) || 1)),
		0,
	)
	const subtotal = isB2BOrder ? subtotalCents / 100 : Number(order.pricing?.subtotal) || subtotalCents / 100
	const dynamicGrandTotal = Math.max(0, Math.round(subtotal * 100 + (Number(shippingFee) || 0) * 100 - (Number(discount) || 0) * 100) / 100)
	const hasUnpricedItems = editableItems.some((it) => !(Number(it.price) > 0))
	const isQuoteEditable =
		isB2BOrder &&
		['DRAFT', 'PENDING', 'REVISION_REQUESTED', 'EXPIRED', 'REJECTED'].includes(quoteStatus)
	const isQuoteLocked =
		isB2BOrder && ['SENT', 'VIEWED', 'NEGOTIATING', 'APPROVED'].includes(quoteStatus)

	const targetQuoteId = order.orderId || order.id || order._id || ''

	const handleCopyQuoteLink = async () => {
		try {
			setSaveError(null)
			const res = await fetch('/api/admin/quotes/access', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ orderId: order._id || targetQuoteId }),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data.path) {
				setSaveError(
					data.message ||
						'Set Quotation Status to "Issued / Sent to Buyer" and Save first to generate a secure buyer token link.',
				)
				return
			}
			const origin = typeof window !== 'undefined' ? window.location.origin : ''
			await navigator.clipboard.writeText(`${origin}${data.path}`)
			setCopiedLink(true)
			setTimeout(() => setCopiedLink(false), 2500)
		} catch {
			setSaveError('Unable to issue secure buyer quotation link.')
		}
	}

	const safeNotes = Array.isArray(order?.internalNotes) ? order.internalNotes : []

	const handleMoveToDraft = async () => {
		try {
			setIsSaving(true)
			setSaveError(null)
			setSaveSuccess(null)
			const res = await fetch('/api/orders/update-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					docId: order._id,
					orderId: order.orderId,
					expectedVersion: loadedVersion,
					quoteStatus: 'DRAFT',
					internalNote: 'Moved quotation to DRAFT for commercial revision.',
				}),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data.success) {
				if (data.order) {
					syncFromServerOrder(data.order)
					onOrderUpdated(data.order)
				}
				setSaveError(data.message || 'Unable to move quotation to draft.')
				return
			}
			if (data.order) {
				syncFromServerOrder(data.order)
				onOrderUpdated(data.order)
			} else {
				setQuoteStatus('DRAFT')
			}
			setSaveSuccess('Quotation unlocked as DRAFT for editing.')
		} catch {
			setSaveError('Network error while moving quote to draft.')
		} finally {
			setIsSaving(false)
		}
	}

	const handleAcceptQuote = async () => {
		try {
			setIsSaving(true)
			setSaveSuccess(null)
			setSaveError(null)
			const res = await fetch('/api/orders/accept-quote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: order._id || order.orderId,
					expectedVersion: loadedVersion,
					notes: 'Accepted via Admin Operations (offline buyer PO).',
				}),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data.success) {
				setSaveError(data.message || 'Unable to accept quotation.')
				return
			}
			if (data.order) {
				syncFromServerOrder(data.order)
				onOrderUpdated(data.order)
			}
			setSaveSuccess('Quotation accepted. Payment status remains governed by payment ledger.')
		} catch {
			setSaveError('Network error while accepting quotation.')
		} finally {
			setIsSaving(false)
		}
	}

	const handleReleaseFulfillment = async () => {
		try {
			setIsSaving(true)
			setSaveSuccess(null)
			setSaveError(null)
			const res = await fetch('/api/orders/release-fulfillment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: order._id || order.orderId,
					expectedVersion: loadedVersion,
					fulfillmentStatus: 'processing',
				}),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data.success) {
				setSaveError(data.message || 'Unable to release order to warehouse fulfillment.')
				return
			}
			if (data.order) {
				syncFromServerOrder(data.order)
				onOrderUpdated(data.order)
			}
			setSaveSuccess('Released to warehouse processing (payment status preserved).')
		} catch {
			setSaveError('Network error while releasing fulfillment.')
		} finally {
			setIsSaving(false)
		}
	}

	const handleRecordPayment = async (e: React.FormEvent) => {
		e.preventDefault()
		const numericAmount = Number(payAmount)
		if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
			setSaveError('Enter a valid positive payment amount.')
			return
		}
		if (!payReference.trim()) {
			setSaveError('Payment transaction reference / slip number is required.')
			return
		}

		try {
			setIsSaving(true)
			setSaveSuccess(null)
			setSaveError(null)
			const res = await fetch('/api/orders/record-payment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: order._id || order.orderId,
					expectedVersion: loadedVersion,
					amount: numericAmount,
					currency: order.pricing?.currency || 'USD',
					method: payMethod,
					reference: payReference.trim(),
					notes: payNotes.trim() || undefined,
				}),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data.success) {
				setSaveError(data.message || 'Unable to record payment transaction.')
				return
			}
			if (data.order) {
				syncFromServerOrder(data.order)
				onOrderUpdated(data.order)
			}
			setPayAmount('')
			setPayReference('')
			setPayNotes('')
			setShowPaymentForm(false)
			setSaveSuccess('Payment transaction recorded in ledger.')
		} catch {
			setSaveError('Network error while recording payment.')
		} finally {
			setIsSaving(false)
		}
	}

	const handleSaveChanges = async () => {
		try {
			setIsSaving(true)
			setSaveSuccess(null)
			setSaveError(null)

			const payload: Record<string, any> = {
				docId: order._id,
				orderId: order.orderId,
				expectedVersion: loadedVersion,
				fulfillmentStatus,
				carrier,
				trackingCode,
				customerName,
				customerPhone,
				customerEmail,
				shippingAddress,
				shippingCity,
				shippingCountry,
				internalNote: newNote.trim() ? newNote.trim() : undefined,
			}

			// Strict intent separation (DF-002): NEVER send B2B quote/terms fields for D2C orders
			if (isB2BOrder) {
				const validUntilIso = quoteValidUntil
					? `${quoteValidUntil}T23:59:59.000Z`
					: quoteStatus === 'SENT'
						? new Date(Date.now() + 14 * 86400000).toISOString()
						: undefined

				payload.quoteStatus = quoteStatus
				// Only transmit commercial pricing fields when editable or transitioning to SENT from draft
				if (isQuoteEditable) {
					payload.items = editableItems.map((it) => ({
						productId: it.productId || it.id || 'custom',
						variantId: it.variantId || undefined,
						title: it.title,
						sku: it.sku || '',
						price: Number(it.price) || 0,
						quantity: Math.max(1, Math.trunc(Number(it.quantity) || 1)),
						image: it.image,
					}))
					payload.shippingFee = Number(shippingFee) || 0
					payload.discount = Number(discount) || 0
					payload.total = dynamicGrandTotal
					payload.paymentTerms = paymentTerms
					payload.quoteValidUntil = validUntilIso
					payload.incoterm = incoterm
					payload.portOfDestination = portOfDestination
					payload.targetDeliveryDate = targetDeliveryDate
					payload.deliveryTerms = deliveryTerms
				}
			}

			const res = await fetch('/api/orders/update-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data.success) {
				if (res.status === 409 && data.conflict && data.order) {
					syncFromServerOrder(data.order)
					onOrderUpdated(data.order)
				}
				setSaveError(data.message || 'Unable to save order changes.')
				return
			}

			if (data.order) {
				syncFromServerOrder(data.order)
				onOrderUpdated(data.order)
			}
			setSaveSuccess('Order changes saved successfully!')
			setIsEditingCustomer(false)
			setNewNote('')
			setTimeout(() => setSaveSuccess(null), 3000)
		} catch (err) {
			console.error('Update order failed:', err)
			setSaveError('Network error while saving order changes.')
		} finally {
			setIsSaving(false)
		}
	}

	const phoneClean = order?.customer?.phone?.replace(/\D/g, '')
	const totalCents = Math.round(dynamicGrandTotal * 100)
	const balanceDue = Math.max(0, (totalCents - paidCents) / 100)
	const isSuperAdmin = userRole === 'superadmin'
	const deletionEligibility = getAdminOrderDeletionEligibility({
		paidCents,
		paymentStatus,
		payments,
		quoteStatus: isB2BOrder ? quoteStatus : null,
		quoteApprovedAt: order.quoteApprovedAt,
		fulfillmentStatus,
	})

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 print:hidden">
			<div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold shadow-xs">
							<FiPackage className="h-5 w-5" />
						</div>
						<div>
							<div className="flex items-center gap-2 flex-wrap">
								<h3 className="font-mono text-base sm:text-lg font-black text-slate-900">
									Order #{order.orderId || order._id}
								</h3>
								<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isB2BOrder ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
									{isB2BOrder ? 'B2B Quotation Order' : order.orderIntent === 'sample' ? 'Sample Request' : 'D2C Direct Order'}
								</span>
								<span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 border border-slate-200">
									v{loadedVersion}
								</span>
							</div>
							<p className="text-xs text-slate-500">
								Manage fulfillment, verified payment ledger, and commercial specifications.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{isB2BOrder && (
							<>
								<button
									type="button"
									onClick={handleCopyQuoteLink}
									className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-100 transition cursor-pointer"
								>
									{copiedLink ? <FiCheck className="h-3.5 w-3.5 text-emerald-600" /> : <FiCopy className="h-3.5 w-3.5" />}
									<span>{copiedLink ? 'Link Copied!' : 'Copy Quote Link'}</span>
								</button>

								<a
									href={`/quote/${targetQuoteId}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
								>
									<FiExternalLink className="h-3.5 w-3.5" />
									<span>View Quote</span>
								</a>
							</>
						)}

						<button
							type="button"
							onClick={() => onOpenPrint(order)}
							className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
						>
							<FiPrinter className="h-3.5 w-3.5" />
							<span>Print Slip</span>
						</button>

						<button
							type="button"
							onClick={onClose}
							className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
						>
							<FiX className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* Modal Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{/* Status & Carrier Control Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
								Fulfillment Status
							</label>
							<select
								value={fulfillmentStatus}
								onChange={(e) => setFulfillmentStatus(e.target.value)}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden cursor-pointer"
							>
								<option value="PENDING">Pending Confirmation</option>
								<option value="CONFIRMED">Confirmed Order</option>
								<option value="PROCESSING">Processing / Packing</option>
								<option value="SHIPPING">Dispatched / Shipping</option>
								<option value="DELIVERED">Completed / Delivered</option>
								<option value="CANCELLED">Cancelled</option>
							</select>
						</div>

						{/* Read-only Ledger-Derived Payment Status + Record Payment Trigger */}
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
									Payment Ledger ({order.paymentMethod || 'MANUAL'})
								</label>
								<button
									type="button"
									onClick={() => {
										setPayAmount(balanceDue > 0 ? String(balanceDue) : '')
										setShowPaymentForm(!showPaymentForm)
									}}
									className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
								>
									<FiDollarSign className="h-3 w-3" />
									<span>Record Payment</span>
								</button>
							</div>
							<div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
								<span
									className={`font-black ${
										paymentStatus === 'PAID'
											? 'text-emerald-700'
											: paymentStatus === 'PARTIAL'
												? 'text-amber-700'
												: 'text-slate-700'
									}`}
								>
									{paymentStatus}
								</span>
								<span className="font-mono text-slate-600">
									Paid {formatPrice(paidCents / 100)} / {formatPrice(dynamicGrandTotal)}
								</span>
							</div>
						</div>

						{/* Carrier Select */}
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
								International Courier
							</label>
							<select
								value={carrier}
								onChange={(e) => setCarrier(e.target.value)}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden cursor-pointer"
							>
								<option value="">-- Select Courier --</option>
								{INTERNATIONAL_CARRIERS.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</select>
						</div>

						{/* Tracking Code */}
						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
									Tracking Number
								</label>
								{trackingCode && (
									<a
										href={`https://www.17track.net/en/track?nums=${encodeURIComponent(trackingCode)}`}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
									>
										<span>Track Package</span>
										<FiExternalLink className="h-3 w-3" />
									</a>
								)}
							</div>
							<input
								type="text"
								value={trackingCode}
								onChange={(e) => setTrackingCode(e.target.value)}
								placeholder="e.g. DHL984201479"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
							/>
						</div>
					</div>

					{/* Payment Recording Panel & Ledger History (DF-001) */}
					{(showPaymentForm || payments.length > 0) && (
						<div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
									<FiDollarSign className="h-4 w-4" />
									Payment Ledger & Settlement History
								</h4>
								<span className="font-mono text-xs font-bold text-emerald-800">
									Balance Due: {formatPrice(balanceDue)}
								</span>
							</div>

							{showPaymentForm && (
								<form onSubmit={handleRecordPayment} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-white p-3 rounded-xl border border-emerald-200 text-xs">
									<div>
										<label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Amount (USD)</label>
										<input
											type="number"
											step="0.01"
											min="0.01"
											required
											value={payAmount}
											onChange={(e) => setPayAmount(e.target.value)}
											className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono font-bold"
										/>
									</div>
									<div>
										<label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Method</label>
										<select
											value={payMethod}
											onChange={(e) => setPayMethod(e.target.value)}
											className="w-full rounded-lg border border-slate-300 px-2 py-1.5 font-medium"
										>
											<option value="wire_tt">T/T Wire Transfer</option>
											<option value="bank_transfer">Bank Transfer</option>
											<option value="lc">Letter of Credit (L/C)</option>
											<option value="cod">Cash on Delivery</option>
											<option value="card">Card / Gateway</option>
											<option value="manual">Manual Receipt</option>
										</select>
									</div>
									<div>
										<label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Bank / Receipt Ref *</label>
										<input
											type="text"
											required
											placeholder="e.g. TT-20261110-01"
											value={payReference}
											onChange={(e) => setPayReference(e.target.value)}
											className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono"
										/>
									</div>
									<div className="flex items-end gap-2">
										<button
											type="submit"
											disabled={isSaving}
											className="flex-1 rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white hover:bg-emerald-800 cursor-pointer disabled:opacity-50"
										>
											Commit Payment
										</button>
									</div>
								</form>
							)}

							{payments.length > 0 && (
								<div className="space-y-1.5 text-xs">
									{payments.map((p: any) => (
										<div key={p.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-emerald-100">
											<div>
												<span className="font-bold text-slate-900">
													{p.kind === 'refund' ? '-' : '+'}
													{formatPrice(p.amount)} ({p.method})
												</span>
												<span className="ml-2 font-mono text-[11px] text-slate-500">Ref: {p.reference}</span>
											</div>
											<span className="text-[11px] text-slate-500">
												{p.actorName} • {new Date(p.createdAt).toLocaleDateString()}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* B2B Quotation Engine & Draft Editor (Only for B2B RFQ orders) */}
					{isB2BOrder && (
						<div className="rounded-2xl border-2 border-blue-200 bg-linear-to-br from-blue-50/50 to-indigo-50/30 p-5 shadow-xs space-y-4">
							<div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
								<div className="flex items-center gap-2">
									<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
										<FiFileText className="h-4 w-4" />
									</div>
									<div>
										<h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
											B2B Commercial Quotation & Trade Terms
										</h4>
										<p className="text-[11px] text-slate-500">
											Price line items in DRAFT before issuing. Locked snapshots require moving back to DRAFT to revise.
										</p>
									</div>
								</div>

								<div className="flex items-center gap-2">
									{order.quoteApprovedAt ? (
										<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
											<FiShield className="h-3.5 w-3.5 text-emerald-600" />
											<span>Approved by {order.quoteApprovedBy || 'Buyer'}</span>
										</span>
									) : (
										<span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
											Status: {quoteStatus}
										</span>
									)}
									{isQuoteLocked && quoteStatus !== 'APPROVED' && (
										<button
											type="button"
											disabled={isSaving}
											onClick={handleMoveToDraft}
											className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
										>
											<FiRefreshCw className="h-3 w-3" />
											<span>Move to Draft to Revise</span>
										</button>
									)}
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
								<div>
									<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
										Ocean / Air Freight ($)
									</label>
									<div className="relative">
										<span className="absolute left-3 top-2 font-mono text-slate-400 font-bold">$</span>
										<input
											type="number"
											min="0"
											step="any"
											disabled={!isQuoteEditable}
											value={shippingFee}
											onChange={(e) => setShippingFee(Math.max(0, Number(e.target.value) || 0))}
											className="w-full rounded-xl border border-blue-200 bg-white pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 disabled:bg-slate-100"
										/>
									</div>
								</div>

								<div>
									<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
										Negotiated Discount ($)
									</label>
									<div className="relative">
										<span className="absolute left-3 top-2 font-mono text-slate-400 font-bold">-$</span>
										<input
											type="number"
											min="0"
											step="any"
											disabled={!isQuoteEditable}
											value={discount}
											onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
											className="w-full rounded-xl border border-blue-200 bg-white pl-8 pr-3 py-2 text-xs font-mono font-bold text-emerald-700 disabled:bg-slate-100"
										/>
									</div>
								</div>

								<div>
									<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
										Quotation Status
									</label>
									<select
										value={quoteStatus}
										disabled={quoteStatus === 'APPROVED'}
										onChange={(e) => setQuoteStatus(e.target.value)}
										className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 disabled:bg-slate-100 cursor-pointer"
									>
										<option value="DRAFT">Draft Estimate (Editable)</option>
										<option value="PENDING">Pending Review</option>
										<option value="SENT" disabled={hasUnpricedItems}>
											Issued / Sent to Buyer {hasUnpricedItems ? '(Price all items first)' : ''}
										</option>
										<option value="NEGOTIATING">In Negotiation</option>
										<option value="REJECTED">Declined / Rejected</option>
										<option value="CANCELLED">Cancelled</option>
										{quoteStatus === 'APPROVED' && <option value="APPROVED">Approved / Accepted</option>}
										{quoteStatus === 'REVISION_REQUESTED' && (
											<option value="REVISION_REQUESTED">Revision Requested</option>
										)}
										{quoteStatus === 'EXPIRED' && <option value="EXPIRED">Expired</option>}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
								<div>
									<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
										Incoterm (2020)
									</label>
									<select
										value={incoterm}
										disabled={!isQuoteEditable}
										onChange={(e) => setIncoterm(e.target.value)}
										className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 disabled:bg-slate-100"
									>
										{INCOTERMS.map((inc) => (
											<option key={inc} value={inc}>{inc}</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
										Destination Port
									</label>
									<input
										type="text"
										disabled={!isQuoteEditable}
										value={portOfDestination}
										onChange={(e) => setPortOfDestination(e.target.value)}
										placeholder="e.g. Hamburg Port"
										className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs disabled:bg-slate-100"
									/>
								</div>

								<div>
									<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
										Quotation Valid Until
									</label>
									<input
										type="date"
										disabled={!isQuoteEditable}
										value={quoteValidUntil}
										onChange={(e) => setQuoteValidUntil(e.target.value)}
										className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 disabled:bg-slate-100"
									/>
								</div>
							</div>

							<div>
								<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
									Export Payment Terms & Delivery Conditions
								</label>
								<div className="flex flex-col sm:flex-row gap-2">
									<input
										type="text"
										disabled={!isQuoteEditable}
										value={paymentTerms}
										onChange={(e) => setPaymentTerms(e.target.value)}
										placeholder="e.g. T/T 30% advance, 70% before shipment"
										className="flex-1 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 disabled:bg-slate-100"
									/>
									<input
										type="text"
										disabled={!isQuoteEditable}
										value={targetDeliveryDate}
										onChange={(e) => setTargetDeliveryDate(e.target.value)}
										placeholder="Lead time / target delivery date"
										className="sm:w-52 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs disabled:bg-slate-100"
									/>
								</div>
							</div>

							{/* Quote Action Bar */}
							<div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-blue-200/80">
								<div className="text-xs space-y-0.5">
									<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
										Proforma Total (USD)
									</span>
									<div className="flex items-center gap-2 font-mono">
										<span className="text-slate-600">{formatPrice(subtotal)} (Items)</span>
										<span className="text-blue-600">+{formatPrice(shippingFee)} (Freight)</span>
										{discount > 0 && <span className="text-emerald-700">-{formatPrice(discount)}</span>}
										<span className="text-slate-900 font-black text-sm">= {formatPrice(dynamicGrandTotal)}</span>
									</div>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									{['SENT', 'VIEWED', 'NEGOTIATING'].includes(quoteStatus) && (
										<button
											type="button"
											disabled={isSaving}
											onClick={handleAcceptQuote}
											className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
										>
											<FiCheck className="h-4 w-4" />
											<span>Accept Quote (Offline PO)</span>
										</button>
									)}

									{quoteStatus === 'APPROVED' &&
										['PENDING', 'CONFIRMED'].includes(fulfillmentStatus) && (
											<button
												type="button"
												disabled={isSaving}
												onClick={handleReleaseFulfillment}
												className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
											>
												<FiPackage className="h-4 w-4" />
												<span>Release to Warehouse</span>
											</button>
										)}
								</div>
							</div>
						</div>
					)}

					{/* Customer & Address Details */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
									<FiUser className="h-4 w-4 text-emerald-700" />
									<span>Customer & Recipient</span>
								</div>
								<button
									type="button"
									onClick={() => setIsEditingCustomer(!isEditingCustomer)}
									className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
								>
									{isEditingCustomer ? (
										<>
											<FiX className="h-3 w-3" />
											<span>Done Editing</span>
										</>
									) : (
										<>
											<FiEdit2 className="h-3 w-3" />
											<span>Edit Recipient</span>
										</>
									)}
								</button>
							</div>

							{isEditingCustomer ? (
								<div className="space-y-2.5 text-xs">
									<div>
										<label className="block text-[11px] font-bold text-slate-600 mb-1">Recipient Name:</label>
										<input
											type="text"
											value={customerName}
											onChange={(e) => setCustomerName(e.target.value)}
											className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
										/>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<div>
											<label className="block text-[11px] font-bold text-slate-600 mb-1">Phone:</label>
											<input
												type="text"
												value={customerPhone}
												onChange={(e) => setCustomerPhone(e.target.value)}
												className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
											/>
										</div>
										<div>
											<label className="block text-[11px] font-bold text-slate-600 mb-1">Email:</label>
											<input
												type="email"
												value={customerEmail}
												onChange={(e) => setCustomerEmail(e.target.value)}
												className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
											/>
										</div>
									</div>
									<div>
										<label className="block text-[11px] font-bold text-slate-600 mb-1">Shipping Address:</label>
										<input
											type="text"
											value={shippingAddress}
											onChange={(e) => setShippingAddress(e.target.value)}
											className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
										/>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<div>
											<label className="block text-[11px] font-bold text-slate-600 mb-1">City:</label>
											<input
												type="text"
												value={shippingCity}
												onChange={(e) => setShippingCity(e.target.value)}
												className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
											/>
										</div>
										<div>
											<label className="block text-[11px] font-bold text-slate-600 mb-1">Country:</label>
											<input
												type="text"
												value={shippingCountry}
												onChange={(e) => setShippingCountry(e.target.value)}
												className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
											/>
										</div>
									</div>
								</div>
							) : (
								<div className="space-y-2 text-xs">
									<div className="flex justify-between">
										<span className="text-slate-400">Full Name:</span>
										<span className="font-bold text-slate-900">{customerName || 'Customer'}</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-slate-400">Phone:</span>
										<div className="flex items-center gap-2">
											<span className="font-mono font-bold text-emerald-800">{customerPhone || 'No phone'}</span>
											{phoneClean && (
												<div className="flex items-center gap-1">
													<a href={`tel:${customerPhone}`} className="rounded-md bg-emerald-100 p-1 text-emerald-700"><FiPhone className="h-3 w-3" /></a>
													<a href={`https://wa.me/${phoneClean}`} target="_blank" rel="noopener noreferrer" className="rounded-md bg-green-100 p-1 text-green-700"><FaWhatsapp className="h-3 w-3" /></a>
												</div>
											)}
										</div>
									</div>
									{customerEmail && (
										<div className="flex justify-between items-center">
											<span className="text-slate-400">Email:</span>
											<div className="flex items-center gap-1.5">
												<span className="text-slate-700 truncate max-w-[180px]">{customerEmail}</span>
												<a href={`mailto:${customerEmail}`} className="rounded-md bg-slate-100 p-1 text-slate-600"><FiMail className="h-3 w-3" /></a>
											</div>
										</div>
									)}
									<div className="pt-2 border-t border-slate-100">
										<div className="flex justify-between items-center mb-1">
											<span className="text-slate-400">Shipping Address:</span>
											{shippingCountry && (
												<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{shippingCountry}</span>
											)}
										</div>
										<p className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
											{shippingAddress || 'No address provided'}{shippingCity ? `, ${shippingCity}` : ''}
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Order Summary & Customer Note */}
						<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs">
							<div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-xs uppercase tracking-wider">
								<FiTruck className="h-4 w-4 text-emerald-700" />
								<span>Order Summary & Notes</span>
							</div>
							<div className="space-y-2 text-xs">
								<div className="flex justify-between">
									<span className="text-slate-400">Items Subtotal:</span>
									<span className="font-mono font-bold text-slate-700">{formatPrice(subtotal)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-slate-400">Shipping Fee:</span>
									<span className="font-mono font-medium text-slate-700">
										{shippingFee ? formatPrice(shippingFee) : 'Free Shipping'}
									</span>
								</div>
								{discount > 0 && (
									<div className="flex justify-between text-emerald-700 font-medium">
										<span>Discount Applied:</span>
										<span className="font-mono">-{formatPrice(discount)}</span>
									</div>
								)}
								<div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
									<span className="font-bold text-slate-900">Total:</span>
									<span className="font-mono font-black text-emerald-700">{formatPrice(dynamicGrandTotal)}</span>
								</div>
								{order.customerNote && (
									<div className="mt-3 pt-2 border-t border-slate-100">
										<span className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mb-1">
											<FiFileText className="h-3 w-3" /> Customer Instruction:
										</span>
										<p className="italic text-slate-700 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80">
											&quot;{order.customerNote}&quot;
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Order Line Items Table (with Quote Draft Price & Qty Editor for B2B RFQ, DF-005) */}
					<div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
						<div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
							<span>Ordered Line Items ({editableItems.length})</span>
							{isB2BOrder && isQuoteEditable && (
								<span className="text-[10px] font-semibold text-blue-700">Draft Mode: Edit Unit Price & Qty</span>
							)}
						</div>
						<div className="divide-y divide-slate-100">
							{editableItems.map((item: any, idx: number) => {
								const price = Number(item.price) || 0
								const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1))
								return (
									<div key={idx} className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs">
										<div className="flex items-center gap-3 min-w-0">
											<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-mono font-bold text-slate-500">
												{idx + 1}
											</div>
											<div>
												<p className="font-bold text-slate-900 text-sm">{item.title || 'Product'}</p>
												{item.sku && <p className="text-[11px] font-mono text-slate-500">SKU: {item.sku}</p>}
												{price === 0 && (
													<span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
														Requires Custom Quote Price
													</span>
												)}
											</div>
										</div>

										{isB2BOrder && isQuoteEditable ? (
											<div className="flex items-center gap-2">
												<div>
													<label className="block text-[9px] font-bold uppercase text-slate-400">Unit $</label>
													<input
														type="number"
														min="0"
														step="0.01"
														value={price}
														onChange={(e) => {
															const nextVal = Math.max(0, Number(e.target.value) || 0)
															setEditableItems((prev) =>
																prev.map((row, i) => (i === idx ? { ...row, price: nextVal } : row)),
															)
														}}
														className="w-24 rounded-lg border border-blue-200 px-2 py-1 font-mono font-bold text-slate-900"
													/>
												</div>
												<div>
													<label className="block text-[9px] font-bold uppercase text-slate-400">Qty</label>
													<input
														type="number"
														min="1"
														step="1"
														value={quantity}
														onChange={(e) => {
															const nextQty = Math.max(1, Math.trunc(Number(e.target.value) || 1))
															setEditableItems((prev) =>
																prev.map((row, i) => (i === idx ? { ...row, quantity: nextQty } : row)),
															)
														}}
														className="w-20 rounded-lg border border-blue-200 px-2 py-1 font-mono font-bold text-slate-900"
													/>
												</div>
												<div className="text-right min-w-[80px]">
													<span className="block text-[9px] font-bold uppercase text-slate-400">Line Total</span>
													<span className="font-mono font-black text-emerald-700">{formatPrice(price * quantity)}</span>
												</div>
											</div>
										) : (
											<div className="text-right">
												<span className="font-mono font-bold text-slate-900 block">
													{formatPrice(price)} x {quantity}
												</span>
												<span className="font-mono font-black text-emerald-700 text-xs">
													= {formatPrice(price * quantity)}
												</span>
											</div>
										)}
									</div>
								)
							})}
						</div>
					</div>

					{/* Staff Internal Notes Section */}
					<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-3">
						<div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700">
							<FiClock className="h-4 w-4 text-slate-400" />
							<span>Internal Fulfillment & Audit Notes (Append-Only)</span>
						</div>

						<div className="space-y-2 max-h-40 overflow-y-auto">
							{safeNotes.length === 0 ? (
								<p className="text-xs text-slate-400 italic">No internal notes added yet.</p>
							) : (
								safeNotes.map((note: any, idx: number) => (
									<div key={note._key || idx} className="rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-200/60">
										<div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
											<span className="flex items-center gap-1"><FiUser className="h-3 w-3" /> {note.author || 'Staff'}</span>
											<span>
												{note.timestamp || note.createdAt
													? new Date(note.timestamp || note.createdAt).toLocaleDateString('en-US', {
															month: 'short',
															day: 'numeric',
															hour: '2-digit',
															minute: '2-digit',
														})
													: ''}
											</span>
										</div>
										<p className="text-slate-800 font-medium">{note.note || note.content}</p>
									</div>
								))
							)}
						</div>

						<div className="flex gap-2 pt-2 border-t border-slate-100">
							<input
								type="text"
								value={newNote}
								onChange={(e) => setNewNote(e.target.value)}
								placeholder="Add fulfillment or commercial note..."
								className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
							/>
						</div>
					</div>
				</div>

				{/* Modal Footer */}
				<div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3.5 sm:py-4">
					<div>
						{saveSuccess && (
							<span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
								<FiCheck className="h-4 w-4" /> {saveSuccess}
							</span>
						)}
						{saveError && (
							<span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-xl">
								{saveError}
							</span>
						)}
					</div>

					<div className="flex items-center gap-3 w-full sm:w-auto justify-end">
						{isSuperAdmin && onRequestDelete && (
							<button
								type="button"
								disabled={!deletionEligibility.eligible || isSaving}
								onClick={() =>
									onRequestDelete({
										...order,
										version: loadedVersion,
										paidCents,
										paymentStatus,
										payments,
										quoteStatus: isB2BOrder ? quoteStatus : order.quoteStatus,
										fulfillmentStatus,
									})
								}
								title={
									deletionEligibility.eligible
										? 'Delete Order (Super Admin)'
										: deletionEligibility.reason
								}
								className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
							>
								<FiTrash2 className="h-3.5 w-3.5" />
								<span>Delete</span>
							</button>
						)}

						<button
							type="button"
							onClick={onClose}
							className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer text-center"
						>
							Close
						</button>

						<button
							type="button"
							onClick={handleSaveChanges}
							disabled={isSaving}
							className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
						>
							<FiSave className="h-4 w-4" />
							<span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
