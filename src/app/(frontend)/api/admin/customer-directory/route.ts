import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import {
	buildOrderWhereClause,
	customerDirectoryScope,
	type CustomerDirectoryOptions,
	type CustomerInteraction,
	type CustomerRecord,
} from '@/lib/customer-directory'
import { d1Query } from '@/lib/d1'
import { leadStorageError } from '@/lib/lead-storage-error'

const PAGE_SIZE = 25

function jsonNoStore(body: unknown, init?: ResponseInit) {
	const headers = new Headers(init?.headers)
	headers.set('Cache-Control', 'no-store')
	return NextResponse.json(body, { ...init, headers })
}

function buildLatestFields(alias: string) {
	return ['name', 'email', 'phone', 'company', 'country']
		.map(
			(field) =>
				`(SELECT TRIM(recent.${field}) FROM interactions recent WHERE recent.customer_key = ${alias}.customer_key AND NULLIF(TRIM(recent.${field}),'') IS NOT NULL ORDER BY datetime(recent.created_at) DESC, recent.kind, recent.id DESC LIMIT 1) AS ${field}`,
		)
		.join(', ')
}

async function inspectOrdersSchema(): Promise<CustomerDirectoryOptions> {
	try {
		const res = await d1Query<{ name: string }>('PRAGMA table_info(orders)')
		const cols = new Set((res.results || []).map((c) => c.name))
		if (cols.size === 0) return { includeOrders: false }
		return {
			includeOrders: true,
			hasOrderIntent: cols.has('order_intent'),
			hasOrderDeletedAt: cols.has('deleted_at'),
		}
	} catch {
		return { includeOrders: false }
	}
}

function buildOrderSummaryFields(
	alias: string,
	scoped: boolean,
	sessionId: string,
	orderOpts: CustomerDirectoryOptions,
): { sql: string; params: string[] } {
	if (!orderOpts.includeOrders) {
		return {
			sql: '0 AS order_count, 0 AS total_spent',
			params: [],
		}
	}
	const filter = buildOrderWhereClause('o', scoped, orderOpts)
	const keyMatch = `(CASE WHEN NULLIF(TRIM(o.customer_email),'') IS NOT NULL THEN 'email:' || LOWER(TRIM(o.customer_email)) ELSE 'order:' || o.id END) = ${alias}.customer_key`
	const whereSql = [...filter.clauses, keyMatch].join(' AND ')
	const sessionParams = filter.needsSessionParam ? [sessionId] : []
	return {
		sql: `COALESCE((SELECT COUNT(*) FROM orders o WHERE ${whereSql}), 0) AS order_count, COALESCE((SELECT SUM(COALESCE(o.total, 0)) FROM orders o WHERE ${whereSql}), 0) AS total_spent`,
		params: [...sessionParams, ...sessionParams],
	}
}

export async function GET(req: Request) {
	const auth = await requireAdminSession([
		'superadmin',
		'admin',
		'sales',
	])
	if (!auth.ok)
		return jsonNoStore({ error: auth.error }, { status: auth.status })
	try {
		const p = new URL(req.url).searchParams
		const page = Number(p.get('page') || 1)
		if (!Number.isSafeInteger(page) || page < 1 || page > 10000)
			return jsonNoStore({ error: 'Invalid page' }, { status: 400 })
		const orderOpts = await inspectOrdersSchema()
		const scoped = auth.session.role === 'sales'
		const { cte, params } = customerDirectoryScope(auth.session, orderOpts)
		const key = p.get('customer')
		if (key && key.length > 1000)
			return jsonNoStore({ error: 'Invalid customer' }, { status: 400 })
		const search = (p.get('search') || '').trim().slice(0, 200)
		const source = (p.get('source') || '').trim().slice(0, 60)
		const sort = p.get('sort') === 'interactions' ? 'interactions' : 'recent'

		if (key) {
			const latestFields = buildLatestFields('g')
			const orderSummary = buildOrderSummaryFields(
				'g',
				scoped,
				auth.session.id,
				orderOpts,
			)
			const [profile, events] = await Promise.all([
				d1Query<CustomerRecord>(
					`${cte}, target_interactions AS (SELECT * FROM interactions WHERE customer_key = ?)
					SELECT customer_key, ${latestFields}, ${orderSummary.sql}, GROUP_CONCAT(DISTINCT source) AS sources, COUNT(*) AS interactions,
					strftime('%Y-%m-%dT%H:%M:%fZ', MIN(datetime(created_at))) AS first_seen,
					strftime('%Y-%m-%dT%H:%M:%fZ', MAX(datetime(created_at))) AS last_seen
					FROM target_interactions g GROUP BY customer_key`,
					[...params, key, ...orderSummary.params],
				),
				d1Query<CustomerInteraction>(
					`${cte} SELECT * FROM interactions WHERE customer_key = ? ORDER BY datetime(created_at) DESC, kind, id LIMIT ${PAGE_SIZE} OFFSET ?`,
					[...params, key, (page - 1) * PAGE_SIZE],
				),
			])
			if (!profile.results?.length)
				return jsonNoStore(
					{ error: 'Customer not available' },
					{ status: 404 },
				)
			return jsonNoStore({
				customer: profile.results[0],
				items: events.results || [],
				page,
				pageSize: PAGE_SIZE,
			})
		}

		// Search/filter matching identities first, then aggregate all their authorized interactions.
		const filters: string[] = []
		const filterArgs: unknown[] = []
		if (search) {
			filters.push(
				'customer_key IN (SELECT customer_key FROM interactions WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ?)',
			)
			filterArgs.push(...Array(4).fill(`%${search}%`))
		}
		if (source && source !== 'all') {
			filters.push(
				'customer_key IN (SELECT customer_key FROM interactions WHERE source = ?)',
			)
			filterArgs.push(source)
		}
		const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
		const args = [...params, ...filterArgs]
		const orderBy =
			sort === 'interactions'
				? 'interactions DESC, last_seen DESC, customer_key'
				: 'last_seen DESC, customer_key'

		// Paginate customer keys before computing the 5 per-field latest-value subqueries.
		const latestFields = buildLatestFields('p')
		const orderSummary = buildOrderSummaryFields(
			'p',
			scoped,
			auth.session.id,
			orderOpts,
		)
		const pageQuery = `${cte},
			page_stats AS (
				SELECT customer_key, GROUP_CONCAT(DISTINCT source) AS sources, COUNT(*) AS interactions,
					strftime('%Y-%m-%dT%H:%M:%fZ', MIN(datetime(created_at))) AS first_seen,
					strftime('%Y-%m-%dT%H:%M:%fZ', MAX(datetime(created_at))) AS last_seen
				FROM interactions ${where}
				GROUP BY customer_key
				ORDER BY ${orderBy}
				LIMIT ${PAGE_SIZE} OFFSET ?
			)
			SELECT p.customer_key, ${latestFields}, ${orderSummary.sql}, p.sources, p.interactions, p.first_seen, p.last_seen
			FROM page_stats p
			ORDER BY ${orderBy}`

		const countQuery = `${cte} SELECT COUNT(DISTINCT customer_key) AS total FROM interactions ${where}`

		const [rows, total] = await Promise.all([
			d1Query<CustomerRecord>(pageQuery, [
				...args,
				(page - 1) * PAGE_SIZE,
				...orderSummary.params,
			]),
			d1Query<{ total: number }>(countQuery, args),
		])
		return jsonNoStore({
			items: rows.results || [],
			total: total.results?.[0]?.total || 0,
			page,
			pageSize: PAGE_SIZE,
		})
	} catch (error) {
		return jsonNoStore(leadStorageError(error), { status: 503 })
	}
}
