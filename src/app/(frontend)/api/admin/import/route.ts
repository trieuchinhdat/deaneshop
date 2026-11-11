import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { broadcastAdminEvent } from '@/lib/admin-events'
import {
	d1Query,
	leadNotesDb,
	leadsDb,
	orderNotesDb,
	ordersDb,
	PersistenceError,
} from '@/lib/d1'
import {
	canTransitionFulfillment,
	FULFILLMENT_STATUSES,
	normalizeEnum,
} from '@/lib/order-domain'

const FREE_EMAIL_DOMAINS = new Set([
	'gmail.com',
	'yahoo.com',
	'hotmail.com',
	'outlook.com',
	'icloud.com',
	'mail.com',
	'aol.com',
	'protonmail.com',
	'zoho.com',
])

function isCorporateEmail(email?: string): boolean {
	if (!email || !email.includes('@')) return false
	const domain = email.split('@')[1]?.toLowerCase().trim()
	return Boolean(domain && !FREE_EMAIL_DOMAINS.has(domain))
}

function normalizeLeadStatus(
	rawStatus?: string,
): 'new' | 'contacted' | 'discovery' | 'proposal' | 'won' | 'lost' | 'closed' {
	if (!rawStatus) return 'new'
	const s = rawStatus.toLowerCase().trim()
	if (s === 'contacted') return 'contacted'
	if (s === 'discovery' || s === 'qualified') return 'discovery'
	if (s === 'proposal' || s === 'negotiating') return 'proposal'
	if (s === 'won' || s === 'converted') return 'won'
	if (s === 'lost') return 'lost'
	if (s === 'closed') return 'closed'
	return 'new'
}

export async function POST(req: Request) {
	try {
		const auth = await requireAdminSession([
			'superadmin',
			'admin',
			'sales',
			'cskh',
		])
		if (!auth.ok) {
			return NextResponse.json(
				{ success: false, message: auth.error },
				{ status: auth.status },
			)
		}
		const session = auth.session

		const body = await req.json().catch(() => ({}))
		const { type, records, assignmentMode, importKey } = body as {
			type?: string
			records?: any[]
			assignmentMode?: 'self' | 'pool'
			importKey?: string
		}

		if (!type || !Array.isArray(records) || records.length === 0) {
			return NextResponse.json(
				{
					success: false,
					message:
						'Invalid payload: "type" and non-empty "records" array are required.',
				},
				{ status: 400 },
			)
		}
		if (records.length > 500) {
			return NextResponse.json(
				{
					success: false,
					message: 'Import batches are limited to 500 records per request.',
				},
				{ status: 400 },
			)
		}

		if (type === 'leads') {
			if (
				session.role !== 'superadmin' &&
				session.role !== 'admin' &&
				session.role !== 'sales'
			) {
				return NextResponse.json(
					{
						success: false,
						message:
							'Permission denied: Only Administrators and Sales representatives can import B2B leads.',
					},
					{ status: 403 },
				)
			}
		} else if (type === 'orders') {
			if (
				session.role !== 'superadmin' &&
				session.role !== 'admin' &&
				session.role !== 'cskh'
			) {
				return NextResponse.json(
					{
						success: false,
						message:
							'Permission denied: Only Administrators and Operations/CSKH staff can update order fulfillment.',
					},
					{ status: 403 },
				)
			}
		} else {
			return NextResponse.json(
				{
					success: false,
					message: `Unsupported import type "${type}". Allowed types: "leads", "orders".`,
				},
				{ status: 400 },
			)
		}

		// Idempotency / Retry Protection via import_batches (DF-021)
		const rawKey =
			(typeof importKey === 'string' && importKey.trim()) ||
			req.headers.get('Idempotency-Key')?.trim() ||
			''
		const requestHash = createHash('sha256')
			.update(
				JSON.stringify({
					type,
					records,
					assignmentMode: assignmentMode || null,
					actor: session.id,
				}),
			)
			.digest('hex')

		if (rawKey) {
			if (!/^[a-zA-Z0-9_:-]{8,128}$/.test(rawKey)) {
				return NextResponse.json(
					{ success: false, message: 'Invalid importKey format' },
					{ status: 400 },
				)
			}
			const existingBatch = await d1Query<{
				request_hash: string
				result_json: string
			}>(
				'SELECT request_hash, result_json FROM import_batches WHERE id = ? LIMIT 1',
				[rawKey],
			)
			const prev = existingBatch.results?.[0]
			if (prev) {
				if (prev.request_hash !== requestHash) {
					return NextResponse.json(
						{
							success: false,
							message:
								'Idempotency key already used for a different import batch',
						},
						{ status: 409 },
					)
				}
				return NextResponse.json({
					...JSON.parse(prev.result_json),
					idempotent: true,
				})
			}
		}

		let importedCount = 0
		const failedRecords: { row: any; reason: string }[] = []

		if (type === 'leads') {
			// Ownership policy (DF-021):
			// Sales imports are ALWAYS personal and assigned to session.id.
			// Admin/Superadmin can choose 'self' or 'pool' (round-robin active sales pool).
			if (session.role === 'sales' && assignmentMode === 'pool') {
				return NextResponse.json(
					{
						success: false,
						message:
							'Sales representatives can only import leads to their personal pipeline.',
					},
					{ status: 403 },
				)
			}
			const resolvedAssignmentMode: 'self' | 'pool' =
				session.role === 'sales'
					? 'self'
					: assignmentMode === 'self'
						? 'self'
						: 'pool'
			const forcedAssignee =
				resolvedAssignmentMode === 'self' ? session.id : null

			const seenEmails = new Set<string>()

			for (const r of records) {
				const name = (r.name || '').trim()
				const email = (r.email || '').trim().toLowerCase()
				const phone = (r.phone || '').trim()
				const company = (r.company_name || '').trim()

				if (!name && !email) {
					failedRecords.push({ row: r, reason: 'Missing Full Name and Email' })
					continue
				}
				if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
					failedRecords.push({ row: r, reason: 'Invalid Email format' })
					continue
				}
				if (email) {
					if (seenEmails.has(email)) {
						failedRecords.push({
							row: r,
							reason: 'Duplicate email within import batch',
						})
						continue
					}
					seenEmails.add(email)
				}

				try {
					const corp = isCorporateEmail(email)
					const initialScore = corp ? 75 : 60
					const now = new Date().toISOString()

					const created = await leadsDb.create({
						id: `lead_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
						name: name || email.split('@')[0],
						company_name: company || null,
						email: email || null,
						phone: phone || null,
						country: r.country ? String(r.country).trim() : null,
						budget_range: r.budget_range ? String(r.budget_range).trim() : null,
						status: normalizeLeadStatus(r.status),
						source: 'csv_bulk_import',
						message: r.notes ? String(r.notes).trim() : null,
						is_corporate_email: corp ? 1 : 0,
						ai_score: initialScore,
						assigned_to: forcedAssignee,
						internal_notes: `[${now}] CSV Import by ${session.name} (${session.email})`,
					})

					await leadNotesDb
						.append({
							lead_id: created.id,
							author_id: session.id,
							author_name: session.name,
							content: `CSV Import (${resolvedAssignmentMode === 'self' ? `assigned to ${session.name}` : 'routed to active sales pool'})`,
						})
						.catch(() => {})

					importedCount++
				} catch (err: any) {
					console.error('Lead import error for row:', r, err)
					failedRecords.push({
						row: r,
						reason: err?.message || 'Database insert error',
					})
				}
			}

			if (importedCount > 0) {
				broadcastAdminEvent('NEW_LEAD', {
					source: 'csv_bulk_import',
					count: importedCount,
					importedBy: session.name,
				})
			}

			const responsePayload = {
				success: true,
				importedCount,
				failedRecords,
				assignmentMode: resolvedAssignmentMode,
				assignedTo: forcedAssignee,
				message: `Processed ${records.length} lead rows: ${importedCount} imported (${resolvedAssignmentMode === 'self' ? 'assigned to you' : 'routed to sales pool'}), ${failedRecords.length} skipped.`,
			}

			if (rawKey) {
				await d1Query(
					'INSERT INTO import_batches (id, actor_id, import_type, request_hash, result_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
					[
						rawKey,
						session.id,
						'leads',
						requestHash,
						JSON.stringify(responsePayload),
						new Date().toISOString(),
					],
				).catch(() => {})
			}

			return NextResponse.json(responsePayload)
		}

		// Process Batch Order Fulfillment Update
		if (type === 'orders') {
			const updatedOrderNumbers: string[] = []

			for (const r of records) {
				const orderId = (r.order_id || '').trim()
				if (!orderId) {
					failedRecords.push({ row: r, reason: 'Missing Order ID' })
					continue
				}

				try {
					let existing = await ordersDb.getById(orderId)
					if (!existing) {
						existing = await ordersDb.getByOrderNumber(orderId)
					}

					if (!existing) {
						failedRecords.push({
							row: r,
							reason: `Order "${orderId}" not found in database records.`,
						})
						continue
					}

					const patch: Record<string, any> = {}

					if (r.fulfillment_status) {
						const rawStatus = String(r.fulfillment_status).toLowerCase().trim()
						const mappedStatus =
							rawStatus === 'shipped' ? 'shipping' : rawStatus
						const nextStatus = normalizeEnum(
							mappedStatus,
							FULFILLMENT_STATUSES,
							'fulfillment_status',
						)
						if (
							!canTransitionFulfillment(existing.fulfillment_status, nextStatus)
						) {
							failedRecords.push({
								row: r,
								reason: `Invalid transition from "${existing.fulfillment_status}" to "${nextStatus}"`,
							})
							continue
						}
						patch.fulfillment_status = nextStatus
					}

					const cleanCarrier = (r.carrier || '').trim()
					const cleanTracking = (r.tracking_code || '').trim()

					if (cleanCarrier && cleanTracking) {
						patch.tracking_code = `${cleanCarrier}: ${cleanTracking}`
					} else if (cleanTracking) {
						patch.tracking_code = cleanTracking
					} else if (cleanCarrier) {
						patch.tracking_code = `${cleanCarrier}: `
					}

					const updated = await ordersDb.update(existing.id, patch)
					if (!updated) {
						failedRecords.push({
							row: r,
							reason: 'Concurrent update or record missing',
						})
						continue
					}

					if (r.notes && String(r.notes).trim()) {
						await orderNotesDb
							.append({
								order_id: existing.id,
								author_id: session.id,
								author_name: session.name,
								content: `CSV Fulfillment: ${String(r.notes).trim()}`,
							})
							.catch(() => {})
					}

					importedCount++
					updatedOrderNumbers.push(existing.order_number || existing.id)
				} catch (err: any) {
					console.error('Order fulfillment update error for row:', r, err)
					failedRecords.push({
						row: r,
						reason: err?.message || 'Database update error',
					})
				}
			}

			if (importedCount > 0) {
				broadcastAdminEvent('ORDER_UPDATED', {
					orderNumbers: updatedOrderNumbers,
					source: 'csv_bulk_fulfillment',
					count: importedCount,
					updatedBy: session.name,
				})
			}

			const responsePayload = {
				success: true,
				importedCount,
				failedRecords,
				message: `Successfully processed ${records.length} order fulfillment rows: ${importedCount} updated, ${failedRecords.length} skipped.`,
			}

			if (rawKey) {
				await d1Query(
					'INSERT INTO import_batches (id, actor_id, import_type, request_hash, result_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
					[
						rawKey,
						session.id,
						'orders',
						requestHash,
						JSON.stringify(responsePayload),
						new Date().toISOString(),
					],
				).catch(() => {})
			}

			return NextResponse.json(responsePayload)
		}

		return NextResponse.json(
			{ success: false, message: 'Unhandled operation' },
			{ status: 400 },
		)
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API Admin Import Error:', error)
		return NextResponse.json(
			{
				success: false,
				message:
					status === 503
						? 'Database unavailable'
						: error.message || 'Internal server error during CSV import',
			},
			{ status },
		)
	}
}
