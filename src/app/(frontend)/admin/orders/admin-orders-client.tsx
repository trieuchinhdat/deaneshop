'use client'

import { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { formatVND } from '@/lib/utils'

const MySwal = withReactContent(Swal)

type OrderItem = {
	_key?: string
	productId?: string
	variantId?: string
	title?: string
	sku?: string
	price?: number
	quantity?: number
	total?: number
	image?: string
}

type OrderHistory = {
	_key?: string
	timestamp: string
	action: string
	user: string
}

type InternalNote = {
	_key?: string
	author: string
	note: string
	timestamp: string
}

type OrderDoc = {
	_id: string
	_createdAt: string
	orderId: string
	customer?: {
		name?: string
		phone?: string
		email?: string
		address?: string
	}
	items?: OrderItem[]
	pricing?: {
		subtotal?: number
		shippingFee?: number
		discount?: number
		grandTotal?: number
	}
	paymentMethod?: string
	paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED'
	fulfillmentStatus?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'RETURNED' | 'CANCELLED'
	carrier?: string
	trackingCode?: string
	customerNote?: string
	internalNotes?: InternalNote[]
	history?: OrderHistory[]
}

const STATUS_TABS = [
	{ key: 'ALL', label: 'Tất cả' },
	{ key: 'PENDING', label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-800 border-amber-300' },
	{ key: 'CONFIRMED', label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800 border-blue-300' },
	{ key: 'PROCESSING', label: 'Đang đóng gói', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
	{ key: 'SHIPPING', label: 'Đang giao', color: 'bg-purple-100 text-purple-800 border-purple-300' },
	{ key: 'DELIVERED', label: 'Đã giao (Thành công)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
	{ key: 'RETURNED', label: 'Chuyển hoàn / Trả', color: 'bg-rose-100 text-rose-800 border-rose-300' },
	{ key: 'CANCELLED', label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 border-gray-300' },
]

export default function AdminOrdersClient() {
	const [activeTab, setActiveTab] = useState('ALL')
	const [searchQuery, setSearchQuery] = useState('')
	const [orders, setOrders] = useState<OrderDoc[]>([])
	const [counts, setCounts] = useState<Record<string, number>>({})
	const [loading, setLoading] = useState(true)
	const [selectedOrders, setSelectedOrders] = useState<string[]>([])

	// State chi tiết đơn hàng (Drawer)
	const [activeOrder, setActiveOrder] = useState<OrderDoc | null>(null)
	const [isDrawerOpen, setIsDrawerOpen] = useState(false)
	const [newInternalNote, setNewInternalNote] = useState('')
	const [carrierInput, setCarrierInput] = useState('')
	const [trackingInput, setTrackingInput] = useState('')
	const [updating, setUpdating] = useState(false)

	// Fetch danh sách đơn hàng
	const fetchOrders = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch(`/api/orders/list?status=${activeTab}&search=${encodeURIComponent(searchQuery)}`)
			const data = await res.json()
			if (data.success) {
				setOrders(data.orders || [])
				setCounts(data.counts || {})
			}
		} catch (err) {
			console.error('Fetch orders error:', err)
		} finally {
			setLoading(false)
		}
	}, [activeTab, searchQuery])

	useEffect(() => {
		fetchOrders()
	}, [fetchOrders])

	// Mở Drawer xem chi tiết
	const handleOpenDetail = (order: OrderDoc) => {
		setActiveOrder(order)
		setCarrierInput(order.carrier || '')
		setTrackingInput(order.trackingCode || '')
		setNewInternalNote('')
		setIsDrawerOpen(true)
	}

	// 1-Click Copy Helper
	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text)
		MySwal.fire({
			toast: true,
			position: 'top-end',
			icon: 'success',
			title: `Đã copy ${label}`,
			showConfirmButton: false,
			timer: 1500,
		})
	}

	// Cập nhật trạng thái đơn
	const handleUpdateStatus = async (
		docId: string,
		fulfillmentStatus?: string,
		paymentStatus?: string,
		customNote?: string,
	) => {
		setUpdating(true)
		try {
			const res = await fetch('/api/orders/update-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					docId,
					fulfillmentStatus,
					paymentStatus,
					carrier: carrierInput,
					trackingCode: trackingInput,
					internalNote: customNote || newInternalNote,
					author: 'Admin CSKH',
				}),
			})
			const data = await res.json()
			if (data.success) {
				MySwal.fire({
					toast: true,
					position: 'top-end',
					icon: 'success',
					title: 'Cập nhật trạng thái thành công',
					showConfirmButton: false,
					timer: 2000,
				})
				if (activeOrder && activeOrder._id === docId) {
					setActiveOrder(data.order)
				}
				fetchOrders()
				setNewInternalNote('')
			} else {
				throw new Error(data.message)
			}
		} catch (err: any) {
			MySwal.fire('Lỗi', err.message || 'Cập nhật thất bại', 'error')
		} finally {
			setUpdating(false)
		}
	}

	// In phiếu giao hàng (Bill K80 / A5)
	const handlePrintInvoice = (order: OrderDoc) => {
		const printWindow = window.open('', '_blank', 'width=800,height=600')
		if (!printWindow) return

		const itemsHtml = order.items
			?.map(
				(item) => `
				<tr>
					<td style="padding: 6px; border-bottom: 1px solid #eee;">${item.title}<br/><small style="color:#666">SKU: ${item.sku}</small></td>
					<td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
					<td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">${formatVND(item.price || 0)}</td>
					<td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">${formatVND(item.total || 0)}</td>
				</tr>
			`,
			)
			.join('')

		printWindow.document.write(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>Hóa đơn #${order.orderId}</title>
				<style>
					body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; color: #111; }
					.header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px; }
					.header h2 { margin: 0 0 5px 0; }
					.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 14px; }
					table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 14px; }
					th { text-align: left; background: #f5f5f5; padding: 8px; border-bottom: 1px solid #ddd; }
					.total-box { text-align: right; font-size: 15px; border-top: 2px solid #111; padding-top: 10px; }
					.footer { text-align: center; font-size: 12px; color: #777; margin-top: 30px; }
					@media print { button { display: none; } }
				</style>
			</head>
			<body>
				<button onclick="window.print()" style="padding: 8px 16px; background: #000; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 20px;">🖨️ In Hóa Đơn</button>
				<div class="header">
					<h2>ECOCROS STORE</h2>
					<p style="margin: 0; font-size: 13px;">HÓA ĐƠN BÁN HÀNG & PHIẾU GIAO HÀNG</p>
					<h3 style="margin: 10px 0 0 0; color: #e11d48;">Mã đơn: #${order.orderId}</h3>
				</div>
				<div class="info-grid">
					<div>
						<strong>Khách hàng:</strong> ${order.customer?.name || 'Khách lẻ'}<br/>
						<strong>SĐT:</strong> ${order.customer?.phone || '-'}<br/>
						<strong>Địa chỉ:</strong> ${order.customer?.address || '-'}
					</div>
					<div>
						<strong>Ngày đặt:</strong> ${new Date(order._createdAt).toLocaleString('vi-VN')}<br/>
						<strong>Thanh toán:</strong> ${order.paymentMethod || 'COD'} (${order.paymentStatus || 'UNPAID'})<br/>
						<strong>ĐVVC:</strong> ${order.carrier || 'Chưa gán'} - Mã VĐ: ${order.trackingCode || 'Chưa có'}
					</div>
				</div>
				<table>
					<thead>
						<tr>
							<th>Sản phẩm</th>
							<th style="text-align: center;">SL</th>
							<th style="text-align: right;">Đơn giá</th>
							<th style="text-align: right;">Thành tiền</th>
						</tr>
					</thead>
					<tbody>
						${itemsHtml}
					</tbody>
				</table>
				<div class="total-box">
					<p style="margin: 4px 0;">Tạm tính: <strong>${formatVND(order.pricing?.subtotal || 0)}</strong></p>
					<p style="margin: 4px 0;">Phí vận chuyển: <strong>${formatVND(order.pricing?.shippingFee || 0)}</strong></p>
					<h3 style="margin: 8px 0 0 0;">TỔNG CỘNG: <span style="color: #e11d48;">${formatVND(order.pricing?.grandTotal || 0)}</span></h3>
				</div>
				<div class="footer">
					<p>Cảm ơn quý khách đã mua sắm tại Ecocros!</p>
					<p>Hotline hỗ trợ: 1900 xxxx - Website: ecocros.com</p>
				</div>
			</body>
			</html>
		`)
		printWindow.document.close()
	}

	// Render Badge Trạng Thái
	const renderStatusBadge = (status?: string) => {
		switch (status) {
			case 'PENDING':
				return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Chờ xác nhận</span>
			case 'CONFIRMED':
				return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">Đã xác nhận</span>
			case 'PROCESSING':
				return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">Đang đóng gói</span>
			case 'SHIPPING':
				return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">Đang giao</span>
			case 'DELIVERED':
				return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Đã giao</span>
			case 'RETURNED':
				return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">Trả hàng</span>
			case 'CANCELLED':
				return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">Đã hủy</span>
			default:
				return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status || 'PENDING'}</span>
		}
	}

	return (
		<div className="min-h-screen bg-gray-50/60 p-4 lg:p-8 font-sans">
			<div className="mx-auto max-w-7xl space-y-6">
				{/* HEADER PAGE */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
					<div>
						<h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">📦 Quản lý Đơn hàng (Admin Orders)</h1>
						<p className="text-sm text-gray-500 mt-1">Theo dõi, duyệt đơn, giao vận và quản lý toàn bộ vòng đời đơn hàng</p>
					</div>
					<div className="flex items-center gap-3">
						<button
							onClick={fetchOrders}
							className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 cursor-pointer"
						>
							🔄 Làm mới (Refresh)
						</button>
					</div>
				</div>

				{/* SUMMARY STAT CARDS */}
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
						<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng đơn hàng</span>
						<p className="mt-2 text-2xl font-bold text-gray-900">{counts.ALL || 0}</p>
					</div>
					<div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
						<span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Chờ xác nhận</span>
						<p className="mt-2 text-2xl font-bold text-amber-900">{counts.PENDING || 0}</p>
					</div>
					<div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
						<span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Đang vận chuyển</span>
						<p className="mt-2 text-2xl font-bold text-purple-900">{counts.SHIPPING || 0}</p>
					</div>
					<div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
						<span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Đã giao thành công</span>
						<p className="mt-2 text-2xl font-bold text-emerald-900">{counts.DELIVERED || 0}</p>
					</div>
				</div>

				{/* STATUS TABS */}
				<div className="flex items-center overflow-x-auto border-b border-gray-200 pb-2 gap-2 scrollbar-none">
					{STATUS_TABS.map((tab) => {
						const count = counts[tab.key] || 0
						const isActive = activeTab === tab.key
						return (
							<button
								key={tab.key}
								onClick={() => setActiveTab(tab.key)}
								className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
									isActive
										? 'bg-black text-white shadow-md'
										: 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
								}`}
							>
								{tab.label}
								<span
									className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
										isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
									}`}
								>
									{count}
								</span>
							</button>
						)
					})}
				</div>

				{/* SEARCH & FILTER BAR */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border shadow-sm">
					<div className="relative flex-1 max-w-md">
						<input
							type="text"
							placeholder="Tìm kiếm mã đơn, SĐT, Tên KH, Mã vận đơn..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
						/>
						<span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
					</div>
					{selectedOrders.length > 0 && (
						<div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs text-amber-900">
							<span>Đã chọn <strong>{selectedOrders.length}</strong> đơn</span>
							<button
								onClick={() => {
									selectedOrders.forEach((id) => handleUpdateStatus(id, 'CONFIRMED'))
									setSelectedOrders([])
								}}
								className="bg-amber-600 text-white px-2.5 py-1 rounded hover:bg-amber-700 font-semibold cursor-pointer"
							>
								Duyệt hàng loạt
							</button>
						</div>
					)}
				</div>

				{/* ORDERS TABLE */}
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
					{loading ? (
						<div className="p-12 text-center text-gray-500">
							<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
							<p className="mt-2 text-sm font-medium">Đang tải danh sách đơn hàng...</p>
						</div>
					) : orders.length === 0 ? (
						<div className="p-12 text-center text-gray-500 italic">
							Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
									<tr>
										<th className="p-4 w-10">
											<input
												type="checkbox"
												checked={selectedOrders.length === orders.length && orders.length > 0}
												onChange={(e) => {
													if (e.target.checked) setSelectedOrders(orders.map((o) => o._id))
													else setSelectedOrders([])
												}}
												className="rounded border-gray-300 cursor-pointer"
											/>
										</th>
										<th className="p-4">Mã đơn & Ngày đặt</th>
										<th className="p-4">Khách hàng</th>
										<th className="p-4">Sản phẩm</th>
										<th className="p-4 text-right">Tổng thanh toán</th>
										<th className="p-4">Thanh toán</th>
										<th className="p-4">Trạng thái Giao hàng</th>
										<th className="p-4 text-center">Thao tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{orders.map((order) => (
										<tr key={order._id} className="hover:bg-gray-50/80 transition-colors">
											<td className="p-4">
												<input
													type="checkbox"
													checked={selectedOrders.includes(order._id)}
													onChange={(e) => {
														if (e.target.checked) setSelectedOrders([...selectedOrders, order._id])
														else setSelectedOrders(selectedOrders.filter((id) => id !== order._id))
													}}
													className="rounded border-gray-300 cursor-pointer"
												/>
											</td>
											<td className="p-4">
												<div className="flex items-center gap-1.5 font-bold text-gray-900">
													<span>#{order.orderId}</span>
													<button
														onClick={() => copyToClipboard(order.orderId, 'Mã đơn')}
														className="text-gray-400 hover:text-black cursor-pointer text-xs"
														title="Copy mã đơn"
													>
														📋
													</button>
												</div>
												<span className="text-xs text-gray-500">
													{new Date(order._createdAt).toLocaleString('vi-VN')}
												</span>
											</td>
											<td className="p-4">
												<div className="font-semibold text-gray-900">{order.customer?.name || 'Khách lẻ'}</div>
												<div className="flex items-center gap-1 text-xs text-gray-500">
													<span>{order.customer?.phone}</span>
													{order.customer?.phone && (
														<button
															onClick={() => copyToClipboard(order.customer?.phone || '', 'SĐT')}
															className="text-gray-400 hover:text-black cursor-pointer"
															title="Copy SĐT"
														>
															📋
														</button>
													)}
												</div>
											</td>
											<td className="p-4">
												<div className="max-w-xs line-clamp-2 text-xs text-gray-700">
													{order.items?.map((item, idx) => (
														<span key={idx} className="block">
															• {item.quantity}x {item.title} ({formatVND(item.price || 0)})
														</span>
													))}
												</div>
											</td>
											<td className="p-4 text-right font-bold text-red-600">
												{formatVND(order.pricing?.grandTotal || 0)}
											</td>
											<td className="p-4">
												<span className="block text-xs font-semibold text-gray-800">
													{order.paymentMethod || 'COD'}
												</span>
												<span
													className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
														order.paymentStatus === 'PAID'
															? 'bg-emerald-100 text-emerald-800'
															: 'bg-amber-100 text-amber-800'
													}`}
												>
													{order.paymentStatus || 'UNPAID'}
												</span>
											</td>
											<td className="p-4">{renderStatusBadge(order.fulfillmentStatus)}</td>
											<td className="p-4 text-center space-x-2">
												<button
													onClick={() => handleOpenDetail(order)}
													className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-black hover:text-white cursor-pointer"
												>
													Chi tiết
												</button>
												<button
													onClick={() => handlePrintInvoice(order)}
													className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 cursor-pointer"
													title="In bill K80/A5"
												>
													🖨️
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* SLIDE-OVER ORDER DETAIL DRAWER */}
			{isDrawerOpen && activeOrder && (
				<div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs transition-opacity">
					<div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
						<div className="w-screen max-w-3xl bg-white shadow-2xl flex flex-col">
							{/* DRAWER HEADER */}
							<div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
								<div>
									<h2 className="text-xl font-bold text-gray-900">Chi tiết Đơn hàng #{activeOrder.orderId}</h2>
									<span className="text-xs text-gray-500">
										Tạo lúc {new Date(activeOrder._createdAt).toLocaleString('vi-VN')}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={() => handlePrintInvoice(activeOrder)}
										className="rounded-lg border px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 cursor-pointer"
									>
										🖨️ In Hóa Đơn
									</button>
									<button
										onClick={() => setIsDrawerOpen(false)}
										className="rounded-full p-2 text-gray-400 hover:text-black cursor-pointer text-lg"
									>
										✕
									</button>
								</div>
							</div>

							{/* DRAWER BODY */}
							<div className="flex-1 overflow-y-auto p-6 space-y-6">
								{/* QUICK ACTION BAR */}
								<div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-wrap items-center justify-between gap-3">
									<span className="text-sm font-bold text-gray-700">Chuyển nhanh trạng thái:</span>
									<div className="flex flex-wrap gap-2">
										<button
											disabled={updating}
											onClick={() => handleUpdateStatus(activeOrder._id, 'CONFIRMED')}
											className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
										>
											✓ Xác nhận đơn
										</button>
										<button
											disabled={updating}
											onClick={() => handleUpdateStatus(activeOrder._id, 'PROCESSING')}
											className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
										>
											📦 Đang đóng gói
										</button>
										<button
											disabled={updating}
											onClick={() => handleUpdateStatus(activeOrder._id, 'SHIPPING')}
											className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"
										>
											🚚 Đang giao hàng
										</button>
										<button
											disabled={updating}
											onClick={() => handleUpdateStatus(activeOrder._id, 'DELIVERED', 'PAID')}
											className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
										>
											🎉 Giao thành công
										</button>
										<button
											disabled={updating}
											onClick={() => handleUpdateStatus(activeOrder._id, 'CANCELLED')}
											className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
										>
											🚫 Hủy đơn
										</button>
									</div>
								</div>

								{/* GRID 2 COLUMNS */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									{/* MAIN LEFT (2 COLS) */}
									<div className="md:col-span-2 space-y-6">
										{/* SAN PHAM */}
										<div className="rounded-xl border p-4 bg-white shadow-sm space-y-3">
											<h3 className="font-bold text-gray-800 text-sm border-b pb-2">Danh sách Sản phẩm</h3>
											<div className="divide-y text-xs">
												{activeOrder.items?.map((item, idx) => (
													<div key={idx} className="py-2.5 flex items-center justify-between">
														<div className="flex items-center gap-3">
															{item.image ? (
																<img src={item.image} alt="" className="h-10 w-10 rounded border object-cover" />
															) : (
																<div className="h-10 w-10 rounded bg-gray-100 border" />
															)}
															<div>
																<p className="font-semibold text-gray-900">{item.title}</p>
																<p className="text-gray-500">SKU: {item.sku}</p>
															</div>
														</div>
														<div className="text-right">
															<p className="font-bold">{formatVND(item.price || 0)} x {item.quantity}</p>
															<p className="font-bold text-red-600">{formatVND(item.total || 0)}</p>
														</div>
													</div>
												))}
											</div>
											<div className="border-t pt-3 space-y-1.5 text-xs text-right">
												<p>Tạm tính: <strong>{formatVND(activeOrder.pricing?.subtotal || 0)}</strong></p>
												<p>Phí ship: <strong>{formatVND(activeOrder.pricing?.shippingFee || 0)}</strong></p>
												<p className="text-sm font-bold text-red-600">
													Tổng cộng: {formatVND(activeOrder.pricing?.grandTotal || 0)}
												</p>
											</div>
										</div>

										{/* NHA VAN CHUYEN & MA VAN DON */}
										<div className="rounded-xl border p-4 bg-white shadow-sm space-y-3">
											<h3 className="font-bold text-gray-800 text-sm border-b pb-2">Cập nhật Giao vận</h3>
											<div className="grid grid-cols-2 gap-3 text-xs">
												<div>
													<label className="block text-gray-600 mb-1 font-medium">Đơn vị vận chuyển</label>
													<select
														value={carrierInput}
														onChange={(e) => setCarrierInput(e.target.value)}
														className="w-full rounded border px-3 py-1.5 outline-none"
													>
														<option value="">Chưa chọn</option>
														<option value="GHN">Giao Hàng Nhanh (GHN)</option>
														<option value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</option>
														<option value="VIETTELPOST">ViettelPost</option>
														<option value="AHAMOVE">Ahamove / Giao hỏa tốc</option>
														<option value="INTERNAL">Shop tự giao</option>
													</select>
												</div>
												<div>
													<label className="block text-gray-600 mb-1 font-medium">Mã vận đơn (Tracking Code)</label>
													<input
														type="text"
														placeholder="Nhập mã vận đơn..."
														value={trackingInput}
														onChange={(e) => setTrackingInput(e.target.value)}
														className="w-full rounded border px-3 py-1.5 outline-none"
													/>
												</div>
											</div>
											<button
												onClick={() => handleUpdateStatus(activeOrder._id)}
												className="w-full bg-black text-white py-2 rounded text-xs font-bold hover:bg-gray-800 cursor-pointer"
											>
												Lưu thông tin giao vận
											</button>
										</div>

										{/* TIMELINE */}
										<div className="rounded-xl border p-4 bg-white shadow-sm space-y-3">
											<h3 className="font-bold text-gray-800 text-sm border-b pb-2">Lịch sử Nhật ký (Audit Trail)</h3>
											<div className="space-y-2 text-xs">
												{activeOrder.history?.map((h, i) => (
													<div key={i} className="flex items-start gap-2 border-l-2 border-gray-300 pl-3 py-1">
														<div>
															<p className="font-semibold text-gray-800">{h.action}</p>
															<span className="text-[10px] text-gray-500">
																{new Date(h.timestamp).toLocaleString('vi-VN')} • Thực hiện bởi: {h.user}
															</span>
														</div>
													</div>
												))}
											</div>
										</div>
									</div>

									{/* SIDEBAR RIGHT (1 COL) */}
									<div className="space-y-6">
										{/* KHANH HANG */}
										<div className="rounded-xl border p-4 bg-white shadow-sm space-y-2 text-xs">
											<h3 className="font-bold text-gray-800 text-sm border-b pb-2">Khách hàng</h3>
											<p className="font-bold text-gray-900 text-sm">{activeOrder.customer?.name}</p>
											<div className="flex items-center justify-between">
												<span>SĐT: {activeOrder.customer?.phone}</span>
												<button
													onClick={() => copyToClipboard(activeOrder.customer?.phone || '', 'SĐT')}
													className="text-gray-500 hover:text-black font-semibold"
												>
													Copy
												</button>
											</div>
											<p>Email: {activeOrder.customer?.email || 'Chưa cung cấp'}</p>
											<div className="border-t pt-2 mt-2">
												<p className="font-semibold text-gray-700">Địa chỉ giao hàng:</p>
												<p className="text-gray-600 mt-1">{activeOrder.customer?.address}</p>
												<button
													onClick={() => copyToClipboard(activeOrder.customer?.address || '', 'Địa chỉ')}
													className="mt-2 text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
												>
													📋 Copy toàn bộ địa chỉ
												</button>
											</div>
										</div>

										{/* GHI CHU KHACK HANG */}
										{activeOrder.customerNote && (
											<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs space-y-1">
												<h4 className="font-bold text-amber-900">Ghi chú từ Khách hàng:</h4>
												<p className="text-amber-800 italic">{activeOrder.customerNote}</p>
											</div>
										)}

										{/* GHI CHU NOI BO */}
										<div className="rounded-xl border p-4 bg-white shadow-sm space-y-3 text-xs">
											<h3 className="font-bold text-gray-800 text-sm border-b pb-2">Ghi chú Nội bộ CSKH</h3>
											<div className="space-y-2 max-h-40 overflow-y-auto">
												{activeOrder.internalNotes?.map((n, idx) => (
													<div key={idx} className="bg-gray-50 p-2 rounded border">
														<p className="text-gray-800">{n.note}</p>
														<span className="text-[10px] text-gray-400 block mt-1">
															{n.author} • {new Date(n.timestamp).toLocaleString('vi-VN')}
														</span>
													</div>
												))}
											</div>
											<textarea
												rows={2}
												placeholder="Nhập ghi chú mới..."
												value={newInternalNote}
												onChange={(e) => setNewInternalNote(e.target.value)}
												className="w-full rounded border p-2 text-xs outline-none"
											/>
											<button
												onClick={() => handleUpdateStatus(activeOrder._id)}
												className="w-full bg-gray-800 text-white py-1.5 rounded text-xs font-bold hover:bg-black cursor-pointer"
											>
												Thêm Ghi chú
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
