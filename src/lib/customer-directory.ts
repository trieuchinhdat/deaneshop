import type { AdminSessionUser } from './admin-auth'

export interface CustomerRecord {
	customer_key: string
	name: string
	email: string | null
	phone: string | null
	company: string | null
	country: string | null
	sources: string
	interactions: number
	order_count?: number
	total_spent?: number
	first_seen: string
	last_seen: string
}
export interface CustomerInteraction {
	customer_key: string
	id: string
	kind: string
	source: string
	name: string
	email: string | null
	phone: string | null
	company: string | null
	country: string | null
	content: string | null
	created_at: string
	status: string | null
}

export interface CustomerDirectoryOptions {
	includeOrders?: boolean
	hasOrderIntent?: boolean
	hasOrderDeletedAt?: boolean
}

export function buildOrderWhereClause(
	alias: string,
	scoped: boolean,
	options?: CustomerDirectoryOptions,
) {
	const clauses: string[] = []
	const params: string[] = []
	if (options?.hasOrderDeletedAt) {
		clauses.push(`${alias}.deleted_at IS NULL`)
	}
	if (options?.hasOrderIntent) {
		clauses.push(`COALESCE(${alias}.order_intent, 'direct') != 'wholesale_rfq'`)
	}
	if (scoped) {
		clauses.push(
			`EXISTS (SELECT 1 FROM leads ol WHERE ol.assigned_to = ? AND NULLIF(TRIM(${alias}.customer_email),'') IS NOT NULL AND LOWER(TRIM(ol.email)) = LOWER(TRIM(${alias}.customer_email)))`,
		)
	}
	return { clauses, needsSessionParam: scoped }
}

// Scope records BEFORE grouping. Shared email never expands a representative's access.
export function customerDirectoryScope(
	session: Pick<AdminSessionUser, 'role' | 'id'>,
	options?: CustomerDirectoryOptions,
) {
	const scoped = session.role === 'sales'
	const params: (string | number)[] = scoped ? [session.id] : []
	const key = (email: string, fallback: string) =>
		`CASE WHEN NULLIF(TRIM(${email}),'') IS NOT NULL THEN 'email:' || LOWER(TRIM(${email})) ELSE ${fallback} END`
	const leads = `SELECT ${key('email', "'lead:' || id")} AS customer_key, id, 'lead' AS kind,
 COALESCE(NULLIF(source,''),'inquiry') AS source, name, email, phone, company_name AS company, country,
 message AS content, created_at, status FROM leads ${scoped ? 'WHERE assigned_to = ?' : ''}`
	const commentsAndReviews = scoped
		? ''
		: ` UNION ALL SELECT ${key('author_email', "'comment:' || id")}, id, 'comment', 'blog_comment', author_name, author_email, NULL, NULL, NULL, content, created_at, CASE WHEN is_approved=1 THEN 'approved' ELSE 'pending' END FROM comments WHERE COALESCE(is_author_reply,0)=0
 UNION ALL SELECT ${key('author_email', "'review:' || id")}, id, 'review', 'product_review', author, author_email, NULL, NULL, NULL, comment, created_at, CASE WHEN is_approved=1 THEN 'approved' ELSE 'pending' END FROM reviews`

	let ordersUnion = ''
	if (options?.includeOrders) {
		const orderFilter = buildOrderWhereClause('o', scoped, options)
		if (orderFilter.needsSessionParam) {
			params.push(session.id)
		}
		const sourceExpr = options.hasOrderIntent
			? `CASE WHEN o.order_intent = 'sample' THEN 'sample_order' ELSE 'direct_order' END`
			: `'direct_order'`
		const whereSql = orderFilter.clauses.length
			? `WHERE ${orderFilter.clauses.join(' AND ')}`
			: ''
		ordersUnion = ` UNION ALL SELECT ${key('o.customer_email', "'order:' || o.id")}, o.id, 'order', ${sourceExpr}, o.customer_name, o.customer_email, o.customer_phone, NULL, o.shipping_country, 'Order ' || o.order_number || ' · ' || printf('%.2f', COALESCE(o.total, 0)) || ' ' || COALESCE(NULLIF(o.currency,''), 'USD'), o.created_at, COALESCE(NULLIF(o.fulfillment_status,''), NULLIF(o.payment_status,''), 'pending') FROM orders o ${whereSql}`
	}

	return {
		cte: `WITH interactions AS (${leads}${commentsAndReviews}${ordersUnion})`,
		params,
	}
}
