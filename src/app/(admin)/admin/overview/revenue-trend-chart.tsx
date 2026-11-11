'use client'

import { useMemo, useState } from 'react'
import { FiCalendar, FiTrendingUp } from 'react-icons/fi'
import { formatPrice } from '@/lib/utils'

interface RevenueTrendChartProps {
	orders: any[]
	timeframe: string // 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all'
	customRange?: { startDate: Date | null; endDate: Date | null; preset?: string } | null
}

interface DataPoint {
	dateStr: string
	label: string
	fullDate: string
	revenue: number
	orderCount: number
}

// Cubic bezier spline generator for ultra-smooth area curves
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

export default function RevenueTrendChart({
	orders = [],
	timeframe = '30d',
	customRange,
}: RevenueTrendChartProps) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

	// Build timeline buckets based on timeframe
	const chartData = useMemo<DataPoint[]>(() => {
		// Check if it's a single-day view (Today, Yesterday, or 1-day custom range)
		const isToday = customRange?.preset === 'today' || timeframe === 'today'
		const isYesterday =
			customRange?.preset === 'yesterday' || timeframe === 'yesterday'
		const isSingleDayCustom = Boolean(
			customRange?.startDate &&
				customRange?.endDate &&
				customRange.startDate.toDateString() ===
					customRange.endDate.toDateString(),
		)

		if (isToday || isYesterday || isSingleDayCustom) {
			const target = customRange?.startDate
				? new Date(customRange.startDate)
				: new Date()
			if (isYesterday && !customRange?.startDate) {
				target.setDate(target.getDate() - 1)
			}
			const targetYear = target.getFullYear()
			const targetMonth = target.getMonth()
			const targetDate = target.getDate()
			const targetDateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDate).padStart(2, '0')}`

			const buckets: Map<number, { revenue: number; count: number }> = new Map()
			for (let h = 0; h < 24; h++) {
				buckets.set(h, { revenue: 0, count: 0 })
			}

			orders.forEach((order) => {
				if (
					order.fulfillmentStatus === 'CANCELLED' ||
					order.fulfillmentStatus === 'RETURNED'
				)
					return
				const rawDate = order._createdAt || order.createdAt
				if (!rawDate) return

				const d = new Date(rawDate)
				if (
					d.getFullYear() === targetYear &&
					d.getMonth() === targetMonth &&
					d.getDate() === targetDate
				) {
					const hour = d.getHours()
					const current = buckets.get(hour)
					if (current) {
						current.revenue += Number(order.pricing?.grandTotal) || 0
						current.count += 1
					}
				}
			})

			const list: DataPoint[] = []
			const periodPrefix = isToday
				? 'Today'
				: isYesterday
					? 'Yesterday'
					: target.toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric',
						})

			buckets.forEach((val, hour) => {
				const hourStr = `${String(hour).padStart(2, '0')}:00`
				list.push({
					dateStr: `${targetDateStr} ${hourStr}`,
					label: hourStr,
					fullDate: `${periodPrefix}, ${hourStr}`,
					revenue: Math.round(val.revenue * 100) / 100,
					orderCount: val.count,
				})
			})

			return list
		}

		// Multi-day range (custom or preset)
		let start: Date
		let end: Date

		if (customRange?.startDate && customRange?.endDate) {
			start = new Date(customRange.startDate)
			end = new Date(customRange.endDate)
		} else {
			end = new Date()
			const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30
			start = new Date(end)
			start.setDate(end.getDate() - (days - 1))
		}

		const diffDays = Math.max(
			1,
			Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
		)

		const buckets: Map<string, { revenue: number; count: number; date: Date }> =
			new Map()
		for (let i = 0; i <= diffDays; i++) {
			const d = new Date(start)
			d.setDate(start.getDate() + i)
			if (d.getTime() > end.getTime() && i > 0) break
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
			buckets.set(key, { revenue: 0, count: 0, date: d })
		}

		orders.forEach((order) => {
			if (
				order.fulfillmentStatus === 'CANCELLED' ||
				order.fulfillmentStatus === 'RETURNED'
			)
				return
			const rawDate = order._createdAt || order.createdAt
			if (!rawDate) return

			const d = new Date(rawDate)
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

			if (buckets.has(key)) {
				const current = buckets.get(key)!
				current.revenue += Number(order.pricing?.grandTotal) || 0
				current.count += 1
			}
		})

		const list: DataPoint[] = []
		buckets.forEach((val, key) => {
			const month = val.date.toLocaleString('en-US', { month: 'short' })
			const day = val.date.getDate()
			list.push({
				dateStr: key,
				label: `${month} ${day}`,
				fullDate: val.date.toLocaleDateString('en-US', {
					weekday: 'short',
					day: 'numeric',
					month: 'short',
					year: 'numeric',
				}),
				revenue: Math.round(val.revenue * 100) / 100,
				orderCount: val.count,
			})
		})

		// If more than 45 points, compress into 3-day steps
		if (list.length > 45) {
			const compressed: DataPoint[] = []
			for (let i = 0; i < list.length; i += 3) {
				const chunk = list.slice(i, i + 3)
				const totalRev = chunk.reduce((s, c) => s + c.revenue, 0)
				const totalCnt = chunk.reduce((s, c) => s + c.orderCount, 0)
				compressed.push({
					dateStr: chunk[0].dateStr,
					label: chunk[0].label,
					fullDate: `${chunk[0].label} - ${chunk[chunk.length - 1].label}`,
					revenue: Math.round(totalRev * 100) / 100,
					orderCount: totalCnt,
				})
			}
			return compressed
		}

		return list
	}, [orders, timeframe, customRange])

	// Calculations for chart geometry
	const {
		maxRevenue,
		maxOrders,
		totalPeriodRevenue,
		peakDay,
		totalPeriodOrders,
	} = useMemo<{
		maxRevenue: number
		maxOrders: number
		totalPeriodRevenue: number
		peakDay: DataPoint | null
		totalPeriodOrders: number
	}>(() => {
		let maxRev = 0
		let maxOrd = 0
		let totalRev = 0
		let totalOrd = 0
		let peak: DataPoint | null = null

		chartData.forEach((d) => {
			if (d.revenue > maxRev) {
				maxRev = d.revenue
				peak = d
			}
			if (d.orderCount > maxOrd) maxOrd = d.orderCount
			totalRev += d.revenue
			totalOrd += d.orderCount
		})

		return {
			maxRevenue: maxRev > 0 ? maxRev * 1.15 : 100, // +15% headroom
			maxOrders: maxOrd > 0 ? maxOrd : 5,
			totalPeriodRevenue: totalRev,
			peakDay: peak,
			totalPeriodOrders: totalOrd,
		}
	}, [chartData])

	// SVG Dimensions
	const svgWidth = 680
	const svgHeight = 220
	const padding = { top: 20, right: 20, bottom: 35, left: 55 }
	const chartWidth = svgWidth - padding.left - padding.right
	const chartHeight = svgHeight - padding.top - padding.bottom

	// Map points to SVG coordinates
	const points = useMemo(() => {
		if (chartData.length === 0) return []
		const stepX = chartWidth / Math.max(chartData.length - 1, 1)

		return chartData.map((d, i) => {
			const x = padding.left + i * stepX
			const revRatio = Math.min(1, Math.max(0, d.revenue / maxRevenue))
			const y = padding.top + chartHeight - revRatio * chartHeight
			const barHeight =
				maxOrders > 0 ? (d.orderCount / maxOrders) * (chartHeight * 0.45) : 0
			const barY = padding.top + chartHeight - barHeight

			return { x, y, barY, barHeight, data: d }
		})
	}, [
		chartData,
		maxRevenue,
		maxOrders,
		chartWidth,
		chartHeight,
		padding.left,
		padding.top,
	])

	// Curved SVG Paths
	const curvePath = useMemo(() => getCurvedPath(points), [points])
	const areaPath = useMemo(() => {
		if (points.length === 0) return ''
		const baselineY = padding.top + chartHeight
		return `${curvePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
	}, [curvePath, points, padding.top, chartHeight])

	// Y-axis grid ticks (4 levels)
	const yTicks = useMemo(() => {
		return [0, 0.33, 0.66, 1].map((pct) => {
			const val = Math.round(maxRevenue * pct)
			const y = padding.top + chartHeight - pct * chartHeight
			return { val, y }
		})
	}, [maxRevenue, padding.top, chartHeight])

	// X-axis label interval
	const labelStep = Math.max(1, Math.floor(chartData.length / 6))

	const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null

	return (
		<div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
			{/* Top Header & Stat Highlights */}
			<div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-2 sm:flex-row sm:items-center">
				<div className="flex min-w-0 items-center gap-2.5">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-600">
						<FiTrendingUp className="h-4.5 w-4.5" />
					</div>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-base font-black tracking-tight whitespace-nowrap text-slate-900">
								Revenue Dynamics & Order Velocity
							</h3>
							<span className="shrink-0 rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-emerald-700">
								Live
							</span>
						</div>
						<p className="truncate text-[11px] text-slate-400">
							Net realized revenue curve and order frequency in timeframe (
							{timeframe === 'today'
								? 'Today'
								: timeframe === 'yesterday'
									? 'Yesterday'
									: timeframe === '7d'
										? 'Past 7 Days'
										: timeframe === '30d'
											? 'Past 30 Days'
											: timeframe === '90d'
												? 'Past 90 Days'
												: 'All Time'}
							)
						</p>
					</div>
				</div>

				{/* Quick Stats Pill */}
				<div className="flex shrink-0 items-center gap-3 self-start rounded-2xl border border-slate-200/80 bg-slate-50 px-3.5 py-1.5 whitespace-nowrap sm:self-auto">
					<div>
						<span className="block text-[10px] leading-tight font-bold whitespace-nowrap text-slate-400 uppercase">
							Period Total ({totalPeriodOrders} orders)
						</span>
						<span className="font-mono text-sm font-black whitespace-nowrap text-slate-900">
							{formatPrice(totalPeriodRevenue)}
						</span>
					</div>
					<div className="h-6 w-px shrink-0 bg-slate-200" />
					<div>
						<span className="block text-[10px] leading-tight font-bold whitespace-nowrap text-slate-400 uppercase">
							Peak ({peakDay ? peakDay.label : '---'})
						</span>
						<span className="font-mono text-sm font-bold whitespace-nowrap text-emerald-600">
							{peakDay ? formatPrice(peakDay.revenue) : '$0'}
						</span>
					</div>
				</div>
			</div>

			{/* Interactive SVG Chart Container */}
			<div className="relative select-none">
				{/* Chart Legends */}
				<div className="mb-1 flex items-center justify-end gap-4 text-xs font-semibold text-slate-600">
					<div className="flex items-center gap-1.5">
						<span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
						<span>Revenue ($)</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="h-2.5 w-2 rounded-xs bg-slate-300" />
						<span>Order Volume (Bars)</span>
					</div>
				</div>

				<div className="w-full overflow-hidden">
					<svg
						viewBox={`0 0 ${svgWidth} ${svgHeight}`}
						className="h-auto w-full cursor-crosshair overflow-visible"
						onMouseLeave={() => setHoveredIndex(null)}
					>
						<defs>
							{/* Gradient for area fill */}
							<linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
								<stop offset="70%" stopColor="#10b981" stopOpacity="0.05" />
								<stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
							</linearGradient>

							{/* Gradient for bars */}
							<linearGradient id="orderBarGrad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#94a3b8" stopOpacity="0.8" />
								<stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.3" />
							</linearGradient>
						</defs>

						{/* Horizontal Gridlines & Y-Axis Labels */}
						{yTicks.map((tick, idx) => (
							<g key={idx}>
								<line
									x1={padding.left}
									y1={tick.y}
									x2={svgWidth - padding.right}
									y2={tick.y}
									stroke="#f1f5f9"
									strokeWidth="1"
									strokeDasharray={idx === 0 ? 'none' : '4 4'}
								/>
								<text
									x={padding.left - 8}
									y={tick.y + 3.5}
									textAnchor="end"
									className="fill-slate-400 font-mono text-[9px] font-semibold"
								>
									{formatPrice(tick.val)}
								</text>
							</g>
						))}

						{/* Order Volume Bars in Background */}
						{points.map((pt, i) => {
							const barWidth = Math.max(
								3,
								Math.min(10, chartWidth / points.length - 3),
							)
							if (pt.data.orderCount <= 0) return null
							return (
								<rect
									key={`bar-${i}`}
									x={pt.x - barWidth / 2}
									y={pt.barY}
									width={barWidth}
									height={pt.barHeight}
									rx="2"
									fill="url(#orderBarGrad)"
									className="transition-all duration-150"
									opacity={hoveredIndex === i ? 1 : 0.65}
								/>
							)
						})}

						{/* Area Fill */}
						{areaPath && <path d={areaPath} fill="url(#revenueAreaGrad)" />}

						{/* Main Trend Line */}
						{curvePath && (
							<path
								d={curvePath}
								fill="none"
								stroke="#10b981"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						)}

						{/* X-Axis Dates */}
						{points.map((pt, i) => {
							const shouldShow = i % labelStep === 0 || i === points.length - 1
							if (!shouldShow) return null
							return (
								<text
									key={`lbl-${i}`}
									x={pt.x}
									y={svgHeight - 10}
									textAnchor="middle"
									className="fill-slate-400 text-[10px] font-medium"
								>
									{pt.data.label}
								</text>
							)
						})}

						{/* Interactive Crosshair & Point Highlight */}
						{activePoint && (
							<g>
								{/* Vertical Indicator Line */}
								<line
									x1={activePoint.x}
									y1={padding.top}
									x2={activePoint.x}
									y2={padding.top + chartHeight}
									stroke="#0f172a"
									strokeWidth="1.2"
									strokeDasharray="3 3"
									opacity="0.5"
								/>

								{/* Outer Pulse */}
								<circle
									cx={activePoint.x}
									cy={activePoint.y}
									r="6.5"
									fill="#10b981"
									opacity="0.3"
								/>
								{/* Inner Dot */}
								<circle
									cx={activePoint.x}
									cy={activePoint.y}
									r="3.5"
									fill="#ffffff"
									stroke="#059669"
									strokeWidth="2"
								/>
							</g>
						)}

						{/* Invisible touch/hover hit zones across the width */}
						{points.map((pt, i) => {
							const step = chartWidth / points.length
							return (
								<rect
									key={`hit-${i}`}
									x={pt.x - step / 2}
									y={padding.top}
									width={step}
									height={chartHeight + 15}
									fill="transparent"
									className="cursor-pointer"
									onMouseEnter={() => setHoveredIndex(i)}
									onTouchStart={() => setHoveredIndex(i)}
								/>
							)
						})}
					</svg>
				</div>

				{/* Floating Interactive Tooltip */}
				{activePoint && (
					<div
						className="pointer-events-none absolute z-30 transition-all duration-75 ease-out"
						style={{
							left: `${(activePoint.x / svgWidth) * 100}%`,
							top: `${(activePoint.y / svgHeight) * 100}%`,
							transform: 'translate(-50%, -120%)',
						}}
					>
						<div className="space-y-0.5 rounded-xl bg-slate-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-xl ring-1 ring-white/15">
							<div className="flex items-center gap-1 text-[10px] font-medium text-slate-300">
								<FiCalendar className="h-3 w-3 text-slate-400" />
								<span>{activePoint.data.fullDate}</span>
							</div>
							<div className="font-mono text-sm font-bold text-emerald-400">
								{formatPrice(activePoint.data.revenue)}
							</div>
							<div className="text-[10px] text-slate-300">
								{activePoint.data.orderCount}{' '}
								{activePoint.data.orderCount === 1 ? 'order' : 'orders'}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
