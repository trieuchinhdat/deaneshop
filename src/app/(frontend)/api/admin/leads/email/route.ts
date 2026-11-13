import { createHash, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { getEnvVarSync } from '@/lib/cf-env'
import { PersistenceError, d1Query, leadNotesDb, leadsDb } from '@/lib/d1'
import { escapeEmailHtml, processOutbox } from '@/lib/outbox'

export async function GET(req: Request) {
	try {
		const auth = await requireAdminSession(['superadmin', 'admin', 'sales'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}
		const session = auth.session
		const { searchParams } = new URL(req.url)
		const leadId = (searchParams.get('leadId') || '').trim()
		if (!leadId) {
			return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 })
		}

		const target = await leadsDb.getById(leadId)
		if (!target) return NextResponse.json({ success: false }, { status: 404 })
		if (session.role === 'sales' && target.assigned_to !== session.id) {
			return NextResponse.json({ success: false }, { status: 403 })
		}

		const rows = await d1Query<{
			id: string
			status: string
			attempts: number
			last_error: string | null
			sent_at: string | null
			provider_message_id: string | null
			available_at: string
		}>(
			`SELECT id, status, attempts, last_error, sent_at, provider_message_id, available_at
			FROM outbox
			WHERE event_type = 'lead.email' AND json_extract(payload, '$.leadId') = ?
			ORDER BY available_at DESC LIMIT 20`,
			[leadId],
		)

		return NextResponse.json({
			success: true,
			deliveries: rows.results || [],
		})
	} catch (error) {
		const status = error instanceof PersistenceError ? 503 : 500
		return NextResponse.json({ success: false }, { status })
	}
}

export async function POST(req: Request) {
	try {
		// 1. RBAC Guard: Only Super Admin, Admin, and Sales can send B2B outreach emails
		const auth = await requireAdminSession(['superadmin', 'admin', 'sales'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const body = await req.json().catch(() => ({}))
		const { leadId, toEmail, subject, content, staffName, commandId } = body as Record<string, unknown>

		if (
			typeof leadId !== 'string' ||
			!leadId.trim() ||
			typeof toEmail !== 'string' ||
			!toEmail.trim() ||
			typeof subject !== 'string' ||
			!subject.trim() ||
			typeof content !== 'string' ||
			!content.trim()
		) {
			return NextResponse.json(
				{ success: false, error: 'Please provide all required fields: leadId, recipient email, subject, and content.' },
				{ status: 400 },
			)
		}

		const cleanLeadId = leadId.trim()
		const cleanTo = toEmail.trim()
		const cleanSubject = subject.trim().slice(0, 250)
		const cleanContent = content.trim().slice(0, 10000)

		const target = await leadsDb.getById(cleanLeadId)
		if (!target) return NextResponse.json({ success: false }, { status: 404 })
		if (session.role === 'sales' && target.assigned_to !== session.id) {
			return NextResponse.json({ success: false }, { status: 403 })
		}
		if (cleanTo.toLowerCase() !== target.email?.toLowerCase()) {
			return NextResponse.json({ success: false, error: 'Recipient does not match lead email' }, { status: 400 })
		}

		const resendApiKey = getEnvVarSync('RESEND_API_KEY') || ''
		const fromEmail =
			getEnvVarSync('RESEND_FROM_EMAIL') ||
			`${getEnvVarSync('NEXT_PUBLIC_SITE_NAME') || 'Direct'} B2B Team <contact@store.com>`

		if (!resendApiKey) {
			return NextResponse.json({ success: false, error: 'Email provider not configured' }, { status: 503 })
		}

		const senderName = (typeof staffName === 'string' && staffName.trim()) || session.name || 'B2B Advisor'
		const suppliedCmd =
			(typeof commandId === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(commandId.trim()) && commandId.trim()) ||
			(req.headers.get('Idempotency-Key') && /^[a-zA-Z0-9_-]{8,128}$/.test(req.headers.get('Idempotency-Key')!) && req.headers.get('Idempotency-Key')!) ||
			null

		const deliveryKey = suppliedCmd || randomUUID()
		const jobId = `lead-email:${cleanLeadId}:${deliveryKey}`

		// Check if this exact command was already persisted/sent (DF-015 idempotency)
		const existingJobRes = await d1Query<{
			id: string
			status: string
			provider_message_id: string | null
			last_error: string | null
			delivery_envelope: string | null
		}>(
			'SELECT id, status, provider_message_id, last_error, delivery_envelope FROM outbox WHERE id = ? LIMIT 1',
			[jobId],
		)
		const existingJob = existingJobRes.results?.[0]

		if (existingJob) {
			if (existingJob.status === 'sent') {
				return NextResponse.json({
					success: true,
					deliveryId: jobId,
					messageId: existingJob.provider_message_id,
					providerStatus: 'sent',
					idempotent: true,
				})
			}
			// Re-attempt delivery using the exact previously persisted envelope & Idempotency-Key
			const retryRes = await processOutbox(jobId)
			const afterRes = await d1Query<{ status: string; provider_message_id: string | null; last_error: string | null }>(
				'SELECT status, provider_message_id, last_error FROM outbox WHERE id = ? LIMIT 1',
				[jobId],
			)
			const finalRow = afterRes.results?.[0]
			if (finalRow?.status === 'sent') {
				return NextResponse.json({
					success: true,
					deliveryId: jobId,
					messageId: finalRow.provider_message_id,
					providerStatus: 'sent',
				})
			}
			return NextResponse.json(
				{
					success: false,
					deliveryId: jobId,
					providerStatus: finalRow?.status || retryRes.status || 'pending',
					error: finalRow?.last_error || 'Email delivery pending retry',
				},
				{ status: finalRow?.status === 'dead_letter' ? 422 : 502 },
			)
		}

		// Persist durable job + immutable delivery envelope BEFORE calling email provider
		const html = `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${escapeEmailHtml(cleanContent)}</div>`
		const bodyHash = createHash('sha256')
			.update(JSON.stringify({ to: cleanTo, subject: cleanSubject, html }))
			.digest('hex')
		const envelope = {
			to: cleanTo,
			from: fromEmail,
			subject: cleanSubject,
			html,
			bodyHash,
		}
		const now = new Date().toISOString()

		await d1Query(
			`INSERT INTO outbox (id, event_type, payload, status, attempts, available_at, delivery_envelope)
			VALUES (?, 'lead.email', ?, 'pending', 0, ?, ?)`,
			[
				jobId,
				JSON.stringify({
					leadId: cleanLeadId,
					actorId: session.id,
					actorName: senderName,
				}),
				now,
				JSON.stringify(envelope),
			],
		)

		// Append-only audit entry before/around send so activity history is durable
		await leadNotesDb
			.append({
				lead_id: cleanLeadId,
				author_id: session.id,
				author_name: senderName,
				content: `Queued outreach email "${cleanSubject}" to ${cleanTo} (Job: ${jobId})`,
			})
			.catch(() => {})

		const sendOutcome = await processOutbox(jobId)
		const afterRes = await d1Query<{
			status: string
			provider_message_id: string | null
			last_error: string | null
		}>(
			'SELECT status, provider_message_id, last_error FROM outbox WHERE id = ? LIMIT 1',
			[jobId],
		)
		const finalRow = afterRes.results?.[0]

		if (finalRow?.status === 'sent' || sendOutcome.status === 'sent') {
			return NextResponse.json({
				success: true,
				message: 'Email sent successfully via Resend!',
				deliveryId: jobId,
				messageId: finalRow?.provider_message_id || sendOutcome.messageId || null,
				providerStatus: 'sent',
			})
		}

		return NextResponse.json(
			{
				success: false,
				deliveryId: jobId,
				providerStatus: finalRow?.status || sendOutcome.status || 'failed',
				error: finalRow?.last_error || 'Email delivery failed and queued for retry',
			},
			{ status: 502 },
		)
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API /api/admin/leads/email error:', error)
		return NextResponse.json(
			{
				success: false,
				error: status === 503 ? 'Lead database unavailable' : error?.message || 'Failed to send email.',
			},
			{ status },
		)
	}
}
