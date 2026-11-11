import { createHash, randomBytes } from 'node:crypto'
import { d1Query, ordersDb } from './d1'

export interface IssueQuoteAccessOptions {
	now?: Date
}

export async function issueQuoteAccess(
	orderId: string,
	options: IssueQuoteAccessOptions = {},
): Promise<string> {
	const now = options.now ?? new Date()
	const current = await d1Query<{ version: number; snapshot: string }>(
		'SELECT version, snapshot FROM quote_versions WHERE order_id = ? ORDER BY version DESC LIMIT 1',
		[orderId],
	)
	const latest = current.results[0]
	if (!latest?.version) {
		throw new Error('Only an issued quote can have buyer access')
	}

	let snapshotValidUntil: string | null = null
	try {
		const parsed = JSON.parse(latest.snapshot || '{}')
		if (typeof parsed?.validUntil === 'string' && parsed.validUntil.trim()) {
			snapshotValidUntil = parsed.validUntil.trim()
		}
	} catch {
		snapshotValidUntil = null
	}

	let expiresAtMs: number
	if (snapshotValidUntil && Number.isFinite(Date.parse(snapshotValidUntil))) {
		expiresAtMs = Date.parse(snapshotValidUntil)
	} else {
		const order = await ordersDb.getById(orderId)
		if (order?.quote_valid_until && Number.isFinite(Date.parse(order.quote_valid_until))) {
			expiresAtMs = Date.parse(order.quote_valid_until)
		} else {
			expiresAtMs = now.getTime() + 14 * 86400000
		}
	}

	if (expiresAtMs <= now.getTime()) {
		throw new Error('Cannot issue buyer access link for an expired quotation')
	}

	const expiresAt = new Date(expiresAtMs).toISOString()
	const token = randomBytes(32).toString('hex')
	await d1Query(
		'INSERT INTO quote_access (token_hash, order_id, expires_at, version) VALUES (?, ?, ?, ?)',
		[
			createHash('sha256').update(token).digest('hex'),
			orderId,
			expiresAt,
			latest.version,
		],
	)
	return token
}
