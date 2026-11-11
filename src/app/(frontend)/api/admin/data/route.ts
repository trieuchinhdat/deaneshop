import { NextResponse } from 'next/server'
import { canAccessTab, requireAdminSession, type AdminTab } from '@/lib/admin-auth'
import {
	buildUnifiedCustomersProjection,
	formatCommentsForWorkspace,
	formatOrdersWithRelations,
	formatReviewsForWorkspace,
	getRoleScopedAggregates,
} from '@/lib/admin-queries'
import { serializeCsv } from '@/lib/csv'
import { PersistenceError, adminUsersDb, commentsDb, leadsDb, ordersDb, reviewsDb } from '@/lib/d1'

function parseBoundedInt(raw: string | null, fallback: number, min: number, max: number): number | null {
	if (raw === null || raw === '') return fallback
	if (!/^\d+$/.test(raw.trim())) return null
	const n = Number(raw.trim())
	if (!Number.isSafeInteger(n) || n < min || n > max) return null
	return n
}

export async function GET(req: Request) {
	try {
		const auth = await requireAdminSession()
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}
		const session = auth.session
		const { searchParams } = new URL(req.url)
		const resource = (searchParams.get('resource') || 'orders') as AdminTab | 'summary'
		const format = searchParams.get('format') === 'csv' ? 'csv' : 'json'
		const status = searchParams.get('status') || 'ALL'
		const search = searchParams.get('search') || ''

		if (!['orders', 'leads', 'customers', 'reviews', 'comments', 'summary'].includes(resource)) {
			return NextResponse.json({ success: false, error: 'Unsupported resource' }, { status: 400 })
		}

		if (resource !== 'summary' && !canAccessTab(session.role, resource)) {
			return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
		}

		if (resource === 'summary') {
			const summary = await getRoleScopedAggregates(session)
			return NextResponse.json({ success: true, summary })
		}

		const page = parseBoundedInt(searchParams.get('page'), 1, 1, 10000)
		const pageSize = parseBoundedInt(searchParams.get('pageSize'), 24, 1, 100)
		if (page === null || pageSize === null) {
			return NextResponse.json({ success: false, error: 'Invalid pagination parameters' }, { status: 400 })
		}
		const offset = (page - 1) * pageSize

		if (resource === 'orders') {
			if (format === 'csv') {
				const allRows: any[] = []
				for (let chunkOffset = 0; chunkOffset < 10000; chunkOffset += 200) {
					const chunk = await ordersDb.list({ status, search, limit: 200, offset: chunkOffset })
					if (!chunk.length) break
					allRows.push(...(await formatOrdersWithRelations(chunk)))
					if (chunk.length < 200) break
				}
				const csv = serializeCsv(
					['Order ID', 'Intent', 'Customer Name', 'Email', 'Phone', 'Address', 'Products', 'Total Amount', 'Payment Status', 'Fulfillment Status', 'Carrier', 'Tracking Code', 'Created At'],
					allRows.map((o) => [
						o.orderId || '',
						o.orderIntent || 'direct',
						o.customer?.name || '',
						o.customer?.email || '',
						{ value: o.customer?.phone || '', preserveLeadingZero: true },
						o.customer?.address || '',
						(Array.isArray(o.items) ? o.items : []).map((i: any) => `${i?.title || 'Product'} (x${i?.quantity || 1})`).join('; '),
						Number(o.pricing?.grandTotal) || 0,
						o.paymentStatus || 'UNPAID',
						o.fulfillmentStatus || 'PENDING',
						o.carrier || '',
						{ value: o.trackingCode || '', preserveLeadingZero: true },
						o._createdAt ? new Date(o._createdAt) : '',
					]),
				)
				return new Response(`\uFEFF${csv}`, {
					headers: {
						'Content-Type': 'text/csv; charset=utf-8',
						'Content-Disposition': `attachment; filename="orders_${new Date().toISOString().slice(0, 10)}.csv"`,
					},
				})
			}

			const [rows, total] = await Promise.all([
				ordersDb.list({ status, search, limit: pageSize, offset }),
				ordersDb.countFiltered({ status, search }),
			])
			return NextResponse.json({
				success: true,
				items: await formatOrdersWithRelations(rows),
				total,
				page,
				pageSize,
			})
		}

		if (resource === 'leads') {
			const assignedTo = session.role === 'sales' ? session.id : undefined
			if (format === 'csv') {
				const [staffList, allRows] = await Promise.all([
					adminUsersDb.list(),
					(async () => {
						const acc: any[] = []
						for (let chunkOffset = 0; chunkOffset < 10000; chunkOffset += 100) {
							const chunk = await leadsDb.list({
								status: status === 'ALL' ? 'all' : status,
								search,
								assigned_to: assignedTo,
								limit: 100,
								offset: chunkOffset,
							})
							if (!chunk.length) break
							acc.push(...chunk)
							if (chunk.length < 100) break
						}
						return acc
					})(),
				])
				const staffMap = new Map(staffList.map((s) => [s.id, s.full_name]))
				const csv = serializeCsv(
					['ID', 'Customer Name', 'Company', 'Email', 'Phone', 'Status', 'AI Score', 'Budget', 'Country', 'Assigned Rep', 'Created At'],
					allRows.map((l) => [
						l.id,
						l.name || '',
						l.company_name || '',
						l.email || '',
						{ value: l.phone || '', preserveLeadingZero: true },
						l.status || 'new',
						Number(l.ai_score) || 0,
						l.budget_range || '',
						l.ip_country || l.country || '',
						staffMap.get(l.assigned_to || '') || l.assigned_to || '',
						l.created_at ? new Date(l.created_at) : '',
					]),
				)
				return new Response(`\uFEFF${csv}`, {
					headers: {
						'Content-Type': 'text/csv; charset=utf-8',
						'Content-Disposition': `attachment; filename="b2b_leads_${new Date().toISOString().slice(0, 10)}.csv"`,
					},
				})
			}

			const [rows, total] = await Promise.all([
				leadsDb.list({
					status: status === 'ALL' ? 'all' : status,
					search,
					assigned_to: assignedTo,
					limit: pageSize,
					offset,
				}),
				leadsDb.countFiltered({
					status: status === 'ALL' ? 'all' : status,
					search,
					assigned_to: assignedTo,
				}),
			])
			return NextResponse.json({
				success: true,
				items: rows,
				total,
				page,
				pageSize,
			})
		}

		if (resource === 'customers') {
			if (format === 'csv') {
				const proj = await buildUnifiedCustomersProjection(session, { search, limit: 1000, offset: 0 })
				const csv = serializeCsv(
					['Buyer Name', 'Phone', 'Email', 'Address', 'City', 'Country', 'Orders Count', 'Lifetime Spent ($)', 'Segment', 'Created At'],
					proj.customers.map((c) => [
						c.name || 'Guest Buyer',
						{ value: c.phone || '', preserveLeadingZero: true },
						c.email || '',
						c.address || '',
						c.city || '',
						c.country || 'US',
						Number(c.orderCount) || 0,
						Number(c.totalSpent) || 0,
						c.orderCount > 1 ? 'Repeat Buyer' : c.orderCount === 1 ? 'First-Time Buyer' : 'Prospect',
						c.createdAt ? new Date(c.createdAt) : '',
					]),
				)
				return new Response(`\uFEFF${csv}`, {
					headers: {
						'Content-Type': 'text/csv; charset=utf-8',
						'Content-Disposition': `attachment; filename="customers_${new Date().toISOString().slice(0, 10)}.csv"`,
					},
				})
			}

			const proj = await buildUnifiedCustomersProjection(session, { search, limit: pageSize, offset })
			return NextResponse.json({
				success: true,
				items: proj.customers,
				total: proj.total,
				page,
				pageSize,
			})
		}

		if (resource === 'reviews') {
			const isApproved = status === 'APPROVED' ? 1 : status === 'PENDING' ? 0 : 'all'
			const rows = await reviewsDb.list({ isApproved, limit: format === 'csv' ? 1000 : pageSize, offset: format === 'csv' ? 0 : offset })
			const formatted = await formatReviewsForWorkspace(rows)
			if (format === 'csv') {
				const csv = serializeCsv(
					['Reviewer', 'Product', 'Rating', 'Content', 'Status', 'Shop Response', 'Submitted At'],
					formatted.map((r) => [
						r.author || '',
						r.product?.title || '',
						Number(r.rating) || 5,
						r.comment || '',
						r.isApproved ? 'Approved' : 'Pending',
						r.response || '',
						r.createdAt ? new Date(r.createdAt) : '',
					]),
				)
				return new Response(`\uFEFF${csv}`, {
					headers: {
						'Content-Type': 'text/csv; charset=utf-8',
						'Content-Disposition': `attachment; filename="reviews_${new Date().toISOString().slice(0, 10)}.csv"`,
					},
				})
			}
			return NextResponse.json({
				success: true,
				items: formatted,
				total: formatted.length,
				page,
				pageSize,
			})
		}

		if (resource === 'comments') {
			const isApproved = status === 'APPROVED' ? 1 : status === 'PENDING' ? 0 : 'all'
			const rows = await commentsDb.list({ isApproved, limit: format === 'csv' ? 1000 : pageSize, offset: format === 'csv' ? 0 : offset })
			const formatted = await formatCommentsForWorkspace(rows)
			if (format === 'csv') {
				const csv = serializeCsv(
					['Commenter Name', 'Email', 'Blog Article', 'Content', 'Status', 'Is Author Reply', 'Created At'],
					formatted.map((c) => [
						c.authorName || '',
						c.authorEmail || '',
						c.post?.title || '',
						c.content || '',
						c.isApproved ? 'Approved' : 'Pending',
						c.isAuthorReply ? 'Author' : 'Guest',
						c.createdAt ? new Date(c.createdAt) : '',
					]),
				)
				return new Response(`\uFEFF${csv}`, {
					headers: {
						'Content-Type': 'text/csv; charset=utf-8',
						'Content-Disposition': `attachment; filename="comments_${new Date().toISOString().slice(0, 10)}.csv"`,
					},
				})
			}
			return NextResponse.json({
				success: true,
				items: formatted,
				total: formatted.length,
				page,
				pageSize,
			})
		}

		return NextResponse.json({ success: false, error: 'Unsupported resource' }, { status: 400 })
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		return NextResponse.json(
			{ success: false, error: status === 503 ? 'Database unavailable' : error?.message || 'Query failed' },
			{ status },
		)
	}
}
