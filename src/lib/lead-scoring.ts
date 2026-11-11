/**
 * AI Lead Scoring & Intent Analysis Engine
 * Evaluates B2B Prospect Quality, Corporate Email Legitimacy,
 * Intent Urgency, and generates 1-Click Personalized Pitch Drafts.
 */

// Common personal & free webmail providers
const FREE_EMAIL_DOMAINS = new Set([
	'gmail.com',
	'googlemail.com',
	'yahoo.com',
	'ymail.com',
	'yahoo.com.vn',
	'hotmail.com',
	'outlook.com',
	'live.com',
	'msn.com',
	'icloud.com',
	'me.com',
	'mac.com',
	'aol.com',
	'proton.me',
	'protonmail.com',
	'zoho.com',
	'mail.com',
	'gmx.com',
	'yandex.com',
	'qq.com',
	'163.com',
])

/**
 * Check if an email belongs to a corporate business domain
 */
export function isCorporateEmail(email?: string | null): boolean {
	if (!email || !email.includes('@')) return false
	const domain = email.trim().split('@')[1]?.toLowerCase()
	if (!domain || !domain.includes('.')) return false
	return !FREE_EMAIL_DOMAINS.has(domain)
}

export interface LeadScoreResult {
	score: number
	tier: 'hot' | 'warm' | 'cold'
	reasons: string[]
	isCorporate: boolean
}

/**
 * AI & Rule-based Lead Intent Scoring (0 to 100)
 */
export function calculateLeadScore(lead: {
	name?: string | null
	email?: string | null
	phone?: string | null
	company_name?: string | null
	budget_range?: string | null
	message?: string | null
	source?: string | null
}): LeadScoreResult {
	let score = 20 // Base intent score for taking the initiative to submit
	const reasons: string[] = ['Initial inquiry submission via solution form']

	// 1. Corporate Email check (+25 points)
	const isCorporate = isCorporateEmail(lead.email)
	if (isCorporate) {
		score += 25
		const domain = lead.email?.split('@')[1] || 'Corporate'
		reasons.push(`Official corporate email domain (@${domain}) (+25pts)`)
	} else if (lead.email) {
		score += 5
		reasons.push('Personal / generic webmail address (+5pts)')
	}

	// 2. Direct Phone (+15 points)
	if (lead.phone && lead.phone.replace(/\D/g, '').length >= 9) {
		score += 15
		reasons.push('Direct telephone contact provided (+15pts)')
	}

	// 3. Company Name (+15 points)
	if (lead.company_name && lead.company_name.trim().length >= 3) {
		score += 15
		reasons.push(`Verified company entity: ${lead.company_name.trim()} (+15pts)`)
	}

	// 4. Budget Range (+10 to +25 points)
	const budget = (lead.budget_range || '').toLowerCase()
	if (
		budget.includes('100') ||
		budget.includes('250') ||
		budget.includes('500') ||
		budget.includes('$10,000') ||
		budget.includes('$25,000') ||
		budget.includes('enterprise') ||
		budget.includes('large')
	) {
		score += 25
		reasons.push('Enterprise / High-volume purchasing budget (+25pts)')
	} else if (budget.includes('30') || budget.includes('50') || budget.includes('$5,000')) {
		score += 15
		reasons.push('Mid-tier commercial budget (+15pts)')
	} else if (budget) {
		score += 5
		reasons.push('Preliminary budget specified (+5pts)')
	}

	// 5. Message Content Depth & Urgency Keywords (+10 to +20 points)
	const msg = (lead.message || '').toLowerCase()
	const urgentKeywords = [
		'urgent',
		'rfq',
		'quote',
		'quotation',
		'contract',
		'sample',
		'samples',
		'oem',
		'odm',
		'volume',
		'discount',
		'export',
		'demo',
		'meeting',
		'next week',
		'asap',
		'immediate',
		'corporate gifts',
		'esg',
		'fsc',
	]

	const matchedKeywords = urgentKeywords.filter((k) => msg.includes(k))
	if (matchedKeywords.length >= 2) {
		score += 15
		reasons.push(`High commercial purchase intent (keywords: ${matchedKeywords.slice(0, 3).join(', ')}) (+15pts)`)
	} else if (matchedKeywords.length === 1) {
		score += 8
		reasons.push(`Target commercial keyword detected (${matchedKeywords[0]}) (+8pts)`)
	}

	if (lead.message && lead.message.trim().length > 60) {
		score += 5
		reasons.push('Detailed project scope and contextual requirements (+5pts)')
	}

	// Clamp 0 - 100
	const finalScore = Math.min(100, Math.max(10, score))
	const tier: 'hot' | 'warm' | 'cold' =
		finalScore >= 80 ? 'hot' : finalScore >= 55 ? 'warm' : 'cold'

	return {
		score: finalScore,
		tier,
		reasons,
		isCorporate,
	}
}

/**
 * Generate 2-bullet executive summary and 1-Click Personalized Pitch Email
 */
export function generateLeadSummaryAndPitch(
	lead: {
		name?: string | null
		email?: string | null
		company_name?: string | null
		budget_range?: string | null
		message?: string | null
		source?: string | null
		country?: string | null
	},
	brandName?: string,
): { summary: string; pitchDraft: string } {
	const brand = brandName || process.env.NEXT_PUBLIC_SITE_NAME || 'DeanFlow Enterprise'
	const customerName = lead.name || 'Valued Partner'
	const company = lead.company_name || 'your organization'
	const msg = lead.message || `Interest in products and commercial services from ${brand}`
	const budget = lead.budget_range ? ` (Budget: ${lead.budget_range})` : ''

	// 2 crisp bullet points
	const summaryLine1 = `• Core Requirement: ${company} inquiring about product solutions${budget}.`
	const summaryLine2 = `• Scope & Details: "${msg.length > 120 ? msg.slice(0, 120) + '...' : msg}"`
	const summary = `${summaryLine1}\n${summaryLine2}`

	// Personalized Pitch Draft
	const pitchDraft = `Dear ${customerName},

Thank you for reaching out to ${brand}. We are excited about the opportunity to support ${lead.company_name ? lead.company_name : 'your organization'}.

Regarding your project: "${msg.length > 80 ? msg.slice(0, 80) + '...' : msg}", our enterprise solutions team has prepared our manufacturing capabilities overview and volume tier pricing schedule for your consideration.

May we schedule a brief 10-minute briefing or dispatch our detailed product catalog and quotation package via email today to ensure we meet ${company}'s target timeline?

Sincerely,
Enterprise Advisory Team
${brand}`

	return {
		summary,
		pitchDraft,
	}
}
