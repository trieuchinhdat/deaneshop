import type { D1Lead } from './d1'

// Reporting uses UTC calendar days, matching D1 trend buckets and all staff views.
export function leadDateWindow(timeframe: string | null, now = new Date()) {
	const start = new Date(now)
	start.setUTCHours(0, 0, 0, 0)
	const end = new Date(start)
	end.setUTCDate(end.getUTCDate() + 1)
	if (timeframe === 'yesterday') {
		end.setTime(start.getTime())
		start.setUTCDate(start.getUTCDate() - 1)
	} else if (timeframe === '7d' || timeframe === '30d') {
		start.setUTCDate(start.getUTCDate() - (timeframe === '7d' ? 6 : 29))
	} else if (timeframe === 'month') {
		start.setUTCDate(1)
	} else if (timeframe !== 'today') {
		return null
	}
	return { start: start.toISOString(), end: end.toISOString() }
}

export type Qualification = 'not_assessed' | 'qualified' | 'not_a_fit' | 'spam'
export interface LeadAssessment {
	assessment_version: number
	qualification: Qualification
	priority: 'high' | 'normal' | 'low'
	follow_up_at: string | null
	next_action: string
	reason: string
}
export type IntelligenceLead = D1Lead & LeadAssessment
export interface LeadActivity {
	path: string
	title: string
	timestamp: string
	event?: string
}
export function readJourney(raw?: string | null): LeadActivity[] {
	try {
		const value: unknown = JSON.parse(raw || '[]')
		if (!Array.isArray(value)) return []
		return value
			.filter(
				(item): item is LeadActivity =>
					!!item &&
					typeof item.path === 'string' &&
					item.path.startsWith('/') &&
					typeof item.timestamp === 'string' &&
					Number.isFinite(Date.parse(item.timestamp)),
			)
			.slice(-40)
	} catch {
		return []
	}
}
export function safeWebUrl(value?: string | null): string | undefined {
	if (!value) return undefined
	try {
		const url = new URL(value)
		return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
	} catch {
		return undefined
	}
}
export function leadChannel(
	source?: string | null,
	medium?: string | null,
): string {
	const s = (source || '').toLowerCase(),
		m = (medium || '').toLowerCase()
	if (
		['cpc', 'ppc', 'paid', 'paid_social', 'paid_search'].includes(m) ||
		/_ads$/.test(s)
	)
		return 'Paid'
	if (m === 'organic' || /(^|\.)(google|bing|duckduckgo|yahoo)\./.test(s))
		return 'Organic Search'
	if (m === 'email') return 'Email'
	if (m === 'social' || /facebook|instagram|linkedin|tiktok/.test(s))
		return 'Social'
	if (s === 'direct' || m === 'direct') return 'Direct'
	if (s || m === 'referral') return 'Referral / Other'
	return 'Unknown'
}
export function leadEvidence(lead: D1Lead): string[] {
	const evidence: string[] = []
	if (lead.message?.trim()) evidence.push('Requirements provided')
	if (lead.company_name?.trim())
		evidence.push('Company provided — not verified')
	if (lead.budget_range?.trim()) evidence.push('Budget provided')
	const pages = new Set(
		readJourney(lead.journey_json)
			.filter((item) => !item.event || item.event === 'page_view')
			.map((item) => item.path),
	).size
	if (pages) evidence.push(`${pages} observed pages in captured session`)
	return evidence
}
