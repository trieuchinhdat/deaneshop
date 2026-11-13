'use client'

import { sanityStudioUrl } from '@/lib/sanity-studio-url'

const EVENT_POLL_INTERVAL_MS = 15_000
const VISIBILITY_THROTTLE_MS = 5_000

import { AnimatePresence, motion } from 'framer-motion'
import {
	Activity,
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	ArrowUpRight,
	BarChart3,
	Bell,
	BellOff,
	Building,
	Calendar,
	Check,
	CheckCircle2,
	CheckSquare,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock,
	Command,
	Compass,
	Copy,
	Download,
	ExternalLink,
	FileText,
	Flame,
	Globe,
	Inbox,
	Info,
	LayoutDashboard,
	Loader2,
	LogOut,
	Mail,
	Menu,
	MessageSquare,
	Phone,
	Printer,
	RefreshCw,
	Search,
	Share2,
	Shield,
	ShieldCheck,
	Sparkles,
	Square,
	Tag,
	Trash2,
	TrendingUp,
	User,
	UserCheck,
	UserPlus,
	Users,
	X,
	Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AdminSessionUser } from '@/lib/admin-auth'
import { canAccessTab, getDefaultTabForRole } from '@/lib/admin-roles'
import {
	parseAttributionFromObject,
} from '@/lib/attribution'
import type { D1AdminUser, D1LeadNote } from '@/lib/d1'
import {
	leadChannel,
	leadEvidence,
	readJourney,
	safeWebUrl,
	type IntelligenceLead,
} from '@/lib/lead-intelligence'
import CustomersClient from './customers-client'
import LeadContactClient from './lead-contact-client'
import StaffManagement from './staff/staff-management'
import EdgeTelemetryCard from './overview/edge-telemetry-card'
import LeadPipelineFunnelChart from './overview/lead-pipeline-funnel-chart'
import LeadSourceDistributionChart from './overview/lead-source-distribution-chart'
import LeadVolumeTrendChart from './overview/lead-volume-trend-chart'

type SourceRow = {
	source: string
	medium: string
	total: number
	assessed: number
	qualified: number
	spam: number
}

type CampaignRow = {
	campaign: string
	source: string
	medium: string
	total: number
	qualified: number
	avg_score: number
}

type PlacementRow = {
	placement: string
	total: number
	qualified: number
	avg_score: number
}

type CountryRow = {
	country: string
	total: number
	qualified: number
}

const formatDate = (value?: string | null) => {
	if (!value || !Number.isFinite(Date.parse(value))) return 'Not recorded'
	return new Date(value).toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	})
}

const formatShortDate = (value?: string | null) => {
	if (!value || !Number.isFinite(Date.parse(value))) return '—'
	const d = new Date(value)
	const now = new Date()
	const diffMs = now.getTime() - d.getTime()
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

	if (diffHours >= 0 && diffHours < 24) {
		if (diffHours === 0) return 'Just now'
		return `${diffHours}h ago`
	}
	if (diffHours >= 24 && diffHours < 48) {
		return 'Yesterday'
	}
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name?: string) {
	if (!name) return '?'
	const parts = name.trim().split(/\s+/)
	if (parts.length >= 2) {
		return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
	}
	return name.slice(0, 2).toUpperCase()
}

// SLA response status calculator (<15m = Target, 15m-60m = Breached, >60m = Critical)
function getSlaStatus(createdAt?: string | null, status?: string) {
	if (!createdAt || !Number.isFinite(Date.parse(createdAt))) return null
	if (status && !['new'].includes(status.toLowerCase())) return null
	const elapsedMs = Date.now() - new Date(createdAt).getTime()
	const elapsedMins = Math.floor(elapsedMs / (1000 * 60))

	if (elapsedMins < 15) {
		return {
			type: 'target',
			label: `${15 - elapsedMins}m SLA left`,
			badge:
				'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
			dot: 'bg-emerald-500',
			urgent: false,
		}
	} else if (elapsedMins < 60) {
		return {
			type: 'breached',
			label: `${elapsedMins}m ago · SLA breached`,
			badge:
				'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20',
			dot: 'bg-amber-500',
			urgent: true,
		}
	} else {
		const hours = Math.floor(elapsedMins / 60)
		return {
			type: 'critical',
			label: `${hours}h ago · Urgent SLA`,
			badge:
				'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20 font-semibold',
			dot: 'bg-rose-500',
			urgent: true,
		}
	}
}

const ROLE_LABELS: Record<string, string> = {
	superadmin: 'Super Admin',
	admin: 'Admin',
	sales: 'Sale',
	marketing: 'Marketing',
}

const ROLE_COLORS: Record<string, string> = {
	superadmin: 'bg-rose-50 text-rose-700 border-rose-200',
	admin: 'bg-purple-50 text-purple-700 border-purple-200',
	sales: 'bg-blue-50 text-blue-700 border-blue-200',
	marketing: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default function LeadWorkspaceClient({
	user,
	initialStaff,
	brandLogoUrl,
	brandName = 'DeanFlow',
	authMode = 'password',
}: {
	user: AdminSessionUser
	initialStaff: Omit<D1AdminUser, 'password_hash'>[]
	brandLogoUrl?: string
	brandName?: string
	authMode?: 'password' | 'sanity'
}) {
	const detailRequest = useRef(0)
	const lastEventIdRef = useRef<number | null>(null)
	const lastCheckAtRef = useRef(0)
	const checkingEventsRef = useRef(false)

	const defaultView = getDefaultTabForRole(user.role)
	const canViewCustomers = canAccessTab(user.role, 'customers')
	const [view, setView] = useState<string>(defaultView)
	const [filter, setFilter] = useState('all')
	const [utmSource, setUtmSource] = useState('')
	const [utmMedium, setUtmMedium] = useState('')
	const [utmCampaign, setUtmCampaign] = useState('')
	const [dateRange, setDateRange] = useState('all')
	const [followupCounts, setFollowupCounts] = useState({ total: 0, overdue: 0 })
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [items, setItems] = useState<IntelligenceLead[]>([])
	const [total, setTotal] = useState(0)
	const [sources, setSources] = useState<SourceRow[]>([])
	const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
	const [placements, setPlacements] = useState<PlacementRow[]>([])
	const [countries, setCountries] = useState<CountryRow[]>([])
	const [insightTab, setInsightTab] = useState<'sources' | 'campaigns' | 'placements' | 'countries'>('sources')
	const [externalEmailDraft, setExternalEmailDraft] = useState<{
		key: number
		subject: string
		body: string
	} | null>(null)
	const [staff, setStaff] = useState<{ id: string; name: string }[]>([])
	const [overviewUrgent, setOverviewUrgent] = useState<IntelligenceLead[]>([])
	const [overviewFollowups, setOverviewFollowups] = useState<
		IntelligenceLead[]
	>([])
	const [overviewLoaded, setOverviewLoaded] = useState(false)
	const [selected, setSelected] = useState<IntelligenceLead | null>(null)
	const [notes, setNotes] = useState<D1LeadNote[]>([])
	const [trends, setTrends] = useState<
		{ bucket: string; total: number; qualified: number; urgent?: number }[]
	>([])
	const [stages, setStages] = useState<{ status: string; count: number }[]>([])
	const [qualifications, setQualifications] = useState<
		{ qualification: string; count: number }[]
	>([])
	const [priorities, setPriorities] = useState<
		{ priority: string; count: number }[]
	>([])

	// Bulk Selection State
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [bulkBusy, setBulkBusy] = useState(false)
	const [bulkAssignee, setBulkAssignee] = useState('')

	// Command Palette (⌘K)
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
	const [commandQuery, setCommandQuery] = useState('')

	// Audio Chime Toggle
	const [soundEnabled, setSoundEnabled] = useState(true)

	const [busy, setBusy] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [notice, setNotice] = useState('')
	const [revision, setRevision] = useState(0)
	const [customersRevision, setCustomersRevision] = useState(0)
	const [customersBusy, setCustomersBusy] = useState(false)
	const [customersSelected, setCustomersSelected] = useState<{
		key: string
		name: string
	} | null>(null)
	const [customersSearchJump, setCustomersSearchJump] = useState<string | null>(
		null,
	)
	const [detailUpdateNotice, setDetailUpdateNotice] = useState<
		'new_lead' | 'updated' | null
	>(null)
	const [mobileNavOpen, setMobileNavOpen] = useState(false)
	const [copiedField, setCopiedField] = useState<string | null>(null)
	const [reportCopied, setReportCopied] = useState(false)

	const selectedRef = useRef<IntelligenceLead | null>(selected)
	selectedRef.current = selected
	const viewRef = useRef(view)
	viewRef.current = view
	const soundEnabledRef = useRef(soundEnabled)
	soundEnabledRef.current = soundEnabled
	const prevRevisionRef = useRef(revision)
	const prevSearchRef = useRef(search)
	const overviewCacheRef = useRef(
		new Map<
			string,
			{
				sources: SourceRow[]
				trends: {
					bucket: string
					total: number
					qualified: number
					urgent?: number
				}[]
				stages: { status: string; count: number }[]
				qualifications: { qualification: string; count: number }[]
				priorities: { priority: string; count: number }[]
				followups: { total: number; overdue: number }
				total: number
				urgentItems: IntelligenceLead[]
				followupItems: IntelligenceLead[]
			}
		>(),
	)

	const canEdit = user.role !== 'marketing'
	const canManage = ['superadmin', 'admin'].includes(user.role)

	function recordLatestEventId(latestEventId: unknown) {
		if (
			typeof latestEventId === 'number' &&
			Number.isSafeInteger(latestEventId) &&
			latestEventId >= 0
		) {
			lastEventIdRef.current = latestEventId
			lastCheckAtRef.current = Date.now()
		}
	}

	// Web Audio Inbound Lead Chime (Crystal Bell: 587Hz -> 880Hz)
	function playInboundChime() {
		if (!soundEnabledRef.current || typeof window === 'undefined') return
		try {
			const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
			if (!AudioCtx) return
			const ctx = new AudioCtx()
			const osc1 = ctx.createOscillator()
			const osc2 = ctx.createOscillator()
			const gain = ctx.createGain()

			osc1.type = 'sine'
			osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
			osc2.type = 'sine'
			osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08) // A5

			gain.gain.setValueAtTime(0.08, ctx.currentTime)
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)

			osc1.connect(gain)
			osc2.connect(gain)
			gain.connect(ctx.destination)

			osc1.start(ctx.currentTime)
			osc1.stop(ctx.currentTime + 0.12)
			osc2.start(ctx.currentTime + 0.08)
			osc2.stop(ctx.currentTime + 0.45)
		} catch {
			// AudioContext blocked until interaction
		}
	}

	function copyToClipboard(text: string, fieldName: string) {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			void navigator.clipboard.writeText(text)
			setCopiedField(fieldName)
			setTimeout(() => setCopiedField(null), 2000)
		}
	}

	// Keyboard shortcut for Command Palette (⌘K or Ctrl+K or /)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault()
				setCommandPaletteOpen((prev) => !prev)
			} else if (
				e.key === '/' &&
				!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
			) {
				e.preventDefault()
				setCommandPaletteOpen(true)
			} else if (e.key === 'Escape') {
				setCommandPaletteOpen(false)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	useEffect(() => {
		const restore = () => {
			const q = new URLSearchParams(location.search)
			const targetView = q.get('view')
			const allowedViews = [
				'overview',
				'leads',
				'followups',
				'insights',
				...(canViewCustomers ? ['customers'] : []),
			]
			if (targetView && allowedViews.includes(targetView)) {
				setView(targetView)
			} else {
				setView(defaultView)
			}
			const id = q.get('lead')
			if (id) void openLead(id)
			else setSelected(null)
		}
		restore()
		window.addEventListener('popstate', restore)
		return () => window.removeEventListener('popstate', restore)
	}, [canViewCustomers, defaultView])

	useEffect(() => {
		if (view === 'team' || view === 'customers') return
		const controller = new AbortController()
		if (prevRevisionRef.current !== revision) {
			prevRevisionRef.current = revision
			overviewCacheRef.current.clear()
		}
		const searchChanged = prevSearchRef.current !== search
		prevSearchRef.current = search

		if (view === 'overview') {
			const cached = overviewCacheRef.current.get(dateRange)
			if (cached) {
				setSources(cached.sources)
				setTrends(cached.trends)
				setStages(cached.stages)
				setQualifications(cached.qualifications)
				setPriorities(cached.priorities)
				setFollowupCounts(cached.followups)
				setTotal(cached.total)
				setOverviewUrgent(cached.urgentItems)
				setOverviewFollowups(cached.followupItems)
				setOverviewLoaded(true)
			}
		}

		setBusy(true)
		setError('')
		const delayMs =
			(view === 'leads' || view === 'followups') && searchChanged ? 250 : 0
		const timer = setTimeout(async () => {
			try {
				if (view === 'overview') {
					const analyticsRes = await fetch(
						`/api/admin/intelligence?view=analytics&dateRange=${dateRange}`,
						{
							signal: controller.signal,
							cache: 'no-store',
						},
					)
					const analyticsData = await analyticsRes.json()
					if (!analyticsRes.ok) throw new Error(analyticsData.error)

					recordLatestEventId(analyticsData.latestEventId)

					const nextOverview = {
						sources: analyticsData.sources || [],
						trends: analyticsData.trends || [],
						stages: analyticsData.stages || [],
						qualifications: analyticsData.qualifications || [],
						priorities: analyticsData.priorities || [],
						followups: analyticsData.followups || { total: 0, overdue: 0 },
						total: Number(analyticsData.total) || 0,
						urgentItems: analyticsData.urgentItems || [],
						followupItems: analyticsData.followupItems || [],
					}
					overviewCacheRef.current.set(dateRange, nextOverview)

					setSources(nextOverview.sources)
					setTrends(nextOverview.trends)
					setStages(nextOverview.stages)
					setQualifications(nextOverview.qualifications)
					setPriorities(nextOverview.priorities)
					setFollowupCounts(nextOverview.followups)
					setTotal(nextOverview.total)
					setOverviewUrgent(nextOverview.urgentItems)
					setOverviewFollowups(nextOverview.followupItems)
					setOverviewLoaded(true)
				} else if (view === 'insights') {
					const response = await fetch(
						`/api/admin/intelligence?view=insights&dateRange=${dateRange}`,
						{ signal: controller.signal, cache: 'no-store' },
					)
					const data = await response.json()
					if (!response.ok) throw new Error(data.error)
					recordLatestEventId(data.latestEventId)
					setSources(data.sources || [])
					setCampaigns(data.campaigns || [])
					setPlacements(data.placements || [])
					setCountries(data.countries || [])
				} else {
					const params = new URLSearchParams({
						view,
						filter: view === 'followups' ? 'followups' : filter,
						dateRange,
						search,
						page: String(page),
					})
					if (view === 'leads' && utmSource) {
						params.set('utmSource', utmSource)
					}
					if (view === 'leads' && utmMedium) {
						params.set('utmMedium', utmMedium)
					}
					if (view === 'leads' && utmCampaign) {
						params.set('utmCampaign', utmCampaign)
					}
					const response = await fetch(`/api/admin/intelligence?${params}`, {
						signal: controller.signal,
						cache: 'no-store',
					})
					const data = await response.json()
					if (!response.ok) throw new Error(data.error)

					recordLatestEventId(data.latestEventId)

					setItems(data.items || [])
					setTotal(data.total || 0)
					setStaff(data.staff || [])
				}
			} catch (e) {
				if (!controller.signal.aborted) {
					if (e instanceof Error && e.message === 'Unauthorized') {
						window.location.assign('/admin')
						return
					}
					setError(e instanceof Error ? e.message : 'Unable to load leads')
				}
			} finally {
				if (!controller.signal.aborted) setBusy(false)
			}
		}, delayMs)
		return () => {
			clearTimeout(timer)
			controller.abort()
		}
	}, [view, filter, utmSource, utmMedium, utmCampaign, dateRange, search, page, revision])

	async function openLead(id: string) {
		const requestId = ++detailRequest.current
		setError('')
		setDetailUpdateNotice(null)
		setSelected(null)
		setNotes([])
		try {
			const response = await fetch(
				`/api/admin/intelligence?id=${encodeURIComponent(id)}`,
				{ cache: 'no-store' },
			)
			const data = await response.json()
			if (!response.ok) throw new Error(data.error)
			if (requestId !== detailRequest.current) return
			setSelected(data.lead)
			setNotes(data.notes || [])
		} catch (e) {
			if (e instanceof Error && e.message === 'Unauthorized') {
				window.location.assign('/admin')
				return
			}
			setError(e instanceof Error ? e.message : 'Unable to open lead')
		}
	}

	function navigate(
		next: string,
		options?: { keepUtmSource?: boolean },
	) {
		detailRequest.current++
		setView(next)
		setPage(1)
		if (!options?.keepUtmSource) {
			setUtmSource('')
			setUtmMedium('')
			setUtmCampaign('')
		}
		setSelected(null)
		setCustomersSelected(null)
		setDetailUpdateNotice(null)
		setSelectedIds([])
		setMobileNavOpen(false)
		const url = new URL(location.href)
		url.search = ''
		url.searchParams.set('view', next)
		history.pushState({}, '', url)
	}

	function selectLead(id: string) {
		const url = new URL(location.href)
		url.searchParams.set('lead', id)
		history.pushState({}, '', url)
		void openLead(id)
	}

	async function saveAssessment() {
		if (!selected) return
		setSaving(true)
		setError('')
		setNotice('')
		try {
			const response = await fetch('/api/admin/intelligence', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(selected),
			})
			const data = await response.json()
			if (!response.ok) throw new Error(data.error)
			setSelected({
				...selected,
				assessment_version: selected.assessment_version + 1,
			})
			setDetailUpdateNotice(null)
			lastCheckAtRef.current = Date.now()
			setNotice('Assessment and follow-up saved.')
			setRevision((n) => n + 1)
			setTimeout(() => setNotice(''), 4000)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Save failed')
		} finally {
			setSaving(false)
		}
	}

	useEffect(() => {
		const checkEvents = async () => {
			if (document.hidden || checkingEventsRef.current) return
			const now = Date.now()
			if (now - lastCheckAtRef.current < VISIBILITY_THROTTLE_MS) return

			checkingEventsRef.current = true
			lastCheckAtRef.current = now
			try {
				const after = lastEventIdRef.current
				const url =
					after === null
						? '/api/admin/intelligence?view=events'
						: `/api/admin/intelligence?view=events&after=${after}`
				const response = await fetch(url, { cache: 'no-store' })
				if (response.status === 401) {
					window.location.assign('/admin')
					return
				}
				const data = await response.json().catch(() => null)
				if (!response.ok || !data) return

				if (
					typeof data.latestEventId === 'number' &&
					Number.isSafeInteger(data.latestEventId) &&
					data.latestEventId >= 0
				) {
					lastEventIdRef.current = data.latestEventId
				}

				if (data.hasNewLead) {
					playInboundChime()
				}

				if (data.hasNewLead || data.hasLeadUpdated) {
					if (selectedRef.current !== null) {
						setDetailUpdateNotice(data.hasNewLead ? 'new_lead' : 'updated')
					}
					if (viewRef.current === 'customers') {
						setCustomersRevision((n) => n + 1)
					} else if (viewRef.current !== 'team') {
						setRevision((n) => n + 1)
					}
				}
			} catch {
				// Transient network errors retry on the next tick or tab resume
			} finally {
				checkingEventsRef.current = false
			}
		}

		const timer = setInterval(() => {
			void checkEvents()
		}, EVENT_POLL_INTERVAL_MS)

		const handleResume = () => {
			if (!document.hidden) {
				void checkEvents()
			}
		}

		document.addEventListener('visibilitychange', handleResume)
		window.addEventListener('focus', handleResume)
		return () => {
			clearInterval(timer)
			document.removeEventListener('visibilitychange', handleResume)
			window.removeEventListener('focus', handleResume)
		}
	}, [])

	async function syncLatestEventIdFromResponses(
		results: PromiseSettledResult<Response>[],
	) {
		const payloads = await Promise.all(
			results.map(async (r) => {
				if (r.status !== 'fulfilled' || !r.value.ok) return null
				return r.value.json().catch(() => null)
			}),
		)
		const ids = payloads
			.map((d) => d?.latestEventId)
			.filter(
				(n): n is number =>
					typeof n === 'number' && Number.isSafeInteger(n) && n >= 0,
			)
		if (ids.length > 0) {
			recordLatestEventId(Math.max(...ids))
		} else {
			lastCheckAtRef.current = Date.now()
		}
	}

	// Bulk Actions Handlers
	function toggleSelectAll() {
		if (selectedIds.length === items.length) {
			setSelectedIds([])
		} else {
			setSelectedIds(items.map((i) => i.id))
		}
	}

	function toggleSelectOne(id: string) {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		)
	}

	async function handleBulkStatus(newStatus: string) {
		if (!selectedIds.length) return
		setBulkBusy(true)
		try {
			const results = await Promise.allSettled(
				selectedIds.map((id) => {
					const lead = items.find((x) => x.id === id)
					return fetch('/api/admin/leads/update', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							leadId: id,
							expectedVersion: lead?.version,
							status: newStatus,
						}),
					})
				}),
			)
			await syncLatestEventIdFromResponses(results)
			setNotice(
				`Updated status to "${newStatus}" for ${selectedIds.length} leads.`,
			)
			setSelectedIds([])
			setRevision((n) => n + 1)
		} finally {
			setBulkBusy(false)
		}
	}

	async function handleBulkAssign(repId: string) {
		if (!selectedIds.length || !repId) return
		setBulkBusy(true)
		try {
			const results = await Promise.allSettled(
				selectedIds.map((id) => {
					const lead = items.find((x) => x.id === id)
					return fetch('/api/admin/leads/update', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							leadId: id,
							expectedVersion: lead?.version,
							assigned_to: repId,
						}),
					})
				}),
			)
			await syncLatestEventIdFromResponses(results)
			setNotice(`Assigned ${selectedIds.length} leads successfully.`)
			setSelectedIds([])
			setBulkAssignee('')
			setRevision((n) => n + 1)
		} finally {
			setBulkBusy(false)
		}
	}

	async function handleBulkSpam() {
		if (!selectedIds.length) return
		setBulkBusy(true)
		try {
			await Promise.allSettled(
				selectedIds.map((id) => {
					const lead = items.find((x) => x.id === id)
					return fetch('/api/admin/intelligence', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							...lead,
							qualification: 'spam',
							reason: 'Bulk triage: marked as spam/bot',
							priority: 'low',
							next_action: 'None',
						}),
					})
				}),
			)
			lastCheckAtRef.current = Date.now()
			setNotice(`Marked ${selectedIds.length} leads as spam.`)
			setSelectedIds([])
			setRevision((n) => n + 1)
		} finally {
			setBulkBusy(false)
		}
	}

	function exportSelectedCsv() {
		if (!selectedIds.length) return
		const selectedLeads = items.filter((i) => selectedIds.includes(i.id))
		const headers = [
			'ID',
			'Name',
			'Email',
			'Phone',
			'Company',
			'Status',
			'Qualification',
			'Priority',
			'Source',
			'Received',
		]
		const rows = selectedLeads.map((l) => [
			l.id,
			`"${(l.name || '').replace(/"/g, '""')}"`,
			l.email || '',
			l.phone || '',
			`"${(l.company_name || '').replace(/"/g, '""')}"`,
			l.status,
			l.qualification,
			l.priority,
			l.utm_source || '',
			l.created_at,
		])
		const csvContent =
			'data:text/csv;charset=utf-8,' +
			[headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
		const encodedUri = encodeURI(csvContent)
		const link = document.createElement('a')
		link.setAttribute('href', encodedUri)
		link.setAttribute(
			'download',
			`leads_export_${new Date().toISOString().slice(0, 10)}.csv`,
		)
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const attr = selected?.attribution_json
		? parseAttributionFromObject(selected.attribution_json)
		: null
	const consentInfo = (() => {
		if (!selected?.consent_json) return null
		try {
			const parsed = JSON.parse(selected.consent_json)
			return parsed && typeof parsed === 'object' ? (parsed as Record<string, any>) : null
		} catch {
			return null
		}
	})()
	const activity = readJourney(selected?.journey_json)

	// Metrics calculations
	const insightTotalLeads = sources.reduce((acc, s) => acc + s.total, 0)
	const insightAssessed = sources.reduce((acc, s) => acc + s.assessed, 0)
	const insightQualified = sources.reduce((acc, s) => acc + s.qualified, 0)
	const insightSpam = sources.reduce((acc, s) => acc + s.spam, 0)
	const insightAvgQualRate = insightAssessed
		? Math.round((insightQualified / insightAssessed) * 100)
		: 0

	// Overview Calculations
	const overdueFollowups = overviewFollowups.filter(
		(l) => l.follow_up_at && Date.parse(l.follow_up_at) < Date.now(),
	)
	const urgentInquiries = overviewUrgent
	const overdueCount = followupCounts.overdue
	const highPriorityCount = priorities.find(p => p.priority === 'high')?.count || 0
	const newInquiryCount = stages.find(s => s.status === 'new')?.count || 0
	const topSource = sources.length > 0 ? sources[0] : null
	const topConvertingSource =
		sources
			.filter((s) => s.assessed > 0)
			.sort(
				(a, b) =>
					b.qualified / b.assessed - a.qualified / a.assessed ||
					b.qualified - a.qualified,
			)[0] || null
	const formatSourceName = (src?: string | null) =>
		!src || src === 'Unknown' ? 'Direct / Unknown' : src

	function copyQuickReport() {
		const dateStr = new Date().toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
		const reportText = `[EXECUTIVE LEAD DIGEST] — ${brandName.toUpperCase()}
Date: ${dateStr}
Reporting calendar: UTC; follow-ups include all open leads
Generated by: ${user.name} (${ROLE_LABELS[user.role] || user.role})
--------------------------------------------------
INBOUND METRICS SNAPSHOT:
• Total Pipeline Inquiries: ${total}
• Assessed Leads: ${insightAssessed}
• Staff Qualified Leads: ${insightQualified} (${insightAvgQualRate}% rate)
• Unassessed / Action Required: ${Math.max(0, total - insightAssessed)}
• Filtered Spam: ${insightSpam}

URGENT ACTION ITEMS:
• Overdue Follow-ups: ${overdueCount} ${overdueCount > 0 ? '[Action Required]' : '[All On Track]'}
• High Priority Inquiries: ${highPriorityCount}
${overdueFollowups
	.slice(0, 3)
	.map(
		(f) =>
			`  - [Overdue] ${f.name} (${f.company_name || f.email}): ${f.next_action || 'Follow up'}`,
	)
	.join('\n')}

TOP TRAFFIC ACQUISITION:
• Primary Source: ${topSource ? `${topSource.source} / ${topSource.medium} (${topSource.total} leads, ${topSource.assessed ? Math.round((topSource.qualified / topSource.assessed) * 100) : 0}% qual)` : 'No source data yet'}
--------------------------------------------------
DeanFlow Lead Intelligence Console`

		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			void navigator.clipboard.writeText(reportText)
			setReportCopied(true)
			setTimeout(() => setReportCopied(false), 2500)
		}
	}

	const navItems = [
		{ id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
		{ id: 'leads', label: 'Leads Directory', icon: Inbox },
		...(canViewCustomers
			? [{ id: 'customers', label: 'Customers', icon: Users }]
			: []),
		{ id: 'followups', label: 'Scheduled Follow-ups', icon: Clock },
		{ id: 'insights', label: 'Source Analytics', icon: BarChart3 },
		...(canManage
			? [{ id: 'team', label: 'Team Governance', icon: ShieldCheck }]
			: []),
	]

	// Command Palette filtered items
	const commandFilteredLeads = items.filter((l) => {
		if (!commandQuery.trim()) return false
		const q = commandQuery.toLowerCase()
		return (
			l.name.toLowerCase().includes(q) ||
			(l.company_name && l.company_name.toLowerCase().includes(q)) ||
			(l.email && l.email.toLowerCase().includes(q))
		)
	})

	return (
		<div className="min-h-screen bg-slate-50/70 font-sans text-slate-900 antialiased">
			{/* DESKTOP SIDEBAR */}
			<aside className="hidden border-r border-slate-200/90 bg-white md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col print:hidden">
				{/* Workspace Brand / Header: Dark logo only */}
				<div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-200/80 bg-white px-4">
					{brandLogoUrl ? (
						<img
							src={brandLogoUrl}
							alt={brandName}
							className="h-7 max-h-8 w-auto max-w-[170px] object-contain"
						/>
					) : (
						<span className="font-mono text-sm font-black tracking-widest text-slate-900 uppercase">
							{brandName}
						</span>
					)}
				</div>

				{/* Navigation Links with Framer-motion active layoutId */}
				<div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
					<div className="space-y-6">
						<div>
							<p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
								Workspace
							</p>
							<nav aria-label="Desktop Workspace" className="space-y-1">
								{navItems.map((item) => {
									const Icon = item.icon
									const active = view === item.id
									return (
										<button
											key={item.id}
											onClick={() => navigate(item.id)}
											aria-current={active ? 'page' : undefined}
											className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
												active
													? 'text-white'
													: 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
											}`}
										>
											{active && (
												<motion.div
													layoutId="activeNavBackground"
													className="absolute inset-0 rounded-lg bg-slate-900 shadow-2xs"
													transition={{
														type: 'spring',
														stiffness: 450,
														damping: 35,
													}}
												/>
											)}
											<span className="relative z-10 flex items-center gap-2.5">
												<Icon
													className={`h-4 w-4 shrink-0 transition-colors ${
														active
															? 'text-emerald-400'
															: 'text-slate-400 group-hover:text-slate-600'
													}`}
												/>
												{item.label}
											</span>
											{item.id === 'leads' && total > 0 && (
												<span
													className={`relative z-10 rounded-full px-2 py-0.5 text-[10px] font-medium ${
														active
															? 'bg-slate-800 text-slate-200'
															: 'bg-slate-100 text-slate-600'
													}`}
												>
													{total}
												</span>
											)}
											{item.id === 'followups' && overdueCount > 0 && (
												<span className="py-0.2 relative z-10 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
													{overdueCount}
												</span>
											)}
										</button>
									)
								})}
							</nav>
						</div>

						{/* External Portals */}
						<div>
							<p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
								Connected Portals
							</p>
							<div className="space-y-1">
								<a
									href={sanityStudioUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900"
								>
									<span className="flex items-center gap-2.5">
										<Sparkles className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
										Sanity Studio
									</span>
									<ExternalLink className="h-3.5 w-3.5 text-slate-400" />
								</a>
								<a
									href="/"
									target="_blank"
									rel="noopener noreferrer"
									className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900"
								>
									<span className="flex items-center gap-2.5">
										<Globe className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
										Live Storefront
									</span>
									<ExternalLink className="h-3.5 w-3.5 text-slate-400" />
								</a>
							</div>
						</div>
					</div>

					{/* Command Palette Trigger in Sidebar (at the bottom) */}
					<div className="pt-4">
						<button
							onClick={() => setCommandPaletteOpen(true)}
							className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
						>
							<span className="flex items-center gap-2">
								<Command className="h-3.5 w-3.5 text-slate-400" />
								Command Menu
							</span>
							<kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 shadow-2xs">
								⌘K
							</kbd>
						</button>
					</div>
				</div>

				{/* Staff User Footer */}
				<div className="border-t border-slate-200/80 bg-slate-50/50 p-3.5">
					<div className="flex items-center justify-between">
						<div className="flex min-w-0 items-center gap-2.5">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white shadow-2xs">
								{getInitials(user.name)}
							</div>
							<div className="min-w-0">
								<p className="truncate text-xs font-semibold text-slate-900">
									{user.name}
								</p>
								<span
									className={`py-0.2 inline-block truncate rounded-sm border px-1.5 text-[10px] font-medium ${
										ROLE_COLORS[user.role] ||
										'border-slate-200 bg-slate-100 text-slate-700'
									}`}
								>
									{ROLE_LABELS[user.role] || user.role}
								</span>
							</div>
						</div>
						<button
							title="Sign out"
							className="rounded-lg border border-transparent p-1.5 text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-rose-600"
							onClick={async () => {
								try {
									const r = await fetch('/api/admin/auth/logout', {
										method: 'POST',
									})
									if (!r.ok) throw new Error()
									location.assign('/admin')
								} catch {
									setError('Unable to sign out. Please retry.')
								}
							}}
						>
							<LogOut className="h-4 w-4" />
						</button>
					</div>
				</div>
			</aside>

			{/* MOBILE DRAWER WITH FRAMER MOTION */}
			<AnimatePresence>
				{mobileNavOpen && (
					<div className="fixed inset-0 z-50 flex md:hidden">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.18 }}
							className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
							onClick={() => setMobileNavOpen(false)}
						/>
						<motion.div
							initial={{ x: '-100%' }}
							animate={{ x: 0 }}
							exit={{ x: '-100%' }}
							transition={{ type: 'spring', damping: 28, stiffness: 320 }}
							className="relative flex w-72 max-w-xs flex-1 flex-col bg-white shadow-xl"
						>
							<div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
								<div className="flex h-10 items-center justify-start">
									{brandLogoUrl ? (
										<img
											src={brandLogoUrl}
											alt={brandName}
											className="h-6 max-h-7 w-auto max-w-[160px] object-contain"
										/>
									) : (
										<span className="font-mono text-xs font-bold tracking-widest text-slate-900 uppercase">
											{brandName}
										</span>
									)}
								</div>
								<button
									onClick={() => setMobileNavOpen(false)}
									className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							<nav
								aria-label="Mobile Navigation"
								className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4"
							>
								<div className="space-y-1">
									{navItems.map((item) => {
										const Icon = item.icon
										const active = view === item.id
										return (
											<button
												key={item.id}
												onClick={() => navigate(item.id)}
												className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
													active
														? 'bg-slate-900 text-white'
														: 'text-slate-600 hover:bg-slate-100'
												}`}
											>
												<span className="flex items-center gap-2.5">
													<Icon className="h-4.5 w-4.5" />
													{item.label}
												</span>
											</button>
										)
									})}
								</div>

								{/* Mobile Command Palette Trigger at bottom */}
								<div className="pt-4">
									<button
										onClick={() => {
											setMobileNavOpen(false)
											setCommandPaletteOpen(true)
										}}
										className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 transition-colors hover:bg-slate-100"
									>
										<span className="flex items-center gap-2">
											<Command className="h-4 w-4 text-slate-400" />
											Command Menu
										</span>
										<kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 shadow-2xs">
											⌘K
										</kbd>
									</button>
								</div>
							</nav>

							<div className="border-t border-slate-200 bg-slate-50 p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-slate-900">
											{user.name}
										</p>
										<p className="text-xs text-slate-500">
											{ROLE_LABELS[user.role] || user.role}
										</p>
									</div>
									<button
										onClick={async () => {
											await fetch('/api/admin/auth/logout', { method: 'POST' })
											location.assign('/admin')
										}}
										className="text-xs font-medium text-rose-600 hover:underline"
									>
										Sign out
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* COMMAND PALETTE MODAL (⌘K) */}
			<AnimatePresence>
				{commandPaletteOpen && (
					<div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
							onClick={() => setCommandPaletteOpen(false)}
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.96, y: -10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.96, y: -10 }}
							transition={{ duration: 0.18 }}
							className="relative w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xl"
						>
							<div className="flex items-center gap-2.5 border-b border-slate-100 px-3 pb-3">
								<Search className="h-4 w-4 text-slate-400" />
								<input
									autoFocus
									placeholder="Type a command, navigate, or search leads..."
									className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
									value={commandQuery}
									onChange={(e) => setCommandQuery(e.target.value)}
								/>
								<kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
									ESC
								</kbd>
							</div>

							<div className="max-h-80 space-y-4 overflow-y-auto p-2 text-xs">
								{/* Quick Search Leads Result */}
								{commandQuery.trim() && (
									<div>
										<p className="mb-1 px-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
											Matching Leads ({commandFilteredLeads.length})
										</p>
										{commandFilteredLeads.length > 0 ? (
											<div className="space-y-1">
												{commandFilteredLeads.slice(0, 5).map((l) => (
													<button
														key={l.id}
														onClick={() => {
															setCommandPaletteOpen(false)
															selectLead(l.id)
														}}
														className="flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-slate-100"
													>
														<div className="min-w-0">
															<p className="truncate font-semibold text-slate-900">
																{l.name}
															</p>
															<p className="truncate text-[11px] text-slate-400">
																{l.company_name || l.email}
															</p>
														</div>
														<span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
															{l.qualification}
														</span>
													</button>
												))}
											</div>
										) : (
											<p className="px-2 py-3 text-center text-slate-400">
												No matching leads found.
											</p>
										)}
										{canViewCustomers && (
											<button
												onClick={() => {
													const q = commandQuery.trim()
													setCommandPaletteOpen(false)
													setCustomersSearchJump(q)
													navigate('customers')
												}}
												className="mt-1.5 flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/70 p-2 text-left text-slate-700 transition-colors hover:bg-slate-100"
											>
												<span className="flex items-center gap-2">
													<Users className="h-4 w-4 text-slate-500" />
													Search Customers for &ldquo;{commandQuery.trim()}
													&rdquo;
												</span>
												<span className="font-mono text-[10px] text-slate-400">
													Directory
												</span>
											</button>
										)}
									</div>
								)}

								{/* Navigation Shortcuts */}
								<div>
									<p className="mb-1 px-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
										Quick Navigation
									</p>
									<div className="space-y-1">
										{navItems.map((item) => {
											const Icon = item.icon
											return (
												<button
													key={item.id}
													onClick={() => {
														setCommandPaletteOpen(false)
														navigate(item.id)
													}}
													className="flex w-full items-center justify-between rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100"
												>
													<span className="flex items-center gap-2">
														<Icon className="h-4 w-4 text-slate-400" />
														{item.label}
													</span>
													<span className="font-mono text-[10px] text-slate-400">
														Jump
													</span>
												</button>
											)
										})}
									</div>
								</div>

								{/* Quick Operations */}
								<div>
									<p className="mb-1 px-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
										Quick Actions
									</p>
									<div className="space-y-1">
										<button
											onClick={() => {
												setCommandPaletteOpen(false)
												copyQuickReport()
											}}
											className="flex w-full items-center justify-between rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100"
										>
											<span className="flex items-center gap-2">
												<Share2 className="h-4 w-4 text-emerald-500" />
												Copy Executive Daily Report
											</span>
											<span className="font-mono text-[10px] text-slate-400">
												Markdown
											</span>
										</button>
										<button
											onClick={() => {
												setSoundEnabled(!soundEnabled)
												setCommandPaletteOpen(false)
											}}
											className="flex w-full items-center justify-between rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100"
										>
											<span className="flex items-center gap-2">
												{soundEnabled ? (
													<BellOff className="h-4 w-4 text-slate-400" />
												) : (
													<Bell className="h-4 w-4 text-emerald-500" />
												)}
												{soundEnabled
													? 'Mute Audio Chime'
													: 'Enable Inbound Audio Chime'}
											</span>
											<span className="font-mono text-[10px] text-slate-400">
												{soundEnabled ? 'Active' : 'Muted'}
											</span>
										</button>
									</div>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* MAIN CONTENT WRAPPER */}
			<div className="flex min-h-screen flex-col md:pl-64 print:pl-0">
				{/* TOP APPLICATION BAR */}
				<header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-sm sm:px-8 print:hidden">
					<div className="flex items-center gap-3">
						<button
							onClick={() => setMobileNavOpen(true)}
							className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 md:hidden"
						>
							<Menu className="h-4 w-4" />
						</button>

						{/* Breadcrumbs */}
						<nav
							aria-label="Breadcrumb"
							className="flex items-center gap-2 text-xs font-medium text-slate-500"
						>
							<span>Workspace</span>
							<ChevronRight className="h-3 w-3 text-slate-400" />
							<button
								onClick={() => {
									if (selected) {
										setSelected(null)
										const url = new URL(location.href)
										url.searchParams.delete('lead')
										history.pushState({}, '', url)
									} else if (view === 'customers' && customersSelected) {
										setCustomersSelected(null)
										const url = new URL(location.href)
										url.searchParams.delete('customer')
										url.searchParams.delete('dpage')
										history.pushState({}, '', url)
										window.dispatchEvent(new PopStateEvent('popstate'))
									}
								}}
								className={`cursor-pointer hover:text-slate-900 ${
									!selected && !(view === 'customers' && customersSelected)
										? 'font-semibold text-slate-900'
										: ''
								}`}
							>
								{view === 'overview' && 'Executive Overview'}
								{view === 'leads' && 'Leads Directory'}
								{view === 'followups' && 'Scheduled Follow-ups'}
								{view === 'insights' && 'Source Analytics'}
								{view === 'customers' && 'Customers'}
								{view === 'team' && 'Team Governance'}
							</button>
							{(selected || (view === 'customers' && customersSelected)) && (
								<>
									<ChevronRight className="h-3 w-3 text-slate-400" />
									<span className="max-w-[140px] truncate font-semibold text-slate-900 sm:max-w-[200px]">
										{selected
											? selected.name
											: customersSelected?.name}
									</span>
								</>
							)}
						</nav>
					</div>

					{/* Top Actions & Sync Indicator */}
					<div className="flex items-center gap-2 sm:gap-3">
						{/* Sound Chime Toggle */}
						<button
							onClick={() => setSoundEnabled(!soundEnabled)}
							title={
								soundEnabled
									? 'Inbound Audio Chime: Active'
									: 'Inbound Audio Chime: Muted'
							}
							className={`rounded-lg border p-1.5 text-xs transition-colors ${
								soundEnabled
									? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
									: 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
							}`}
						>
							{soundEnabled ? (
								<Bell className="h-3.5 w-3.5" />
							) : (
								<BellOff className="h-3.5 w-3.5" />
							)}
						</button>

						{/* Command Palette Button */}
						<button
							onClick={() => setCommandPaletteOpen(true)}
							className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 sm:inline-flex"
						>
							<Command className="h-3 w-3 text-slate-400" />
							<span>Search</span>
							<kbd className="py-0.2 rounded border border-slate-200 bg-white px-1 font-mono text-[10px] text-slate-400">
								⌘K
							</kbd>
						</button>

						<div
							className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 sm:flex"
							title={`Checks for new leads every ${EVENT_POLL_INTERVAL_MS / 1000}s while active`}
						>
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
							</span>
							Live Sync
						</div>

						<motion.button
							whileTap={{ scale: 0.95 }}
							disabled={view === 'customers' ? customersBusy : busy}
							onClick={() => {
								if (view === 'customers') {
									setCustomersRevision((n) => n + 1)
								} else {
									setRevision((n) => n + 1)
								}
							}}
							className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<RefreshCw
								className={`h-3.5 w-3.5 text-slate-500 ${
									(view === 'customers' ? customersBusy : busy)
										? 'animate-spin'
										: ''
								}`}
							/>
							<span className="hidden sm:inline">Refresh</span>
						</motion.button>
					</div>
				</header>

				{/* MAIN BODY AREA WITH ANIMATED TRANSITIONS */}
				<main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-24 sm:p-6 lg:p-8">
					{/* Animated Feedback Banners */}
					<AnimatePresence>
						{error && (
							<motion.div
								initial={{ opacity: 0, y: -8, scale: 0.98 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -8, scale: 0.98 }}
								transition={{ duration: 0.2 }}
								role="alert"
								className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 shadow-2xs"
							>
								<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
								<div className="flex-1">{error}</div>
								<button
									onClick={() => setError('')}
									className="text-rose-500 hover:text-rose-700"
								>
									<X className="h-4 w-4" />
								</button>
							</motion.div>
						)}

						{notice && (
							<motion.div
								initial={{ opacity: 0, y: -8, scale: 0.98 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -8, scale: 0.98 }}
								transition={{ duration: 0.2 }}
								role="status"
								className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 shadow-2xs"
							>
								<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
								<span>{notice}</span>
							</motion.div>
						)}
					</AnimatePresence>

					{/* 1. LEAD DETAIL VIEW */}
					<AnimatePresence mode="wait">
						{selected ? (
							<motion.section
								key={`lead-detail-${selected.id}`}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{ duration: 0.22, ease: 'easeOut' }}
								className="space-y-6"
							>
								{/* Back Button & Dossier Hero Banner */}
								<div className="space-y-4">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<motion.button
											whileTap={{ scale: 0.97 }}
											className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
											onClick={() => {
												setSelected(null)
												setDetailUpdateNotice(null)
												const url = new URL(location.href)
												url.searchParams.delete('lead')
												history.pushState({}, '', url)
											}}
										>
											<ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
											Back to list
										</motion.button>

										{detailUpdateNotice && (
											<div
												role="status"
												className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-2xs"
											>
												<Bell className="h-3.5 w-3.5 text-amber-600" />
												<span>
													{detailUpdateNotice === 'new_lead'
														? 'New lead arrived (list updated).'
														: 'Lead changes detected (list updated).'}
												</span>
												<button
													type="button"
													onClick={() => void openLead(selected.id)}
													className="rounded border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-900 transition-colors hover:bg-amber-100"
												>
													Reload dossier
												</button>
											</div>
										)}
									</div>

									{/* Hero Lead Dossier Card */}
									<div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
										<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
											<div className="flex items-start gap-4">
												<div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white shadow-xs">
													{getInitials(selected.name)}
												</div>
												<div className="space-y-1">
													<div className="flex flex-wrap items-center gap-2.5">
														<h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
															{selected.name}
														</h1>
														<span
															className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
																selected.qualification === 'qualified'
																	? 'border-emerald-200 bg-emerald-50 text-emerald-700'
																	: selected.qualification === 'spam'
																		? 'border-rose-200 bg-rose-50 text-rose-700'
																		: selected.qualification === 'not_a_fit'
																			? 'border-slate-200 bg-slate-100 text-slate-700'
																			: 'border-amber-200 bg-amber-50 text-amber-700'
															}`}
														>
															{selected.qualification.replaceAll('_', ' ')}
														</span>
														<span
															className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
																selected.priority === 'high'
																	? 'border-rose-200 bg-rose-50 text-rose-700'
																	: selected.priority === 'normal'
																		? 'border-blue-200 bg-blue-50 text-blue-700'
																		: 'border-slate-200 bg-slate-100 text-slate-600'
															}`}
														>
															{selected.priority} priority
														</span>
														<span
															className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
																(selected.ai_score ?? 0) >= 75
																	? 'border-emerald-200 bg-emerald-50 text-emerald-700'
																	: (selected.ai_score ?? 0) >= 50
																		? 'border-amber-200 bg-amber-50 text-amber-700'
																		: 'border-slate-200 bg-slate-100 text-slate-600'
															}`}
														>
															<Sparkles className="h-3 w-3" />
															AI Score: {selected.ai_score ?? 0}/100
														</span>
													</div>

													<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
														<span className="flex items-center gap-1.5">
															<Building className="h-3.5 w-3.5 text-slate-400" />
															{selected.company_name ||
																'Individual / No Company'}
														</span>
														<span className="flex items-center gap-1.5">
															<Globe className="h-3.5 w-3.5 text-slate-400" />
															{selected.country || 'Global / Not Specified'}
															{(selected.ip_city || selected.ip_country) && (
																<span className="font-mono text-[11px] text-slate-400">
																	(IP:{' '}
																	{[selected.ip_city, selected.ip_country]
																		.filter(Boolean)
																		.join(', ')}
																	)
																</span>
															)}
														</span>
														<span className="flex items-center gap-1.5 text-slate-400">
															<Clock className="h-3.5 w-3.5" />
															Received: {formatDate(selected.created_at)}
														</span>
													</div>

													{/* Quick Contact Chips */}
													<div className="flex flex-wrap items-center gap-2 pt-2">
														{selected.email && (
															<button
																onClick={() =>
																	copyToClipboard(selected.email!, 'email')
																}
																className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
															>
																<Mail className="h-3 w-3 text-slate-400" />
																{selected.email}
																{copiedField === 'email' ? (
																	<Check className="ml-1 h-3 w-3 text-emerald-600" />
																) : (
																	<Copy className="ml-1 h-3 w-3 text-slate-400" />
																)}
															</button>
														)}

														{selected.phone && (
															<button
																onClick={() =>
																	copyToClipboard(selected.phone!, 'phone')
																}
																className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
															>
																<Phone className="h-3 w-3 text-slate-400" />
																{selected.phone}
																{copiedField === 'phone' ? (
																	<Check className="ml-1 h-3 w-3 text-emerald-600" />
																) : (
																	<Copy className="ml-1 h-3 w-3 text-slate-400" />
																)}
															</button>
														)}
													</div>
												</div>
											</div>

											<div className="flex items-center gap-2 pt-2 md:pt-0">
												<a
													href="#contact-activity"
													className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-2xs transition-colors hover:bg-slate-800"
												>
													<MessageSquare className="h-3.5 w-3.5" />
													Outreach & Actions
												</a>
											</div>
										</div>
									</div>
								</div>

								{/* 2-Column Master Dossier Grid */}
								<div className="grid gap-6 lg:grid-cols-12">
									{/* LEFT COLUMN (7 COLS): Requirements, Assessment, Contact, Notes */}
									<div className="space-y-6 lg:col-span-7">
										{/* Requirements & Evidence */}
										<article className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
											<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase">
												<MessageSquare className="h-4 w-4 text-slate-400" />
												Inquiry Message & Stated Requirements
											</h2>
											<div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 text-xs leading-relaxed whitespace-pre-wrap text-slate-800">
												{selected.message || 'No written message provided.'}
											</div>

											<div className="mt-4">
												<p className="mb-2 text-xs font-semibold tracking-wider text-slate-700 uppercase">
													Observed Verification Signals
												</p>
												<div className="flex flex-wrap gap-2">
													{leadEvidence(selected).map((e) => (
														<span
															key={e}
															className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs"
														>
															<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
															{e}
														</span>
													))}
												</div>
											</div>

											<p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-normal text-slate-400">
												Observed signals reflect client session data, not
												verified credit or purchase intent. Missing tracking
												signals do not imply low lead quality.
											</p>
										</article>

										{/* Assessment & Next Action */}
										<article className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
											<div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
												<h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase">
													<CheckCircle2 className="h-4 w-4 text-emerald-600" />
													Staff Qualification & Next Action
												</h2>
												<span className="font-mono text-[11px] text-slate-400">
													v{selected.assessment_version} · Safe Concurrency
												</span>
											</div>

											<div className="grid gap-4 sm:grid-cols-2">
												<label className="grid gap-1.5 text-xs font-semibold text-slate-700">
													Qualification Verdict
													<select
														disabled={!canEdit}
														className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-normal text-slate-900 shadow-2xs focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none disabled:opacity-50"
														value={selected.qualification}
														onChange={(e) =>
															setSelected({
																...selected,
																qualification: e.target
																	.value as IntelligenceLead['qualification'],
															})
														}
													>
														<option value="not_assessed">Not assessed</option>
														<option value="qualified">Qualified</option>
														<option value="not_a_fit">Not a fit</option>
														<option value="spam">Spam / Bot</option>
													</select>
												</label>

												<label className="grid gap-1.5 text-xs font-semibold text-slate-700">
													Urgency Priority
													<select
														disabled={!canEdit}
														className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-normal text-slate-900 capitalize shadow-2xs focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none disabled:opacity-50"
														value={selected.priority}
														onChange={(e) =>
															setSelected({
																...selected,
																priority: e.target
																	.value as IntelligenceLead['priority'],
															})
														}
													>
														<option value="high">High priority</option>
														<option value="normal">Normal priority</option>
														<option value="low">Low priority</option>
													</select>
												</label>

												<label className="grid gap-1.5 text-xs font-semibold text-slate-700 sm:col-span-2">
													Assessment Justification & Rationale
													<textarea
														disabled={!canEdit}
														rows={2}
														maxLength={1000}
														placeholder="Reason for qualification or disqualification..."
														className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-normal text-slate-900 shadow-2xs focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none disabled:opacity-50"
														value={selected.reason}
														onChange={(e) =>
															setSelected({
																...selected,
																reason: e.target.value,
															})
														}
													/>
												</label>

												<label className="grid gap-1.5 text-xs font-semibold text-slate-700">
													Planned Next Action
													<input
														disabled={!canEdit}
														maxLength={500}
														placeholder="e.g. Prepare sample quote, call buyer"
														className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-normal text-slate-900 shadow-2xs focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none disabled:opacity-50"
														value={selected.next_action}
														onChange={(e) =>
															setSelected({
																...selected,
																next_action: e.target.value,
															})
														}
													/>
												</label>

												<label className="grid gap-1.5 text-xs font-semibold text-slate-700">
													Follow-up Target (Local Time)
													<input
														disabled={!canEdit}
														type="datetime-local"
														className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-normal text-slate-900 shadow-2xs focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none disabled:opacity-50"
														value={
															selected.follow_up_at
																? new Date(
																		Date.parse(selected.follow_up_at) -
																			new Date(
																				selected.follow_up_at,
																			).getTimezoneOffset() *
																				60000,
																	)
																		.toISOString()
																		.slice(0, 16)
																: ''
														}
														onChange={(e) =>
															setSelected({
																...selected,
																follow_up_at: e.target.value
																	? new Date(e.target.value).toISOString()
																	: null,
															})
														}
													/>
												</label>
											</div>

											{canEdit && (
												<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
													<span className="text-[11px] text-slate-400">
														Changes persist with optimistic concurrency checks.
													</span>
													<motion.button
														whileTap={{ scale: 0.96 }}
														disabled={saving}
														className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-2xs transition-colors hover:bg-slate-800 disabled:opacity-50"
														onClick={saveAssessment}
													>
														{saving ? (
															<>
																<Loader2 className="h-3.5 w-3.5 animate-spin" />
																Saving changes…
															</>
														) : (
															<>
																<Check className="h-3.5 w-3.5" />
																Save Assessment
															</>
														)}
													</motion.button>
												</div>
											)}
										</article>

										{/* AI Lead Intelligence & Outreach Brief */}
										{(selected.ai_summary || selected.ai_pitch_draft) && (
											<article className="rounded-xl border border-indigo-200/70 bg-linear-to-br from-indigo-50/50 via-white to-white p-5 shadow-xs">
												<div className="mb-3 flex items-center justify-between gap-2 border-b border-indigo-100 pb-3">
													<h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-indigo-900 uppercase">
														<Sparkles className="h-4 w-4 text-indigo-600" />
														AI Intent Brief &amp; Pitch Draft
													</h2>
													<span className="rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
														Score {selected.ai_score ?? 0}/100
													</span>
												</div>
												{selected.ai_summary && (
													<p className="rounded-lg border border-indigo-100/80 bg-white/90 p-3 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
														{selected.ai_summary}
													</p>
												)}
												{selected.ai_pitch_draft && (
													<div className="mt-3 rounded-lg border border-slate-200/80 bg-white p-3">
														<div className="mb-2 flex items-center justify-between gap-2">
															<span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
																Recommended First-Touch Email
															</span>
															{canEdit && (
																<button
																	type="button"
																	onClick={() =>
																		setExternalEmailDraft({
																			key: Date.now(),
																			subject: `Following up on your ${selected.company_name || 'inquiry'} request`,
																			body: selected.ai_pitch_draft || '',
																		})
																	}
																	className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-indigo-700"
																>
																	Use AI Pitch in Email
																</button>
															)}
														</div>
														<p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-600">
															{selected.ai_pitch_draft}
														</p>
													</div>
												)}
											</article>
										)}

										{/* Contact & Activity Box with Quick Templates */}
										<div id="contact-activity">
											<LeadContactClient
												key={selected.id + selected.updated_at}
												lead={selected}
												canEdit={canEdit}
												canAssign={canManage}
												staff={staff}
												externalDraft={externalEmailDraft}
												onSaved={(latestEventId) => {
													if (latestEventId !== undefined) {
														recordLatestEventId(latestEventId)
													} else {
														lastCheckAtRef.current = Date.now()
													}
													setDetailUpdateNotice(null)
													void openLead(selected.id)
													setRevision((n) => n + 1)
												}}
											/>
										</div>

										{/* Communication History Notes */}
										<article className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
											<div className="flex items-center justify-between border-b border-slate-100 pb-3">
												<h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase">
													<Clock className="h-4 w-4 text-slate-400" />
													Recorded Interactions Timeline
												</h2>
												<span className="text-xs text-slate-400">
													Last touch: {formatDate(selected.last_contacted_at)}
												</span>
											</div>

											{notes.length ? (
												<div className="mt-4 space-y-3">
													{notes.map((n) => (
														<div
															key={n.id}
															className="rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 transition-colors"
														>
															<p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-800">
																{n.content}
															</p>
															<div className="mt-2 flex items-center justify-between border-t border-slate-200/40 pt-2 text-[11px] text-slate-400">
																<span className="flex items-center gap-1 font-medium text-slate-600">
																	<User className="h-3 w-3" />
																	{n.author_name}
																</span>
																<span>{formatDate(n.created_at)}</span>
															</div>
														</div>
													))}
												</div>
											) : (
												<div className="py-8 text-center text-xs text-slate-400">
													No interaction notes recorded yet.
												</div>
											)}
										</article>
									</div>

									{/* RIGHT COLUMN (5 COLS): Attribution, Session Activity */}
									<div className="space-y-6 lg:col-span-5">
										{/* Acquisition & Attribution Intelligence */}
										<article className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
											<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase">
												<Compass className="h-4 w-4 text-slate-400" />
												Acquisition & Attribution
											</h2>

											<dl className="divide-y divide-slate-100 text-xs">
												<div className="flex items-center justify-between py-2.5">
													<dt className="text-slate-500">Channel</dt>
													<dd>
														<span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
															{leadChannel(
																selected.utm_source,
																selected.utm_medium,
															)}
														</span>
													</dd>
												</div>

												<div className="flex items-center justify-between py-2.5">
													<dt className="text-slate-500">UTM Source / Medium</dt>
													<dd className="font-mono text-slate-800">
														{selected.utm_source || '—'} /{' '}
														{selected.utm_medium || '—'}
													</dd>
												</div>

												<div className="flex items-center justify-between py-2.5">
													<dt className="text-slate-500">Campaign</dt>
													<dd className="font-mono text-slate-800">
														{selected.utm_campaign || '—'}
													</dd>
												</div>

												{(selected.utm_content || selected.utm_term) && (
													<div className="flex items-center justify-between py-2.5">
														<dt className="text-slate-500">
															Content / Term
														</dt>
														<dd className="max-w-[60%] truncate font-mono text-slate-800">
															{[selected.utm_content, selected.utm_term]
																.filter(Boolean)
																.join(' · ')}
														</dd>
													</div>
												)}

												<div className="flex items-center justify-between py-2.5">
													<dt className="text-slate-500">Ad Click ID</dt>
													<dd className="max-w-[60%] truncate font-mono text-slate-800">
														{selected.click_id || '—'}
													</dd>
												</div>

												<div className="flex items-center justify-between py-2.5">
													<dt className="text-slate-500">Form Placement</dt>
													<dd className="text-slate-800">
														{selected.source || '—'}
													</dd>
												</div>

												<div className="flex items-center justify-between py-2.5">
													<dt className="text-slate-500">GeoIP Location</dt>
													<dd className="font-mono text-slate-800">
														{[selected.ip_city, selected.ip_country]
															.filter(Boolean)
															.join(', ') || '—'}
													</dd>
												</div>

												<div className="flex items-center justify-between py-2.5">
													<dt className="text-slate-500">First Touch</dt>
													<dd className="font-mono text-slate-800">
														{attr?.first_touch?.utm_source
															? `${attr.first_touch.utm_source} / ${attr.first_touch.utm_medium || '—'}`
															: '—'}
													</dd>
												</div>

												<div className="flex items-center justify-between py-2.5">
													<dt className="text-slate-500">
														Latest Recorded Touch
													</dt>
													<dd className="font-mono text-slate-800">
														{attr?.last_touch?.utm_source
															? `${attr.last_touch.utm_source} / ${attr.last_touch.utm_medium || '—'}`
															: '—'}
													</dd>
												</div>

												{(attr?.referrer || attr?.internal_ref) && (
													<div className="flex items-center justify-between py-2.5">
														<dt className="text-slate-500">
															Referrer / Internal Ref
														</dt>
														<dd className="max-w-[60%] truncate font-mono text-slate-700">
															{[attr.referrer, attr.internal_ref]
																.filter(Boolean)
																.join(' · ')}
														</dd>
													</div>
												)}

												<div className="py-2.5">
													<dt className="mb-1.5 text-slate-500">
														Consent Signals
													</dt>
													<dd className="flex flex-wrap gap-1.5">
														<span
															className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
																consentInfo?.marketing
																	? 'border-emerald-200 bg-emerald-50 text-emerald-700'
																	: 'border-slate-200 bg-slate-50 text-slate-500'
															}`}
														>
															Form Marketing:{' '}
															{consentInfo?.marketing ? 'Yes' : 'No'}
														</span>
														<span
															className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
																consentInfo?.marketingCookie
																	? 'border-blue-200 bg-blue-50 text-blue-700'
																	: 'border-slate-200 bg-slate-50 text-slate-500'
															}`}
														>
															Marketing Cookie:{' '}
															{consentInfo?.marketingCookie ? 'Yes' : 'No'}
														</span>
														{consentInfo?.dossierCommunication && (
															<span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
																Dossier Consent: Yes
															</span>
														)}
													</dd>
												</div>

												<div className="py-2.5">
													<dt className="mb-1 text-slate-500">
														First Landing Page
													</dt>
													<dd className="rounded border border-slate-100 bg-slate-50 p-2 font-mono text-[11px] break-all text-slate-700">
														{attr?.first_touch?.landing_page || '—'}
													</dd>
												</div>

												<div className="py-2.5">
													<dt className="mb-1 text-slate-500">
														Submission Page URL
													</dt>
													<dd className="rounded border border-slate-100 bg-slate-50 p-2 font-mono text-[11px] break-all text-slate-700">
														{selected.landing_page_url || '—'}
													</dd>
												</div>
											</dl>

											{safeWebUrl(selected.landing_page_url) && (
												<a
													className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 hover:text-slate-950 hover:underline"
													target="_blank"
													rel="noopener noreferrer"
													href={safeWebUrl(selected.landing_page_url)}
												>
													<ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
													Open submission page in new tab
												</a>
											)}
										</article>

										{/* Website Activity Timeline */}
										<article className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
											<div className="flex items-center justify-between border-b border-slate-100 pb-3">
												<h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase">
													<Activity className="h-4 w-4 text-slate-400" />
													Observed Website Session Journey
												</h2>
												<span className="text-[11px] text-slate-400">
													{activity.length} actions
												</span>
											</div>
											<p className="mt-2 text-[11px] text-slate-400">
												Pre-submission bounded session snapshot; not complete
												cross-device or post-conversion history.
											</p>

											{activity.length ? (
												<div className="mt-4 max-h-[380px] overflow-y-auto pr-1">
													<ol className="relative ml-2 space-y-4 border-l border-slate-200">
														{activity.map((a, i) => (
															<li
																key={`${a.timestamp}-${i}`}
																className="ml-4 text-xs"
															>
																<span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
																<div className="font-medium text-slate-900">
																	{a.event ? (
																		<span className="mr-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
																			{a.event.replaceAll('_', ' ')}:
																		</span>
																	) : null}
																	{a.title || a.path}
																</div>
																<p className="mt-0.5 font-mono text-[11px] break-all text-slate-500">
																	{a.path}
																</p>
																<time className="mt-0.5 block text-[10px] text-slate-400">
																	{formatDate(a.timestamp)}
																</time>
															</li>
														))}
													</ol>
												</div>
											) : (
												<div className="py-8 text-center text-xs text-slate-400">
													Limited activity recorded. Tracking may not have been
													consented.
												</div>
											)}
										</article>
									</div>
								</div>
							</motion.section>
						) : view === 'overview' ? (
							/* =========================================================================
						   EXECUTIVE DASHBOARD & EXECUTIVE DIGEST
						========================================================================= */
							<motion.section
								key="overview-section"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{ duration: 0.22, ease: 'easeOut' }}
								className="space-y-6"
							>
								{/* Section Header with Date Range Filter */}
								<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
									<div>
										<h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
											<LayoutDashboard className="h-6 w-6 text-slate-900" />
											Executive Overview
										</h1>
										<p className="mt-1 text-xs text-slate-500">
											Pipeline conversion health, urgent inbound SLA, and
											instant executive digest.
										</p>
									</div>

									<div className="flex flex-wrap items-center gap-2 print:hidden">
										{busy && overviewLoaded && (
											<span
												role="status"
												className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-2xs"
											>
												<Loader2 className="h-3 w-3 animate-spin text-slate-500" />
												Updating…
											</span>
										)}
										{/* Date Range Selector */}
										<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-2xs">
											<Calendar className="ml-1.5 h-3.5 w-3.5 text-slate-400" />
											<select
												aria-label="Reporting date range"
												value={dateRange}
												onChange={(e) => setDateRange(e.target.value)}
												className="cursor-pointer bg-transparent py-1 pr-2 text-xs font-medium text-slate-700 focus:outline-none"
											>
												<option value="all">All Time (UTC)</option>
												<option value="today">Today (UTC)</option>
												<option value="yesterday">Yesterday (UTC)</option>
												<option value="7d">Last 7 Days</option>
												<option value="30d">Last 30 Days</option>
												<option value="month">This Month</option>
											</select>
										</div>

										<motion.button
											whileTap={{ scale: 0.96 }}
											onClick={copyQuickReport}
											className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-2xs transition-colors hover:bg-slate-800"
										>
											{reportCopied ? (
												<>
													<Check className="h-3.5 w-3.5 text-emerald-400" />
													Report Copied!
												</>
											) : (
												<>
													<Share2 className="h-3.5 w-3.5" />
													Copy Quick Digest
												</>
											)}
										</motion.button>
										<motion.button
											whileTap={{ scale: 0.96 }}
											onClick={() => window.print()}
											className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
										>
											<Printer className="h-3.5 w-3.5 text-slate-500" />
											Print / PDF
										</motion.button>
									</div>
								</div>

								{!overviewLoaded && busy ? (
									/* SKELETON LOADING STATE (prevents 0-value & empty-chart flash) */
									<div
										role="status"
										aria-label="Loading Executive Overview"
										className="space-y-6"
									>
										<div className="h-28 animate-pulse rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs" />
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
											{Array.from({ length: 4 }).map((_, i) => (
												<div
													key={i}
													className="h-24 animate-pulse rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs"
												/>
											))}
										</div>
										<div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
											<div className="h-80 animate-pulse rounded-2xl border border-slate-200/80 bg-white xl:col-span-7 2xl:col-span-8" />
											<div className="h-80 animate-pulse rounded-2xl border border-slate-200/80 bg-white xl:col-span-5 2xl:col-span-4" />
										</div>
										<div className="h-64 animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
									</div>
								) : (
									<div
										className={`space-y-6 transition-opacity duration-200 ${
											busy ? 'opacity-75' : 'opacity-100'
										}`}
									>
										{/* EXECUTIVE SNAPSHOT BRIEF */}
										<div className="rounded-2xl border border-emerald-200/80 bg-linear-to-r from-emerald-50/50 via-white to-slate-50/50 p-5 shadow-xs sm:p-6">
											<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
												<div>
													<div className="flex flex-wrap items-center gap-2">
														<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
															<Zap className="h-3 w-3 text-emerald-600" />
															Today&apos;s Executive Digest
														</span>
														<span className="text-xs text-slate-500">
															{new Date().toLocaleDateString('en-US', {
																weekday: 'short',
																month: 'short',
																day: 'numeric',
															})}
														</span>
														{topSource && (
															<span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
																Top Volume:{' '}
																<strong className="text-slate-900">
																	{formatSourceName(topSource.source)}
																</strong>
															</span>
														)}
														{topConvertingSource && (
															<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-white px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
																Best Qual Rate:{' '}
																<strong>
																	{formatSourceName(
																		topConvertingSource.source,
																	)}{' '}
																	(
																	{Math.round(
																		(topConvertingSource.qualified /
																			topConvertingSource.assessed) *
																			100,
																	)}
																	%)
																</strong>
															</span>
														)}
													</div>
													<p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-700">
														Currently tracking{' '}
														<strong className="text-slate-900">
															{total.toLocaleString('en-US')} inquiries
														</strong>{' '}
														{dateRange === 'all'
															? 'across all time'
															: `in selected period [${dateRange}]`}
														. Overall qualified rate is{' '}
														<strong className="text-emerald-700">
															{insightAvgQualRate}%
														</strong>
														.
														{overdueCount > 0 ? (
															<span className="ml-1 font-semibold text-rose-700">
																Immediate action required on {overdueCount}{' '}
																overdue follow-up tasks.
															</span>
														) : (
															<span className="ml-1 font-semibold text-emerald-700">
																All scheduled follow-ups are currently on track.
															</span>
														)}
													</p>
												</div>

												<div className="flex shrink-0 items-center gap-2 print:hidden">
													<motion.button
														whileTap={{ scale: 0.96 }}
														onClick={() => navigate('leads')}
														className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
													>
														View All Leads
														<ChevronRight className="h-3.5 w-3.5 text-slate-400" />
													</motion.button>
												</div>
											</div>
										</div>

										{/* KPI SUMMARY CARDS */}
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
											<button
												type="button"
												onClick={() => {
													setFilter('all')
													setSearch('')
													navigate('leads')
												}}
												className="group cursor-pointer rounded-xl border border-slate-200/90 bg-white p-5 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
											>
												<div className="flex items-center justify-between text-xs text-slate-500">
													<span>Inbound Inquiries</span>
													<Inbox className="h-4 w-4 text-blue-500" />
												</div>
												<p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600">
													{total.toLocaleString('en-US')}
												</p>
												<span className="mt-1 block text-[11px] text-slate-400">
													{newInquiryCount} new in inbox
												</span>
											</button>

											<button
												type="button"
												onClick={() => {
													setFilter('all')
													setSearch('')
													navigate('leads')
												}}
												className="group cursor-pointer rounded-xl border border-slate-200/90 bg-white p-5 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
											>
												<div className="flex items-center justify-between text-xs text-slate-500">
													<span>High Priority Inquiries</span>
													<Flame className="h-4 w-4 text-rose-500" />
												</div>
												<p className="mt-2 text-2xl font-bold tracking-tight text-rose-600">
													{highPriorityCount.toLocaleString('en-US')}
												</p>
												<span className="mt-1 block text-[11px] text-slate-400">
													{total > 0
														? `${Math.round((highPriorityCount / total) * 100)}% of period volume`
														: 'High priority in selected period'}
												</span>
											</button>

											<button
												type="button"
												onClick={() => navigate('followups')}
												className="group cursor-pointer rounded-xl border border-slate-200/90 bg-white p-5 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
											>
												<div className="flex items-center justify-between text-xs text-slate-500">
													<span>Scheduled Follow-ups</span>
													<Clock className="h-4 w-4 text-amber-500" />
												</div>
												<p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600">
													{followupCounts.total.toLocaleString('en-US')}
												</p>
												<span
													className={`mt-1 block text-[11px] font-medium ${
														overdueCount > 0
															? 'text-rose-600'
															: 'text-slate-400'
													}`}
												>
													{overdueCount > 0
														? `${overdueCount} overdue · all open leads`
														: 'All open leads on track'}
												</span>
											</button>

											<button
												type="button"
												onClick={() => {
													setFilter('qualified')
													setSearch('')
													navigate('leads')
												}}
												className="group cursor-pointer rounded-xl border border-slate-200/90 bg-white p-5 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
											>
												<div className="flex items-center justify-between text-xs text-slate-500">
													<span>Overall Qual Rate</span>
													<TrendingUp className="h-4 w-4 text-emerald-500" />
												</div>
												<p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
													{insightAvgQualRate}%
												</p>
												<span className="mt-1 block text-[11px] text-slate-400">
													{insightQualified} of {insightAssessed} assessed
													qualified
												</span>
											</button>
										</div>

										{/* VISUAL ANALYTICS ROW 1: Lead Velocity Curve & Conversion Funnel */}
										<div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-12">
											<div className="flex flex-col xl:col-span-7 2xl:col-span-8">
												<LeadVolumeTrendChart
													trends={trends}
													timeframe={dateRange}
													totalLeads={total}
													qualifiedLeads={insightQualified}
												/>
											</div>
											<div className="flex flex-col xl:col-span-5 2xl:col-span-4">
												<LeadPipelineFunnelChart
													stages={stages}
													qualifications={qualifications}
													totalLeads={total}
													onOpenFilter={(filterKey) => {
														setFilter(filterKey)
														setSearch('')
														setPage(1)
														navigate(
															filterKey === 'followups'
																? 'followups'
																: 'leads',
														)
													}}
												/>
											</div>
										</div>

										{/* VISUAL ANALYTICS: Traffic Acquisition & Channel Quality */}
										<div>
											<LeadSourceDistributionChart
												sources={sources}
												totalLeads={total}
												onSelectSource={(src) => {
													if (src === '__other__') {
														navigate('insights')
														return
													}
													setFilter('all')
													setSearch('')
													setUtmSource(src)
													setPage(1)
													navigate('leads', { keepUtmSource: true })
												}}
											/>
										</div>

										{/* 2-COLUMN ACTION CENTER */}
										<div className="grid gap-6 lg:grid-cols-2">
											{/* Urgent Inquiries Section */}
											<div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
												<div>
													<div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
														<h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase">
															<Flame className="h-4 w-4 text-rose-500" />
															Fresh &amp; Urgent Inquiries Needing Outreach
														</h2>
														<button
															onClick={() => {
																setSearch('')
																setFilter('new')
																navigate('leads')
															}}
															className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 print:hidden"
														>
															View all
														</button>
													</div>

													{urgentInquiries.length > 0 ? (
														<div className="space-y-3">
															{urgentInquiries.slice(0, 5).map((l) => {
																const sla = getSlaStatus(l.created_at, l.status)
																return (
																	<div
																		key={l.id}
																		onClick={() => selectLead(l.id)}
																		className="group flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-100/70"
																	>
																		<div className="flex min-w-0 items-center gap-3">
																			<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
																				{getInitials(l.name)}
																			</div>
																			<div className="min-w-0">
																				<p className="truncate text-xs font-semibold text-slate-900 group-hover:text-blue-600">
																					{l.name}
																				</p>
																				<p className="truncate text-[11px] text-slate-400">
																					{l.company_name || l.email} ·{' '}
																					{leadChannel(
																						l.utm_source,
																						l.utm_medium,
																					)}
																				</p>
																			</div>
																		</div>
																		<div className="flex shrink-0 items-center gap-2">
																			{l.priority === 'high' && (
																				<span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
																					High
																				</span>
																			)}
																			{sla && (
																				<span
																					className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${sla.badge}`}
																				>
																					<span
																						className={`h-1.5 w-1.5 rounded-full ${sla.dot}`}
																					/>
																					{sla.label}
																				</span>
																			)}
																			<span className="text-[11px] text-slate-400">
																				{formatShortDate(l.created_at)}
																			</span>
																		</div>
																	</div>
																)
															})}
														</div>
													) : (
														<div className="py-8 text-center text-xs text-slate-400">
															No urgent inquiries pending outreach.
														</div>
													)}
												</div>

												<motion.button
													whileTap={{ scale: 0.98 }}
													onClick={() => {
														setFilter('all')
														setSearch('')
														navigate('leads')
													}}
													className="mt-4 w-full cursor-pointer rounded-lg border border-slate-200 bg-white py-2 text-center text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 print:hidden"
												>
													Open Leads Directory
												</motion.button>
											</div>

											{/* Upcoming & Overdue Follow-ups */}
											<div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
												<div>
													<div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
														<h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase">
															<Clock className="h-4 w-4 text-amber-500" />
															Upcoming &amp; Overdue Follow-ups
														</h2>
														<button
															onClick={() => navigate('followups')}
															className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 print:hidden"
														>
															View all
														</button>
													</div>

													{overviewFollowups.length > 0 ? (
														<div className="space-y-3">
															{overviewFollowups.slice(0, 5).map((l) => {
																const isOverdue =
																	l.follow_up_at &&
																	Date.parse(l.follow_up_at) < Date.now()
																return (
																	<div
																		key={l.id}
																		onClick={() => selectLead(l.id)}
																		className="group flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-100/70"
																	>
																		<div className="min-w-0 pr-3">
																			<p className="truncate text-xs font-semibold text-slate-900 group-hover:text-blue-600">
																				{l.name}
																			</p>
																			<p className="truncate text-[11px] text-slate-500">
																				{l.next_action || 'Follow up'}
																			</p>
																		</div>
																		<div className="shrink-0 text-right">
																			<span
																				className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
																					isOverdue
																						? 'border border-rose-200 bg-rose-50 font-semibold text-rose-700'
																						: 'bg-slate-100 text-slate-600'
																				}`}
																			>
																				{isOverdue && (
																					<AlertTriangle className="h-3 w-3 text-rose-500" />
																				)}
																				{formatDate(l.follow_up_at)}
																			</span>
																		</div>
																	</div>
																)
															})}
														</div>
													) : (
														<div className="py-8 text-center text-xs text-slate-400">
															No scheduled follow-ups pending.
														</div>
													)}
												</div>

												<motion.button
													whileTap={{ scale: 0.98 }}
													onClick={() => navigate('followups')}
													className="mt-4 w-full cursor-pointer rounded-lg border border-slate-200 bg-white py-2 text-center text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 print:hidden"
												>
													Manage All Scheduled Follow-ups
												</motion.button>
											</div>
										</div>
									</div>
								)}
							</motion.section>
						) : view === 'customers' ? (
							<CustomersClient
								externalRefresh={customersRevision}
								externalSearch={customersSearchJump}
								onExternalSearchConsumed={() => setCustomersSearchJump(null)}
								onBusyChange={setCustomersBusy}
								onCustomerChange={setCustomersSelected}
								onOpenLead={(leadId) => {
									setCustomersSelected(null)
									setView('leads')
									const url = new URL(location.href)
									url.search = ''
									url.searchParams.set('view', 'leads')
									url.searchParams.set('lead', leadId)
									history.pushState({}, '', url)
									void openLead(leadId)
								}}
							/>
						) : view === 'team' ? (
							<motion.section
								key="team-section"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{ duration: 0.22, ease: 'easeOut' }}
							>
								<StaffManagement
									authMode={authMode}
									currentStaff={user}
									initialStaff={initialStaff.map((s) => ({
										...s,
										password_hash: '',
									}))}
								/>
							</motion.section>
						) : view === 'insights' ? (
							<motion.section
								key="insights-section"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{ duration: 0.22, ease: 'easeOut' }}
								className="space-y-6"
							>
								<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
									<div>
										<h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
											Lead Quality by Source
										</h1>
										<p className="mt-1 text-xs text-slate-500">
											Inquiries within authorized scope. Newsletter and popup
											subscribers excluded. Qualification rate is calculated
											over assessed inquiries.
										</p>
									</div>

									{/* Date Range Selector */}
									<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-2xs">
										<Calendar className="ml-1.5 h-3.5 w-3.5 text-slate-400" />
										<select
											value={dateRange}
											onChange={(e) => setDateRange(e.target.value)}
											className="cursor-pointer bg-transparent py-1 pr-2 text-xs font-medium text-slate-700 focus:outline-none"
										>
											<option value="all">All Time (UTC)</option>
											<option value="today">Today (UTC)</option>
											<option value="yesterday">Yesterday (UTC)</option>
											<option value="7d">Last 7 Days</option>
											<option value="30d">Last 30 Days</option>
											<option value="month">This Month</option>
										</select>
									</div>
								</div>

								{/* Summary KPI Cards */}
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
									<div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
										<div className="flex items-center justify-between text-xs text-slate-500">
											<span>Total Inquiries</span>
											<Users className="h-4 w-4 text-slate-400" />
										</div>
										<p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
											{insightTotalLeads}
										</p>
										<span className="mt-1 block text-[11px] text-slate-400">
											Scoped to your role permissions
										</span>
									</div>

									<div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
										<div className="flex items-center justify-between text-xs text-slate-500">
											<span>Assessed Leads</span>
											<CheckCircle2 className="h-4 w-4 text-blue-500" />
										</div>
										<p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
											{insightAssessed}
										</p>
										<span className="mt-1 block text-[11px] text-slate-400">
											{insightTotalLeads
												? `${Math.round((insightAssessed / insightTotalLeads) * 100)}% review coverage`
												: '0% coverage'}
										</span>
									</div>

									<div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
										<div className="flex items-center justify-between text-xs text-slate-500">
											<span>Qualification Rate</span>
											<TrendingUp className="h-4 w-4 text-emerald-500" />
										</div>
										<p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
											{insightAvgQualRate}%
										</p>
										<span className="mt-1 block text-[11px] text-slate-400">
											{insightQualified} staff-qualified leads
										</span>
									</div>

									<div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
										<div className="flex items-center justify-between text-xs text-slate-500">
											<span>Low Quality / Spam</span>
											<AlertTriangle className="h-4 w-4 text-rose-500" />
										</div>
										<p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
											{insightSpam}
										</p>
										<span className="mt-1 block text-[11px] text-slate-400">
											Filtered spam inquiries
										</span>
									</div>
								</div>

								{/* Cloudflare Analytics Engine Funnel & Web Vitals Rollups */}
								<EdgeTelemetryCard dateRange={dateRange} />

								{/* Insights Sub-Tabs */}
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
										{(
											[
												{ id: 'sources', label: `Sources / Medium (${sources.length})` },
												{ id: 'campaigns', label: `Campaigns (${campaigns.length})` },
												{ id: 'placements', label: `Form Placements (${placements.length})` },
												{ id: 'countries', label: `GeoIP Countries (${countries.length})` },
											] as const
										).map((tab) => (
											<button
												key={tab.id}
												type="button"
												onClick={() => setInsightTab(tab.id)}
												className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
													insightTab === tab.id
														? 'bg-slate-900 text-white shadow-2xs'
														: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
												}`}
											>
												{tab.label}
											</button>
										))}
									</div>
									<p className="text-[11px] text-slate-500">
										Click any Source or Campaign row to filter Leads Directory
									</p>
								</div>

								{/* Insights Conversion Table */}
								<div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
									<div className="overflow-x-auto">
										{insightTab === 'sources' && (
											<table className="w-full text-left text-xs">
												<thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold tracking-wider text-slate-500 uppercase">
													<tr>
														{[
															'Source / Medium',
															'Total Inquiries',
															'Assessed',
															'Qualified',
															'Qualification Rate',
															'Spam Count',
														].map((h) => (
															<th className="px-4 py-3" key={h}>
																{h}
															</th>
														))}
													</tr>
												</thead>
												<tbody className="divide-y divide-slate-100">
													{sources.length > 0 ? (
														sources.map((s) => {
															const rate = s.assessed
																? Math.round((s.qualified / s.assessed) * 100)
																: 0
															return (
																<tr
																	key={`${s.source}-${s.medium}`}
																	onClick={() => {
																		setFilter('all')
																		setSearch('')
																		setUtmSource(
																			s.source === 'Unknown'
																				? '__unknown__'
																				: s.source,
																		)
																		setUtmMedium(
																			s.medium === 'Unknown'
																				? '__unknown__'
																				: s.medium,
																		)
																		setUtmCampaign('')
																		setPage(1)
																		navigate('leads', { keepUtmSource: true })
																	}}
																	className="cursor-pointer transition-colors hover:bg-blue-50/40"
																>
																	<td className="px-4 py-3.5 font-medium text-slate-900">
																		<span className="font-mono text-blue-700 hover:underline">
																			{s.source} / {s.medium}
																		</span>
																	</td>
																	<td className="px-4 py-3.5 text-slate-700">
																		{s.total}
																	</td>
																	<td className="px-4 py-3.5 text-slate-700">
																		{s.assessed}
																	</td>
																	<td className="px-4 py-3.5 font-semibold text-emerald-600">
																		{s.qualified}
																	</td>
																	<td className="px-4 py-3.5">
																		{s.assessed ? (
																			<div className="flex items-center gap-2">
																				<div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
																					<div
																						className="h-full rounded-full bg-emerald-500"
																						style={{ width: `${rate}%` }}
																					/>
																				</div>
																				<span className="font-semibold text-slate-800">
																					{rate}%
																				</span>
																			</div>
																		) : (
																			<span className="text-slate-400">
																				Not assessed
																			</span>
																		)}
																	</td>
																	<td className="px-4 py-3.5 text-slate-500">
																		{s.spam}
																	</td>
																</tr>
															)
														})
													) : (
														<tr>
															<td
																colSpan={6}
																className="px-4 py-8 text-center text-slate-400"
															>
																No source conversion records found.
															</td>
														</tr>
													)}
												</tbody>
											</table>
										)}

										{insightTab === 'campaigns' && (
											<table className="w-full text-left text-xs">
												<thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold tracking-wider text-slate-500 uppercase">
													<tr>
														{[
															'Campaign',
															'Source / Medium',
															'Total Inquiries',
															'Qualified',
															'Qual Rate',
															'Avg AI Score',
														].map((h) => (
															<th className="px-4 py-3" key={h}>
																{h}
															</th>
														))}
													</tr>
												</thead>
												<tbody className="divide-y divide-slate-100">
													{campaigns.length > 0 ? (
														campaigns.map((c) => {
															const rate = c.total
																? Math.round((c.qualified / c.total) * 100)
																: 0
															return (
																<tr
																	key={`${c.campaign}-${c.source}-${c.medium}`}
																	onClick={() => {
																		setFilter('all')
																		setSearch('')
																		setUtmSource(
																			c.source === 'Unknown'
																				? '__unknown__'
																				: c.source,
																		)
																		setUtmMedium(
																			c.medium === 'Unknown'
																				? '__unknown__'
																				: c.medium,
																		)
																		setUtmCampaign(
																			c.campaign === '(none)'
																				? '__none__'
																				: c.campaign,
																		)
																		setPage(1)
																		navigate('leads', { keepUtmSource: true })
																	}}
																	className="cursor-pointer transition-colors hover:bg-blue-50/40"
																>
																	<td className="px-4 py-3.5 font-medium text-blue-700 hover:underline">
																		<span className="font-mono">
																			{c.campaign}
																		</span>
																	</td>
																	<td className="px-4 py-3.5 font-mono text-slate-600">
																		{c.source} / {c.medium}
																	</td>
																	<td className="px-4 py-3.5 text-slate-700">
																		{c.total}
																	</td>
																	<td className="px-4 py-3.5 font-semibold text-emerald-600">
																		{c.qualified}
																	</td>
																	<td className="px-4 py-3.5 font-medium text-slate-700">
																		{rate}%
																	</td>
																	<td className="px-4 py-3.5">
																		<span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
																			{c.avg_score || 0}
																		</span>
																	</td>
																</tr>
															)
														})
													) : (
														<tr>
															<td
																colSpan={6}
																className="px-4 py-8 text-center text-slate-400"
															>
																No campaign attribution records found.
															</td>
														</tr>
													)}
												</tbody>
											</table>
										)}

										{insightTab === 'placements' && (
											<table className="w-full text-left text-xs">
												<thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold tracking-wider text-slate-500 uppercase">
													<tr>
														{[
															'Capture Placement / Source',
															'Total Captures',
															'Qualified',
															'Avg AI Score',
														].map((h) => (
															<th className="px-4 py-3" key={h}>
																{h}
															</th>
														))}
													</tr>
												</thead>
												<tbody className="divide-y divide-slate-100">
													{placements.length > 0 ? (
														placements.map((p) => (
															<tr
																key={p.placement}
																onClick={() => {
																	const isSub =
																		p.placement === 'popup' ||
																		p.placement === 'newsletter'
																	setFilter(isSub ? 'subscribers' : 'all')
																	setSearch('')
																	setUtmSource('')
																	setUtmMedium('')
																	setUtmCampaign('')
																	setPage(1)
																	navigate('leads')
																}}
																className="cursor-pointer transition-colors hover:bg-blue-50/40"
															>
																<td className="px-4 py-3.5 font-medium text-slate-900">
																	<span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
																		{p.placement}
																	</span>
																</td>
																<td className="px-4 py-3.5 text-slate-700">
																	{p.total}
																</td>
																<td className="px-4 py-3.5 font-semibold text-emerald-600">
																	{p.qualified}
																</td>
																<td className="px-4 py-3.5 font-semibold text-slate-700">
																	{p.avg_score || 0}
																</td>
															</tr>
														))
													) : (
														<tr>
															<td
																colSpan={4}
																className="px-4 py-8 text-center text-slate-400"
															>
																No form placement records found.
															</td>
														</tr>
													)}
												</tbody>
											</table>
										)}

										{insightTab === 'countries' && (
											<table className="w-full text-left text-xs">
												<thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold tracking-wider text-slate-500 uppercase">
													<tr>
														{[
															'Country (GeoIP / Submitted)',
															'Total Inquiries',
															'Qualified',
															'Share',
														].map((h) => (
															<th className="px-4 py-3" key={h}>
																{h}
															</th>
														))}
													</tr>
												</thead>
												<tbody className="divide-y divide-slate-100">
													{countries.length > 0 ? (
														countries.map((co) => {
															const share = insightTotalLeads
																? Math.round(
																		(co.total / insightTotalLeads) * 100,
																	)
																: 0
															return (
																<tr
																	key={co.country}
																	className="transition-colors hover:bg-slate-50/60"
																>
																	<td className="px-4 py-3.5 font-medium text-slate-900">
																		{co.country}
																	</td>
																	<td className="px-4 py-3.5 text-slate-700">
																		{co.total}
																	</td>
																	<td className="px-4 py-3.5 font-semibold text-emerald-600">
																		{co.qualified}
																	</td>
																	<td className="px-4 py-3.5 font-medium text-slate-600">
																		{share}%
																	</td>
																</tr>
															)
														})
													) : (
														<tr>
															<td
																colSpan={4}
																className="px-4 py-8 text-center text-slate-400"
															>
																No geographic records found.
															</td>
														</tr>
													)}
												</tbody>
											</table>
										)}
									</div>
								</div>
							</motion.section>
						) : (
							/* 2. LEADS DIRECTORY & FOLLOW-UPS VIEW */
							<motion.section
								key="leads-directory-section"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{ duration: 0.22, ease: 'easeOut' }}
								className="space-y-5"
							>
								{/* Section Header with Date Range */}
								<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
									<div>
										<h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
											{view === 'followups'
												? 'Scheduled Follow-ups'
												: 'Leads Directory'}
										</h1>
										<p className="mt-1 text-xs text-slate-500">
											{view === 'followups'
												? 'Actionable contact follow-ups ordered by scheduled due date.'
												: 'Prioritize intent, assess signals, and dispatch targeted outreach.'}
										</p>
									</div>

									<div className="flex items-center gap-2">
										{/* Date Range Selector */}
										<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-2xs">
											<Calendar className="ml-1.5 h-3.5 w-3.5 text-slate-400" />
											<select
												value={dateRange}
												onChange={(e) => {
													setDateRange(e.target.value)
													setPage(1)
												}}
												className="cursor-pointer bg-transparent py-1 pr-2 text-xs font-medium text-slate-700 focus:outline-none"
											>
												<option value="all">All Time (UTC)</option>
												<option value="today">Today (UTC)</option>
												<option value="yesterday">Yesterday (UTC)</option>
												<option value="7d">Last 7 Days</option>
												<option value="30d">Last 30 Days</option>
												<option value="month">This Month</option>
											</select>
										</div>

										<span className="text-xs text-slate-500">
											{total} {total === 1 ? 'inquiry' : 'inquiries'}
										</span>
									</div>
								</div>

								{/* Search & Filter Bar */}
								<div className="space-y-2.5">
									<div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
										<div className="relative max-w-md flex-1">
											<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
												<Search className="h-4 w-4" />
											</div>
											<input
												className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs text-slate-900 shadow-2xs transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none"
												placeholder="Search by name, company, email or phone (or press ⌘K)..."
												value={search}
												onChange={(e) => {
													setSearch(e.target.value)
													setPage(1)
												}}
											/>
											{search && (
												<button
													onClick={() => {
														setSearch('')
														setPage(1)
													}}
													className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
												>
													<X className="h-3.5 w-3.5" />
												</button>
											)}
										</div>

										{/* Segmented Filter Pills (Leads view) with Framer-motion layoutId */}
										{view === 'leads' && (
											<div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs">
												{[
													['all', 'All Leads'],
													['new', 'New Inquiries'],
													['unassigned', 'Unassigned'],
													['qualified', 'Qualified'],
													['assessed', 'Assessed'],
													['contacted', 'Contacting / Engaged'],
													['won', 'Won (legacy)'],
													['wholesale_rfq', 'Wholesale RFQs'],
													['subscribers', 'Subscribers'],
												].map(([v, l]) => {
													const active = filter === v
													return (
														<button
															key={v}
															onClick={() => {
																setFilter(v)
																setPage(1)
															}}
															className={`relative rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
																active
																	? 'text-white'
																	: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
															}`}
														>
															{active && (
																<motion.div
																	layoutId="activeFilterPill"
																	className="absolute inset-0 rounded-lg bg-slate-900 shadow-2xs"
																	transition={{
																		type: 'spring',
																		stiffness: 450,
																		damping: 35,
																	}}
																/>
															)}
															<span className="relative z-10">{l}</span>
														</button>
													)
												})}
											</div>
										)}
									</div>
									{view === 'leads' && (utmSource || utmMedium || utmCampaign) && (
										<div className="flex flex-wrap items-center gap-2">
											{utmSource && (
												<span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
													UTM Source:{' '}
													<strong className="font-semibold">
														{utmSource === '__unknown__'
															? 'Direct / Unknown'
															: utmSource}
													</strong>
													<button
														type="button"
														aria-label="Clear UTM source filter"
														onClick={() => {
															setUtmSource('')
															setPage(1)
														}}
														className="ml-0.5 cursor-pointer rounded-full p-0.5 text-blue-500 hover:bg-blue-100 hover:text-blue-800"
													>
														<X className="h-3 w-3" />
													</button>
												</span>
											)}
											{utmMedium && (
												<span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
													Medium:{' '}
													<strong className="font-semibold">
														{utmMedium === '__unknown__'
															? 'Unknown'
															: utmMedium}
													</strong>
													<button
														type="button"
														aria-label="Clear UTM medium filter"
														onClick={() => {
															setUtmMedium('')
															setPage(1)
														}}
														className="ml-0.5 cursor-pointer rounded-full p-0.5 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-800"
													>
														<X className="h-3 w-3" />
													</button>
												</span>
											)}
											{utmCampaign && (
												<span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
													Campaign:{' '}
													<strong className="font-semibold">
														{utmCampaign === '__none__'
															? '(none)'
															: utmCampaign}
													</strong>
													<button
														type="button"
														aria-label="Clear UTM campaign filter"
														onClick={() => {
															setUtmCampaign('')
															setPage(1)
														}}
														className="ml-0.5 cursor-pointer rounded-full p-0.5 text-violet-500 hover:bg-violet-100 hover:text-violet-800"
													>
														<X className="h-3 w-3" />
													</button>
												</span>
											)}
										</div>
									)}
								</div>

								{/* TABLE COMPONENT WITH CHECKBOXES */}
								<div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
									<div className="overflow-x-auto">
										<table className="w-full text-left text-xs">
											<thead className="border-b border-slate-200/80 bg-slate-50/80 font-semibold tracking-wider text-slate-500 uppercase">
												<tr>
													{/* Bulk Checkbox Column Header */}
													<th className="w-10 px-4 py-3">
														<button
															type="button"
															onClick={toggleSelectAll}
															className="text-slate-400 hover:text-slate-700"
															title={
																selectedIds.length === items.length &&
																items.length > 0
																	? 'Deselect all'
																	: 'Select all'
															}
														>
															{selectedIds.length === items.length &&
															items.length > 0 ? (
																<CheckSquare className="h-4 w-4 text-slate-900" />
															) : (
																<Square className="h-4 w-4" />
															)}
														</button>
													</th>
													{[
														'Contact & Company',
														'Acquisition / Channel',
														'Qualification & Priority',
														'Assigned Rep',
														view === 'followups'
															? 'Action / Scheduled Due'
															: 'Received / SLA Status',
													].map((h) => (
														<th key={h} className="px-4 py-3">
															{h}
														</th>
													))}
												</tr>
											</thead>
											<tbody className="divide-y divide-slate-100">
												{!busy &&
													items.map((l) => {
														const isOverdue =
															l.follow_up_at &&
															Date.parse(l.follow_up_at) < Date.now()
														const sla = getSlaStatus(l.created_at, l.status)
														const isSelected = selectedIds.includes(l.id)

														return (
															<tr
																key={l.id}
																className={`group transition-colors ${
																	isSelected
																		? 'bg-blue-50/50'
																		: 'hover:bg-slate-50/80'
																}`}
															>
																{/* Checkbox Cell */}
																<td className="px-4 py-3.5">
																	<button
																		type="button"
																		onClick={() => toggleSelectOne(l.id)}
																		className="text-slate-400 hover:text-slate-700"
																	>
																		{isSelected ? (
																			<CheckSquare className="h-4 w-4 text-slate-900" />
																		) : (
																			<Square className="h-4 w-4" />
																		)}
																	</button>
																</td>

																{/* Contact */}
																<td className="px-4 py-3.5">
																	<div className="flex items-center gap-3">
																		<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-slate-100 text-xs font-semibold text-slate-700">
																			{getInitials(l.name)}
																		</div>
																		<div className="min-w-0">
																			<button
																				className="block max-w-[160px] truncate text-left font-semibold text-slate-900 transition-colors hover:text-blue-600 hover:underline sm:max-w-[220px]"
																				onClick={() => selectLead(l.id)}
																			>
																				{l.name}
																			</button>
																			<p className="max-w-[160px] truncate text-[11px] text-slate-400 sm:max-w-[220px]">
																				{l.company_name || l.email}
																			</p>
																		</div>
																	</div>
																</td>

																{/* Acquisition Channel */}
																<td className="px-4 py-3.5">
																	<div className="flex flex-wrap items-center gap-1.5">
																		<span className="font-medium text-slate-800">
																			{l.source === 'wholesale_rfq'
																				? 'Wholesale RFQ'
																				: l.utm_source || 'Direct / Organic'}
																		</span>
																		{(l.ip_country || l.country) && (
																			<span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600">
																				{l.ip_country || l.country}
																			</span>
																		)}
																	</div>
																	<div className="mt-1 flex flex-wrap items-center gap-1">
																		<span className="py-0.2 inline-block rounded-full bg-slate-100 px-2 text-[10px] font-medium text-slate-600">
																			{leadChannel(l.utm_source, l.utm_medium)}
																		</span>
																		{l.utm_campaign && (
																			<span className="max-w-[140px] truncate rounded-full border border-violet-200 bg-violet-50 px-2 text-[10px] font-medium text-violet-700">
																				{l.utm_campaign}
																			</span>
																		)}
																	</div>
																</td>

																{/* Qualification & Priority */}
																<td className="px-4 py-3.5">
																	<div className="flex flex-wrap items-center gap-1.5">
																		{typeof l.ai_score === 'number' &&
																			l.ai_score > 0 && (
																				<span
																					className={`rounded-full border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
																						l.ai_score >= 70
																							? 'border-emerald-200 bg-emerald-50 text-emerald-700'
																							: l.ai_score >= 40
																								? 'border-amber-200 bg-amber-50 text-amber-700'
																								: 'border-slate-200 bg-slate-50 text-slate-600'
																					}`}
																					title="Automated Intent Score (0-100)"
																				>
																					AI {l.ai_score}
																				</span>
																			)}
																		<span
																			className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
																				l.qualification === 'qualified'
																					? 'border-emerald-200 bg-emerald-50 text-emerald-700'
																					: l.qualification === 'spam'
																						? 'border-rose-200 bg-rose-50 text-rose-700'
																						: l.qualification === 'not_a_fit'
																							? 'border-slate-200 bg-slate-100 text-slate-600'
																							: 'border-amber-200 bg-amber-50 text-amber-700'
																			}`}
																		>
																			{l.qualification.replaceAll('_', ' ')}
																		</span>
																		<span
																			className={`text-[10px] font-medium ${
																				l.priority === 'high'
																					? 'font-semibold text-rose-600'
																					: 'text-slate-400'
																			}`}
																		>
																			{l.priority}
																		</span>
																	</div>
																</td>

																{/* Assigned Staff */}
																<td className="px-4 py-3.5 text-slate-700">
																	{l.assigned_to ? (
																		<span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
																			<User className="h-3 w-3 text-slate-400" />
																			{staff.find((s) => s.id === l.assigned_to)
																				?.name || 'Assigned'}
																		</span>
																	) : (
																		<span className="inline-block rounded border border-dashed border-slate-300 px-2 py-0.5 text-[10px] text-slate-400">
																			Unassigned
																		</span>
																	)}
																</td>

																{/* Follow-up or Received / SLA */}
																<td className="px-4 py-3.5">
																	{view === 'followups' ? (
																		<div>
																			<p className="font-medium text-slate-900">
																				{l.next_action || 'Follow up'}
																			</p>
																			<p
																				className={`mt-0.5 flex items-center gap-1 text-[11px] ${
																					isOverdue
																						? 'font-semibold text-rose-600'
																						: 'text-slate-500'
																				}`}
																			>
																				{isOverdue && (
																					<AlertTriangle className="h-3 w-3" />
																				)}
																				{formatDate(l.follow_up_at)}
																			</p>
																		</div>
																	) : (
																		<div className="space-y-1">
																			<div className="flex items-center gap-2">
																				<span className="font-medium text-slate-800">
																					{formatShortDate(l.created_at)}
																				</span>
																				{sla && (
																					<span
																						className={`py-0.2 inline-flex items-center gap-1 rounded-full px-2 text-[10px] ${sla.badge}`}
																					>
																						<span
																							className={`h-1.5 w-1.5 rounded-full ${sla.dot}`}
																						/>
																						{sla.label}
																					</span>
																				)}
																			</div>
																			<span className="block text-[11px] text-slate-400">
																				{formatDate(l.created_at)}
																			</span>
																		</div>
																	)}
																</td>
															</tr>
														)
													})}
											</tbody>
										</table>
									</div>

									{busy ? (
										<div
											role="status"
											className="flex items-center justify-center gap-2 p-12 text-xs text-slate-400"
										>
											<Loader2 className="h-4 w-4 animate-spin text-slate-500" />
											Loading inquiries…
										</div>
									) : (
										!items.length && (
											<div className="py-12 text-center">
												<Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
												<p className="text-xs font-semibold text-slate-700">
													No matching inquiries found
												</p>
												<p className="mt-0.5 text-[11px] text-slate-400">
													Try adjusting search terms or clearing selected
													filters.
												</p>
												{(search ||
													utmSource ||
													filter !== 'all' ||
													dateRange !== 'all') && (
													<button
														onClick={() => {
															setSearch('')
															setUtmSource('')
															setFilter('all')
															setDateRange('all')
															setPage(1)
														}}
														className="mt-3 inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
													>
														Clear filters
													</button>
												)}
											</div>
										)
									)}

									{/* PAGINATION FOOTER */}
									<div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row">
										<p className="text-xs text-slate-500">
											Showing{' '}
											<span className="font-semibold text-slate-700">
												{total === 0 ? 0 : (page - 1) * 25 + 1}
											</span>{' '}
											to{' '}
											<span className="font-semibold text-slate-700">
												{Math.min(page * 25, total)}
											</span>{' '}
											of{' '}
											<span className="font-semibold text-slate-700">
												{total}
											</span>{' '}
											leads
										</p>

										<div className="flex items-center gap-2">
											<motion.button
												whileTap={{ scale: 0.95 }}
												className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-40"
												disabled={page === 1 || busy}
												onClick={() => setPage((n) => n - 1)}
											>
												<ChevronLeft className="h-3.5 w-3.5" />
												Previous
											</motion.button>
											<span className="px-1 font-mono text-xs text-slate-500">
												Page {page}
											</span>
											<motion.button
												whileTap={{ scale: 0.95 }}
												className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-40"
												disabled={page * 25 >= total || busy}
												onClick={() => setPage((n) => n + 1)}
											>
												Next
												<ChevronRight className="h-3.5 w-3.5" />
											</motion.button>
										</div>
									</div>
								</div>
							</motion.section>
						)}
					</AnimatePresence>

					{/* FLOATING BULK ACTIONS TOOLBAR (DOCKED AT BOTTOM WHEN ITEMS SELECTED) */}
					<AnimatePresence>
						{selectedIds.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 40 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 40 }}
								transition={{ type: 'spring', damping: 25, stiffness: 350 }}
								className="fixed inset-x-4 bottom-6 z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-2xl ring-1 ring-slate-800 md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
							>
								<div className="flex items-center gap-2.5">
									<span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
										{selectedIds.length} selected
									</span>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									{/* Mark as Contacted */}
									<button
										disabled={bulkBusy}
										onClick={() => handleBulkStatus('contacted')}
										className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
									>
										Mark Contacted
									</button>

									{/* Mark as Closed */}
									<button
										disabled={bulkBusy}
										onClick={() => handleBulkStatus('closed')}
										className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
									>
										Mark Closed
									</button>

									{/* Assign Rep (Admin only) */}
									{canManage && (
										<div className="relative">
											<select
												disabled={bulkBusy}
												value={bulkAssignee}
												onChange={(e) => {
													setBulkAssignee(e.target.value)
													if (e.target.value) handleBulkAssign(e.target.value)
												}}
												className="cursor-pointer rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none"
											>
												<option value="">Assign to Rep…</option>
												{staff.map((s) => (
													<option key={s.id} value={s.id}>
														{s.name}
													</option>
												))}
											</select>
										</div>
									)}

									{/* Mark as Spam */}
									<button
										disabled={bulkBusy}
										onClick={handleBulkSpam}
										className="rounded-lg border border-rose-800/60 bg-rose-950/80 px-3 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-900 disabled:opacity-50"
									>
										Mark Spam
									</button>

									{/* Export CSV */}
									<button
										onClick={exportSelectedCsv}
										className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
									>
										<Download className="h-3 w-3" />
										CSV
									</button>

									{/* Deselect / Close */}
									<button
										onClick={() => setSelectedIds([])}
										className="ml-1 rounded-lg p-1 text-slate-400 transition-colors hover:text-white"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</main>
			</div>
		</div>
	)
}
