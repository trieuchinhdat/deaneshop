'use client'

import {
	FiCalendar,
	FiCheckCircle,
	FiClock,
	FiMail,
	FiMapPin,
	FiPackage,
	FiPhone,
	FiShoppingBag,
	FiTrendingUp,
	FiTruck,
	FiUser,
	FiX,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { formatPrice } from '@/lib/utils'

interface CustomerDetailModalProps {
	customer: any
	onClose: () => void
	onOpenPrintOrder?: (order: any) => void
}

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
	PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
	PROCESSING: { label: 'Processing', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
	CONFIRMED: { label: 'Confirmed', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
	SHIPPING: { label: 'In Transit', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
	DELIVERED: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
	CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
	RETURNED: { label: 'Returned', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

export default function CustomerDetailModal({
	customer,
	onClose,
	onOpenPrintOrder,
}: CustomerDetailModalProps) {
	if (!customer) return null

	const phoneClean = customer?.phone?.replace(/\D/g, '')
	const orderList = Array.isArray(customer?.orders) ? customer.orders : []
	const isRepeatBuyer = (customer.orderCount || 0) > 1

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 print:hidden">
			<div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold shadow-xs shrink-0">
							<FiUser className="h-5 w-5" />
						</div>
						<div>
							<div className="flex items-center gap-2 flex-wrap">
								<h3 className="text-base sm:text-lg font-black text-slate-900">
									{customer.name || 'Guest Buyer'}
								</h3>
								<span
									className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
										isRepeatBuyer
											? 'bg-purple-50 text-purple-700 border-purple-200'
											: 'bg-slate-100 text-slate-700 border-slate-200'
									}`}
								>
									{isRepeatBuyer ? 'Repeat Buyer' : 'First-Time Buyer'}
								</span>
							</div>
							<p className="text-xs text-slate-500">
								{customer.phone ? `${customer.phone} • ` : ''}
								{customer.email || 'Retail Store Customer'}
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition active:scale-95 cursor-pointer"
						aria-label="Close dialog"
					>
						<FiX className="h-5 w-5" />
					</button>
				</div>

				{/* Modal Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{/* KPI Profile Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						{/* Orders Placed */}
						<div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
							<div className="flex items-center justify-between">
								<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
									Total Orders
								</span>
								<FiShoppingBag className="h-4 w-4 text-slate-500" />
							</div>
							<p className="mt-1 font-mono text-2xl font-black text-slate-900">
								{customer.orderCount || 1}
							</p>
							<span className="text-[10px] text-slate-500 font-medium">
								{isRepeatBuyer ? 'Verified loyal buyer' : 'Single purchase'}
							</span>
						</div>

						{/* Total Lifetime Value */}
						<div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
							<div className="flex items-center justify-between">
								<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
									Lifetime Value (LTV)
								</span>
								<FiTrendingUp className="h-4 w-4 text-emerald-600" />
							</div>
							<p className="mt-1 font-mono text-2xl font-black text-emerald-700">
								{formatPrice(customer.totalSpent || 0)}
							</p>
							<span className="text-[10px] text-emerald-600 font-bold">
								Realized store sales
							</span>
						</div>

						{/* Quick Outreach */}
						<div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between">
							<div className="flex items-center justify-between">
								<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
									Direct Contact
								</span>
								<FiPhone className="h-4 w-4 text-blue-500" />
							</div>
							<div className="flex items-center gap-2 mt-2">
								{customer.phone && (
									<a
										href={`tel:${customer.phone}`}
										className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold transition hover:bg-slate-800"
									>
										<FiPhone className="h-3.5 w-3.5" />
										<span>Call</span>
									</a>
								)}
								{phoneClean && (
									<a
										href={`https://wa.me/${phoneClean}`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold transition hover:bg-emerald-700"
									>
										<FaWhatsapp className="h-3.5 w-3.5" />
										<span>WA</span>
									</a>
								)}
							</div>
						</div>
					</div>

					{/* Delivery Address Card */}
					<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-1.5">
						<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
							<FiMapPin className="h-4 w-4 text-slate-500" />
							<span>Default Shipping Address</span>
						</div>
						<p className="text-xs text-slate-700 font-medium pl-6 leading-relaxed">
							{customer.address ? (
								<>
									{customer.address}
									{customer.city ? `, ${customer.city}` : ''}
									{customer.country ? `, ${customer.country}` : ''}
									{customer.postalCode ? ` (${customer.postalCode})` : ''}
								</>
							) : (
								<span className="text-slate-400 italic">No address on file</span>
							)}
						</p>
					</div>

					{/* Purchase History Orders List */}
					<div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs space-y-0">
						<div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<FiPackage className="h-4 w-4 text-slate-600" />
								<span className="font-bold text-xs uppercase tracking-wider text-slate-800">
									Purchase Order History ({orderList.length})
								</span>
							</div>
						</div>

						{orderList.length === 0 ? (
							<div className="p-8 text-center text-xs text-slate-400">
								No direct orders recorded for this profile.
							</div>
						) : (
							<div className="divide-y divide-slate-100">
								{orderList.map((ord: any) => {
									const statusBadge =
										STATUS_BADGES[ord.fulfillmentStatus] || STATUS_BADGES.PENDING
									const orderTotal = Number(ord.pricing?.grandTotal) || Number(ord.total) || 0

									return (
										<div
											key={ord._id}
											className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
										>
											<div className="space-y-1 min-w-0 flex-1">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="font-mono font-black text-sm text-slate-900">
														#{ord.orderId || ord._id.slice(0, 8)}
													</span>
													<span
														className={`rounded-full px-2 py-0.2 text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
													>
														{statusBadge.label}
													</span>
													<span className="text-[11px] text-slate-400">
														{ord._createdAt
															? new Date(ord._createdAt).toLocaleDateString('en-US', {
																	month: 'short',
																	day: 'numeric',
																	year: 'numeric',
																})
															: ''}
													</span>
												</div>

												<div className="text-slate-600 truncate">
													{(Array.isArray(ord.items) ? ord.items : [])
														.map((it: any) => `${it?.title || 'Product'} (x${it?.quantity || 1})`)
														.join(', ') || '1 item'}
												</div>
											</div>

											<div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
												<span className="font-mono font-black text-sm text-slate-900">
													{formatPrice(orderTotal)}
												</span>

												{onOpenPrintOrder && (
													<button
														type="button"
														onClick={() => onOpenPrintOrder(ord)}
														className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
													>
														Print Slip
													</button>
												)}
											</div>
										</div>
									)
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
