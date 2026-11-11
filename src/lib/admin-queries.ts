import { ROLE_PERMITTED_TABS, type AdminSessionUser } from '@/lib/admin-auth'
import { formatAdminOrder } from '@/lib/admin-format'
import { customerMetrics } from '@/lib/crm-metrics'
import {
	commentsDb,
	d1Query,
	leadNotesDb,
	leadsDb,
	orderNotesDb,
	orderPaymentsDb,
	ordersDb,
	reviewsDb,
	type D1Lead,
	type D1Order,
} from '@/lib/d1'

export interface AdminAggregateSummary {
	orders: {
		available: boolean
		totalOrders: number
		pendingOrders: number
		processingOrders: number
		shippingOrders: number
		deliveredOrders: number
		cancelledOrders: number
		b2bRfqCount: number
		totalRevenue: number
		averageOrderValue: number
		highTicketOrders: number
	}
	leads: {
		available: boolean
		totalLeads: number
		newLeads: number
		negotiatingDeals: number
		wonDeals: number
		highIntentLeads: number
		corporateLeads: number
	}
	customers: {
		available: boolean
		totalCustomers: number
	}
	reviews: {
		available: boolean
		totalReviews: number
		pendingReviews: number
		fiveStarReviews: number
		avgRating: string
	}
	comments: {
		available: boolean
		totalComments: number
		pendingComments: number
		officialReplies: number
	}
}

export async function getRoleScopedAggregates(
	session: AdminSessionUser,
): Promise<AdminAggregateSummary> {
	const tabs = ROLE_PERMITTED_TABS[session.role] || []
	const canOrders = tabs.includes('orders')
	const canLeads = tabs.includes('leads')
	const canCustomers = tabs.includes('customers')
	const canReviews = tabs.includes('reviews')
	const canComments = tabs.includes('comments')

	const [orderAggRes, leadAggRes, customerAggRes, reviewAggRes, commentAggRes] = await Promise.all([
		canOrders
			? d1Query<{
					totalOrders: number
					pendingOrders: number
					processingOrders: number
					shippingOrders: number
					deliveredOrders: number
					cancelledOrders: number
					b2bRfqCount: number
					totalRevenue: number
					validOrderCount: number
					highTicketOrders: number
				}>(`
					SELECT
						COUNT(*) AS totalOrders,
						SUM(CASE WHEN LOWER(COALESCE(fulfillment_status, 'pending')) = 'pending' THEN 1 ELSE 0 END) AS pendingOrders,
						SUM(CASE WHEN LOWER(fulfillment_status) IN ('processing', 'confirmed') THEN 1 ELSE 0 END) AS processingOrders,
						SUM(CASE WHEN LOWER(fulfillment_status) = 'shipping' THEN 1 ELSE 0 END) AS shippingOrders,
						SUM(CASE WHEN LOWER(fulfillment_status) = 'delivered' THEN 1 ELSE 0 END) AS deliveredOrders,
						SUM(CASE WHEN LOWER(fulfillment_status) IN ('cancelled', 'returned') THEN 1 ELSE 0 END) AS cancelledOrders,
						SUM(CASE WHEN order_intent = 'wholesale_rfq' OR order_number LIKE 'RFQ-%' OR quote_status IS NOT NULL THEN 1 ELSE 0 END) AS b2bRfqCount,
						COALESCE(SUM(CASE WHEN LOWER(COALESCE(fulfillment_status, 'pending')) NOT IN ('cancelled', 'returned') THEN total ELSE 0 END), 0) AS totalRevenue,
						SUM(CASE WHEN LOWER(COALESCE(fulfillment_status, 'pending')) NOT IN ('cancelled', 'returned') THEN 1 ELSE 0 END) AS validOrderCount,
						SUM(CASE WHEN LOWER(COALESCE(fulfillment_status, 'pending')) NOT IN ('cancelled', 'returned') AND total >= 100 THEN 1 ELSE 0 END) AS highTicketOrders
					FROM orders
					WHERE deleted_at IS NULL
				`)
			: Promise.resolve({ results: [] }),
		canLeads
			? d1Query<{
					totalLeads: number
					newLeads: number
					negotiatingDeals: number
					wonDeals: number
					highIntentLeads: number
					corporateLeads: number
				}>(
					`SELECT
						COUNT(*) AS totalLeads,
						SUM(CASE WHEN LOWER(COALESCE(status, 'new')) = 'new' THEN 1 ELSE 0 END) AS newLeads,
						SUM(CASE WHEN LOWER(status) IN ('contacted', 'discovery', 'proposal') THEN 1 ELSE 0 END) AS negotiatingDeals,
						SUM(CASE WHEN LOWER(status) = 'won' THEN 1 ELSE 0 END) AS wonDeals,
						SUM(CASE WHEN COALESCE(ai_score, 0) >= 70 THEN 1 ELSE 0 END) AS highIntentLeads,
						SUM(CASE WHEN COALESCE(is_corporate_email, 0) = 1 OR (company_name IS NOT NULL AND company_name != '') THEN 1 ELSE 0 END) AS corporateLeads
					FROM leads
					WHERE (? IS NULL OR assigned_to = ?)`,
					[session.role === 'sales' ? session.id : null, session.role === 'sales' ? session.id : null],
				)
			: Promise.resolve({ results: [] }),
		canCustomers
			? session.role === 'sales'
				? d1Query<{ count: number }>(
						`SELECT COUNT(DISTINCT COALESCE(NULLIF(lower(trim(email)), ''), NULLIF(trim(phone), ''), id)) AS count FROM leads WHERE assigned_to = ?`,
						[session.id],
					)
				: d1Query<{ count: number }>(`
						SELECT COUNT(*) AS count FROM (
							SELECT lower(trim(customer_email)) AS k FROM orders WHERE deleted_at IS NULL AND customer_email IS NOT NULL AND trim(customer_email) != ''
							UNION
							SELECT lower(trim(email)) AS k FROM leads WHERE email IS NOT NULL AND trim(email) != ''
						)
					`)
			: Promise.resolve({ results: [] }),
		canReviews
			? d1Query<{
					totalReviews: number
					pendingReviews: number
					fiveStarReviews: number
					avgRating: number | null
				}>(`
					SELECT
						COUNT(*) AS totalReviews,
						SUM(CASE WHEN COALESCE(is_approved, 0) = 0 THEN 1 ELSE 0 END) AS pendingReviews,
						SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS fiveStarReviews,
						AVG(rating) AS avgRating
					FROM reviews
				`)
			: Promise.resolve({ results: [] }),
		canComments
			? d1Query<{
					totalComments: number
					pendingComments: number
					officialReplies: number
				}>(`
					SELECT
						COUNT(*) AS totalComments,
						SUM(CASE WHEN COALESCE(is_approved, 0) = 0 THEN 1 ELSE 0 END) AS pendingComments,
						SUM(CASE WHEN COALESCE(is_author_reply, 0) = 1 THEN 1 ELSE 0 END) AS officialReplies
					FROM comments
				`)
			: Promise.resolve({ results: [] }),
	])

	const o = orderAggRes.results?.[0] as any
	const l = leadAggRes.results?.[0] as any
	const c = customerAggRes.results?.[0] as any
	const r = reviewAggRes.results?.[0] as any
	const cm = commentAggRes.results?.[0] as any

	const validCount = Number(o?.validOrderCount) || 0
	const totalRev = Number(o?.totalRevenue) || 0

	return {
		orders: {
			available: canOrders,
			totalOrders: Number(o?.totalOrders) || 0,
			pendingOrders: Number(o?.pendingOrders) || 0,
			processingOrders: Number(o?.processingOrders) || 0,
			shippingOrders: Number(o?.shippingOrders) || 0,
			deliveredOrders: Number(o?.deliveredOrders) || 0,
			cancelledOrders: Number(o?.cancelledOrders) || 0,
			b2bRfqCount: Number(o?.b2bRfqCount) || 0,
			totalRevenue: totalRev,
			averageOrderValue: validCount > 0 ? Math.round(totalRev / validCount) : 0,
			highTicketOrders: Number(o?.highTicketOrders) || 0,
		},
		leads: {
			available: canLeads,
			totalLeads: Number(l?.totalLeads) || 0,
			newLeads: Number(l?.newLeads) || 0,
			negotiatingDeals: Number(l?.negotiatingDeals) || 0,
			wonDeals: Number(l?.wonDeals) || 0,
			highIntentLeads: Number(l?.highIntentLeads) || 0,
			corporateLeads: Number(l?.corporateLeads) || 0,
		},
		customers: {
			available: canCustomers,
			totalCustomers: Number(c?.count) || 0,
		},
		reviews: {
			available: canReviews,
			totalReviews: Number(r?.totalReviews) || 0,
			pendingReviews: Number(r?.pendingReviews) || 0,
			fiveStarReviews: Number(r?.fiveStarReviews) || 0,
			avgRating: r?.totalReviews ? Number(r.avgRating || 5).toFixed(1) : '5.0',
		},
		comments: {
			available: canComments,
			totalComments: Number(cm?.totalComments) || 0,
			pendingComments: Number(cm?.pendingComments) || 0,
			officialReplies: Number(cm?.officialReplies) || 0,
		},
	}
}

export async function formatOrdersWithRelations(d1Orders: D1Order[]) {
	if (!d1Orders.length) return []
	const orderIds = d1Orders.map((o) => o.id)
	const [notesMap, paymentsMap] = await Promise.all([
		orderNotesDb.listByOrderIds(orderIds).catch(() => new Map()),
		orderPaymentsDb.listByOrderIds(orderIds).catch(() => new Map()),
	])
	return d1Orders.map((order) =>
		formatAdminOrder(order, {
			notes: notesMap.get(order.id) || [],
			payments: paymentsMap.get(order.id) || [],
		}),
	)
}

export async function buildUnifiedCustomersProjection(
	session: AdminSessionUser,
	options: { limit?: number; offset?: number; search?: string } = {},
) {
	const tabs = ROLE_PERMITTED_TABS[session.role] || []
	if (!tabs.includes('customers')) return { customers: [], total: 0 }

	const limit = Math.min(200, Math.max(1, Math.trunc(options.limit || 100)))
	const offset = Math.max(0, Math.trunc(options.offset || 0))
	const search = (options.search || '').trim()

	// Sales only sees customers derived from their assigned leads
	if (session.role === 'sales') {
		const [leads, total] = await Promise.all([
			leadsDb.list({ assigned_to: session.id, search, limit, offset }),
			leadsDb.countFiltered({ assigned_to: session.id, search }),
		])
		const metrics = await customerMetrics(leads.map((l) => l.email || ''))
		const formatted = await formatLeadsForWorkspace(leads, metrics)
		return { customers: formatted, total }
	}

	// Admin, Superadmin, CSKH get consistent projection merging Orders (D2C + approved B2B) and Leads
	const includeOrders = tabs.includes('orders') || tabs.includes('customers')
	const [recentOrders, leads] = await Promise.all([
		includeOrders ? ordersDb.list({ search, limit: 200, offset: 0 }) : Promise.resolve([]),
		leadsDb.list({ search, limit: 100, offset: 0 }),
	])

	const map = new Map<string, any>()
	const orderEmails = recentOrders.map((o) => o.customer_email || '')
	const leadEmails = leads.map((l) => l.email || '')
	const metrics = await customerMetrics([...orderEmails, ...leadEmails])

	for (const o of recentOrders) {
		const email = (o.customer_email || '').trim().toLowerCase()
		const phone = (o.customer_phone || '').trim()
		const key = email || phone.replace(/\D/g, '') || o.customer_name.toLowerCase()
		if (!key) continue
		const m = email ? metrics.get(email) : undefined
		if (!map.has(key)) {
			map.set(key, {
				_id: key,
				id: key,
				name: o.customer_name || 'Guest Buyer',
				phone,
				email,
				address: o.shipping_address || '',
				city: o.shipping_city || '',
				country: o.shipping_country || 'US',
				postalCode: o.shipping_postal_code || '',
				source: o.order_intent === 'wholesale_rfq' ? 'b2b_rfq' : 'direct_order',
				cskhStatus: m && m.orderCount > 1 ? 'vip' : 'customer',
				orderCount: m?.orderCount ?? 1,
				totalSpent: m?.totalSpent ?? 0,
				createdAt: o.created_at,
				lastOrderAt: o.created_at,
			})
		}
	}

	for (const l of leads) {
		const email = (l.email || '').trim().toLowerCase()
		const phone = (l.phone || '').trim()
		const key = email || phone.replace(/\D/g, '') || l.id
		const m = email ? metrics.get(email) : undefined
		if (!map.has(key)) {
			map.set(key, {
				_id: l.id,
				id: l.id,
				name: l.name,
				phone,
				email,
				country: l.country || '',
				address: l.country || '',
				source: l.source || 'landing_page',
				status: l.status || 'new',
				cskhStatus:
					l.status === 'won'
						? 'customer'
						: l.status === 'proposal' || l.status === 'discovery'
							? 'vip'
							: 'lead',
				orderCount: m?.orderCount || 0,
				totalSpent: m?.totalSpent || 0,
				createdAt: l.created_at,
			})
		}
	}

	const all = Array.from(map.values())
	return {
		customers: all.slice(offset, offset + limit),
		total: all.length,
	}
}

export async function formatLeadsForWorkspace(
	d1Leads: D1Lead[],
	metricsMap?: Map<string, { orderCount: number; totalSpent: number }>,
) {
	if (!d1Leads.length) return []
	const metrics = metricsMap ?? (await customerMetrics(d1Leads.map((l) => l.email || '')))
	const notesMap = await leadNotesDb.listByLeadIds(d1Leads.map((l) => l.id)).catch(() => new Map())

	return d1Leads.map((lead) => {
		const structured = (notesMap.get(lead.id) || []).map((n: any) => ({
			_key: n.id,
			note: n.content,
			author: n.author_name,
			timestamp: n.created_at,
		}))
		const legacy = lead.internal_notes
			? [{ _key: 'legacy', note: lead.internal_notes, author: 'Staff', timestamp: lead.updated_at }]
			: []
		return {
			_id: lead.id,
			id: lead.id,
			name: lead.name,
			phone: lead.phone || '',
			email: lead.email || '',
			country: lead.country || '',
			address: lead.country || '',
			source: lead.source || 'landing_page',
			landing_page_url: lead.landing_page_url || '',
			message: lead.message || '',
			status: lead.status || 'new',
			utm_source: lead.utm_source || '',
			utm_medium: lead.utm_medium || '',
			utm_campaign: lead.utm_campaign || '',
			cskhStatus:
				(lead.status as string) === 'won' || (lead.status as string) === 'converted'
					? 'customer'
					: (lead.status as string) === 'proposal' || (lead.status as string) === 'qualified'
						? 'vip'
						: 'lead',
			couponReceived: '',
			orderCount: metrics.get((lead.email || '').toLowerCase())?.orderCount || 0,
			totalSpent: metrics.get((lead.email || '').toLowerCase())?.totalSpent || 0,
			createdAt: lead.created_at,
			internalNotes: [...legacy, ...structured],
		}
	})
}

export async function formatReviewsForWorkspace(d1Reviews: Awaited<ReturnType<typeof reviewsDb.list>>) {
	return d1Reviews.map((rev) => {
		let media: any[] = []
		try {
			media = JSON.parse(rev.media_urls_json || '[]')
		} catch {
			media = []
		}
		return {
			_id: rev.id,
			author: rev.author,
			rating: rev.rating,
			comment: rev.comment,
			isApproved: Boolean(rev.is_approved),
			response: rev.response || '',
			createdAt: rev.created_at,
			product: {
				_id: rev.product_id,
				title: rev.product_title || 'Product',
				slug: rev.product_slug || '',
			},
			images: media.filter((m: any) => m.type === 'image').map((m: any) => ({ asset: { url: m.url } })),
			videos: media.filter((m: any) => m.type === 'video').map((m: any) => ({ asset: { url: m.url } })),
		}
	})
}

export async function formatCommentsForWorkspace(d1Comments: Awaited<ReturnType<typeof commentsDb.list>>) {
	return d1Comments.map((cmt) => ({
		_id: cmt.id,
		authorName: cmt.author_name,
		authorEmail: cmt.author_email,
		content: cmt.content,
		isAuthorReply: Boolean(cmt.is_author_reply),
		isApproved: Boolean(cmt.is_approved),
		createdAt: cmt.created_at,
		post: {
			_id: cmt.post_id,
			title: cmt.post_title || 'Blog Post',
			slug: cmt.post_slug || '',
		},
		parentComment: cmt.parent_comment_id ? { _id: cmt.parent_comment_id } : undefined,
	}))
}
