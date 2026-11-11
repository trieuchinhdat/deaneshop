'use client'

import { useMemo, useState } from 'react'
import { FiCheckCircle, FiPackage, FiShoppingBag, FiTruck } from 'react-icons/fi'
import { formatPrice } from '@/lib/utils'

interface FulfillmentDistributionChartProps {
	orders: any[]
	onOpenOrders?: () => void
}

interface StatusSegment {
	id: string
	label: string
	count: number
	color: string
	strokeColor: string
	percentage: number
}

export default function FulfillmentDistributionChart({
	orders = [],
	onOpenOrders,
}: FulfillmentDistributionChartProps) {
	const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

	const { segments, totalOrders, deliveredCount, completionRate, highTicketStats } = useMemo(() => {
		const total = orders.length
		let pending = 0
		let processing = 0
		let shipping = 0
		let delivered = 0
		let cancelled = 0

		let highTicketCount = 0
		let highTicketRevenue = 0
		let totalRevenue = 0

		orders.forEach((o) => {
			const st = (o.fulfillmentStatus || 'PENDING').toUpperCase()
			const totalAmount = Number(o?.pricing?.grandTotal) || 0

			if (st !== 'CANCELLED' && st !== 'RETURNED') {
				totalRevenue += totalAmount
				if (totalAmount >= 100) {
					highTicketCount++
					highTicketRevenue += totalAmount
				}
			}

			if (st === 'PENDING' || !o.fulfillmentStatus) pending++
			else if (st === 'PROCESSING' || st === 'CONFIRMED') processing++
			else if (st === 'SHIPPING') shipping++
			else if (st === 'DELIVERED') delivered++
			else if (st === 'CANCELLED' || st === 'RETURNED') cancelled++
		})

		const segs: StatusSegment[] = [
			{
				id: 'delivered',
				label: 'Delivered & Fulfilled',
				count: delivered,
				color: 'bg-emerald-500',
				strokeColor: '#10b981',
				percentage: total > 0 ? Math.round((delivered / total) * 100) : 0,
			},
			{
				id: 'shipping',
				label: 'In Transit / Shipping',
				count: shipping,
				color: 'bg-indigo-500',
				strokeColor: '#6366f1',
				percentage: total > 0 ? Math.round((shipping / total) * 100) : 0,
			},
			{
				id: 'processing',
				label: 'Processing / Packed',
				count: processing,
				color: 'bg-blue-500',
				strokeColor: '#3b82f6',
				percentage: total > 0 ? Math.round((processing / total) * 100) : 0,
			},
			{
				id: 'pending',
				label: 'Pending Dispatch',
				count: pending,
				color: 'bg-amber-500',
				strokeColor: '#f59e0b',
				percentage: total > 0 ? Math.round((pending / total) * 100) : 0,
			},
			{
				id: 'cancelled',
				label: 'Cancelled / Returned',
				count: cancelled,
				color: 'bg-rose-400',
				strokeColor: '#fb7185',
				percentage: total > 0 ? Math.round((cancelled / total) * 100) : 0,
			},
		]

		const compRate = total > 0 ? Math.round((delivered / total) * 100) : 0

		return {
			segments: segs,
			totalOrders: total,
			deliveredCount: delivered,
			completionRate: compRate,
			highTicketStats: {
				count: highTicketCount,
				revenue: highTicketRevenue,
				pct: totalRevenue > 0 ? Math.round((highTicketRevenue / totalRevenue) * 100) : 0,
			},
		}
	}, [orders])

	// Donut Chart SVG Calculations
	const radius = 40
	const circumference = 2 * Math.PI * radius // ~251.32
	let accumulatedPercent = 0

	return (
		<div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-3">
				<div className="flex items-center gap-2.5 min-w-0">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 shrink-0">
						<FiPackage className="h-4.5 w-4.5" />
					</div>
					<div className="min-w-0">
						<h3 className="font-black text-base text-slate-900 tracking-tight whitespace-nowrap">
							Fulfillment Operations Breakdown
						</h3>
						<p className="text-[11px] text-slate-400 truncate">
							Dispatch completion rate and logistics status distribution
						</p>
					</div>
				</div>

				<span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap shrink-0">
					{totalOrders} Total Orders
				</span>
			</div>

			{/* Donut and Legend Layout */}
			<div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
				{/* SVG Donut */}
				<div className="relative flex items-center justify-center shrink-0">
					<svg width="140" height="140" viewBox="0 0 100 100" className="-rotate-90">
						{/* Background Track */}
						<circle
							cx="50"
							cy="50"
							r={radius}
							fill="transparent"
							stroke="#f1f5f9"
							strokeWidth="11"
						/>

						{/* Segment Circles */}
						{totalOrders > 0 &&
							segments.map((seg) => {
								if (seg.count <= 0) return null
								const strokeDasharray = `${(seg.count / totalOrders) * circumference} ${circumference}`
								const strokeDashoffset = -((accumulatedPercent / 100) * circumference)
								accumulatedPercent += (seg.count / totalOrders) * 100
								const isHovered = hoveredSegment === seg.id

								return (
									<circle
										key={seg.id}
										cx="50"
										cy="50"
										r={radius}
										fill="transparent"
										stroke={seg.strokeColor}
										strokeWidth={isHovered ? 13 : 11}
										strokeDasharray={strokeDasharray}
										strokeDashoffset={strokeDashoffset}
										className="transition-all duration-300 cursor-pointer"
										onMouseEnter={() => setHoveredSegment(seg.id)}
										onMouseLeave={() => setHoveredSegment(null)}
									/>
								)
							})}
					</svg>

					{/* Center Metric */}
					<div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
						<span className="font-mono text-2xl font-black text-slate-900 tracking-tight">
							{completionRate}%
						</span>
						<span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
							Fulfilled
						</span>
					</div>
				</div>

				{/* Legend List */}
				<div className="flex-1 w-full space-y-2">
					{segments.map((seg) => (
						<div
							key={seg.id}
							onMouseEnter={() => setHoveredSegment(seg.id)}
							onMouseLeave={() => setHoveredSegment(null)}
							className={`flex items-center justify-between text-xs p-1.5 rounded-xl transition cursor-pointer ${
								hoveredSegment === seg.id ? 'bg-slate-50' : ''
							}`}
						>
							<div className="flex items-center gap-2">
								<span className={`h-2.5 w-2.5 rounded-full ${seg.color}`} />
								<span className="font-medium text-slate-700">{seg.label}</span>
							</div>
							<div className="flex items-center gap-2 font-mono">
								<span className="text-slate-400 text-[11px]">({seg.percentage}%)</span>
								<span className="font-bold text-slate-900">{seg.count}</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* High-Ticket Orders Highlight Banner */}
			<div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 text-xs">
						<FiShoppingBag className="h-3.5 w-3.5 text-amber-600" />
					</span>
					<div>
						<div className="text-xs font-bold text-slate-800">
							{highTicketStats.count} High-Ticket Orders (≥ $100)
						</div>
						<div className="text-[10px] text-slate-400">
							Contributes {highTicketStats.pct}% of overall store revenue
						</div>
					</div>
				</div>

				<span className="font-mono text-xs font-black text-slate-900">
					{formatPrice(highTicketStats.revenue)}
				</span>
			</div>
		</div>
	)
}
