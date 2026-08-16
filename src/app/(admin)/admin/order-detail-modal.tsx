'use client'

import { useState } from 'react'
import {
	FiAlertCircle,
	FiCheck,
	FiClock,
	FiPackage,
	FiPhone,
	FiPrinter,
	FiSave,
	FiTruck,
	FiUser,
	FiX,
	FiXCircle,
} from 'react-icons/fi'
import { formatVND } from '@/lib/utils'

type OrderDetailModalProps = {
	order: any
	onClose: () => void
	onOrderUpdated: (updatedOrder: any) => void
	onOpenPrint: (order: any) => void
}

const CARRIER_OPTIONS = [
	'Giao Hàng Tiết Kiệm (GHTK)',
	'Giao Hàng Nhanh (GHN)',
	'Viettel Post',
	'VNPost / EMS',
	'J&T Express',
	'Ninja Van',
	'GrabExpress / Ahamove (Hỏa tốc)',
	'Shipper nội bộ shop',
]

export default function OrderDetailModal({
	order,
	onClose,
	onOrderUpdated,
	onOpenPrint,
}: OrderDetailModalProps) {
	const [fulfillmentStatus, setFulfillmentStatus] = useState(
		order.fulfillmentStatus || 'PENDING',
	)
	const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'UNPAID')
	const [carrier, setCarrier] = useState(order.carrier || '')
	const [trackingCode, setTrackingCode] = useState(order.trackingCode || '')
	const [newNote, setNewNote] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)

	const safeItems = Array.isArray(order?.items) ? order.items : []
	const safeNotes = Array.isArray(order?.internalNotes) ? order.internalNotes : []

	const handleSaveChanges = async () => {
		try {
			setIsSaving(true)
			setSaveSuccess(false)

			const res = await fetch('/api/orders/update-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					docId: order._id,
					fulfillmentStatus,
					paymentStatus,
					carrier,
					trackingCode,
					internalNote: newNote.trim() ? newNote.trim() : undefined,
					author: 'Admin CSKH',
				}),
			})

			const data = await res.json()
			if (data.success) {
				setSaveSuccess(true)
				const updated = {
					...order,
					fulfillmentStatus,
					paymentStatus,
					carrier,
					trackingCode,
					internalNotes: newNote.trim()
						? [
								...safeNotes,
								{
									_key: Math.random().toString(),
									author: 'Admin CSKH',
									content: newNote.trim(),
									createdAt: new Date().toISOString(),
								},
							]
						: safeNotes,
				}
				onOrderUpdated(updated)
				setNewNote('')
				setTimeout(() => setSaveSuccess(false), 2500)
			}
		} catch (err) {
			console.error('Update order failed:', err)
		} finally {
			setIsSaving(false)
		}
	}

	const phoneClean = order?.customer?.phone?.replace(/\D/g, '')

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold shadow-xs">
							<FiPackage className="h-5 w-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="font-mono text-base sm:text-lg font-black text-slate-900">
									Đơn hàng #{order.orderId}
								</h3>
								<span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
									{order._createdAt ? new Date(order._createdAt).toLocaleString('vi-VN') : ''}
								</span>
							</div>
							<p className="text-xs text-slate-500">
								Chi tiết người nhận, sản phẩm, vận chuyển và lịch sử xử lý đơn.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => onOpenPrint(order)}
							className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
						>
							<FiPrinter className="h-3.5 w-3.5" />
							<span>In Phiếu A5</span>
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
						{/* Left: Fulfillment Status */}
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
								Trạng Thái Giao Hàng
							</label>
							<select
								value={fulfillmentStatus}
								onChange={(e) => setFulfillmentStatus(e.target.value)}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden cursor-pointer"
							>
								<option value="PENDING">⏳ Chờ xác nhận (Pending)</option>
								<option value="CONFIRMED">📞 Đã gọi xác nhận (Confirmed)</option>
								<option value="PROCESSING">📦 Đang đóng gói (Processing)</option>
								<option value="SHIPPING">🚚 Đang giao hàng (Shipping)</option>
								<option value="DELIVERED">✅ Giao thành công (Delivered)</option>
								<option value="CANCELLED">❌ Đã hủy đơn (Cancelled)</option>
								<option value="RETURNED">🔄 Chuyển hoàn / Trả hàng (Returned)</option>
							</select>
						</div>

						{/* Right: Payment Status */}
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
								Thanh Toán ({order.paymentMethod === 'COD' ? 'Thu hộ COD' : order.paymentMethod})
							</label>
							<select
								value={paymentStatus}
								onChange={(e) => setPaymentStatus(e.target.value)}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden cursor-pointer"
							>
								<option value="UNPAID">🔴 Chưa thanh toán (Chờ thu COD)</option>
								<option value="PAID">🟢 Đã thanh toán (Paid)</option>
								<option value="REFUNDED">⚪ Đã hoàn tiền (Refunded)</option>
							</select>
						</div>

						{/* Carrier Select */}
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
								Đơn Vị Vận Chuyển
							</label>
							<select
								value={carrier}
								onChange={(e) => setCarrier(e.target.value)}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden cursor-pointer"
							>
								<option value="">-- Chọn đơn vị vận chuyển --</option>
								{CARRIER_OPTIONS.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</select>
						</div>

						{/* Tracking Code */}
						<div>
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
								Mã Vận Đơn (Tracking Code)
							</label>
							<input
								type="text"
								value={trackingCode}
								onChange={(e) => setTrackingCode(e.target.value)}
								placeholder="VD: GHTK893201479..."
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
							/>
						</div>
					</div>

					{/* Customer & Address Details */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Customer Info Card */}
						<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs">
							<div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-xs uppercase tracking-wider">
								<FiUser className="h-4 w-4 text-emerald-700" />
								<span>Thông Tin Người Nhận</span>
							</div>

							<div className="space-y-2 text-xs">
								<div className="flex justify-between">
									<span className="text-slate-400">Họ và tên:</span>
									<span className="font-bold text-slate-900">{order.customer?.name || 'Khách vãng lai'}</span>
								</div>

								<div className="flex justify-between items-center">
									<span className="text-slate-400">Số điện thoại:</span>
									<div className="flex items-center gap-2">
										<span className="font-mono font-bold text-emerald-800">{order.customer?.phone}</span>
										{phoneClean && (
											<a
												href={`tel:${order.customer?.phone}`}
												className="rounded-md bg-emerald-100 p-1 text-emerald-700 hover:bg-emerald-200"
												title="Gọi điện"
											>
												<FiPhone className="h-3 w-3" />
											</a>
										)}
									</div>
								</div>

								{order.customer?.email && (
									<div className="flex justify-between">
										<span className="text-slate-400">Email:</span>
										<span className="text-slate-700 truncate max-w-[200px]">{order.customer.email}</span>
									</div>
								)}

								<div className="pt-2 border-t border-slate-100">
									<span className="text-slate-400 block mb-1">Địa chỉ giao hàng:</span>
									<p className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
										{order.customer?.address || 'Chưa có thông tin'}
									</p>
								</div>
							</div>
						</div>

						{/* Order Summary & Customer Note */}
						<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs">
							<div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-xs uppercase tracking-wider">
								<FiTruck className="h-4 w-4 text-emerald-700" />
								<span>Ghi Chú & Chi Phí Đơn</span>
							</div>

							<div className="space-y-2 text-xs">
								<div className="flex justify-between">
									<span className="text-slate-400">Tạm tính hàng:</span>
									<span className="font-mono font-bold text-slate-700">
										{formatVND(order.pricing?.subtotal || order.pricing?.grandTotal || 0)}
									</span>
								</div>

								<div className="flex justify-between">
									<span className="text-slate-400">Phí vận chuyển:</span>
									<span className="font-mono font-medium text-slate-700">
										{order.pricing?.shippingFee ? formatVND(order.pricing.shippingFee) : 'Miễn phí'}
									</span>
								</div>

								{order.pricing?.discountTotal > 0 && (
									<div className="flex justify-between text-amber-700 font-medium">
										<span>Giảm giá khuyến mãi:</span>
										<span className="font-mono">-{formatVND(order.pricing.discountTotal)}</span>
									</div>
								)}

								<div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
									<span className="font-bold text-slate-900">Tổng thu tiền:</span>
									<span className="font-mono font-black text-emerald-700">
										{formatVND(order.pricing?.grandTotal || 0)}
									</span>
								</div>

								{order.customerNote && (
									<div className="mt-3 pt-2 border-t border-slate-100">
										<span className="text-[11px] font-bold text-amber-800 block mb-1">
											📝 Lời nhắn của khách hàng:
										</span>
										<p className="italic text-slate-700 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80">
											"{order.customerNote}"
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Order Items Table */}
					<div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
						<div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
							Danh Sách Sản Phẩm Đã Đặt ({safeItems.length})
						</div>
						<div className="divide-y divide-slate-100">
							{safeItems.map((item: any, idx: number) => (
								<div key={idx} className="flex items-center justify-between p-4 text-xs">
									<div className="flex items-center gap-3">
										<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 font-mono font-bold text-slate-500">
											{idx + 1}
										</div>
										<div>
											<p className="font-bold text-slate-900 text-sm">{item.title || 'Sản phẩm'}</p>
											{item.selectedOptions && (
												<p className="text-[11px] text-slate-400 mt-0.5">
													Phân loại: {JSON.stringify(item.selectedOptions)}
												</p>
											)}
										</div>
									</div>

									<div className="text-right">
										<span className="font-mono font-bold text-slate-900 block">
											{formatVND(item.price || 0)} x {item.quantity || 1}
										</span>
										<span className="font-mono font-black text-emerald-700 text-xs">
											= {formatVND((item.price || 0) * (item.quantity || 1))}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* CSKH Internal Notes Section */}
					<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-3">
						<div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700">
							<FiClock className="h-4 w-4 text-slate-400" />
							<span>Nhật Ký & Ghi Chú CSKH Nội Bộ</span>
						</div>

						{/* Existing Notes */}
						<div className="space-y-2 max-h-40 overflow-y-auto">
							{safeNotes.length === 0 ? (
								<p className="text-xs text-slate-400 italic">Chưa có ghi chú nội bộ nào.</p>
							) : (
								safeNotes.map((note: any, idx: number) => (
									<div key={idx} className="rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-200/60">
										<div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
											<span>👤 {note.author || 'Admin'}</span>
											<span>{note.createdAt ? new Date(note.createdAt).toLocaleString('vi-VN') : ''}</span>
										</div>
										<p className="text-slate-800 font-medium">{note.content}</p>
									</div>
								))
							)}
						</div>

						{/* Add New Note */}
						<div className="flex gap-2 pt-2 border-t border-slate-100">
							<input
								type="text"
								value={newNote}
								onChange={(e) => setNewNote(e.target.value)}
								placeholder="Thêm ghi chú CSKH (vd: Khách hẹn giao sau 5h chiều, đã nhận cọc...)"
								className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
							/>
						</div>
					</div>
				</div>

				{/* Modal Footer */}
				<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
					<div>
						{saveSuccess && (
							<span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl animate-in fade-in">
								<FiCheck className="h-4 w-4" /> Đã lưu thông tin đơn hàng thành công!
							</span>
						)}
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={onClose}
							className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
						>
							Đóng
						</button>

						<button
							type="button"
							onClick={handleSaveChanges}
							disabled={isSaving}
							className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
						>
							<FiSave className="h-4 w-4" />
							<span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
