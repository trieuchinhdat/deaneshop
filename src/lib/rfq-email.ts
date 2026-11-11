import { getEnvVarSync } from './cf-env'
import { escapeEmailHtml } from './outbox'
/**
 * Automated B2B Preliminary Quotation Dispatcher (Instant Proforma Invoice)
 * Powered by Resend REST API
 */

export interface SendPreliminaryQuoteParams {
	quoteNumber: string
	customerName: string
	customerEmail: string
	customerPhone?: string | null
	companyName?: string | null
	country?: string | null
	incoterm?: string
	portOfDestination?: string | null
	targetDeliveryDate?: string | null
	items: Array<{
		title: string
		sku?: string
		price: number
		quantity: number
		total?: number
	}>
	subtotal: number
	currency?: string
	quoteUrl: string
	scheduleUrl?: string
	brandName?: string
	supportEmail?: string
	whatsappNumber?: string
}

export async function sendPreliminaryQuoteEmail(
	params: SendPreliminaryQuoteParams,
): Promise<{ success: boolean; messageId?: string; providerStatus: string }> {
	const recipient = params.customerEmail
	params = { ...params, customerName: escapeEmailHtml(params.customerName), companyName: params.companyName ? escapeEmailHtml(params.companyName) : null, customerPhone: params.customerPhone ? escapeEmailHtml(params.customerPhone) : null, country: params.country ? escapeEmailHtml(params.country) : null, portOfDestination: params.portOfDestination ? escapeEmailHtml(params.portOfDestination) : null, targetDeliveryDate: params.targetDeliveryDate ? escapeEmailHtml(params.targetDeliveryDate) : null, items: params.items.map(item => ({ ...item, title: escapeEmailHtml(item.title), sku: item.sku ? escapeEmailHtml(item.sku) : undefined })) }
	const RESEND_API_KEY = getEnvVarSync('RESEND_API_KEY') || ''
	const brand = params.brandName || getEnvVarSync('NEXT_PUBLIC_SITE_NAME') || 'DeanFlow'
	const fromEmail =
		getEnvVarSync('RESEND_FROM_EMAIL') ||
		`${brand} B2B Export Department <export@store.com>`

	const validUntilDate = new Date()
	validUntilDate.setDate(validUntilDate.getDate() + 14)
	const validUntilStr = validUntilDate.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})

	const itemsHtml = params.items
		.map(
			(item, idx) => `
		<tr style="border-bottom: 1px solid #e2e8f0;">
			<td style="padding: 12px 8px; font-size: 13px; color: #1e293b;">
				<strong>${item.title}</strong>
				${item.sku ? `<div style="font-size: 11px; color: #64748b; font-family: monospace;">SKU: ${item.sku}</div>` : ''}
			</td>
			<td style="padding: 12px 8px; font-size: 13px; text-align: center; color: #1e293b; font-weight: 600;">
				${item.quantity.toLocaleString()}
			</td>
			<td style="padding: 12px 8px; font-size: 13px; text-align: right; color: #1e293b;">
				$${Number(item.price).toFixed(2)}
			</td>
			<td style="padding: 12px 8px; font-size: 13px; text-align: right; color: #0f172a; font-weight: 700;">
				$${Number(item.total || item.price * item.quantity).toFixed(2)}
			</td>
		</tr>
	`,
		)
		.join('')

	const scheduleBtnHtml = params.scheduleUrl
		? `
		<a href="${params.scheduleUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; margin-right: 10px; margin-bottom: 10px;">
			📅 Book 1-on-1 Specialist Consultation
		</a>
	`
		: ''

	const htmlBody = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Preliminary Quotation #${params.quoteNumber}</title>
	</head>
	<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; line-height: 1.5;">
		<div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
			
			<!-- Header -->
			<div style="background-color: #0f172a; color: #ffffff; padding: 28px 32px;">
				<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 700;">
					${brand} B2B Commercial Division
				</div>
				<h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 800; color: #ffffff;">
					Preliminary Proforma Quotation
				</h1>
				<div style="margin-top: 8px; font-size: 13px; color: #cbd5e1;">
					Ref: <strong style="color: #ffffff; font-family: monospace;">#${params.quoteNumber}</strong> • Valid until: <strong>${validUntilStr}</strong>
				</div>
			</div>

			<!-- Customer Profile -->
			<div style="padding: 24px 32px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
				<table style="width: 100%; border-collapse: collapse; font-size: 13px;">
					<tr>
						<td style="width: 50%; vertical-align: top; padding-right: 12px;">
							<div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px;">Prepared For</div>
							<div style="font-weight: 700; color: #0f172a; font-size: 14px;">${params.customerName}</div>
							${params.companyName ? `<div style="color: #334155; font-weight: 600;">${params.companyName}</div>` : ''}
							<div style="color: #64748b;">${params.customerEmail}</div>
							${params.customerPhone ? `<div style="color: #64748b;">${params.customerPhone}</div>` : ''}
						</td>
						<td style="width: 50%; vertical-align: top; padding-left: 12px;">
							<div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px;">Logistics & Trade Terms</div>
							<div style="color: #334155;"><strong>Incoterm:</strong> ${params.incoterm || 'FOB'}</div>
							<div style="color: #334155;"><strong>Destination:</strong> ${params.portOfDestination || params.country || 'International'}</div>
							${params.targetDeliveryDate ? `<div style="color: #334155;"><strong>Target Date:</strong> ${params.targetDeliveryDate}</div>` : ''}
						</td>
					</tr>
				</table>
			</div>

			<!-- Quote Items Table -->
			<div style="padding: 24px 32px;">
				<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
					<thead>
						<tr style="border-bottom: 2px solid #0f172a; text-align: left;">
							<th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Description / SKU</th>
							<th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; text-align: center;">Qty</th>
							<th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; text-align: right;">Unit Price (${params.incoterm || 'FOB'})</th>
							<th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; text-align: right;">Amount (USD)</th>
						</tr>
					</thead>
					<tbody>
						${itemsHtml}
					</tbody>
				</table>

				<!-- Total Summary -->
				<div style="text-align: right; padding-top: 12px; border-top: 2px solid #e2e8f0;">
					<div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Estimated FOB Product Subtotal:</div>
					<div style="font-size: 24px; font-weight: 900; color: #0f172a;">$${Number(params.subtotal).toFixed(2)} USD</div>
					<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">* Ocean/Air freight rates and export duties to be verified upon destination port agreement.</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
				<div style="margin-bottom: 16px;">
					<a href="${params.quoteUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; margin-right: 10px; margin-bottom: 10px;">
						📄 View Full Estimate & Print Official PDF
					</a>
					${scheduleBtnHtml}
				</div>
				<p style="font-size: 12px; color: #64748b; margin: 0;">
					Have custom OEM requirements or need samples? Reply directly to this email or contact us via WhatsApp: <strong>${params.whatsappNumber || '+84 901 234 567'}</strong>.
				</p>
			</div>

			<!-- Legal Disclaimer -->
			<div style="padding: 20px 32px; background-color: #ffffff; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
				<strong>NON-BINDING PRELIMINARY ESTIMATE NOTICE:</strong> This document is generated for commercial budgeting and planning purposes and is valid for 14 calendar days from issuance. Firm unit prices, ocean/air freight booking rates, and production schedules will be finalized in a formal Sales Contract or signed Proforma Invoice issued by ${brand}.
			</div>

		</div>
	</body>
	</html>
	`

	if (RESEND_API_KEY) {
		try {
			const res = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				signal: AbortSignal.timeout(10000),
				headers: {
					Authorization: `Bearer ${RESEND_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					from: fromEmail,
					to: [params.customerEmail.trim()],
					subject: `[Preliminary Quote] #${params.quoteNumber} - Your B2B Wholesale Estimate from ${brand}`,
					html: htmlBody,
				}),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(data.message || 'Resend API returned error')
			}
			return {
				success: true,
				messageId: data.id,
				providerStatus: 'sent_resend',
			}
		} catch (err: any) {
			console.warn('Resend auto-reply email failed, falling back to local simulation:', err)
			return {
				success: false,
				providerStatus: 'failed',
			}
		}
	}

	return {
		success: false,
		providerStatus: 'not_configured',
	}
}
