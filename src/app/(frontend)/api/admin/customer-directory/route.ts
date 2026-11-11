import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import {
	customerDirectoryScope,
	type CustomerInteraction,
	type CustomerRecord,
} from '@/lib/customer-directory'
import { d1Query } from '@/lib/d1'
import { leadStorageError } from '@/lib/lead-storage-error'

export async function GET(req: Request) {
	const auth = await requireAdminSession([
		'superadmin',
		'admin',
		'marketing',
		'sales',
		'cskh',
	])
	if (!auth.ok)
		return NextResponse.json({ error: auth.error }, { status: auth.status })
	try {
		const p = new URL(req.url).searchParams
		const page = Number(p.get('page') || 1)
		if (!Number.isSafeInteger(page) || page < 1 || page > 10000)
			return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
		const { cte, params } = customerDirectoryScope(auth.session)
		const key = p.get('customer')
		if (key && key.length > 1000)
			return NextResponse.json({ error: 'Invalid customer' }, { status: 400 })
		const search = (p.get('search') || '').trim().slice(0, 200)
		// Search matching identities, then aggregate all their authorized interactions.
		const where = key
			? 'WHERE customer_key = ?'
			: search
				? `WHERE customer_key IN (SELECT customer_key FROM interactions WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ?)`
				: ''
		const args = [
			...params,
			...(key ? [key] : search ? Array(4).fill(`%${search}%`) : []),
		]
		// Use the most recent supplied value per field, not a lexicographic MAX.
		const latestFields = ['name', 'email', 'phone', 'company', 'country']
			.map(
				(field) =>
					`(SELECT TRIM(recent.${field}) FROM interactions recent WHERE recent.customer_key = g.customer_key AND NULLIF(TRIM(recent.${field}),'') IS NOT NULL ORDER BY datetime(recent.created_at) DESC, recent.kind, recent.id DESC LIMIT 1) AS ${field}`,
			)
			.join(', ')
		const grouped = `SELECT customer_key, ${latestFields}, GROUP_CONCAT(DISTINCT source) AS sources, COUNT(*) AS interactions,
            strftime('%Y-%m-%dT%H:%M:%fZ', MIN(datetime(created_at))) AS first_seen,
            strftime('%Y-%m-%dT%H:%M:%fZ', MAX(datetime(created_at))) AS last_seen
            FROM interactions g ${where} GROUP BY customer_key`
		if (key) {
			const [profile, events] = await Promise.all([
				d1Query<CustomerRecord>(`${cte} ${grouped}`, args),
				d1Query<CustomerInteraction>(
					`${cte} SELECT * FROM interactions WHERE customer_key = ? ORDER BY datetime(created_at) DESC, kind, id LIMIT 25 OFFSET ?`,
					[...params, key, (page - 1) * 25],
				),
			])
			if (!profile.results?.length)
				return NextResponse.json(
					{ error: 'Customer not available' },
					{ status: 404 },
				)
			return NextResponse.json({
				customer: profile.results[0],
				items: events.results || [],
				page,
			})
		}
		const [rows, total] = await Promise.all([
			d1Query<CustomerRecord>(
				`${cte} ${grouped} ORDER BY last_seen DESC, customer_key LIMIT 25 OFFSET ?`,
				[...args, (page - 1) * 25],
			),
			d1Query<{ total: number }>(
				`${cte} SELECT COUNT(DISTINCT customer_key) AS total FROM interactions ${where}`,
				args,
			),
		])
		return NextResponse.json({
			items: rows.results || [],
			total: total.results?.[0]?.total || 0,
			page,
		})
	} catch (error) {
		return NextResponse.json(leadStorageError(error), { status: 503 })
	}
}
