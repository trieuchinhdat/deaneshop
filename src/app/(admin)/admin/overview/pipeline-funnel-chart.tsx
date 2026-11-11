'use client'

import { useMemo } from 'react'
import {
	FiArrowRight,
	FiBriefcase,
	FiCheckCircle,
	FiPieChart,
	FiZap,
} from 'react-icons/fi'

interface PipelineFunnelChartProps {
	leads: any[]
	onOpenLeads?: () => void
}

const FUNNEL_STAGES = [
	{ id: 'new', label: 'New Inbound', color: '#3b82f6', bg: 'bg-blue-500' },
	{ id: 'contacted', label: 'Contacted', color: '#f59e0b', bg: 'bg-amber-500' },
	{
		id: 'discovery',
		label: 'Discovery & Sample',
		color: '#a855f7',
		bg: 'bg-purple-500',
	},
	{
		id: 'proposal',
		label: 'OEM Proposal & Quote',
		color: '#6366f1',
		bg: 'bg-indigo-500',
	},
	{ id: 'won', label: 'Closed Won', color: '#10b981', bg: 'bg-emerald-500' },
]

export default function PipelineFunnelChart({
	leads = [],
	onOpenLeads,
}: PipelineFunnelChartProps) {
	// Aggregate stages
	const { stageCounts, totalLeads, hotLeadsCount, wonCount, winRate } =
		useMemo(() => {
			const counts: Record<string, number> = {
				new: 0,
				contacted: 0,
				discovery: 0,
				proposal: 0,
				won: 0,
				lost: 0,
			}
			let hot = 0

			leads.forEach((l) => {
				const st = (l.status || 'new').toLowerCase()
				if (counts[st] !== undefined) {
					counts[st]++
				} else {
					counts.new++
				}
				if ((Number(l.ai_score) || 0) >= 70) {
					hot++
				}
			})

			const total = leads.length
			const won = counts.won || 0
			const closed = won + (counts.lost || 0)
			const rate =
				closed > 0
					? Math.round((won / closed) * 100)
					: total > 0
						? Math.round((won / total) * 100)
						: 0

			return {
				stageCounts: counts,
				totalLeads: total,
				hotLeadsCount: hot,
				wonCount: won,
				winRate: rate,
			}
		}, [leads])

	const maxCount = useMemo(() => {
		const vals = FUNNEL_STAGES.map((s) => stageCounts[s.id] || 0)
		const m = Math.max(...vals, 1)
		return m
	}, [stageCounts])

	return (
		<div className="flex flex-col justify-between space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
			{/* Header */}
			<div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
				<div className="flex min-w-0 items-center gap-2.5">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-200/80 bg-blue-50 text-blue-600">
						<FiBriefcase className="h-4.5 w-4.5" />
					</div>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							{onOpenLeads && (
								<h3
									className="text-base font-black tracking-tight whitespace-nowrap text-slate-900"
									onClick={onOpenLeads}
								>
									B2B Pipeline Conversion Funnel
								</h3>
							)}
							{hotLeadsCount > 0 && (
								<span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-200/80 bg-rose-50 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-rose-700">
									<FiZap className="h-3 w-3 shrink-0" />
									<span>{hotLeadsCount} Hot</span>
								</span>
							)}
						</div>
						<p className="truncate text-[11px] text-slate-400">
							OEM wholesale negotiations & commercial quote pipeline
						</p>
					</div>
				</div>
			</div>

			{/* Pipeline Progression Funnel Bars */}
			<div className="space-y-3">
				{FUNNEL_STAGES.map((stage, idx) => {
					const count = stageCounts[stage.id] || 0
					const pctOfMax =
						totalLeads > 0
							? Math.max(12, Math.round((count / maxCount) * 100))
							: 10
					const pctOfTotal =
						totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0

					return (
						<div key={stage.id} className="group space-y-1">
							<div className="flex items-center justify-between text-xs">
								<div className="flex items-center gap-2">
									<span
										className="h-2 w-2 rounded-full"
										style={{ backgroundColor: stage.color }}
									/>
									<span className="font-bold text-slate-700">
										{stage.label}
									</span>
								</div>
								<div className="flex items-center gap-2 font-mono">
									<span className="text-[11px] text-slate-400">
										({pctOfTotal}%)
									</span>
									<span className="text-sm font-black text-slate-900">
										{count}
									</span>
								</div>
							</div>

							{/* Funnel Progress Track */}
							<div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
								<div
									className={`h-full rounded-full transition-all duration-500 ease-out ${stage.bg}`}
									style={{
										width: `${pctOfMax}%`,
										opacity: count > 0 ? 1 : 0.25,
									}}
								/>
							</div>
						</div>
					)
				})}
			</div>

			{/* Bottom Pipeline Metrics Summary */}
			<div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 text-center">
				<div className="rounded-xl border border-slate-200/60 bg-slate-50 p-2.5">
					<span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
						Total Leads
					</span>
					<span className="font-mono text-base font-black text-slate-900">
						{totalLeads}
					</span>
				</div>

				<div className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-2.5">
					<span className="block text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
						Closed Won
					</span>
					<span className="font-mono text-base font-black text-emerald-700">
						{wonCount}
					</span>
				</div>

				<div className="rounded-xl border border-blue-200/60 bg-blue-50/70 p-2.5">
					<span className="block text-[10px] font-bold tracking-wider text-blue-700 uppercase">
						Win Rate
					</span>
					<span className="font-mono text-base font-black text-blue-700">
						{winRate}%
					</span>
				</div>
			</div>
		</div>
	)
}
