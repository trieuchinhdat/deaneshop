import { createHash } from 'node:crypto'
import { getEnvVarSync } from './cf-env'
import { d1Query, leadNotesDb, leadsDb, ordersDb } from './d1'
import { buildComplianceDossierEmailContent } from './dossier-email'
import { issueQuoteAccess } from './quote-token'
import { outboxJobLimit } from './outbox-budget'

export function escapeEmailHtml(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(c) =>
			({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
				c
			]!,
	)
}

export type OutboxFailureKind = 'transient' | 'permanent' | 'superseded'

export class OutboxJobError extends Error {
	kind: OutboxFailureKind
	constructor(message: string, kind: OutboxFailureKind = 'transient') {
		super(message)
		this.name = 'OutboxJobError'
		this.kind = kind
	}
}

export interface EmailEnvelope {
	to: string
	from: string
	subject: string
	html: string
	quoteUrl?: string
	version?: number
	bodyHash: string
}

interface OutboxRow {
	id: string
	payload: string
	attempts: number
	event_type: string
	delivery_envelope?: string | null
	max_attempts?: number | null
}

function hashBody(to: string, subject: string, html: string): string {
	return createHash('sha256')
		.update(JSON.stringify({ to, subject, html }))
		.digest('hex')
}

function classifyHttpStatus(status: number): OutboxFailureKind {
	if (status === 408 || status === 429 || status >= 500) return 'transient'
	return 'permanent'
}

export function resolveComplianceAssetUrl(
	url: string | null | undefined,
): string | null {
	if (!url || url === '#') return null
	try {
		const parsed = new URL(url)
		if (parsed.protocol !== 'https:') return null
		const allowedHosts = new Set<string>(['cdn.sanity.io'])
		const baseUrl = getEnvVarSync('NEXT_PUBLIC_BASE_URL')
		if (baseUrl) {
			try {
				allowedHosts.add(new URL(baseUrl).hostname.toLowerCase())
			} catch {}
		}
		const extraHosts = (getEnvVarSync('ALLOWED_DOSSIER_HOSTS') || '')
			.split(',')
			.map((h) => h.trim().toLowerCase())
			.filter(Boolean)
		for (const h of extraHosts) allowedHosts.add(h)
		if (!allowedHosts.has(parsed.hostname.toLowerCase())) return null
		return parsed.toString()
	} catch {
		return null
	}
}

async function sendViaResend(
	idempotencyKey: string,
	envelope: EmailEnvelope,
	resendApiKey: string,
): Promise<{ messageId: string | null }> {
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		signal: AbortSignal.timeout(10000),
		headers: {
			Authorization: `Bearer ${resendApiKey}`,
			'Content-Type': 'application/json',
			'Idempotency-Key': idempotencyKey,
		},
		body: JSON.stringify({
			from: envelope.from,
			to: [envelope.to],
			subject: envelope.subject,
			html: envelope.html,
		}),
	})
	const data = await response.json().catch(() => ({}))
	if (!response.ok) {
		throw new OutboxJobError(
			(data as any)?.message || `Email HTTP ${response.status}`,
			classifyHttpStatus(response.status),
		)
	}
	return {
		messageId: typeof (data as any)?.id === 'string' ? (data as any).id : null,
	}
}

async function persistEnvelope(
	id: string,
	lease: string,
	envelope: EmailEnvelope,
) {
	const saved = await d1Query(
		`UPDATE outbox SET delivery_envelope = ? WHERE id = ? AND locked_until = ? AND status = 'processing' AND locked_until > ? AND delivery_envelope IS NULL`,
		[JSON.stringify(envelope), id, lease, new Date().toISOString()],
	)
	if (saved.meta?.changes !== 1) {
		throw new OutboxJobError(
			'Delivery envelope was not persisted under the current lease',
		)
	}
}

export async function processOutbox(specificJobId?: string) {
	const now = new Date().toISOString()
	const lease = new Date(Date.now() + 60000).toISOString()
	const job = specificJobId
		? await d1Query<OutboxRow>(
				`UPDATE outbox SET status = 'processing', locked_until = ?, attempts = attempts + 1
				WHERE id = ? AND ((status IN ('pending','failed') AND available_at <= ?) OR (status = 'processing' AND locked_until < ?))
				RETURNING id, payload, attempts, event_type, delivery_envelope, max_attempts`,
				[lease, specificJobId, now, now],
			)
		: await d1Query<OutboxRow>(
				`UPDATE outbox SET status = 'processing', locked_until = ?, attempts = attempts + 1
				WHERE id = (
					SELECT id FROM outbox
					WHERE (
						(status IN ('pending','failed') AND available_at <= ? AND COALESCE(attempts, 0) < COALESCE(max_attempts, 8))
						OR (status = 'processing' AND locked_until < ?)
					)
					ORDER BY available_at LIMIT 1
				)
				RETURNING id, payload, attempts, event_type, delivery_envelope, max_attempts`,
				[lease, now, now],
			)
	if (!job.results[0]) return { processed: false }
	const row = job.results[0]
	const maxAttempts =
		typeof row.max_attempts === 'number' && row.max_attempts > 0
			? row.max_attempts
			: 8

	try {
		const payload = JSON.parse(row.payload || '{}')
		let providerMessageId: string | null = null

		if (row.event_type === 'order.created') {
			const order = await ordersDb.getById(payload.orderId)
			if (!order) {
				const maybeDeleted = await ordersDb
					.getById(payload.orderId, { includeDeleted: true })
					.catch(() => null)
				if (maybeDeleted?.deleted_at) {
					throw new OutboxJobError(
						'Order deleted; do not deliver',
						'superseded',
					)
				}
				throw new OutboxJobError('Order unavailable', 'permanent')
			}
			const destination = getEnvVarSync('ORDER_WEBHOOK_URL')
			if (!destination || new URL(destination).protocol !== 'https:') {
				throw new OutboxJobError(
					'Server HTTPS webhook is not configured',
					'permanent',
				)
			}
			const res = await fetch(destination, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Idempotency-Key': row.id,
				},
				body: JSON.stringify({ event: 'order.created', data: order }),
				signal: AbortSignal.timeout(10000),
				redirect: 'error',
			})
			if (!res.ok) {
				throw new OutboxJobError(
					`Delivery HTTP ${res.status}`,
					classifyHttpStatus(res.status),
				)
			}
		} else if (
			row.event_type === 'order.email' ||
			row.event_type === 'quote.email'
		) {
			const order = await ordersDb.getById(payload.orderId)
			if (!order) {
				const maybeDeleted = await ordersDb
					.getById(payload.orderId, { includeDeleted: true })
					.catch(() => null)
				if (maybeDeleted?.deleted_at) {
					throw new OutboxJobError(
						'Order deleted; do not deliver',
						'superseded',
					)
				}
				throw new OutboxJobError('Order unavailable', 'permanent')
			}
			if (!order.customer_email || !order.customer_email.trim()) {
				throw new OutboxJobError('Order has no recipient email', 'permanent')
			}

			const resendApiKey = getEnvVarSync('RESEND_API_KEY')
			const resendFrom = getEnvVarSync('RESEND_FROM_EMAIL')

			let envelope: EmailEnvelope | null = null
			if (row.delivery_envelope) {
				try {
					envelope = JSON.parse(row.delivery_envelope) as EmailEnvelope
				} catch {
					envelope = null
				}
			}

			if (row.event_type === 'quote.email') {
				const snapshot = await d1Query<{ snapshot: string; version: number }>(
					'SELECT snapshot, version FROM quote_versions WHERE order_id = ? ORDER BY version DESC LIMIT 1',
					[order.id],
				)
				if (snapshot.results[0]?.version !== payload.version) {
					throw new OutboxJobError(
						'Superseded quotation; do not deliver',
						'superseded',
					)
				}
				if (
					order.quote_status === 'cancelled' ||
					order.quote_status === 'rejected'
				) {
					throw new OutboxJobError(
						'Quotation cancelled or rejected; do not deliver',
						'superseded',
					)
				}
				if (!envelope) {
					if (!resendApiKey || !resendFrom) {
						throw new OutboxJobError(
							'Email provider is not configured',
							'permanent',
						)
					}
					const baseRaw = getEnvVarSync('NEXT_PUBLIC_BASE_URL') || ''
					let base: URL
					try {
						base = new URL(baseRaw)
					} catch {
						throw new OutboxJobError('HTTPS quote URL required', 'permanent')
					}
					if (base.protocol !== 'https:')
						throw new OutboxJobError('HTTPS quote URL required', 'permanent')
					const token = await issueQuoteAccess(order.id)
					const url = new URL(
						`/quote/${encodeURIComponent(order.order_number)}`,
						base,
					)
					url.searchParams.set('token', token)
					const data = JSON.parse(snapshot.results[0].snapshot)
					const html =
						`<h1>Proforma quotation ${escapeEmailHtml(order.order_number)} / v${payload.version}</h1><p>${escapeEmailHtml(order.customer_name)}</p><table>` +
						(Array.isArray(data.items)
							? data.items
									.map(
										(item: {
											title: string
											quantity: number
											total: number
										}) =>
											`<tr><td>${escapeEmailHtml(item.title)}</td><td>${item.quantity}</td><td>${item.total}</td></tr>`,
									)
									.join('')
							: '') +
						`</table><p>Total: ${data.total} ${escapeEmailHtml(data.currency || 'USD')}</p><p>${escapeEmailHtml(data.paymentTerms || '')}</p><a href="${escapeEmailHtml(url.toString())}">Review quotation securely</a>`
					const subject = `Request ${order.order_number} (v${payload.version})`
					envelope = {
						to: order.customer_email.trim(),
						from: resendFrom,
						subject,
						html,
						quoteUrl: url.toString(),
						version: payload.version,
						bodyHash: hashBody(order.customer_email.trim(), subject, html),
					}
					// Persist the exact envelope BEFORE calling provider so retries are byte-for-byte identical (DF-010)
					await persistEnvelope(row.id, lease, envelope)
				}
			} else if (!envelope) {
				if (!resendApiKey || !resendFrom) {
					throw new OutboxJobError(
						'Email provider is not configured',
						'permanent',
					)
				}
				const subject = `Request ${order.order_number}`
				const html = `<p>Hello ${escapeEmailHtml(order.customer_name)},</p><p>Your request ${escapeEmailHtml(order.order_number)} is saved and awaiting review.</p>`
				envelope = {
					to: order.customer_email.trim(),
					from: resendFrom,
					subject,
					html,
					bodyHash: hashBody(order.customer_email.trim(), subject, html),
				}
				await persistEnvelope(row.id, lease, envelope)
			}

			if (!resendApiKey || !resendFrom) {
				throw new OutboxJobError(
					'Email provider is not configured',
					'permanent',
				)
			}
			const sendRes = await sendViaResend(row.id, envelope, resendApiKey)
			providerMessageId = sendRes.messageId
		} else if (row.event_type === 'lead.email') {
			const resendApiKey = getEnvVarSync('RESEND_API_KEY')
			const resendFrom =
				getEnvVarSync('RESEND_FROM_EMAIL') || envelopeFromFallback()
			let envelope: EmailEnvelope | null = null
			if (row.delivery_envelope) {
				try {
					envelope = JSON.parse(row.delivery_envelope) as EmailEnvelope
				} catch {
					envelope = null
				}
			}
			if (!envelope) {
				throw new OutboxJobError('Missing lead email envelope', 'permanent')
			}
			if (!resendApiKey) {
				throw new OutboxJobError(
					'Email provider is not configured',
					'permanent',
				)
			}
			envelope = { ...envelope, from: envelope.from || resendFrom }
			const sendRes = await sendViaResend(row.id, envelope, resendApiKey)
			providerMessageId = sendRes.messageId

			if (payload.leadId) {
				const lead = await leadsDb.getById(payload.leadId).catch(() => null)
				if (lead) {
					await leadsDb
						.update(lead.id, {
							last_contacted_at: new Date().toISOString(),
							status: lead.status === 'new' ? 'contacted' : lead.status,
						})
						.catch(() => {})
					await leadNotesDb
						.append({
							lead_id: lead.id,
							author_id: payload.actorId || 'system',
							author_name: payload.actorName || 'Sales Operations',
							content: `Email accepted by provider for ${envelope.to}: "${envelope.subject}" (Message ID: ${providerMessageId || row.id})`,
						})
						.catch(() => {})
				}
			}
		} else if (row.event_type === 'lead.notify') {
			const lead = await leadsDb.getById(payload.leadId)
			if (!lead) throw new OutboxJobError('Lead unavailable', 'permanent')
			const tgToken = getEnvVarSync('TELEGRAM_BOT_TOKEN')
			const tgChat = getEnvVarSync('TELEGRAM_CHAT_ID')
			if (tgToken && tgChat) {
				const text = [
					`🎯 <b>NEW B2B LEAD CAPTURED</b>`,
					`👤 <b>Name:</b> ${escapeEmailHtml(lead.name || 'Prospect')}`,
					lead.company_name
						? `🏢 <b>Company:</b> ${escapeEmailHtml(lead.company_name)}`
						: null,
					lead.email ? `✉️ <b>Email:</b> ${escapeEmailHtml(lead.email)}` : null,
					lead.phone ? `📞 <b>Phone:</b> ${escapeEmailHtml(lead.phone)}` : null,
					lead.source
						? `🔗 <b>Source:</b> ${escapeEmailHtml(lead.source)}`
						: null,
				]
					.filter(Boolean)
					.join('\n')
				const res = await fetch(
					`https://api.telegram.org/bot${tgToken}/sendMessage`,
					{
						method: 'POST',
						signal: AbortSignal.timeout(10000),
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							chat_id: tgChat,
							text,
							parse_mode: 'HTML',
							disable_web_page_preview: true,
						}),
					},
				)
				if (!res.ok) {
					throw new OutboxJobError(
						`Telegram HTTP ${res.status}`,
						classifyHttpStatus(res.status),
					)
				}
			}
			const webhookUrl =
				getEnvVarSync('LEAD_WEBHOOK_URL') ||
				getEnvVarSync('NOTIFICATION_WEBHOOK_URL')
			if (webhookUrl) {
				const parsed = new URL(webhookUrl)
				if (parsed.protocol !== 'https:') {
					throw new OutboxJobError('HTTPS lead webhook required', 'permanent')
				}
				const res = await fetch(parsed.toString(), {
					method: 'POST',
					signal: AbortSignal.timeout(10000),
					headers: {
						'Content-Type': 'application/json',
						'Idempotency-Key': row.id,
					},
					body: JSON.stringify({ event: 'lead.created', data: lead }),
					redirect: 'error',
				})
				if (!res.ok) {
					throw new OutboxJobError(
						`Lead webhook HTTP ${res.status}`,
						classifyHttpStatus(res.status),
					)
				}
			}
		} else if (row.event_type === 'lead.dossier') {
			const lead = await leadsDb.getById(payload.leadId)
			if (!lead) throw new OutboxJobError('Lead unavailable', 'permanent')
			if (!lead.email)
				throw new OutboxJobError('Lead has no email', 'permanent')
			const resendApiKey = getEnvVarSync('RESEND_API_KEY')
			const resendFrom =
				getEnvVarSync('RESEND_FROM_EMAIL') || envelopeFromFallback()

			let envelope: EmailEnvelope | null = null
			if (row.delivery_envelope) {
				try {
					envelope = JSON.parse(row.delivery_envelope) as EmailEnvelope
				} catch {
					envelope = null
				}
			}
			if (!envelope) {
				if (!resendApiKey) {
					throw new OutboxJobError(
						'Email provider is not configured',
						'permanent',
					)
				}
				// Trigger-created jobs may run before the capture request enriches metadata.
				// Resolve the immutable asset ID when the original job has no complete URL.
				let asset = payload
				if (!resolveComplianceAssetUrl(asset.downloadUrl)) {
					const { lookupPublishedComplianceAsset } =
						await import('./compliance-assets')
					const resolved = await lookupPublishedComplianceAsset(
						payload.assetId || lead.dossier_asset_id,
					)
					if (!resolved?.downloadUrl)
						throw new OutboxJobError(
							'Published dossier download is unavailable',
						)
					asset = {
						...payload,
						downloadUrl: resolved.downloadUrl,
						documentTitle: resolved.title,
						documentCategory: resolved.category,
						fileSize: resolved.fileSize,
					}
				}
				const safeUrl = resolveComplianceAssetUrl(asset.downloadUrl)
				if (!safeUrl)
					throw new OutboxJobError('A safe dossier download URL is required')
				const content = buildComplianceDossierEmailContent({
					customerName: lead.name,
					customerEmail: lead.email,
					companyName: lead.company_name,
					documentTitle: asset.documentTitle || 'Technical Dossier',
					documentCategory: asset.documentCategory || undefined,
					fileSize: asset.fileSize || undefined,
					downloadUrl: safeUrl,
					brandName: payload.brandName || undefined,
				})
				envelope = {
					to: lead.email.trim(),
					from: resendFrom,
					subject: content.subject,
					html: content.html,
					bodyHash: hashBody(lead.email.trim(), content.subject, content.html),
				}
				await persistEnvelope(row.id, lease, envelope)
			}
			if (!resendApiKey) {
				throw new OutboxJobError(
					'Email provider is not configured',
					'permanent',
				)
			}
			const sendRes = await sendViaResend(row.id, envelope, resendApiKey)
			providerMessageId = sendRes.messageId
		} else {
			throw new OutboxJobError(
				`Unsupported outbox event_type: ${row.event_type}`,
				'permanent',
			)
		}

		await d1Query(
			`UPDATE outbox SET status = 'sent', sent_at = ?, last_error = NULL, failure_kind = NULL, provider_message_id = ?, locked_until = NULL WHERE id = ? AND locked_until = ?`,
			[new Date().toISOString(), providerMessageId, row.id, lease],
		)
		return {
			processed: true,
			status: 'sent' as const,
			jobId: row.id,
			messageId: providerMessageId,
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Delivery failed'
		const kind: OutboxFailureKind =
			error instanceof OutboxJobError ? error.kind : 'transient'

		if (kind === 'superseded') {
			await d1Query(
				`UPDATE outbox SET status = 'superseded', failure_kind = 'superseded', last_error = ?, locked_until = NULL WHERE id = ? AND locked_until = ?`,
				[message, row.id, lease],
			)
			return {
				processed: true,
				status: 'superseded' as const,
				jobId: row.id,
				error: message,
			}
		}

		if (kind === 'permanent' || row.attempts >= maxAttempts) {
			const deadAt = new Date().toISOString()
			await d1Query(
				`UPDATE outbox SET status = 'dead_letter', failure_kind = ?, last_error = ?, dead_lettered_at = ?, locked_until = NULL WHERE id = ? AND locked_until = ?`,
				[kind, message, deadAt, row.id, lease],
			)
			return {
				processed: true,
				status: 'dead_letter' as const,
				jobId: row.id,
				error: message,
			}
		}

		const retryAt = new Date(
			Date.now() + Math.min(3600000, 1000 * 2 ** Math.min(row.attempts, 12)),
		).toISOString()
		await d1Query(
			`UPDATE outbox SET status = 'failed', failure_kind = 'transient', last_error = ?, available_at = ?, locked_until = NULL WHERE id = ? AND locked_until = ?`,
			[message, retryAt, row.id, lease],
		)
		return {
			processed: true,
			status: 'failed' as const,
			jobId: row.id,
			error: message,
		}
	}
}

function envelopeFromFallback(): string {
	const siteName = getEnvVarSync('NEXT_PUBLIC_SITE_NAME') || 'DeanFlow'
	return `${siteName} Commercial Team <contact@store.com>`
}

export async function drainOutbox(maxJobs = 10) {
	let sent = 0
	let failed = 0
	let deadLettered = 0
	let superseded = 0
	for (let i = 0; i < outboxJobLimit(maxJobs); i++) {
		const res = await processOutbox()
		if (!res.processed) break
		if (res.status === 'sent') sent++
		else if (res.status === 'dead_letter') deadLettered++
		else if (res.status === 'superseded') superseded++
		else failed++
	}
	return {
		processedCount: sent + failed + deadLettered + superseded,
		sent,
		failed,
		deadLettered,
		superseded,
	}
}
