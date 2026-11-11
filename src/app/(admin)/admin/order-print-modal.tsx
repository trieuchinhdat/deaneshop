'use client'

import { FiPrinter, FiX } from 'react-icons/fi'
import { formatPrice } from '@/lib/utils'

type OrderPrintModalProps = {
	order?: any
	orders?: any[]
	onClose: () => void
	brandName?: string
	companyName?: string
	supportEmail?: string
}

export default function OrderPrintModal({
	order,
	orders,
	onClose,
	brandName,
	companyName,
	supportEmail,
}: OrderPrintModalProps) {
	const handlePrint = () => {
		window.print()
	}

	const brand = brandName || 'STORE'
	const storeTitle = companyName || `${brand} GLOBAL STORE`
	const emailContact = supportEmail || 'support@store.com'

	const orderList = Array.isArray(orders) && orders.length > 0
		? orders
		: order
			? [order]
			: []

	return (
		<div
			id="order-print-document"
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs print:static print:z-auto print:bg-white print:p-0 print:m-0 print:block"
		>
			<div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl print:max-h-none print:max-w-none print:w-full print:rounded-none print:border-none print:shadow-none print:overflow-visible print:p-0 print:m-0">
				{/* Non-printable Action Toolbar */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/90 px-4 sm:px-6 py-3 print:hidden">
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold tracking-wider text-slate-700 uppercase">
							{orderList.length > 1
								? `Bulk Packing Slips (${orderList.length} Orders - Standard A4/A5)`
								: 'Invoice & Packing Slip (Standard A4/A5)'}
						</span>
						{orderList.length > 1 && (
							<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
								1-Click All Slips
							</span>
						)}
					</div>
					<div className="flex items-center gap-2 self-end sm:self-auto">
						<button
							type="button"
							onClick={handlePrint}
							className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-95"
						>
							<FiPrinter className="h-4 w-4" />
							<span>Print {orderList.length > 1 ? `(${orderList.length})` : ''}</span>
						</button>
						<button
							type="button"
							onClick={onClose}
							className="flex h-9 w-9 min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200 active:scale-95"
							aria-label="Close Print Preview"
						>
							<FiX className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Printable A5/A4 Document Body */}
				<div className="flex-1 overflow-y-auto bg-white p-6 sm:p-8 text-black print:overflow-visible print:p-0">
					{orderList.map((ord, idx) => {
						const isLast = idx === orderList.length - 1
						const safeItems = Array.isArray(ord?.items) ? ord.items : []
						const formattedDate = ord?._createdAt
							? new Date(ord._createdAt).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric',
								})
							: new Date().toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric',
								})

						return (
							<div
								key={ord._id || ord.orderId || idx}
								className={`print:break-after-page ${
									!isLast ? 'mb-12 border-b-4 border-dashed border-slate-300 pb-10 print:mb-0 print:border-none print:pb-0' : ''
								}`}
							>
								{/* Header */}
								<div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 print:pb-2.5 avoid-break">
									<div>
										<h1 className="text-xl font-black tracking-tight text-slate-900 uppercase print:text-lg">
											{storeTitle}
										</h1>
										<p className="mt-0.5 text-[11px] text-slate-600 print:text-[10px]">
											Official Direct Fulfillment | {emailContact}
										</p>
										<p className="text-[11px] text-slate-600 print:text-[10px]">
											Origin: {brand} Fulfillment Hub
										</p>
									</div>
									<div className="text-right">
										<h2 className="text-sm font-black tracking-wider text-slate-900 uppercase print:text-xs">
											PACKING SLIP & INVOICE
										</h2>
										<p className="mt-0.5 font-mono text-sm font-bold text-slate-900 print:text-xs">
											#{ord.orderId || ord._id}
										</p>
										<p className="text-[11px] text-slate-500 print:text-[10px]">
											Date: {formattedDate}
										</p>
									</div>
								</div>

								{/* Recipient & Shipping Info */}
								<div className="grid grid-cols-2 gap-4 border-b border-slate-300 py-3 text-xs print:py-2.5 print:text-[11px] avoid-break">
									<div className="space-y-1 border-r border-slate-200 pr-3">
										<p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
											SHIP TO (RECIPIENT):
										</p>
										<p className="text-sm font-bold text-slate-900 print:text-xs">
											{ord.customer?.name || 'Valued Customer'}
										</p>
										{ord.customer?.phone && (
											<p className="font-mono font-bold text-slate-800 print:text-[11px]">
												Phone: {ord.customer.phone}
											</p>
										)}
										{ord.customer?.email && (
											<p className="text-slate-600 print:text-[10px]">
												Email: {ord.customer.email}
											</p>
										)}
										<p className="mt-1 leading-snug text-slate-700 print:text-[10px]">
											{ord.customer?.address || 'Standard Delivery Address'}
											{ord.customer?.city ? `, ${ord.customer.city}` : ''}
											{ord.customer?.state ? `, ${ord.customer.state}` : ''}
											{ord.customer?.postalCode ? ` ${ord.customer.postalCode}` : ''}
											{ord.customer?.country ? `, ${ord.customer.country}` : ''}
										</p>
									</div>

									<div className="space-y-1 pl-3">
										<p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
											SHIPPING & PAYMENT:
										</p>
										<p className="text-slate-700 print:text-[10px]">
											Courier:{' '}
											<strong>
												{ord.carrier || 'International Express Courier'}
											</strong>
										</p>
										{ord.trackingCode && (
											<p className="font-mono text-slate-700 print:text-[10px]">
												Tracking ID: <strong>{ord.trackingCode}</strong>
											</p>
										)}
										<p className="text-slate-700 print:text-[10px]">
											Payment Method:{' '}
											<strong>
												{ord.paymentMethod === 'COD'
													? 'Cash On Delivery (COD)'
													: ord.paymentMethod || 'Manual Fulfillment'}
											</strong>
										</p>
										<p className="text-slate-700 print:text-[10px]">
											Payment Status:{' '}
											<span className="font-bold text-slate-900 uppercase">
												{ord.paymentStatus || 'UNPAID'}
											</span>
										</p>
										{ord.customerNote && (
											<p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-[10px] text-slate-600 italic">
												Note: &quot;{ord.customerNote}&quot;
											</p>
										)}
									</div>
								</div>

								{/* Product Line Items Table */}
								<div className="py-3 print:py-2">
									<table className="w-full border-collapse border border-slate-300 text-left text-xs print:text-[11px]">
										<thead>
											<tr className="border-b border-slate-300 bg-slate-100 font-bold text-slate-800 print:bg-slate-100">
												<th className="border-r border-slate-300 p-1.5 print:p-1">
													#
												</th>
												<th className="border-r border-slate-300 p-1.5 print:p-1">
													Item Description
												</th>
												<th className="border-r border-slate-300 p-1.5 text-center print:p-1">
													Qty
												</th>
												<th className="border-r border-slate-300 p-1.5 text-right print:p-1">
													Unit Price
												</th>
												<th className="p-1.5 text-right print:p-1">Amount</th>
											</tr>
										</thead>
										<tbody>
											{safeItems.map((item: any, iIndex: number) => {
												const quantity = Number(item.quantity) || 1
												const price = Number(item.price) || 0
												return (
													<tr
														key={item.id || item._key || iIndex}
														className="border-b border-slate-200 text-slate-800 print:border-slate-300"
													>
														<td className="border-r border-slate-300 p-1.5 text-center font-mono text-[11px] text-slate-500 print:p-1 print:text-[10px]">
															{iIndex + 1}
														</td>
														<td className="border-r border-slate-300 p-1.5 print:p-1">
															<p className="font-bold text-slate-900 print:text-[11px]">
																{item.title || 'Product Item'}
															</p>
															{item.sku && (
																<span className="font-mono text-[10px] text-slate-400 print:text-[9px]">
																	SKU: {item.sku}
																</span>
															)}
															{item.selectedOptions && (
																<span className="ml-2 text-[10px] text-slate-500 print:text-[9px]">
																	{typeof item.selectedOptions === 'object'
																		? Object.entries(item.selectedOptions)
																				.map(([k, v]) => `${k}: ${v}`)
																				.join(', ')
																		: JSON.stringify(item.selectedOptions)}
																</span>
															)}
														</td>
														<td className="border-r border-slate-300 p-1.5 text-center font-mono font-bold print:p-1 print:text-[10px]">
															{quantity}
														</td>
														<td className="border-r border-slate-300 p-1.5 text-right font-mono print:p-1 print:text-[10px]">
															{formatPrice(price)}
														</td>
														<td className="p-1.5 text-right font-mono font-bold print:p-1 print:text-[10px]">
															{formatPrice(price * quantity)}
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>

								{/* Financial Summary */}
								<div className="flex items-start justify-between border-b border-slate-300 pt-2 pb-3 print:pb-2.5 avoid-break">
									<div className="max-w-xs text-[10px] leading-snug text-slate-500">
										<p className="font-medium">
											• Thank you for shopping with {brand}.
										</p>
										<p>• Please inspect contents upon delivery.</p>
										<p>
											• For inquiries or claims, contact {emailContact} within
											48 hours.
										</p>
									</div>

									<div className="w-56 space-y-1 text-xs print:text-[11px]">
										<div className="flex justify-between">
											<span className="text-slate-600">Subtotal:</span>
											<span className="font-mono">
												{formatPrice(
													ord.pricing?.subtotal ||
														ord.pricing?.grandTotal ||
														ord.total ||
														0,
												)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-600">Shipping:</span>
											<span className="font-mono">
												{ord.pricing?.shippingFee
													? formatPrice(ord.pricing.shippingFee)
													: '$0.00'}
											</span>
										</div>
										{Number(ord.pricing?.discount) > 0 && (
											<div className="flex justify-between text-emerald-700">
												<span>Discount:</span>
												<span className="font-mono">
													-{formatPrice(ord.pricing.discount)}
												</span>
											</div>
										)}
										<div className="flex items-baseline justify-between border-t-2 border-slate-900 pt-1.5 text-xs font-black print:text-xs">
											<span className="uppercase">Total Amount:</span>
											<span className="font-mono text-sm font-black text-slate-900">
												{formatPrice(ord.pricing?.grandTotal || ord.total || 0)}
											</span>
										</div>
									</div>
								</div>

								{/* Signature Blocks */}
								<div className="grid grid-cols-2 gap-8 pt-4 text-center text-xs font-bold avoid-break print:pt-3">
									<div>
										<p className="text-[10px] tracking-wider text-slate-500 uppercase">
											PACKED & VERIFIED BY
										</p>
										<p className="mt-0.5 text-[9px] font-normal text-slate-400 italic">
											(Signature & Date)
										</p>
										<div className="h-10 print:h-8" />
									</div>
									<div>
										<p className="text-[10px] tracking-wider text-slate-500 uppercase">
											RECIPIENT ACKNOWLEDGMENT
										</p>
										<p className="mt-0.5 text-[9px] font-normal text-slate-400 italic">
											(Signature & Date)
										</p>
										<div className="h-10 print:h-8" />
									</div>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
