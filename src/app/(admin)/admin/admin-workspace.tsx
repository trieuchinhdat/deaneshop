'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
	FiAward,
	FiBell,
	FiCheckCircle,
	FiChevronLeft,
	FiChevronRight,
	FiClock,
	FiDownload,
	FiEye,
	FiGift,
	FiImage,
	FiMessageSquare,
	FiPackage,
	FiPhone,
	FiPrinter,
	FiRefreshCw,
	FiSearch,
	FiShoppingBag,
	FiStar,
	FiTruck,
	FiUser,
	FiUserCheck,
	FiUserPlus,
	FiUsers,
	FiVolume2,
	FiVolumeX,
	FiX,
} from 'react-icons/fi'
import { formatVND } from '@/lib/utils'
import CustomerDetailModal from './customer-detail-modal'
import OrderDetailModal from './order-detail-modal'
import OrderPrintModal from './order-print-modal'
import ReviewModal from './review-modal'

type AdminWorkspaceProps = {
	initialOrders: any[]
	initialCustomers: any[]
	initialReviews: any[]
}

const ORDER_STATUS_TABS = [
	{ label: 'Tất cả', value: 'ALL' },
	{ label: '⏳ Chờ xác nhận', value: 'PENDING' },
	{ label: '📦 Đang xử lý', value: 'PROCESSING' },
	{ label: '🚚 Đang giao', value: 'SHIPPING' },
	{ label: '✅ Giao thành công', value: 'DELIVERED' },
	{ label: '❌ Đã hủy / Hoàn', value: 'CANCELLED' },
]

const CUSTOMER_TABS = [
	{ label: 'Tất cả', value: 'ALL' },
	{ label: '🟢 Khách tiềm năng (Popup)', value: 'lead' },
	{ label: '🛒 Đã mua hàng', value: 'customer' },
	{ label: '🌟 Khách VIP', value: 'vip' },
]

const REVIEW_TABS = [
	{ label: 'Tất cả', value: 'ALL' },
	{ label: '⏳ Chờ duyệt', value: 'PENDING' },
	{ label: '✅ Đã duyệt', value: 'APPROVED' },
	{ label: '⚠️ 1 - 2 sao (Cần CSKH)', value: 'NEGATIVE' },
	{ label: '🌟 5 sao', value: 'FIVE_STAR' },
]

const TIMEFRAME_OPTIONS = [
	{ label: '30 ngày qua (Khuyên dùng)', value: '30d' },
	{ label: '7 ngày qua', value: '7d' },
	{ label: '90 ngày qua', value: '90d' },
	{ label: 'Toàn bộ thời gian', value: 'all' },
]

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
	PENDING: { label: 'Chờ xác nhận', className: 'bg-amber-100 text-amber-800 border-amber-200' },
	CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-800 border-blue-200' },
	PROCESSING: { label: 'Đang đóng gói', className: 'bg-blue-100 text-blue-800 border-blue-200' },
	SHIPPING: { label: 'Đang giao hàng', className: 'bg-purple-100 text-purple-800 border-purple-200' },
	DELIVERED: { label: 'Giao thành công', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
	CANCELLED: { label: 'Đã hủy', className: 'bg-red-100 text-red-800 border-red-200' },
	RETURNED: { label: 'Chuyển hoàn', className: 'bg-slate-200 text-slate-800 border-slate-300' },
}

// Crystal chime sound synthesizer using Web Audio API
function playCrystalNotificationSound() {
	try {
		const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
		if (!AudioContextClass) return
		const ctx = new AudioContextClass()

		const osc1 = ctx.createOscillator()
		const gain1 = ctx.createGain()
		osc1.type = 'sine'
		osc1.frequency.setValueAtTime(880, ctx.currentTime) // A5
		gain1.gain.setValueAtTime(0.3, ctx.currentTime)
		gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
		osc1.connect(gain1)
		gain1.connect(ctx.destination)
		osc1.start(ctx.currentTime)
		osc1.stop(ctx.currentTime + 0.5)

		const osc2 = ctx.createOscillator()
		const gain2 = ctx.createGain()
		osc2.type = 'sine'
		osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1) // E6
		gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.1)
		gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
		osc2.connect(gain2)
		gain2.connect(ctx.destination)
		osc2.start(ctx.currentTime + 0.1)
		osc2.stop(ctx.currentTime + 0.7)
	} catch (e) {
		console.warn('AudioContext not allowed without user interaction:', e)
	}
}

export default function AdminWorkspace({
	initialOrders = [],
	initialCustomers = [],
	initialReviews = [],
}: AdminWorkspaceProps) {
	const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'reviews'>('orders')
	const [orders, setOrders] = useState<any[]>(Array.isArray(initialOrders) ? initialOrders : [])
	const [customers, setCustomers] = useState<any[]>(
		Array.isArray(initialCustomers) ? initialCustomers : [],
	)
	const [reviews, setReviews] = useState<any[]>(
		Array.isArray(initialReviews) ? initialReviews : [],
	)

	// Timeframe & Pagination States
	const [timeframe, setTimeframe] = useState('30d')
	const [orderPage, setOrderPage] = useState(1)
	const [customerPage, setCustomerPage] = useState(1)
	const [reviewPage, setReviewPage] = useState(1)
	const itemsPerPage = 15

	// Filter & Search states
	const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
	const [orderSearchQuery, setOrderSearchQuery] = useState('')
	const [customerTabFilter, setCustomerTabFilter] = useState('ALL')
	const [customerSearchQuery, setCustomerSearchQuery] = useState('')
	const [reviewStatusFilter, setReviewStatusFilter] = useState('ALL')
	const [reviewSearchQuery, setReviewSearchQuery] = useState('')

	// Modals
	const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null)
	const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<any | null>(null)
	const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<any | null>(null)
	const [selectedReviewForDetail, setSelectedReviewForDetail] = useState<any | null>(null)

	// Realtime Order Notification states
	const [soundEnabled, setSoundEnabled] = useState(true)
	const [newOrderAlertCount, setNewOrderAlertCount] = useState(0)
	const lastCheckedTimeRef = useRef<string>(new Date().toISOString())
	const [isPolling, setIsPolling] = useState(false)

	// Auto-polling for new orders every 25s
	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				setIsPolling(true)
				const since = lastCheckedTimeRef.current
				const res = await fetch(`/api/admin/poll?since=${encodeURIComponent(since)}`)
				const data = await res.json()

				if (data?.success) {
					if (data.hasNew && data.newCount > 0) {
						setNewOrderAlertCount((prev) => prev + data.newCount)
						if (soundEnabled) {
							playCrystalNotificationSound()
						}
					}
					if (Array.isArray(data.orders)) setOrders(data.orders)
					if (Array.isArray(data.customers)) setCustomers(data.customers)
					if (Array.isArray(data.reviews)) setReviews(data.reviews)
					lastCheckedTimeRef.current = data.timestamp || new Date().toISOString()
				}
			} catch (err) {
				console.error('Admin Polling error:', err)
			} finally {
				setIsPolling(false)
			}
		}, 25000)

		return () => clearInterval(interval)
	}, [soundEnabled])

	// KPI Stats Calculation
	const kpiStats = useMemo(() => {
		const totalOrders = orders.length
		const pendingOrders = orders.filter(
			(o) => !o.fulfillmentStatus || o.fulfillmentStatus === 'PENDING',
		).length
		const deliveringOrders = orders.filter((o) => o.fulfillmentStatus === 'SHIPPING').length
		const totalRevenue = orders
			.filter((o) => o.fulfillmentStatus !== 'CANCELLED')
			.reduce((acc, o) => acc + (Number(o?.pricing?.grandTotal) || 0), 0)

		const totalCust = customers.length
		const popupLeads = customers.filter(
			(c) => c.cskhStatus === 'lead' || c.orderCount === 0 || !c.orderCount,
		).length
		const vipCustomers = customers.filter(
			(c) => c.cskhStatus === 'vip' || (Number(c.totalSpent) || 0) >= 2000000,
		).length

		const pendingReviews = reviews.filter((r) => !r.isApproved).length

		return {
			totalOrders,
			pendingOrders,
			deliveringOrders,
			totalRevenue,
			totalCust,
			popupLeads,
			vipCustomers,
			pendingReviews,
		}
	}, [orders, customers, reviews])

	// Filter Orders by Timeframe
	const timeframeFilteredOrders = useMemo(() => {
		if (timeframe === 'all') return orders

		const now = Date.now()
		const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30
		const cutoff = now - days * 24 * 60 * 60 * 1000

		return orders.filter((order) => {
			if (!order._createdAt) return true
			return new Date(order._createdAt).getTime() >= cutoff
		})
	}, [orders, timeframe])

	// Filtered Orders List (Status + Search)
	const filteredOrders = useMemo(() => {
		return timeframeFilteredOrders.filter((order) => {
			if (orderStatusFilter !== 'ALL') {
				if (orderStatusFilter === 'CANCELLED') {
					if (order.fulfillmentStatus !== 'CANCELLED' && order.fulfillmentStatus !== 'RETURNED')
						return false
				} else if (orderStatusFilter === 'PROCESSING') {
					if (order.fulfillmentStatus !== 'PROCESSING' && order.fulfillmentStatus !== 'CONFIRMED')
						return false
				} else if (order.fulfillmentStatus !== orderStatusFilter) {
					if (orderStatusFilter === 'PENDING' && !order.fulfillmentStatus) {
						// null is pending
					} else {
						return false
					}
				}
			}

			if (orderSearchQuery.trim()) {
				const q = orderSearchQuery.trim().toLowerCase()
				const matchId = order.orderId?.toLowerCase().includes(q)
				const matchName = order.customer?.name?.toLowerCase().includes(q)
				const matchPhone = order.customer?.phone?.toLowerCase().includes(q)
				const matchEmail = order.customer?.email?.toLowerCase().includes(q)
				if (!matchId && !matchName && !matchPhone && !matchEmail) return false
			}

			return true
		})
	}, [timeframeFilteredOrders, orderStatusFilter, orderSearchQuery])

	const totalOrderPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1
	const paginatedOrders = useMemo(() => {
		const start = (orderPage - 1) * itemsPerPage
		return filteredOrders.slice(start, start + itemsPerPage)
	}, [filteredOrders, orderPage])

	// Filtered Customers List
	const filteredCustomers = useMemo(() => {
		return customers.filter((cust) => {
			if (customerTabFilter !== 'ALL') {
				if (customerTabFilter === 'lead') {
					if (cust.cskhStatus !== 'lead' && cust.orderCount > 0) return false
				} else if (customerTabFilter === 'vip') {
					if (cust.cskhStatus !== 'vip' && (Number(cust.totalSpent) || 0) < 2000000) return false
				} else if (customerTabFilter === 'customer') {
					if ((Number(cust.orderCount) || 0) === 0 && cust.cskhStatus === 'lead') return false
				}
			}

			if (customerSearchQuery.trim()) {
				const q = customerSearchQuery.trim().toLowerCase()
				const matchName = cust.name?.toLowerCase().includes(q)
				const matchPhone = cust.phone?.toLowerCase().includes(q)
				const matchEmail = cust.email?.toLowerCase().includes(q)
				if (!matchName && !matchPhone && !matchEmail) return false
			}

			return true
		})
	}, [customers, customerTabFilter, customerSearchQuery])

	const totalCustomerPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1
	const paginatedCustomers = useMemo(() => {
		const start = (customerPage - 1) * itemsPerPage
		return filteredCustomers.slice(start, start + itemsPerPage)
	}, [filteredCustomers, customerPage])

	// Filtered Reviews List
	const filteredReviews = useMemo(() => {
		return reviews.filter((rev) => {
			if (reviewStatusFilter !== 'ALL') {
				if (reviewStatusFilter === 'PENDING') {
					if (rev.isApproved) return false
				} else if (reviewStatusFilter === 'APPROVED') {
					if (!rev.isApproved) return false
				} else if (reviewStatusFilter === 'NEGATIVE') {
					if (Number(rev.rating) > 2) return false
				} else if (reviewStatusFilter === 'FIVE_STAR') {
					if (Number(rev.rating) !== 5) return false
				}
			}

			if (reviewSearchQuery.trim()) {
				const q = reviewSearchQuery.trim().toLowerCase()
				const matchAuthor = rev.author?.toLowerCase().includes(q)
				const matchProduct = rev.product?.title?.toLowerCase().includes(q)
				const matchComment = rev.comment?.toLowerCase().includes(q)
				if (!matchAuthor && !matchProduct && !matchComment) return false
			}

			return true
		})
	}, [reviews, reviewStatusFilter, reviewSearchQuery])

	const totalReviewPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1
	const paginatedReviews = useMemo(() => {
		const start = (reviewPage - 1) * itemsPerPage
		return filteredReviews.slice(start, start + itemsPerPage)
	}, [filteredReviews, reviewPage])

	// Quick 1-Click Status Update for Orders
	const handleQuickStatusChange = async (orderId: string, newStatus: string) => {
		try {
			setOrders((prev) =>
				prev.map((o) => (o._id === orderId ? { ...o, fulfillmentStatus: newStatus } : o)),
			)

			await fetch('/api/orders/update-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					docId: orderId,
					fulfillmentStatus: newStatus,
					author: 'Admin CSKH',
				}),
			})
		} catch (err) {
			console.error('Quick status change error:', err)
		}
	}

	// Quick 1-Click Approve / Hide for Reviews
	const handleQuickToggleReviewApproval = async (reviewId: string, currentApproved: boolean) => {
		const nextState = !currentApproved
		try {
			setReviews((prev) =>
				prev.map((r) => (r._id === reviewId ? { ...r, isApproved: nextState } : r)),
			)

			await fetch('/api/admin/reviews/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reviewId,
					isApproved: nextState,
				}),
			})
		} catch (err) {
			console.error('Review approval toggle error:', err)
		}
	}

	// Export CSV Helpers
	const exportOrdersToCSV = () => {
		const headers = ['Mã Đơn', 'Khách Hàng', 'SĐT', 'Địa Chỉ', 'Sản Phẩm', 'Tổng Tiền', 'Trạng Thái', 'Ngày Tạo']
		const rows = filteredOrders.map((o) => [
			o.orderId || '',
			o.customer?.name || '',
			`'${o.customer?.phone || ''}`,
			`"${(o.customer?.address || '').replace(/"/g, '""')}"`,
			`"${(Array.isArray(o.items) ? o.items : []).map((i: any) => `${i?.title || 'Sản phẩm'} (x${i?.quantity || 1})`).join(', ')}"`,
			o.pricing?.grandTotal || 0,
			o.fulfillmentStatus || 'PENDING',
			o._createdAt ? new Date(o._createdAt).toLocaleString('vi-VN') : '',
		])

		const csvContent =
			'data:text/csv;charset=utf-8,\uFEFF' +
			[headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

		const encodedUri = encodeURI(csvContent)
		const link = document.createElement('a')
		link.setAttribute('href', encodedUri)
		link.setAttribute('download', `ecocros_orders_${new Date().toISOString().slice(0, 10)}.csv`)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const exportCustomersToCSV = () => {
		const headers = ['Họ Tên', 'Số Điện Thoại', 'Email', 'Địa Chỉ', 'Nguồn', 'Số Đơn', 'Tổng Chi Tiêu', 'Phân Khúc']
		const rows = filteredCustomers.map((c) => [
			c.name || '',
			`'${c.phone || ''}`,
			c.email || '',
			`"${(c.address || '').replace(/"/g, '""')}"`,
			c.source || 'Popup',
			c.orderCount || 0,
			c.totalSpent || 0,
			c.cskhStatus || 'lead',
		])

		const csvContent =
			'data:text/csv;charset=utf-8,\uFEFF' +
			[headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

		const encodedUri = encodeURI(csvContent)
		const link = document.createElement('a')
		link.setAttribute('href', encodedUri)
		link.setAttribute('download', `ecocros_customers_${new Date().toISOString().slice(0, 10)}.csv`)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const exportReviewsToCSV = () => {
		const headers = ['Người Đánh Giá', 'Sản Phẩm', 'Số Sao', 'Nội Dung', 'Trạng Thái', 'Phản Hồi Của Shop', 'Ngày Gửi']
		const rows = filteredReviews.map((r) => [
			r.author || '',
			r.product?.title || '',
			r.rating || 5,
			`"${(r.comment || '').replace(/"/g, '""')}"`,
			r.isApproved ? 'Đã duyệt' : 'Chờ duyệt',
			`"${(r.response || '').replace(/"/g, '""')}"`,
			r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '',
		])

		const csvContent =
			'data:text/csv;charset=utf-8,\uFEFF' +
			[headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

		const encodedUri = encodeURI(csvContent)
		const link = document.createElement('a')
		link.setAttribute('href', encodedUri)
		link.setAttribute('download', `ecocros_reviews_${new Date().toISOString().slice(0, 10)}.csv`)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	return (
		<div className="space-y-6">
			{/* Floating Realtime New Order Alert Toast */}
			{newOrderAlertCount > 0 && (
				<div className="sticky top-20 z-40 flex items-center justify-between gap-4 rounded-2xl bg-emerald-900 p-4 text-white shadow-2xl animate-in slide-in-from-top-4 border border-emerald-700/80">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white animate-bounce shadow-md">
							<FiBell className="h-5 w-5" />
						</div>
						<div>
							<h4 className="font-extrabold text-sm sm:text-base">
								🔔 Có {newOrderAlertCount} đơn hàng mới vừa đặt!
							</h4>
							<p className="text-xs text-emerald-200">
								Khách hàng vừa hoàn tất thanh toán. Vui lòng kiểm tra và gọi điện xác nhận.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => {
								setNewOrderAlertCount(0)
								setActiveTab('orders')
								setOrderStatusFilter('PENDING')
								setOrderPage(1)
							}}
							className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-950 shadow-md hover:bg-emerald-50 transition active:scale-95 cursor-pointer"
						>
							Xem đơn mới ngay
						</button>
						<button
							type="button"
							onClick={() => setNewOrderAlertCount(0)}
							className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
						>
							<FiX className="h-5 w-5" />
						</button>
					</div>
				</div>
			)}

			{/* Top Bar: Title & Controls */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2.5">
						<h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
							Quản Trị Bán Hàng & CSKH
						</h1>
						{isPolling && (
							<span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" title="Đang đồng bộ realtime" />
						)}
					</div>
					<p className="text-xs sm:text-sm text-slate-500 mt-1">
						Quản lý đơn hàng, theo dõi giao vận, hồ sơ khách hàng 360° và duyệt đánh giá sản phẩm.
					</p>
				</div>

				<div className="flex items-center gap-2 self-start sm:self-auto">
					{/* Sound Notification Toggle */}
					<button
						type="button"
						onClick={() => setSoundEnabled(!soundEnabled)}
						className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition shadow-2xs cursor-pointer ${
							soundEnabled
								? 'bg-emerald-50 text-emerald-800 border-emerald-300'
								: 'bg-white text-slate-500 border-slate-200'
						}`}
						title={soundEnabled ? 'Chuông báo đơn mới đang bật' : 'Chuông báo đơn mới đang tắt'}
					>
						{soundEnabled ? <FiVolume2 className="h-4 w-4" /> : <FiVolumeX className="h-4 w-4" />}
						<span className="hidden sm:inline">{soundEnabled ? 'Âm báo bật' : 'Âm báo tắt'}</span>
					</button>

					{/* Timeframe Selector */}
					<div className="relative">
						<select
							value={timeframe}
							onChange={(e) => {
								setTimeframe(e.target.value)
								setOrderPage(1)
							}}
							className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-hidden cursor-pointer"
						>
							{TIMEFRAME_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									📅 {opt.label}
								</option>
							))}
						</select>
					</div>

					{/* Manual Refresh */}
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition cursor-pointer"
					>
						<FiRefreshCw className="h-3.5 w-3.5 text-slate-500" />
						<span className="hidden md:inline">Làm mới</span>
					</button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
				{/* Card 1: Đơn Mới */}
				<div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-slate-400">
							Đơn mới chờ duyệt
						</span>
						<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
							<FiClock className="h-4 w-4" />
						</span>
					</div>
					<div className="mt-2 flex items-baseline gap-2">
						<span className="font-mono text-2xl sm:text-3xl font-black text-slate-900">
							{kpiStats.pendingOrders}
						</span>
						<span className="text-xs text-amber-600 font-bold">Cần xử lý</span>
					</div>
				</div>

				{/* Card 2: Đang Giao */}
				<div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-slate-400">
							Đang giao hàng
						</span>
						<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
							<FiTruck className="h-4 w-4" />
						</span>
					</div>
					<div className="mt-2 flex items-baseline gap-2">
						<span className="font-mono text-2xl sm:text-3xl font-black text-slate-900">
							{kpiStats.deliveringOrders}
						</span>
						<span className="text-xs text-purple-600 font-semibold">Trên đường giao</span>
					</div>
				</div>

				{/* Card 3: Leads từ Popup */}
				<div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-slate-400">
							Khách tiềm năng
						</span>
						<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
							<FiGift className="h-4 w-4" />
						</span>
					</div>
					<div className="mt-2 flex items-baseline gap-2">
						<span className="font-mono text-2xl sm:text-3xl font-black text-slate-900">
							{kpiStats.popupLeads}
						</span>
						<span className="text-xs text-emerald-600 font-semibold">Từ Popup/Form</span>
					</div>
				</div>

				{/* Card 4: Review Chờ Duyệt */}
				<div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-bold uppercase tracking-wider text-slate-400">
							Review Chờ Duyệt
						</span>
						<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
							<FiStar className="h-4 w-4 fill-white" />
						</span>
					</div>
					<div className="mt-2 flex items-baseline gap-2">
						<span className="font-mono text-2xl sm:text-3xl font-black text-amber-700">
							{kpiStats.pendingReviews}
						</span>
						<span className="text-xs text-amber-600 font-bold">Chờ duyệt</span>
					</div>
				</div>
			</div>

			{/* Main Workspace Navigation (3 Tabs) */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
				<div className="flex flex-wrap items-center gap-2">
					{/* Tab 1: Đơn hàng */}
					<button
						type="button"
						onClick={() => setActiveTab('orders')}
						className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
							activeTab === 'orders'
								? 'bg-slate-900 text-white shadow-md'
								: 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
						}`}
					>
						<FiPackage className="h-4 w-4" />
						<span>Quản Lý Đơn Hàng</span>
						<span
							className={`rounded-full px-2 py-0.5 text-xs ${
								activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
							}`}
						>
							{filteredOrders.length}
						</span>
					</button>

					{/* Tab 2: Khách hàng */}
					<button
						type="button"
						onClick={() => setActiveTab('customers')}
						className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
							activeTab === 'customers'
								? 'bg-slate-900 text-white shadow-md'
								: 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
						}`}
					>
						<FiUsers className="h-4 w-4" />
						<span>Hồ Sơ Khách Hàng (CRM)</span>
						<span
							className={`rounded-full px-2 py-0.5 text-xs ${
								activeTab === 'customers'
									? 'bg-white/20 text-white'
									: 'bg-slate-100 text-slate-600'
							}`}
						>
							{filteredCustomers.length}
						</span>
					</button>

					{/* Tab 3: Đánh giá */}
					<button
						type="button"
						onClick={() => setActiveTab('reviews')}
						className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all cursor-pointer ${
							activeTab === 'reviews'
								? 'bg-slate-900 text-white shadow-md'
								: 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
						}`}
					>
						<FiStar className="h-4 w-4" />
						<span>Đánh Giá Sản Phẩm</span>
						{kpiStats.pendingReviews > 0 ? (
							<span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
								{kpiStats.pendingReviews}
							</span>
						) : (
							<span
								className={`rounded-full px-2 py-0.5 text-xs ${
									activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
								}`}
							>
								{filteredReviews.length}
							</span>
						)}
					</button>
				</div>

				{/* Export Button */}
				<button
					type="button"
					onClick={
						activeTab === 'orders'
							? exportOrdersToCSV
							: activeTab === 'customers'
								? exportCustomersToCSV
								: exportReviewsToCSV
					}
					className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
				>
					<FiDownload className="h-4 w-4" />
					<span>
						Xuất Excel ({activeTab === 'orders' ? 'Đơn Hàng' : activeTab === 'customers' ? 'Khách Hàng' : 'Đánh Giá'})
					</span>
				</button>
			</div>

			{/* ================= TAB 1: ORDERS SECTION ================= */}
			{activeTab === 'orders' && (
				<div className="space-y-4">
					{/* Search & Status Filters */}
					<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
						{/* Status Pills */}
						<div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
							{ORDER_STATUS_TABS.map((tab) => (
								<button
									key={tab.value}
									type="button"
									onClick={() => {
										setOrderStatusFilter(tab.value)
										setOrderPage(1)
									}}
									className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
										orderStatusFilter === tab.value
											? 'bg-emerald-700 text-white shadow-xs'
											: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>

						{/* Search Input */}
						<div className="relative w-full md:w-80 flex-none">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
								<FiSearch className="h-4 w-4" />
							</div>
							<input
								type="text"
								value={orderSearchQuery}
								onChange={(e) => {
									setOrderSearchQuery(e.target.value)
									setOrderPage(1)
								}}
								placeholder="Tìm SĐT, Tên, Mã đơn..."
								className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
							/>
						</div>
					</div>

					{/* Orders Table */}
					<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs border-collapse">
								<thead>
									<tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
										<th className="py-3.5 px-4 w-32">Mã Đơn</th>
										<th className="py-3.5 px-4">Khách Hàng</th>
										<th className="py-3.5 px-4">Sản Phẩm</th>
										<th className="py-3.5 px-4">Tổng Tiền</th>
										<th className="py-3.5 px-4">Trạng Thái Giao</th>
										<th className="py-3.5 px-4 text-right">Thao Tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 font-medium">
									{paginatedOrders.length === 0 ? (
										<tr>
											<td colSpan={6} className="py-12 text-center text-slate-400">
												<FiShoppingBag className="mx-auto h-8 w-8 stroke-1 text-slate-300 mb-2" />
												<p className="text-sm font-semibold">Không tìm thấy đơn hàng nào phù hợp</p>
											</td>
										</tr>
									) : (
										paginatedOrders.map((order) => {
											const statusInfo =
												STATUS_BADGES[order.fulfillmentStatus || 'PENDING'] ||
												STATUS_BADGES.PENDING
											const phoneClean = order.customer?.phone?.replace(/\D/g, '')

											return (
												<tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
													{/* Mã Đơn */}
													<td className="py-3.5 px-4 font-mono font-bold text-slate-900">
														<span className="block">{order.orderId}</span>
														<span className="text-[10px] text-slate-400 font-normal">
															{order._createdAt
																? new Date(order._createdAt).toLocaleDateString('vi-VN')
																: ''}
														</span>
													</td>

													{/* Khách Hàng */}
													<td className="py-3.5 px-4">
														<p className="font-bold text-slate-900">{order.customer?.name || 'Khách vãng lai'}</p>
														<div className="flex items-center gap-2 mt-0.5">
															{order.customer?.phone && (
																<span className="text-xs font-semibold text-emerald-700">
																	📞 {order.customer.phone}
																</span>
															)}
														</div>
														<p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
															{order.customer?.address}
														</p>
													</td>

													{/* Sản Phẩm */}
													<td className="py-3.5 px-4">
														<div className="space-y-0.5 max-w-xs">
															{(Array.isArray(order.items) ? order.items : []).slice(0, 2).map((it: any, idx: number) => (
																<div key={idx} className="truncate text-slate-700">
																	• {it?.title || 'Sản phẩm'} <strong className="text-slate-900">x{it?.quantity || 1}</strong>
																</div>
															))}
															{(Array.isArray(order.items) ? order.items : []).length > 2 && (
																<span className="text-[10px] font-bold text-slate-400">
																	+ {(order.items || []).length - 2} sản phẩm khác
																</span>
															)}
														</div>
													</td>

													{/* Tổng Tiền */}
													<td className="py-3.5 px-4">
														<span className="font-mono text-sm font-black text-slate-900 block">
															{formatVND(order.pricing?.grandTotal || 0)}
														</span>
														<span className="text-[10px] font-semibold text-slate-400">
															{order.paymentMethod === 'COD' ? 'Thu hộ COD' : order.paymentMethod}
														</span>
													</td>

													{/* Trạng Thái 1-Click Dropdown */}
													<td className="py-3.5 px-4">
														<select
															value={order.fulfillmentStatus || 'PENDING'}
															onChange={(e) => handleQuickStatusChange(order._id, e.target.value)}
															className={`rounded-xl border px-2.5 py-1 text-xs font-bold shadow-2xs focus:outline-hidden cursor-pointer ${statusInfo.className}`}
														>
															<option value="PENDING">⏳ Chờ xác nhận</option>
															<option value="PROCESSING">📦 Đang đóng gói</option>
															<option value="SHIPPING">🚚 Đang giao hàng</option>
															<option value="DELIVERED">✅ Giao thành công</option>
															<option value="CANCELLED">❌ Đã hủy</option>
															<option value="RETURNED">🔄 Hoàn hàng</option>
														</select>
													</td>

													{/* Thao Tác */}
													<td className="py-3.5 px-4 text-right">
														<div className="flex items-center justify-end gap-1.5">
															{phoneClean && (
																<>
																	<a
																		href={`tel:${order.customer.phone}`}
																		className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition no-underline shadow-2xs"
																		title="Gọi điện thoại"
																	>
																		<FiPhone className="h-3.5 w-3.5" />
																	</a>
																	<a
																		href={`https://zalo.me/${phoneClean}`}
																		target="_blank"
																		className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition no-underline shadow-2xs"
																		title="Nhắn tin Zalo"
																	>
																		<FiMessageSquare className="h-3.5 w-3.5" />
																	</a>
																</>
															)}

															<button
																type="button"
																onClick={() => setSelectedOrderForPrint(order)}
																className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition shadow-2xs cursor-pointer"
																title="In phiếu giao hàng A5"
															>
																<FiPrinter className="h-3.5 w-3.5" />
															</button>

															<button
																type="button"
																onClick={() => setSelectedOrderForDetail(order)}
																className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition shadow-2xs cursor-pointer"
																title="Xem chi tiết đơn"
															>
																<FiEye className="h-3.5 w-3.5" />
															</button>
														</div>
													</td>
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</div>

						{/* Orders Pagination Bar */}
						{totalOrderPages > 1 && (
							<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
								<div>
									Hiển thị <strong>{(orderPage - 1) * itemsPerPage + 1}</strong> -{' '}
									<strong>{Math.min(orderPage * itemsPerPage, filteredOrders.length)}</strong> trên{' '}
									<strong>{filteredOrders.length}</strong> đơn hàng
								</div>

								<div className="flex items-center gap-1.5">
									<button
										type="button"
										onClick={() => setOrderPage((p) => Math.max(p - 1, 1))}
										disabled={orderPage === 1}
										className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
									>
										<FiChevronLeft className="h-4 w-4" />
									</button>

									{Array.from({ length: totalOrderPages }).map((_, idx) => {
										const pageNum = idx + 1
										if (
											pageNum === 1 ||
											pageNum === totalOrderPages ||
											(pageNum >= orderPage - 1 && pageNum <= orderPage + 1)
										) {
											return (
												<button
													key={pageNum}
													type="button"
													onClick={() => setOrderPage(pageNum)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
														orderPage === pageNum
															? 'bg-slate-900 text-white shadow-xs'
															: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
													}`}
												>
													{pageNum}
												</button>
											)
										}
										return null
									})}

									<button
										type="button"
										onClick={() => setOrderPage((p) => Math.min(p + 1, totalOrderPages))}
										disabled={orderPage === totalOrderPages}
										className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
									>
										<FiChevronRight className="h-4 w-4" />
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ================= TAB 2: CUSTOMERS SECTION ================= */}
			{activeTab === 'customers' && (
				<div className="space-y-4">
					{/* Search & Segment Filters */}
					<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
						{/* Segment Pills */}
						<div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
							{CUSTOMER_TABS.map((tab) => (
								<button
									key={tab.value}
									type="button"
									onClick={() => {
										setCustomerTabFilter(tab.value)
										setCustomerPage(1)
									}}
									className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
										customerTabFilter === tab.value
											? 'bg-slate-900 text-white shadow-xs'
											: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>

						{/* Search Input */}
						<div className="relative w-full md:w-80 flex-none">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
								<FiSearch className="h-4 w-4" />
							</div>
							<input
								type="text"
								value={customerSearchQuery}
								onChange={(e) => {
									setCustomerSearchQuery(e.target.value)
									setCustomerPage(1)
								}}
								placeholder="Tìm tên, SĐT, Email..."
								className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
							/>
						</div>
					</div>

					{/* Customers Table */}
					<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs border-collapse">
								<thead>
									<tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
										<th className="py-3.5 px-4">Khách Hàng</th>
										<th className="py-3.5 px-4">Liên Hệ</th>
										<th className="py-3.5 px-4">Nguồn Tiếp Cận</th>
										<th className="py-3.5 px-4">Đơn / Chi Tiêu</th>
										<th className="py-3.5 px-4">Phân Khúc</th>
										<th className="py-3.5 px-4 text-right">Thao Tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 font-medium">
									{paginatedCustomers.length === 0 ? (
										<tr>
											<td colSpan={6} className="py-12 text-center text-slate-400">
												<FiUsers className="mx-auto h-8 w-8 stroke-1 text-slate-300 mb-2" />
												<p className="text-sm font-semibold">Chưa có khách hàng nào trong mục này</p>
											</td>
										</tr>
									) : (
										paginatedCustomers.map((cust) => {
											const phoneClean = cust.phone?.replace(/\D/g, '')
											const isVip =
												cust.cskhStatus === 'vip' || (Number(cust.totalSpent) || 0) >= 2000000
											const isLead =
												cust.cskhStatus === 'lead' || cust.orderCount === 0 || !cust.orderCount

											return (
												<tr key={cust._id} className="hover:bg-slate-50/80 transition-colors">
													{/* Khách Hàng */}
													<td className="py-3.5 px-4">
														<div className="flex items-center gap-2.5">
															<div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
																<FiUser className="h-4 w-4" />
															</div>
															<div>
																<p className="font-bold text-slate-900">
																	{cust.name || cust.phone || 'Khách vãng lai'}
																</p>
																<span className="text-[10px] text-slate-400">
																	{cust.createdAt
																		? `Tham gia: ${new Date(cust.createdAt).toLocaleDateString('vi-VN')}`
																		: ''}
																</span>
															</div>
														</div>
													</td>

													{/* Liên Hệ */}
													<td className="py-3.5 px-4">
														<p className="font-semibold text-emerald-700">{cust.phone}</p>
														{cust.email && (
															<p className="text-[11px] text-slate-500 truncate max-w-xs">
																{cust.email}
															</p>
														)}
													</td>

													{/* Nguồn */}
													<td className="py-3.5 px-4">
														<span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
															{cust.source === 'popup' ? '🎁 Popup Voucher' : cust.source === 'checkout' ? '🛍️ Đặt đơn' : cust.source || 'Trực tiếp'}
														</span>
														{cust.couponReceived && (
															<span className="block text-[10px] text-amber-700 font-mono font-bold mt-0.5">
																Mã: {cust.couponReceived}
															</span>
														)}
													</td>

													{/* Đơn & Tổng Chi Tiêu */}
													<td className="py-3.5 px-4">
														<span className="font-mono text-sm font-bold text-slate-900 block">
															{formatVND(cust.totalSpent || 0)}
														</span>
														<span className="text-[11px] font-semibold text-slate-500">
															{cust.orderCount || 0} đơn hàng
														</span>
													</td>

													{/* Phân Khúc */}
													<td className="py-3.5 px-4">
														{isVip ? (
															<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
																<FiAward className="h-3 w-3" />
																<span>VIP</span>
															</span>
														) : isLead ? (
															<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
																<FiUserPlus className="h-3 w-3" />
																<span>Tiềm năng</span>
															</span>
														) : (
															<span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
																<FiUserCheck className="h-3 w-3" />
																<span>Đã mua hàng</span>
															</span>
														)}
													</td>

													{/* Thao Tác */}
													<td className="py-3.5 px-4 text-right">
														<div className="flex items-center justify-end gap-1.5">
															{phoneClean && (
																<>
																	<a
																		href={`tel:${cust.phone}`}
																		className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition no-underline shadow-2xs"
																		title="Gọi điện thoại"
																	>
																		<FiPhone className="h-3.5 w-3.5" />
																	</a>
																	<a
																		href={`https://zalo.me/${phoneClean}`}
																		target="_blank"
																		className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition no-underline shadow-2xs"
																		title="Nhắn tin Zalo"
																	>
																		<FiMessageSquare className="h-3.5 w-3.5" />
																	</a>
																</>
															)}

															<button
																type="button"
																onClick={() => setSelectedCustomerForDetail(cust)}
																className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition shadow-2xs cursor-pointer"
																title="Xem hồ sơ khách hàng"
															>
																<FiEye className="h-3.5 w-3.5" />
															</button>
														</div>
													</td>
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</div>

						{/* Customers Pagination Bar */}
						{totalCustomerPages > 1 && (
							<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
								<div>
									Hiển thị <strong>{(customerPage - 1) * itemsPerPage + 1}</strong> -{' '}
									<strong>{Math.min(customerPage * itemsPerPage, filteredCustomers.length)}</strong> trên{' '}
									<strong>{filteredCustomers.length}</strong> khách hàng
								</div>

								<div className="flex items-center gap-1.5">
									<button
										type="button"
										onClick={() => setCustomerPage((p) => Math.max(p - 1, 1))}
										disabled={customerPage === 1}
										className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
									>
										<FiChevronLeft className="h-4 w-4" />
									</button>

									{Array.from({ length: totalCustomerPages }).map((_, idx) => {
										const pageNum = idx + 1
										if (
											pageNum === 1 ||
											pageNum === totalCustomerPages ||
											(pageNum >= customerPage - 1 && pageNum <= customerPage + 1)
										) {
											return (
												<button
													key={pageNum}
													type="button"
													onClick={() => setCustomerPage(pageNum)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
														customerPage === pageNum
															? 'bg-slate-900 text-white shadow-xs'
															: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
													}`}
												>
													{pageNum}
												</button>
											)
										}
										return null
									})}

									<button
										type="button"
										onClick={() => setCustomerPage((p) => Math.min(p + 1, totalCustomerPages))}
										disabled={customerPage === totalCustomerPages}
										className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
									>
										<FiChevronRight className="h-4 w-4" />
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* ================= TAB 3: REVIEWS SECTION ================= */}
			{activeTab === 'reviews' && (
				<div className="space-y-4">
					{/* Search & Status Filters */}
					<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
						{/* Status Pills */}
						<div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
							{REVIEW_TABS.map((tab) => (
								<button
									key={tab.value}
									type="button"
									onClick={() => {
										setReviewStatusFilter(tab.value)
										setReviewPage(1)
									}}
									className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
										reviewStatusFilter === tab.value
											? 'bg-amber-600 text-white shadow-xs'
											: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>

						{/* Search Input */}
						<div className="relative w-full md:w-80 flex-none">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
								<FiSearch className="h-4 w-4" />
							</div>
							<input
								type="text"
								value={reviewSearchQuery}
								onChange={(e) => {
									setReviewSearchQuery(e.target.value)
									setReviewPage(1)
								}}
								placeholder="Tìm tên khách, sản phẩm, nhận xét..."
								className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
							/>
						</div>
					</div>

					{/* Reviews Table */}
					<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs border-collapse">
								<thead>
									<tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
										<th className="py-3.5 px-4">Người Đánh Giá</th>
										<th className="py-3.5 px-4">Sản Phẩm & Số Sao</th>
										<th className="py-3.5 px-4 max-w-sm">Nội Dung Nhận Xét</th>
										<th className="py-3.5 px-4">Ảnh / Video</th>
										<th className="py-3.5 px-4">Trạng Thái</th>
										<th className="py-3.5 px-4 text-right">Thao Tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 font-medium">
									{paginatedReviews.length === 0 ? (
										<tr>
											<td colSpan={6} className="py-12 text-center text-slate-400">
												<FiStar className="mx-auto h-8 w-8 stroke-1 text-slate-300 mb-2" />
												<p className="text-sm font-semibold">Chưa có đánh giá nào trong mục này</p>
											</td>
										</tr>
									) : (
										paginatedReviews.map((rev) => {
											const isAppr = Boolean(rev.isApproved)
											const ratingVal = Number(rev.rating) || 5
											const mediaCount = (Array.isArray(rev.images) ? rev.images : []).length + (Array.isArray(rev.videos) ? rev.videos : []).length

											return (
												<tr key={rev._id} className="hover:bg-slate-50/80 transition-colors">
													{/* Người Đánh Giá */}
													<td className="py-3.5 px-4">
														<p className="font-bold text-slate-900">{rev.author || 'Khách hàng'}</p>
														<span className="text-[10px] text-slate-400">
															{rev.createdAt
																? new Date(rev.createdAt).toLocaleDateString('vi-VN')
																: ''}
														</span>
													</td>

													{/* Sản Phẩm & Sao */}
													<td className="py-3.5 px-4">
														<p className="font-bold text-slate-900 truncate max-w-xs">
															{rev.product?.title || '[Sản phẩm chung]'}
														</p>
														<div className="flex items-center gap-0.5 mt-0.5">
															{Array.from({ length: 5 }).map((_, i) => (
																<FiStar
																	key={i}
																	className={`h-3.5 w-3.5 ${
																		i < ratingVal ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
																	}`}
																/>
															))}
															<span className="ml-1 text-[11px] font-bold text-slate-700">({ratingVal})</span>
														</div>
													</td>

													{/* Nội Dung Nhận Xét */}
													<td className="py-3.5 px-4 max-w-xs">
														<p className="text-slate-700 leading-snug line-clamp-2">{rev.comment}</p>
														{rev.response && (
															<div className="mt-1 text-[11px] text-emerald-800 bg-emerald-50 rounded-md p-1.5 border border-emerald-200">
																<strong>Shop trả lời:</strong> {rev.response}
															</div>
														)}
													</td>

													{/* Đính Kèm */}
													<td className="py-3.5 px-4">
														{mediaCount > 0 ? (
															<span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
																<FiImage className="h-3.5 w-3.5" />
																<span>{mediaCount} tệp</span>
															</span>
														) : (
															<span className="text-slate-300 text-xs">Không</span>
														)}
													</td>

													{/* Trạng Thái 1-Click Toggle */}
													<td className="py-3.5 px-4">
														<button
															type="button"
															onClick={() => handleQuickToggleReviewApproval(rev._id, isAppr)}
															className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition shadow-2xs cursor-pointer ${
																isAppr
																	? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
																	: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'
															}`}
														>
															{isAppr ? <FiCheckCircle className="h-3.5 w-3.5 text-emerald-700" /> : <FiClock className="h-3.5 w-3.5 text-amber-700" />}
															<span>{isAppr ? 'Đã duyệt' : 'Chờ duyệt'}</span>
														</button>
													</td>

													{/* Thao Tác */}
													<td className="py-3.5 px-4 text-right">
														<button
															type="button"
															onClick={() => setSelectedReviewForDetail(rev)}
															className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs cursor-pointer"
															title="Xem chi tiết & Phản hồi"
														>
															<FiEye className="h-3.5 w-3.5" />
															<span>Chi tiết / Trả lời</span>
														</button>
													</td>
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</div>

						{/* Reviews Pagination Bar */}
						{totalReviewPages > 1 && (
							<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
								<div>
									Hiển thị <strong>{(reviewPage - 1) * itemsPerPage + 1}</strong> -{' '}
									<strong>{Math.min(reviewPage * itemsPerPage, filteredReviews.length)}</strong> trên{' '}
									<strong>{filteredReviews.length}</strong> đánh giá
								</div>

								<div className="flex items-center gap-1.5">
									<button
										type="button"
										onClick={() => setReviewPage((p) => Math.max(p - 1, 1))}
										disabled={reviewPage === 1}
										className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
									>
										<FiChevronLeft className="h-4 w-4" />
									</button>

									{Array.from({ length: totalReviewPages }).map((_, idx) => {
										const pageNum = idx + 1
										if (
											pageNum === 1 ||
											pageNum === totalReviewPages ||
											(pageNum >= reviewPage - 1 && pageNum <= reviewPage + 1)
										) {
											return (
												<button
													key={pageNum}
													type="button"
													onClick={() => setReviewPage(pageNum)}
													className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
														reviewPage === pageNum
															? 'bg-slate-900 text-white shadow-xs'
															: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
													}`}
												>
													{pageNum}
												</button>
											)
										}
										return null
									})}

									<button
										type="button"
										onClick={() => setReviewPage((p) => Math.min(p + 1, totalReviewPages))}
										disabled={reviewPage === totalReviewPages}
										className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
									>
										<FiChevronRight className="h-4 w-4" />
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Order Detail Modal */}
			{selectedOrderForDetail && (
				<OrderDetailModal
					order={selectedOrderForDetail}
					onClose={() => setSelectedOrderForDetail(null)}
					onOrderUpdated={(updated) => {
						setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))
						setSelectedOrderForDetail(updated)
					}}
					onOpenPrint={(ord) => {
						setSelectedOrderForDetail(null)
						setSelectedOrderForPrint(ord)
					}}
				/>
			)}

			{/* Order Print Modal */}
			{selectedOrderForPrint && (
				<OrderPrintModal
					order={selectedOrderForPrint}
					onClose={() => setSelectedOrderForPrint(null)}
				/>
			)}

			{/* Customer Detail Modal */}
			{selectedCustomerForDetail && (
				<CustomerDetailModal
					customer={selectedCustomerForDetail}
					onClose={() => setSelectedCustomerForDetail(null)}
					onCustomerUpdated={(updated) => {
						setCustomers((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
						setSelectedCustomerForDetail(updated)
					}}
				/>
			)}

			{/* Review Detail & Response Modal */}
			{selectedReviewForDetail && (
				<ReviewModal
					review={selectedReviewForDetail}
					onClose={() => setSelectedReviewForDetail(null)}
					onReviewUpdated={(updated) => {
						setReviews((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
						setSelectedReviewForDetail(updated)
					}}
				/>
			)}
		</div>
	)
}
