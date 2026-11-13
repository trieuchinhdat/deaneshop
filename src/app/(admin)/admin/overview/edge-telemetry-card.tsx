'use client'

import { Activity, Eye, Gauge, MousePointerClick, Sparkles, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AnalyticsEngineSummary } from '@/lib/analytics-engine'

function mapDateRangeToDays(dateRange: string): number {
	if (dateRange === 'today' || dateRange === 'yesterday') return 2
	if (dateRange === '7d') return 7
	if (dateRange === '30d' || dateRange === 'month') return 30
	return 14
}

export default function EdgeTelemetryCard({ dateRange }: { dateRange: string }) {
	const [data, setData] = useState<AnalyticsEngineSummary | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		const days = mapDateRangeToDays(dateRange)
		setLoading(true)
		fetch(`/api/admin/analytics-engine?days=${days}`, { cache: 'no-store' })
			.then((r) => (r.ok ? r.json() : null))
			.then((json: AnalyticsEngineSummary | null) => {
				if (!cancelled) setData(json)
			})
			.catch(() => {
				if (!cancelled) setData(null)
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [dateRange])

	if (loading && !data) {
		return (
			<div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
				<div className="h-4 w-52 animate-pulse rounded bg-slate-100" />
				<div className="mt-3 grid gap-3 sm:grid-cols-4">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="h-16 animate-pulse rounded-lg bg-slate-50" />
					))}
				</div>
			</div>
		)
	}

	if (!data) return null

	return (
		<section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
				<div>
					<h2 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-600 uppercase">
						<Activity className="h-4 w-4 text-sky-600" />
						Edge Funnel &amp; Web Vitals (Cloudflare Analytics Engine)
					</h2>
					<p className="mt-0.5 text-[11px] text-slate-400">
						Zero-D1-write time-series dataset `{data.dataset}` · Last {data.days} days
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<span
						className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
							data.bindingAvailable
								? 'border-emerald-200 bg-emerald-50 text-emerald-700'
								: 'border-amber-200 bg-amber-50 text-amber-700'
						}`}
					>
						<Zap className="h-3 w-3" />
						{data.bindingAvailable ? 'ANALYTICS Binding Active' : 'Local / Unbound Preview'}
					</span>
					<span
						className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
							data.configured && data.funnel
								? 'border-sky-200 bg-sky-50 text-sky-700'
								: 'border-slate-200 bg-slate-50 text-slate-600'
						}`}
					>
						{data.configured && data.funnel ? 'SQL API Live' : 'SQL Query Unconfigured'}
					</span>
				</div>
			</div>

			{data.funnel ? (
				<div className="mt-4 space-y-4">
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
						<div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
							<span className="flex items-center gap-1 text-[11px] text-slate-500">
								<Eye className="h-3.5 w-3.5 text-slate-400" />
								Page Views
							</span>
							<p className="mt-1 text-lg font-bold text-slate-900">
								{data.funnel.pageViews.toLocaleString()}
							</p>
						</div>
						<div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
							<span className="flex items-center gap-1 text-[11px] text-slate-500">
								<MousePointerClick className="h-3.5 w-3.5 text-slate-400" />
								CTA &amp; Contact Clicks
							</span>
							<p className="mt-1 text-lg font-bold text-slate-900">
								{(data.funnel.ctaClicks + data.funnel.contactClicks).toLocaleString()}
							</p>
						</div>
						<div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
							<span className="flex items-center gap-1 text-[11px] text-slate-500">
								<Sparkles className="h-3.5 w-3.5 text-slate-400" />
								Form Starts
							</span>
							<p className="mt-1 text-lg font-bold text-slate-900">
								{data.funnel.formStarts.toLocaleString()}
							</p>
						</div>
						<div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
							<span className="text-[11px] font-medium text-emerald-700">
								Server Conversions
							</span>
							<p className="mt-1 text-lg font-bold text-emerald-700">
								{data.funnel.conversions.toLocaleString()}
							</p>
						</div>
						<div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
							<span className="flex items-center gap-1 text-[11px] text-slate-500">
								<Gauge className="h-3.5 w-3.5 text-slate-400" />
								Avg LCP / INP / CLS
							</span>
							<p className="mt-1 font-mono text-xs font-semibold text-slate-800">
								{data.vitals
									? `${data.vitals.avgLcpMs}ms / ${data.vitals.avgInpMs}ms / ${data.vitals.avgCls}`
									: 'No samples'}
							</p>
						</div>
					</div>
				</div>
			) : (
				<div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
					{data.reason ||
						'Streamed telemetry writes directly to Workers Analytics Engine without consuming D1 rows. Configure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to render SQL rollups here.'}
				</div>
			)}
		</section>
	)
}

