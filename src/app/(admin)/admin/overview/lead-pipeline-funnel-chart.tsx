'use client'

import { ChevronRight, Layers } from 'lucide-react'
import { useMemo } from 'react'

export interface StageCount {
	status: string
	count: number
}

export interface QualificationCount {
	qualification: string
	count: number
}

interface LeadPipelineFunnelChartProps {
	stages?: StageCount[]
	qualifications?: QualificationCount[]
	totalLeads?: number
	onOpenFilter?: (filterKey: string) => void
}

export default function LeadPipelineFunnelChart({
	stages = [],
	qualifications = [],
	totalLeads = 0,
	onOpenFilter,
}: LeadPipelineFunnelChartProps) {
	const stageMap = useMemo(() => {
		const m = new Map<string, number>()
		stages.forEach((s) => m.set(s.status?.toLowerCase(), Number(s.count) || 0))
		return m
	}, [stages])

	const qualMap = useMemo(() => {
		const m = new Map<string, number>()
		qualifications.forEach((q) =>
			m.set(q.qualification?.toLowerCase(), Number(q.count) || 0),
		)
		return m
	}, [qualifications])

	const qualifiedCount = qualMap.get('qualified') || 0
	const notAFitCount = qualMap.get('not_a_fit') || 0
	const spamCount = qualMap.get('spam') || 0
	const assessedCount = qualifiedCount + notAFitCount + spamCount

	const contactedCount =
		(stageMap.get('contacted') || 0) + (stageMap.get('discovery') || 0)
	const wonCount = stageMap.get('won') || 0

	const funnelSteps = useMemo(() => {
		const total = Math.max(totalLeads, 1)

		return [
			{
				id: 'all',
				label: 'Total Inbound Captured',
				count: totalLeads,
				pctOfTotal: totalLeads > 0 ? 100 : 0,
				stepRate: null as string | null,
				color: 'bg-blue-600',
				barColor: 'from-blue-500 to-blue-600',
				textColor: 'text-blue-700',
				description: 'Raw inbound submissions from all channels',
				filterKey: 'all',
			},
			{
				id: 'assessed',
				label: 'Assessed & Triaged',
				count: assessedCount,
				pctOfTotal:
					totalLeads > 0 ? Math.round((assessedCount / total) * 100) : 0,
				stepRate:
					totalLeads > 0
						? `${Math.round((assessedCount / total) * 100)}% triaged`
						: null,
				color: 'bg-indigo-600',
				barColor: 'from-indigo-500 to-indigo-600',
				textColor: 'text-indigo-700',
				description: 'Reviewed by sales rep with explicit qualification',
				filterKey: 'assessed',
			},
			{
				id: 'qualified',
				label: 'Sales Qualified (SQL)',
				count: qualifiedCount,
				pctOfTotal:
					totalLeads > 0 ? Math.round((qualifiedCount / total) * 100) : 0,
				stepRate:
					assessedCount > 0
						? `${Math.round((qualifiedCount / assessedCount) * 100)}% of assessed`
						: null,
				color: 'bg-emerald-600',
				barColor: 'from-emerald-500 to-emerald-600',
				textColor: 'text-emerald-700',
				description: 'Qualified by staff based on recorded evidence',
				filterKey: 'qualified',
			},
			{
				id: 'contacted',
				label: 'Contacting / Engaged',
				count: contactedCount,
				pctOfTotal:
					totalLeads > 0 ? Math.round((contactedCount / total) * 100) : 0,
				stepRate:
					totalLeads > 0
						? `${Math.round((contactedCount / total) * 100)}% of inbound`
						: null,
				color: 'bg-amber-600',
				barColor: 'from-amber-500 to-amber-600',
				textColor: 'text-amber-700',
				description: 'Currently marked contacted or discovery',
				filterKey: 'contacted',
			},
			{
				id: 'won',
				label: 'Closed Won (legacy)',
				count: wonCount,
				pctOfTotal: totalLeads > 0 ? Math.round((wonCount / total) * 100) : 0,
				stepRate:
					contactedCount > 0
						? `${Math.round((wonCount / contactedCount) * 100)}% of engaged`
						: null,
				color: 'bg-purple-600',
				barColor: 'from-purple-500 to-purple-600',
				textColor: 'text-purple-700',
				description: 'Marked won by staff in the legacy pipeline',
				filterKey: 'won',
			},
		]
	}, [totalLeads, assessedCount, qualifiedCount, contactedCount, wonCount])

	const qualRate =
		assessedCount > 0 ? Math.round((qualifiedCount / assessedCount) * 100) : 0

	return (
		<div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-slate-100 pb-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200/80 bg-indigo-50 text-indigo-600">
						<Layers className="h-5 w-5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h3 className="text-base font-bold tracking-tight text-slate-900">
								Lead Qualification & Status
							</h3>
							{qualRate > 0 && (
								<span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
									{qualRate}% Qual Rate
								</span>
							)}
						</div>
						<p className="text-xs text-slate-500">
							Current counts as a share of inbound inquiries; groups may overlap
						</p>
					</div>
				</div>
			</div>

			{/* Funnel Stage Progression Tracks */}
			<div className="space-y-2 py-1">
				{funnelSteps.map((step) => {
					return (
						<div
							key={step.id}
							role="button"
							tabIndex={0}
							onClick={() => onOpenFilter?.(step.filterKey)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									onOpenFilter?.(step.filterKey)
								}
							}}
							className="group -mx-2 cursor-pointer space-y-1.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50/80 focus:bg-slate-50 focus:ring-1 focus:ring-slate-300 focus:outline-hidden"
							title={`Filter by ${step.label}`}
						>
							{/* Label row */}
							<div className="flex items-center justify-between text-xs">
								<div className="flex items-center gap-2">
									<span className={`h-2 w-2 rounded-full ${step.color}`} />
									<span className="font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
										{step.label}
									</span>
								</div>

								<div className="flex items-center gap-2 font-mono">
									{step.stepRate && (
										<span className="hidden rounded bg-slate-100 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-500 sm:inline-block">
											{step.stepRate}
										</span>
									)}
									<span className="text-xs font-bold text-slate-900">
										{step.count.toLocaleString('en-US')}
									</span>
									<span className="text-[11px] text-slate-400">
										({step.pctOfTotal}%)
									</span>
									<ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
								</div>
							</div>

							{/* Progress Bar Track */}
							<div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
								<div
									className={`h-full rounded-full bg-linear-to-r ${step.barColor} transition-all duration-500 ease-out`}
									style={{
										width: `${totalLeads > 0 ? Math.max(step.pctOfTotal, step.count > 0 ? 6 : 0) : 0}%`,
									}}
								/>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
