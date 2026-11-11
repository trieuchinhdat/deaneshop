'use client'

import { useEffect, useMemo, useState } from 'react'
import {
	FiAlertCircle,
	FiArrowRight,
	FiBriefcase,
	FiCheck,
	FiCheckCircle,
	FiChevronLeft,
	FiChevronRight,
	FiClock,
	FiColumns,
	FiDollarSign,
	FiDownload,
	FiExternalLink,
	FiEye,
	FiFilter,
	FiGrid,
	FiMail,
	FiMapPin,
	FiMessageCircle,
	FiMove,
	FiPhone,
	FiRefreshCw,
	FiSearch,
	FiSend,
	FiShield,
	FiSliders,
	FiTag,
	FiTrendingUp,
	FiUpload,
	FiUser,
	FiUserCheck,
	FiUsers,
	FiZap,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { cn } from '@/lib/utils'
import { serializeCsv } from '@/lib/csv'
import { D1AdminUser, D1Lead } from '@/lib/d1'
import LeadDetailDrawer from './lead-detail-drawer'
import { LeadStage, PIPELINE_STAGES } from './types'

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

export function getLeadSLA(lead: D1Lead) {
	if (lead.status && lead.status !== 'new') return null
	const created = new Date(lead.created_at).getTime()
	const elapsedMins = Math.floor((Date.now() - created) / 60000)
	if (isNaN(elapsedMins) || elapsedMins < 0) return null

	if (elapsedMins < 15) {
		return {
			level: 'active',
			label: `SLA <15m (${Math.max(1, 15 - elapsedMins)}m left)`,
			color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		}
	}
	if (elapsedMins < 60) {
		return {
			level: 'due',
			label: `SLA Due (${elapsedMins}m ago)`,
			color: 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse',
		}
	}
	const hours = Math.floor(elapsedMins / 60)
	return {
		level: 'breached',
		label: `SLA Overdue (${hours}h ago)`,
		color: 'bg-rose-50 text-rose-700 border-rose-300 font-black animate-pulse',
	}
}

export function getLeadTier(lead: D1Lead) {
	const score = Number(lead.ai_score) || 0
	if (score >= 80 || (lead.is_corporate_email && lead.company_name)) {
		return {
			tier: 1,
			label: 'Tier 1 • Hot OEM',
			shortLabel: 'T1 OEM',
			badge: 'bg-rose-50 text-rose-700 border-rose-200 font-black',
		}
	}
	if (score >= 55) {
		return {
			tier: 2,
			label: 'Tier 2 • Wholesale',
			shortLabel: 'T2 B2B',
			badge: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
		}
	}
	return {
		tier: 3,
		label: 'Tier 3 • Samples',
		shortLabel: 'T3 Sample',
		badge: 'bg-slate-100 text-slate-600 border-slate-200',
	}
}

interface LeadOperationsProps {
	initialLeads: D1Lead[]
	staffList: D1AdminUser[]
	currentStaff?: any
	onLeadCountChange?: (count: number) => void
	brandName?: string
	totalServerLeads?: number
}

export default function LeadOperations({
	initialLeads = [],
	staffList = [],
	currentStaff,
	onLeadCountChange,
	brandName,
	totalServerLeads,
}: LeadOperationsProps) {
	const [leads, setLeads] = useState<D1Lead[]>(initialLeads)
	const [serverTotal, setServerTotal] = useState<number>(totalServerLeads ?? initialLeads.length)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [leadNotice, setLeadNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

	useEffect(() => {
		setLeads((prev) => {
			if (prev.length <= initialLeads.length) return initialLeads
			const map = new Map<string, D1Lead>()
			for (const l of initialLeads) map.set(l.id, l)
			for (const l of prev) if (!map.has(l.id)) map.set(l.id, l)
			return Array.from(map.values())
		})
	}, [initialLeads])

	useEffect(() => {
		setServerTotal(Math.max(totalServerLeads ?? 0, leads.length))
	}, [totalServerLeads, leads.length])

	const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
	const [selectedLead, setSelectedLead] = useState<D1Lead | null>(null)
	const [isDrawerOpen, setIsDrawerOpen] = useState(false)

	// Filters
	const isSales = currentStaff?.role === 'sales'
	const initialAssigned = isSales && currentStaff?.id ? currentStaff.id : 'all'

	const [searchQuery, setSearchQuery] = useState('')
	const [stageFilter, setStageFilter] = useState<string>('all')
	const [tierFilter, setTierFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all')
	const [corporateEmailOnly, setCorporateEmailOnly] = useState(false)
	const [assignedFilter, setAssignedFilter] = useState<string>(initialAssigned)

	// Bulk selections for Power Table
	const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())

	// Drag-and-drop state for Kanban Board
	const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
	const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

	// Filtered leads
	const filteredLeads = useMemo(() => {
		return leads.filter((lead) => {
			// Search
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim()
				const matchName = (lead.name || '').toLowerCase().includes(q)
				const matchEmail = (lead.email || '').toLowerCase().includes(q)
				const matchPhone = (lead.phone || '').includes(q)
				const matchCompany = (lead.company_name || '').toLowerCase().includes(q)
				if (!matchName && !matchEmail && !matchPhone && !matchCompany) return false
			}

			// Stage
			if (stageFilter !== 'all') {
				const leadStg = (lead.status || 'new').toLowerCase()
				if (leadStg !== stageFilter) return false
			}

			// Business Tiering (Tier 1 Hot OEM / Tier 2 Wholesale / Tier 3 Sample)
			if (tierFilter !== 'all') {
				const tierInfo = getLeadTier(lead)
				if (tierFilter === 'hot' && tierInfo.tier !== 1) return false
				if (tierFilter === 'warm' && tierInfo.tier !== 2) return false
				if (tierFilter === 'cold' && tierInfo.tier !== 3) return false
			}

			// Corporate Email Only
			if (corporateEmailOnly && lead.is_corporate_email !== 1) {
				return false
			}

			// Assigned Sales Rep
			if (assignedFilter !== 'all') {
				if (assignedFilter === 'unassigned' && lead.assigned_to) return false
				if (assignedFilter !== 'unassigned' && lead.assigned_to !== assignedFilter) return false
			}

			return true
		})
	}, [leads, searchQuery, stageFilter, tierFilter, corporateEmailOnly, assignedFilter])

	// Power Table Pagination State
	const [tablePage, setTablePage] = useState<number>(1)
	const [pageSize, setPageSize] = useState<number>(25)

	// Reset page when filters change
	useEffect(() => {
		setTablePage(1)
	}, [searchQuery, stageFilter, tierFilter, corporateEmailOnly, assignedFilter])

	const totalTablePages = Math.ceil(filteredLeads.length / pageSize) || 1

	useEffect(() => {
		if (tablePage > totalTablePages) {
			setTablePage(Math.max(1, totalTablePages))
		}
	}, [tablePage, totalTablePages])

	const paginatedLeads = useMemo(() => {
		const start = (tablePage - 1) * pageSize
		return filteredLeads.slice(start, start + pageSize)
	}, [filteredLeads, tablePage, pageSize])

	// KPI Metrics calculations & Tier distribution
	const metrics = useMemo(() => {
		const total = leads.length
		const tier1Count = leads.filter((l) => getLeadTier(l).tier === 1).length
		const tier2Count = leads.filter((l) => getLeadTier(l).tier === 2).length
		const tier3Count = leads.filter((l) => getLeadTier(l).tier === 3).length
		const wonCount = leads.filter((l) => (l.status || '').toLowerCase() === 'won').length
		const newCount = leads.filter((l) => (l.status || '').toLowerCase() === 'new').length
		const wonRate = total > 0 ? Math.round((wonCount / total) * 100) : 0

		return {
			total,
			hotCount: tier1Count,
			tier1Count,
			tier2Count,
			tier3Count,
			wonCount,
			newCount,
			wonRate,
		}
	}, [leads])

	// Handle lead update (from Drawer or Card quick drag)
	const handleLeadUpdated = (updated: D1Lead) => {
		setLeads((prev) =>
			prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
		)
		if (selectedLead?.id === updated.id) {
			setSelectedLead(updated)
		}
	}

	// Handle Kanban card drag-and-drop between pipeline stages
	const handleDropLead = async (targetStageId: string) => {
		if (!draggedLeadId) return
		const currentLead = leads.find((l) => l.id === draggedLeadId)
		if (!currentLead) {
			setDraggedLeadId(null)
			setDragOverStageId(null)
			return
		}

		const currentStatus = (currentLead.status || 'new').toLowerCase()
		if (currentStatus === targetStageId.toLowerCase()) {
			setDraggedLeadId(null)
			setDragOverStageId(null)
			return
		}

		const previousStatus = currentLead.status
		const updatedLead: D1Lead = {
			...currentLead,
			status: targetStageId as any,
			updated_at: new Date().toISOString(),
		}

		// Optimistic UI update
		handleLeadUpdated(updatedLead)
		setDraggedLeadId(null)
		setDragOverStageId(null)

		try {
			const res = await fetch('/api/admin/leads/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leadId: currentLead.id,
					status: targetStageId,
					expectedVersion: currentLead.version ?? 1,
					author: currentStaff?.name || currentStaff?.full_name || 'Sales Rep (Kanban)',
				}),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data.success) {
				handleLeadUpdated({ ...currentLead, status: previousStatus })
				setLeadNotice({
					type: 'error',
					message:
						res.status === 409
							? data?.error || 'Lead was modified by another teammate. Reloaded previous state.'
							: data?.error || 'Failed to update lead stage',
				})
			} else if (data.lead) {
				handleLeadUpdated(data.lead)
			}
		} catch (err) {
			console.error('Network error updating lead stage:', err)
			handleLeadUpdated({ ...currentLead, status: previousStatus })
			setLeadNotice({ type: 'error', message: 'Network error updating lead stage. Changes reverted.' })
		}
	}

	const loadMoreServerLeads = async () => {
		if (isLoadingMore) return
		setIsLoadingMore(true)
		try {
			const nextPage = Math.floor(leads.length / 100) + 1
			const params = new URLSearchParams({
				resource: 'leads',
				page: String(nextPage),
				pageSize: '100',
			})
			if (stageFilter !== 'all') params.set('status', stageFilter)
			if (searchQuery.trim()) params.set('search', searchQuery.trim())
			const res = await fetch(`/api/admin/data?${params.toString()}`)
			const data = await res.json().catch(() => ({}))
			if (res.ok && data?.success && Array.isArray(data.items)) {
				setLeads((prev) => {
					const map = new Map(prev.map((l) => [l.id, l]))
					for (const item of data.items as D1Lead[]) {
						map.set(item.id, item)
					}
					return Array.from(map.values())
				})
				if (typeof data.total === 'number') {
					setServerTotal(data.total)
				}
			}
		} catch (err) {
			console.error('Failed to load more leads:', err)
		} finally {
			setIsLoadingMore(false)
		}
	}

	// Bulk Export to CSV (RFC-4180 + formula-safe + server-backed full dataset when exporting unfiltered/filtered list)
	const handleExportCSV = async () => {
		const buildLocalCsv = (targetLeads: D1Lead[]) =>
			serializeCsv(
				[
					'ID',
					'Customer Name',
					'Company',
					'Email',
					'Phone',
					'Status',
					'AI Score',
					'Budget',
					'Country',
					'Assigned Rep',
					'Created At',
				],
				targetLeads.map((l) => [
					l.id,
					l.name || '',
					l.company_name || '',
					l.email || '',
					{ value: l.phone || '', preserveLeadingZero: true },
					l.status || 'new',
					Number(l.ai_score) || 0,
					l.budget_range || '',
					l.ip_country || l.country || '',
					staffList.find((s) => s.id === l.assigned_to)?.full_name || l.assigned_to || '',
					l.created_at ? new Date(l.created_at) : '',
				]),
			)

		const triggerDownload = (csvContent: string) => {
			const clean = csvContent.replace(/^\uFEFF/, '')
			const blob = new Blob(['\uFEFF' + clean], { type: 'text/csv;charset=utf-8;' })
			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.setAttribute('href', url)
			link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`)
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			URL.revokeObjectURL(url)
		}

		if (selectedLeadIds.size > 0) {
			const selected = leads.filter((l) => selectedLeadIds.has(l.id))
			if (selected.length === 0) return
			triggerDownload(buildLocalCsv(selected))
			return
		}

		try {
			const params = new URLSearchParams({ resource: 'leads', format: 'csv' })
			if (stageFilter !== 'all') params.set('status', stageFilter)
			if (searchQuery.trim()) params.set('search', searchQuery.trim())
			const res = await fetch(`/api/admin/data?${params.toString()}`)
			if (res.ok) {
				triggerDownload(await res.text())
				return
			}
		} catch {}

		if (filteredLeads.length === 0) return
		triggerDownload(buildLocalCsv(filteredLeads))
	}

	return (
		<div className="space-y-6">
			{leadNotice && (
				<div
					role="status"
					className={cn(
						'flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-bold',
						leadNotice.type === 'error'
							? 'border-rose-200 bg-rose-50 text-rose-800'
							: 'border-emerald-200 bg-emerald-50 text-emerald-800',
					)}
				>
					<span>{leadNotice.message}</span>
					<button
						type="button"
						onClick={() => setLeadNotice(null)}
						className="ml-3 text-[11px] font-black opacity-70 hover:opacity-100 cursor-pointer"
					>
						Dismiss
					</button>
				</div>
			)}
			{/* Top Executive KPI Metrics Bar */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
							Pipeline Volume
						</span>
						<FiUsers className="h-4 w-4 text-slate-400" />
					</div>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="font-mono text-2xl font-black text-slate-900">{metrics.total}</span>
						<span className="text-[11px] text-slate-500 font-bold">accounts</span>
					</div>
				</div>

				<div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1">
							<FiZap className="h-3.5 w-3.5" />
							Hot Leads (Score &ge; 80)
						</span>
						<FiZap className="h-4 w-4 text-rose-600" />
					</div>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="font-mono text-2xl font-black text-rose-700">{metrics.hotCount}</span>
						<span className="text-[11px] text-rose-600 font-bold">High priority</span>
					</div>
				</div>

				<div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
							<FiClock className="h-3.5 w-3.5" />
							Awaiting Outreach
						</span>
						<FiClock className="h-4 w-4 text-blue-600" />
					</div>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="font-mono text-2xl font-black text-blue-800">{metrics.newCount}</span>
						<span className="text-[11px] text-blue-600 font-bold">Target SLA &lt; 5m</span>
					</div>
				</div>

				<div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
							<FiTrendingUp className="h-3.5 w-3.5" />
							Won Conversion Rate
						</span>
						<FiTrendingUp className="h-4 w-4 text-emerald-600" />
					</div>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="font-mono text-2xl font-black text-emerald-700">{metrics.wonRate}%</span>
						<span className="text-[11px] text-emerald-600 font-bold">{metrics.wonCount} closed deals</span>
					</div>
				</div>
			</div>

			{/* Filter Toolbar & View Switcher */}
			<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
				<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
					{/* Search */}
					<div className="relative flex-1 max-w-md">
						<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
							<FiSearch className="h-4 w-4" />
						</div>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by name, company, email, phone..."
							className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-base sm:text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden"
						/>
					</div>

					{/* View Switcher & Action Buttons */}
					<div className="flex items-center gap-2 flex-wrap">
						{/* Dual View Toggle */}
						<div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
							<button
								type="button"
								onClick={() => setViewMode('kanban')}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
									viewMode === 'kanban'
										? 'bg-white text-slate-900 shadow-xs font-black'
										: 'text-slate-500 hover:text-slate-900'
								}`}
							>
								<FiColumns className="h-3.5 w-3.5" />
								Kanban Pipeline
							</button>

							<button
								type="button"
								onClick={() => setViewMode('table')}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
									viewMode === 'table'
										? 'bg-white text-slate-900 shadow-xs font-black'
										: 'text-slate-500 hover:text-slate-900'
								}`}
							>
								<FiGrid className="h-3.5 w-3.5" />
								Power Table
							</button>
						</div>
					</div>
				</div>

				{/* Fast Tier Switcher Strip for Sales Execution */}
				<div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs scrollbar-none">
					<button
						type="button"
						onClick={() => setTierFilter('all')}
						className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
							tierFilter === 'all'
								? 'bg-slate-900 text-white shadow-2xs'
								: 'bg-slate-100 text-slate-600 hover:text-slate-900'
						}`}
					>
						<span>All Leads</span>
						<span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-mono">
							{metrics.total}
						</span>
					</button>

					<button
						type="button"
						onClick={() => setTierFilter('hot')}
						className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 border ${
							tierFilter === 'hot'
								? 'bg-rose-50 text-rose-800 border-rose-300 font-black shadow-2xs ring-1 ring-rose-300'
								: 'bg-white border-slate-200 text-rose-700 hover:bg-rose-50'
						}`}
					>
						<FiZap className="h-3.5 w-3.5 text-rose-600 shrink-0" />
						<span>Tier 1: Hot OEM / Enterprise</span>
						<span className="rounded-full bg-rose-200/80 px-1.5 py-0.2 text-[10px] font-mono font-black text-rose-900">
							{metrics.tier1Count}
						</span>
					</button>

					<button
						type="button"
						onClick={() => setTierFilter('warm')}
						className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 border ${
							tierFilter === 'warm'
								? 'bg-amber-50 text-amber-800 border-amber-300 font-black shadow-2xs ring-1 ring-amber-300'
								: 'bg-white border-slate-200 text-amber-700 hover:bg-amber-50'
						}`}
					>
						<FiBriefcase className="h-3.5 w-3.5 text-amber-600 shrink-0" />
						<span>Tier 2: Wholesale & Distributor</span>
						<span className="rounded-full bg-amber-200/80 px-1.5 py-0.2 text-[10px] font-mono font-black text-amber-900">
							{metrics.tier2Count}
						</span>
					</button>

					<button
						type="button"
						onClick={() => setTierFilter('cold')}
						className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 border ${
							tierFilter === 'cold'
								? 'bg-slate-200 text-slate-900 border-slate-300 font-black shadow-2xs'
								: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
						}`}
					>
						<span>Tier 3: Standard & Samples</span>
						<span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-mono">
							{metrics.tier3Count}
						</span>
					</button>
				</div>

				{/* Multi-layer Filters row */}
				<div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
					<span className="text-[11px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
						<FiFilter className="h-3 w-3" /> Filters:
					</span>

					{/* AI Tier Filter */}
					<select
						value={tierFilter}
						onChange={(e) => setTierFilter(e.target.value as any)}
						className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs cursor-pointer focus:outline-hidden"
					>
						<option value="all">All AI Scores</option>
						<option value="hot">Hot Leads (&ge; 80 pts)</option>
						<option value="warm">Warm Leads (55-79 pts)</option>
						<option value="cold">Cold Leads (&lt; 55 pts)</option>
					</select>

					{/* Corporate Email Toggle */}
					<button
						type="button"
						onClick={() => setCorporateEmailOnly(!corporateEmailOnly)}
						className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
							corporateEmailOnly
								? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-black'
								: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
						}`}
					>
						<FiBriefcase className="h-3 w-3" />
						Work Email Only
					</button>

					{/* Sales Rep Filter */}
					<select
						value={assignedFilter}
						onChange={(e) => setAssignedFilter(e.target.value)}
						className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs cursor-pointer focus:outline-hidden"
					>
						{isSales && currentStaff?.id && (
							<option value={currentStaff.id}>
								My Assigned Leads ({currentStaff.name || 'You'})
							</option>
						)}
						<option value="all">All Account Executives</option>
						<option value="unassigned">Unassigned Leads Pool</option>
						{staffList
							.filter((stf) => !isSales || stf.id !== currentStaff?.id)
							.map((stf) => (
								<option key={stf.id} value={stf.id}>
									{stf.full_name} ({stf.role})
								</option>
							))}
					</select>

					{(searchQuery || stageFilter !== 'all' || tierFilter !== 'all' || corporateEmailOnly || assignedFilter !== 'all') && (
						<button
							type="button"
							onClick={() => {
								setSearchQuery('')
								setStageFilter('all')
								setTierFilter('all')
								setCorporateEmailOnly(false)
								setAssignedFilter('all')
							}}
							className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ml-auto"
						>
							Reset Filters
						</button>
					)}
				</div>
			</div>

			{/* ================= VIEW 1: KANBAN PIPELINE ================= */}
			{viewMode === 'kanban' && (
				<div className="overflow-x-auto pb-4 scrollbar-thin">
					<div className="flex gap-4 min-w-max pb-2">
						{PIPELINE_STAGES.map((stage) => {
							const stageLeads = filteredLeads.filter(
								(l) => (l.status || 'new').toLowerCase() === stage.id,
							)
							const KANBAN_CARD_LIMIT = 25
							const visibleStageLeads = stageLeads.slice(0, KANBAN_CARD_LIMIT)

							return (
								<div
									key={stage.id}
									onDragOver={(e) => {
										e.preventDefault()
										e.dataTransfer.dropEffect = 'move'
										if (dragOverStageId !== stage.id) {
											setDragOverStageId(stage.id)
										}
									}}
									onDragLeave={(e) => {
										if (e.currentTarget.contains(e.relatedTarget as Node)) return
										if (dragOverStageId === stage.id) {
											setDragOverStageId(null)
										}
									}}
									onDrop={(e) => {
										e.preventDefault()
										handleDropLead(stage.id)
									}}
									className={cn(
										'flex flex-col rounded-3xl border p-3.5 h-[calc(100vh-270px)] min-h-[580px] max-h-[820px] min-w-[285px] w-[285px] shrink-0 transition-all duration-150',
										dragOverStageId === stage.id
											? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
											: 'border-slate-200 bg-slate-50/70',
									)}
								>
									{/* Column Header */}
									<div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-200/80 px-1">
										<div className="flex items-center gap-2 min-w-0">
											<span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.id === 'won' ? 'bg-emerald-500' : stage.id === 'new' ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
											<h3 className="text-xs font-black text-slate-800 tracking-tight truncate" title={stage.label}>
												{stage.label}
											</h3>
										</div>
										<span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white border border-slate-200 text-slate-700 shadow-2xs shrink-0">
											{stageLeads.length}
										</span>
									</div>

									{/* Cards List */}
									<div className="flex-1 space-y-2.5 overflow-y-auto pr-1 scrollbar-thin">
										{visibleStageLeads.map((lead) => {
											const tierInfo = getLeadTier(lead)
											const sla = getLeadSLA(lead)
											const isCorporate = lead.is_corporate_email === 1
											const assignedStaff = staffList.find((s) => s.id === lead.assigned_to)

											return (
												<div
													key={lead.id}
													draggable={true}
													onDragStart={(e) => {
														e.stopPropagation()
														setDraggedLeadId(lead.id)
														e.dataTransfer.setData('text/plain', lead.id)
														e.dataTransfer.effectAllowed = 'move'
													}}
													onDragEnd={() => {
														setDraggedLeadId(null)
														setDragOverStageId(null)
													}}
													onClick={() => {
														setSelectedLead(lead)
														setIsDrawerOpen(true)
													}}
													className={cn(
														'group relative rounded-2xl border bg-white p-3.5 shadow-2xs transition space-y-2.5 animate-in fade-in duration-150 select-none',
														draggedLeadId === lead.id
															? 'opacity-40 border-dashed border-slate-400 cursor-grabbing scale-95 shadow-none'
															: 'border-slate-200 hover:shadow-md hover:border-slate-400 cursor-grab active:cursor-grabbing',
													)}
												>
													{/* Card Header: Tier & SLA & Drag Handle */}
													<div className="flex items-center justify-between gap-1 flex-wrap">
														<div className="flex items-center gap-1.5 shrink-0">
															<FiMove className="h-3 w-3 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" title="Drag to move stage" />
															<span
																className={`px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-1 shrink-0 ${tierInfo.badge}`}
															>
																<FiZap className="h-3 w-3 shrink-0" />
																{tierInfo.shortLabel} • {lead.ai_score || 0}
															</span>
														</div>

														{sla && (
															<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border flex items-center gap-1 shrink-0 ${sla.color}`}>
																<FiClock className="h-2.5 w-2.5 shrink-0" />
																<span>{sla.label}</span>
															</span>
														)}
													</div>

													{/* Name & Company */}
													<div>
														<h4 className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition truncate" title={lead.name}>
															{lead.name}
														</h4>
														{lead.company_name ? (
															<p
																className="text-[11px] font-medium text-slate-500 line-clamp-2 flex items-start gap-1 mt-1 leading-snug"
																title={lead.company_name}
															>
																<FiBriefcase className="h-3 w-3 shrink-0 mt-0.5 text-slate-400" />
																<span>{lead.company_name}</span>
															</p>
														) : null}
													</div>

													{/* Budget & Work Email tag */}
													<div className="flex items-center gap-1.5 flex-wrap text-[10px]">
														{isCorporate && (
															<span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 whitespace-nowrap shrink-0">
																Work Email
															</span>
														)}
														{lead.budget_range && (
															<span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 whitespace-nowrap shrink-0 max-w-full truncate" title={lead.budget_range}>
																<FiDollarSign className="h-2.5 w-2.5 shrink-0" />
																<span className="truncate">{lead.budget_range}</span>
															</span>
														)}
													</div>

													{/* Card Footer: Assigned Rep & Quick Action */}
													<div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 gap-2">
														<div className="flex items-center gap-1.5 min-w-0">
															<span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[9px] flex items-center justify-center shrink-0">
																{assignedStaff ? assignedStaff.full_name.charAt(0) : '?'}
															</span>
															<span className="text-[10px] text-slate-600 font-medium truncate max-w-[85px]" title={assignedStaff?.full_name || 'Unassigned'}>
																{assignedStaff ? assignedStaff.full_name : 'Unassigned'}
															</span>
														</div>

														<div className="flex items-center gap-1 shrink-0">
															{lead.phone && (
																<a
																	href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.name || ''}, this is ${brandName || 'DeanFlow'} B2B Sales Team regarding your quotation request for ${lead.company_name || 'your project'}.`)}`}
																	target="_blank"
																	rel="noopener noreferrer"
																	onClick={(e) => e.stopPropagation()}
																	className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition whitespace-nowrap shrink-0"
																	title="Fast WhatsApp Outreach"
																>
																	<FaWhatsapp className="h-3 w-3 shrink-0" />
																	<span>WA</span>
																</a>
															)}
														</div>
													</div>
												</div>
											)
										})}

										{stageLeads.length > KANBAN_CARD_LIMIT && (
											<button
												type="button"
												onClick={() => {
													setStageFilter(stage.id)
													setViewMode('table')
												}}
												className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-slate-300 bg-white hover:bg-blue-50/70 hover:border-blue-300 text-[11px] font-bold text-slate-700 hover:text-blue-700 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer group mt-1"
											>
												<span>View all {stageLeads.length} leads in Table</span>
												<FiArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
											</button>
										)}

										{stageLeads.length === 0 && (
											<div className="p-6 text-center text-slate-400 text-xs italic bg-white/50 rounded-2xl border border-dashed border-slate-200">
												No active leads
											</div>
										)}
									</div>
								</div>
							)
						})}
					</div>
				</div>
			)}

			{/* ================= VIEW 2: POWER TABLE ================= */}
			{viewMode === 'table' && (
				<div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
					{/* Two-tier Bulk Selection Notice Banner */}
					{selectedLeadIds.size > 0 && (
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-2.5 bg-blue-50/80 border-b border-blue-200 text-xs text-blue-900 font-medium">
							<div className="flex items-center gap-2">
								<span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />
								<span>
									<strong className="font-bold">{selectedLeadIds.size}</strong> leads selected
									{selectedLeadIds.size === filteredLeads.length && (
										<span className="text-emerald-700 font-bold ml-1">(All matching filters)</span>
									)}
								</span>
							</div>
							<div className="flex items-center gap-3">
								{selectedLeadIds.size < filteredLeads.length && (
									<button
										type="button"
										onClick={() => setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)))}
										className="font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
									>
										Select all {filteredLeads.length} leads matching current filters
									</button>
								)}
								<button
									type="button"
									onClick={handleExportCSV}
									className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-300 bg-white px-3 py-1 text-xs font-bold text-blue-800 shadow-2xs hover:bg-blue-100 transition"
								>
									<FiDownload className="h-3 w-3" />
									<span>Export Selected ({selectedLeadIds.size})</span>
								</button>
								<button
									type="button"
									onClick={() => setSelectedLeadIds(new Set())}
									className="font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
								>
									Clear selection
								</button>
							</div>
						</div>
					)}

					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs min-w-[1050px]">
							<thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
								<tr>
									<th className="py-3 px-4 w-12 text-center shrink-0">
										<input
											type="checkbox"
											checked={
												paginatedLeads.length > 0 &&
												paginatedLeads.every((l) => selectedLeadIds.has(l.id))
											}
											onChange={(e) => {
												const next = new Set(selectedLeadIds)
												if (e.target.checked) {
													paginatedLeads.forEach((l) => next.add(l.id))
												} else {
													paginatedLeads.forEach((l) => next.delete(l.id))
												}
												setSelectedLeadIds(next)
											}}
											className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
											aria-label="Select all rows on this page"
										/>
									</th>
									<th className="py-3 px-4 min-w-[240px] whitespace-nowrap">Contact & Company</th>
									<th className="py-3 px-4 w-28 whitespace-nowrap">AI Score</th>
									<th className="py-3 px-4 w-40 whitespace-nowrap">Pipeline Stage</th>
									<th className="py-3 px-4 min-w-[200px] whitespace-nowrap">Direct Contact</th>
									<th className="py-3 px-4 w-32 whitespace-nowrap">Target Budget</th>
									<th className="py-3 px-4 w-32 whitespace-nowrap">Source / Geo</th>
									<th className="py-3 px-4 w-40 whitespace-nowrap">Account Executive</th>
									<th className="py-3 px-4 w-36 text-right whitespace-nowrap sticky right-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-[-6px_0_12px_rgba(0,0,0,0.03)]">
										Actions
									</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-slate-100">
								{paginatedLeads.map((lead) => {
									const isSelected = selectedLeadIds.has(lead.id)
									const assignedStaff = staffList.find((s) => s.id === lead.assigned_to)

									return (
										<tr
											key={lead.id}
											className={`hover:bg-slate-50/80 transition cursor-pointer group ${
												isSelected ? 'bg-slate-50' : ''
											}`}
											onClick={() => {
												setSelectedLead(lead)
												setIsDrawerOpen(true)
											}}
										>
											<td
												className="py-3 px-4 text-center"
												onClick={(e) => e.stopPropagation()}
											>
												<input
													type="checkbox"
													checked={isSelected}
													onChange={(e) => {
														const next = new Set(selectedLeadIds)
														if (e.target.checked) {
															next.add(lead.id)
														} else {
															next.delete(lead.id)
														}
														setSelectedLeadIds(next)
													}}
													className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
													aria-label={`Select ${lead.name}`}
												/>
											</td>

											{/* Customer & Company */}
											<td className="py-3 px-4">
												<div className="flex items-center gap-1.5 flex-wrap">
													<span className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate max-w-[180px]" title={lead.name}>
														{lead.name}
													</span>
													<span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold border shrink-0 ${getLeadTier(lead).badge}`}>
														{getLeadTier(lead).shortLabel}
													</span>
													{getLeadSLA(lead) && (
														<span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold border shrink-0 ${getLeadSLA(lead)!.color}`}>
															{getLeadSLA(lead)!.label}
														</span>
													)}
												</div>
												<div className="text-[11px] text-slate-500 font-medium truncate max-w-[220px]" title={lead.company_name || 'Not specified'}>
													{lead.company_name || 'Individual / Not specified'}
												</div>
											</td>

											{/* AI Score */}
											<td className="py-3 px-4 whitespace-nowrap">
												<span
													className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
														(lead.ai_score || 0) >= 80
															? 'bg-rose-50 text-rose-700 border-rose-200'
															: (lead.ai_score || 0) >= 55
																? 'bg-amber-50 text-amber-700 border-amber-200'
																: 'bg-slate-50 text-slate-600 border-slate-200'
													}`}
												>
													<FiZap className="h-3 w-3" />
													{lead.ai_score || 0} pts
												</span>
											</td>

											{/* Stage */}
											<td className="py-3 px-4 whitespace-nowrap">
												<span
													className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border inline-block ${
														PIPELINE_STAGES.find((s) => s.id === lead.status)?.bgBadge ||
														'bg-slate-50 text-slate-700 border-slate-200'
													}`}
												>
													{PIPELINE_STAGES.find((s) => s.id === lead.status)?.label || lead.status}
												</span>
											</td>

											{/* Contact */}
											<td className="py-3 px-4 whitespace-nowrap">
												<div className="font-mono text-slate-800 text-[11px] flex items-center gap-1.5">
													<span className="truncate max-w-[160px]" title={lead.email || ''}>{lead.email || '—'}</span>
													{lead.is_corporate_email ? (
														<span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200 shrink-0">
															WORK
														</span>
													) : null}
												</div>
												<div className="font-mono text-slate-500 text-[11px]">{lead.phone || '—'}</div>
											</td>

											{/* Budget */}
											<td className="py-3 px-4 whitespace-nowrap">
												<span className="font-bold text-emerald-800 text-xs">
													{lead.budget_range || '—'}
												</span>
											</td>

											{/* Source / Geo */}
											<td className="py-3 px-4 whitespace-nowrap">
												<div className="capitalize text-slate-800 font-medium text-[11px]">
													{lead.utm_source || lead.source || 'Direct'}
												</div>
												<div className="text-[10px] text-slate-400">
													{lead.ip_country || lead.country || 'Global'}
												</div>
											</td>

											{/* Assigned Rep */}
											<td className="py-3 px-4 whitespace-nowrap">
												<div className="flex items-center gap-1.5">
													<span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[9px] flex items-center justify-center shrink-0">
														{assignedStaff ? assignedStaff.full_name.charAt(0) : '?'}
													</span>
													<span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]" title={assignedStaff?.full_name || 'Unassigned'}>
														{assignedStaff ? assignedStaff.full_name : 'Unassigned'}
													</span>
												</div>
											</td>

											{/* Sticky Actions Column */}
											<td
												className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/90 transition z-10 shadow-[-6px_0_12px_rgba(0,0,0,0.03)]"
												onClick={(e) => e.stopPropagation()}
											>
												<div className="flex items-center justify-end gap-1.5 flex-nowrap">
													{lead.phone && (
														<a
															href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.name || ''}, this is ${brandName || 'DeanFlow'} B2B Sales Team regarding your quotation request for ${lead.company_name || 'your project'}.`)}`}
															target="_blank"
															rel="noopener noreferrer"
															className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition whitespace-nowrap shrink-0"
															title="Fast WhatsApp Outreach"
														>
															<FaWhatsapp className="h-3.5 w-3.5 shrink-0" />
															<span>WhatsApp</span>
														</a>
													)}

													<button
														type="button"
														onClick={() => {
															setSelectedLead(lead)
															setIsDrawerOpen(true)
														}}
														className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer shadow-xs whitespace-nowrap shrink-0"
													>
														View 360°
													</button>
												</div>
											</td>
										</tr>
									)
								})}

								{paginatedLeads.length === 0 && (
									<tr>
										<td colSpan={9} className="py-12 text-center text-slate-400">
											No leads matching the current filters.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					{/* Power Table Pagination Footer */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-slate-50/80">
						<div className="flex items-center flex-wrap gap-3 text-xs text-slate-600 font-medium">
							<span>
								Showing{' '}
								<strong className="font-bold text-slate-900">
									{filteredLeads.length === 0 ? 0 : (tablePage - 1) * pageSize + 1}
								</strong>{' '}
								to{' '}
								<strong className="font-bold text-slate-900">
									{Math.min(tablePage * pageSize, filteredLeads.length)}
								</strong>{' '}
								of <strong className="font-bold text-slate-900">{filteredLeads.length}</strong> leads
								{serverTotal > leads.length && (
									<span className="ml-1.5 text-slate-400">
										({leads.length} loaded of {serverTotal} in D1)
									</span>
								)}
							</span>

							{serverTotal > leads.length && (
								<button
									type="button"
									disabled={isLoadingMore}
									onClick={loadMoreServerLeads}
									className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
								>
									{isLoadingMore ? 'Loading...' : 'Load More from D1'}
								</button>
							)}

							<div className="flex items-center gap-1.5 ml-0 sm:ml-2">
								<span className="text-slate-300 hidden sm:inline">•</span>
								<label htmlFor="pageSizeSelect" className="text-slate-500 text-[11px] font-bold">
									Rows per page:
								</label>
								<select
									id="pageSizeSelect"
									value={pageSize}
									onChange={(e) => {
										setPageSize(Number(e.target.value))
										setTablePage(1)
									}}
									className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer focus:outline-hidden"
								>
									<option value={15}>15</option>
									<option value={25}>25</option>
									<option value={50}>50</option>
									<option value={100}>100</option>
								</select>
							</div>
						</div>

						{/* Page Controls */}
						{totalTablePages > 1 && (
							<div className="flex items-center gap-1 self-end sm:self-auto">
								<button
									type="button"
									disabled={tablePage === 1}
									onClick={() => setTablePage((p) => Math.max(1, p - 1))}
									className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
								>
									<FiChevronLeft className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Previous</span>
								</button>

								<div className="flex items-center gap-1 px-1">
									{getPageNumbers(tablePage, totalTablePages).map((p, idx) =>
										p === '...' ? (
											<span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-slate-400">
												...
											</span>
										) : (
											<button
												key={`page-${p}`}
												type="button"
												onClick={() => setTablePage(Number(p))}
												className={cn(
													'h-7 min-w-7 px-2 rounded-xl text-xs font-bold transition cursor-pointer',
													tablePage === p
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
									disabled={tablePage === totalTablePages}
									onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
									className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
								>
									<span className="hidden sm:inline">Next</span>
									<FiChevronRight className="h-3.5 w-3.5" />
								</button>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Slide-over Drawer for Lead 360 */}
			<LeadDetailDrawer
				lead={selectedLead}
				isOpen={isDrawerOpen}
				onClose={() => setIsDrawerOpen(false)}
				onLeadUpdated={handleLeadUpdated}
				staffList={staffList}
				currentStaff={currentStaff}
				brandName={brandName}
			/>
		</div>
	)
}
