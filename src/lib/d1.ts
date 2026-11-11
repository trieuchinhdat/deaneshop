/**
 * Cloudflare D1 (Edge SQL) Client Integration
 *
 * Supports:
 * 1. Direct Cloudflare Worker binding via @opennextjs/cloudflare getCloudflareContext().env.DB (and globalThis.DB / process.env.DB shims)
 * 2. Cloudflare D1 REST HTTP API (D1_DATABASE_ID, D1_ACCOUNT_ID, CLOUDFLARE_API_TOKEN)
 * 3. Explicit development-only In-memory fallback store (D1_ALLOW_MEMORY=true, strictly forbidden in production)
 */

import {
	getCloudflareContextSafe,
	getD1Binding,
	getD1BindingSync,
	getEnvVar,
	getEnvVarSync,
} from './cf-env'

export interface D1Lead {
	attribution_json?: string | null
	consent_json?: string | null
	submission_key?: string | null
	submission_hash?: string | null
	submission_result?: string | null
	dossier_payload?: string | null
	id: string
	name: string
	email?: string | null
	phone?: string | null
	country?: string | null
	company_name?: string | null
	company_size?: string | null
	budget_range?: string | null
	source?: string
	landing_page_url?: string | null
	message?: string | null
	status: 'new' | 'contacted' | 'discovery' | 'proposal' | 'won' | 'lost' | 'closed'
	is_corporate_email?: number // 1 or 0
	ai_score?: number // 0 - 100
	ai_summary?: string | null // 2 bullet points
	ai_pitch_draft?: string | null // Personalized email pitch
	journey_json?: string | null // JSON string of [{ path, title, timestamp }]
	ip_country?: string | null
	ip_city?: string | null
	assigned_to?: string | null // User ID or Staff Name
	last_contacted_at?: string | null
	utm_source?: string | null
	utm_medium?: string | null
	utm_campaign?: string | null
	utm_term?: string | null
	utm_content?: string | null
	click_id?: string | null
	internal_notes?: string | null
	version?: number
	enqueue_notify?: number
	dossier_asset_id?: string | null
	created_at: string
	updated_at: string
}

export type AdminUserRole = 'superadmin' | 'admin' | 'sales' | 'cskh' | 'marketing'

export interface D1AdminUser {
	id: string
	email: string
	password_hash: string
	full_name: string
	role: AdminUserRole
	avatar_url?: string | null
	status: 'active' | 'inactive'
	assigned_leads_count: number
	last_login_at?: string | null
	created_at: string
	updated_at: string
}

export interface D1Order {
	request_hash?: string | null
	commerce_json?: string | null
	order_intent?: 'direct' | 'sample' | 'wholesale_rfq'
	version?: number
	paid_cents?: number
	receipt_token_hash?: string | null
	id: string
	order_number: string
	customer_name: string
	customer_email: string
	customer_phone?: string | null
	shipping_country: string
	shipping_address: string
	shipping_city?: string | null
	shipping_state?: string | null
	shipping_postal_code?: string | null
	items_json: string // JSON serialized line items
	subtotal: number
	discount: number
	shipping_fee: number
	total: number
	currency: string
	payment_method: 'cod' | 'bank_transfer' | 'manual'
	payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
	fulfillment_status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled'
	tracking_code?: string | null
	payment_terms?: string | null
	quote_status?: 'draft' | 'pending' | 'sent' | 'viewed' | 'negotiating' | 'approved' | 'revision_requested' | 'rejected' | 'expired' | 'cancelled' | null
	quote_approved_at?: string | null
	quote_approved_by?: string | null
	quote_valid_until?: string | null
	utm_source?: string | null
	utm_medium?: string | null
	utm_campaign?: string | null
	utm_term?: string | null
	utm_content?: string | null
	click_id?: string | null
	customer_note?: string | null
	internal_notes?: string | null
	deleted_at?: string | null
	deleted_by?: string | null
	delete_reason?: string | null
	created_at: string
	updated_at: string
}

export interface D1OrderPayment {
	id: string
	order_id: string
	amount_cents: number
	currency: string
	method: string
	reference: string
	kind: 'payment' | 'refund'
	actor_id: string
	actor_name: string
	notes?: string | null
	created_at: string
}

export interface D1OrderNote {
	id: string
	order_id: string
	author_id: string
	author_name: string
	content: string
	created_at: string
}

export interface D1LeadNote {
	id: string
	lead_id: string
	author_id: string
	author_name: string
	content: string
	created_at: string
}

export interface D1Review {
	id: string
	product_id: string
	product_title?: string | null
	product_slug?: string | null
	author: string
	author_email?: string | null
	rating: number
	comment: string
	media_urls_json?: string | null // JSON serialized media
	is_approved: number // 0 or 1
	response?: string | null
	created_at: string
	updated_at: string
}

export interface D1Comment {
	id: string
	post_id: string
	post_title?: string | null
	post_slug?: string | null
	parent_comment_id?: string | null
	author_name: string
	author_email: string
	content: string
	is_author_reply: number // 0 or 1
	is_approved: number // 0 or 1
	created_at: string
	updated_at: string
}

export interface D1QueryResult<T = any> {
	results: T[]
	success: boolean
	meta?: {
		changes?: number
		duration?: number
		rows_read?: number
		rows_written?: number
		last_row_id?: number
	}
	error?: string
}

// Config resolution (evaluated dynamically per request for Cloudflare Workers compatibility)
function resolveRestConfigSync() {
	const databaseId = getEnvVarSync('D1_DATABASE_ID') || getEnvVarSync('CLOUDFLARE_D1_DATABASE_ID') || ''
	const accountId = getEnvVarSync('D1_ACCOUNT_ID') || getEnvVarSync('CLOUDFLARE_ACCOUNT_ID') || ''
	const apiToken = getEnvVarSync('CLOUDFLARE_API_TOKEN') || ''
	return { databaseId, accountId, apiToken }
}

async function resolveRestConfig() {
	const databaseId = (await getEnvVar('D1_DATABASE_ID')) || (await getEnvVar('CLOUDFLARE_D1_DATABASE_ID')) || ''
	const accountId = (await getEnvVar('D1_ACCOUNT_ID')) || (await getEnvVar('CLOUDFLARE_ACCOUNT_ID')) || ''
	const apiToken = (await getEnvVar('CLOUDFLARE_API_TOKEN')) || ''
	return { databaseId, accountId, apiToken }
}

export type D1RuntimeMode = 'binding' | 'rest' | 'memory' | 'unconfigured'

export function isD1Configured(): boolean {
	const hasBinding = Boolean(getD1BindingSync())
	const { databaseId, accountId, apiToken } = resolveRestConfigSync()
	const hasHttpApi = Boolean(databaseId && accountId && apiToken)
	return hasBinding || hasHttpApi
}

export async function getD1RuntimeMode(): Promise<D1RuntimeMode> {
	if (await getD1Binding()) return 'binding'
	const { databaseId, accountId, apiToken } = await resolveRestConfig()
	if (databaseId && accountId && apiToken) return 'rest'
	const nodeEnv = (await getEnvVar('NODE_ENV')) || process.env.NODE_ENV
	const allowMemory = await getEnvVar('D1_ALLOW_MEMORY')
	const cfCtx = await getCloudflareContextSafe()
	if (nodeEnv !== 'production' && allowMemory === 'true' && !cfCtx?.env?.ASSETS) {
		return 'memory'
	}
	return 'unconfigured'
}

// In-memory fallback repository for local dev when credentials are not yet supplied
const initialB2BLeads: D1Lead[] = [
	{
		id: 'lead_b2b_001',
		name: 'Khang Tran',
		email: 'khang.td@fpt-software.com',
		phone: '+84988123456',
		country: 'VN',
		company_name: 'FPT Software Global',
		company_size: '500 - 1000 employees',
		budget_range: '$15,000 - $35,000 USD',
		source: 'organic_search',
		landing_page_url: 'https://deanflow.com/solutions/b2b-corporate-gifts',
		message: 'We require 1,200 customized corporate gift sets for our international partners on our 25th corporate anniversary. Products must be eco-friendly, laser-engraved with FPT logo, and ESG compliant.',
		status: 'new',
		is_corporate_email: 1,
		ai_score: 94,
		ai_summary: '• Requirement: 1,200 corporate export gift boxes for 25th anniversary milestone.\n• Core specifications: Precision laser branding, international ESG compliance certification.',
		ai_pitch_draft: 'Dear Mr. Khang, DeanFlow is delighted to receive your inquiry from FPT Software. We provide the ESG-certified DeanFlow Signature Box with weekly laser capacity of 5,000 units. May I share our catalog and detailed quotation package via email today?',
		journey_json: JSON.stringify([
			{ path: '/', title: 'DeanFlow Home', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
			{ path: '/blog/xu-huong-qua-tang-doanh-nghiep-esg-2026', title: 'Blog: Corporate Gift Trends ESG 2026', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
			{ path: '/solutions/b2b-corporate-gifts', title: 'B2B Corporate Gift Solutions', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
			{ path: '/contact', title: 'Request Enterprise Quote', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
		]),
		ip_country: 'VN',
		ip_city: 'Ha Noi',
		assigned_to: 'user_sales_alex',
		last_contacted_at: null,
		utm_source: 'google',
		utm_medium: 'organic',
		utm_campaign: 'seo_b2b_esg_2026',
		internal_notes: 'High priority Enterprise deal, requires initial outreach within 5 minutes.',
		created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago (Hot SLA)
		updated_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
	},
	{
		id: 'lead_b2b_002',
		name: 'Sarah Jenkins',
		email: 's.jenkins@stripe.com',
		phone: '+14155552671',
		country: 'US',
		company_name: 'Stripe APAC Regional Office',
		company_size: '1000+ employees',
		budget_range: '$10,000 - $25,000 USD',
		source: 'linkedin_ads',
		landing_page_url: 'https://deanflow.com/eco-materials',
		message: 'Looking for custom sustainable merchandise and eco-friendly packaging for our upcoming developer summit in Singapore. Need samples shipped by next Tuesday.',
		status: 'contacted',
		is_corporate_email: 1,
		ai_score: 89,
		ai_summary: '• Requirement: Eco packaging & sustainable corporate gifts for Stripe Singapore Developer Summit.\n• Delivery urgency: Physical courier samples required in Singapore before next Tuesday.',
		ai_pitch_draft: 'Hi Sarah, DeanFlow team has prepared our Developer Summit Eco Kit specs. We can dispatch courier samples to your Singapore office within 48 hours. Let us connect briefly to finalize delivery address.',
		journey_json: JSON.stringify([
			{ path: '/campaign/singapore-summit', title: 'APAC Tech Summit Event Page', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
			{ path: '/eco-materials', title: 'FSC-Certified Ecological Materials', timestamp: new Date(Date.now() - 1000 * 60 * 165).toISOString() },
		]),
		ip_country: 'SG',
		ip_city: 'Singapore',
		assigned_to: 'user_sales_trang',
		last_contacted_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
		utm_source: 'linkedin',
		utm_medium: 'paid_social',
		utm_campaign: 'sg_summit_b2b',
		internal_notes: 'Introductory email sent, awaiting delivery address confirmation for sample pack.',
		created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
		updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
	},
	{
		id: 'lead_b2b_003',
		name: 'Michael Chen',
		email: 'minhnguyen.marketing@gmail.com',
		phone: '+84912345678',
		country: 'VN',
		company_name: 'Minh Phat Decor Ltd.',
		company_size: '10 - 50 employees',
		budget_range: '$2,000 - $5,000 USD',
		source: 'lead_capture_form',
		landing_page_url: 'https://deanflow.com',
		message: 'Looking for a wholesale quotation on 300 custom jute & woven bamboo carrier bags for a cafe chain interior fit-out project.',
		status: 'discovery',
		is_corporate_email: 0,
		ai_score: 68,
		ai_summary: '• Requirement: 300 jute & woven bamboo decor bags for hospitality interior project.\n• Classification: SME inquiry, submitted via webmail (@gmail.com).',
		ai_pitch_draft: 'Hi Michael, DeanFlow has received your quotation request for 300 jute & woven bags for Minh Phat Decor. We have volume tier pricing and wholesale discount schedules prepared.',
		journey_json: JSON.stringify([
			{ path: '/', title: 'DeanFlow Home', timestamp: new Date(Date.now() - 1000 * 60 * 500).toISOString() },
		]),
		ip_country: 'VN',
		ip_city: 'Ho Chi Minh City',
		assigned_to: 'user_sales_alex',
		last_contacted_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
		utm_source: 'direct',
		utm_medium: 'direct',
		utm_campaign: 'organic',
		internal_notes: 'Consulted on material options via telephone, client finalizing quantity scope.',
		created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
		updated_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
	},
]

const inMemoryStore = {
	leads: new Map<string, D1Lead>(initialB2BLeads.map((l) => [l.id, l])),
	adminUsers: new Map<string, D1AdminUser>(),
	orders: new Map<string, D1Order>(),
	reviews: new Map<string, D1Review>(),
	comments: new Map<string, D1Comment>(),
}

/**
 * Execute raw SQL query against Cloudflare D1
 */
async function executeD1Query<T = any>(
	sql: string,
	params: any[] = [],
): Promise<D1QueryResult<T>> {
	// 1. Check for Direct Cloudflare Worker binding
	const directDb = await getD1Binding()
	if (directDb && typeof directDb.prepare === 'function') {
		try {
			const stmt = directDb.prepare(sql)
			const bound = params.length > 0 ? stmt.bind(...params) : stmt
			const response = await bound.all()
			if (response.success === false) throw new Error('D1 statement failed')
			return {
				results: (response.results as T[]) || [],
				success: true,
				meta: response.meta,
			}
		} catch (err: any) {
			console.error('[Cloudflare D1 Direct Binding Error]:', err)
			return { results: [], success: false, error: err.message }
		}
	}

	// 2. Cloudflare D1 HTTP REST API
	const { databaseId, accountId, apiToken } = await resolveRestConfig()
	if (databaseId && accountId && apiToken) {
		const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`
		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					sql,
					params,
				}),
				cache: 'no-store',
				signal: AbortSignal.timeout(10000),
			})

			const data = await res.json()

			if (!res.ok || !data.success) {
				const errMsg =
					data.errors?.map((e: any) => e.message).join(', ') ||
					res.statusText ||
					'Cloudflare D1 Query Failed'
				console.error('[Cloudflare D1 HTTP API Error]:', errMsg, sql)
				return { results: [], success: false, error: errMsg }
			}

			const firstResult = data.result?.[0]
			if (!firstResult || firstResult.success === false) throw new Error('D1 statement failed')
			return {
				results: (firstResult?.results as T[]) || [],
				success: true,
				meta: firstResult?.meta,
			}
		} catch (err: any) {
			console.error('[Cloudflare D1 HTTP Fetch Exception]:', err)
			return { results: [], success: false, error: err.message }
		}
	}

	const nodeEnv = (await getEnvVar('NODE_ENV')) || process.env.NODE_ENV
	const allowMemory = await getEnvVar('D1_ALLOW_MEMORY')
	const cfCtx = await getCloudflareContextSafe()
	if (nodeEnv === 'production' || allowMemory !== 'true' || Boolean(cfCtx?.env?.ASSETS)) {
		throw new Error('D1 is not configured; persistent storage is required')
	}
	return simulateLocalD1<T>(sql, params)
}

export class PersistenceError extends Error {
	causeMessage?: string
	constructor(causeMessage?: string) {
		super('Persistent storage unavailable')
		this.name = 'PersistenceError'
		this.causeMessage = causeMessage
	}
}

export async function d1Query<T = any>(sql: string, params: any[] = []): Promise<D1QueryResult<T>> {
	let result: D1QueryResult<T>
	try {
		result = await executeD1Query<T>(sql, params)
	} catch (err: any) {
		throw new PersistenceError(err?.message)
	}
	if (!result.success) throw new PersistenceError(result.error)
	if (/^\s*INSERT\s+INTO/i.test(sql) && (result.meta?.changes ?? 0) < 1) {
		throw new PersistenceError('Insert affected 0 rows')
	}
	return result
}

/**
 * Lightweight in-memory fallback simulator for dev mode
 */
function simulateLocalD1<T = any>(sql: string, params: any[]): D1QueryResult<T> {
	const trimmed = sql.trim()
	const upper = trimmed.toUpperCase()

	// LEADS TABLE SIMULATION
	if (upper.includes('LEADS')) {
		if (upper.startsWith('INSERT INTO LEADS')) {
			const colMatch = trimmed.match(/\(([^)]+)\)\s*VALUES/i)
			const cols = colMatch ? colMatch[1].split(',').map((c) => c.trim().toLowerCase()) : []
			const lead: any = {
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}
			if (cols.length > 0 && cols.length === params.length) {
				cols.forEach((col, idx) => {
					lead[col] = params[idx]
				})
			} else {
				lead.id = params[0]
				lead.name = params[1]
				lead.email = params[2]
				lead.phone = params[3]
				lead.country = params[4]
				lead.company_name = params[5]
				lead.company_size = params[6]
				lead.budget_range = params[7]
				lead.source = params[8] || 'landing_page'
				lead.landing_page_url = params[9]
				lead.message = params[10]
				lead.status = params[11] || 'new'
				lead.is_corporate_email = Number(params[12]) || 0
				lead.ai_score = Number(params[13]) || 0
				lead.ai_summary = params[14]
				lead.ai_pitch_draft = params[15]
				lead.journey_json = params[16]
				lead.ip_country = params[17]
				lead.ip_city = params[18]
				lead.assigned_to = params[19]
				lead.last_contacted_at = params[20]
				lead.utm_source = params[21]
				lead.utm_medium = params[22]
				lead.utm_campaign = params[23]
				lead.internal_notes = params[24]
			}
			if (lead.submission_key && Array.from(inMemoryStore.leads.values()).some(item => item.submission_key === lead.submission_key)) {
				return { results: [], success: true, meta: { changes: 0 } }
			}
			inMemoryStore.leads.set(lead.id, lead as D1Lead)
			return { results: [lead as any], success: true, meta: { changes: 1 } }
		}

		if (upper.startsWith('UPDATE LEADS')) {
			const id = params[params.length - 1]
			const item = inMemoryStore.leads.get(id)
			if (item) {
				const setParts = trimmed.split(/SET/i)[1]?.split(/WHERE/i)[0]?.split(',') || []
				setParts.forEach((part, idx) => {
					const field = part.trim().split('=')[0]?.trim().toLowerCase()
					const val = params[idx]
					if (field && val !== undefined) {
						;(item as any)[field] = val
					}
				})
				item.updated_at = new Date().toISOString()
				return { results: [], success: true, meta: { changes: 1 } }
			}
			return { results: [], success: true, meta: { changes: 0 } }
		}

		if (upper.startsWith('DELETE FROM LEADS')) {
			const id = params[0]
			const existed = inMemoryStore.leads.delete(id)
			return { results: [], success: true, meta: { changes: existed ? 1 : 0 } }
		}

		if (upper.startsWith('SELECT')) {
			let all = Array.from(inMemoryStore.leads.values())
			if (upper.includes('WHERE SUBMISSION_KEY =')) {
				return { results: all.filter(lead => lead.submission_key === params[0]).slice(0, 1) as T[], success: true }
			}
			all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

			if (upper.includes('GROUP BY STATUS')) {
				const counts: Record<string, number> = {}
				all.forEach((lead) => {
					const st = (lead.status || 'new').toLowerCase()
					counts[st] = (counts[st] || 0) + 1
				})
				const results = Object.entries(counts).map(([status, count]) => ({ status, count }))
				return { results: results as any, success: true }
			}

			if (upper.includes('WHERE ID =')) {
				const id = params[0]
				const match = inMemoryStore.leads.get(id)
				return { results: match ? [match as any] : [], success: true }
			}
			if (upper.includes('COUNT(*)')) {
				if (upper.includes('WHERE STATUS =')) {
					const st = params[0]?.toLowerCase()
					const filtered = all.filter((l) => (l.status || '').toLowerCase() === st)
					return { results: [{ count: filtered.length }] as any, success: true }
				}
				return { results: [{ count: all.length }] as any, success: true }
			}
			return { results: all as any, success: true }
		}
	}

	// ADMIN USERS TABLE SIMULATION
	if (upper.includes('ADMIN_USERS')) {
		if (upper.startsWith('INSERT INTO ADMIN_USERS')) {
			const user: D1AdminUser = {
				id: params[0],
				email: params[1],
				password_hash: params[2],
				full_name: params[3],
				role: params[4] || 'sales',
				avatar_url: params[5],
				status: params[6] || 'active',
				assigned_leads_count: Number(params[7]) || 0,
				last_login_at: params[8] || null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}
			inMemoryStore.adminUsers.set(user.id, user)
			return { results: [user as any], success: true, meta: { changes: 1 } }
		}

		if (upper.startsWith('UPDATE ADMIN_USERS')) {
			const id = params[params.length - 1]
			const item = inMemoryStore.adminUsers.get(id)
			if (item) {
				const setParts = trimmed.split(/SET/i)[1]?.split(/WHERE/i)[0]?.split(',') || []
				setParts.forEach((part, idx) => {
					const field = part.trim().split('=')[0]?.trim().toLowerCase()
					const val = params[idx]
					if (field && val !== undefined) {
						;(item as any)[field] = val
					}
				})
				item.updated_at = new Date().toISOString()
				return { results: [], success: true, meta: { changes: 1 } }
			}
			return { results: [], success: true, meta: { changes: 0 } }
		}

		if (upper.startsWith('DELETE FROM ADMIN_USERS')) {
			const id = params[0]
			const existed = inMemoryStore.adminUsers.delete(id)
			return { results: [], success: true, meta: { changes: existed ? 1 : 0 } }
		}

		if (upper.startsWith('SELECT')) {
			let all = Array.from(inMemoryStore.adminUsers.values())
			all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

			if (upper.includes('WHERE ID =')) {
				const id = params[0]
				const match = inMemoryStore.adminUsers.get(id)
				return { results: match ? [match as any] : [], success: true }
			}
			if (upper.includes('WHERE EMAIL =')) {
				const email = String(params[0] || '').toLowerCase()
				const match = all.find((u) => u.email.toLowerCase() === email)
				return { results: match ? [match as any] : [], success: true }
			}
			if (upper.includes('COUNT(*)')) {
				return { results: [{ count: all.length }] as any, success: true }
			}
			return { results: all as any, success: true }
		}
	}

	// ORDERS TABLE SIMULATION
	if (upper.includes('ORDERS')) {
		if (upper.startsWith('INSERT INTO ORDERS')) {
			const colMatch = trimmed.match(/\(([^)]+)\)\s*VALUES/i)
			const cols = colMatch ? colMatch[1].split(',').map((c) => c.trim().toLowerCase()) : []
			const order: any = {
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}
			if (cols.length > 0 && cols.length === params.length) {
				cols.forEach((col, idx) => {
					order[col] = params[idx]
				})
			} else {
				order.id = params[0]
				order.order_number = params[1]
				order.customer_name = params[2]
				order.customer_email = params[3]
				order.customer_phone = params[4]
				order.shipping_country = params[5]
				order.shipping_address = params[6]
				order.shipping_city = params[7]
				order.shipping_state = params[8]
				order.shipping_postal_code = params[9]
				order.items_json = params[10]
				order.subtotal = Number(params[11]) || 0
				order.discount = Number(params[12]) || 0
				order.shipping_fee = Number(params[13]) || 0
				order.total = Number(params[14]) || 0
				order.currency = params[15] || 'USD'
				order.payment_method = params[16] || 'manual'
				order.payment_status = params[17] || 'unpaid'
				order.fulfillment_status = params[18] || 'pending'
				order.tracking_code = params[19]
				order.customer_note = params[20]
				order.internal_notes = params[21]
			}
			inMemoryStore.orders.set(order.id, order as D1Order)
			return { results: [order as any], success: true, meta: { changes: 1 } }
		}

		if (upper.startsWith('UPDATE ORDERS')) {
			let item: D1Order | undefined
			for (let i = params.length - 1; i >= 0; i--) {
				const candidate = params[i]
				if (typeof candidate !== 'string') continue
				item =
					inMemoryStore.orders.get(candidate) ||
					Array.from(inMemoryStore.orders.values()).find((o) => o.order_number === candidate)
				if (item) break
			}
			if (item) {
				if (upper.includes('DELETED_AT IS NULL') && item.deleted_at) {
					return { results: [], success: true, meta: { changes: 0 } }
				}
				const setParts = trimmed.split(/SET/i)[1]?.split(/WHERE/i)[0]?.split(',') || []
				let paramIdx = 0
				setParts.forEach((part) => {
					const [rawField, rawExpr] = part.split('=')
					const field = rawField?.trim().toLowerCase()
					if (!rawExpr || !rawExpr.includes('?')) return
					const val = params[paramIdx++]
					if (field && val !== undefined) {
						;(item as any)[field] = val
					}
				})
				item.version = (item.version ?? 1) + 1
				item.updated_at = new Date().toISOString()
				return { results: [], success: true, meta: { changes: 1 } }
			}
			return { results: [], success: true, meta: { changes: 0 } }
		}

		if (upper.startsWith('DELETE FROM ORDERS')) {
			const id = params[0]
			const existed = inMemoryStore.orders.delete(id)
			return { results: [], success: true, meta: { changes: existed ? 1 : 0 } }
		}

		if (upper.startsWith('SELECT')) {
			let all = Array.from(inMemoryStore.orders.values())
			if (upper.includes('DELETED_AT IS NULL')) {
				all = all.filter((o) => !o.deleted_at)
			}
			all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

			if (upper.includes('GROUP BY FULFILLMENT_STATUS')) {
				const counts: Record<string, number> = {}
				all.forEach((order) => {
					const st = (order.fulfillment_status || 'pending').toLowerCase()
					counts[st] = (counts[st] || 0) + 1
				})
				const results = Object.entries(counts).map(([fulfillment_status, count]) => ({
					fulfillment_status,
					count,
				}))
				return { results: results as any, success: true }
			}

			if (upper.includes('WHERE ID =')) {
				const id = params[0]
				const match = all.find((o) => o.id === id)
				return { results: match ? [match as any] : [], success: true }
			}
			if (upper.includes('WHERE ORDER_NUMBER =')) {
				const orderNum = params[0]
				const match = all.find((o) => o.order_number === orderNum)
				return { results: match ? [match as any] : [], success: true }
			}
			return { results: all as any, success: true }
		}
	}

	// REVIEWS TABLE SIMULATION
	if (upper.includes('REVIEWS')) {
		if (upper.startsWith('INSERT INTO REVIEWS')) {
			const review: D1Review = {
				id: params[0],
				product_id: params[1],
				product_title: params[2],
				product_slug: params[3],
				author: params[4],
				author_email: params[5],
				rating: Number(params[6]) || 5,
				comment: params[7],
				media_urls_json: params[8],
				is_approved: Number(params[9]) || 0,
				response: params[10],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}
			inMemoryStore.reviews.set(review.id, review)
			return { results: [review as any], success: true, meta: { changes: 1 } }
		}

		if (upper.startsWith('UPDATE REVIEWS')) {
			const id = params[params.length - 1]
			const item = inMemoryStore.reviews.get(id)
			if (item) {
				const setParts = trimmed.split(/SET/i)[1]?.split(/WHERE/i)[0]?.split(',') || []
				setParts.forEach((part, idx) => {
					const field = part.trim().split('=')[0]?.trim().toLowerCase()
					const val = params[idx]
					if (field && val !== undefined) {
						;(item as any)[field] = val
					}
				})
				item.updated_at = new Date().toISOString()
				return { results: [], success: true, meta: { changes: 1 } }
			}
			return { results: [], success: true, meta: { changes: 0 } }
		}

		if (upper.startsWith('DELETE FROM REVIEWS')) {
			const id = params[0]
			const existed = inMemoryStore.reviews.delete(id)
			return { results: [], success: true, meta: { changes: existed ? 1 : 0 } }
		}

		if (upper.startsWith('SELECT')) {
			let all = Array.from(inMemoryStore.reviews.values())
			if (upper.includes('IS_APPROVED = 1')) {
				all = all.filter((r) => Number(r.is_approved) === 1)
			} else if (upper.includes('IS_APPROVED = ?') && params.length > 0) {
				const approvedParam = params[upper.includes('PRODUCT_ID = ?') ? 1 : 0]
				all = all.filter((r) => Number(r.is_approved) === Number(approvedParam))
			}

			if (upper.includes('PRODUCT_ID IN (')) {
				const allowed = new Set(params.map(String))
				all = all.filter((r) => allowed.has(String(r.product_id)))
			} else if (upper.includes('PRODUCT_ID = ?') && params.length > 0) {
				all = all.filter((r) => String(r.product_id) === String(params[0]))
			}

			if (upper.includes('GROUP BY PRODUCT_ID')) {
				const grouped = new Map<string, { sum: number; count: number }>()
				for (const r of all) {
					const prev = grouped.get(r.product_id) || { sum: 0, count: 0 }
					prev.sum += Number(r.rating) || 0
					prev.count += 1
					grouped.set(r.product_id, prev)
				}
				return {
					results: Array.from(grouped.entries()).map(([product_id, stat]) => ({
						product_id,
						review_count: stat.count,
						avg_rating: stat.count > 0 ? stat.sum / stat.count : 0,
					})) as any,
					success: true,
				}
			}

			if (upper.includes('COUNT(*) AS TOTAL')) {
				const count = all.length
				const sum = all.reduce((s, r) => s + (Number(r.rating) || 0), 0)
				return {
					results: [{ total: count, avg_rating: count > 0 ? sum / count : null } as any],
					success: true,
				}
			}

			all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			return { results: all as any, success: true }
		}
	}

	// COMMENTS TABLE SIMULATION
	if (upper.includes('COMMENTS')) {
		if (upper.startsWith('INSERT INTO COMMENTS')) {
			const comment: D1Comment = {
				id: params[0],
				post_id: params[1],
				post_title: params[2],
				post_slug: params[3],
				parent_comment_id: params[4],
				author_name: params[5],
				author_email: params[6],
				content: params[7],
				is_author_reply: Number(params[8]) || 0,
				is_approved: Number(params[9]) || 0,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}
			inMemoryStore.comments.set(comment.id, comment)
			return { results: [comment as any], success: true, meta: { changes: 1 } }
		}

		if (upper.startsWith('UPDATE COMMENTS')) {
			const id = params[params.length - 1]
			const item = inMemoryStore.comments.get(id)
			if (item) {
				const setParts = trimmed.split(/SET/i)[1]?.split(/WHERE/i)[0]?.split(',') || []
				setParts.forEach((part, idx) => {
					const field = part.trim().split('=')[0]?.trim().toLowerCase()
					const val = params[idx]
					if (field && val !== undefined) {
						;(item as any)[field] = val
					}
				})
				item.updated_at = new Date().toISOString()
				return { results: [], success: true, meta: { changes: 1 } }
			}
			return { results: [], success: true, meta: { changes: 0 } }
		}

		if (upper.startsWith('DELETE FROM COMMENTS')) {
			const id = params[0]
			const existed = inMemoryStore.comments.delete(id)
			return { results: [], success: true, meta: { changes: existed ? 1 : 0 } }
		}

		if (upper.startsWith('SELECT')) {
			let all = Array.from(inMemoryStore.comments.values())
			all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			return { results: all as any, success: true }
		}
	}

	return { results: [], success: true, meta: { changes: 0 } }
}

// ============================================================================
// TYPED HIGH-LEVEL REPOSITORIES
// ============================================================================

export const leadsDb = {
	async create(lead: Omit<D1Lead, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }): Promise<D1Lead> {
		const now = new Date().toISOString()
		const item: D1Lead = {
			attribution_json: lead.attribution_json || null,
			consent_json: lead.consent_json || null,
			submission_key: lead.submission_key || null,
			submission_hash: lead.submission_hash || null,
			submission_result: lead.submission_result || null,
			dossier_payload: lead.dossier_payload || null,
			id: lead.id || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			name: lead.name,
			email: lead.email || null,
			phone: lead.phone || null,
			country: lead.country || null,
			company_name: lead.company_name || null,
			company_size: lead.company_size || null,
			budget_range: lead.budget_range || null,
			source: lead.source || 'landing_page',
			landing_page_url: lead.landing_page_url || null,
			message: lead.message || null,
			status: lead.status || 'new',
			is_corporate_email: lead.is_corporate_email ?? 0,
			ai_score: lead.ai_score ?? 0,
			ai_summary: lead.ai_summary || null,
			ai_pitch_draft: lead.ai_pitch_draft || null,
			journey_json: lead.journey_json || null,
			ip_country: lead.ip_country || null,
			ip_city: lead.ip_city || null,
			assigned_to: lead.assigned_to || null,
			last_contacted_at: lead.last_contacted_at || null,
			utm_source: lead.utm_source || null,
			utm_medium: lead.utm_medium || null,
			utm_campaign: lead.utm_campaign || null,
			utm_term: lead.utm_term || null,
			utm_content: lead.utm_content || null,
			click_id: lead.click_id || null,
			internal_notes: lead.internal_notes || null,
			version: 1,
			enqueue_notify: lead.enqueue_notify ? 1 : 0,
			dossier_asset_id: lead.dossier_asset_id || null,
			created_at: lead.created_at || now,
			updated_at: lead.updated_at || now,
		}

		const sql = `
			INSERT INTO leads (
				attribution_json, consent_json, id, name, email, phone, country,
				company_name, company_size, budget_range, source, landing_page_url,
				message, status, is_corporate_email, ai_score, ai_summary,
				ai_pitch_draft, journey_json, ip_country, ip_city, assigned_to,
				last_contacted_at, utm_source, utm_medium, utm_campaign, utm_term, utm_content, click_id, internal_notes,
				version, enqueue_notify, dossier_asset_id, created_at, updated_at,
				submission_key, submission_hash, submission_result, dossier_payload
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, (SELECT u.id FROM admin_users u WHERE u.role = 'sales' AND u.status = 'active' ORDER BY (SELECT COUNT(*) FROM leads l WHERE l.assigned_to = u.id AND l.status NOT IN ('won','lost','closed')), u.id LIMIT 1)), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(submission_key) DO NOTHING
		`
		const params = [
			item.attribution_json,
			item.consent_json,
			item.id,
			item.name,
			item.email,
			item.phone,
			item.country,
			item.company_name,
			item.company_size,
			item.budget_range,
			item.source,
			item.landing_page_url,
			item.message,
			item.status,
			item.is_corporate_email,
			item.ai_score,
			item.ai_summary,
			item.ai_pitch_draft,
			item.journey_json,
			item.ip_country,
			item.ip_city,
			item.assigned_to,
			item.last_contacted_at,
			item.utm_source,
			item.utm_medium,
			item.utm_campaign,
			item.utm_term,
			item.utm_content,
			item.click_id,
			item.internal_notes,
			item.version,
			item.enqueue_notify,
			item.dossier_asset_id,
			item.created_at,
			item.updated_at,
			item.submission_key,
			item.submission_hash,
			item.submission_result,
			item.dossier_payload,
		]

		await d1Query(sql, params)
		return item
	},

	async list(options?: { status?: string; search?: string; assigned_to?: string; unassignedOnly?: boolean; limit?: number; offset?: number }) {
		const rawLimit = options?.limit
		const limit =
			rawLimit !== undefined && Number.isSafeInteger(rawLimit) && rawLimit >= 1
				? Math.min(100, rawLimit)
				: 50
		const rawOffset = options?.offset
		const offset =
			rawOffset !== undefined && Number.isSafeInteger(rawOffset) && rawOffset >= 0
				? rawOffset
				: 0
		const conditions: string[] = []
		const params: any[] = []

		if (options?.status && options.status !== 'all') {
			conditions.push('status = ?')
			params.push(options.status)
		}

		if (options?.unassignedOnly) {
			conditions.push('(assigned_to IS NULL OR assigned_to = "")')
		} else if (options?.assigned_to && options.assigned_to !== 'all') {
			conditions.push('assigned_to = ?')
			params.push(options.assigned_to)
		}

		if (options?.search?.trim()) {
			const term = `%${options.search.trim()}%`
			conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ?)')
			params.push(term, term, term, term)
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
		const sql = `SELECT * FROM leads ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
		params.push(limit, offset)

		const res = await d1Query<D1Lead>(sql, params)
		return res.results || []
	},

	async countFiltered(options?: { status?: string; search?: string; assigned_to?: string; unassignedOnly?: boolean }): Promise<number> {
		const conditions: string[] = []
		const params: any[] = []
		if (options?.status && options.status !== 'all') {
			conditions.push('status = ?')
			params.push(options.status)
		}
		if (options?.unassignedOnly) {
			conditions.push('(assigned_to IS NULL OR assigned_to = "")')
		} else if (options?.assigned_to && options.assigned_to !== 'all') {
			conditions.push('assigned_to = ?')
			params.push(options.assigned_to)
		}
		if (options?.search?.trim()) {
			const term = `%${options.search.trim()}%`
			conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ?)')
			params.push(term, term, term, term)
		}
		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
		const res = await d1Query<{ count: number }>(`SELECT COUNT(*) AS count FROM leads ${whereClause}`, params)
		return res.results?.[0]?.count || 0
	},

	async getById(id: string): Promise<D1Lead | null> {
		const res = await d1Query<D1Lead>('SELECT * FROM leads WHERE id = ? LIMIT 1', [id])
		return res.results?.[0] || null
	},

	async update(id: string, patch: Partial<D1Lead>, expectedVersion?: number): Promise<boolean> {
		const sets: string[] = ['updated_at = ?', 'version = COALESCE(version, 1) + 1']
		const params: any[] = [new Date().toISOString()]

		if (patch.name !== undefined) { sets.push('name = ?'); params.push(patch.name) }
		if (patch.email !== undefined) { sets.push('email = ?'); params.push(patch.email) }
		if (patch.phone !== undefined) { sets.push('phone = ?'); params.push(patch.phone) }
		if (patch.country !== undefined) { sets.push('country = ?'); params.push(patch.country) }
		if (patch.company_name !== undefined) { sets.push('company_name = ?'); params.push(patch.company_name) }
		if (patch.company_size !== undefined) { sets.push('company_size = ?'); params.push(patch.company_size) }
		if (patch.budget_range !== undefined) { sets.push('budget_range = ?'); params.push(patch.budget_range) }
		if (patch.status !== undefined) { sets.push('status = ?'); params.push(patch.status) }
		if (patch.is_corporate_email !== undefined) { sets.push('is_corporate_email = ?'); params.push(patch.is_corporate_email) }
		if (patch.ai_score !== undefined) { sets.push('ai_score = ?'); params.push(patch.ai_score) }
		if (patch.ai_summary !== undefined) { sets.push('ai_summary = ?'); params.push(patch.ai_summary) }
		if (patch.ai_pitch_draft !== undefined) { sets.push('ai_pitch_draft = ?'); params.push(patch.ai_pitch_draft) }
		if (patch.journey_json !== undefined) { sets.push('journey_json = ?'); params.push(patch.journey_json) }
		if (patch.assigned_to !== undefined) { sets.push('assigned_to = ?'); params.push(patch.assigned_to) }
		if (patch.last_contacted_at !== undefined) { sets.push('last_contacted_at = ?'); params.push(patch.last_contacted_at) }
		if (patch.internal_notes !== undefined) { sets.push('internal_notes = ?'); params.push(patch.internal_notes) }

		let whereClause = 'WHERE id = ?'
		params.push(id)
		if (expectedVersion !== undefined) {
			whereClause += ' AND COALESCE(version, 1) = ?'
			params.push(expectedVersion)
		}
		const sql = `UPDATE leads SET ${sets.join(', ')} ${whereClause}`
		const res = await d1Query(sql, params)
		return (res.meta?.changes ?? 0) > 0
	},

	async claimUnassigned(id: string, staffId: string): Promise<boolean> {
		const res = await d1Query(
			`UPDATE leads SET assigned_to = ?, version = COALESCE(version, 1) + 1, updated_at = ? WHERE id = ? AND (assigned_to IS NULL OR assigned_to = '')`,
			[staffId, new Date().toISOString(), id],
		)
		return (res.meta?.changes ?? 0) > 0
	},

	async count(status?: string): Promise<number> {
		if (status && status !== 'all') {
			const res = await d1Query<{ count: number }>('SELECT COUNT(*) as count FROM leads WHERE status = ?', [status])
			return res.results?.[0]?.count || 0
		}
		const res = await d1Query<{ count: number }>('SELECT COUNT(*) as count FROM leads')
		return res.results?.[0]?.count || 0
	},

	async delete(id: string): Promise<boolean> {
		const res = await d1Query('DELETE FROM leads WHERE id = ?', [id])
		return (res.meta?.changes ?? 0) > 0
	},
}

export const adminUsersDb = {
	async create(user: Omit<D1AdminUser, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }): Promise<D1AdminUser> {
		const now = new Date().toISOString()
		const item: D1AdminUser = {
			id: user.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			email: user.email.toLowerCase().trim(),
			password_hash: user.password_hash,
			full_name: user.full_name.trim(),
			role: user.role || 'sales',
			avatar_url: user.avatar_url || null,
			status: user.status || 'active',
			assigned_leads_count: user.assigned_leads_count || 0,
			last_login_at: user.last_login_at || null,
			created_at: user.created_at || now,
			updated_at: user.updated_at || now,
		}

		const sql = `
			INSERT INTO admin_users (
				id, email, password_hash, full_name, role, avatar_url,
				status, assigned_leads_count, last_login_at, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		const params = [
			item.id,
			item.email,
			item.password_hash,
			item.full_name,
			item.role,
			item.avatar_url,
			item.status,
			item.assigned_leads_count,
			item.last_login_at,
			item.created_at,
			item.updated_at,
		]

		await d1Query(sql, params)
		return item
	},

	async list(options?: { role?: string; status?: string; search?: string }) {
		const conditions: string[] = []
		const params: any[] = []

		if (options?.role && options.role !== 'all') {
			conditions.push('role = ?')
			params.push(options.role)
		}

		if (options?.status && options.status !== 'all') {
			conditions.push('status = ?')
			params.push(options.status)
		}

		if (options?.search?.trim()) {
			const term = `%${options.search.trim()}%`
			conditions.push('(full_name LIKE ? OR email LIKE ?)')
			params.push(term, term)
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
		const sql = `SELECT * FROM admin_users ${whereClause} ORDER BY created_at ASC`

		const res = await d1Query<D1AdminUser>(sql, params)
		return res.results || []
	},

	async getById(id: string): Promise<D1AdminUser | null> {
		const res = await d1Query<D1AdminUser>('SELECT * FROM admin_users WHERE id = ? LIMIT 1', [id])
		return res.results?.[0] || null
	},

	async getByEmail(email: string): Promise<D1AdminUser | null> {
		const clean = email.toLowerCase().trim()
		const res = await d1Query<D1AdminUser>('SELECT * FROM admin_users WHERE email = ? LIMIT 1', [clean])
		return res.results?.[0] || null
	},

	async update(id: string, patch: Partial<D1AdminUser>): Promise<boolean> {
		const sets: string[] = ['updated_at = ?']
		const params: any[] = [new Date().toISOString()]

		if (patch.full_name !== undefined) { sets.push('full_name = ?'); params.push(patch.full_name) }
		if (patch.email !== undefined) { sets.push('email = ?'); params.push(patch.email.toLowerCase().trim()) }
		if (patch.password_hash !== undefined) { sets.push('password_hash = ?'); params.push(patch.password_hash) }
		if (patch.role !== undefined) { sets.push('role = ?'); params.push(patch.role) }
		if (patch.status !== undefined) { sets.push('status = ?'); params.push(patch.status) }
		if (patch.avatar_url !== undefined) { sets.push('avatar_url = ?'); params.push(patch.avatar_url) }
		if (patch.assigned_leads_count !== undefined) { sets.push('assigned_leads_count = ?'); params.push(patch.assigned_leads_count) }
		if (patch.last_login_at !== undefined) { sets.push('last_login_at = ?'); params.push(patch.last_login_at) }

		params.push(id)
		const sql = `UPDATE admin_users SET ${sets.join(', ')} WHERE id = ?`
		const res = await d1Query(sql, params)
		return (res.meta?.changes ?? 0) > 0
	},

	async delete(id: string): Promise<boolean> {
		const res = await d1Query('DELETE FROM admin_users WHERE id = ?', [id])
		return (res.meta?.changes ?? 0) > 0
	},

	async count(): Promise<number> {
		const res = await d1Query<{ count: number }>('SELECT COUNT(*) as count FROM admin_users')
		return res.results?.[0]?.count || 0
	},
}

export const ordersDb = {
	async create(order: Omit<D1Order, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }): Promise<D1Order> {
		const now = new Date().toISOString()
		const inferredIntent: 'direct' | 'sample' | 'wholesale_rfq' =
			order.order_intent ||
			(order.order_number?.startsWith('RFQ-') || order.quote_status ? 'wholesale_rfq' : 'direct')
		const item: D1Order = {
			request_hash: order.request_hash || null,
			commerce_json: order.commerce_json || null,
			order_intent: inferredIntent,
			version: 1,
			paid_cents: order.paid_cents ?? 0,
			receipt_token_hash: order.receipt_token_hash || null,
			id: order.id || `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			order_number: order.order_number,
			customer_name: order.customer_name,
			customer_email: order.customer_email,
			customer_phone: order.customer_phone || null,
			shipping_country: order.shipping_country,
			shipping_address: order.shipping_address,
			shipping_city: order.shipping_city || null,
			shipping_state: order.shipping_state || null,
			shipping_postal_code: order.shipping_postal_code || null,
			items_json: order.items_json,
			subtotal: order.subtotal || 0,
			discount: order.discount || 0,
			shipping_fee: order.shipping_fee || 0,
			total: order.total || 0,
			currency: order.currency || 'USD',
			payment_method: order.payment_method || 'manual',
			payment_status: order.payment_status || 'unpaid',
			fulfillment_status: order.fulfillment_status || 'pending',
			tracking_code: order.tracking_code || null,
			payment_terms: order.payment_terms || null,
			quote_status:
				order.quote_status !== undefined
					? order.quote_status
					: inferredIntent === 'wholesale_rfq'
						? 'pending'
						: null,
			quote_approved_at: order.quote_approved_at || null,
			quote_approved_by: order.quote_approved_by || null,
			quote_valid_until: order.quote_valid_until || null,
			utm_source: order.utm_source || null,
			utm_medium: order.utm_medium || null,
			utm_campaign: order.utm_campaign || null,
			utm_term: order.utm_term || null,
			utm_content: order.utm_content || null,
			click_id: order.click_id || null,
			customer_note: order.customer_note || null,
			internal_notes: order.internal_notes || null,
			created_at: order.created_at || now,
			updated_at: order.updated_at || now,
		}

		const sql = `
			INSERT INTO orders (
				request_hash, commerce_json, order_intent, version, paid_cents, receipt_token_hash,
				id, order_number, customer_name, customer_email, customer_phone,
				shipping_country, shipping_address, shipping_city, shipping_state, shipping_postal_code,
				items_json, subtotal, discount, shipping_fee, total, currency,
				payment_method, payment_status, fulfillment_status, tracking_code,
				payment_terms, quote_status, quote_approved_at, quote_approved_by, quote_valid_until,
				utm_source, utm_medium, utm_campaign, utm_term, utm_content, click_id,
				customer_note, internal_notes, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		const params = [
			item.request_hash,
			item.commerce_json,
			item.order_intent,
			item.version,
			item.paid_cents,
			item.receipt_token_hash,
			item.id,
			item.order_number,
			item.customer_name,
			item.customer_email,
			item.customer_phone,
			item.shipping_country,
			item.shipping_address,
			item.shipping_city,
			item.shipping_state,
			item.shipping_postal_code,
			item.items_json,
			item.subtotal,
			item.discount,
			item.shipping_fee,
			item.total,
			item.currency,
			item.payment_method,
			item.payment_status,
			item.fulfillment_status,
			item.tracking_code,
			item.payment_terms,
			item.quote_status,
			item.quote_approved_at,
			item.quote_approved_by,
			item.quote_valid_until,
			item.utm_source,
			item.utm_medium,
			item.utm_campaign,
			item.utm_term,
			item.utm_content,
			item.click_id,
			item.customer_note,
			item.internal_notes,
			item.created_at,
			item.updated_at,
		]

		await d1Query(sql, params)
		return item
	},

	async list(options?: { status?: string; search?: string; intent?: string; limit?: number; offset?: number; includeDeleted?: boolean }) {
		const rawLimit = options?.limit
		const limit =
			rawLimit !== undefined && Number.isSafeInteger(rawLimit) && rawLimit >= 1
				? Math.min(200, rawLimit)
				: 50
		const rawOffset = options?.offset
		const offset =
			rawOffset !== undefined && Number.isSafeInteger(rawOffset) && rawOffset >= 0
				? rawOffset
				: 0
		const conditions: string[] = []
		const params: any[] = []

		if (!options?.includeDeleted) {
			conditions.push('deleted_at IS NULL')
		}

		if (options?.status && options.status.toUpperCase() !== 'ALL') {
			conditions.push('LOWER(fulfillment_status) = LOWER(?)')
			params.push(options.status)
		}

		if (options?.intent && options.intent !== 'all') {
			conditions.push('order_intent = ?')
			params.push(options.intent)
		}

		if (options?.search?.trim()) {
			const term = `%${options.search.trim()}%`
			conditions.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ? OR tracking_code LIKE ?)')
			params.push(term, term, term, term, term)
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
		const sql = `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
		params.push(limit, offset)

		const res = await d1Query<D1Order>(sql, params)
		return res.results || []
	},

	async countFiltered(options?: { status?: string; search?: string; intent?: string; includeDeleted?: boolean }): Promise<number> {
		const conditions: string[] = []
		const params: any[] = []
		if (!options?.includeDeleted) {
			conditions.push('deleted_at IS NULL')
		}
		if (options?.status && options.status.toUpperCase() !== 'ALL') {
			conditions.push('LOWER(fulfillment_status) = LOWER(?)')
			params.push(options.status)
		}
		if (options?.intent && options.intent !== 'all') {
			conditions.push('order_intent = ?')
			params.push(options.intent)
		}
		if (options?.search?.trim()) {
			const term = `%${options.search.trim()}%`
			conditions.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ? OR tracking_code LIKE ?)')
			params.push(term, term, term, term, term)
		}
		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
		const res = await d1Query<{ count: number }>(`SELECT COUNT(*) AS count FROM orders ${whereClause}`, params)
		return res.results?.[0]?.count || 0
	},

	async getById(id: string, options?: { includeDeleted?: boolean }): Promise<D1Order | null> {
		const sql = options?.includeDeleted
			? 'SELECT * FROM orders WHERE id = ? LIMIT 1'
			: 'SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL LIMIT 1'
		const res = await d1Query<D1Order>(sql, [id])
		return res.results?.[0] || null
	},

	async getByOrderNumber(orderNumber: string, options?: { includeDeleted?: boolean }): Promise<D1Order | null> {
		const sql = options?.includeDeleted
			? 'SELECT * FROM orders WHERE order_number = ? LIMIT 1'
			: 'SELECT * FROM orders WHERE order_number = ? AND deleted_at IS NULL LIMIT 1'
		const res = await d1Query<D1Order>(sql, [orderNumber])
		return res.results?.[0] || null
	},

	async update(id: string, patch: Partial<D1Order>, expectedVersion?: number): Promise<boolean> {
		const sets: string[] = ['updated_at = ?', 'version = COALESCE(version, 1) + 1']
		const params: any[] = [new Date().toISOString()]

		if (patch.items_json !== undefined) { sets.push('items_json = ?'); params.push(patch.items_json) }
		if (patch.subtotal !== undefined) { sets.push('subtotal = ?'); params.push(patch.subtotal) }
		if (patch.commerce_json !== undefined) { sets.push('commerce_json = ?'); params.push(patch.commerce_json) }
		if (patch.currency !== undefined) { sets.push('currency = ?'); params.push(patch.currency) }
		if (patch.paid_cents !== undefined) { sets.push('paid_cents = ?'); params.push(patch.paid_cents) }
		if (patch.fulfillment_status !== undefined) { sets.push('fulfillment_status = ?'); params.push(patch.fulfillment_status) }
		if (patch.payment_status !== undefined) { sets.push('payment_status = ?'); params.push(patch.payment_status) }
		if (patch.tracking_code !== undefined) { sets.push('tracking_code = ?'); params.push(patch.tracking_code) }
		if (patch.customer_name !== undefined) { sets.push('customer_name = ?'); params.push(patch.customer_name) }
		if (patch.customer_phone !== undefined) { sets.push('customer_phone = ?'); params.push(patch.customer_phone) }
		if (patch.customer_email !== undefined) { sets.push('customer_email = ?'); params.push(patch.customer_email) }
		if (patch.shipping_address !== undefined) { sets.push('shipping_address = ?'); params.push(patch.shipping_address) }
		if (patch.shipping_city !== undefined) { sets.push('shipping_city = ?'); params.push(patch.shipping_city) }
		if (patch.shipping_state !== undefined) { sets.push('shipping_state = ?'); params.push(patch.shipping_state) }
		if (patch.shipping_postal_code !== undefined) { sets.push('shipping_postal_code = ?'); params.push(patch.shipping_postal_code) }
		if (patch.shipping_country !== undefined) { sets.push('shipping_country = ?'); params.push(patch.shipping_country) }
		if (patch.internal_notes !== undefined) { sets.push('internal_notes = ?'); params.push(patch.internal_notes) }
		if (patch.shipping_fee !== undefined) { sets.push('shipping_fee = ?'); params.push(patch.shipping_fee) }
		if (patch.discount !== undefined) { sets.push('discount = ?'); params.push(patch.discount) }
		if (patch.total !== undefined) { sets.push('total = ?'); params.push(patch.total) }
		if (patch.payment_terms !== undefined) { sets.push('payment_terms = ?'); params.push(patch.payment_terms) }
		if (patch.quote_status !== undefined) { sets.push('quote_status = ?'); params.push(patch.quote_status) }
		if (patch.quote_approved_at !== undefined) { sets.push('quote_approved_at = ?'); params.push(patch.quote_approved_at) }
		if (patch.quote_approved_by !== undefined) { sets.push('quote_approved_by = ?'); params.push(patch.quote_approved_by) }
		if (patch.quote_valid_until !== undefined) { sets.push('quote_valid_until = ?'); params.push(patch.quote_valid_until) }
		if (patch.customer_note !== undefined) { sets.push('customer_note = ?'); params.push(patch.customer_note) }

		let whereClause = 'WHERE (id = ? OR order_number = ?) AND deleted_at IS NULL'
		params.push(id, id)
		if (expectedVersion !== undefined) {
			whereClause += ' AND COALESCE(version, 1) = ?'
			params.push(expectedVersion)
		}
		const sql = `UPDATE orders SET ${sets.join(', ')} ${whereClause}`
		const res = await d1Query(sql, params)
		return (res.meta?.changes ?? 0) > 0
	},

	async softDelete(
		idOrNumber: string,
		options: { deletedBy: string; reason?: string | null; expectedVersion?: number },
	): Promise<boolean> {
		const now = new Date().toISOString()
		const params: any[] = [now, options.deletedBy, options.reason ?? null, now, idOrNumber, idOrNumber]
		let whereClause = 'WHERE (id = ? OR order_number = ?) AND deleted_at IS NULL'
		if (options.expectedVersion !== undefined) {
			whereClause += ' AND COALESCE(version, 1) = ?'
			params.push(options.expectedVersion)
		}
		const res = await d1Query(
			`UPDATE orders
			SET deleted_at = ?,
				deleted_by = ?,
				delete_reason = ?,
				version = COALESCE(version, 1) + 1,
				updated_at = ?
			${whereClause}`,
			params,
		)
		return (res.meta?.changes ?? 0) > 0
	},

	async approveQuote(
		idOrNumber: string,
		options: { approvedBy: string; notes?: string }
	): Promise<boolean> {
		const now = new Date().toISOString()
		const approvalNote = `\n[${now}] QUOTATION APPROVED ONLINE by ${options.approvedBy}${options.notes ? `: "${options.notes}"` : ''}`
		const res = await d1Query(
			`UPDATE orders
			SET quote_status = 'approved',
				quote_approved_at = ?,
				quote_approved_by = ?,
				fulfillment_status = 'confirmed',
				version = COALESCE(version, 1) + 1,
				internal_notes = COALESCE(internal_notes, '') || ?,
				updated_at = ?
			WHERE (id = ? OR order_number = ?)
				AND deleted_at IS NULL
				AND (quote_status IS NULL OR quote_status IN ('sent', 'viewed', 'negotiating'))`,
			[now, options.approvedBy, approvalNote, now, idOrNumber, idOrNumber],
		)
		return (res.meta?.changes ?? 0) > 0
	},

	async counts() {
		const res = await d1Query<{ fulfillment_status: string; count: number }>(`
			SELECT fulfillment_status, COUNT(*) as count 
			FROM orders 
			WHERE deleted_at IS NULL
			GROUP BY fulfillment_status
		`)
		
		const counts: Record<string, number> = {
			ALL: 0,
			PENDING: 0,
			CONFIRMED: 0,
			PROCESSING: 0,
			SHIPPING: 0,
			DELIVERED: 0,
			CANCELLED: 0,
		}

		let total = 0
		for (const row of res.results || []) {
			const key = (row.fulfillment_status || '').toUpperCase()
			counts[key] = (counts[key] || 0) + (row.count || 0)
			total += (row.count || 0)
		}
		counts.ALL = total
		return counts
	},
}

export const orderPaymentsDb = {
	async listByOrderId(orderId: string): Promise<D1OrderPayment[]> {
		const res = await d1Query<D1OrderPayment>(
			'SELECT * FROM order_payments WHERE order_id = ? ORDER BY created_at DESC',
			[orderId],
		)
		return res.results || []
	},

	async listByOrderIds(orderIds: string[]): Promise<Map<string, D1OrderPayment[]>> {
		const map = new Map<string, D1OrderPayment[]>()
		const unique = [...new Set(orderIds.filter(Boolean))]
		for (let i = 0; i < unique.length; i += 50) {
			const batch = unique.slice(i, i + 50)
			const res = await d1Query<D1OrderPayment>(
				`SELECT * FROM order_payments WHERE order_id IN (${batch.map(() => '?').join(',')}) ORDER BY created_at DESC`,
				batch,
			)
			for (const row of res.results || []) {
				const list = map.get(row.order_id) || []
				list.push(row)
				map.set(row.order_id, list)
			}
		}
		return map
	},
}

export const orderNotesDb = {
	async append(entry: Omit<D1OrderNote, 'id' | 'created_at'> & { id?: string; created_at?: string }): Promise<D1OrderNote> {
		const item: D1OrderNote = {
			id: entry.id || `onote_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			order_id: entry.order_id,
			author_id: entry.author_id,
			author_name: entry.author_name,
			content: entry.content,
			created_at: entry.created_at || new Date().toISOString(),
		}
		await d1Query(
			'INSERT INTO order_notes (id, order_id, author_id, author_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?)',
			[item.id, item.order_id, item.author_id, item.author_name, item.content, item.created_at],
		)
		return item
	},

	async listByOrderId(orderId: string): Promise<D1OrderNote[]> {
		const res = await d1Query<D1OrderNote>(
			'SELECT * FROM order_notes WHERE order_id = ? ORDER BY created_at ASC',
			[orderId],
		)
		return res.results || []
	},

	async listByOrderIds(orderIds: string[]): Promise<Map<string, D1OrderNote[]>> {
		const map = new Map<string, D1OrderNote[]>()
		const unique = [...new Set(orderIds.filter(Boolean))]
		for (let i = 0; i < unique.length; i += 50) {
			const batch = unique.slice(i, i + 50)
			const res = await d1Query<D1OrderNote>(
				`SELECT * FROM order_notes WHERE order_id IN (${batch.map(() => '?').join(',')}) ORDER BY created_at ASC`,
				batch,
			)
			for (const row of res.results || []) {
				const list = map.get(row.order_id) || []
				list.push(row)
				map.set(row.order_id, list)
			}
		}
		return map
	},
}

export const leadNotesDb = {
	async append(entry: Omit<D1LeadNote, 'id' | 'created_at'> & { id?: string; created_at?: string }): Promise<D1LeadNote> {
		const item: D1LeadNote = {
			id: entry.id || `lnote_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			lead_id: entry.lead_id,
			author_id: entry.author_id,
			author_name: entry.author_name,
			content: entry.content,
			created_at: entry.created_at || new Date().toISOString(),
		}
		await d1Query(
			'INSERT INTO lead_notes (id, lead_id, author_id, author_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?)',
			[item.id, item.lead_id, item.author_id, item.author_name, item.content, item.created_at],
		)
		return item
	},

	async listByLeadId(leadId: string): Promise<D1LeadNote[]> {
		const res = await d1Query<D1LeadNote>(
			'SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at ASC',
			[leadId],
		)
		return res.results || []
	},

	async listByLeadIds(leadIds: string[]): Promise<Map<string, D1LeadNote[]>> {
		const map = new Map<string, D1LeadNote[]>()
		const unique = [...new Set(leadIds.filter(Boolean))]
		for (let i = 0; i < unique.length; i += 50) {
			const batch = unique.slice(i, i + 50)
			const res = await d1Query<D1LeadNote>(
				`SELECT * FROM lead_notes WHERE lead_id IN (${batch.map(() => '?').join(',')}) ORDER BY created_at ASC`,
				batch,
			)
			for (const row of res.results || []) {
				const list = map.get(row.lead_id) || []
				list.push(row)
				map.set(row.lead_id, list)
			}
		}
		return map
	},
}

export const reviewsDb = {
	async create(review: Omit<D1Review, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }): Promise<D1Review> {
		const now = new Date().toISOString()
		const item: D1Review = {
			id: review.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			product_id: review.product_id,
			product_title: review.product_title || null,
			product_slug: review.product_slug || null,
			author: review.author,
			author_email: review.author_email || null,
			rating: Math.min(Math.max(review.rating || 5, 1), 5),
			comment: review.comment,
			media_urls_json: review.media_urls_json || null,
			is_approved: review.is_approved !== undefined ? review.is_approved : 0,
			response: review.response || null,
			created_at: review.created_at || now,
			updated_at: review.updated_at || now,
		}

		const sql = `
			INSERT INTO reviews (
				id, product_id, product_title, product_slug, author, author_email,
				rating, comment, media_urls_json, is_approved, response, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		const params = [
			item.id,
			item.product_id,
			item.product_title,
			item.product_slug,
			item.author,
			item.author_email,
			item.rating,
			item.comment,
			item.media_urls_json,
			item.is_approved,
			item.response,
			item.created_at,
			item.updated_at,
		]

		await d1Query(sql, params)
		return item
	},

	async list(options?: { productId?: string; isApproved?: number | 'all'; limit?: number; offset?: number }) {
		const limit = Math.min(1000, Math.max(1, Math.floor(Number(options?.limit) || 50)))
		const offset = Math.max(0, Math.floor(Number(options?.offset) || 0))
		const conditions: string[] = []
		const params: any[] = []

		if (options?.productId) {
			conditions.push('product_id = ?')
			params.push(options.productId)
		}

		if (options?.isApproved !== undefined && options.isApproved !== 'all') {
			conditions.push('is_approved = ?')
			params.push(options.isApproved)
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
		const sql = `SELECT * FROM reviews ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
		params.push(limit, offset)

		const res = await d1Query<D1Review>(sql, params)
		return res.results || []
	},

	async getById(id: string): Promise<D1Review | null> {
		const res = await d1Query<D1Review>('SELECT * FROM reviews WHERE id = ? LIMIT 1', [id])
		return res.results?.[0] || null
	},

	async update(id: string, patch: Partial<D1Review>): Promise<boolean> {
		const sets: string[] = ['updated_at = ?']
		const params: any[] = [new Date().toISOString()]

		if (patch.is_approved !== undefined) { sets.push('is_approved = ?'); params.push(patch.is_approved) }
		if (patch.response !== undefined) { sets.push('response = ?'); params.push(patch.response) }

		params.push(id)
		const sql = `UPDATE reviews SET ${sets.join(', ')} WHERE id = ?`
		const res = await d1Query(sql, params)
		return (res.meta?.changes ?? 0) > 0
	},

	async delete(id: string): Promise<boolean> {
		const res = await d1Query('DELETE FROM reviews WHERE id = ?', [id])
		return (res.meta?.changes ?? 0) > 0
	},
}

export const commentsDb = {
	async create(comment: Omit<D1Comment, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }): Promise<D1Comment> {
		const now = new Date().toISOString()
		const item: D1Comment = {
			id: comment.id || `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			post_id: comment.post_id,
			post_title: comment.post_title || null,
			post_slug: comment.post_slug || null,
			parent_comment_id: comment.parent_comment_id || null,
			author_name: comment.author_name,
			author_email: comment.author_email,
			content: comment.content,
			is_author_reply: comment.is_author_reply !== undefined ? comment.is_author_reply : 0,
			is_approved: comment.is_approved !== undefined ? comment.is_approved : 0,
			created_at: comment.created_at || now,
			updated_at: comment.updated_at || now,
		}

		const sql = `
			INSERT INTO comments (
				id, post_id, post_title, post_slug, parent_comment_id, author_name,
				author_email, content, is_author_reply, is_approved, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		const params = [
			item.id,
			item.post_id,
			item.post_title,
			item.post_slug,
			item.parent_comment_id,
			item.author_name,
			item.author_email,
			item.content,
			item.is_author_reply,
			item.is_approved,
			item.created_at,
			item.updated_at,
		]

		await d1Query(sql, params)
		return item
	},

	async list(options?: { postId?: string; isApproved?: number | 'all'; limit?: number; offset?: number }) {
		const limit = Math.min(1000, Math.max(1, Math.floor(Number(options?.limit) || 50)))
		const offset = Math.max(0, Math.floor(Number(options?.offset) || 0))
		const conditions: string[] = []
		const params: any[] = []

		if (options?.postId) {
			conditions.push('post_id = ?')
			params.push(options.postId)
		}

		if (options?.isApproved !== undefined && options.isApproved !== 'all') {
			conditions.push('is_approved = ?')
			params.push(options.isApproved)
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
		const sql = `SELECT * FROM comments ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
		params.push(limit, offset)

		const res = await d1Query<D1Comment>(sql, params)
		return res.results || []
	},

	async getById(id: string): Promise<D1Comment | null> {
		const res = await d1Query<D1Comment>('SELECT * FROM comments WHERE id = ? LIMIT 1', [id])
		return res.results?.[0] || null
	},

	async update(id: string, patch: Partial<D1Comment>): Promise<boolean> {
		const sets: string[] = ['updated_at = ?']
		const params: any[] = [new Date().toISOString()]

		if (patch.is_approved !== undefined) { sets.push('is_approved = ?'); params.push(patch.is_approved) }
		if (patch.is_author_reply !== undefined) { sets.push('is_author_reply = ?'); params.push(patch.is_author_reply) }

		params.push(id)
		const sql = `UPDATE comments SET ${sets.join(', ')} WHERE id = ?`
		const res = await d1Query(sql, params)
		return (res.meta?.changes ?? 0) > 0
	},

	async delete(id: string): Promise<boolean> {
		const res = await d1Query('DELETE FROM comments WHERE id = ?', [id])
		return (res.meta?.changes ?? 0) > 0
	},
}
