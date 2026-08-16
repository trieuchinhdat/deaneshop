'use client'

import { FiPrinter, FiX } from 'react-icons/fi'
import { formatVND } from '@/lib/utils'

type OrderPrintModalProps = {
	order: any
	onClose: () => void
}

export default function OrderPrintModal({ order, onClose }: OrderPrintModalProps) {
	const handlePrint = () => {
		window.print()
	}

	const safeItems = Array.isArray(order?.items) ? order.items : []

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
			<div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
				{/* Non-printable Action Toolbar */}
				<div className="print:hidden flex items-center justify-between border-b border-slate-200 bg-slate-100/80 px-6 py-3">
					<span className="font-bold text-xs text-slate-600 uppercase tracking-wider">
						Xem Trước Phiếu Giao Hàng & Thu Tiền (Khổ A5 Chuẩn)
					</span>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handlePrint}
							className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95 cursor-pointer"
						>
							<FiPrinter className="h-4 w-4" />
							<span>In Phiếu Ngay</span>
						</button>
						<button
							type="button"
							onClick={onClose}
							className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200 transition cursor-pointer"
						>
							<FiX className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Printable A5 Document Body */}
				<div className="flex-1 overflow-y-auto p-8 text-black bg-white print:p-0 print:overflow-visible">
					{/* Header */}
					<div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
						<div>
							<h1 className="text-xl font-black tracking-tight">ECOCROS STORE</h1>
							<p className="text-[11px] text-slate-600 mt-0.5">Hotline: 0900.000.000 | Website: ecocros.vn</p>
							<p className="text-[11px] text-slate-600">Địa chỉ gửi: Kho tổng ECOCROS</p>
						</div>
						<div className="text-right">
							<h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
								PHIẾU GIAO HÀNG (COD)
							</h2>
							<p className="font-mono font-bold text-sm text-slate-900 mt-0.5">#{order.orderId}</p>
							<p className="text-[10px] text-slate-500">
								Ngày: {order._createdAt ? new Date(order._createdAt).toLocaleDateString('vi-VN') : ''}
							</p>
						</div>
					</div>

					{/* Recipient & Sender Info */}
					<div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-300 text-xs">
						<div className="border-r border-slate-200 pr-3 space-y-1">
							<p className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
								NGƯỜI NHẬN HÀNG:
							</p>
							<p className="font-bold text-sm text-slate-900">{order.customer?.name || 'Khách vãng lai'}</p>
							<p className="font-mono font-bold text-slate-800">SĐT: {order.customer?.phone}</p>
							<p className="text-slate-700 leading-snug mt-1">{order.customer?.address}</p>
						</div>

						<div className="pl-3 space-y-1">
							<p className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
								VẬN CHUYỂN & THANH TOÁN:
							</p>
							<p className="text-slate-700">
								Đơn vị: <strong>{order.carrier || 'Giao Tiết Kiệm'}</strong>
							</p>
							{order.trackingCode && (
								<p className="font-mono text-slate-700">
									Mã VĐ: <strong>{order.trackingCode}</strong>
								</p>
							)}
							<p className="text-slate-700">
								Hình thức: <strong>{order.paymentMethod === 'COD' ? 'Thu hộ COD khi nhận' : order.paymentMethod}</strong>
							</p>
							{order.customerNote && (
								<p className="italic text-slate-600 bg-slate-50 p-1.5 rounded-lg text-[11px] mt-1 border border-slate-200">
									Ghi chú: "{order.customerNote}"
								</p>
							)}
						</div>
					</div>

					{/* Product Table */}
					<div className="py-4">
						<table className="w-full text-left text-xs border-collapse border border-slate-300">
							<thead>
								<tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
									<th className="p-2 border-r border-slate-300 w-8 text-center">STT</th>
									<th className="p-2 border-r border-slate-300">Tên Sản Phẩm</th>
									<th className="p-2 border-r border-slate-300 text-center w-12">SL</th>
									<th className="p-2 border-r border-slate-300 text-right w-24">Đơn Giá</th>
									<th className="p-2 text-right w-24">Thành Tiền</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200">
								{safeItems.map((item: any, idx: number) => (
									<tr key={idx} className="border-b border-slate-200">
										<td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
										<td className="p-2 border-r border-slate-300">
											<span className="font-bold">{item.title || 'Sản phẩm'}</span>
										</td>
										<td className="p-2 border-r border-slate-300 text-center font-bold font-mono">
											{item.quantity || 1}
										</td>
										<td className="p-2 border-r border-slate-300 text-right font-mono">
											{formatVND(item.price || 0)}
										</td>
										<td className="p-2 text-right font-mono font-bold">
											{formatVND((item.price || 0) * (item.quantity || 1))}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Total Calculation & Big COD box */}
					<div className="flex justify-between items-start pt-2 pb-6 border-b border-slate-300">
						<div className="text-[11px] text-slate-500 max-w-xs leading-snug">
							<p>• Quý khách vui lòng kiểm tra hàng trước khi thanh toán.</p>
							<p>• Mọi khiếu nại xin vui lòng liên hệ Hotline trong 48h kể từ khi nhận hàng.</p>
						</div>

						<div className="w-56 space-y-1 text-xs">
							<div className="flex justify-between">
								<span>Tạm tính:</span>
								<span className="font-mono">{formatVND(order.pricing?.subtotal || order.pricing?.grandTotal || 0)}</span>
							</div>
							<div className="flex justify-between">
								<span>Phí vận chuyển:</span>
								<span className="font-mono">
									{order.pricing?.shippingFee ? formatVND(order.pricing.shippingFee) : '0 ₫'}
								</span>
							</div>
							{order.pricing?.discountTotal > 0 && (
								<div className="flex justify-between text-slate-700">
									<span>Giảm giá:</span>
									<span className="font-mono">-{formatVND(order.pricing.discountTotal)}</span>
								</div>
							)}
							<div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 font-black text-sm">
								<span>TỔNG THU COD:</span>
								<span className="font-mono text-base text-slate-900">
									{formatVND(order.pricing?.grandTotal || 0)}
								</span>
							</div>
						</div>
					</div>

					{/* Signatures */}
					<div className="grid grid-cols-2 gap-8 text-center pt-6 text-xs font-bold">
						<div>
							<p className="uppercase tracking-wider text-slate-500 text-[10px]">NGƯỜI GIAO HÀNG</p>
							<p className="text-[10px] text-slate-400 font-normal italic mt-0.5">(Ký và ghi rõ họ tên)</p>
							<div className="h-16" />
						</div>
						<div>
							<p className="uppercase tracking-wider text-slate-500 text-[10px]">NGƯỜI NHẬN HÀNG</p>
							<p className="text-[10px] text-slate-400 font-normal italic mt-0.5">(Ký và ghi rõ họ tên)</p>
							<div className="h-16" />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
