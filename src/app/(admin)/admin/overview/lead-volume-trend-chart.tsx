'use client'

import {
	Activity,
	ArrowUpRight,
	Calendar,
	CheckCircle2,
	Flame,
	Inbox,
	TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { IntelligenceLead } from '@/lib/lead-intelligence'

export interface TrendBucket {
	bucket: string // '2026-11-11' or '08'
	total: number
	qualified: number
	urgent?: number
}

interface LeadVolumeTrendChartProps {
	trends?: TrendBucket[]
	items?: IntelligenceLead[]
	timeframe?: string
	totalLeads?: number
	qualifiedLeads?: number
}

interface TimelinePoint {
	key: string
	label: string
	fullLabel: string
	total: number
	qualified: number
	urgent: number
}

function getCurvedPath(points: { x: number; y: number }[]): string {
	if (points.length === 0) return ''
	if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

	let path = `M ${points[0].x} ${points[0].y}`
	for (let i = 0; i < points.length - 1; i++) {
		const current = points[i]
		const next = points[i + 1]
		const controlX = (current.x + next.x) / 2
		path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`
	}
	return path
}

export default function LeadVolumeTrendChart({
	trends = [],
	items = [],
	timeframe = '30d',
	totalLeads = 0,
	qualifiedLeads = 0,
}: LeadVolumeTrendChartProps) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

	const isHourly = timeframe === 'today' || timeframe === 'yesterday'

	// Normalize buckets into a continuous timeline
	const chartData = useMemo<TimelinePoint[]>(() => {
		const dataMap = new Map<
			string,
			{ total: number; qualified: number; urgent: number }
		>()

		// 1. Ingest server-side trends
		trends.forEach((t) => {
			const b = String(t.bucket || '').trim()
			if (b) {
				dataMap.set(b, {
					total: Number(t.total) || 0,
					qualified: Number(t.qualified) || 0,
					urgent: Number(t.urgent) || 0,
				})
			}
		})

		// 2. Fallback to client items if server trends are empty
		if (dataMap.size === 0 && items.length > 0) {
			items.forEach((l) => {
				const d = l.created_at ? new Date(l.created_at) : null
				if (!d || Number.isNaN(d.getTime())) return

				const bucket = isHourly
					? String(d.getUTCHours()).padStart(2, '0')
					: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`

				const cur = dataMap.get(bucket) || {
					total: 0,
					qualified: 0,
					urgent: 0,
				}
				cur.total += 1
				if (l.qualification === 'qualified') cur.qualified += 1
				if (l.priority === 'high') cur.urgent += 1
				dataMap.set(bucket, cur)
			})
		}

		// 3. Continuous date/hour slots
		const points: TimelinePoint[] = []

		if (isHourly) {
			for (let h = 0; h < 24; h++) {
				const hourStr = String(h).padStart(2, '0')
				const entry = dataMap.get(hourStr) || {
					total: 0,
					qualified: 0,
					urgent: 0,
				}
				points.push({
					key: hourStr,
					label: `${hourStr}:00`,
					fullLabel: `${timeframe === 'yesterday' ? 'Yesterday' : 'Today'} at ${hourStr}:00 UTC`,
					total: entry.total,
					qualified: entry.qualified,
					urgent: entry.urgent,
				})
			}
			return points
		}

		const daysCount =
			timeframe === '7d'
				? 7
				: timeframe === 'month'
					? new Date().getUTCDate()
					: 30
		const now = new Date()

		if (timeframe === 'all' && dataMap.size > 0) {
			const sortedKeys = Array.from(dataMap.keys()).sort()
			if (sortedKeys.length > 0) {
				const firstDate = new Date(`${sortedKeys[0]}T00:00:00Z`)
				const lastDate = new Date(
					`${sortedKeys[sortedKeys.length - 1]}T00:00:00Z`,
				)
				const daySpan =
					Number.isFinite(firstDate.getTime()) &&
					Number.isFinite(lastDate.getTime())
						? Math.round((lastDate.getTime() - firstDate.getTime()) / 86400000)
						: 0

				if (daySpan > 0 && daySpan <= 180) {
					const continuous: TimelinePoint[] = []
					for (let offset = 0; offset <= daySpan; offset++) {
						const d = new Date(firstDate)
						d.setUTCDate(firstDate.getUTCDate() + offset)
						const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
						const entry = dataMap.get(key) || {
							total: 0,
							qualified: 0,
							urgent: 0,
						}
						continuous.push({
							key,
							label: d.toLocaleDateString('en-US', {
								timeZone: 'UTC',
								month: 'short',
								day: 'numeric',
							}),
							fullLabel: d.toLocaleDateString('en-US', {
								timeZone: 'UTC',
								weekday: 'short',
								month: 'short',
								day: 'numeric',
								year: 'numeric',
							}),
							total: entry.total,
							qualified: entry.qualified,
							urgent: entry.urgent,
						})
					}
					return continuous
				}

				return sortedKeys.map((key) => {
					const entry = dataMap.get(key) || {
						total: 0,
						qualified: 0,
						urgent: 0,
					}
					const d = new Date(`${key}T00:00:00Z`)
					const label = Number.isNaN(d.getTime())
						? key
						: d.toLocaleDateString('en-US', {
								timeZone: 'UTC',
								month: 'short',
								day: 'numeric',
							})
					return {
						key,
						label,
						fullLabel: Number.isNaN(d.getTime())
							? key
							: d.toLocaleDateString('en-US', {
									timeZone: 'UTC',
									weekday: 'short',
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								}),
						total: entry.total,
						qualified: entry.qualified,
						urgent: entry.urgent,
					}
				})
			}
		}

		for (let i = daysCount - 1; i >= 0; i--) {
			const d = new Date()
			d.setUTCDate(now.getUTCDate() - i)
			const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
			const entry = dataMap.get(key) || {
				total: 0,
				qualified: 0,
				urgent: 0,
			}
			points.push({
				key,
				label: d.toLocaleDateString('en-US', {
					timeZone: 'UTC',
					month: 'short',
					day: 'numeric',
				}),
				fullLabel: d.toLocaleDateString('en-US', {
					timeZone: 'UTC',
					weekday: 'short',
					month: 'short',
					day: 'numeric',
					year: 'numeric',
				}),
				total: entry.total,
				qualified: entry.qualified,
				urgent: entry.urgent,
			})
		}

		return points
	}, [trends, items, timeframe, isHourly])

	// Aggregate statistics
	const {
		maxTotal,
		peakPoint,
		periodTotal,
		periodQualified,
		avgDaily,
		isEmpty,
	} = useMemo<{
		maxTotal: number
		peakPoint: TimelinePoint | null
		periodTotal: number
		periodQualified: number
		avgDaily: number
		isEmpty: boolean
	}>(() => {
		let max = 0
		let peak: TimelinePoint | null = null
		let sumTotal = 0
		let sumQual = 0

		chartData.forEach((p) => {
			if (p.total > max) {
				max = p.total
				peak = p
			}
			sumTotal += p.total
			sumQual += p.qualified
		})

		const avg = Math.round((sumTotal / Math.max(chartData.length, 1)) * 10) / 10

		return {
			maxTotal: Math.max(max, 4),
			peakPoint: peak,
			periodTotal: sumTotal || totalLeads,
			periodQualified: sumQual || qualifiedLeads,
			avgDaily: avg,
			isEmpty: sumTotal === 0 && totalLeads === 0,
		}
	}, [chartData, totalLeads, qualifiedLeads])

	// Chart Geometry
	const svgWidth = 680
	const svgHeight = 220
	const padding = { top: 20, right: 20, bottom: 35, left: 40 }
	const chartWidth = svgWidth - padding.left - padding.right
	const chartHeight = svgHeight - padding.top - padding.bottom

	const points = useMemo(() => {
		if (chartData.length === 0) return []
		const stepX = chartWidth / Math.max(chartData.length - 1, 1)

		return chartData.map((d, i) => {
			const x = padding.left + i * stepX
			const totalRatio = Math.min(1, Math.max(0, d.total / maxTotal))
			const qualRatio = Math.min(1, Math.max(0, d.qualified / maxTotal))

			const yTotal = padding.top + chartHeight - totalRatio * chartHeight
			const yQual = padding.top + chartHeight - qualRatio * chartHeight

			return {
				x,
				yTotal,
				yQual,
				data: d,
				index: i,
			}
		})
	}, [chartData, maxTotal, chartWidth, chartHeight, padding.left, padding.top])

	const totalCurve = useMemo(
		() => getCurvedPath(points.map((p) => ({ x: p.x, y: p.yTotal }))),
		[points],
	)
	const qualCurve = useMemo(
		() => getCurvedPath(points.map((p) => ({ x: p.x, y: p.yQual }))),
		[points],
	)

	const totalAreaPath = useMemo(() => {
		if (points.length < 2) return ''
		const first = points[0]
		const last = points[points.length - 1]
		const bottomY = padding.top + chartHeight
		return `${totalCurve} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`
	}, [totalCurve, points, padding.top, chartHeight])

	const yTicks = [0, 0.5, 1].map((pct) => {
		const val = Math.round(maxTotal * pct)
		const y = padding.top + chartHeight - pct * chartHeight
		return { val, y }
	})

	const labelStep = useMemo(() => {
		if (chartData.length <= 8) return 1
		if (chartData.length <= 15) return 2
		if (chartData.length <= 25) return 4
		return 5
	}, [chartData.length])

	const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null

	// Responsive percentage position for the tooltip
	const tooltipLeftPercent = activePoint
		? Math.min(Math.max((activePoint.x / svgWidth) * 100, 15), 85)
		: 50

	return (
		<div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
			{/* Header */}
			<div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/80 bg-blue-50 text-blue-600">
						<TrendingUp className="h-5 w-5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h3 className="text-base font-bold tracking-tight text-slate-900">
								Inbound Acquisition Velocity
							</h3>
							<span className="rounded-full border border-blue-200/80 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
								{isHourly ? 'Hourly Pace' : 'Daily Trend'}
							</span>
						</div>
						<p className="text-xs text-slate-500">
							Daily volume pacing and verified qualification rate over time
						</p>
					</div>
				</div>

				{/* Legend */}
				<div className="flex items-center gap-4 text-xs font-medium">
					<div className="flex items-center gap-1.5 text-slate-600">
						<span className="h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
						<span>Total Inbound</span>
					</div>
					<div className="flex items-center gap-1.5 text-slate-600">
						<span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
						<span>Qualified Leads</span>
					</div>
				</div>
			</div>

			{/* SVG Chart Container */}
			<div className="relative w-full overflow-hidden">
				<svg
					role="img"
					aria-label="Inbound acquisition velocity chart comparing total leads and qualified leads over time"
					viewBox={`0 0 ${svgWidth} ${svgHeight}`}
					className="h-56 w-full touch-manipulation select-none"
					onMouseLeave={() => setHoveredIndex(null)}
				>
					<defs>
						<linearGradient id="leadVolumeArea" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
							<stop offset="85%" stopColor="#3b82f6" stopOpacity="0.02" />
							<stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
						</linearGradient>
					</defs>

					{/* Y-Axis Horizontal Gridlines */}
					{yTicks.map((tick, i) => (
						<g key={i}>
							<line
								x1={padding.left}
								y1={tick.y}
								x2={svgWidth - padding.right}
								y2={tick.y}
								stroke="#f1f5f9"
								strokeDasharray={i === 0 ? 'none' : '4 4'}
								strokeWidth="1"
							/>
							<text
								x={padding.left - 8}
								y={tick.y + 3.5}
								textAnchor="end"
								className="fill-slate-400 font-mono text-[10px]"
							>
								{tick.val}
							</text>
						</g>
					))}

					{/* Empty State Banner in Chart */}
					{isEmpty && (
						<g>
							<text
								x={svgWidth / 2}
								y={svgHeight / 2 - 6}
								textAnchor="middle"
								className="fill-slate-400 text-xs font-medium"
							>
								No inbound inquiries recorded in selected timeframe
							</text>
							<text
								x={svgWidth / 2}
								y={svgHeight / 2 + 12}
								textAnchor="middle"
								className="fill-slate-400/80 text-[10px]"
							>
								Inbound volume curves will appear automatically when leads
								arrive
							</text>
						</g>
					)}

					{/* Gradient Fill Area */}
					{totalAreaPath && !isEmpty && (
						<path
							d={totalAreaPath}
							fill="url(#leadVolumeArea)"
							className="transition-all duration-300"
						/>
					)}

					{/* Total Curve Line */}
					{totalCurve && !isEmpty && (
						<path
							d={totalCurve}
							fill="none"
							stroke="#2563eb"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					)}

					{/* Qualified Curve Line */}
					{qualCurve && !isEmpty && (
						<path
							d={qualCurve}
							fill="none"
							stroke="#10b981"
							strokeWidth="2"
							strokeDasharray="4 3"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					)}

					{/* Data Point Dots & Hover Guide */}
					{points.map((p, idx) => {
						const isHovered = hoveredIndex === idx
						const showLabel = idx % labelStep === 0 || idx === points.length - 1

						return (
							<g key={p.data.key}>
								{/* Hover Vertical Guide Line */}
								{isHovered && (
									<line
										x1={p.x}
										y1={padding.top}
										x2={p.x}
										y2={padding.top + chartHeight}
										stroke="#94a3b8"
										strokeWidth="1"
										strokeDasharray="3 3"
									/>
								)}

								{/* Qualified Dot */}
								{p.data.qualified > 0 && (
									<circle
										cx={p.x}
										cy={p.yQual}
										r={isHovered ? 4.5 : 2.5}
										className="fill-emerald-500 transition-all"
										stroke="#ffffff"
										strokeWidth="1.5"
									/>
								)}

								{/* Total Dot */}
								{(p.data.total > 0 || isHovered) && (
									<circle
										cx={p.x}
										cy={p.yTotal}
										r={isHovered ? 5.5 : 3}
										className="fill-blue-600 transition-all"
										stroke="#ffffff"
										strokeWidth="1.8"
									/>
								)}

								{/* X-Axis Tick Label */}
								{showLabel && (
									<text
										x={p.x}
										y={padding.top + chartHeight + 18}
										textAnchor="middle"
										className={`font-mono text-[10px] ${
											isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-400'
										}`}
									>
										{p.data.label}
									</text>
								)}

								{/* Interactive hover, tap & keyboard focus capture rect */}
								<rect
									tabIndex={0}
									role="button"
									aria-label={`${p.data.fullLabel}: ${p.data.total} inbound, ${p.data.qualified} qualified`}
									x={p.x - chartWidth / points.length / 2}
									y={padding.top}
									width={chartWidth / points.length}
									height={chartHeight + padding.bottom}
									fill="transparent"
									className="cursor-pointer focus:outline-none"
									onMouseEnter={() => setHoveredIndex(idx)}
									onFocus={() => setHoveredIndex(idx)}
									onClick={() =>
										setHoveredIndex((prev) => (prev === idx ? null : idx))
									}
								/>
							</g>
						)
					})}
				</svg>

				{/* Floating Responsive Tooltip Card */}
				{activePoint && (
					<div
						className="pointer-events-none absolute top-2 z-20 w-44 -translate-x-1/2 rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-lg backdrop-blur-xs transition-all duration-100"
						style={{
							left: `${tooltipLeftPercent}%`,
						}}
					>
						<p className="border-b border-slate-100 pb-1 text-[11px] font-bold text-slate-700">
							{activePoint.data.fullLabel}
						</p>
						<div className="mt-1.5 space-y-1 font-mono text-xs">
							<div className="flex items-center justify-between gap-4">
								<span className="flex items-center gap-1.5 text-slate-500">
									<span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
									Total Inbound:
								</span>
								<strong className="text-slate-900">
									{activePoint.data.total}
								</strong>
							</div>
							<div className="flex items-center justify-between gap-4">
								<span className="flex items-center gap-1.5 text-emerald-600">
									<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
									Qualified:
								</span>
								<strong className="text-emerald-700">
									{activePoint.data.qualified}
								</strong>
							</div>
							{activePoint.data.urgent > 0 && (
								<div className="flex items-center justify-between gap-4 text-rose-600">
									<span className="flex items-center gap-1">
										<Flame className="h-3 w-3" />
										Urgent:
									</span>
									<strong>{activePoint.data.urgent}</strong>
								</div>
							)}
							{activePoint.data.total > 0 && (
								<div className="border-t border-slate-100 pt-1 text-[10px] text-slate-400">
									Qual rate:{' '}
									<span className="font-bold text-emerald-600">
										{Math.round(
											(activePoint.data.qualified / activePoint.data.total) *
												100,
										)}
										%
									</span>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Bottom Metrics Bar */}
			<div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-4">
				<div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-2.5 text-center">
					<span className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
						Period Volume
					</span>
					<span className="mt-0.5 block font-mono text-base font-bold text-slate-900">
						{periodTotal.toLocaleString('en-US')} leads
					</span>
				</div>

				<div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-2.5 text-center">
					<span className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
						Avg Inbound Pace
					</span>
					<span className="mt-0.5 block font-mono text-base font-bold text-slate-900">
						{avgDaily} / {isHourly ? 'hr' : 'day'}
					</span>
				</div>

				<div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-2.5 text-center">
					<span className="block text-[10px] font-semibold tracking-wider text-emerald-800 uppercase">
						Verified Qualified
					</span>
					<span className="mt-0.5 block font-mono text-base font-bold text-emerald-700">
						{periodQualified.toLocaleString('en-US')} leads
					</span>
				</div>

				<div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-2.5 text-center">
					<span className="block text-[10px] font-semibold tracking-wider text-blue-800 uppercase">
						Peak Inbound
					</span>
					<span className="mt-0.5 block truncate font-mono text-xs font-bold text-blue-800">
						{peakPoint && peakPoint.total > 0
							? `${peakPoint.total} (${peakPoint.label})`
							: '—'}
					</span>
				</div>
			</div>
		</div>
	)
}
