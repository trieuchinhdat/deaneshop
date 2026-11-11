'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiArrowRight,
	FiAward,
	FiBell,
	FiBriefcase,
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
	FiGlobe,
	FiGrid,
	FiImage,
	FiLayers,
	FiLogOut,
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
	FiTrash2,
	FiTrendingUp,
	FiTruck,
	FiUpload,
	FiUser,
	FiUserCheck,
	FiUserPlus,
	FiUsers,
	FiVolume2,
	FiVolumeX,
	FiX,
	FiXCircle,
	FiZap,
} from 'react-icons/fi'
import dynamic from 'next/dynamic'
import type { ImportType } from './csv-import-modal'
import { cn, formatPrice } from '@/lib/utils'
import {
	OptimisticMutationController,
	reconcileBulkOrderDelete,
	reconcileBulkOrderUpdate,
} from '@/lib/admin-mutations'
import type { AdminAggregateSummary } from '@/lib/admin-queries'
import { serializeCsv } from '@/lib/csv'
import { getAdminOrderDeletionEligibility } from '@/lib/order-domain'
import DateRangePicker, { DateRange } from '@/ui/date-range-picker'
import {
	AdminRole,
	AdminTab,
	ROLE_PERMITTED_TABS,
	getDefaultTabForRole,
} from '@/lib/admin-roles'

// Dynamically loaded sub-components (Code-splitting to reduce initial bundle)
const CommentModal = dynamic(() => import('./comment-modal'), { ssr: false })
const CsvImportModal = dynamic(() => import('./csv-import-modal'), { ssr: false })
const CustomerDetailModal = dynamic(() => import('./customer-detail-modal'), { ssr: false })
const LeadDetailDrawer = dynamic(() => import('./leads/lead-detail-drawer'), { ssr: false })
const LeadOperations = dynamic(() => import('./leads/lead-operations'), { ssr: false })
const OrderDeleteModal = dynamic(() => import('./order-delete-modal'), { ssr: false })
const OrderDetailModal = dynamic(() => import('./order-detail-modal'), { ssr: false })
const OrderPrintModal = dynamic(() => import('./order-print-modal'), { ssr: false })
const ExecutiveOverview = dynamic(() => import('./overview/executive-overview'), { ssr: false })
const ReviewModal = dynamic(() => import('./review-modal'), { ssr: false })
const StaffManagement = dynamic(() => import('./staff/staff-management'), { ssr: false })

type TabType = AdminTab

type AdminWorkspaceProps = {
	initialOrders: any[]
	initialCustomers: any[]
	initialReviews: any[]
	initialComments: any[]
	initialLeads?: any[]
	initialStaff?: any[]
	initialSummary?: AdminAggregateSummary
	adminUser?: any
	logoUrl?: string
	brandName?: string
	siteProfile?: {
		companyName?: string
		email?: string
		hotline?: string
	}
}

function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1)
	}
	if (currentPage <= 3) {
		return [1, 2, 3, 4, '...', totalPages]
	}
	if (currentPage >= totalPages - 2) {
		return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
	}
	return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

function isB2BQuoteOrder(order: any): boolean {
	if (order?.orderIntent) return order.orderIntent === 'wholesale_rfq'
	return Boolean(
		order?.intentType === 'B2B_RFQ' ||
			order?.orderId?.startsWith('RFQ-') ||
			order?.orderId?.startsWith('EST-') ||
			order?.paymentMethod === 'b2b_rfq_negotiation' ||
			order?.paymentMethod === 'B2B_RFQ_NEGOTIATION' ||
			order?.quoteStatus,
	)
}

const ORDER_STATUS_TABS = [
	{ label: 'All Orders', value: 'ALL' },
	{ label: 'B2B Quotes (RFQ)', value: 'B2B_RFQ' },
	{ label: 'To Pack (Pending)', value: 'PENDING' },
	{ label: 'Processing & Packed', value: 'PROCESSING' },
	{ label: 'In Transit / Shipping', value: 'SHIPPING' },
	{ label: 'Delivered', value: 'DELIVERED' },
	{ label: 'Cancelled / Returned', value: 'CANCELLED' },
]

const CUSTOMER_TABS = [
	{ label: 'All Buyers', value: 'ALL' },
	{ label: 'Repeat Buyers (2+ Orders)', value: 'REPEAT' },
	{ label: 'First-Time Buyers', value: 'FIRST_TIME' },
	{ label: 'High-Value (≥ $100)', value: 'HIGH_VALUE' },
]

const REVIEW_TABS = [
	{ label: 'All Reviews', value: 'ALL' },
	{ label: 'Pending Approval', value: 'PENDING' },
	{ label: 'Approved', value: 'APPROVED' },
	{ label: 'Negative (1-2 Stars)', value: 'NEGATIVE' },
	{ label: '5-Star Spotlights', value: 'FIVE_STAR' },
]

const COMMENT_TABS = [
	{ label: 'All Discussions', value: 'ALL' },
	{ label: 'Pending Moderation', value: 'PENDING' },
	{ label: 'Approved', value: 'APPROVED' },
	{ label: 'Official Staff Replies', value: 'OFFICIAL_REPLY' },
]

const STATUS_BADGES: Record<
	string,
	{ label: string; bg: string; text: string; border: string }
> = {
	PENDING: {
		label: 'Pending Confirmation',
		bg: 'bg-amber-50',
		text: 'text-amber-800',
		border: 'border-amber-200/80',
	},
	CONFIRMED: {
		label: 'Confirmed',
		bg: 'bg-blue-50',
		text: 'text-blue-800',
		border: 'border-blue-200/80',
	},
	PROCESSING: {
		label: 'Processing & Packing',
		bg: 'bg-indigo-50',
		text: 'text-indigo-800',
		border: 'border-indigo-200/80',
	},
	SHIPPING: {
		label: 'In Transit',
		bg: 'bg-purple-50',
		text: 'text-purple-800',
		border: 'border-purple-200/80',
	},
	DELIVERED: {
		label: 'Delivered',
		bg: 'bg-emerald-50',
		text: 'text-emerald-800',
		border: 'border-emerald-200/80',
	},
	CANCELLED: {
		label: 'Cancelled',
		bg: 'bg-rose-50',
		text: 'text-rose-800',
		border: 'border-rose-200/80',
	},
	RETURNED: {
		label: 'Returned',
		bg: 'bg-slate-100',
		text: 'text-slate-700',
		border: 'border-slate-200',
	},
}

// Web Audio API crystal chime sound
function playCrystalNotificationSound() {
	try {
		const AudioContextClass =
			window.AudioContext || (window as any).webkitAudioContext
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
	initialLeads = [],
	initialStaff = [],
	initialSummary,
	adminUser,
	logoUrl,
	brandName = 'Store',
	siteProfile,
}: AdminWorkspaceProps) {
	const fileBrandPrefix = (brandName || 'store')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '_')

	// Active Tab State with RBAC Guard
	const userRole: AdminRole = (adminUser?.role as AdminRole) || 'sales'
	const isSuperAdmin = userRole === 'superadmin'
	const allowedTabs = useMemo<TabType[]>(() => {
		return ROLE_PERMITTED_TABS[userRole] || ['leads', 'customers']
	}, [userRole])

	const defaultTab: TabType = useMemo(() => {
		const targetDef = getDefaultTabForRole(userRole)
		return allowedTabs.includes(targetDef) ? targetDef : (allowedTabs[0] || 'leads')
	}, [userRole, allowedTabs])

	const [activeTab, setActiveTabState] = useState<TabType>(defaultTab)

	// Safe tab navigation that respects RBAC permissions
	const setActiveTab = (tab: TabType) => {
		if (allowedTabs.includes(tab)) {
			setActiveTabState(tab)
		} else {
			setActiveTabState(defaultTab)
		}
	}

	// Auto-fallback if active tab becomes restricted
	useEffect(() => {
		if (!allowedTabs.includes(activeTab)) {
			setActiveTabState(defaultTab)
		}
	}, [allowedTabs, activeTab, defaultTab])
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

	const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	const [importModalType, setImportModalType] = useState<ImportType | null>(null)

	const handleOpenLogoutModal = () => {
		setIsLogoutModalOpen(true)
	}

	const handleConfirmLogout = async () => {
		setIsLoggingOut(true)
		try {
			await fetch('/api/admin/auth/logout', { method: 'POST' })
			window.location.href = '/admin'
		} catch {
			window.location.reload()
		}
	}

	useEffect(() => {
		if (!isLogoutModalOpen) return
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !isLoggingOut) {
				setIsLogoutModalOpen(false)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isLogoutModalOpen, isLoggingOut])

	// Main Data States
	const [orders, setOrders] = useState<any[]>(
		Array.isArray(initialOrders) ? initialOrders : [],
	)
	const [customers, setCustomers] = useState<any[]>(
		Array.isArray(initialCustomers) ? initialCustomers : [],
	)
	const [reviews, setReviews] = useState<any[]>(
		Array.isArray(initialReviews) ? initialReviews : [],
	)
	const [comments, setComments] = useState<any[]>(
		Array.isArray(initialComments) ? initialComments : [],
	)
	const [leads, setLeads] = useState<any[]>(
		Array.isArray(initialLeads) ? initialLeads : [],
	)
	const [staff, setStaff] = useState<any[]>(
		Array.isArray(initialStaff) ? initialStaff : [],
	)

	// Date Range Selection (Default: Last 30 Days)
	const defaultInitialRange = useMemo<DateRange>(() => {
		const now = new Date()
		const past30 = new Date(now)
		past30.setDate(now.getDate() - 29)
		past30.setHours(0, 0, 0, 0)
		const endToday = new Date(now)
		endToday.setHours(23, 59, 59, 999)
		return {
			startDate: past30,
			endDate: endToday,
			preset: 'last_30_days',
		}
	}, [])

	const [selectedDateRange, setSelectedDateRange] =
		useState<DateRange>(defaultInitialRange)

	// Filtered by Date Range across all 4 core business domains
	const timeframeFilteredOrders = useMemo(() => {
		if (
			selectedDateRange.preset === 'all_time' ||
			!selectedDateRange.startDate ||
			!selectedDateRange.endDate
		) {
			return orders
		}
		const start = selectedDateRange.startDate.getTime()
		const end = selectedDateRange.endDate.getTime()
		return orders.filter((order) => {
			const raw = order._createdAt || order.createdAt || order.created_at
			if (!raw) return true
			const t = new Date(raw).getTime()
			if (isNaN(t)) return true
			return t >= start && t <= end
		})
	}, [orders, selectedDateRange])

	const timeframeFilteredLeads = useMemo(() => {
		if (
			selectedDateRange.preset === 'all_time' ||
			!selectedDateRange.startDate ||
			!selectedDateRange.endDate
		) {
			return leads
		}
		const start = selectedDateRange.startDate.getTime()
		const end = selectedDateRange.endDate.getTime()
		return leads.filter((lead) => {
			const raw = lead.created_at || lead.createdAt
			if (!raw) return true
			const t = new Date(raw).getTime()
			if (isNaN(t)) return true
			return t >= start && t <= end
		})
	}, [leads, selectedDateRange])

	const timeframeFilteredReviews = useMemo(() => {
		if (
			selectedDateRange.preset === 'all_time' ||
			!selectedDateRange.startDate ||
			!selectedDateRange.endDate
		) {
			return reviews
		}
		const start = selectedDateRange.startDate.getTime()
		const end = selectedDateRange.endDate.getTime()
		return reviews.filter((rev) => {
			const raw = rev.createdAt || rev.created_at
			if (!raw) return true
			const t = new Date(raw).getTime()
			if (isNaN(t)) return true
			return t >= start && t <= end
		})
	}, [reviews, selectedDateRange])

	const timeframeFilteredComments = useMemo(() => {
		if (
			selectedDateRange.preset === 'all_time' ||
			!selectedDateRange.startDate ||
			!selectedDateRange.endDate
		) {
			return comments
		}
		const start = selectedDateRange.startDate.getTime()
		const end = selectedDateRange.endDate.getTime()
		return comments.filter((c) => {
			const raw = c.createdAt || c.created_at
			if (!raw) return true
			const t = new Date(raw).getTime()
			if (isNaN(t)) return true
			return t >= start && t <= end
		})
	}, [comments, selectedDateRange])

	const [orderPage, setOrderPage] = useState(1)
	const [customerPage, setCustomerPage] = useState(1)
	const [customerPageSize, setCustomerPageSize] = useState<number>(25)
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
	const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<
		any | null
	>(null)
	const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<
		any | null
	>(null)
	const [bulkOrdersForPrint, setBulkOrdersForPrint] = useState<any[] | null>(null)
	const [ordersToDelete, setOrdersToDelete] = useState<any[] | null>(null)
	const [isDeletingOrders, setIsDeletingOrders] = useState(false)
	const [deleteOrderError, setDeleteOrderError] = useState<string | null>(null)
	const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
	const [isBulkProcessing, setIsBulkProcessing] = useState(false)
	const [serverSearchResults, setServerSearchResults] = useState<any[] | null>(null)
	const [isServerSearching, setIsServerSearching] = useState(false)
	const searchInputRef = useRef<HTMLInputElement>(null)
	const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<
		any | null
	>(null)
	const [selectedReviewForDetail, setSelectedReviewForDetail] = useState<
		any | null
	>(null)
	const [selectedCommentForDetail, setSelectedCommentForDetail] = useState<
		any | null
	>(null)
	const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<
		any | null
	>(null)

	// Realtime Event-Driven Sync & Sound
	const [soundEnabled, setSoundEnabled] = useState(true)
	const [newOrderAlertCount, setNewOrderAlertCount] = useState(0)
	const [summary, setSummary] = useState<AdminAggregateSummary | undefined>(initialSummary)
	const [mutationNotice, setMutationNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null)
	const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false)
	const [isLoadingMoreCustomers, setIsLoadingMoreCustomers] = useState(false)
	const [serverCustomerSearchResults, setServerCustomerSearchResults] = useState<any[] | null>(null)
	const mutationControllerRef = useRef<OptimisticMutationController>(new OptimisticMutationController())
	const lastCheckedTimeRef = useRef<string>(new Date().toISOString())
	const lastSyncTimestampRef = useRef<number>(Date.now())
	const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date())
	const [isPolling, setIsPolling] = useState(false)
	const isPollingRef = useRef(false)
	const pendingPollDirtyRef = useRef<{ needed: boolean; alert: boolean }>({ needed: false, alert: false })

	const showNotice = useCallback((type: 'error' | 'success' | 'info', message: string) => {
		setMutationNotice({ type, message })
		setTimeout(() => {
			setMutationNotice((prev) => (prev?.message === message ? null : prev))
		}, 4500)
	}, [])

	// Central Fetch/Sync function with coalesced dirty flag (DF-008)
	const fetchPollData = useCallback(async (isAlert = false) => {
		if (isPollingRef.current) {
			pendingPollDirtyRef.current = {
				needed: true,
				alert: pendingPollDirtyRef.current.alert || isAlert,
			}
			return
		}
		isPollingRef.current = true
		setIsPolling(true)

		try {
			const since = lastCheckedTimeRef.current
			const res = await fetch(
				`/api/admin/poll?since=${encodeURIComponent(since)}`,
			)
			if (!res.ok) {
				if (res.status === 401) {
					showNotice('error', 'Session expired or revoked. Please sign in again.')
				}
				return
			}
			const data = await res.json()

			if (data?.success) {
				if ((data.hasNew && data.newCount > 0) || isAlert) {
					if (data.newCount > 0) {
						setNewOrderAlertCount((prev) => prev + data.newCount)
					}
					if (soundEnabled) {
						playCrystalNotificationSound()
					}
				}
				if (Array.isArray(data.orders)) setOrders(data.orders)
				if (Array.isArray(data.customers)) setCustomers(data.customers)
				if (Array.isArray(data.reviews)) setReviews(data.reviews)
				if (Array.isArray(data.comments)) setComments(data.comments)
				if (Array.isArray(data.leads)) setLeads(data.leads)
				if (data.summary) setSummary(data.summary)
				lastCheckedTimeRef.current =
					data.timestamp || new Date().toISOString()
				lastSyncTimestampRef.current = Date.now()
				setLastSyncedAt(new Date())
			}
		} catch (err) {
			console.error('Polling error:', err)
		} finally {
			isPollingRef.current = false
			setIsPolling(false)
			if (pendingPollDirtyRef.current.needed) {
				const nextAlert = pendingPollDirtyRef.current.alert
				pendingPollDirtyRef.current = { needed: false, alert: false }
				void fetchPollData(nextAlert)
			}
		}
	}, [soundEnabled, showNotice])

	// 1. Auto-polling interval: 30 minutes (1,800,000 ms) instead of 25s
	useEffect(() => {
		const POLL_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

		const interval = setInterval(() => {
			if (typeof document !== 'undefined' && document.hidden) return
			fetchPollData(false)
		}, POLL_INTERVAL_MS)

		return () => clearInterval(interval)
	}, [fetchPollData])

	// 2. Realtime SSE: Trigger instant sync & persist checkpoint cursor per user session (DF-008)
	useEffect(() => {
		let eventSource: EventSource | null = null
		let retryTimeout: NodeJS.Timeout | null = null
		const cursorStorageKey = `admin-event-cursor:${adminUser?.id || 'anon'}`

		const saveCursor = (id?: string) => {
			if (!id) return
			try {
				sessionStorage.setItem(cursorStorageKey, id)
			} catch {}
		}

		const connectSSE = () => {
			try {
				let savedCursor = '0'
				try {
					savedCursor = sessionStorage.getItem(cursorStorageKey) || '0'
				} catch {}
				eventSource = new EventSource(`/api/admin/events?cursor=${encodeURIComponent(savedCursor)}`)

				eventSource.onopen = () => { fetchPollData(false) }

				eventSource.addEventListener('checkpoint', (event: MessageEvent) => {
					if (event.lastEventId) {
						saveCursor(event.lastEventId)
					} else if (event.data) {
						try {
							const parsed = JSON.parse(event.data)
							if (parsed?.cursor != null) saveCursor(String(parsed.cursor))
						} catch {}
					}
				})

				eventSource.onmessage = (event) => {
					if (event.lastEventId) saveCursor(event.lastEventId)
					if (!event.data) return
					try {
						const payload = JSON.parse(event.data)
						if (payload.type === 'NEW_ORDER') {
							fetchPollData(true)
						} else if (
							payload.type === 'NEW_LEAD' ||
							payload.type === 'ORDER_UPDATED' ||
							payload.type === 'LEAD_UPDATED' ||
							payload.type === 'NEW_REVIEW' ||
							payload.type === 'REVIEW_UPDATED' ||
							payload.type === 'NEW_COMMENT' ||
							payload.type === 'COMMENT_UPDATED'
						) {
							fetchPollData(false)
						}
					} catch {}
				}

				eventSource.onerror = () => {
					eventSource?.close()
					eventSource = null
					retryTimeout = setTimeout(connectSSE, 2500)
				}
			} catch (err) {
				console.warn('SSE connection error:', err)
			}
		}

		connectSSE()

		return () => {
			if (eventSource) {
				eventSource.close()
				eventSource = null
			}
			if (retryTimeout) clearTimeout(retryTimeout)
		}
	}, [fetchPollData, adminUser?.id])

	// 3. Cross-tab Sync via BroadcastChannel (local browser tabs)
	useEffect(() => {
		if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return
		const channel = new BroadcastChannel('deanflow-admin-sync')
		channel.onmessage = (event) => {
			if (event.data?.type === 'NEW_ORDER') {
				fetchPollData(true)
			} else if (event.data?.type === 'SYNC') {
				fetchPollData(false)
			}
		}
		return () => channel.close()
	}, [fetchPollData])

	// 4. Tab Visibility Recovery: Sync if user re-focuses tab after > 2 minutes away
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				const elapsed = Date.now() - lastSyncTimestampRef.current
				if (elapsed > 2 * 60 * 1000) {
					fetchPollData(false)
				}
			}
		}
		document.addEventListener('visibilitychange', handleVisibilityChange)
		return () =>
			document.removeEventListener('visibilitychange', handleVisibilityChange)
	}, [fetchPollData])

	// 5. Global Keyboard Shortcuts (/ to focus search, Esc to close modals)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.key === '/' &&
				!['INPUT', 'TEXTAREA', 'SELECT'].includes(
					(e.target as HTMLElement)?.tagName,
				)
			) {
				e.preventDefault()
				searchInputRef.current?.focus()
			}
			if (e.key === 'Escape') {
				setSelectedOrderForDetail(null)
				setSelectedOrderForPrint(null)
				setBulkOrdersForPrint(null)
				setSelectedCustomerForDetail(null)
				setSelectedReviewForDetail(null)
				setSelectedCommentForDetail(null)
				setSelectedLeadForDetail(null)
				setIsLogoutModalOpen(false)
				setOrdersToDelete((curr) => (isDeletingOrders ? curr : null))
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isDeletingOrders])

	// 6. Debounced Server-side Deep Search across entire D1 database
	useEffect(() => {
		const term = orderSearchQuery.trim()
		if (!term) {
			setServerSearchResults(null)
			return
		}

		const timer = setTimeout(async () => {
			try {
				setIsServerSearching(true)
				const res = await fetch(
					`/api/orders/list?search=${encodeURIComponent(term)}&limit=100`,
				)
				const data = await res.json()
				if (data?.success && Array.isArray(data.orders)) {
					setServerSearchResults(data.orders)
				}
			} catch (err) {
				console.error('Server search error:', err)
			} finally {
				setIsServerSearching(false)
			}
		}, 400)

		return () => clearTimeout(timer)
	}, [orderSearchQuery])

	const loadMoreOrders = useCallback(async () => {
		if (isLoadingMoreOrders) return
		setIsLoadingMoreOrders(true)
		try {
			const nextPage = Math.floor(orders.length / 100) + 1
			const params = new URLSearchParams({
				resource: 'orders',
				page: String(nextPage),
				pageSize: '100',
			})
			if (orderStatusFilter !== 'ALL' && orderStatusFilter !== 'B2B_RFQ') {
				params.set('status', orderStatusFilter)
			}
			const res = await fetch(`/api/admin/data?${params.toString()}`)
			const data = await res.json().catch(() => ({}))
			if (res.ok && data?.success && Array.isArray(data.items)) {
				setOrders((prev) => {
					const map = new Map(prev.map((o) => [o._id || o.orderId, o]))
					for (const item of data.items) {
						map.set(item._id || item.orderId, item)
					}
					return Array.from(map.values())
				})
			}
		} catch (err) {
			console.error('Failed to load more orders:', err)
		} finally {
			setIsLoadingMoreOrders(false)
		}
	}, [isLoadingMoreOrders, orders.length, orderStatusFilter])

	const loadMoreCustomers = useCallback(async () => {
		if (isLoadingMoreCustomers) return
		setIsLoadingMoreCustomers(true)
		try {
			const nextPage = Math.floor(customers.length / 100) + 1
			const res = await fetch(`/api/admin/data?resource=customers&page=${nextPage}&pageSize=100`)
			const data = await res.json().catch(() => ({}))
			if (res.ok && data?.success && Array.isArray(data.items)) {
				setCustomers((prev) => {
					const map = new Map(prev.map((c) => [c.id || c._id || c.email, c]))
					for (const item of data.items) {
						map.set(item.id || item._id || item.email, item)
					}
					return Array.from(map.values())
				})
			}
		} catch (err) {
			console.error('Failed to load more customers:', err)
		} finally {
			setIsLoadingMoreCustomers(false)
		}
	}, [isLoadingMoreCustomers, customers.length])

	useEffect(() => {
		const term = customerSearchQuery.trim()
		if (!term) {
			setServerCustomerSearchResults(null)
			return
		}
		const timer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/admin/data?resource=customers&page=1&pageSize=100&search=${encodeURIComponent(term)}`)
				const data = await res.json().catch(() => ({}))
				if (res.ok && data?.success && Array.isArray(data.items)) {
					setServerCustomerSearchResults(data.items)
				}
			} catch {}
		}, 400)
		return () => clearTimeout(timer)
	}, [customerSearchQuery])

	// KPI Stats Calculation (Optimized for Hero Products, High-Ticket & B2B Pipeline)
	const kpiStats = useMemo(() => {
		const useServerSummary = Boolean(summary && selectedDateRange.preset === 'all_time')
		const totalOrders = useServerSummary && summary?.orders.available ? summary.orders.totalOrders : timeframeFilteredOrders.length
		const pendingOrders = useServerSummary && summary?.orders.available ? summary.orders.pendingOrders : timeframeFilteredOrders.filter(
			(o) => !o.fulfillmentStatus || o.fulfillmentStatus === 'PENDING',
		).length
		const processingOrders = useServerSummary && summary?.orders.available ? summary.orders.processingOrders : timeframeFilteredOrders.filter(
			(o) =>
				o.fulfillmentStatus === 'PROCESSING' ||
				o.fulfillmentStatus === 'CONFIRMED',
		).length
		const shippingOrders = useServerSummary && summary?.orders.available ? summary.orders.shippingOrders : timeframeFilteredOrders.filter(
			(o) => o.fulfillmentStatus === 'SHIPPING',
		).length
		const deliveredOrders = useServerSummary && summary?.orders.available ? summary.orders.deliveredOrders : timeframeFilteredOrders.filter(
			(o) => o.fulfillmentStatus === 'DELIVERED',
		).length
		const cancelledOrders = useServerSummary && summary?.orders.available ? summary.orders.cancelledOrders : timeframeFilteredOrders.filter(
			(o) =>
				o.fulfillmentStatus === 'CANCELLED' ||
				o.fulfillmentStatus === 'RETURNED',
		).length

		const validOrders = timeframeFilteredOrders.filter(
			(o) =>
				o.fulfillmentStatus !== 'CANCELLED' &&
				o.fulfillmentStatus !== 'RETURNED',
		)
		const totalRevenue = useServerSummary && summary?.orders.available
			? summary.orders.totalRevenue
			: validOrders.reduce(
					(acc, o) => acc + (Number(o?.pricing?.grandTotal) || 0),
					0,
				)
		const averageOrderValue = useServerSummary && summary?.orders.available
			? summary.orders.averageOrderValue
			: validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0
		const highTicketOrders = useServerSummary && summary?.orders.available
			? summary.orders.highTicketOrders
			: validOrders.filter(
					(o) => (Number(o?.pricing?.grandTotal) || 0) >= 100,
				).length

		// B2B Pipeline & Custom Quotes
		const b2bNewLeads = useServerSummary && summary?.leads.available
			? summary.leads.newLeads
			: timeframeFilteredLeads.filter(
					(l) => l.status === 'new' || !l.status,
				).length
		const b2bNegotiatingDeals = useServerSummary && summary?.leads.available
			? summary.leads.negotiatingDeals
			: timeframeFilteredLeads.filter(
					(l) =>
						l.status === 'discovery' ||
						l.status === 'proposal' ||
						l.status === 'contacted',
				).length
		const b2bWonDeals = useServerSummary && summary?.leads.available
			? summary.leads.wonDeals
			: timeframeFilteredLeads.filter((l) => l.status === 'won').length
		const b2bActiveDeals = b2bNewLeads + b2bNegotiatingDeals
		const highIntentLeads = useServerSummary && summary?.leads.available
			? summary.leads.highIntentLeads
			: timeframeFilteredLeads.filter(
					(l) => (Number(l.ai_score) || 0) >= 70,
				).length
		const corporateLeads = useServerSummary && summary?.leads.available
			? summary.leads.corporateLeads
			: timeframeFilteredLeads.filter(
					(l) => Boolean(l.is_corporate_email) || Boolean(l.company_name),
				).length

		const totalCust = useServerSummary && summary?.customers.available ? summary.customers.totalCustomers : customers.length
		const popupLeads = customers.filter(
			(c) => c.cskhStatus === 'lead' || c.orderCount === 0 || !c.orderCount,
		).length
		const vipCustomers = customers.filter(
			(c) => c.cskhStatus === 'vip' || (Number(c.totalSpent) || 0) >= 100,
		).length
		const buyerCustomers = customers.filter(
			(c) => (Number(c.orderCount) || 0) > 0,
		).length

		const totalReviews = useServerSummary && summary?.reviews.available ? summary.reviews.totalReviews : timeframeFilteredReviews.length
		const pendingReviews = useServerSummary && summary?.reviews.available ? summary.reviews.pendingReviews : timeframeFilteredReviews.filter((r) => !r.isApproved).length
		const fiveStarReviews = useServerSummary && summary?.reviews.available ? summary.reviews.fiveStarReviews : timeframeFilteredReviews.filter((r) => Number(r.rating) === 5).length
		const avgRating = useServerSummary && summary?.reviews.available
			? summary.reviews.avgRating
			: totalReviews
				? (
						timeframeFilteredReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) /
						totalReviews
					).toFixed(1)
				: '5.0'

		const totalComments = useServerSummary && summary?.comments.available ? summary.comments.totalComments : timeframeFilteredComments.length
		const pendingComments = useServerSummary && summary?.comments.available ? summary.comments.pendingComments : timeframeFilteredComments.filter((c) => !c.isApproved).length
		const officialReplies = useServerSummary && summary?.comments.available ? summary.comments.officialReplies : timeframeFilteredComments.filter((c) => c.isAuthorReply).length

		return {
			totalOrders,
			pendingOrders,
			processingOrders,
			shippingOrders,
			deliveredOrders,
			cancelledOrders,
			totalRevenue,
			averageOrderValue,
			highTicketOrders,
			b2bNewLeads,
			b2bNegotiatingDeals,
			b2bWonDeals,
			b2bActiveDeals,
			highIntentLeads,
			corporateLeads,
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
	}, [
		timeframeFilteredOrders,
		timeframeFilteredLeads,
		timeframeFilteredReviews,
		timeframeFilteredComments,
		customers,
	])

	// Urgent B2B Leads for Overview Stream
	const urgentB2BLeads = useMemo(() => {
		return [...leads]
			.sort((a, b) => {
				const aIsNew = a.status === 'new' || !a.status ? 1 : 0
				const bIsNew = b.status === 'new' || !b.status ? 1 : 0
				if (aIsNew !== bIsNew) return bIsNew - aIsNew
				const aScore = Number(a.ai_score) || 0
				const bScore = Number(b.ai_score) || 0
				if (aScore !== bScore) return bScore - aScore
				const aDate = new Date(a.created_at || a.createdAt || 0).getTime()
				const bDate = new Date(b.created_at || b.createdAt || 0).getTime()
				return bDate - aDate
			})
			.slice(0, 5)
	}, [leads])

	// Actionable Orders for Overview Stream (Prioritizing Pending Packing & High-Ticket)
	const actionableOrdersList = useMemo(() => {
		return [...orders]
			.sort((a, b) => {
				const aPending =
					!a.fulfillmentStatus || a.fulfillmentStatus === 'PENDING'
						? 2
						: a.fulfillmentStatus === 'PROCESSING' ||
							  a.fulfillmentStatus === 'CONFIRMED'
							? 1
							: 0
				const bPending =
					!b.fulfillmentStatus || b.fulfillmentStatus === 'PENDING'
						? 2
						: b.fulfillmentStatus === 'PROCESSING' ||
							  b.fulfillmentStatus === 'CONFIRMED'
							? 1
							: 0
				if (aPending !== bPending) return bPending - aPending
				const aTotal = Number(a?.pricing?.grandTotal) || 0
				const bTotal = Number(b?.pricing?.grandTotal) || 0
				if (aTotal !== bTotal) return bTotal - aTotal
				const aDate = new Date(a._createdAt || 0).getTime()
				const bDate = new Date(b._createdAt || 0).getTime()
				return bDate - aDate
			})
			.slice(0, 5)
	}, [orders])

	// Top Landing Pages & Funnel Conversion Sources
	const topLandingFunnels = useMemo(() => {
		const funnelMap: Record<
			string,
			{ path: string; count: number; highIntent: number }
		> = {}
		leads.forEach((l) => {
			const rawUrl = l.landing_page_url || l.source || 'Direct Landing Page'
			let cleanPath = rawUrl
			try {
				if (rawUrl.startsWith('http')) {
					const u = new URL(rawUrl)
					cleanPath = u.pathname || rawUrl
				}
			} catch {}
			if (!funnelMap[cleanPath]) {
				funnelMap[cleanPath] = { path: cleanPath, count: 0, highIntent: 0 }
			}
			funnelMap[cleanPath].count += 1
			if ((Number(l.ai_score) || 0) >= 70) {
				funnelMap[cleanPath].highIntent += 1
			}
		})
		return Object.values(funnelMap)
			.sort((a, b) => b.count - a.count)
			.slice(0, 4)
	}, [leads])

	// Filtered Orders & B2B Quotes List
	const filteredOrders = useMemo(() => {
		const baseOrders =
			serverSearchResults && orderSearchQuery.trim()
				? serverSearchResults
				: timeframeFilteredOrders

		return baseOrders.filter((order) => {
			if (orderStatusFilter === 'B2B_RFQ') {
				if (!isB2BQuoteOrder(order)) return false
			} else if (orderStatusFilter !== 'ALL') {
				if (orderStatusFilter === 'CANCELLED') {
					if (
						order.fulfillmentStatus !== 'CANCELLED' &&
						order.fulfillmentStatus !== 'RETURNED'
					)
						return false
				} else if (orderStatusFilter === 'PROCESSING') {
					if (
						order.fulfillmentStatus !== 'PROCESSING' &&
						order.fulfillmentStatus !== 'CONFIRMED'
					)
						return false
				} else if (order.fulfillmentStatus !== orderStatusFilter) {
					if (orderStatusFilter === 'PENDING' && !order.fulfillmentStatus) {
						// null is pending
					} else {
						return false
					}
				}
			}

			// In-memory text matching if not using server search results
			if (!serverSearchResults && orderSearchQuery.trim()) {
				const q = orderSearchQuery.trim().toLowerCase()
				const matchId = order.orderId?.toLowerCase().includes(q)
				const matchName = order.customer?.name?.toLowerCase().includes(q)
				const matchPhone = order.customer?.phone?.toLowerCase().includes(q)
				const matchEmail = order.customer?.email?.toLowerCase().includes(q)
				const matchTracking = order.trackingCode?.toLowerCase().includes(q)
				if (
					!matchId &&
					!matchName &&
					!matchPhone &&
					!matchEmail &&
					!matchTracking
				)
					return false
			}

			return true
		})
	}, [timeframeFilteredOrders, serverSearchResults, orderStatusFilter, orderSearchQuery])

	const totalOrderPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1
	const paginatedOrders = useMemo(() => {
		const start = (orderPage - 1) * itemsPerPage
		return filteredOrders.slice(start, start + itemsPerPage)
	}, [filteredOrders, orderPage])

	// Aggregate Unique Buyers from Store Orders, RFQs & Standalone Profiles (Lifetime Customer Directory)
	const b2cBuyers = useMemo(() => {
		const map = new Map<string, any>()

		// 1. Process all store orders & RFQs to build comprehensive buyer history
		orders.forEach((order) => {
			const cust = order.customer || {}
			const phone = (cust.phone || '').trim()
			const email = (cust.email || '').trim().toLowerCase()
			const name = (cust.name || 'Guest Buyer').trim()

			const key = phone.replace(/\D/g, '') || email || name.toLowerCase()
			if (!key) return

			const orderTotal =
				Number(order.pricing?.grandTotal) || Number(order.total) || 0
			const isCancelled =
				order.fulfillmentStatus === 'CANCELLED' ||
				order.fulfillmentStatus === 'RETURNED'
			const orderDate =
				order._createdAt || order.createdAt || new Date().toISOString()

			if (!map.has(key)) {
				map.set(key, {
					id: key,
					_id: key,
					name: name || 'Guest Buyer',
					phone: phone,
					email: email,
					address: cust.address || '',
					city: cust.city || '',
					country: cust.country || 'US',
					postalCode: cust.postalCode || '',
					orderCount: 1,
					totalSpent: isCancelled ? 0 : orderTotal,
					firstOrderDate: orderDate,
					lastOrderDate: orderDate,
					orders: [order],
				})
			} else {
				const existing = map.get(key)
				existing.orderCount += 1
				if (!isCancelled) {
					existing.totalSpent += orderTotal
				}
				if (!existing.phone && phone) existing.phone = phone
				if (!existing.email && email) existing.email = email
				if (!existing.address && cust.address) {
					existing.address = cust.address
					existing.city = cust.city
					existing.country = cust.country
					existing.postalCode = cust.postalCode
				}
				if (new Date(orderDate) > new Date(existing.lastOrderDate)) {
					existing.lastOrderDate = orderDate
				}
				existing.orders.push(order)
			}
		})

		// 2. Merge standalone registered customer profiles (e.g. from CRM / Sanity)
		if (Array.isArray(customers)) {
			customers.forEach((c) => {
				const phone = (c.phone || '').trim()
				const email = (c.email || '').trim().toLowerCase()
				const name = (c.name || '').trim()
				const key = phone.replace(/\D/g, '') || email || (name ? name.toLowerCase() : '')
				if (!key) return

				if (!map.has(key)) {
					const regDate = c.createdAt || c.created_at || new Date().toISOString()
					map.set(key, {
						id: c._id || c.id || key,
						_id: c._id || c.id || key,
						name: name || 'Registered Customer',
						phone,
						email,
						address: c.address || '',
						city: c.city || '',
						country: c.country || 'US',
						postalCode: c.postalCode || '',
						orderCount: Number(c.orderCount) || 0,
						totalSpent: Number(c.totalSpent) || 0,
						firstOrderDate: regDate,
						lastOrderDate: c.lastOrderAt || regDate,
						orders: [],
					})
				} else {
					const existing = map.get(key)
					if (!existing.phone && phone) existing.phone = phone
					if (!existing.email && email) existing.email = email
					if (!existing.address && c.address) existing.address = c.address
				}
			})
		}

		return Array.from(map.values()).sort(
			(a, b) =>
				new Date(b.lastOrderDate).getTime() -
				new Date(a.lastOrderDate).getTime(),
		)
	}, [orders, customers])

	// Filtered B2C Buyers List
	const filteredCustomers = useMemo(() => {
		const baseCustomers =
			serverCustomerSearchResults && customerSearchQuery.trim()
				? serverCustomerSearchResults
				: b2cBuyers
		return baseCustomers.filter((cust) => {
			if (customerTabFilter !== 'ALL') {
				if (customerTabFilter === 'REPEAT' && cust.orderCount < 2) return false
				if (customerTabFilter === 'FIRST_TIME' && cust.orderCount !== 1)
					return false
				if (
					customerTabFilter === 'HIGH_VALUE' &&
					(Number(cust.totalSpent) || 0) < 100
				)
					return false
			}

			if (customerSearchQuery.trim()) {
				const q = customerSearchQuery.trim().toLowerCase()
				const matchName = cust.name?.toLowerCase().includes(q)
				const matchPhone = cust.phone?.toLowerCase().includes(q)
				const matchEmail = cust.email?.toLowerCase().includes(q)
				const matchAddress = cust.address?.toLowerCase().includes(q)
				if (!matchName && !matchPhone && !matchEmail && !matchAddress)
					return false
			}

			return true
		})
	}, [b2cBuyers, serverCustomerSearchResults, customerTabFilter, customerSearchQuery])

	const totalCustomerPages =
		customerPageSize >= filteredCustomers.length
			? 1
			: Math.ceil(filteredCustomers.length / customerPageSize) || 1

	useEffect(() => {
		if (customerPage > totalCustomerPages) {
			setCustomerPage(Math.max(1, totalCustomerPages))
		}
	}, [customerPage, totalCustomerPages])

	const paginatedCustomers = useMemo(() => {
		if (customerPageSize >= 9999 || customerPageSize >= filteredCustomers.length) {
			return filteredCustomers
		}
		const start = (customerPage - 1) * customerPageSize
		return filteredCustomers.slice(start, start + customerPageSize)
	}, [filteredCustomers, customerPage, customerPageSize])

	// Filtered Reviews List
	const filteredReviews = useMemo(() => {
		return timeframeFilteredReviews.filter((rev) => {
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
	}, [timeframeFilteredReviews, reviewStatusFilter, reviewSearchQuery])

	const totalReviewPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1
	const paginatedReviews = useMemo(() => {
		const start = (reviewPage - 1) * itemsPerPage
		return filteredReviews.slice(start, start + itemsPerPage)
	}, [filteredReviews, reviewPage])

	// Filtered Comments List
	const filteredComments = useMemo(() => {
		return timeframeFilteredComments.filter((c) => {
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
				if (!matchAuthor && !matchEmail && !matchContent && !matchPost)
					return false
			}

			return true
		})
	}, [timeframeFilteredComments, commentStatusFilter, commentSearchQuery])

	const totalCommentPages =
		Math.ceil(filteredComments.length / itemsPerPage) || 1
	const paginatedComments = useMemo(() => {
		const start = (commentPage - 1) * itemsPerPage
		return filteredComments.slice(start, start + itemsPerPage)
	}, [filteredComments, commentPage])

	// 1-Click Status Update for Orders with Optimistic Rollback & Version Guard (DF-009)
	const handleQuickStatusChange = async (
		orderId: string,
		newStatus: string,
	) => {
		const targetOrder = orders.find((o) => o._id === orderId)
		const prevOrders = orders
		await mutationControllerRef.current.run({
			key: `order:${orderId}`,
			snapshot: prevOrders,
			applyOptimistic: () => {
				setOrders((curr) =>
					curr.map((o) =>
						o._id === orderId ? { ...o, fulfillmentStatus: newStatus } : o,
					),
				)
			},
			restore: (snapshot) => {
				setOrders(snapshot)
				void fetchPollData(false)
			},
			request: () =>
				fetch('/api/orders/update-status', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						docId: orderId,
						expectedVersion: targetOrder?.version,
						fulfillmentStatus: newStatus,
					}),
				}),
			onReconcile: (data) => {
				if (data?.order) {
					setOrders((curr) => curr.map((o) => (o._id === orderId ? data.order : o)))
				}
				showNotice('success', `Order status updated to ${newStatus}`)
			},
			onError: (message) => {
				showNotice('error', message)
			},
		})
	}

	// Bulk Selection for Orders
	const handleToggleSelectOrder = (id: string) => {
		setSelectedOrderIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	const handleSelectAllOrders = () => {
		const visibleIds = paginatedOrders.map((o) => o._id)
		const allVisibleSelected =
			visibleIds.length > 0 &&
			visibleIds.every((id) => selectedOrderIds.has(id))
		setSelectedOrderIds((prev) => {
			const next = new Set(prev)
			if (allVisibleSelected) {
				visibleIds.forEach((id) => next.delete(id))
			} else {
				visibleIds.forEach((id) => next.add(id))
			}
			return next
		})
	}

	const handleBulkPrint = () => {
		if (selectedOrderIds.size === 0) return
		const selected = orders.filter((o) => selectedOrderIds.has(o._id))
		if (selected.length > 0) {
			setBulkOrdersForPrint(selected)
		}
	}

	const handleBulkStatusChange = async (newStatus: string) => {
		if (selectedOrderIds.size === 0) return
		const prevOrders = orders
		const targetIds = Array.from(selectedOrderIds)
		const expectedVersions: Record<string, number> = {}
		for (const id of targetIds) {
			const found = prevOrders.find((o) => o._id === id)
			if (found?.version) expectedVersions[id] = found.version
		}

		try {
			setIsBulkProcessing(true)
			setOrders((curr) =>
				curr.map((o) =>
					selectedOrderIds.has(o._id)
						? { ...o, fulfillmentStatus: newStatus }
						: o,
				),
			)

			const res = await fetch('/api/orders/update-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderIds: targetIds,
					expectedVersions,
					fulfillmentStatus: newStatus,
				}),
			})
			const data = await res.json().catch(() => ({}))
			const reconciled = reconcileBulkOrderUpdate({
				previousOrders: prevOrders,
				targetIds,
				newStatus,
				responseOk: res.ok,
				responseData: data,
			})
			setOrders(reconciled.nextOrders)
			setSelectedOrderIds(reconciled.remainingSelectedIds)
			showNotice(
				reconciled.failedCount > 0 ? 'error' : 'success',
				reconciled.message,
			)
			if (!res.ok || reconciled.failedCount > 0) {
				void fetchPollData(false)
			}
		} catch (err: any) {
			setOrders(prevOrders)
			showNotice('error', err?.message || 'Network error during bulk status update. Rolled back.')
			void fetchPollData(false)
		} finally {
			setIsBulkProcessing(false)
		}
	}

	const openDeleteOrdersModal = (targets: any[]) => {
		if (!isSuperAdmin || !targets.length) return
		setDeleteOrderError(null)
		setOrdersToDelete(targets)
	}

	const handleConfirmDeleteOrders = async ({
		reason,
		confirmText,
	}: {
		reason: string
		confirmText: string
	}) => {
		if (!isSuperAdmin || !ordersToDelete?.length) return
		const isSingle = ordersToDelete.length === 1
		setIsDeletingOrders(true)
		setDeleteOrderError(null)

		try {
			if (isSingle) {
				const target = ordersToDelete[0]
				const res = await fetch('/api/orders/delete', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						docId: target._id,
						orderId: target.orderId,
						expectedVersion: target.version,
						confirmOrderNumber: confirmText,
						reason: reason || undefined,
					}),
				})
				const data = await res.json().catch(() => ({}))
				if (!res.ok || !data.success) {
					if (res.status === 409 && data.order) {
						setOrders((prev) => prev.map((o) => (o._id === data.order._id ? data.order : o)))
						if (selectedOrderForDetail?._id === data.order._id) {
							setSelectedOrderForDetail(data.order)
						}
					}
					setDeleteOrderError(data.message || 'Unable to delete order.')
					return
				}

				const deletedId = data.deletedId || target._id
				setOrders((prev) => prev.filter((o) => o._id !== deletedId))
				setServerSearchResults((prev) => (prev ? prev.filter((o) => o._id !== deletedId) : prev))
				setSelectedOrderIds((prev) => {
					const next = new Set(prev)
					next.delete(target._id)
					return next
				})
				if (selectedOrderForDetail?._id === target._id) {
					setSelectedOrderForDetail(null)
				}
				setOrdersToDelete(null)
				showNotice('success', data.message || `Order ${target.orderId || deletedId} deleted.`)
				void fetchPollData(false)
				return
			}

			const targetIds = ordersToDelete.map((o) => o._id).filter(Boolean)
			const expectedVersions: Record<string, number> = {}
			for (const o of ordersToDelete) {
				if (o?._id && o?.version) expectedVersions[o._id] = o.version
			}

			const res = await fetch('/api/orders/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderIds: targetIds,
					expectedVersions,
					reason: reason || undefined,
				}),
			})
			const data = await res.json().catch(() => ({}))
			const reconciled = reconcileBulkOrderDelete({
				previousOrders: orders,
				targetIds,
				responseOk: res.ok,
				responseData: data,
			})

			setOrders(reconciled.nextOrders)
			setServerSearchResults((prev) => {
				if (!prev) return prev
				const keptIds = new Set(reconciled.nextOrders.map((o) => o._id))
				return prev.filter((o) => keptIds.has(o._id))
			})
			setSelectedOrderIds(reconciled.remainingSelectedIds)

			if (reconciled.deletedCount === 0 && !res.ok) {
				setDeleteOrderError(reconciled.message)
				return
			}

			if (selectedOrderForDetail && !reconciled.nextOrders.some((o) => o._id === selectedOrderForDetail._id)) {
				setSelectedOrderForDetail(null)
			}
			setOrdersToDelete(null)
			showNotice(reconciled.failedCount > 0 ? 'error' : 'success', reconciled.message)
			void fetchPollData(false)
		} catch (err: any) {
			setDeleteOrderError(err?.message || 'Network error while deleting order(s).')
		} finally {
			setIsDeletingOrders(false)
		}
	}

	// 1-Click Toggle Review Approval with Optimistic Rollback (DF-009)
	const handleQuickToggleReviewApproval = async (
		reviewId: string,
		currentApproved: boolean,
	) => {
		const nextState = !currentApproved
		const prevReviews = reviews
		await mutationControllerRef.current.run({
			key: `review:${reviewId}`,
			snapshot: prevReviews,
			applyOptimistic: () => {
				setReviews((curr) =>
					curr.map((r) =>
						r._id === reviewId ? { ...r, isApproved: nextState } : r,
					),
				)
			},
			restore: (snapshot) => {
				setReviews(snapshot)
				void fetchPollData(false)
			},
			request: () =>
				fetch('/api/admin/reviews/update', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						reviewId,
						isApproved: nextState,
					}),
				}),
			onReconcile: () => {
				showNotice('success', nextState ? 'Review approved' : 'Review unapproved')
			},
			onError: (message) => {
				showNotice('error', message)
			},
		})
	}

	// 1-Click Toggle Comment Approval with Optimistic Rollback (DF-009)
	const handleQuickToggleCommentApproval = async (
		commentId: string,
		currentApproved: boolean,
	) => {
		const nextState = !currentApproved
		const prevComments = comments
		await mutationControllerRef.current.run({
			key: `comment:${commentId}`,
			snapshot: prevComments,
			applyOptimistic: () => {
				setComments((curr) =>
					curr.map((c) =>
						c._id === commentId ? { ...c, isApproved: nextState } : c,
					),
				)
			},
			restore: (snapshot) => {
				setComments(snapshot)
				void fetchPollData(false)
			},
			request: () =>
				fetch('/api/admin/comments/update', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						commentId,
						isApproved: nextState,
					}),
				}),
			onReconcile: () => {
				showNotice('success', nextState ? 'Comment approved' : 'Comment unapproved')
			},
			onError: (message) => {
				showNotice('error', message)
			},
		})
	}

	// Export CSV Helpers (RFC-4180 + Formula-safe + Server-backed full dataset export)
	const downloadCsvFile = (filename: string, content: string) => {
		const blob = new Blob(['\uFEFF' + content], {
			type: 'text/csv;charset=utf-8;',
		})
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.setAttribute('href', url)
		link.setAttribute('download', filename)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}

	const triggerServerCsvExport = async (
		resource: 'leads' | 'orders' | 'customers' | 'reviews' | 'comments',
		filename: string,
		fallbackCsv: () => string,
		extraParams: Record<string, string> = {},
	) => {
		try {
			const params = new URLSearchParams({ resource, format: 'csv', ...extraParams })
			const res = await fetch(`/api/admin/data?${params.toString()}`)
			if (res.ok) {
				const text = await res.text()
				const cleaned = text.replace(/^\uFEFF/, '')
				downloadCsvFile(filename, cleaned)
				return
			}
		} catch {}
		downloadCsvFile(filename, fallbackCsv())
	}

	const exportLeadsToCSV = () => {
		void triggerServerCsvExport(
			'leads',
			`${fileBrandPrefix}_b2b_leads_${new Date().toISOString().slice(0, 10)}.csv`,
			() =>
				serializeCsv(
					['ID', 'Customer Name', 'Company', 'Email', 'Phone', 'Status', 'AI Score', 'Budget', 'Country', 'Assigned Rep', 'Created At'],
					timeframeFilteredLeads.map((l) => [
						l.id,
						l.name || '',
						l.company_name || '',
						l.email || '',
						{ value: l.phone || '', preserveLeadingZero: true },
						l.status || 'new',
						Number(l.ai_score) || 0,
						l.budget_range || '',
						l.ip_country || l.country || '',
						staff.find((s) => s.id === l.assigned_to)?.full_name || l.assigned_to || '',
						l.created_at ? new Date(l.created_at) : '',
					]),
				),
		)
	}

	const exportOrdersToCSV = () => {
		void triggerServerCsvExport(
			'orders',
			`${fileBrandPrefix}_orders_${new Date().toISOString().slice(0, 10)}.csv`,
			() =>
				serializeCsv(
					['Order ID', 'Intent', 'Customer Name', 'Email', 'Phone', 'Address', 'Products', 'Total Amount', 'Payment Status', 'Fulfillment Status', 'Carrier', 'Tracking Code', 'Created At'],
					filteredOrders.map((o) => [
						o.orderId || '',
						o.orderIntent || 'direct',
						o.customer?.name || '',
						o.customer?.email || '',
						{ value: o.customer?.phone || '', preserveLeadingZero: true },
						o.customer?.address || '',
						(Array.isArray(o.items) ? o.items : []).map((i: any) => `${i?.title || 'Product'} (x${i?.quantity || 1})`).join('; '),
						Number(o.pricing?.grandTotal) || 0,
						o.paymentStatus || 'UNPAID',
						o.fulfillmentStatus || 'PENDING',
						o.carrier || '',
						{ value: o.trackingCode || '', preserveLeadingZero: true },
						o._createdAt ? new Date(o._createdAt) : '',
					]),
				),
			{
				status: orderStatusFilter === 'B2B_RFQ' ? 'ALL' : orderStatusFilter,
				search: orderSearchQuery,
			},
		)
	}

	const exportCustomersToCSV = () => {
		void triggerServerCsvExport(
			'customers',
			`${fileBrandPrefix}_customers_${new Date().toISOString().slice(0, 10)}.csv`,
			() =>
				serializeCsv(
					['Buyer Name', 'Phone', 'Email', 'Shipping Address', 'City', 'Country', 'Orders Count', 'Lifetime Spent ($)', 'Buyer Segment', 'Last Purchase Date'],
					filteredCustomers.map((c) => [
						c.name || 'Guest Buyer',
						{ value: c.phone || '', preserveLeadingZero: true },
						c.email || '',
						c.address || '',
						c.city || '',
						c.country || 'US',
						Number(c.orderCount) || 0,
						Number(c.totalSpent) || 0,
						c.orderCount > 1 ? 'Repeat Buyer' : c.orderCount === 1 ? 'First-Time Buyer' : 'Prospect',
						c.lastOrderDate ? new Date(c.lastOrderDate) : '',
					]),
				),
			{ search: customerSearchQuery },
		)
	}

	const exportReviewsToCSV = () => {
		void triggerServerCsvExport(
			'reviews',
			`${fileBrandPrefix}_reviews_${new Date().toISOString().slice(0, 10)}.csv`,
			() =>
				serializeCsv(
					['Reviewer', 'Product', 'Rating', 'Content', 'Status', 'Shop Response', 'Submitted At'],
					filteredReviews.map((r) => [
						r.author || '',
						r.product?.title || '',
						Number(r.rating) || 5,
						r.comment || '',
						r.isApproved ? 'Approved' : 'Pending',
						r.response || '',
						r.createdAt ? new Date(r.createdAt) : '',
					]),
				),
			{ status: reviewStatusFilter },
		)
	}

	const exportCommentsToCSV = () => {
		void triggerServerCsvExport(
			'comments',
			`${fileBrandPrefix}_comments_${new Date().toISOString().slice(0, 10)}.csv`,
			() =>
				serializeCsv(
					['Commenter Name', 'Email', 'Blog Article', 'Content', 'Status', 'Is Author Reply', 'Created At'],
					filteredComments.map((c) => [
						c.authorName || '',
						c.authorEmail || '',
						c.post?.title || '',
						c.content || '',
						c.isApproved ? 'Approved' : 'Pending',
						c.isAuthorReply ? 'Author' : 'Guest',
						c.createdAt ? new Date(c.createdAt) : '',
					]),
				),
			{ status: commentStatusFilter },
		)
	}

	// Navigation items list filtered by Role RBAC permissions
	const allNavItems = [
		{
			id: 'overview' as TabType,
			label: 'Executive Overview',
			icon: FiGrid,
			badge: null,
			group: 'core' as const,
		},
		{
			id: 'leads' as TabType,
			label: 'B2B Lead Engine',
			icon: FiTrendingUp,
			badge: leads.filter((l) => (l.status || 'new') === 'new').length || 'HOT',
			badgeColor: 'bg-rose-100 text-rose-900 border border-rose-200 font-black',
			group: 'core' as const,
		},
		{
			id: 'orders' as TabType,
			label: 'Quotes & Fulfillment',
			icon: FiPackage,
			badge: kpiStats.pendingOrders > 0 ? kpiStats.pendingOrders : null,
			badgeColor: 'bg-amber-100 text-amber-900 border border-amber-200',
			group: 'core' as const,
		},
		{
			id: 'customers' as TabType,
			label: 'Client Directory',
			icon: FiUsers,
			badge: kpiStats.totalCust || null,
			badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
			group: 'core' as const,
		},
		{
			id: 'reviews' as TabType,
			label: 'Product Reviews',
			icon: FiStar,
			badge: kpiStats.pendingReviews > 0 ? kpiStats.pendingReviews : null,
			badgeColor:
				'bg-amber-100 text-amber-900 border border-amber-200 font-bold',
			group: 'support' as const,
		},
		{
			id: 'comments' as TabType,
			label: 'Blog Discussions',
			icon: FiMessageSquare,
			badge: kpiStats.pendingComments > 0 ? kpiStats.pendingComments : null,
			badgeColor:
				'bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold',
			group: 'support' as const,
		},
		{
			id: 'staff' as TabType,
			label: 'Team & RBAC',
			icon: FiShield,
			badge: staff.length || null,
			badgeColor:
				'bg-purple-100 text-purple-900 border border-purple-200 font-bold',
			group: 'support' as const,
		},
	]

	const navItems = useMemo(() => {
		return allNavItems.filter((item) => allowedTabs.includes(item.id))
	}, [allNavItems, allowedTabs])

	return (
		<div className="flex min-h-screen flex-col bg-slate-50/70 font-sans text-slate-900 antialiased md:flex-row print:block print:min-h-0 print:bg-white">
			{/* Realtime Alert Toast Floating */}
			{newOrderAlertCount > 0 && (
				<div className="animate-in slide-in-from-top-4 admin-toast fixed top-4 right-4 z-50 flex max-w-md items-center justify-between gap-4 rounded-2xl border border-emerald-700/80 bg-emerald-900 p-4 text-white shadow-2xl backdrop-blur-md print:hidden">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 shrink-0 animate-bounce items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-md">
							<FiBell className="h-5 w-5 font-bold text-white" />
						</div>
						<div>
							<h4 className="flex items-center gap-1.5 text-sm font-extrabold text-white">
								<FiBell className="h-4 w-4" /> {newOrderAlertCount} New Order(s)
								Received!
							</h4>
							<p className="text-xs text-emerald-200">
								New customer order completed. Please review and dispatch.
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
							className="shrink-0 cursor-pointer rounded-xl bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-md transition hover:bg-slate-100 active:scale-95"
						>
							View Orders
						</button>
						<button
							type="button"
							onClick={() => setNewOrderAlertCount(0)}
							className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-emerald-300 transition hover:bg-emerald-800 hover:text-white"
						>
							<FiX className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}

			{/* ================= DESKTOP LEFT SIDEBAR ================= */}
			<aside
				className={`admin-sidebar relative sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-slate-200/90 bg-white shadow-2xs transition-all duration-300 md:flex print:hidden ${
					isSidebarCollapsed ? 'w-20' : 'w-72 lg:w-80'
				}`}
			>
				{/* Floating Collapse / Expand Button on the right border line */}
				<button
					type="button"
					onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
					className="group absolute top-7 -right-3.5 z-40 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
					title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
					aria-label={
						isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'
					}
				>
					{isSidebarCollapsed ? (
						<FiChevronRight className="h-3.5 w-3.5 text-slate-600 transition-transform group-hover:scale-110" />
					) : (
						<FiChevronLeft className="h-3.5 w-3.5 text-slate-600 transition-transform group-hover:scale-110" />
					)}
				</button>

				{/* Brand Header */}
				<div
					className={`border-b border-slate-200/90 ${isSidebarCollapsed ? 'flex flex-col items-center gap-2 p-3' : 'px-6 py-5'}`}
				>
					{isSidebarCollapsed ? (
						<div className="flex flex-col items-center gap-2">
							{logoUrl ? (
								<img
									src={logoUrl}
									alt="Logo"
									className="h-8 w-8 object-contain"
								/>
							) : (
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-base font-black text-white uppercase shadow-xs">
									{(brandName || 'S').charAt(0)}
								</div>
							)}
							{/* Operating Status Dot */}
							<button
								type="button"
								onClick={() => fetchPollData(true)}
								className="flex cursor-pointer items-center justify-center p-0.5 rounded-full hover:bg-slate-100 transition"
								title={
									isPolling
										? 'Status: Syncing realtime data...'
										: 'Status: Realtime Connected (30m auto-sync / instant on new order). Click to sync now.'
								}
							>
								<span
									className={`h-2 w-2 rounded-full transition-colors ${
										isPolling
											? 'animate-ping bg-amber-500'
											: 'animate-pulse bg-emerald-500'
									}`}
								/>
							</button>
						</div>
					) : (
						<div className="flex items-center justify-between gap-3">
							<div className="flex min-w-0 items-center gap-2.5">
								{logoUrl ? (
									<img
										src={logoUrl}
										alt="Logo"
										className="h-8 max-h-9 w-auto max-w-[170px] object-contain"
									/>
								) : (
									<span className="truncate text-xl font-black tracking-tight text-slate-900 uppercase">
										{brandName}
									</span>
								)}
							</div>

							{/* Operating Status Dot with Hover Tooltip */}
							<button
								type="button"
								onClick={() => fetchPollData(true)}
								className="flex shrink-0 cursor-pointer items-center justify-center rounded-full p-1.5 transition-colors hover:bg-slate-100"
								title={
									isPolling
										? 'Status: Syncing realtime data...'
										: 'Status: Realtime Connected (30m auto-sync / instant on new order). Click to sync now.'
								}
							>
								<span
									className={`h-2.5 w-2.5 rounded-full transition-colors ${
										isPolling
											? 'animate-ping bg-amber-500'
											: 'animate-pulse bg-emerald-500'
									}`}
								/>
							</button>
						</div>
					)}
				</div>

				{/* Navigation Links */}
				<div
					className={`flex-1 space-y-4 overflow-y-auto py-5 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}
				>
					{/* Group 1: Core B2B & Fulfillment */}
					{navItems.some((i) => i.group === 'core') && (
						<div className="space-y-1">
							{!isSidebarCollapsed && (
								<div className="px-3 pb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
									Core Pipeline & Sales
								</div>
							)}
							{navItems
								.filter((i) => i.group === 'core')
								.map((item) => {
									const Icon = item.icon
									const isActive = activeTab === item.id

									return (
										<button
											key={item.id}
											type="button"
											onClick={() => setActiveTab(item.id)}
											title={item.label}
											className={`relative flex cursor-pointer items-center rounded-2xl transition-all ${
												isSidebarCollapsed
													? 'w-full justify-center p-3.5'
													: 'w-full justify-between gap-3 px-4 py-3.5 text-xs font-bold'
											} ${
												isActive
													? 'bg-slate-900 font-black text-white shadow-md'
													: 'border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
											}`}
										>
											<div className="flex items-center gap-3">
												<div
													className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
														isActive
															? 'bg-emerald-500 text-slate-950 shadow-xs'
															: 'bg-slate-100 text-slate-500'
													}`}
												>
													<Icon className="h-4 w-4" />
												</div>
												{!isSidebarCollapsed && (
													<span className="tracking-tight">{item.label}</span>
												)}
											</div>

											{/* Badge */}
											{item.badge !== null &&
												(isSidebarCollapsed ? (
													<span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
												) : (
													<span
														className={`rounded-full px-2 py-0.5 text-[10px] font-black shadow-2xs ${
															isActive
																? 'bg-white/20 text-white'
																: item.badgeColor || 'bg-slate-100 text-slate-600'
														}`}
													>
														{item.badge}
													</span>
												))}
										</button>
									)
								})}
						</div>
					)}

					{/* Group 2: Secondary Store Support & Moderation */}
					{navItems.some((i) => i.group === 'support') && (
						<div className="space-y-1 border-t border-slate-200/70 pt-3">
							{!isSidebarCollapsed && (
								<div className="px-3 pb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
									Store Governance
								</div>
							)}
							{navItems
								.filter((i) => i.group === 'support')
								.map((item) => {
									const Icon = item.icon
									const isActive = activeTab === item.id

									return (
										<button
											key={item.id}
											type="button"
											onClick={() => setActiveTab(item.id)}
											title={item.label}
											className={`relative flex cursor-pointer items-center rounded-2xl transition-all ${
												isSidebarCollapsed
													? 'w-full justify-center p-3.5'
													: 'w-full justify-between gap-3 px-4 py-3.5 text-xs font-bold'
											} ${
												isActive
													? 'bg-slate-900 font-black text-white shadow-md'
													: 'border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
											}`}
										>
											<div className="flex items-center gap-3">
												<div
													className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
														isActive
															? 'bg-emerald-500 text-slate-950 shadow-xs'
															: 'bg-slate-100 text-slate-500'
													}`}
												>
													<Icon className="h-4 w-4" />
												</div>
												{!isSidebarCollapsed && (
													<span className="tracking-tight">{item.label}</span>
												)}
											</div>

											{/* Badge */}
											{item.badge !== null &&
												(isSidebarCollapsed ? (
													<span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
												) : (
													<span
														className={`rounded-full px-2 py-0.5 text-[10px] font-black shadow-2xs ${
															isActive
																? 'bg-white/20 text-white'
																: item.badgeColor || 'bg-slate-100 text-slate-600'
														}`}
													>
														{item.badge}
													</span>
												))}
										</button>
									)
								})}
						</div>
					)}
				</div>

				{/* User Profile Card & Sign Out at bottom of sidebar */}
				<div
					className={`border-t border-slate-200/90 bg-slate-50/80 ${isSidebarCollapsed ? 'flex flex-col items-center gap-2 p-2' : 'space-y-3 p-4'}`}
				>
					{isSidebarCollapsed ? (
						<>
							<div
								className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-slate-900 text-xs font-black text-white shadow-xs"
								title={`${adminUser?.name || 'Administrator'} (${adminUser?.role || 'admin'})`}
							>
								{adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
							</div>
							<button
								type="button"
								onClick={handleOpenLogoutModal}
								className="cursor-pointer rounded-xl border border-transparent p-2.5 text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
								title="Sign Out"
								aria-label="Sign Out"
							>
								<FiLogOut className="h-4 w-4" />
							</button>
						</>
					) : (
						<>
							<div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
								<div className="flex min-w-0 items-center gap-2.5">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-xs">
										{adminUser?.name
											? adminUser.name.charAt(0).toUpperCase()
											: 'A'}
									</div>
									<div className="min-w-0">
										<p className="truncate text-xs font-bold text-slate-900">
											{adminUser?.name || 'Admin User'}
										</p>
										<span className="py-0.2 inline-block rounded border border-slate-200 bg-slate-100 px-1.5 text-[9px] font-black tracking-wider text-slate-600 uppercase">
											{adminUser?.role || 'admin'}
										</span>
									</div>
								</div>

								<button
									type="button"
									onClick={handleOpenLogoutModal}
									className="shrink-0 cursor-pointer rounded-xl border border-transparent p-2 text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
									title="Sign Out from Admin"
									aria-label="Sign Out"
								>
									<FiLogOut className="h-4 w-4" />
								</button>
							</div>

							{/* Utility & Sound Controls */}
							<div className="flex items-center justify-between px-1 pt-1 text-xs">
								<span className="text-[11px] font-semibold text-slate-500">
									Audio Alerts
								</span>
								<button
									type="button"
									onClick={() => setSoundEnabled(!soundEnabled)}
									className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
										soundEnabled
											? 'border border-emerald-200 bg-emerald-100 text-emerald-800'
											: 'border border-slate-200 bg-white text-slate-500'
									}`}
								>
									{soundEnabled ? (
										<FiVolume2 className="h-3 w-3 text-emerald-600" />
									) : (
										<FiVolumeX className="h-3 w-3" />
									)}
									<span>{soundEnabled ? 'On' : 'Off'}</span>
								</button>
							</div>
						</>
					)}
				</div>
			</aside>

			{/* ================= MOBILE HEADER & DRAWER ================= */}
			<div className="admin-mobile-header sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-3 backdrop-blur-md md:hidden print:hidden">
				<div className="flex items-center gap-2">
					{logoUrl ? (
						<img
							src={logoUrl}
							alt="Logo"
							className="h-7 max-h-8 w-auto object-contain"
						/>
					) : (
						<span className="text-base font-black tracking-tight text-slate-900 uppercase">
							{brandName}
						</span>
					)}
					<button
						type="button"
						onClick={() => fetchPollData(true)}
						className="flex cursor-pointer items-center justify-center p-1.5 rounded-full hover:bg-slate-100 transition"
						title={
							isPolling
								? 'Status: Syncing realtime data...'
								: 'Status: Realtime Connected (30m auto-sync / instant on new order). Click to sync now.'
						}
					>
						<span
							className={`h-2.5 w-2.5 rounded-full ${
								isPolling
									? 'animate-ping bg-amber-500'
									: 'animate-pulse bg-emerald-500'
							}`}
						/>
					</button>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => fetchPollData(true)}
						disabled={isPolling}
						title="Sync data now"
						aria-label="Sync data now"
						className="flex h-10 w-10 min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-95 disabled:opacity-50"
					>
						<FiRefreshCw
							className={cn(
								'h-4 w-4',
								isPolling && 'animate-spin text-emerald-600',
							)}
						/>
					</button>
					<button
						type="button"
						onClick={() => setSoundEnabled(!soundEnabled)}
						aria-label={soundEnabled ? 'Mute audio alerts' : 'Enable audio alerts'}
						className="flex h-10 w-10 min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-95"
					>
						{soundEnabled ? (
							<FiVolume2 className="h-4 w-4 text-emerald-600" />
						) : (
							<FiVolumeX className="h-4 w-4" />
						)}
					</button>
					<button
						type="button"
						onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
						aria-label={isMobileSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
						className="flex h-10 w-10 min-h-[40px] min-w-[40px] cursor-pointer items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs hover:bg-slate-800 transition active:scale-95"
					>
						{isMobileSidebarOpen ? (
							<FiX className="h-5 w-5" />
						) : (
							<FiMenu className="h-5 w-5" />
						)}
					</button>
				</div>
			</div>

			{/* Mobile Drawer Menu */}
			{isMobileSidebarOpen && (
				<div className="animate-in fade-in fixed inset-0 z-50 flex flex-col bg-slate-950/40 p-4 backdrop-blur-sm md:hidden">
					<div className="flex flex-1 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
						<div className="flex items-center justify-between border-b border-slate-200 pb-4">
							<span className="text-lg font-black text-slate-900">
								Operations Navigation
							</span>
							<button
								type="button"
								onClick={() => setIsMobileSidebarOpen(false)}
								className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-700"
								aria-label="Close menu"
							>
								<FiX className="h-5 w-5" />
							</button>
						</div>

						<div className="flex-1 space-y-2 overflow-y-auto py-4">
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
										className={`flex w-full cursor-pointer items-center justify-between rounded-2xl p-3.5 text-xs font-bold transition ${
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
						</div>

						{/* Mobile User Profile & Sign Out */}
						<div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
							<div className="flex min-w-0 items-center gap-2.5">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
									{adminUser?.name
										? adminUser.name.charAt(0).toUpperCase()
										: 'A'}
								</div>
								<div className="min-w-0">
									<p className="truncate text-xs font-bold text-slate-900">
										{adminUser?.name || 'Admin User'}
									</p>
									<span className="text-[10px] font-bold text-slate-500 uppercase">
										{adminUser?.role || 'admin'}
									</span>
								</div>
							</div>

							<button
								type="button"
								onClick={handleOpenLogoutModal}
								className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition"
							>
								<FiLogOut className="h-4 w-4" />
								<span>Sign Out</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ================= MAIN CONTENT AREA ================= */}
			<main
				className={cn(
					'admin-main-area min-w-0 flex-1 space-y-6 overflow-x-hidden bg-slate-50/70 p-4 sm:p-6 lg:p-8',
					(selectedOrderForPrint || bulkOrdersForPrint) && 'print:hidden',
				)}
			>
				{/* Top Bar Controls & Header */}
				<div className="flex flex-col justify-between gap-4 border-b border-slate-200/90 pb-4 sm:flex-row sm:items-center">
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
								{activeTab === 'overview' &&
									'Executive Funnel & High-Ticket Operations'}
								{activeTab === 'leads' && 'B2B Lead Operations Engine'}
								{activeTab === 'orders' && 'Quotes & Export Fulfillment'}
								{activeTab === 'customers' && 'B2B Client & Buyer Directory'}
								{activeTab === 'reviews' && 'Product Reviews Moderation'}
								{activeTab === 'comments' && 'Blog Discussions & UGC'}
								{activeTab === 'staff' && 'Team & Role Governance'}
							</h1>
						</div>
						<p className="mt-1 text-xs text-slate-500 sm:text-sm">
							{activeTab === 'overview' &&
								'Real-time operations center for Hero Product funnels, high-ticket manual fulfillment, and B2B custom quote requests.'}
							{activeTab === 'leads' &&
								'High-velocity B2B prospect operations: AI Scoring, SLA response tracking, Dual-View Kanban & Power Table.'}
							{activeTab === 'orders' &&
								'B2B RFQ quotations, sample dispatches, proforma invoice generation, and export carrier tracking.'}
							{activeTab === 'customers' &&
								'Corporate accounts, repeat procurement records, and export delivery history extracted from orders and RFQs.'}
							{activeTab === 'reviews' &&
								'User-generated product reviews, UGC media verification, and store public replies.'}
							{activeTab === 'comments' &&
								'Reader article comments, discussion moderation, spam filtering, and author specialist responses.'}
							{activeTab === 'staff' &&
								'Internal team directory, role-based access control (RBAC), and lead allocation metrics.'}
						</p>
					</div>

					<div className="flex items-center gap-2.5 self-start sm:self-auto">
						{/* Manual Refresh / Sync Button */}
						<button
							type="button"
							onClick={() => fetchPollData(true)}
							disabled={isPolling}
							title={`Auto-sync: 30 minutes | Realtime on new orders.\nLast synced: ${lastSyncedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}.\nClick to sync now.`}
							className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
						>
							<FiRefreshCw
								className={cn(
									'h-3.5 w-3.5 text-slate-500',
									isPolling && 'animate-spin text-emerald-600',
								)}
							/>
							<span className="hidden sm:inline">
								{isPolling ? 'Syncing...' : 'Sync'}
							</span>
						</button>

						{/* Date Range Picker with Presets & Calendar */}
						<DateRangePicker
							align="right"
							value={selectedDateRange}
							onApply={(range) => {
								setSelectedDateRange(range)
								setOrderPage(1)
								setCustomerPage(1)
								setReviewPage(1)
								setCommentPage(1)
							}}
						/>

						{/* Import CSV Button (Leads & Orders Fulfillment) */}
						{(activeTab === 'leads' || activeTab === 'orders') && (
							<button
								type="button"
								onClick={() => setImportModalType(activeTab as ImportType)}
								className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
							>
								<FiUpload className="h-3.5 w-3.5 text-slate-500" />
								<span className="hidden sm:inline">Import CSV</span>
							</button>
						)}

						{/* Export Button */}
						{activeTab !== 'overview' && activeTab !== 'staff' && (
							<button
								type="button"
								onClick={
									activeTab === 'leads'
										? exportLeadsToCSV
										: activeTab === 'orders'
											? exportOrdersToCSV
											: activeTab === 'customers'
												? exportCustomersToCSV
												: activeTab === 'reviews'
													? exportReviewsToCSV
													: exportCommentsToCSV
								}
								className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
							>
								<FiDownload className="h-3.5 w-3.5 text-slate-500" />
								<span className="hidden sm:inline">Export CSV</span>
							</button>
						)}
					</div>
				</div>

				{mutationNotice && (
					<div
						role="alert"
						className={`rounded-2xl border px-4 py-3 text-xs font-bold ${
							mutationNotice.type === 'error'
								? 'border-rose-200 bg-rose-50 text-rose-800'
								: 'border-emerald-200 bg-emerald-50 text-emerald-800'
						}`}
					>
						{mutationNotice.message}
					</div>
				)}

				{/* ================= TAB 0: EXECUTIVE OVERVIEW HUB (HERO PRODUCTS, HIGH-TICKET & B2B) ================= */}
				{activeTab === 'overview' && allowedTabs.includes('overview') && (
					<div className="animate-in fade-in space-y-6 duration-200">
						{/* 1. Live Speed-to-Action & Operations Health Watch */}
						<div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:flex-row sm:items-center">
							<div className="flex items-center gap-3">
								<span className="relative flex h-2.5 w-2.5 shrink-0">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
								</span>
								<div>
									<div className="flex items-center gap-2">
										<span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
											Operations Command Status
										</span>
										<span className="rounded-full border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
											Live Edge Sync
										</span>
									</div>
									<div className="mt-2 flex flex-wrap items-center gap-2">
										<button
											type="button"
											onClick={() => setActiveTab('leads')}
											className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap transition ${
												kpiStats.b2bNewLeads > 0
													? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
													: 'border-slate-200 bg-slate-50 text-slate-500'
											}`}
										>
											<FiBriefcase className="h-3 w-3 shrink-0" />
											<span className="whitespace-nowrap">
												{kpiStats.b2bNewLeads} B2B Inquiries
											</span>
										</button>

										<button
											type="button"
											onClick={() => setActiveTab('orders')}
											className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap transition ${
												kpiStats.pendingOrders > 0
													? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
													: 'border-slate-200 bg-slate-50 text-slate-500'
											}`}
										>
											<FiPackage className="h-3 w-3 shrink-0" />
											<span className="whitespace-nowrap">
												{kpiStats.pendingOrders} To Dispatch
											</span>
										</button>

										<button
											type="button"
											onClick={() => setActiveTab('reviews')}
											className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap transition ${
												kpiStats.pendingReviews + kpiStats.pendingComments > 0
													? 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
													: 'border-slate-200 bg-slate-50 text-slate-500'
											}`}
										>
											<FiStar className="h-3 w-3 shrink-0" />
											<span className="whitespace-nowrap">
												{kpiStats.pendingReviews + kpiStats.pendingComments} UGC
												Verifications
											</span>
										</button>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-4 self-start border-t border-slate-100 pt-2 text-xs sm:self-auto sm:border-t-0 sm:pt-0">
								{allowedTabs.includes('orders') && (
									<>
										<div className="text-left sm:text-right">
											<span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
												Average Order Value (AOV)
											</span>
											<span className="font-mono text-sm font-bold text-slate-900">
												{formatPrice(kpiStats.averageOrderValue)}
											</span>
										</div>
										<div className="h-6 w-px bg-slate-200" />
									</>
								)}
								<div className="text-left sm:text-right">
									<span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
										High-Intent Inquiries
									</span>
									<span className="font-mono text-sm font-bold text-slate-900">
										{kpiStats.highIntentLeads}
									</span>
								</div>
							</div>
						</div>

						{/* 2. Top Core Performance Cards (Role-scoped; Marketing never sees fake $0 revenue) */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{allowedTabs.includes('orders') ? (
								<div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-colors hover:border-slate-300">
									<div className="flex items-center justify-between">
										<span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
											Total Store Revenue
										</span>
										<span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-100 text-slate-600">
											<FiTrendingUp className="h-4 w-4" />
										</span>
									</div>
									<div className="mt-3">
										<div className="font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
											{formatPrice(kpiStats.totalRevenue)}
										</div>
										<div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
											<span className="font-semibold text-slate-700">
												{kpiStats.deliveredOrders} delivered
											</span>
											<span>•</span>
											<span>AOV: {formatPrice(kpiStats.averageOrderValue)}</span>
										</div>
									</div>
								</div>
							) : (
								<div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-colors hover:border-slate-300">
									<div className="flex items-center justify-between">
										<span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
											Corporate &amp; High-Intent Leads
										</span>
										<span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-100 text-slate-600">
											<FiZap className="h-4 w-4" />
										</span>
									</div>
									<div className="mt-3">
										<div className="font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
											{kpiStats.highIntentLeads} High-Intent
										</div>
										<div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
											<span className="font-semibold text-slate-700">
												{kpiStats.corporateLeads} corporate emails
											</span>
										</div>
									</div>
								</div>
							)}

							{/* Card 2: B2B Quote Pipeline */}
							<div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-colors hover:border-slate-300">
								<div className="flex items-center justify-between">
									<span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
										B2B Quotes & Inquiries
									</span>
									<span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-100 text-slate-600">
										<FiBriefcase className="h-4 w-4" />
									</span>
								</div>
								<div className="mt-3">
									<div className="font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
										{kpiStats.b2bActiveDeals} Active
									</div>
									<div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
										<span className="font-semibold text-slate-700">
											{kpiStats.b2bNewLeads} new quotes
										</span>
										<span>•</span>
										<span>{kpiStats.b2bNegotiatingDeals} in negotiation</span>
									</div>
								</div>
							</div>

							{/* Card 3: Actionable Orders or Won Deals depending on Role */}
							{allowedTabs.includes('orders') ? (
								<div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-colors hover:border-slate-300">
									<div className="flex items-center justify-between">
										<span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
											Actionable Fulfillment
										</span>
										<span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-100 text-slate-600">
											<FiPackage className="h-4 w-4" />
										</span>
									</div>
									<div className="mt-3">
										<div className="font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
											{kpiStats.pendingOrders + kpiStats.processingOrders}
										</div>
										<div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
											<span>{kpiStats.pendingOrders} to pack</span>
											<span>•</span>
											<span className="font-semibold text-slate-700">
												{kpiStats.highTicketOrders} High-Ticket
											</span>
										</div>
									</div>
								</div>
							) : (
								<div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-colors hover:border-slate-300">
									<div className="flex items-center justify-between">
										<span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
											Pipeline Conversion
										</span>
										<span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-100 text-slate-600">
											<FiAward className="h-4 w-4" />
										</span>
									</div>
									<div className="mt-3">
										<div className="font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
											{kpiStats.b2bWonDeals} Won
										</div>
										<div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
											<span>Avg Rating: {kpiStats.avgRating} ★</span>
										</div>
									</div>
								</div>
							)}

							{/* Card 4: Social Proof & Moderation Queue */}
							<div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-colors hover:border-slate-300">
								<div className="flex items-center justify-between">
									<span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
										Social Proof & UGC
									</span>
									<span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-100 text-slate-600">
										<FiStar className="h-4 w-4" />
									</span>
								</div>
								<div className="mt-3">
									<div className="font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
										{kpiStats.pendingReviews + kpiStats.pendingComments} Pending
									</div>
									<div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
										<span>{kpiStats.pendingReviews} reviews</span>
										<span>•</span>
										<span>{kpiStats.pendingComments} comments</span>
									</div>
								</div>
							</div>
						</div>

						{/* 3. Executive Visual Intelligence & Compact Operations Hub */}
						<ExecutiveOverview
							orders={timeframeFilteredOrders}
							leads={timeframeFilteredLeads}
							timeframe={selectedDateRange.preset || 'custom'}
							customRange={selectedDateRange}
							urgentB2BLeads={urgentB2BLeads}
							actionableOrdersList={actionableOrdersList}
							setActiveTab={setActiveTab}
							setSelectedLeadForDetail={setSelectedLeadForDetail}
							setSelectedOrderForDetail={setSelectedOrderForDetail}
							setSelectedOrderForPrint={setSelectedOrderForPrint}
						/>

						{/* 4. Bottom Support Section: UGC Social Proof & Hero Funnel Attribution */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							{/* UGC Social Proof Booster */}
							<div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2.5">
										<div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100 text-slate-700">
											<FiStar className="h-4 w-4" />
										</div>
										<div>
											<h4 className="text-sm font-black text-slate-900">
												UGC & Social Proof Accelerators
											</h4>
											<p className="text-[11px] text-slate-400">
												Verified reviews & expert answers power conversion on
												high-ticket pages
											</p>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
									{/* Pending Reviews Box */}
									<div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
										<div className="flex items-center justify-between">
											<span className="text-xs font-bold text-slate-900">
												Customer Reviews
											</span>
											<span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs">
												{kpiStats.pendingReviews} pending
											</span>
										</div>
										<button
											type="button"
											onClick={() => {
												setActiveTab('reviews')
												setReviewStatusFilter('PENDING')
											}}
											className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800"
										>
											<span>Approve Reviews</span>
											<FiArrowRight className="h-3.5 w-3.5" />
										</button>
									</div>

									{/* Pending Comments Box */}
									<div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
										<div className="flex items-center justify-between">
											<span className="text-xs font-bold text-slate-900">
												Blog Discussions
											</span>
											<span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs">
												{kpiStats.pendingComments} pending
											</span>
										</div>
										<button
											type="button"
											onClick={() => {
												setActiveTab('comments')
												setCommentStatusFilter('PENDING')
											}}
											className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800"
										>
											<span>Reply as Expert</span>
											<FiArrowRight className="h-3.5 w-3.5" />
										</button>
									</div>
								</div>
							</div>

							{/* Hero Funnel & Landing Page Traffic Attribution */}
							<div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2.5">
										<div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100 text-slate-700">
											<FiGlobe className="h-4 w-4" />
										</div>
										<div>
											<h4 className="text-sm font-black text-slate-900">
												Hero Funnel & Lead Sources
											</h4>
											<p className="text-[11px] text-slate-400">
												Top-performing landing pages by inbound lead volume
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => setActiveTab('staff')}
										className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-slate-600 transition hover:text-slate-900"
									>
										<span>Team Governance</span>
										<FiArrowRight className="h-3.5 w-3.5" />
									</button>
								</div>

								{topLandingFunnels.length === 0 ? (
									<div className="py-8 text-center text-xs text-slate-400">
										No funnel attribution data collected yet.
									</div>
								) : (
									<div className="space-y-2.5">
										{topLandingFunnels.map((funnel, idx) => (
											<div
												key={funnel.path + idx}
												className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-xs"
											>
												<div className="min-w-0 pr-3">
													<p className="truncate font-mono font-bold text-slate-800">
														{funnel.path}
													</p>
													<span className="text-[10px] text-slate-400">
														Landing Page Funnel #{idx + 1}
													</span>
												</div>
												<div className="flex shrink-0 items-center gap-3">
													<div className="text-right">
														<span className="block font-mono font-black text-slate-900">
															{funnel.count} leads
														</span>
														<span className="text-[10px] font-semibold text-slate-600">
															{funnel.highIntent} high-intent
														</span>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* ================= TAB: B2B LEAD ENGINE ================= */}
				{activeTab === 'leads' && allowedTabs.includes('leads') && (
					<div className="animate-in fade-in duration-200">
						<LeadOperations
							initialLeads={timeframeFilteredLeads}
							staffList={staff}
							currentStaff={adminUser}
							onLeadCountChange={(cnt) => {}}
							brandName={brandName}
							totalServerLeads={summary?.leads.available ? summary.leads.totalLeads : undefined}
						/>
					</div>
				)}

				{/* ================= TAB 1: ORDERS MANAGEMENT ================= */}
				{activeTab === 'orders' && allowedTabs.includes('orders') && (
					<div className="animate-in fade-in space-y-6 duration-200">
						{/* Orders Specific KPI Overview Cards */}
						<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-slate-400 uppercase">
									Total Orders
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-slate-900">
										{filteredOrders.length}
									</span>
									<span className="text-[10px] font-bold text-slate-400">
										filtered orders
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-amber-700 uppercase">
									Awaiting Confirmation
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-amber-700">
										{kpiStats.pendingOrders}
									</span>
									<span className="text-[10px] font-bold text-amber-600">
										Needs call
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-purple-700 uppercase">
									In Transit
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-purple-700">
										{kpiStats.shippingOrders}
									</span>
									<span className="text-[10px] font-bold text-purple-600">
										Shipping out
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-emerald-700 uppercase">
									Filtered Revenue
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="truncate font-mono text-xl font-black text-emerald-700">
										{formatPrice(
											filteredOrders
												.filter(
													(o) =>
														o.fulfillmentStatus !== 'CANCELLED' &&
														o.fulfillmentStatus !== 'RETURNED',
												)
												.reduce(
													(acc, o) =>
														acc + (Number(o?.pricing?.grandTotal) || 0),
													0,
												),
										)}
									</span>
								</div>
							</div>
						</div>

						{/* Filters Bar: Status Pills & Search */}
						<div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
							{/* Status Pills */}
							<div className="flex flex-nowrap sm:flex-wrap gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
								{ORDER_STATUS_TABS.map((tab) => (
									<button
										key={tab.value}
										type="button"
										onClick={() => {
											setOrderStatusFilter(tab.value)
											setOrderPage(1)
										}}
										className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap shrink-0 ${
											orderStatusFilter === tab.value
												? 'bg-slate-900 font-black text-white shadow-xs'
												: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
										}`}
									>
										{tab.label}
									</button>
								))}
							</div>

							{/* Search Box */}
							<div className="relative w-full lg:w-80">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
									<FiSearch className="h-4 w-4" />
								</div>
								<input
									ref={searchInputRef}
									type="text"
									value={orderSearchQuery}
									onChange={(e) => {
										setOrderSearchQuery(e.target.value)
										setOrderPage(1)
									}}
									placeholder="Search order ID, customer, phone (Press /)..."
									className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-12 pl-9 text-base sm:text-xs text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
								/>
								<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
									{isServerSearching ? (
										<FiRefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
									) : (
										<kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
											/
										</kbd>
									)}
								</div>
							</div>
						</div>

						{/* Bulk Operations Toolbar */}
						{selectedOrderIds.size > 0 && (
							<div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-3 shadow-xs animate-in fade-in slide-in-from-top-1">
								<div className="flex items-center gap-2">
									<span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-xs font-black text-white">
										{selectedOrderIds.size}
									</span>
									<span className="text-xs font-bold text-emerald-950">
										Selected Orders
									</span>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									{/* Bulk Print */}
									<button
										type="button"
										onClick={handleBulkPrint}
										className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
									>
										<FiPrinter className="h-3.5 w-3.5" />
										<span>Bulk Print Packing Slips ({selectedOrderIds.size})</span>
									</button>
									{/* Bulk Dispatch */}
									<button
										type="button"
										disabled={isBulkProcessing}
										onClick={() => handleBulkStatusChange('SHIPPING')}
										className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-800 transition hover:bg-purple-200 disabled:opacity-50"
									>
										<FiTruck className="h-3.5 w-3.5" />
										<span>Dispatch All ({selectedOrderIds.size})</span>
									</button>
									{/* Bulk Delivered */}
									<button
										type="button"
										disabled={isBulkProcessing}
										onClick={() => handleBulkStatusChange('DELIVERED')}
										className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-200 disabled:opacity-50"
									>
										<FiCheckCircle className="h-3.5 w-3.5" />
										<span>Mark Delivered ({selectedOrderIds.size})</span>
									</button>
									{isSuperAdmin && (
										<button
											type="button"
											disabled={isBulkProcessing || isDeletingOrders}
											onClick={() => {
												const targets = filteredOrders.filter((o) =>
													selectedOrderIds.has(o._id),
												)
												openDeleteOrdersModal(targets)
											}}
											className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-800 transition hover:bg-rose-200 disabled:opacity-50"
										>
											<FiTrash2 className="h-3.5 w-3.5" />
											<span>Delete Eligible ({selectedOrderIds.size})</span>
										</button>
									)}
									{/* Deselect All */}
									<button
										type="button"
										onClick={() => setSelectedOrderIds(new Set())}
										className="cursor-pointer px-2 py-1 text-xs font-bold text-slate-500 underline hover:text-slate-800"
									>
										Deselect
									</button>
								</div>
							</div>
						)}

						{/* Orders Table */}
						<div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black tracking-wider text-slate-500 uppercase">
										<tr>
											<th className="w-10 px-4 py-3.5 text-center">
												<input
													type="checkbox"
													checked={
														paginatedOrders.length > 0 &&
														paginatedOrders.every((o) =>
															selectedOrderIds.has(o._id),
														)
													}
													onChange={handleSelectAllOrders}
													className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
													aria-label="Select all orders on this page"
												/>
											</th>
											<th className="px-4 py-3.5">Order ID / Date</th>
											<th className="px-4 py-3.5">Customer</th>
											<th className="px-4 py-3.5">Products</th>
											<th className="px-4 py-3.5">Total</th>
											<th className="px-4 py-3.5">Fulfillment</th>
											<th className="px-4 py-3.5">Quick Stage</th>
											<th className="px-4 py-3.5 text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{paginatedOrders.length === 0 ? (
											<tr>
												<td
													colSpan={8}
													className="px-4 py-12 text-center text-slate-400"
												>
													No orders found matching the filter criteria.
												</td>
											</tr>
										) : (
											paginatedOrders.map((order) => {
												const statusBadge =
													STATUS_BADGES[order.fulfillmentStatus] ||
													STATUS_BADGES.PENDING

												return (
													<tr
														key={order._id}
														className="transition hover:bg-slate-50/60"
													>
														{/* Col 0: Checkbox */}
														<td className="w-10 px-4 py-3.5 text-center">
															<input
																type="checkbox"
																checked={selectedOrderIds.has(order._id)}
																onChange={() => handleToggleSelectOrder(order._id)}
																className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
																aria-label={`Select order ${order.orderId}`}
															/>
														</td>

														{/* Col 1: Order ID */}
														<td className="px-4 py-3.5 font-mono">
															<div className="flex items-center gap-1.5">
																<span className="block text-sm font-black text-slate-900">
																	{order.orderId || order._id.slice(0, 8)}
																</span>
																{isB2BQuoteOrder(order) && (
																	<span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-sans text-[10px] font-bold text-blue-700">
																		B2B RFQ
																	</span>
																)}
															</div>
															<span className="text-[10px] text-slate-400">
																{order._createdAt
																	? new Date(
																			order._createdAt,
																		).toLocaleDateString('en-US', {
																			month: 'short',
																			day: 'numeric',
																			hour: '2-digit',
																			minute: '2-digit',
																		})
																	: ''}
															</span>
														</td>

														{/* Col 2: Customer */}
														<td className="px-4 py-3.5">
															<div className="font-bold text-slate-900">
																{order.customer?.name || 'Guest Customer'}
															</div>
															<div className="text-[11px] text-slate-500">
																{order.customer?.phone || 'No phone'}
															</div>
															{order.customer?.address && (
																<div className="mt-0.5 line-clamp-1 max-w-xs text-[10px] text-slate-400">
																	{order.customer.address}
																</div>
															)}
														</td>

														{/* Col 3: Items */}
														<td className="px-4 py-3.5">
															<div className="line-clamp-2 max-w-xs font-medium text-slate-700">
																{(Array.isArray(order.items) ? order.items : [])
																	.map(
																		(i: any) =>
																			`${i?.title || 'Product'} (x${i?.quantity || 1})`,
																	)
																	.join(', ') || '0 products'}
															</div>
														</td>

														{/* Col 4: Total */}
														<td className="px-4 py-3.5 font-mono">
															<span className="block text-sm font-black text-emerald-700">
																{formatPrice(order.pricing?.grandTotal || 0)}
															</span>
															<span className="text-[10px] text-slate-400 uppercase">
																{order.paymentMethod || 'Credit Card'}
															</span>
														</td>

														{/* Col 5: Status */}
														<td className="px-4 py-3.5">
															<div className="flex flex-col items-start gap-1">
																<span
																	className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
																>
																	{statusBadge.label}
																</span>
																{order.quoteStatus && (
																	<span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
																		Quote: {order.quoteStatus}
																	</span>
																)}
															</div>
														</td>

														{/* Col 6: Express 3-Step Action & Quick Status */}
														<td className="px-4 py-3.5 whitespace-nowrap">
															<div className="flex flex-nowrap items-center gap-1.5">
																{(!order.fulfillmentStatus ||
																	order.fulfillmentStatus === 'PENDING' ||
																	order.fulfillmentStatus === 'PROCESSING') && (
																	<button
																		type="button"
																		onClick={() =>
																			handleQuickStatusChange(
																				order._id,
																				'SHIPPING',
																			)
																		}
																		className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-purple-700 shadow-2xs transition hover:bg-purple-100"
																		title="1-Click Dispatch to Carrier"
																	>
																		<FiTruck className="h-3 w-3 shrink-0" />
																		<span>Dispatch</span>
																	</button>
																)}
																{order.fulfillmentStatus === 'SHIPPING' && (
																	<button
																		type="button"
																		onClick={() =>
																			handleQuickStatusChange(
																				order._id,
																				'DELIVERED',
																			)
																		}
																		className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-emerald-700 shadow-2xs transition hover:bg-emerald-100"
																		title="1-Click Mark as Delivered"
																	>
																		<FiCheck className="h-3 w-3 shrink-0" />
																		<span>Delivered</span>
																	</button>
																)}

																<select
																	value={order.fulfillmentStatus || 'PENDING'}
																	onChange={(e) =>
																		handleQuickStatusChange(
																			order._id,
																			e.target.value,
																		)
																	}
																	className="shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
																>
																	<option value="PENDING">
																		Pending Confirmation
																	</option>
																	<option value="PROCESSING">
																		Processing & Packing
																	</option>
																	<option value="SHIPPING">
																		In Transit / Shipping
																	</option>
																	<option value="DELIVERED">Delivered</option>
																	<option value="CANCELLED">
																		Cancel Order
																	</option>
																	<option value="RETURNED">Return Order</option>
																</select>
															</div>
														</td>

														{/* Col 7: Actions */}
														<td className="space-x-1.5 px-4 py-3.5 text-right whitespace-nowrap">
															{isSuperAdmin && (() => {
																const delCheck = getAdminOrderDeletionEligibility(order)
																return (
																	<button
																		type="button"
																		disabled={!delCheck.eligible || isDeletingOrders}
																		onClick={() => openDeleteOrdersModal([order])}
																		className="inline-flex h-9 w-9 min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 shadow-2xs transition hover:bg-rose-100 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
																		title={
																			delCheck.eligible
																				? 'Delete Order (Super Admin)'
																				: delCheck.reason
																		}
																		aria-label={`Delete order ${order.orderId}`}
																	>
																		<FiTrash2 className="h-4 w-4" />
																	</button>
																)
															})()}
															<button
																type="button"
																onClick={() => {
																	setSelectedOrderForPrint(order)
																	setBulkOrdersForPrint(null)
																}}
																className="inline-flex h-9 w-9 min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
																title="Print Packing Slip"
																aria-label="Print Packing Slip"
															>
																<FiPrinter className="h-4 w-4 text-slate-600" />
															</button>
															<button
																type="button"
																onClick={() => setSelectedOrderForDetail(order)}
																className="inline-flex h-9 w-9 min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs transition hover:bg-slate-800 active:scale-95"
																title="View Order Details"
																aria-label="View Order Details"
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
							{(totalOrderPages > 1 || (summary?.orders.available && summary.orders.totalOrders > orders.length)) && (
								<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs">
									<div className="flex items-center gap-3 text-slate-500">
										<span>
											Page{' '}
											<span className="font-bold text-slate-900">
												{orderPage}
											</span>{' '}
											of {totalOrderPages} ({filteredOrders.length}
											{summary?.orders.available && summary.orders.totalOrders > orders.length
												? ` loaded of ${summary.orders.totalOrders}`
												: ''}{' '}
											orders)
										</span>
										{summary?.orders.available && summary.orders.totalOrders > orders.length && (
											<button
												type="button"
												disabled={isLoadingMoreOrders}
												onClick={loadMoreOrders}
												className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
											>
												{isLoadingMoreOrders ? 'Loading...' : 'Load More from D1'}
											</button>
										)}
									</div>

									{totalOrderPages > 1 && (
										<div className="flex items-center gap-2">
											<button
												type="button"
												disabled={orderPage === 1}
												onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
												className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
											>
												<FiChevronLeft className="h-4 w-4" />
											</button>
											<button
												type="button"
												disabled={orderPage === totalOrderPages}
												onClick={() =>
													setOrderPage((p) => Math.min(totalOrderPages, p + 1))
												}
												className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
											>
												<FiChevronRight className="h-4 w-4" />
											</button>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				)}

				{/* ================= TAB 2: B2C BUYERS DIRECTORY ================= */}
				{activeTab === 'customers' && allowedTabs.includes('customers') && (
					<div className="animate-in fade-in space-y-6 duration-200">
						{/* Buyers Specific KPI Overview Cards */}
						<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-slate-400 uppercase">
									Unique Buyers
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-slate-900">
										{b2cBuyers.length}
									</span>
									<span className="text-[10px] font-bold text-slate-400">
										verified buyers
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-purple-700 uppercase">
									Repeat Buyers
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-purple-700">
										{b2cBuyers.filter((b) => b.orderCount > 1).length}
									</span>
									<span className="text-[10px] font-bold text-purple-600">
										2+ orders
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-blue-700 uppercase">
									High-Value (≥ $100)
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-blue-700">
										{
											b2cBuyers.filter(
												(b) => (Number(b.totalSpent) || 0) >= 100,
											).length
										}
									</span>
									<span className="text-[10px] font-bold text-blue-600">
										top spenders
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-emerald-700 uppercase">
									Realized B2C Revenue
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="truncate font-mono text-xl font-black text-emerald-700">
										{formatPrice(
											b2cBuyers.reduce(
												(sum, b) => sum + (Number(b.totalSpent) || 0),
												0,
											),
										)}
									</span>
								</div>
							</div>
						</div>

						{/* Filters Bar: Tabs & Search */}
						<div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
							<div className="flex flex-nowrap sm:flex-wrap gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
								{CUSTOMER_TABS.map((tab) => (
									<button
										key={tab.value}
										type="button"
										onClick={() => {
											setCustomerTabFilter(tab.value)
											setCustomerPage(1)
										}}
										className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap shrink-0 ${
											customerTabFilter === tab.value
												? 'bg-slate-900 font-black text-white shadow-xs'
												: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
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
									placeholder="Search buyer name, phone, address..."
									className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-base sm:text-xs text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
								/>
							</div>
						</div>

						{/* Buyers Table */}
						<div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black tracking-wider text-slate-500 uppercase">
										<tr>
											<th className="px-4 py-3.5">Buyer & Phone</th>
											<th className="px-4 py-3.5">Default Shipping Address</th>
											<th className="px-4 py-3.5">Segment</th>
											<th className="px-4 py-3.5">Orders</th>
											<th className="px-4 py-3.5">Lifetime Spend</th>
											<th className="px-4 py-3.5">Last Purchase</th>
											<th className="px-4 py-3.5 text-right">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{paginatedCustomers.length === 0 ? (
											<tr>
												<td
													colSpan={7}
													className="px-4 py-12 text-center text-slate-400"
												>
													No retail buyers found matching the criteria.
												</td>
											</tr>
										) : (
											paginatedCustomers.map((cust) => {
												const phoneClean = cust.phone?.replace(/\D/g, '')
												const isRepeat = (cust.orderCount || 0) > 1

												return (
													<tr
														key={cust.id || cust._id}
														className="transition hover:bg-slate-50/60"
													>
														{/* Col 1: Buyer & Phone */}
														<td className="px-4 py-3.5">
															<div className="text-sm font-bold text-slate-900">
																{cust.name || 'Guest Buyer'}
															</div>
															<div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
																<span className="font-mono">
																	{cust.phone || 'No phone'}
																</span>
																{phoneClean && (
																	<a
																		href={`https://wa.me/${phoneClean}`}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="inline-flex items-center gap-0.5 font-bold text-emerald-600 hover:text-emerald-700"
																		title="Fast WhatsApp"
																	>
																		<FaWhatsapp className="h-3 w-3" />
																		<span>WA</span>
																	</a>
																)}
															</div>
														</td>

														{/* Col 2: Shipping Address */}
														<td className="px-4 py-3.5">
															<div
																className="max-w-xs truncate font-medium text-slate-700"
																title={cust.address || 'No address'}
															>
																{cust.address || '—'}
																{cust.city ? `, ${cust.city}` : ''}
																{cust.country ? ` (${cust.country})` : ''}
															</div>
															{cust.email && (
																<div className="max-w-xs truncate text-[11px] text-slate-400">
																	{cust.email}
																</div>
															)}
														</td>

														{/* Col 3: Segment */}
														<td className="px-4 py-3.5">
															<span
																className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${
																	isRepeat
																		? 'border-purple-200 bg-purple-50 text-purple-700'
																		: 'border-slate-200 bg-slate-100 text-slate-700'
																}`}
															>
																{isRepeat ? (
																	<>
																		<FiAward className="h-3 w-3 text-purple-600" />
																		<span>Repeat Buyer</span>
																	</>
																) : (
																	<>
																		<FiUserCheck className="h-3 w-3 text-slate-500" />
																		<span>First-Time</span>
																	</>
																)}
															</span>
														</td>

														{/* Col 4: Orders Count */}
														<td className="px-4 py-3.5 font-mono font-bold text-slate-900">
															{cust.orderCount || 1}{' '}
															{cust.orderCount === 1 ? 'order' : 'orders'}
														</td>

														{/* Col 5: Total Spent */}
														<td className="px-4 py-3.5 font-mono text-sm font-black text-emerald-700">
															{formatPrice(cust.totalSpent || 0)}
														</td>

														{/* Col 6: Last Purchase Date */}
														<td className="px-4 py-3.5 text-[11px] whitespace-nowrap text-slate-500">
															{cust.lastOrderDate
																? new Date(
																		cust.lastOrderDate,
																	).toLocaleDateString('en-US', {
																		month: 'short',
																		day: 'numeric',
																		year: 'numeric',
																	})
																: '—'}
														</td>

														{/* Col 7: Details Action */}
														<td className="px-4 py-3.5 text-right whitespace-nowrap">
															<button
																type="button"
																onClick={() =>
																	setSelectedCustomerForDetail(cust)
																}
																className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800"
															>
																<FiEye className="h-3.5 w-3.5" />
																<span>History</span>
															</button>
														</td>
													</tr>
												)
											})
										)}
									</tbody>
								</table>
							</div>

							{/* B2C Customers Pagination Footer */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-slate-50/80">
								<div className="flex items-center flex-wrap gap-3 text-xs text-slate-600 font-medium">
									<span>
										Showing{' '}
										<strong className="font-bold text-slate-900">
											{filteredCustomers.length === 0
												? 0
												: customerPageSize >= 9999
													? 1
													: (customerPage - 1) * customerPageSize + 1}
										</strong>{' '}
										to{' '}
										<strong className="font-bold text-slate-900">
											{customerPageSize >= 9999
												? filteredCustomers.length
												: Math.min(customerPage * customerPageSize, filteredCustomers.length)}
										</strong>{' '}
										of <strong className="font-bold text-slate-900">{filteredCustomers.length}</strong> verified buyers
										{summary?.customers.available && summary.customers.totalCustomers > b2cBuyers.length && (
											<span className="ml-1.5 text-slate-400">
												({b2cBuyers.length} loaded of {summary.customers.totalCustomers})
											</span>
										)}
									</span>

									{summary?.customers.available && summary.customers.totalCustomers > b2cBuyers.length && (
										<button
											type="button"
											disabled={isLoadingMoreCustomers}
											onClick={loadMoreCustomers}
											className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
										>
											{isLoadingMoreCustomers ? 'Loading...' : 'Load More from D1'}
										</button>
									)}

									<div className="flex items-center gap-1.5 ml-0 sm:ml-2">
										<span className="text-slate-300 hidden sm:inline">•</span>
										<label htmlFor="customerPageSizeSelect" className="text-slate-500 text-[11px] font-bold">
											Rows per page:
										</label>
										<select
											id="customerPageSizeSelect"
											value={customerPageSize}
											onChange={(e) => {
												setCustomerPageSize(Number(e.target.value))
												setCustomerPage(1)
											}}
											className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer focus:outline-hidden"
										>
											<option value={15}>15</option>
											<option value={25}>25</option>
											<option value={50}>50</option>
											<option value={100}>100</option>
											<option value={9999}>All</option>
										</select>
									</div>
								</div>

								{/* Page Controls */}
								{totalCustomerPages > 1 && customerPageSize < 9999 && (
									<div className="flex items-center gap-1 self-end sm:self-auto">
										<button
											type="button"
											disabled={customerPage === 1}
											onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
											className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
										>
											<FiChevronLeft className="h-3.5 w-3.5" />
											<span className="hidden sm:inline">Previous</span>
										</button>

										<div className="flex items-center gap-1 px-1">
											{getPageNumbers(customerPage, totalCustomerPages).map((p, idx) =>
												p === '...' ? (
													<span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-slate-400">
														...
													</span>
												) : (
													<button
														key={`page-${p}`}
														type="button"
														onClick={() => setCustomerPage(Number(p))}
														className={cn(
															'h-7 min-w-7 px-2 rounded-xl text-xs font-bold transition cursor-pointer',
															customerPage === p
																? 'bg-slate-900 text-white shadow-xs'
																: 'text-slate-600 hover:bg-slate-200',
														)}
													>
														{p}
													</button>
												),
											)}
										</div>

										<button
											type="button"
											disabled={customerPage === totalCustomerPages}
											onClick={() => setCustomerPage((p) => Math.min(totalCustomerPages, p + 1))}
											className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
										>
											<span className="hidden sm:inline">Next</span>
											<FiChevronRight className="h-3.5 w-3.5" />
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* ================= TAB 3: PRODUCT REVIEWS ================= */}
				{activeTab === 'reviews' && allowedTabs.includes('reviews') && (
					<div className="animate-in fade-in space-y-6 duration-200">
						{/* Reviews Specific KPI Overview Cards */}
						<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-slate-400 uppercase">
									Total Reviews
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-slate-900">
										{filteredReviews.length}
									</span>
									<span className="text-[10px] font-bold text-slate-400">
										reviews
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-amber-700 uppercase">
									Pending Moderation
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-amber-700">
										{kpiStats.pendingReviews}
									</span>
									<span className="text-[10px] font-bold text-amber-600">
										Needs review
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-emerald-700 uppercase">
									Average Score
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-emerald-700">
										{kpiStats.avgRating}
									</span>
									<span className="text-[10px] font-bold text-emerald-600">
										/ 5.0 stars
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-yellow-700 uppercase">
									5-Star Ratings
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-yellow-700">
										{kpiStats.fiveStarReviews}
									</span>
									<span className="text-[10px] font-bold text-yellow-600">
										Satisfied
									</span>
								</div>
							</div>
						</div>

						{/* Filters Bar */}
						<div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
							<div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
								{REVIEW_TABS.map((tab) => (
									<button
										key={tab.value}
										type="button"
										onClick={() => {
											setReviewStatusFilter(tab.value)
											setReviewPage(1)
										}}
										className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition ${
											reviewStatusFilter === tab.value
												? 'bg-slate-900 font-black text-white shadow-xs'
												: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
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
									placeholder="Search reviewer, product, content..."
									className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
								/>
							</div>
						</div>

						{/* Reviews Table */}
						<div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black tracking-wider text-slate-500 uppercase">
										<tr>
											<th className="px-4 py-3.5">Reviewer & Product</th>
											<th className="px-4 py-3.5">Rating</th>
											<th className="px-4 py-3.5">Feedback Content</th>
											<th className="px-4 py-3.5">UGC Media</th>
											<th className="px-4 py-3.5">Status</th>
											<th className="px-4 py-3.5">Quick Action</th>
											<th className="px-4 py-3.5 text-right">Details</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{paginatedReviews.length === 0 ? (
											<tr>
												<td
													colSpan={7}
													className="px-4 py-12 text-center text-slate-400"
												>
													No reviews found matching the criteria.
												</td>
											</tr>
										) : (
											paginatedReviews.map((rev) => {
												const safeImages = Array.isArray(rev?.images)
													? rev.images
													: []
												const safeVideos = Array.isArray(rev?.videos)
													? rev.videos
													: []
												const mediaCount = safeImages.length + safeVideos.length

												return (
													<tr
														key={rev._id}
														className="transition hover:bg-slate-50/60"
													>
														<td className="px-4 py-3.5">
															<div className="text-sm font-bold text-slate-900">
																{rev.author || 'Customer'}
															</div>
															<div className="mt-0.5 line-clamp-1 flex max-w-xs items-center gap-1 text-[11px] font-semibold text-emerald-700">
																<FiPackage className="h-3 w-3 shrink-0" />
																<span>
																	{rev.product?.title || '[General Product]'}
																</span>
															</div>
															<div className="mt-0.5 text-[10px] text-slate-400">
																{rev.createdAt
																	? new Date(rev.createdAt).toLocaleDateString(
																			'en-US',
																			{ month: 'short', day: 'numeric', year: 'numeric' },
																		)
																	: ''}
															</div>
														</td>

														<td className="px-4 py-3.5 font-mono">
															<div className="flex items-center gap-1">
																<span className="text-sm font-black text-amber-600">
																	{rev.rating || 5}
																</span>
																<FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
															</div>
														</td>

														<td className="px-4 py-3.5">
															<p className="line-clamp-2 max-w-sm font-medium text-slate-700">
																{rev.comment || '(No written review provided)'}
															</p>
															{rev.response && (
																<span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
																	<FiCheck className="h-3 w-3" /> Store replied
																</span>
															)}
														</td>

														<td className="px-4 py-3.5">
															{mediaCount > 0 ? (
																<span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
																	<FiImage className="h-3 w-3 text-indigo-600" />
																	<span>{mediaCount} files</span>
																</span>
															) : (
																<span className="text-[10px] text-slate-400">
																	None
																</span>
															)}
														</td>

														<td className="px-4 py-3.5">
															{rev.isApproved ? (
																<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
																	Published
																</span>
															) : (
																<span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
																	Pending
																</span>
															)}
														</td>

														<td className="px-4 py-3.5">
															<button
																type="button"
																onClick={() =>
																	handleQuickToggleReviewApproval(
																		rev._id,
																		rev.isApproved,
																	)
																}
																className={`cursor-pointer rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
																	rev.isApproved
																		? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
																		: 'bg-emerald-600 font-black text-white shadow-2xs hover:bg-emerald-700'
																}`}
															>
																{rev.isApproved ? 'Unpublish' : 'Approve'}
															</button>
														</td>

														<td className="px-4 py-3.5 text-right">
															<button
																type="button"
																onClick={() => setSelectedReviewForDetail(rev)}
																className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-900 hover:text-white"
																title="View Media & Reply"
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
								<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs">
									<span className="text-slate-500">
										Page{' '}
										<span className="font-bold text-slate-900">
											{reviewPage}
										</span>{' '}
										of {totalReviewPages} ({filteredReviews.length} reviews)
									</span>

									<div className="flex items-center gap-2">
										<button
											type="button"
											disabled={reviewPage === 1}
											onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
											className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
										>
											<FiChevronLeft className="h-4 w-4" />
										</button>
										<button
											type="button"
											disabled={reviewPage === totalReviewPages}
											onClick={() =>
												setReviewPage((p) => Math.min(totalReviewPages, p + 1))
											}
											className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
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
				{activeTab === 'comments' && allowedTabs.includes('comments') && (
					<div className="animate-in fade-in space-y-6 duration-200">
						{/* Comments Specific KPI Overview Cards */}
						<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-slate-400 uppercase">
									Total Comments
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-slate-900">
										{filteredComments.length}
									</span>
									<span className="text-[10px] font-bold text-slate-400">
										comments
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-indigo-700 uppercase">
									Pending Moderation
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-indigo-700">
										{kpiStats.pendingComments}
									</span>
									<span className="text-[10px] font-bold text-indigo-600">
										Needs approval
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-emerald-700 uppercase">
									Published Discussions
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-emerald-700">
										{comments.filter((c) => c.isApproved).length}
									</span>
									<span className="text-[10px] font-bold text-emerald-600">
										Live
									</span>
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
								<span className="block text-[11px] font-black tracking-wider text-blue-700 uppercase">
									Author Replies
								</span>
								<div className="mt-1 flex items-baseline gap-2">
									<span className="font-mono text-2xl font-black text-blue-700">
										{kpiStats.officialReplies}
									</span>
									<span className="text-[10px] font-bold text-blue-600">
										Official badge
									</span>
								</div>
							</div>
						</div>

						{/* Filters Bar */}
						<div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
							<div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
								{COMMENT_TABS.map((tab) => (
									<button
										key={tab.value}
										type="button"
										onClick={() => {
											setCommentStatusFilter(tab.value)
											setCommentPage(1)
										}}
										className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition ${
											commentStatusFilter === tab.value
												? 'bg-slate-900 font-black text-white shadow-xs'
												: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
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
									placeholder="Search name, email, content, article..."
									className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
								/>
							</div>
						</div>

						{/* Comments Table */}
						<div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black tracking-wider text-slate-500 uppercase">
										<tr>
											<th className="px-4 py-3.5">Author & Email</th>
											<th className="px-4 py-3.5">Target Article</th>
											<th className="px-4 py-3.5">Comment Content</th>
											<th className="px-4 py-3.5">Badge</th>
											<th className="px-4 py-3.5">Status</th>
											<th className="px-4 py-3.5">Quick Action</th>
											<th className="px-4 py-3.5 text-right">Details</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{paginatedComments.length === 0 ? (
											<tr>
												<td
													colSpan={7}
													className="px-4 py-12 text-center text-slate-400"
												>
													No comments found matching the criteria.
												</td>
											</tr>
										) : (
											paginatedComments.map((com) => (
												<tr
													key={com._id}
													className="transition hover:bg-slate-50/60"
												>
													<td className="px-4 py-3.5">
														<div className="text-sm font-bold text-slate-900">
															{com.authorName || 'Guest Reader'}
														</div>
														<div className="mt-0.5 text-[11px] text-slate-500">
															{com.authorEmail || 'No email'}
														</div>
														<div className="mt-0.5 text-[10px] text-slate-400">
															{com.createdAt
																? new Date(com.createdAt).toLocaleDateString(
																		'en-US',
																		{ month: 'short', day: 'numeric', year: 'numeric' },
																	)
																: ''}
														</div>
													</td>

													<td className="px-4 py-3.5">
														<div className="line-clamp-1 max-w-xs font-bold text-indigo-700">
															{com.post?.title || 'Blog Article'}
														</div>
														{com.parentComment && (
															<span className="mt-0.5 block text-[10px] text-slate-500 italic">
																↳ Replying to{' '}
																{com.parentComment.authorName || 'user'}
															</span>
														)}
													</td>

													<td className="px-4 py-3.5">
														<p className="line-clamp-2 max-w-sm font-medium text-slate-700">
															{com.content}
														</p>
													</td>

													<td className="px-4 py-3.5">
														{com.isAuthorReply ? (
															<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800">
																<FiAward className="h-3 w-3" /> Specialist
															</span>
														) : (
															<span className="text-[10px] text-slate-500">
																Reader
															</span>
														)}
													</td>

													<td className="px-4 py-3.5">
														{com.isApproved ? (
															<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
																Published
															</span>
														) : (
															<span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
																Pending
															</span>
														)}
													</td>

													<td className="px-4 py-3.5">
														<button
															type="button"
															onClick={() =>
																handleQuickToggleCommentApproval(
																	com._id,
																	com.isApproved,
																)
															}
															className={`cursor-pointer rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
																com.isApproved
																	? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
																	: 'bg-indigo-600 font-black text-white shadow-2xs hover:bg-indigo-700'
															}`}
														>
															{com.isApproved ? 'Unpublish' : 'Approve'}
														</button>
													</td>

													<td className="px-4 py-3.5 text-right">
														<button
															type="button"
															onClick={() => setSelectedCommentForDetail(com)}
															className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-900 hover:text-white"
															title="View Details & Reply as Author"
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
								<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs">
									<span className="text-slate-500">
										Page{' '}
										<span className="font-bold text-slate-900">
											{commentPage}
										</span>{' '}
										of {totalCommentPages} ({filteredComments.length} comments)
									</span>

									<div className="flex items-center gap-2">
										<button
											type="button"
											disabled={commentPage === 1}
											onClick={() => setCommentPage((p) => Math.max(1, p - 1))}
											className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
										>
											<FiChevronLeft className="h-4 w-4" />
										</button>
										<button
											type="button"
											disabled={commentPage === totalCommentPages}
											onClick={() =>
												setCommentPage((p) =>
													Math.min(totalCommentPages, p + 1),
												)
											}
											className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
										>
											<FiChevronRight className="h-4 w-4" />
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* ================= TAB: STAFF & RBAC MANAGEMENT ================= */}
				{activeTab === 'staff' && allowedTabs.includes('staff') && (
					<div className="animate-in fade-in duration-200">
						<StaffManagement initialStaff={staff} currentStaff={adminUser} />
					</div>
				)}

				{/* Restricted Tab Access Fallback Banner */}
				{!allowedTabs.includes(activeTab) && (
					<div className="my-8 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
						<FiShield className="mx-auto mb-3 h-12 w-12 text-amber-600" />
						<h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
						<p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
							Your account role ({userRole}) does not have permission to view or manage the "{activeTab}" module.
						</p>
						<button
							type="button"
							onClick={() => setActiveTab(defaultTab)}
							className="mt-4 cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
						>
							Return to Allowed Workspace ({defaultTab.toUpperCase()})
						</button>
					</div>
				)}
			</main>

			{/* ================= MODALS ================= */}
			{/* 1. Order Detail Modal */}
			{selectedOrderForDetail && (
				<OrderDetailModal
					order={selectedOrderForDetail}
					userRole={userRole}
					onClose={() => setSelectedOrderForDetail(null)}
					onOpenPrint={(order) => {
						setSelectedOrderForDetail(null)
						setSelectedOrderForPrint(order)
					}}
					onRequestDelete={
						isSuperAdmin ? (order) => openDeleteOrdersModal([order]) : undefined
					}
					onOrderUpdated={(updated) => {
						setOrders((prev) =>
							prev.map((o) => (o._id === updated._id ? updated : o)),
						)
						setSelectedOrderForDetail(updated)
					}}
				/>
			)}

			{isSuperAdmin && ordersToDelete && (
				<OrderDeleteModal
					orders={ordersToDelete}
					isOpen={Boolean(ordersToDelete)}
					isDeleting={isDeletingOrders}
					errorMessage={deleteOrderError}
					onClose={() => {
						if (!isDeletingOrders) {
							setOrdersToDelete(null)
							setDeleteOrderError(null)
						}
					}}
					onConfirm={handleConfirmDeleteOrders}
				/>
			)}

			{/* 2. Order Print Invoice Modal (Single or Bulk) */}
			{(selectedOrderForPrint || bulkOrdersForPrint) && (
				<OrderPrintModal
					order={selectedOrderForPrint}
					orders={bulkOrdersForPrint || undefined}
					onClose={() => {
						setSelectedOrderForPrint(null)
						setBulkOrdersForPrint(null)
					}}
					brandName={brandName}
					companyName={siteProfile?.companyName}
					supportEmail={siteProfile?.email}
				/>
			)}

			{/* 3. B2C Buyer Purchase History Modal */}
			{selectedCustomerForDetail && (
				<CustomerDetailModal
					customer={selectedCustomerForDetail}
					onClose={() => setSelectedCustomerForDetail(null)}
					onOpenPrintOrder={(ord) => {
						setSelectedCustomerForDetail(null)
						setSelectedOrderForPrint(ord)
					}}
				/>
			)}

			{/* 4. Product Review Detail Modal */}
			{selectedReviewForDetail && (
				<ReviewModal
					review={selectedReviewForDetail}
					onClose={() => setSelectedReviewForDetail(null)}
					onReviewUpdated={(updated) => {
						setReviews((prev) =>
							prev.map((r) => (r._id === updated._id ? updated : r)),
						)
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
						setComments((prev) =>
							prev.map((c) => (c._id === updated._id ? updated : c)),
						)
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

			{/* 6. Lead CRM Detail Drawer */}
			{selectedLeadForDetail && (
				<LeadDetailDrawer
					lead={selectedLeadForDetail}
					isOpen={Boolean(selectedLeadForDetail)}
					onClose={() => setSelectedLeadForDetail(null)}
					onLeadUpdated={(updated) => {
						setLeads((prev) =>
							prev.map((l) => (l.id === updated.id ? updated : l)),
						)
						setSelectedLeadForDetail(updated)
					}}
					staffList={staff}
					currentStaff={adminUser}
					brandName={brandName}
				/>
			)}

			{/* 7. CSV Bulk Import Modal */}
			{importModalType && (
				<CsvImportModal
					type={importModalType}
					isOpen={Boolean(importModalType)}
					onClose={() => setImportModalType(null)}
					onSuccess={() => {
						fetchPollData(true)
					}}
				/>
			)}

			{/* 8. Sign Out Confirmation Modal Popup */}
			{isLogoutModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
					onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
				>
					<div
						className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Close button */}
						<button
							type="button"
							disabled={isLoggingOut}
							onClick={() => setIsLogoutModalOpen(false)}
							className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
							aria-label="Close"
						>
							<FiX className="h-4 w-4" />
						</button>

						<div className="p-6 sm:p-7">
							{/* Icon & Title Header */}
							<div className="flex items-start gap-4">
								<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 shadow-xs">
									<FiLogOut className="h-6 w-6" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-slate-900 tracking-tight">
										Sign Out from Workspace
									</h3>
									<p className="text-xs text-slate-500 mt-1 leading-relaxed">
										Are you sure you want to end your administrative session? You will be redirected to the sign-in portal.
									</p>
								</div>
							</div>

							{/* User Profile Summary */}
							<div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-xs">
									{adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-xs font-bold text-slate-900">
										{adminUser?.name || 'Administrator'}
									</p>
									<p className="truncate text-[11px] text-slate-500">
										{adminUser?.email || 'admin@deanflow.com'}
									</p>
								</div>
								<span className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-2xs">
									{adminUser?.role || 'admin'}
								</span>
							</div>

							{/* Action Buttons */}
							<div className="mt-6 flex items-center justify-end gap-3">
								<button
									type="button"
									disabled={isLoggingOut}
									onClick={() => setIsLogoutModalOpen(false)}
									className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									type="button"
									disabled={isLoggingOut}
									onClick={handleConfirmLogout}
									className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition active:scale-[0.98] cursor-pointer disabled:opacity-60"
								>
									{isLoggingOut ? (
										<>
											<FiRefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
											<span>Signing out...</span>
										</>
									) : (
										<>
											<FiLogOut className="h-3.5 w-3.5" />
											<span>Confirm Sign Out</span>
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
