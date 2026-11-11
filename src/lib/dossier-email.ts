/**
 * Compliance & Technical Dossier Email Builder & Dispatcher
 * Dispatches dossier request acknowledgments and server-resolved PDF asset links.
 * Powered by Resend REST API with strict HTML escaping and truthful statuses.
 */

import { getEnvVarSync } from './cf-env'

function escapeHtml(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(c) =>
			({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
				c
			]!,
	)
}

export interface SendComplianceDossierParams {
	customerName: string
	customerEmail: string
	companyName?: string | null
	documentTitle: string
	documentCategory?: string | null
	fileSize?: string | null
	downloadUrl?: string | null
	brandName?: string
	supportEmail?: string
	idempotencyKey?: string
}

export function buildComplianceDossierEmailContent(
	params: SendComplianceDossierParams,
): {
	subject: string
	html: string
} {
	const brandRaw =
		params.brandName || getEnvVarSync('NEXT_PUBLIC_SITE_NAME') || 'DeanFlow'
	const brand = escapeHtml(brandRaw)
	const safeName = escapeHtml(params.customerName || 'Procurement Executive')
	const safeCompany = params.companyName ? escapeHtml(params.companyName) : null
	const safeTitle = escapeHtml(params.documentTitle || 'Technical Dossier')
	const safeFileSize = escapeHtml(params.fileSize || 'PDF Asset')

	const categoryMap: Record<string, string> = {
		audit: 'Factory Audit & Social Compliance',
		specs: 'Technical Data Sheet (TDS/MSDS)',
		catalog: 'Wholesale Catalog & Volume Price Deck',
		test: 'Food-Contact Migration & Lab Test',
		esg: 'Environmental & Sustainability Report',
	}

	const categoryLabel = escapeHtml(
		params.documentCategory
			? categoryMap[params.documentCategory] || params.documentCategory
			: 'Technical Documentation',
	)

	let safeDownloadUrl = ''
	if (params.downloadUrl && params.downloadUrl !== '#') {
		try {
			const parsed = new URL(params.downloadUrl)
			if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
				safeDownloadUrl = escapeHtml(parsed.toString())
			}
		} catch {
			safeDownloadUrl = ''
		}
	}

	const downloadBtnHtml = safeDownloadUrl
		? `
		<div style="margin: 28px 0; text-align: center;">
			<a href="${safeDownloadUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;">
				Download Requested Document
			</a>
		</div>
	`
		: `
		<div style="margin: 24px 0; padding: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; color: #166534; font-size: 13px; line-height: 1.5;">
			<strong>Request Under Review:</strong> Our export compliance team has received your request. A designated account officer will follow up with the requested documentation after review.
		</div>
	`

	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Dossier Request Received: ${safeTitle}</title>
	</head>
	<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 32px 16px; color: #1e293b; line-height: 1.5;">
		<div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);">
			<div style="background-color: #090d16; color: #ffffff; padding: 32px; border-bottom: 2px solid #10b981;">
				<div style="display: inline-block; padding: 4px 10px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 9999px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #34d399; font-weight: 700; margin-bottom: 12px;">
					Compliance Vault Request
				</div>
				<h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3;">
					Technical Dossier Request Received
				</h1>
				<div style="margin-top: 8px; font-size: 13px; color: #94a3b8;">
					Requested by: <strong>${safeName}</strong> ${safeCompany ? `(${safeCompany})` : ''}
				</div>
			</div>

			<div style="padding: 32px;">
				<p style="margin-top: 0; font-size: 14px; color: #334155; line-height: 1.6;">
					Dear <strong>${safeName}</strong>,
				</p>
				<p style="font-size: 14px; color: #334155; line-height: 1.6;">
					Thank you for your request. We have received your inquiry for the technical and compliance record listed below.
				</p>

				<div style="margin: 24px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
					<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 6px;">
						Requested Asset
					</div>
					<div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
						${safeTitle}
					</div>
					<div style="font-size: 12px; color: #475569;">
						Category: <strong>${categoryLabel}</strong> • Format: <strong>${safeFileSize}</strong>
					</div>
				</div>

				${downloadBtnHtml}

				<div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-left: 3px solid #059669; border-radius: 4px; font-size: 12px; color: #475569; line-height: 1.5;">
					<strong>Documentation Notice:</strong> Specific batch test reports, scopes, and validity periods are provided per published specification and reviewed by our export operations team upon request.
				</div>

				<div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
					<p style="margin: 0; font-weight: 600; color: #0f172a;">
						Reply directly to this email to connect with our technical export team.
					</p>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 20px 32px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
				<div style="font-weight: 700; color: #334155; margin-bottom: 4px;">
					${brand} Commercial Operations
				</div>
			</div>
		</div>
	</body>
	</html>
	`

	return {
		subject: `[Dossier Request Received] ${params.documentTitle} - ${brandRaw}`,
		html,
	}
}

export async function sendComplianceDossierEmail(
	params: SendComplianceDossierParams,
): Promise<{
	success: boolean
	messageId?: string
	providerStatus: 'sent' | 'failed' | 'simulated'
}> {
	const RESEND_API_KEY = getEnvVarSync('RESEND_API_KEY') || ''
	const fromEmail =
		getEnvVarSync('RESEND_FROM_EMAIL') ||
		`${params.brandName || getEnvVarSync('NEXT_PUBLIC_SITE_NAME') || 'DeanFlow'} Compliance Team <compliance@store.com>`

	if (!RESEND_API_KEY) {
		return {
			success: false,
			providerStatus: 'simulated',
		}
	}

	const { subject, html } = buildComplianceDossierEmailContent(params)

	try {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${RESEND_API_KEY}`,
			'Content-Type': 'application/json',
		}
		if (params.idempotencyKey) {
			headers['Idempotency-Key'] = params.idempotencyKey
		}

		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			signal: AbortSignal.timeout(10000),
			headers,
			body: JSON.stringify({
				from: fromEmail,
				to: [params.customerEmail.trim()],
				subject,
				html,
			}),
		})

		const data = await res.json().catch(() => ({}))
		if (!res.ok) {
			throw new Error(
				(data as any)?.message || `Resend API error (${res.status})`,
			)
		}
		return {
			success: true,
			messageId: (data as any).id,
			providerStatus: 'sent',
		}
	} catch (err: any) {
		console.warn('Resend dossier email dispatch failed:', err?.message)
		return {
			success: false,
			providerStatus: 'failed',
		}
	}
}
