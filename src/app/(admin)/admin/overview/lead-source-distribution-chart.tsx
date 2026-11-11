'use client'

import { useMemo, useState } from 'react'
import {
	AlertTriangle,
	CheckCircle2,
	Compass,
	ExternalLink,
	Globe,
	Sparkles,
	TrendingUp,
} from 'lucide-react'

export interface SourceRow {
	source: string
	medium: string
	total: number
	assessed: number
	qualified: number
	spam: number
}

interface LeadSourceDistributionChartProps {
	sources?: SourceRow[]
	totalLeads?: number
	onSelectSource?: (source: string) => void
}

const PALETTE = [
	{ bg: '#3b82f6', fill: 'bg-blue-500' },
	{ bg: '#10b981', fill: 'bg-emerald-500' },
	{ bg: '#8b5cf6', fill: 'bg-purple-500' },
	{ bg: '#f59e0b', fill: 'bg-amber-500' },
	{ bg: '#06b6d4', fill: 'bg-cyan-500' },
	{ bg: '#ec4899', fill: 'bg-pink-500' },
	{ bg: '#64748b', fill: 'bg-slate-500' },
]

export default function LeadSourceDistributionChart({
	sources = [],
	totalLeads = 0,
	onSelectSource,
}: LeadSourceDistributionChartProps) {
	const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

	const radius = 38
	const circumference = 2 * Math.PI * radius // ~238.76

	const { segments, grandTotal, isEmpty } = useMemo(() => {
		const total = sources.reduce((acc, s) => acc + (Number(s.total) || 0), 0)
		const effectiveTotal = Math.max(total, totalLeads, 1)

		const sorted = [...sources].sort((a, b) => (b.total || 0) - (a.total || 0))
		const top5 = sorted.slice(0, 5)
		const rest = sorted.slice(5)

		const rawList: {
			name: string
			medium: string
			total: number
			assessed: number
			qualified: number
			spam: number
			qualRate: number
			pct: number
			color: (typeof PALETTE)[0]
		}[] = []

		top5.forEach((s, idx) => {
			const qualRate =
				s.assessed > 0 ? Math.round((s.qualified / s.assessed) * 100) : 0
			const pct = Math.round((s.total / effectiveTotal) * 100)
			rawList.push({
				name: s.source || 'Organic / Direct',
				medium: s.medium || 'direct',
				total: s.total,
				assessed: s.assessed,
				qualified: s.qualified,
				spam: s.spam,
				qualRate,
				pct,
				color: PALETTE[idx % PALETTE.length],
			})
		})

		if (rest.length > 0) {
			const otherTotal = rest.reduce((a, s) => a + s.total, 0)
			const otherAssessed = rest.reduce((a, s) => a + s.assessed, 0)
			const otherQualified = rest.reduce((a, s) => a + s.qualified, 0)
			const otherSpam = rest.reduce((a, s) => a + s.spam, 0)
			const qualRate =
				otherAssessed > 0
					? Math.round((otherQualified / otherAssessed) * 100)
					: 0
			const pct = Math.round((otherTotal / effectiveTotal) * 100)

			rawList.push({
				name: 'Other Channels',
				medium: `${rest.length} sources`,
				total: otherTotal,
				assessed: otherAssessed,
				qualified: otherQualified,
				spam: otherSpam,
				qualRate,
				pct,
				color: PALETTE[PALETTE.length - 1],
			})
		}

		// Precompute dashoffset purely without modifying variables during JSX render
		let acc = 0
		const segsWithOffset = rawList.map((seg) => {
			const offset = acc
			acc += seg.pct
			return {
				...seg,
				strokeDasharray: `${(seg.pct / 100) * circumference} ${circumference}`,
				strokeDashoffset: -((offset / 100) * circumference),
			}
		})

		return {
			segments: segsWithOffset,
			grandTotal: total || totalLeads,
			isEmpty: (total || totalLeads) === 0 || rawList.length === 0,
		}
	}, [sources, totalLeads, circumference])

	const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null

	return (
		<div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-slate-100 pb-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-600">
						<Globe className="h-5 w-5" />
					</div>
					<div>
						<h3 className="text-base font-bold tracking-tight text-slate-900">
							Traffic Acquisition & Channel Quality
						</h3>
						<p className="text-xs text-slate-500">
							Inbound inquiry share and verified qualification rate by channel
						</p>
					</div>
				</div>

				<span className="font-mono text-xs font-bold text-slate-500">
					{grandTotal.toLocaleString('en-US')} Tracked Leads
				</span>
			</div>

			{/* Donut and Legend Grid */}
			<div className="grid grid-cols-1 items-center gap-6 py-1 lg:grid-cols-12">
				{/* Col 1: Donut Visualization (4-col) */}
				<div className="flex flex-col items-center justify-center lg:col-span-4">
					<div className="relative flex items-center justify-center">
						<svg
							width="150"
							height="150"
							viewBox="0 0 100 100"
							className="-rotate-90 select-none"
						>
							{/* Background Track */}
							<circle
								cx="50"
								cy="50"
								r={radius}
								fill="transparent"
								stroke="#f1f5f9"
								strokeWidth="11"
							/>

							{/* Segments */}
							{!isEmpty &&
								segments.map((seg, i) => {
									const isHovered = hoveredIdx === i

									return (
										<circle
											key={seg.name}
											cx="50"
											cy="50"
											r={radius}
											fill="transparent"
											stroke={seg.color.bg}
											strokeWidth={isHovered ? 13 : 11}
											strokeDasharray={seg.strokeDasharray}
											strokeDashoffset={seg.strokeDashoffset}
											className="cursor-pointer transition-all duration-200"
											onMouseEnter={() => setHoveredIdx(i)}
											onMouseLeave={() => setHoveredIdx(null)}
										/>
									)
								})}
						</svg>

						{/* Center Label */}
						<div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
							{activeSegment ? (
								<>
									<span className="font-mono text-xs font-bold text-slate-400 uppercase">
										{activeSegment.pct}%
									</span>
									<span className="max-w-[75px] truncate text-[11px] font-bold text-slate-900">
										{activeSegment.name}
									</span>
								</>
							) : (
								<>
									<span className="font-mono text-lg font-bold text-slate-900">
										{grandTotal.toLocaleString('en-US')}
									</span>
									<span className="text-[10px] font-semibold text-slate-400 uppercase">
										Inquiries
									</span>
								</>
							)}
						</div>
					</div>

					<span className="mt-2 text-center text-[11px] text-slate-400">
						{activeSegment
							? `${activeSegment.total.toLocaleString('en-US')} leads (${activeSegment.qualRate}% qual rate)`
							: isEmpty
								? 'No attribution data recorded'
								: `${segments.length} active channels tracked`}
					</span>
				</div>

				{/* Col 2: Channel Quality Breakdown Ranking (8-col) */}
				<div className="space-y-2 lg:col-span-8">
					{!isEmpty ? (
						segments.map((seg, i) => {
							const isHovered = hoveredIdx === i
							return (
								<div
									key={seg.name}
									role="button"
									tabIndex={0}
									onMouseEnter={() => setHoveredIdx(i)}
									onMouseLeave={() => setHoveredIdx(null)}
									onClick={() => onSelectSource?.(seg.name)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											onSelectSource?.(seg.name)
										}
									}}
									className={`cursor-pointer rounded-xl border p-2.5 transition-all focus:outline-hidden focus:ring-1 focus:ring-slate-300 ${
										isHovered
											? 'border-blue-300 bg-blue-50/50 shadow-2xs'
											: 'border-slate-100 bg-slate-50/40 hover:bg-slate-50'
									}`}
								>
									<div className="flex items-center justify-between text-xs">
										<div className="flex min-w-0 items-center gap-2">
											<span
												className="h-2.5 w-2.5 shrink-0 rounded-full"
												style={{ backgroundColor: seg.color.bg }}
											/>
											<span className="truncate font-semibold text-slate-800">
												{seg.name}
											</span>
											<span className="text-[10px] text-slate-400">
												/ {seg.medium}
											</span>
										</div>

										<div className="flex shrink-0 items-center gap-3 font-mono">
											<span className="text-slate-500">
												{seg.total.toLocaleString('en-US')} ({seg.pct}%)
											</span>
											<span
												className={`text-[11px] font-bold ${
													seg.qualRate >= 50
														? 'text-emerald-700'
														: seg.qualRate >= 25
															? 'text-amber-700'
															: 'text-slate-500'
												}`}
											>
												{seg.qualRate}% qual
											</span>
										</div>
									</div>

									{/* Channel Qual Progress Bar */}
									<div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
										<div
											className={`h-full rounded-full transition-all duration-300 ${
												seg.qualRate >= 50
													? 'bg-emerald-500'
													: seg.qualRate >= 25
														? 'bg-amber-500'
														: 'bg-slate-400'
											}`}
											style={{
												width: `${Math.max(seg.qualRate, seg.total > 0 ? 5 : 0)}%`,
											}}
										/>
									</div>
								</div>
							)
						})
					) : (
						<div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
							No UTM attribution channels recorded in this timeframe.
						</div>
					)}
				</div>
			</div>

			{/* Footer Key Takeaway */}
			<div className="flex flex-col justify-between gap-1 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:flex-row sm:items-center">
				<span>
					Top performing channel:{' '}
					<strong className="text-slate-900">
						{segments[0]?.name || 'Direct / Organic'}
					</strong>{' '}
					({segments[0]?.qualRate || 0}% qualification rate)
				</span>
				<span className="text-[11px] text-slate-400">
					Newsletter & popup subscribers excluded
				</span>
			</div>
		</div>
	)
}
