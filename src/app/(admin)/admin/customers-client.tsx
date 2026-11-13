'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
	ArrowLeft,
	ArrowUpRight,
	Building2,
	Check,
	ChevronLeft,
	ChevronRight,
	Clock,
	Copy,
	Globe,
	Inbox,
	Info,
	Loader2,
	Mail,
	MessageSquare,
	Phone,
	Search,
	SlidersHorizontal,
	Users,
	X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type {
	CustomerInteraction,
	CustomerRecord,
} from '@/lib/customer-directory'

const PAGE_SIZE = 25

type ListCacheEntry = {
	items: CustomerRecord[]
	total: number
}

type DetailCacheEntry = {
	customer: CustomerRecord
	events: CustomerInteraction[]
}

const SOURCE_OPTIONS = [
	{ value: 'all', label: 'All Sources' },
	{ value: 'inquiry', label: 'Inquiries' },
	{ value: 'wholesale_rfq', label: 'Wholesale RFQ' },
	{ value: 'direct_order', label: 'Direct Orders' },
	{ value: 'sample_order', label: 'Sample Orders' },
	{ value: 'newsletter', label: 'Newsletter' },
	{ value: 'popup', label: 'Popups' },
	{ value: 'blog_comment', label: 'Blog Comments' },
	{ value: 'product_review', label: 'Product Reviews' },
] as const

const SOURCE_BADGES: Record<string, { label: string; className: string }> = {
	inquiry: {
		label: 'Inquiry',
		className: 'border-blue-200 bg-blue-50 text-blue-700',
	},
	contact: {
		label: 'Contact',
		className: 'border-blue-200 bg-blue-50 text-blue-700',
	},
	landing_page: {
		label: 'Landing Page',
		className: 'border-sky-200 bg-sky-50 text-sky-700',
	},
	wholesale_rfq: {
		label: 'Wholesale RFQ',
		className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
	},
	direct_order: {
		label: 'Direct Order',
		className: 'border-teal-200 bg-teal-50 text-teal-700',
	},
	sample_order: {
		label: 'Sample Order',
		className: 'border-cyan-200 bg-cyan-50 text-cyan-700',
	},
	newsletter: {
		label: 'Newsletter',
		className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
	},
	popup: {
		label: 'Popup',
		className: 'border-amber-200 bg-amber-50 text-amber-700',
	},
	blog_comment: {
		label: 'Blog Comment',
		className: 'border-purple-200 bg-purple-50 text-purple-700',
	},
	product_review: {
		label: 'Product Review',
		className: 'border-rose-200 bg-rose-50 text-rose-700',
	},
}

const STATUS_BADGES: Record<string, string> = {
	approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
	won: 'border-emerald-200 bg-emerald-50 text-emerald-700',
	qualified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
	contacted: 'border-blue-200 bg-blue-50 text-blue-700',
	discovery: 'border-indigo-200 bg-indigo-50 text-indigo-700',
	proposal: 'border-violet-200 bg-violet-50 text-violet-700',
	pending: 'border-amber-200 bg-amber-50 text-amber-700',
	new: 'border-amber-200 bg-amber-50 text-amber-700',
	closed: 'border-slate-200 bg-slate-100 text-slate-600',
	lost: 'border-rose-200 bg-rose-50 text-rose-700',
}

function normalizeTimestamp(value?: string | null) {
	if (!value) return null
	const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:/.test(value)
		? value.replace(' ', 'T') + 'Z'
		: value
	const parsed = Date.parse(normalized)
	return Number.isFinite(parsed) ? new Date(parsed) : null
}

function formatDate(value?: string | null) {
	const d = normalizeTimestamp(value)
	if (!d) return 'Not recorded'
	return d.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	})
}

function formatShortDate(value?: string | null) {
	const d = normalizeTimestamp(value)
	if (!d) return '—'
	const diffHours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60))
	if (diffHours >= 0 && diffHours < 24) {
		return diffHours === 0 ? 'Just now' : `${diffHours}h ago`
	}
	if (diffHours >= 24 && diffHours < 48) return 'Yesterday'
	return d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year:
			d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
	})
}

function getInitials(name?: string | null) {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/)
	if (parts.length >= 2) {
		return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
	}
	return name.trim().slice(0, 2).toUpperCase() || '?'
}

function getSourceMeta(source: string) {
	const trimmed = source.trim()
	return (
		SOURCE_BADGES[trimmed] || {
			label: trimmed.replaceAll('_', ' '),
			className: 'border-slate-200 bg-slate-100 text-slate-700 capitalize',
		}
	)
}

function parseSources(sources?: string | null) {
	if (!sources) return []
	return Array.from(
		new Set(
			sources
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
		),
	)
}

function CustomerTableSkeleton() {
	return (
		<div
			role="status"
			aria-label="Loading customers"
			className="divide-y divide-slate-100"
		>
			{Array.from({ length: 6 }).map((_, idx) => (
				<div
					key={idx}
					className="flex animate-pulse items-center justify-between gap-4 px-4 py-3.5"
				>
					<div className="flex min-w-0 flex-1 items-center gap-3">
						<div className="h-8 w-8 shrink-0 rounded-full bg-slate-200/80" />
						<div className="space-y-1.5">
							<div className="h-3.5 w-36 rounded bg-slate-200/80" />
							<div className="h-2.5 w-24 rounded bg-slate-100" />
						</div>
					</div>
					<div className="hidden h-3 w-40 rounded bg-slate-100 sm:block" />
					<div className="hidden h-5 w-24 rounded-full bg-slate-100 md:block" />
					<div className="hidden h-5 w-10 rounded-full bg-slate-100 lg:block" />
					<div className="h-3 w-20 rounded bg-slate-100" />
				</div>
			))}
		</div>
	)
}

function CustomerDetailSkeleton() {
	return (
		<div
			role="status"
			aria-label="Loading customer profile"
			className="space-y-5"
		>
			<div className="animate-pulse rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
				<div className="flex items-center gap-4">
					<div className="h-12 w-12 rounded-2xl bg-slate-200/80" />
					<div className="space-y-2">
						<div className="h-5 w-48 rounded bg-slate-200/80" />
						<div className="h-3 w-32 rounded bg-slate-100" />
					</div>
				</div>
				<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="space-y-1.5">
							<div className="h-2.5 w-16 rounded bg-slate-100" />
							<div className="h-3.5 w-28 rounded bg-slate-200/70" />
						</div>
					))}
				</div>
			</div>
			<div className="animate-pulse space-y-3 rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
				<div className="h-4 w-36 rounded bg-slate-200/80" />
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="h-20 rounded-lg border border-slate-100 bg-slate-50/70"
					/>
				))}
			</div>
		</div>
	)
}

export default function CustomersClient({
	externalRefresh = 0,
	externalSearch = null,
	onExternalSearchConsumed,
	onBusyChange,
	onCustomerChange,
	onOpenLead,
}: {
	externalRefresh?: number
	externalSearch?: string | null
	onExternalSearchConsumed?: () => void
	onBusyChange?: (busy: boolean) => void
	onCustomerChange?: (customer: { key: string; name: string } | null) => void
	onOpenLead?: (leadId: string) => void
}) {
	const [searchInput, setSearchInput] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const [sourceFilter, setSourceFilter] = useState('all')
	const [sortBy, setSortBy] = useState<'recent' | 'interactions'>('recent')
	const [listPage, setListPage] = useState(1)
	const [detailPage, setDetailPage] = useState(1)
	const [key, setKey] = useState<string | null>(null)

	const [items, setItems] = useState<CustomerRecord[]>([])
	const [total, setTotal] = useState(0)
	const [customer, setCustomer] = useState<CustomerRecord | null>(null)
	const [events, setEvents] = useState<CustomerInteraction[]>([])

	const [initialLoading, setInitialLoading] = useState(true)
	const [fetching, setFetching] = useState(false)
	const [error, setError] = useState('')
	const [copiedField, setCopiedField] = useState<string | null>(null)

	const listCacheRef = useRef(new Map<string, ListCacheEntry>())
	const detailCacheRef = useRef(new Map<string, DetailCacheEntry>())
	const prevExternalRefreshRef = useRef(externalRefresh)
	const hydratedUrlRef = useRef(false)

	// Hydrate initial state from URL & support browser Back/Forward
	useEffect(() => {
		const restore = () => {
			const params = new URLSearchParams(location.search)
			const nextKey = params.get('customer')
			const nextSearch = params.get('csearch') || ''
			const nextSource = params.get('csource') || 'all'
			const nextSort =
				params.get('csort') === 'interactions' ? 'interactions' : 'recent'
			const parsedListPage = Number(params.get('cpage') || 1)
			const parsedDetailPage = Number(params.get('dpage') || 1)

			setKey(nextKey)
			setSearchInput(nextSearch)
			setDebouncedSearch(nextSearch.trim())
			setSourceFilter(nextSource)
			setSortBy(nextSort)
			setListPage(
				Number.isSafeInteger(parsedListPage) && parsedListPage >= 1
					? parsedListPage
					: 1,
			)
			setDetailPage(
				Number.isSafeInteger(parsedDetailPage) && parsedDetailPage >= 1
					? parsedDetailPage
					: 1,
			)
			hydratedUrlRef.current = true
		}

		restore()
		window.addEventListener('popstate', restore)
		return () => window.removeEventListener('popstate', restore)
	}, [])

	// Accept search trigger from Command Palette (⌘K)
	useEffect(() => {
		if (externalSearch === null) return
		setKey(null)
		setSearchInput(externalSearch)
		setDebouncedSearch(externalSearch.trim())
		setListPage(1)
		onExternalSearchConsumed?.()
	}, [externalSearch, onExternalSearchConsumed])

	// Debounce ONLY search text input; pagination/filters/navigation stay instant
	useEffect(() => {
		const trimmed = searchInput.trim()
		if (trimmed === debouncedSearch) return
		const timer = setTimeout(() => {
			setDebouncedSearch(trimmed)
			setListPage(1)
		}, 250)
		return () => clearTimeout(timer)
	}, [searchInput, debouncedSearch])

	// Sync list filter state cleanly to URL (without polluting browser history)
	useEffect(() => {
		if (!hydratedUrlRef.current || key) return
		const url = new URL(location.href)
		if (debouncedSearch) url.searchParams.set('csearch', debouncedSearch)
		else url.searchParams.delete('csearch')
		if (sourceFilter !== 'all') url.searchParams.set('csource', sourceFilter)
		else url.searchParams.delete('csource')
		if (sortBy !== 'recent') url.searchParams.set('csort', sortBy)
		else url.searchParams.delete('csort')
		if (listPage > 1) url.searchParams.set('cpage', String(listPage))
		else url.searchParams.delete('cpage')
		url.searchParams.delete('dpage')
		history.replaceState({}, '', url)
	}, [key, debouncedSearch, sourceFilter, sortBy, listPage])

	// Notify workspace shell about busy state and active customer breadcrumb
	useEffect(() => {
		onBusyChange?.(fetching)
	}, [fetching, onBusyChange])

	useEffect(() => {
		if (key && customer) {
			onCustomerChange?.({
				key: customer.customer_key,
				name: customer.name || customer.email || 'Customer',
			})
		} else if (!key) {
			onCustomerChange?.(null)
		}
	}, [key, customer, onCustomerChange])

	useEffect(() => {
		return () => {
			onBusyChange?.(false)
			onCustomerChange?.(null)
		}
	}, [onBusyChange, onCustomerChange])

	const copyValue = useCallback((value: string, fieldId: string) => {
		if (typeof navigator === 'undefined' || !navigator.clipboard) return
		void navigator.clipboard.writeText(value)
		setCopiedField(fieldId)
		setTimeout(() => {
			setCopiedField((curr) => (curr === fieldId ? null : curr))
		}, 1800)
	}, [])

	// Main data fetcher with stale-while-revalidate cache & zero layout flicker
	useEffect(() => {
		const isRefreshEvent = prevExternalRefreshRef.current !== externalRefresh
		if (isRefreshEvent) {
			prevExternalRefreshRef.current = externalRefresh
			listCacheRef.current.clear()
			detailCacheRef.current.clear()
		}

		const controller = new AbortController()
		setError('')

		if (key) {
			const cacheKey = `${key}|p=${detailPage}`
			const cached = detailCacheRef.current.get(cacheKey)
			if (cached) {
				setCustomer(cached.customer)
				setEvents(cached.events)
				setInitialLoading(false)
			} else {
				const switchingCustomer =
					customer !== null && customer.customer_key !== key
				if (switchingCustomer || customer === null) {
					setCustomer(null)
					setEvents([])
					setInitialLoading(true)
				}
			}
			setFetching(true)

			void (async () => {
				try {
					const params = new URLSearchParams({
						customer: key,
						page: String(detailPage),
					})
					const res = await fetch(`/api/admin/customer-directory?${params}`, {
						signal: controller.signal,
						cache: 'no-store',
					})
					const data = await res.json()
					if (!res.ok) {
						if (res.status === 401) {
							window.location.assign('/admin')
							return
						}
						throw new Error(data.error || 'Unable to load customer profile')
					}
					detailCacheRef.current.set(cacheKey, {
						customer: data.customer,
						events: data.items || [],
					})
					setCustomer(data.customer)
					setEvents(data.items || [])
				} catch (e) {
					if (!controller.signal.aborted) {
						setError(
							e instanceof Error
								? e.message
								: 'Unable to load customer profile',
						)
					}
				} finally {
					if (!controller.signal.aborted) {
						setInitialLoading(false)
						setFetching(false)
					}
				}
			})()
		} else {
			const cacheKey = `p=${listPage}|q=${debouncedSearch}|s=${sourceFilter}|o=${sortBy}`
			const cached = listCacheRef.current.get(cacheKey)
			if (cached) {
				setItems(cached.items)
				setTotal(cached.total)
				setInitialLoading(false)
			} else if (items.length === 0) {
				setInitialLoading(true)
			}
			setFetching(true)

			void (async () => {
				try {
					const params = new URLSearchParams({
						page: String(listPage),
						search: debouncedSearch,
						source: sourceFilter,
						sort: sortBy,
					})
					const res = await fetch(`/api/admin/customer-directory?${params}`, {
						signal: controller.signal,
						cache: 'no-store',
					})
					const data = await res.json()
					if (!res.ok) {
						if (res.status === 401) {
							window.location.assign('/admin')
							return
						}
						throw new Error(data.error || 'Unable to load customers')
					}
					const nextEntry = {
						items: data.items || [],
						total: data.total || 0,
					}
					listCacheRef.current.set(cacheKey, nextEntry)
					setItems(nextEntry.items)
					setTotal(nextEntry.total)
				} catch (e) {
					if (!controller.signal.aborted) {
						setError(
							e instanceof Error ? e.message : 'Unable to load customers',
						)
					}
				} finally {
					if (!controller.signal.aborted) {
						setInitialLoading(false)
						setFetching(false)
					}
				}
			})()
		}

		return () => controller.abort()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, listPage, detailPage, debouncedSearch, sourceFilter, sortBy, externalRefresh])

	function selectCustomer(nextKey: string | null) {
		setError('')
		if (nextKey) {
			setDetailPage(1)
			setKey(nextKey)
			const url = new URL(location.href)
			url.searchParams.set('customer', nextKey)
			url.searchParams.delete('dpage')
			history.pushState({}, '', url)
			window.scrollTo({ top: 0, behavior: 'smooth' })
		} else {
			setKey(null)
			setCustomer(null)
			setEvents([])
			const url = new URL(location.href)
			url.searchParams.delete('customer')
			url.searchParams.delete('dpage')
			history.pushState({}, '', url)
		}
	}

	const activePage = key ? detailPage : listPage
	const activeTotal = key ? customer?.interactions || 0 : total
	const totalPages = Math.max(1, Math.ceil(activeTotal / PAGE_SIZE))
	const hasActiveFilters = Boolean(searchInput.trim() || sourceFilter !== 'all')

	return (
		<motion.section
			key={key ? `customer-detail-${key}` : 'customer-directory-list'}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			className="space-y-5"
		>
			{key ? (
				/* =================================================================
				   CUSTOMER 360° PROFILE & INTERACTION TIMELINE
				================================================================= */
				<>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<button
							type="button"
							onClick={() => selectCustomer(null)}
							className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none"
						>
							<ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
							Back to All Customers
						</button>

						{fetching && (
							<span
								role="status"
								className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-2xs"
							>
								<Loader2 className="h-3 w-3 animate-spin text-slate-500" />
								Syncing profile…
							</span>
						)}
					</div>

					{error && (
						<div
							role="alert"
							className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 shadow-2xs"
						>
							{error}
						</div>
					)}

					{initialLoading && !customer ? (
						<CustomerDetailSkeleton />
					) : (
						customer && (
							<div
								className={`space-y-6 transition-opacity duration-200 ${
									fetching ? 'opacity-80' : 'opacity-100'
								}`}
							>
								{/* Profile Summary Header Card */}
								<article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
									<div className="border-b border-slate-100 bg-slate-50/40 p-5 sm:p-6">
										<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
											<div className="flex items-start gap-4">
												<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-base font-bold text-white shadow-xs">
													{getInitials(customer.name || customer.email)}
												</div>
												<div className="min-w-0">
													<div className="flex flex-wrap items-center gap-2">
														<h1 className="text-xl font-bold tracking-tight text-slate-900">
															{customer.name || 'Unnamed Customer'}
														</h1>
														<span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
															{customer.interactions}{' '}
															{customer.interactions === 1
																? 'interaction'
																: 'interactions'}
														</span>
														{(customer.order_count || 0) > 0 && (
															<span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
																{customer.order_count}{' '}
																{customer.order_count === 1 ? 'order' : 'orders'} · $
																{Number(customer.total_spent || 0).toFixed(2)}
															</span>
														)}
													</div>

													<div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
														{customer.company && (
															<span className="inline-flex items-center gap-1 font-medium text-slate-700">
																<Building2 className="h-3.5 w-3.5 text-slate-400" />
																{customer.company}
															</span>
														)}
														{customer.country && (
															<span className="inline-flex items-center gap-1">
																<Globe className="h-3.5 w-3.5 text-slate-400" />
																{customer.country}
															</span>
														)}
													</div>

													<div className="mt-2.5 flex flex-wrap gap-1.5">
														{parseSources(customer.sources).map((src) => {
															const meta = getSourceMeta(src)
															return (
																<span
																	key={src}
																	className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.className}`}
																>
																	{meta.label}
																</span>
															)
														})}
													</div>
												</div>
											</div>

											<div className="flex flex-wrap items-center gap-2">
												{customer.email && (
													<button
														type="button"
														onClick={() =>
															copyValue(customer.email!, 'detail-email')
														}
														className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none"
													>
														<Mail className="h-3.5 w-3.5 text-slate-400" />
														<span className="max-w-[200px] truncate">
															{customer.email}
														</span>
														{copiedField === 'detail-email' ? (
															<Check className="h-3.5 w-3.5 text-emerald-600" />
														) : (
															<Copy className="h-3 w-3 text-slate-400" />
														)}
													</button>
												)}
												{customer.phone && (
													<button
														type="button"
														onClick={() =>
															copyValue(customer.phone!, 'detail-phone')
														}
														className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none"
													>
														<Phone className="h-3.5 w-3.5 text-slate-400" />
														{customer.phone}
														{copiedField === 'detail-phone' ? (
															<Check className="h-3.5 w-3.5 text-emerald-600" />
														) : (
															<Copy className="h-3 w-3 text-slate-400" />
														)}
													</button>
												)}
											</div>
										</div>
									</div>

									<dl className="grid gap-4 p-5 text-xs sm:grid-cols-2 lg:grid-cols-4">
										<div>
											<dt className="font-medium text-slate-400">First Seen</dt>
											<dd className="mt-1 font-medium text-slate-800">
												{formatDate(customer.first_seen)}
											</dd>
										</div>
										<div>
											<dt className="font-medium text-slate-400">
												Last Activity
											</dt>
											<dd className="mt-1 font-medium text-slate-800">
												{formatDate(customer.last_seen)}
											</dd>
										</div>
										<div>
											<dt className="font-medium text-slate-400">
												Primary Email
											</dt>
											<dd className="mt-1 font-mono break-all text-slate-700">
												{customer.email || 'Not provided'}
											</dd>
										</div>
										<div>
											<dt className="font-medium text-slate-400">
												Identity Grouping
											</dt>
											<dd className="mt-1 text-slate-600">
												{customer.customer_key.startsWith('email:')
													? 'Merged by matching email'
													: 'Single anonymous record'}
											</dd>
										</div>
									</dl>

									<div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-[11px] text-slate-500">
										<Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
										<span>
											Contact fields reflect the latest non-empty submitted
											values. Review individual interactions below for original
											submission snapshots.
										</span>
									</div>
								</article>

								{/* Customer Interaction Timeline */}
								<section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
									<div className="flex items-center justify-between border-b border-slate-100 pb-3">
										<h2 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
											<Clock className="h-4 w-4 text-slate-400" />
											Customer Timeline
										</h2>
										<span className="text-xs text-slate-400">
											{customer.interactions} total
										</span>
									</div>

									{events.length ? (
										<ol className="relative mt-5 ml-2 space-y-5 border-l border-slate-200">
											{events.map((e) => {
												const meta = getSourceMeta(e.source)
												const statusKey = (e.status || '').toLowerCase()
												const statusClass =
													STATUS_BADGES[statusKey] ||
													'border-slate-200 bg-slate-100 text-slate-600'
												return (
													<li key={`${e.kind}-${e.id}`} className="ml-5">
														<span className="absolute -left-1.5 mt-2 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
														<div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition-colors hover:bg-slate-50/80">
															<div className="flex flex-wrap items-center justify-between gap-2">
																<div className="flex flex-wrap items-center gap-2">
																	<span
																		className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.className}`}
																	>
																		{meta.label}
																	</span>
																	{e.status && (
																		<span
																			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${statusClass}`}
																		>
																			{e.status.replaceAll('_', ' ')}
																		</span>
																	)}
																</div>
																<time
																	title={formatDate(e.created_at)}
																	className="text-xs text-slate-500"
																>
																	{formatDate(e.created_at)}
																</time>
															</div>

															<p className="mt-2 text-xs text-slate-500">
																<span className="font-medium text-slate-700">
																	{e.name || 'Visitor'}
																</span>
																{' · '}
																{e.email || e.phone || 'No contact info'}
																{e.company ? ` · ${e.company}` : ''}
															</p>

															<div className="mt-3 rounded-lg border border-slate-200/60 bg-white p-3 text-xs leading-relaxed break-words whitespace-pre-wrap text-slate-800">
																{e.content || 'No written message provided.'}
															</div>

															{e.kind === 'lead' && (
																<div className="mt-3">
																	{onOpenLead ? (
																		<button
																			type="button"
																			onClick={() => onOpenLead(e.id)}
																			className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none"
																		>
																			<MessageSquare className="h-3.5 w-3.5 text-slate-500" />
																			Open inquiry & website activity
																			<ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
																		</button>
																	) : (
																		<a
																			className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 underline underline-offset-4 hover:text-slate-950"
																			href={`/admin?view=leads&lead=${encodeURIComponent(e.id)}`}
																		>
																			Open inquiry & website activity
																			<ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
																		</a>
																	)}
																</div>
															)}
														</div>
													</li>
												)
											})}
										</ol>
									) : (
										<div className="py-10 text-center text-xs text-slate-400">
											No interactions recorded on this page.
										</div>
									)}
								</section>
							</div>
						)
					)}
				</>
			) : (
				/* =================================================================
				   CUSTOMERS DIRECTORY LIST VIEW
				================================================================= */
				<>
					{/* Header */}
					<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
						<div>
							<h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
								<Users className="h-6 w-6 text-slate-900" />
								Customers Directory
							</h1>
							<p className="mt-1 text-xs text-slate-500">
								Unified contacts across inquiries, wholesale RFQs, newsletters,
								popups, blog comments, and product reviews.
							</p>
						</div>

						<div className="flex items-center gap-2">
							{fetching && !initialLoading && (
								<span
									role="status"
									className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-2xs"
								>
									<Loader2 className="h-3 w-3 animate-spin text-slate-500" />
									Updating…
								</span>
							)}
							<span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs">
								{total} {total === 1 ? 'customer' : 'customers'}
							</span>
						</div>
					</div>

					{/* Identity & Access Notice */}
					<div className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-[11px] text-slate-500">
						<Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
						<span>
							Grouped by matching email (not verified identity). Records without
							an email stay separate, and only interactions within your role
							scope are shown.
						</span>
					</div>

					{/* Search, Sort & Source Filter Toolbar */}
					<div className="space-y-3">
						<div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
							<label className="relative max-w-md flex-1">
								<span className="sr-only">Search customers</span>
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
									<Search className="h-4 w-4" />
								</div>
								<input
									className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs text-slate-900 shadow-2xs transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none"
									placeholder="Search name, email, phone, or company..."
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
								/>
								{searchInput && (
									<button
										type="button"
										aria-label="Clear search"
										onClick={() => {
											setSearchInput('')
											setDebouncedSearch('')
											setListPage(1)
										}}
										className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-2.5 text-slate-400 hover:text-slate-600"
									>
										<X className="h-3.5 w-3.5" />
									</button>
								)}
							</label>

							<div className="flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-2xs sm:self-auto">
								<SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
								<label className="sr-only" htmlFor="customer-sort">
									Sort customers
								</label>
								<select
									id="customer-sort"
									value={sortBy}
									onChange={(e) => {
										setSortBy(
											e.target.value === 'interactions'
												? 'interactions'
												: 'recent',
										)
										setListPage(1)
									}}
									className="cursor-pointer bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
								>
									<option value="recent">Sort: Last Activity</option>
									<option value="interactions">Sort: Most Interactions</option>
								</select>
							</div>
						</div>

						{/* Source Filter Pills */}
						<div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs">
							{SOURCE_OPTIONS.map((opt) => {
								const active = sourceFilter === opt.value
								return (
									<button
										key={opt.value}
										type="button"
										onClick={() => {
											setSourceFilter(opt.value)
											setListPage(1)
										}}
										className={`relative cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none ${
											active
												? 'text-white'
												: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
										}`}
									>
										{active && (
											<motion.div
												layoutId="customerSourcePill"
												className="absolute inset-0 rounded-lg bg-slate-900 shadow-2xs"
												transition={{
													type: 'spring',
													stiffness: 450,
													damping: 35,
												}}
											/>
										)}
										<span className="relative z-10">{opt.label}</span>
									</button>
								)
							})}
						</div>
					</div>

					{error && (
						<div
							role="alert"
							className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 shadow-2xs"
						>
							{error}
						</div>
					)}

					{/* Directory Table (Desktop) & Cards (Mobile) */}
					<div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
						{initialLoading && items.length === 0 ? (
							<CustomerTableSkeleton />
						) : items.length === 0 ? (
							<div className="py-14 text-center">
								<Inbox className="mx-auto mb-2.5 h-8 w-8 text-slate-300" />
								<p className="text-xs font-semibold text-slate-700">
									No matching customers found
								</p>
								<p className="mt-1 text-[11px] text-slate-400">
									Try adjusting search terms or clearing the selected source
									filter.
								</p>
								{hasActiveFilters && (
									<button
										type="button"
										onClick={() => {
											setSearchInput('')
											setDebouncedSearch('')
											setSourceFilter('all')
											setListPage(1)
										}}
										className="mt-3 inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
									>
										Clear filters
									</button>
								)}
							</div>
						) : (
							<div
								className={`transition-opacity duration-200 ${
									fetching ? 'opacity-65' : 'opacity-100'
								}`}
							>
								{/* Desktop Table */}
								<div className="hidden overflow-x-auto md:block">
									<table className="w-full text-left text-xs">
										<thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold tracking-wider text-slate-500 uppercase">
											<tr>
												<th className="px-4 py-3">Customer</th>
												<th className="px-4 py-3">Contact</th>
												<th className="px-4 py-3">Sources</th>
												<th className="px-4 py-3">Interactions</th>
												<th className="px-4 py-3">Orders / Spend</th>
												<th className="px-4 py-3 text-right">Last Activity</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100">
											{items.map((c) => {
												const contactValue = c.email || c.phone || ''
												const sources = parseSources(c.sources)
												return (
													<tr
														key={c.customer_key}
														tabIndex={0}
														role="button"
														onClick={() => selectCustomer(c.customer_key)}
														onKeyDown={(e) => {
															if (e.key === 'Enter' || e.key === ' ') {
																e.preventDefault()
																selectCustomer(c.customer_key)
															}
														}}
														className="group cursor-pointer transition-colors hover:bg-slate-50/80 focus-visible:bg-slate-50 focus-visible:outline-none"
													>
														<td className="px-4 py-3.5">
															<div className="flex items-center gap-3">
																<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-slate-100 text-xs font-semibold text-slate-700">
																	{getInitials(c.name || c.email)}
																</div>
																<div className="min-w-0">
																	<p className="max-w-[200px] truncate font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
																		{c.name || 'Unnamed Customer'}
																	</p>
																	<p className="max-w-[200px] truncate text-[11px] text-slate-400">
																		{c.company || c.country || 'Individual'}
																	</p>
																</div>
															</div>
														</td>

														<td className="px-4 py-3.5">
															{contactValue ? (
																<div className="flex items-center gap-1.5">
																	<span className="max-w-[220px] truncate font-medium text-slate-700">
																		{contactValue}
																	</span>
																	<button
																		type="button"
																		title={`Copy ${contactValue}`}
																		aria-label={`Copy ${contactValue}`}
																		onClick={(e) => {
																			e.stopPropagation()
																			copyValue(
																				contactValue,
																				`row-${c.customer_key}`,
																			)
																		}}
																		className="cursor-pointer rounded p-1 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-200/60 hover:text-slate-700 focus-visible:opacity-100"
																	>
																		{copiedField === `row-${c.customer_key}` ? (
																			<Check className="h-3 w-3 text-emerald-600" />
																		) : (
																			<Copy className="h-3 w-3" />
																		)}
																	</button>
																</div>
															) : (
																<span className="text-slate-400">
																	Not provided
																</span>
															)}
															{c.email && c.phone && (
																<p className="mt-0.5 text-[11px] text-slate-400">
																	{c.phone}
																</p>
															)}
														</td>

														<td className="px-4 py-3.5">
															<div className="flex flex-wrap gap-1">
																{sources.slice(0, 3).map((src) => {
																	const meta = getSourceMeta(src)
																	return (
																		<span
																			key={src}
																			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.className}`}
																		>
																			{meta.label}
																		</span>
																	)
																})}
																{sources.length > 3 && (
																	<span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
																		+{sources.length - 3}
																	</span>
																)}
															</div>
														</td>

														<td className="px-4 py-3.5">
															<span className="inline-flex min-w-[28px] items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
																{c.interactions}
															</span>
														</td>

														<td className="px-4 py-3.5">
															{(c.order_count || 0) > 0 ? (
																<div>
																	<span className="font-semibold text-teal-700">
																		${Number(c.total_spent || 0).toFixed(2)}
																	</span>
																	<span className="ml-1.5 text-[11px] text-slate-500">
																		({c.order_count})
																	</span>
																</div>
															) : (
																<span className="text-[11px] text-slate-400">
																	—
																</span>
															)}
														</td>

														<td className="px-4 py-3.5 text-right">
															<div className="inline-flex items-center gap-2">
																<div className="text-right">
																	<p className="font-medium text-slate-800">
																		{formatShortDate(c.last_seen)}
																	</p>
																	<p className="text-[11px] text-slate-400">
																		{formatDate(c.last_seen)}
																	</p>
																</div>
																<ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
															</div>
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>

								{/* Mobile Card Layout */}
								<div className="divide-y divide-slate-100 md:hidden">
									{items.map((c) => {
										const sources = parseSources(c.sources)
										return (
											<button
												key={c.customer_key}
												type="button"
												onClick={() => selectCustomer(c.customer_key)}
												className="flex w-full cursor-pointer items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-slate-50/80"
											>
												<div className="flex min-w-0 items-start gap-3">
													<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-slate-100 text-xs font-semibold text-slate-700">
														{getInitials(c.name || c.email)}
													</div>
													<div className="min-w-0">
														<p className="truncate text-sm font-semibold text-slate-900">
															{c.name || 'Unnamed Customer'}
														</p>
														<p className="mt-0.5 truncate text-xs text-slate-500">
															{c.email || c.phone || c.company || 'No contact'}
														</p>
														<div className="mt-2 flex flex-wrap gap-1">
															{sources.slice(0, 3).map((src) => {
																const meta = getSourceMeta(src)
																return (
																	<span
																		key={src}
																		className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.className}`}
																	>
																		{meta.label}
																	</span>
																)
															})}
														</div>
													</div>
												</div>
												<div className="shrink-0 text-right">
													<span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
														{c.interactions}
													</span>
													<p className="mt-1.5 text-[11px] text-slate-400">
														{formatShortDate(c.last_seen)}
													</p>
												</div>
											</button>
										)
									})}
								</div>
							</div>
						)}
					</div>
				</>
			)}

			{/* Shared Pagination Footer */}
			<AnimatePresence initial={false}>
				{(!key || customer) && (
					<div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs sm:flex-row">
						<p className="text-xs text-slate-500">
							Showing{' '}
							<span className="font-semibold text-slate-700">
								{activeTotal === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1}
							</span>{' '}
							to{' '}
							<span className="font-semibold text-slate-700">
								{Math.min(activePage * PAGE_SIZE, activeTotal)}
							</span>{' '}
							of{' '}
							<span className="font-semibold text-slate-700">
								{activeTotal}
							</span>{' '}
							{key ? 'interactions' : 'customers'}
						</p>

						<div className="flex items-center gap-2">
							<button
								type="button"
								className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
								disabled={fetching || activePage === 1}
								onClick={() =>
									key
										? setDetailPage((n) => Math.max(1, n - 1))
										: setListPage((n) => Math.max(1, n - 1))
								}
							>
								<ChevronLeft className="h-3.5 w-3.5" />
								Previous
							</button>
							<span className="px-1 font-mono text-xs text-slate-500">
								Page {activePage} / {totalPages}
							</span>
							<button
								type="button"
								className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
								disabled={fetching || activePage * PAGE_SIZE >= activeTotal}
								onClick={() =>
									key
										? setDetailPage((n) => n + 1)
										: setListPage((n) => n + 1)
								}
							>
								Next
								<ChevronRight className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				)}
			</AnimatePresence>
		</motion.section>
	)
}
