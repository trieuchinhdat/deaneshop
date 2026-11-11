'use client'

import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi'
import { getAdminOrderDeletionEligibility } from '@/lib/order-domain'
import { formatPrice } from '@/lib/utils'

type OrderDeleteModalProps = {
	orders: any[]
	isOpen: boolean
	isDeleting: boolean
	errorMessage?: string | null
	onClose: () => void
	onConfirm: (payload: { reason: string; confirmText: string }) => void
}

export default function OrderDeleteModal({
	orders,
	isOpen,
	isDeleting,
	errorMessage,
	onClose,
	onConfirm,
}: OrderDeleteModalProps) {
	const [reason, setReason] = useState('')
	const [confirmText, setConfirmText] = useState('')

	const isSingle = orders.length === 1
	const singleOrder = isSingle ? orders[0] : null
	const expectedConfirmToken = isSingle ? String(singleOrder?.orderId || singleOrder?._id || '') : 'DELETE'

	useEffect(() => {
		if (isOpen) {
			setReason('')
			setConfirmText('')
		}
	}, [isOpen, expectedConfirmToken, orders.length])

	if (!isOpen || orders.length === 0) return null

	const evaluated = orders.map((order) => ({
		order,
		eligibility: getAdminOrderDeletionEligibility(order),
	}))
	const eligibleCount = evaluated.filter((item) => item.eligibility.eligible).length
	const ineligibleItems = evaluated.filter((item) => !item.eligibility.eligible)

	const isConfirmed =
		eligibleCount > 0 && confirmText.trim() === expectedConfirmToken && !isDeleting

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!isConfirmed) return
		onConfirm({ reason: reason.trim(), confirmText: confirmText.trim() })
	}

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs animate-in fade-in duration-150 print:hidden"
			onClick={() => !isDeleting && onClose()}
		>
			<div
				className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
				onClick={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					disabled={isDeleting}
					onClick={onClose}
					aria-label="Close delete confirmation"
					className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
				>
					<FiX className="h-4 w-4" />
				</button>

				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					<div className="flex items-start gap-3.5">
						<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
							<FiAlertTriangle className="h-5 w-5" />
						</div>
						<div className="min-w-0 pr-6">
							<span className="inline-block rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-black tracking-wider text-rose-700 uppercase">
								Super Admin Action
							</span>
							<h3 className="mt-1 text-base font-black text-slate-900">
								{isSingle
									? `Delete Order #${singleOrder?.orderId || singleOrder?._id}`
									: `Delete ${orders.length} Selected Orders`}
							</h3>
							<p className="mt-1 text-xs leading-relaxed text-slate-500">
								Orders are soft-deleted from active operations, KPIs, and buyer links while preserving immutable quotation snapshots and audit history. Only unpaid, unapproved orders not in transit or delivered can be deleted.
							</p>
						</div>
					</div>

					{isSingle && singleOrder && (
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-slate-500">Customer:</span>
								<span className="font-bold text-slate-900">
									{singleOrder.customer?.name || 'Guest Customer'}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-slate-500">Amount / Payment:</span>
								<span className="font-mono font-bold text-slate-900">
									{formatPrice(singleOrder.pricing?.grandTotal || 0)} •{' '}
									{singleOrder.paymentStatus || 'UNPAID'}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-slate-500">Fulfillment / Quote:</span>
								<span className="font-mono font-bold text-slate-700">
									{singleOrder.fulfillmentStatus || 'PENDING'}
									{singleOrder.quoteStatus ? ` • Quote ${singleOrder.quoteStatus}` : ''}
								</span>
							</div>
						</div>
					)}

					{ineligibleItems.length > 0 && (
						<div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
							<p className="font-bold">
								{ineligibleItems.length} order(s) cannot be deleted due to payment, quote approval, or delivery restrictions:
							</p>
							<ul className="list-disc pl-4 space-y-0.5 text-[11px]">
								{ineligibleItems.slice(0, 4).map(({ order, eligibility }) => (
									<li key={order._id || order.orderId}>
										<span className="font-mono font-bold">{order.orderId || order._id}</span>:{' '}
										{eligibility.reason}
									</li>
								))}
								{ineligibleItems.length > 4 && (
									<li>...and {ineligibleItems.length - 4} more</li>
								)}
							</ul>
						</div>
					)}

					{eligibleCount > 0 && (
						<>
							<div>
								<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
									Deletion Reason (Audit Log, Optional)
								</label>
								<input
									type="text"
									maxLength={500}
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									placeholder="e.g. Duplicate test submission or cancelled spam order"
									className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-rose-500 focus:outline-hidden"
								/>
							</div>

							<div>
								<label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
									Type <span className="font-mono text-rose-700 select-all">{expectedConfirmToken}</span> to confirm
								</label>
								<input
									type="text"
									value={confirmText}
									onChange={(e) => setConfirmText(e.target.value)}
									placeholder={expectedConfirmToken}
									autoFocus
									className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-900 focus:border-rose-600 focus:outline-hidden"
								/>
							</div>
						</>
					)}

					{errorMessage && (
						<div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
							{errorMessage}
						</div>
					)}

					<div className="flex items-center justify-end gap-2.5 pt-2">
						<button
							type="button"
							disabled={isDeleting}
							onClick={onClose}
							className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!isConfirmed}
							className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
						>
							{isDeleting ? (
								<>
									<FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
									<span>Deleting...</span>
								</>
							) : (
								<>
									<FiTrash2 className="h-3.5 w-3.5" />
									<span>
										{isSingle
											? 'Confirm Delete Order'
											: `Delete ${eligibleCount} Eligible Order(s)`}
									</span>
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

