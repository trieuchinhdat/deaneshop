'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiArrowRight,
	FiAward,
	FiBell,
	FiCheck,
	FiCheckCircle,
	FiChevronLeft,
	FiChevronRight,
	FiClock,
	FiDownload,
	FiExternalLink,
	FiEye,
	FiFileText,
	FiFilter,
	FiGift,
	FiGrid,
	FiImage,
	FiLayers,
	FiMail,
	FiMenu,
	FiMessageCircle,
	FiMessageSquare,
	FiPackage,
	FiPhone,
	FiPrinter,
	FiRefreshCw,
	FiSearch,
	FiShield,
	FiShoppingBag,
	FiStar,
	FiTrendingUp,
	FiTruck,
	FiUser,
	FiUserCheck,
	FiUserPlus,
	FiUsers,
	FiVolume2,
	FiVolumeX,
	FiX,
	FiXCircle,
} from 'react-icons/fi'
import { formatVND } from '@/lib/utils'
import CommentModal from './comment-modal'
import CustomerDetailModal from './customer-detail-modal'
import OrderDetailModal from './order-detail-modal'
import OrderPrintModal from './order-print-modal'
import ReviewModal from './review-modal'

type TabType = 'overview' | 'orders' | 'customers' | 'reviews' | 'comments'

type AdminWorkspaceProps = {
	initialOrders: any[]
	initialCustomers: any[]
	initialReviews: any[]
	initialComments: any[]
	adminUser?: any
}

const ORDER_STATUS_TABS = [
	{ label: 'Tất cả đơn', value: 'ALL' },
	{ label: 'Chờ xác nhận', value: 'PENDING' },
	{ label: 'Đang đóng gói', value: 'PROCESSING' },
	{ label: 'Đang giao hàng', value: 'SHIPPING' },
	{ label: 'Giao thành công', value: 'DELIVERED' },
	{ label: 'Đã hủy / Hoàn', value: 'CANCELLED' },
]

const CUSTOMER_TABS = [
	{ label: 'Tất cả khách', value: 'ALL' },
	{ label: 'Khách tiềm năng (Lead)', value: 'lead' },
	{ label: 'Đã mua hàng', value: 'customer' },
	{ label: 'Khách VIP (> 2tr)', value: 'vip' },
]

const REVIEW_TABS = [
	{ label: 'Tất cả', value: 'ALL' },
	{ label: 'Chờ duyệt', value: 'PENDING' },
	{ label: 'Đã duyệt', value: 'APPROVED' },
	{ label: '1 - 2 sao (Cần CSKH)', value: 'NEGATIVE' },
	{ label: '5 sao xuất sắc', value: 'FIVE_STAR' },
]

const COMMENT_TABS = [
	{ label: 'Tất cả bình luận', value: 'ALL' },
	{ label: 'Chờ duyệt', value: 'PENDING' },
	{ label: 'Đã duyệt', value: 'APPROVED' },
	{ label: 'Phản hồi chính thức', value: 'OFFICIAL_REPLY' },
]

const TIMEFRAME_OPTIONS = [
	{ label: '30 ngày qua (Khuyên dùng)', value: '30d' },
	{ label: '7 ngày qua', value: '7d' },
	{ label: '90 ngày qua', value: '90d' },
	{ label: 'Toàn bộ thời gian', value: 'all' },
]

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
	PENDING: {
		label: 'Chờ xác nhận',
		bg: 'bg-amber-50',
		text: 'text-amber-800',
		border: 'border-amber-200/80',
	},
	CONFIRMED: {
		label: 'Đã xác nhận',
		bg: 'bg-blue-50',
		text: 'text-blue-800',
		border: 'border-blue-200/80',
	},
	PROCESSING: {
		label: 'Đang đóng gói',
		bg: 'bg-indigo-50',
		text: 'text-indigo-800',
		border: 'border-indigo-200/80',
	},
	SHIPPING: {
		label: 'Đang giao hàng',
		bg: 'bg-purple-50',
		text: 'text-purple-800',
		border: 'border-purple-200/80',
	},
	DELIVERED: {
		label: 'Giao thành công',
		bg: 'bg-emerald-50',
		text: 'text-emerald-800',
		border: 'border-emerald-200/80',
	},
	CANCELLED: {
		label: 'Đã hủy',
		bg: 'bg-rose-50',
		text: 'text-rose-800',
		border: 'border-rose-200/80',
	},
	RETURNED: {
		label: 'Chuyển hoàn',
		bg: 'bg-slate-100',
		text: 'text-slate-700',
		border: 'border-slate-200',
	},
}

// Web Audio API crystal chime sound
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
		console.warn('AudioContext warning:', e)
	}
}

export default function AdminWorkspace({
	initialOrders = [],
	initialCustomers = [],
	initialReviews = [],
	initialComments = [],
}: AdminWorkspaceProps) {
	// Active Tab State
	const [activeTab, setActiveTab] = useState<TabType>('overview')
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

	// Main Data States
	const [orders, setOrders] = useState<any[]>(Array.isArray(initialOrders) ? initialOrders : [])
	const [customers, setCustomers] = useState<any[]>(
		Array.isArray(initialCustomers) ? initialCustomers : [],
	)
	const [reviews, setReviews] = useState<any[]>(
		Array.isArray(initialReviews) ? initialReviews : [],
	)
	const [comments, setComments] = useState<any[]>(
		Array.isArray(initialComments) ? initialComments : [],
	)

	// Timeframe & Pagination
	const [timeframe, setTimeframe] = useState('30d')
	const [orderPage, setOrderPage] = useState(1)
	const [customerPage, setCustomerPage] = useState(1)
	const [reviewPage, setReviewPage] = useState(1)
	const [commentPage, setCommentPage] = useState(1)
	const itemsPerPage = 12

	// Filter & Search states
	const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
	const [orderSearchQuery, setOrderSearchQuery] = useState('')
	const [customerTabFilter, setCustomerTabFilter] = useState('ALL')
	const [customerSearchQuery, setCustomerSearchQuery] = useState('')
	const [reviewStatusFilter, setReviewStatusFilter] = useState('ALL')
	const [reviewSearchQuery, setReviewSearchQuery] = useState('')
	const [commentStatusFilter, setCommentStatusFilter] = useState('ALL')
	const [commentSearchQuery, setCommentSearchQuery] = useState('')

	// Modals
	const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any | null>(null)
	const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<any | null>(null)
	const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<any | null>(null)
	const [selectedReviewForDetail, setSelectedReviewForDetail] = useState<any | null>(null)
	const [selectedCommentForDetail, setSelectedCommentForDetail] = useState<any | null>(null)

	// Realtime Polling & Sound
	const [soundEnabled, setSoundEnabled] = useState(true)
	const [newOrderAlertCount, setNewOrderAlertCount] = useState(0)
	const lastCheckedTimeRef = useRef<string>(new Date().toISOString())
	const [isPolling, setIsPolling] = useState(false)

	// Auto-polling every 25s
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
					if (Array.isArray(data.comments)) setComments(data.comments)
					lastCheckedTimeRef.current = data.timestamp || new Date().toISOString()
				}
			} catch (err) {
				console.error('Polling error:', err)
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
		const processingOrders = orders.filter(
			(o) => o.fulfillmentStatus === 'PROCESSING' || o.fulfillmentStatus === 'CONFIRMED',
		).length
		const shippingOrders = orders.filter((o) => o.fulfillmentStatus === 'SHIPPING').length
		const deliveredOrders = orders.filter((o) => o.fulfillmentStatus === 'DELIVERED').length
		const cancelledOrders = orders.filter(
			(o) => o.fulfillmentStatus === 'CANCELLED' || o.fulfillmentStatus === 'RETURNED',
		).length

		const totalRevenue = orders
			.filter((o) => o.fulfillmentStatus !== 'CANCELLED' && o.fulfillmentStatus !== 'RETURNED')
			.reduce((acc, o) => acc + (Number(o?.pricing?.grandTotal) || 0), 0)

		const totalCust = customers.length
		const popupLeads = customers.filter(
			(c) => c.cskhStatus === 'lead' || c.orderCount === 0 || !c.orderCount,
		).length
		const vipCustomers = customers.filter(
			(c) => c.cskhStatus === 'vip' || (Number(c.totalSpent) || 0) >= 2000000,
		).length
		const buyerCustomers = customers.filter((c) => (Number(c.orderCount) || 0) > 0).length

		const totalReviews = reviews.length
		const pendingReviews = reviews.filter((r) => !r.isApproved).length
		const fiveStarReviews = reviews.filter((r) => Number(r.rating) === 5).length
		const avgRating = totalReviews
			? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
			: '5.0'

		const totalComments = comments.length
		const pendingComments = comments.filter((c) => !c.isApproved).length
		const officialReplies = comments.filter((c) => c.isAuthorReply).length

		return {
			totalOrders,
			pendingOrders,
			processingOrders,
			shippingOrders,
			deliveredOrders,
			cancelledOrders,
			totalRevenue,
			totalCust,
			popupLeads,
			vipCustomers,
			buyerCustomers,
			totalReviews,
			pendingReviews,
			fiveStarReviews,
			avgRating,
			totalComments,
			pendingComments,
			officialReplies,
		}
	}, [orders, customers, reviews, comments])

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
				const matchTracking = order.trackingCode?.toLowerCase().includes(q)
				if (!matchId && !matchName && !matchPhone && !matchEmail && !matchTracking) return false
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

	// Filtered Comments List
	const filteredComments = useMemo(() => {
		return comments.filter((c) => {
			if (commentStatusFilter !== 'ALL') {
				if (commentStatusFilter === 'PENDING') {
					if (c.isApproved) return false
				} else if (commentStatusFilter === 'APPROVED') {
					if (!c.isApproved) return false
				} else if (commentStatusFilter === 'OFFICIAL_REPLY') {
					if (!c.isAuthorReply) return false
				}
			}

			if (commentSearchQuery.trim()) {
				const q = commentSearchQuery.trim().toLowerCase()
				const matchAuthor = c.authorName?.toLowerCase().includes(q)
				const matchEmail = c.authorEmail?.toLowerCase().includes(q)
				const matchContent = c.content?.toLowerCase().includes(q)
				const matchPost = c.post?.title?.toLowerCase().includes(q)
				if (!matchAuthor && !matchEmail && !matchContent && !matchPost) return false
			}

			return true
		})
	}, [comments, commentStatusFilter, commentSearchQuery])

	const totalCommentPages = Math.ceil(filteredComments.length / itemsPerPage) || 1
	const paginatedComments = useMemo(() => {
		const start = (commentPage - 1) * itemsPerPage
		return filteredComments.slice(start, start + itemsPerPage)
	}, [filteredComments, commentPage])

	// 1-Click Status Update for Orders
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
			console.error('Status update error:', err)
		}
	}

	// 1-Click Toggle Review Approval
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
			console.error('Review approval error:', err)
		}
	}

	// 1-Click Toggle Comment Approval
	const handleQuickToggleCommentApproval = async (
		commentId: string,
		currentApproved: boolean,
	) => {
		const nextState = !currentApproved
		try {
			setComments((prev) =>
				prev.map((c) => (c._id === commentId ? { ...c, isApproved: nextState } : c)),
			)

			await fetch('/api/admin/comments/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					commentId,
					isApproved: nextState,
				}),
			})
		} catch (err) {
			console.error('Comment approval error:', err)
		}
	}

	// Export CSV Helpers
	const exportOrdersToCSV = () => {
		const headers = [
			'Mã Đơn',
			'Khách Hàng',
			'SĐT',
			'Địa Chỉ',
			'Sản Phẩm',
			'Tổng Tiền',
			'Trạng Thái',
			'Đơn Vị VC',
			'Mã Vận Đơn',
			'Ngày Tạo',
		]
		const rows = filteredOrders.map((o) => [
			o.orderId || '',
			o.customer?.name || '',
			`'${o.customer?.phone || ''}`,
			`"${(o.customer?.address || '').replace(/"/g, '""')}"`,
			`"${(Array.isArray(o.items) ? o.items : []).map((i: any) => `${i?.title || 'Sản phẩm'} (x${i?.quantity || 1})`).join(', ')}"`,
			o.pricing?.grandTotal || 0,
			o.fulfillmentStatus || 'PENDING',
			o.carrier || '',
			o.trackingCode || '',
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
		const headers = [
			'Họ Tên',
			'Số Điện Thoại',
			'Email',
			'Địa Chỉ',
			'Nguồn',
			'Số Đơn',
			'Tổng Chi Tiêu',
			'Phân Khúc',
		]
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
		const headers = [
			'Người Đánh Giá',
			'Sản Phẩm',
			'Số Sao',
			'Nội Dung',
			'Trạng Thái',
			'Phản Hồi Shop',
			'Ngày Gửi',
		]
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

	const exportCommentsToCSV = () => {
		const headers = [
			'Người Bình Luận',
			'Email',
			'Bài Viết',
			'Nội Dung',
			'Trạng Thái',
			'Là Tác Giả',
			'Ngày Tạo',
		]
		const rows = filteredComments.map((c) => [
			c.authorName || '',
			c.authorEmail || '',
			c.post?.title || '',
			`"${(c.content || '').replace(/"/g, '""')}"`,
			c.isApproved ? 'Đã duyệt' : 'Chờ duyệt',
			c.isAuthorReply ? 'Tác giả' : 'Khách',
			c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : '',
		])

		const csvContent =
			'data:text/csv;charset=utf-8,\uFEFF' +
			[headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

		const encodedUri = encodeURI(csvContent)
		const link = document.createElement('a')
		link.setAttribute('href', encodedUri)
		link.setAttribute('download', `ecocros_comments_${new Date().toISOString().slice(0, 10)}.csv`)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	// Navigation items list
	const navItems = [
		{
			id: 'overview' as TabType,
			label: 'Tổng Quan',
			icon: FiGrid,
			badge: null,
		},
		{
			id: 'orders' as TabType,
			label: 'Quản Lý Đơn Hàng',
			icon: FiPackage,
			badge: kpiStats.pendingOrders > 0 ? kpiStats.pendingOrders : null,
			badgeColor: 'bg-amber-100 text-amber-900 border border-amber-200',
		},
		{
			id: 'customers' as TabType,
			label: 'Hồ Sơ Khách Hàng (CRM)',
			icon: FiUsers,
			badge: kpiStats.totalCust || null,
			badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
		},
		{
			id: 'reviews' as TabType,
			label: 'Đánh Giá Sản Phẩm',
			icon: FiStar,
			badge: kpiStats.pendingReviews > 0 ? kpiStats.pendingReviews : null,
			badgeColor: 'bg-amber-100 text-amber-900 border border-amber-200 font-bold',
		},
		{
			id: 'comments' as TabType,
			label: 'Bình Luận Blog & Q&A',
			icon: FiMessageSquare,
			badge: kpiStats.pendingComments > 0 ? kpiStats.pendingComments : null,
			badgeColor: 'bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold',
		},
	]

	return (
		<div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col md:flex-row antialiased font-sans">
			{/* Realtime Alert Toast Floating */}
			{newOrderAlertCount > 0 && (
				<div className="fixed top-4 right-4 z-50 flex items-center justify-between gap-4 rounded-2xl bg-emerald-900 p-4 text-white shadow-2xl border border-emerald-700/80 backdrop-blur-md animate-in slide-in-from-top-4 max-w-md">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 animate-bounce shadow-md">
							<FiBell className="h-5 w-5 font-bold text-white" />
						</div>
						<div>
							<h4 className="font-extrabold text-sm text-white">
								🔔 Có {newOrderAlertCount} đơn hàng mới vừa đặt!
							</h4>
							<p className="text-xs text-emerald-200">
								Khách vừa đặt hàng thành công. Vui lòng kiểm tra và liên hệ.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={() => {
								setNewOrderAlertCount(0)
								setActiveTab('orders')
								setOrderStatusFilter('PENDING')
								setOrderPage(1)
							}}
							className="rounded-xl bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-md hover:bg-slate-100 transition active:scale-95 cursor-pointer shrink-0"
						>
							Xem ngay
						</button>
						<button
							type="button"
							onClick={() => setNewOrderAlertCount(0)}
							className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
						>
							<FiX className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}

			{/* ================= DESKTOP LEFT SIDEBAR ================= */}
			<aside className="hidden md:flex md:w-72 lg:w-80 flex-col shrink-0 border-r border-slate-200/90 bg-white sticky top-0 h-screen z-30 overflow-y-auto shadow-2xs">
				{/* Brand Header */}
				<div className="p-6 border-b border-slate-200/90">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-900 text-white font-black text-xl shadow-md">
								E
							</div>
							<div>
								<div className="flex items-center gap-1.5">
									<span className="font-black text-lg tracking-tight text-slate-900">ECOCROS</span>
									<span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
										ADMIN
									</span>
								</div>
								<p className="text-[11px] font-semibold text-slate-500">
									Commerce Operations Hub
								</p>
							</div>
						</div>

						{/* Realtime Live Pulse */}
						<div
							className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600"
							title="Đồng bộ dữ liệu Realtime 25s/lần"
						>
							<span
								className={`h-2 w-2 rounded-full ${
									isPolling ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'
								}`}
							/>
							<span>{isPolling ? 'Syncing' : 'Live'}</span>
						</div>
					</div>
				</div>

				{/* Navigation Links */}
				<div className="flex-1 px-4 py-6 space-y-1.5">
					<div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
						Khu Vực Quản Trị
					</div>

					{navItems.map((item) => {
						const Icon = item.icon
						const isActive = activeTab === item.id

						return (
							<button
								key={item.id}
								type="button"
								onClick={() => setActiveTab(item.id)}
								className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-xs font-bold transition-all cursor-pointer ${
									isActive
										? 'bg-slate-900 text-white shadow-md font-black'
										: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
								}`}
							>
								<div className="flex items-center gap-3">
									<div
										className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
											isActive
												? 'bg-emerald-500 text-slate-950 shadow-xs'
												: 'bg-slate-100 text-slate-500'
										}`}
									>
										<Icon className="h-4 w-4" />
									</div>
									<span className="tracking-tight">{item.label}</span>
								</div>

								{item.badge !== null && (
									<span
										className={`rounded-full px-2 py-0.5 text-[10px] font-black shadow-2xs ${
											isActive
												? 'bg-white/20 text-white'
												: item.badgeColor || 'bg-slate-100 text-slate-600'
										}`}
									>
										{item.badge}
									</span>
								)}
							</button>
						)
					})}

					{/* Quick External Tools Section */}
					<div className="pt-6 px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
						Lối Tắt Hệ Thống
					</div>

					<div className="space-y-1">
						<a
							href="/studio"
							target="_blank"
							rel="noreferrer"
							className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition group"
						>
							<div className="flex items-center gap-2.5">
								<FiLayers className="h-4 w-4 text-indigo-600" />
								<span>Sanity Studio CMS</span>
							</div>
							<FiExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-900" />
						</a>

						<a
							href="/"
							target="_blank"
							rel="noreferrer"
							className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition group"
						>
							<div className="flex items-center gap-2.5">
								<FiExternalLink className="h-4 w-4 text-emerald-600" />
								<span>Xem Website Live</span>
							</div>
							<FiExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-900" />
						</a>
					</div>
				</div>

				{/* Utility & Sound Controls */}
				<div className="p-4 mx-4 mb-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
					<div className="flex items-center justify-between text-xs">
						<span className="font-bold text-slate-700">Chuông báo đơn mới</span>
						<button
							type="button"
							onClick={() => setSoundEnabled(!soundEnabled)}
							className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
								soundEnabled
									? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
									: 'bg-white text-slate-500 border border-slate-200'
							}`}
						>
							{soundEnabled ? <FiVolume2 className="h-3.5 w-3.5 text-emerald-600" /> : <FiVolumeX className="h-3.5 w-3.5" />}
							<span>{soundEnabled ? 'Bật' : 'Tắt'}</span>
						</button>
					</div>

					<button
						type="button"
						onClick={() => window.location.reload()}
						className="flex w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 py-2 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
					>
						<FiRefreshCw className="h-3.5 w-3.5 text-slate-500" />
						<span>Làm mới toàn bộ</span>
					</button>
				</div>
			</aside>

			{/* ================= MOBILE HEADER & DRAWER ================= */}
			<div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
				<div className="flex items-center gap-2.5">
					<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-sm shadow-sm">
						E
					</div>
					<span className="font-black text-base tracking-tight text-slate-900">ECOCROS ADMIN</span>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setSoundEnabled(!soundEnabled)}
						className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
					>
						{soundEnabled ? <FiVolume2 className="h-4 w-4 text-emerald-600" /> : <FiVolumeX className="h-4 w-4" />}
					</button>
					<button
						type="button"
						onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
						className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs"
					>
						{isMobileSidebarOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
					</button>
				</div>
			</div>

			{/* Mobile Drawer Menu */}
			{isMobileSidebarOpen && (
				<div className="md:hidden fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex flex-col p-4 animate-in fade-in">
					<div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 flex flex-col flex-1">
						<div className="flex items-center justify-between pb-4 border-b border-slate-200">
							<span className="font-black text-lg text-slate-900">Menu Quản Trị</span>
							<button
								type="button"
								onClick={() => setIsMobileSidebarOpen(false)}
								className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
							>
								<FiX className="h-5 w-5" />
							</button>
						</div>

						<div className="flex-1 py-4 space-y-2 overflow-y-auto">
							{navItems.map((item) => {
								const Icon = item.icon
								const isActive = activeTab === item.id

								return (
									<button
										key={item.id}
										type="button"
										onClick={() => {
											setActiveTab(item.id)
											setIsMobileSidebarOpen(false)
										}}
										className={`flex w-full items-center justify-between rounded-2xl p-3.5 text-xs font-bold transition ${
											isActive
												? 'bg-slate-900 text-white shadow-md'
												: 'bg-slate-50 text-slate-700 hover:bg-slate-100'
										}`}
									>
										<div className="flex items-center gap-3">
											<Icon className="h-4 w-4" />
											<span>{item.label}</span>
										</div>
										{item.badge !== null && (
											<span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px]">
												{item.badge}
											</span>
										)}
									</button>
								)
							})}

							<div className="pt-4 border-t border-slate-200 space-y-2">
								<a
									href="/studio"
									target="_blank"
									className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
								>
									<FiLayers className="h-4 w-4 text-indigo-600" />
									<span>Mở Sanity Studio</span>
								</a>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ================= MAIN CONTENT AREA ================= */}
			<main className="flex-1 min-w-0 bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
				{/* Top Bar Controls & Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
								{activeTab === 'overview' && '📊 Tổng Quan Vận Hành Bán Hàng'}
								{activeTab === 'orders' && '📦 Quản Lý Đơn Hàng & Giao Vận'}
								{activeTab === 'customers' && '👥 Hồ Sơ Khách Hàng 360° (CRM)'}
								{activeTab === 'reviews' && '⭐ Kiểm Duyệt Đánh Giá Sản Phẩm'}
								{activeTab === 'comments' && '💬 Kiểm Duyệt Bình Luận Bài Viết Blog'}
							</h1>
						</div>
						<p className="text-xs sm:text-sm text-slate-500 mt-1">
							{activeTab === 'overview' &&
								'Tổng hợp chỉ số doanh thu, trạng thái xử lý đơn hàng và phản hồi của khách hàng.'}
							{activeTab === 'orders' &&
								'Theo dõi quy trình đóng gói, giao vận, cập nhật trạng thái và in phiếu đóng gói.'}
							{activeTab === 'customers' &&
								'Thông tin khách hàng tích lũy, phân nhóm VIP và theo dõi ghi chú chăm sóc.'}
							{activeTab === 'reviews' &&
								'Kiểm tra nội dung review, hình ảnh/video thực tế và gửi phản hồi công khai của shop.'}
							{activeTab === 'comments' &&
								'Quản lý bình luận độc giả, phát hiện spam và trả lời với tư cách Chuyên gia / Tác giả.'}
						</p>
					</div>

					<div className="flex items-center gap-2.5 self-start sm:self-auto">
						{/* Timeframe selector */}
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

						{/* Export Button */}
						{activeTab !== 'overview' && (
							<button
								type="button"
								onClick={
									activeTab === 'orders'
										? exportOrdersToCSV
										: activeTab === 'customers'
											? exportCustomersToCSV
											: activeTab === 'reviews'
												? exportReviewsToCSV
												: exportCommentsToCSV
								}
								className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
							>
								<FiDownload className="h-3.5 w-3.5 text-slate-500" />
								<span className="hidden sm:inline">Xuất CSV</span>
							</button>
						)}
					</div>
				</div>

				{/* ================= TAB 0: EXECUTIVE OVERVIEW HUB ================= */}
				{activeTab === 'overview' && (
					<div className="space-y-6 animate-in fade-in duration-200">
						{/* Top 4 Metric Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{/* Card 1: Doanh thu */}
							<div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs relative overflow-hidden">
								<div className="flex items-center justify-between">
									<span className="text-xs font-black uppercase tracking-wider text-slate-400">
										Tổng Doanh Thu
									</span>
									<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
										<FiTrendingUp className="h-5 w-5" />
									</span>
								</div>
								<div className="mt-3">
									<div className="font-mono text-2xl sm:text-3xl font-black text-slate-900">
										{formatVND(kpiStats.totalRevenue)}
									</div>
									<div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-1">
										<span>{kpiStats.deliveredOrders} đơn giao thành công</span>
									</div>
								</div>
							</div>

							{/* Card 2: Đơn cần xử lý */}
							<div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs relative overflow-hidden">
								<div className="flex items-center justify-between">
									<span className="text-xs font-black uppercase tracking-wider text-slate-400">
										Đơn Hàng Cần Xử Lý
									</span>
									<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
										<FiClock className="h-5 w-5" />
									</span>
								</div>
								<div className="mt-3">
									<div className="font-mono text-2xl sm:text-3xl font-black text-amber-700">
										{kpiStats.pendingOrders}
									</div>
									<div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
										<span>{kpiStats.processingOrders} đang đóng gói</span>
										<span>•</span>
										<span>{kpiStats.shippingOrders} đang giao</span>
									</div>
								</div>
							</div>

							{/* Card 3: Khách hàng CRM */}
							<div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs relative overflow-hidden">
								<div className="flex items-center justify-between">
									<span className="text-xs font-black uppercase tracking-wider text-slate-400">
										Khách Hàng & Leads
									</span>
									<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
										<FiUsers className="h-5 w-5" />
									</span>
								</div>
								<div className="mt-3">
									<div className="font-mono text-2xl sm:text-3xl font-black text-slate-900">
										{kpiStats.totalCust}
									</div>
									<div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
										<span className="text-emerald-700 font-bold">{kpiStats.vipCustomers} VIP</span>
										<span>•</span>
										<span>{kpiStats.popupLeads} Leads Popup</span>
									</div>
								</div>
							</div>

							{/* Card 4: Kiểm duyệt chờ xử lý */}
							<div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs relative overflow-hidden">
								<div className="flex items-center justify-between">
									<span className="text-xs font-black uppercase tracking-wider text-slate-400">
										Kiểm Duyệt Nội Dung
									</span>
									<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
										<FiMessageCircle className="h-5 w-5" />
									</span>
								</div>
								<div className="mt-3">
									<div className="font-mono text-2xl sm:text-3xl font-black text-indigo-800">
										{kpiStats.pendingReviews + kpiStats.pendingComments}
									</div>
									<div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
										<span>{kpiStats.pendingReviews} review</span>
										<span>•</span>
										<span>{kpiStats.pendingComments} comment blog</span>
									</div>
								</div>
							</div>
						</div>

						{/* 2-Column Section: Recent Activities & Fast Actions */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Left 2 Cols: Recent Incoming Orders Stream */}
							<div className="lg:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 space-y-4 shadow-xs">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2.5">
										<FiPackage className="h-5 w-5 text-emerald-700" />
										<h3 className="font-black text-base text-slate-900">
											Đơn Hàng Gần Đây Nhất
										</h3>
									</div>
									<button
										type="button"
										onClick={() => setActiveTab('orders')}
										className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
									>
										<span>Xem toàn bộ</span>
										<FiArrowRight className="h-3.5 w-3.5" />
									</button>
								</div>

								{orders.slice(0, 5).length === 0 ? (
									<div className="text-center py-8 text-slate-400 text-xs">
										Chưa có đơn hàng nào trong hệ thống.
									</div>
								) : (
									<div className="space-y-2.5">
										{orders.slice(0, 5).map((order) => {
											const statusBadge =
												STATUS_BADGES[order.fulfillmentStatus] || STATUS_BADGES.PENDING

											return (
												<div
													key={order._id}
													className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition"
												>
													<div className="flex items-center gap-3">
														<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-200 font-mono text-xs font-bold shadow-2xs">
															#
														</div>
														<div>
															<div className="flex items-center gap-2">
																<span className="font-mono font-black text-sm text-slate-900">
																	{order.orderId || order._id.slice(0, 8)}
																</span>
																<span
																	className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
																>
																	{statusBadge.label}
																</span>
															</div>
															<p className="text-xs text-slate-500 mt-0.5">
																{order.customer?.name || 'Khách vãng lai'} •{' '}
																{order.customer?.phone || 'Chưa có SĐT'}
															</p>
														</div>
													</div>

													<div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
														<div className="text-right">
															<span className="font-mono font-black text-sm text-slate-900 block">
																{formatVND(order.pricing?.grandTotal || 0)}
															</span>
															<span className="text-[10px] text-slate-400">
																{order._createdAt
																	? new Date(order._createdAt).toLocaleDateString('vi-VN')
																	: ''}
															</span>
														</div>

														<button
															type="button"
															onClick={() => setSelectedOrderForDetail(order)}
															className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white transition cursor-pointer shadow-2xs"
															title="Xem chi tiết đơn"
														>
															<FiEye className="h-4 w-4" />
														</button>
													</div>
												</div>
											)
										})}
									</div>
								)}
							</div>

							{/* Right 1 Col: Quick Mod Action Cards */}
							<div className="space-y-4">
								{/* Reviews Pending Box */}
								<div className="rounded-3xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-xs">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<FiStar className="h-4 w-4 text-amber-500 fill-amber-500" />
											<h4 className="font-black text-sm text-slate-900">Đánh Giá Chờ Duyệt</h4>
										</div>
										<span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200">
											{kpiStats.pendingReviews} mới
										</span>
									</div>
									<p className="text-xs text-slate-500">
										Có {kpiStats.pendingReviews} đánh giá sản phẩm cần kiểm duyệt trước khi hiển thị công khai.
									</p>
									<button
										type="button"
										onClick={() => {
											setActiveTab('reviews')
											setReviewStatusFilter('PENDING')
										}}
										className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 py-2.5 text-xs font-bold transition cursor-pointer"
									>
										<span>Kiểm duyệt Đánh giá</span>
										<FiArrowRight className="h-3.5 w-3.5" />
									</button>
								</div>

								{/* Comments Pending Box */}
								<div className="rounded-3xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-xs">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<FiMessageSquare className="h-4 w-4 text-indigo-600" />
											<h4 className="font-black text-sm text-slate-900">Bình Luận Blog Chờ</h4>
										</div>
										<span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-800 border border-indigo-200">
											{kpiStats.pendingComments} mới
										</span>
									</div>
									<p className="text-xs text-slate-500">
										Độc giả gửi câu hỏi/bình luận trên bài viết cần kiểm duyệt và trả lời chính thức.
									</p>
									<button
										type="button"
										onClick={() => {
											setActiveTab('comments')
											setCommentStatusFilter('PENDING')
										}}
										className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 py-2.5 text-xs font-bold transition cursor-pointer"
									>
										<span>Kiểm duyệt Bình luận</span>
										<FiArrowRight className="h-3.5 w-3.5" />
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* ================= TAB 1: ORDERS MANAGEMENT ================= */}
				{activeTab === 'orders' && (
					<div className="space-y-6 animate-in fade-in duration-200">
						{/* Orders Specific KPI Overview Cards */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
									Tổng đơn hàng
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-slate-900">
										{filteredOrders.length}
									</span>
									<span className="text-[10px] text-slate-400 font-bold">đơn trong bộ lọc</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-amber-700 block">
									Chờ xác nhận
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-amber-700">
										{kpiStats.pendingOrders}
									</span>
									<span className="text-[10px] text-amber-600 font-bold">Cần gọi xác nhận</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-purple-700 block">
									Đang giao hàng
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-purple-700">
										{kpiStats.shippingOrders}
									</span>
									<span className="text-[10px] text-purple-600 font-bold">Đang vận chuyển</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block">
									Doanh thu lọc
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-xl font-black text-emerald-700 truncate">
										{formatVND(
											filteredOrders
												.filter(
													(o) =>
														o.fulfillmentStatus !== 'CANCELLED' &&
														o.fulfillmentStatus !== 'RETURNED',
												)
												.reduce((acc, o) => acc + (Number(o?.pricing?.grandTotal) || 0), 0),
										)}
									</span>
								</div>
							</div>
						</div>

						{/* Filters Bar: Status Pills & Search */}
						<div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
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
										className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
											orderStatusFilter === tab.value
												? 'bg-slate-900 text-white shadow-xs font-black'
												: 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
										}`}
									>
										{tab.label}
									</button>
								))}
							</div>

							{/* Search Box */}
							<div className="relative w-full lg:w-72">
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
									placeholder="Tìm mã đơn, tên khách, SĐT..."
									className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden shadow-2xs"
								/>
							</div>
						</div>

						{/* Orders Table */}
						<div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
										<tr>
											<th className="px-4 py-3.5">Mã Đơn / Ngày Tạo</th>
											<th className="px-4 py-3.5">Khách Hàng</th>
											<th className="px-4 py-3.5">Sản Phẩm</th>
											<th className="px-4 py-3.5">Tổng Tiền</th>
											<th className="px-4 py-3.5">Trạng Thái</th>
											<th className="px-4 py-3.5">Thao Tác Nhanh</th>
											<th className="px-4 py-3.5 text-right">Chi Tiết</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{paginatedOrders.length === 0 ? (
											<tr>
												<td colSpan={7} className="px-4 py-12 text-center text-slate-400">
													Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
												</td>
											</tr>
										) : (
											paginatedOrders.map((order) => {
												const statusBadge =
													STATUS_BADGES[order.fulfillmentStatus] || STATUS_BADGES.PENDING

												return (
													<tr key={order._id} className="hover:bg-slate-50/60 transition">
														{/* Col 1: Order ID */}
														<td className="px-4 py-3.5 font-mono">
															<span className="font-black text-sm text-slate-900 block">
																{order.orderId || order._id.slice(0, 8)}
															</span>
															<span className="text-[10px] text-slate-400">
																{order._createdAt
																	? new Date(order._createdAt).toLocaleString('vi-VN')
																	: ''}
															</span>
														</td>

														{/* Col 2: Customer */}
														<td className="px-4 py-3.5">
															<div className="font-bold text-slate-900">
																{order.customer?.name || 'Khách vãng lai'}
															</div>
															<div className="text-[11px] text-slate-500">
																{order.customer?.phone || 'Chưa có SĐT'}
															</div>
															{order.customer?.address && (
																<div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
																	{order.customer.address}
																</div>
															)}
														</td>

														{/* Col 3: Items */}
														<td className="px-4 py-3.5">
															<div className="text-slate-700 line-clamp-2 max-w-xs font-medium">
																{(Array.isArray(order.items) ? order.items : [])
																	.map((i: any) => `${i?.title || 'Sản phẩm'} (x${i?.quantity || 1})`)
																	.join(', ') || '0 sản phẩm'}
															</div>
														</td>

														{/* Col 4: Total */}
														<td className="px-4 py-3.5 font-mono">
															<span className="font-black text-sm text-emerald-700 block">
																{formatVND(order.pricing?.grandTotal || 0)}
															</span>
															<span className="text-[10px] text-slate-400 uppercase">
																{order.paymentMethod || 'COD'}
															</span>
														</td>

														{/* Col 5: Status */}
														<td className="px-4 py-3.5">
															<span
																className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
															>
																{statusBadge.label}
															</span>
														</td>

														{/* Col 6: Quick Status Change Dropdown */}
														<td className="px-4 py-3.5">
															<select
																value={order.fulfillmentStatus || 'PENDING'}
																onChange={(e) =>
																	handleQuickStatusChange(order._id, e.target.value)
																}
																className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 focus:border-emerald-600 focus:outline-hidden cursor-pointer shadow-2xs"
															>
																<option value="PENDING">Chờ xác nhận</option>
																<option value="PROCESSING">Đang đóng gói</option>
																<option value="SHIPPING">Đang giao hàng</option>
																<option value="DELIVERED">Giao thành công</option>
																<option value="CANCELLED">Hủy đơn</option>
																<option value="RETURNED">Chuyển hoàn</option>
															</select>
														</td>

														{/* Col 7: Actions */}
														<td className="px-4 py-3.5 text-right space-x-1.5">
															<button
																type="button"
																onClick={() => setSelectedOrderForPrint(order)}
																className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
																title="In phiếu đóng gói"
															>
																<FiPrinter className="h-4 w-4" />
															</button>

															<button
																type="button"
																onClick={() => setSelectedOrderForDetail(order)}
																className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
																title="Xem chi tiết đơn hàng"
															>
																<FiEye className="h-4 w-4" />
															</button>
														</td>
													</tr>
												)
											})
										)}
									</tbody>
								</table>
							</div>

							{/* Pagination */}
							{totalOrderPages > 1 && (
								<div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs">
									<span className="text-slate-500">
										Trang <span className="font-bold text-slate-900">{orderPage}</span> /{' '}
										{totalOrderPages} ({filteredOrders.length} đơn)
									</span>

									<div className="flex items-center gap-2">
										<button
											type="button"
											disabled={orderPage === 1}
											onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
											className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
										>
											<FiChevronLeft className="h-4 w-4" />
										</button>
										<button
											type="button"
											disabled={orderPage === totalOrderPages}
											onClick={() => setOrderPage((p) => Math.min(totalOrderPages, p + 1))}
											className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
										>
											<FiChevronRight className="h-4 w-4" />
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* ================= TAB 2: CUSTOMERS CRM ================= */}
				{activeTab === 'customers' && (
					<div className="space-y-6 animate-in fade-in duration-200">
						{/* Customers Specific KPI Overview Cards */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
									Tổng khách hàng
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-slate-900">
										{filteredCustomers.length}
									</span>
									<span className="text-[10px] text-slate-400 font-bold">hồ sơ</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block">
									Khách VIP
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-emerald-700">
										{kpiStats.vipCustomers}
									</span>
									<span className="text-[10px] text-emerald-600 font-bold">Chi tiêu {'>'} 2tr</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-blue-700 block">
									Leads Popup & Form
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-blue-700">
										{kpiStats.popupLeads}
									</span>
									<span className="text-[10px] text-blue-600 font-bold">Tiềm năng</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 block">
									Đã mua hàng
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-indigo-700">
										{kpiStats.buyerCustomers}
									</span>
									<span className="text-[10px] text-indigo-600 font-bold">Khách thực tế</span>
								</div>
							</div>
						</div>

						{/* Filters Bar: Tabs & Search */}
						<div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
							<div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
								{CUSTOMER_TABS.map((tab) => (
									<button
										key={tab.value}
										type="button"
										onClick={() => {
											setCustomerTabFilter(tab.value)
											setCustomerPage(1)
										}}
										className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
											customerTabFilter === tab.value
												? 'bg-slate-900 text-white shadow-xs font-black'
												: 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
										}`}
									>
										{tab.label}
									</button>
								))}
							</div>

							<div className="relative w-full lg:w-72">
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
									placeholder="Tìm tên, SĐT, email khách..."
									className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden shadow-2xs"
								/>
							</div>
						</div>

						{/* Customers Table */}
						<div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
										<tr>
											<th className="px-4 py-3.5">Họ Tên & Liên Hệ</th>
											<th className="px-4 py-3.5">Email</th>
											<th className="px-4 py-3.5">Phân Khúc</th>
											<th className="px-4 py-3.5">Số Đơn</th>
											<th className="px-4 py-3.5">Tổng Chi Tiêu</th>
											<th className="px-4 py-3.5">Ghi Chú CSKH</th>
											<th className="px-4 py-3.5 text-right">Chi Tiết</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{paginatedCustomers.length === 0 ? (
											<tr>
												<td colSpan={7} className="px-4 py-12 text-center text-slate-400">
													Không tìm thấy khách hàng nào phù hợp.
												</td>
											</tr>
										) : (
											paginatedCustomers.map((cust) => (
												<tr key={cust._id} className="hover:bg-slate-50/60 transition">
													<td className="px-4 py-3.5">
														<div className="font-bold text-slate-900 text-sm">
															{cust.name || 'Khách tiềm năng'}
														</div>
														<div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
															<FiPhone className="h-3 w-3" />
															<span>{cust.phone || 'Chưa có SĐT'}</span>
														</div>
													</td>

													<td className="px-4 py-3.5 text-slate-700 font-medium">
														{cust.email || '—'}
													</td>

													<td className="px-4 py-3.5">
														{cust.cskhStatus === 'vip' || (Number(cust.totalSpent) || 0) >= 2000000 ? (
															<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-black">
																<FiAward className="h-3 w-3" /> VIP
															</span>
														) : cust.cskhStatus === 'lead' || (Number(cust.orderCount) || 0) === 0 ? (
															<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
																<FiGift className="h-3 w-3" /> Lead Popup
															</span>
														) : (
															<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 text-[10px] font-bold">
																<FiUserCheck className="h-3 w-3" /> Đã Mua Hàng
															</span>
														)}
													</td>

													<td className="px-4 py-3.5 font-mono text-slate-900 font-bold">
														{cust.orderCount || 0} đơn
													</td>

													<td className="px-4 py-3.5 font-mono font-black text-emerald-700">
														{formatVND(cust.totalSpent || 0)}
													</td>

													<td className="px-4 py-3.5">
														<span className="text-slate-500 line-clamp-1 max-w-xs text-[11px]">
															{Array.isArray(cust.internalNotes) && cust.internalNotes.length > 0
																? cust.internalNotes[0].note
																: '— Chưa có ghi chú —'}
														</span>
													</td>

													<td className="px-4 py-3.5 text-right">
														<button
															type="button"
															onClick={() => setSelectedCustomerForDetail(cust)}
															className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition cursor-pointer"
															title="Xem & Cập nhật ghi chú CSKH"
														>
															<FiEye className="h-4 w-4" />
														</button>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>

							{totalCustomerPages > 1 && (
								<div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs">
									<span className="text-slate-500">
										Trang <span className="font-bold text-slate-900">{customerPage}</span> /{' '}
										{totalCustomerPages} ({filteredCustomers.length} khách)
									</span>

									<div className="flex items-center gap-2">
										<button
											type="button"
											disabled={customerPage === 1}
											onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
											className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
										>
											<FiChevronLeft className="h-4 w-4" />
										</button>
										<button
											type="button"
											disabled={customerPage === totalCustomerPages}
											onClick={() => setCustomerPage((p) => Math.min(totalCustomerPages, p + 1))}
											className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
										>
											<FiChevronRight className="h-4 w-4" />
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* ================= TAB 3: PRODUCT REVIEWS ================= */}
				{activeTab === 'reviews' && (
					<div className="space-y-6 animate-in fade-in duration-200">
						{/* Reviews Specific KPI Overview Cards */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
									Tổng đánh giá
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-slate-900">
										{filteredReviews.length}
									</span>
									<span className="text-[10px] text-slate-400 font-bold">nhận xét</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-amber-700 block">
									Chờ duyệt
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-amber-700">
										{kpiStats.pendingReviews}
									</span>
									<span className="text-[10px] text-amber-600 font-bold">Cần xét duyệt</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block">
									Điểm trung bình
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-emerald-700">
										{kpiStats.avgRating}
									</span>
									<span className="text-[10px] text-emerald-600 font-bold">/ 5.0 sao</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-yellow-700 block">
									5 sao xuất sắc
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-yellow-700">
										{kpiStats.fiveStarReviews}
									</span>
									<span className="text-[10px] text-yellow-600 font-bold">Hài lòng</span>
								</div>
							</div>
						</div>

						{/* Filters Bar */}
						<div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
							<div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
								{REVIEW_TABS.map((tab) => (
									<button
										key={tab.value}
										type="button"
										onClick={() => {
											setReviewStatusFilter(tab.value)
											setReviewPage(1)
										}}
										className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
											reviewStatusFilter === tab.value
												? 'bg-slate-900 text-white shadow-xs font-black'
												: 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
										}`}
									>
										{tab.label}
									</button>
								))}
							</div>

							<div className="relative w-full lg:w-72">
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
									placeholder="Tìm tên khách, sản phẩm, nội dung..."
									className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden shadow-2xs"
								/>
							</div>
						</div>

						{/* Reviews Table */}
						<div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
										<tr>
											<th className="px-4 py-3.5">Người Đánh Giá / Sản Phẩm</th>
											<th className="px-4 py-3.5">Số Sao</th>
											<th className="px-4 py-3.5">Nội Dung Nhận Xét</th>
											<th className="px-4 py-3.5">Media Thực Tế</th>
											<th className="px-4 py-3.5">Trạng Thái</th>
											<th className="px-4 py-3.5">Duyệt Nhanh</th>
											<th className="px-4 py-3.5 text-right">Chi Tiết</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{paginatedReviews.length === 0 ? (
											<tr>
												<td colSpan={7} className="px-4 py-12 text-center text-slate-400">
													Không tìm thấy đánh giá nào phù hợp.
												</td>
											</tr>
										) : (
											paginatedReviews.map((rev) => {
												const safeImages = Array.isArray(rev?.images) ? rev.images : []
												const safeVideos = Array.isArray(rev?.videos) ? rev.videos : []
												const mediaCount = safeImages.length + safeVideos.length

												return (
													<tr key={rev._id} className="hover:bg-slate-50/60 transition">
														<td className="px-4 py-3.5">
															<div className="font-bold text-slate-900 text-sm">
																{rev.author || 'Khách hàng'}
															</div>
															<div className="text-emerald-700 font-semibold text-[11px] mt-0.5 line-clamp-1 max-w-xs">
																📦 {rev.product?.title || '[Sản phẩm chung]'}
															</div>
															<div className="text-[10px] text-slate-400 mt-0.5">
																{rev.createdAt
																	? new Date(rev.createdAt).toLocaleDateString('vi-VN')
																	: ''}
															</div>
														</td>

														<td className="px-4 py-3.5 font-mono">
															<div className="flex items-center gap-1">
																<span className="font-black text-amber-600 text-sm">
																	{rev.rating || 5}★
																</span>
															</div>
														</td>

														<td className="px-4 py-3.5">
															<p className="text-slate-700 line-clamp-2 max-w-sm font-medium">
																{rev.comment || '(Không để lại nhận xét bằng chữ)'}
															</p>
															{rev.response && (
																<span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-1">
																	<FiCheck className="h-3 w-3" /> Shop đã phản hồi
																</span>
															)}
														</td>

														<td className="px-4 py-3.5">
															{mediaCount > 0 ? (
																<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
																	<FiImage className="h-3 w-3 text-indigo-600" />
																	<span>{mediaCount} tệp</span>
																</span>
															) : (
																<span className="text-slate-400 text-[10px]">Không có</span>
															)}
														</td>

														<td className="px-4 py-3.5">
															{rev.isApproved ? (
																<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
																	Đã duyệt (Hiện)
																</span>
															) : (
																<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
																	Chờ duyệt (Ẩn)
																</span>
															)}
														</td>

														<td className="px-4 py-3.5">
															<button
																type="button"
																onClick={() =>
																	handleQuickToggleReviewApproval(rev._id, rev.isApproved)
																}
																className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
																	rev.isApproved
																		? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
																		: 'bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-2xs'
																}`}
															>
																{rev.isApproved ? 'Ẩn review' : 'Duyệt ngay'}
															</button>
														</td>

														<td className="px-4 py-3.5 text-right">
															<button
																type="button"
																onClick={() => setSelectedReviewForDetail(rev)}
																className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition cursor-pointer"
																title="Xem ảnh & phản hồi shop"
															>
																<FiEye className="h-4 w-4" />
															</button>
														</td>
													</tr>
												)
											})
										)}
									</tbody>
								</table>
							</div>

							{totalReviewPages > 1 && (
								<div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs">
									<span className="text-slate-500">
										Trang <span className="font-bold text-slate-900">{reviewPage}</span> /{' '}
										{totalReviewPages} ({filteredReviews.length} đánh giá)
									</span>

									<div className="flex items-center gap-2">
										<button
											type="button"
											disabled={reviewPage === 1}
											onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
											className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
										>
											<FiChevronLeft className="h-4 w-4" />
										</button>
										<button
											type="button"
											disabled={reviewPage === totalReviewPages}
											onClick={() => setReviewPage((p) => Math.min(totalReviewPages, p + 1))}
											className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
										>
											<FiChevronRight className="h-4 w-4" />
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* ================= TAB 4: BLOG COMMENTS ================= */}
				{activeTab === 'comments' && (
					<div className="space-y-6 animate-in fade-in duration-200">
						{/* Comments Specific KPI Overview Cards */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
									Tổng bình luận
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-slate-900">
										{filteredComments.length}
									</span>
									<span className="text-[10px] text-slate-400 font-bold">bình luận blog</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 block">
									Chờ duyệt
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-indigo-700">
										{kpiStats.pendingComments}
									</span>
									<span className="text-[10px] text-indigo-600 font-bold">Cần xét duyệt</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block">
									Đã hiển thị công khai
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-emerald-700">
										{comments.filter((c) => c.isApproved).length}
									</span>
									<span className="text-[10px] text-emerald-600 font-bold">Đã duyệt</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="text-[11px] font-black uppercase tracking-wider text-blue-700 block">
									Phản hồi Tác giả
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-blue-700">
										{kpiStats.officialReplies}
									</span>
									<span className="text-[10px] text-blue-600 font-bold">Official badge</span>
								</div>
							</div>
						</div>

						{/* Filters Bar */}
						<div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
							<div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
								{COMMENT_TABS.map((tab) => (
									<button
										key={tab.value}
										type="button"
										onClick={() => {
											setCommentStatusFilter(tab.value)
											setCommentPage(1)
										}}
										className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
											commentStatusFilter === tab.value
												? 'bg-slate-900 text-white shadow-xs font-black'
												: 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
										}`}
									>
										{tab.label}
									</button>
								))}
							</div>

							<div className="relative w-full lg:w-72">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
									<FiSearch className="h-4 w-4" />
								</div>
								<input
									type="text"
									value={commentSearchQuery}
									onChange={(e) => {
										setCommentSearchQuery(e.target.value)
										setCommentPage(1)
									}}
									placeholder="Tìm tên, email, nội dung, bài..."
									className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden shadow-2xs"
								/>
							</div>
						</div>

						{/* Comments Table */}
						<div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
										<tr>
											<th className="px-4 py-3.5">Người Bình Luận / Email</th>
											<th className="px-4 py-3.5">Bài Viết Đích</th>
											<th className="px-4 py-3.5">Nội Dung Bình Luận</th>
											<th className="px-4 py-3.5">Huy Hiệu</th>
											<th className="px-4 py-3.5">Trạng Thái</th>
											<th className="px-4 py-3.5">Duyệt Nhanh</th>
											<th className="px-4 py-3.5 text-right">Chi Tiết</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{paginatedComments.length === 0 ? (
											<tr>
												<td colSpan={7} className="px-4 py-12 text-center text-slate-400">
													Không tìm thấy bình luận nào phù hợp.
												</td>
											</tr>
										) : (
											paginatedComments.map((com) => (
												<tr key={com._id} className="hover:bg-slate-50/60 transition">
													<td className="px-4 py-3.5">
														<div className="font-bold text-slate-900 text-sm">
															{com.authorName || 'Độc giả'}
														</div>
														<div className="text-slate-500 text-[11px] mt-0.5">
															{com.authorEmail || 'Chưa có email'}
														</div>
														<div className="text-[10px] text-slate-400 mt-0.5">
															{com.createdAt
																? new Date(com.createdAt).toLocaleDateString('vi-VN')
																: ''}
														</div>
													</td>

													<td className="px-4 py-3.5">
														<div className="font-bold text-indigo-700 line-clamp-1 max-w-xs">
															{com.post?.title || 'Bài viết Blog'}
														</div>
														{com.parentComment && (
															<span className="text-[10px] text-slate-500 italic block mt-0.5">
																↳ Trả lời {com.parentComment.authorName || 'khách'}
															</span>
														)}
													</td>

													<td className="px-4 py-3.5">
														<p className="text-slate-700 line-clamp-2 max-w-sm font-medium">
															{com.content}
														</p>
													</td>

													<td className="px-4 py-3.5">
														{com.isAuthorReply ? (
															<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-black">
																<FiAward className="h-3 w-3" /> Tác Giả
															</span>
														) : (
															<span className="text-slate-500 text-[10px]">Độc giả</span>
														)}
													</td>

													<td className="px-4 py-3.5">
														{com.isApproved ? (
															<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
																Đã duyệt (Hiện)
															</span>
														) : (
															<span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold">
																Chờ duyệt (Ẩn)
															</span>
														)}
													</td>

													<td className="px-4 py-3.5">
														<button
															type="button"
															onClick={() =>
																handleQuickToggleCommentApproval(com._id, com.isApproved)
															}
															className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
																com.isApproved
																	? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
																	: 'bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-2xs'
															}`}
														>
															{com.isApproved ? 'Ẩn đi' : 'Duyệt ngay'}
														</button>
													</td>

													<td className="px-4 py-3.5 text-right">
														<button
															type="button"
															onClick={() => setSelectedCommentForDetail(com)}
															className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition cursor-pointer"
															title="Xem chi tiết & Trả lời tác giả"
														>
															<FiEye className="h-4 w-4" />
														</button>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>

							{totalCommentPages > 1 && (
								<div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50 text-xs">
									<span className="text-slate-500">
										Trang <span className="font-bold text-slate-900">{commentPage}</span> /{' '}
										{totalCommentPages} ({filteredComments.length} bình luận)
									</span>

									<div className="flex items-center gap-2">
										<button
											type="button"
											disabled={commentPage === 1}
											onClick={() => setCommentPage((p) => Math.max(1, p - 1))}
											className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
										>
											<FiChevronLeft className="h-4 w-4" />
										</button>
										<button
											type="button"
											disabled={commentPage === totalCommentPages}
											onClick={() => setCommentPage((p) => Math.min(totalCommentPages, p + 1))}
											className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer shadow-2xs"
										>
											<FiChevronRight className="h-4 w-4" />
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</main>

			{/* ================= MODALS ================= */}
			{/* 1. Order Detail Modal */}
			{selectedOrderForDetail && (
				<OrderDetailModal
					order={selectedOrderForDetail}
					onClose={() => setSelectedOrderForDetail(null)}
					onOpenPrint={(order) => setSelectedOrderForPrint(order)}
					onOrderUpdated={(updated) => {
						setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))
						setSelectedOrderForDetail(updated)
					}}
				/>
			)}

			{/* 2. Order Print Invoice Modal */}
			{selectedOrderForPrint && (
				<OrderPrintModal
					order={selectedOrderForPrint}
					onClose={() => setSelectedOrderForPrint(null)}
				/>
			)}

			{/* 3. Customer CRM Detail Modal */}
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

			{/* 4. Product Review Detail Modal */}
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

			{/* 5. Blog Comment Moderation & Reply Modal */}
			{selectedCommentForDetail && (
				<CommentModal
					comment={selectedCommentForDetail}
					onClose={() => setSelectedCommentForDetail(null)}
					onCommentUpdated={(updated) => {
						setComments((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
						setSelectedCommentForDetail(updated)
					}}
					onCommentDeleted={(deletedId) => {
						setComments((prev) => prev.filter((c) => c._id !== deletedId))
						setSelectedCommentForDetail(null)
					}}
					onReplyCreated={(newReply) => {
						setComments((prev) => [newReply, ...prev])
					}}
				/>
			)}
		</div>
	)
}
