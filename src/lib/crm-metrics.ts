import { d1Query } from './d1'

export async function customerMetrics(emails: string[]) {
	const unique = [
		...new Set(emails.filter(Boolean).map((e) => e.toLowerCase())),
	].slice(0, 1000)
	if (!unique.length)
		return new Map<string, { orderCount: number; totalSpent: number }>()
	// Bounded chunks stay below SQLite/D1 parameter limits.
	const all: Array<{ email: string; orderCount: number; totalSpent: number }> =
		[]
	for (let start = 0; start < unique.length; start += 50) {
		const batch = unique.slice(start, start + 50)
		const rows = await d1Query<{
			email: string
			orderCount: number
			totalSpent: number
		}>(
			`SELECT lower(customer_email) AS email,
				COUNT(*) AS orderCount,
				COALESCE(SUM(CASE WHEN payment_status = 'paid' AND fulfillment_status != 'cancelled' THEN total ELSE 0 END), 0) AS totalSpent
			FROM orders
			WHERE lower(customer_email) IN (${batch.map(() => '?').join(',')})
			  AND deleted_at IS NULL
			  AND (quote_status IS NULL OR quote_status = 'approved')
			  AND fulfillment_status != 'cancelled'
			GROUP BY lower(customer_email)`,
			batch,
		)
		all.push(...rows.results)
	}
	return new Map(all.map((row) => [row.email, row]))
}
