/**
 * Real-time Dispatcher for Lead & Order Alerts
 * Supports:
 * 1. Telegram Bot (TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID)
 * 2. Generic HTTP Webhooks (Slack, Discord, Zapier, Make, Google Sheets)
 */

import { getEnvVarSync } from './cf-env'

interface LeadNotificationPayload {
	id: string
	name: string
	email?: string | null
	phone?: string | null
	company_name?: string | null
	country?: string | null
	ip_country?: string | null
	budget_range?: string | null
	message?: string | null
	source?: string
	ai_score?: number
	utm_source?: string | null
	landing_page_url?: string | null
}

interface OrderNotificationPayload {
	id: string
	order_number: string
	customer_name: string
	customer_email: string
	customer_phone?: string | null
	shipping_address: string
	shipping_country: string
	total: number
	currency: string
	items_json: string
	webhook_url?: string | null
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
	const token = getEnvVarSync('TELEGRAM_BOT_TOKEN')
	const chatId = getEnvVarSync('TELEGRAM_CHAT_ID')

	if (!token || !chatId) return false

	try {
		const res = await fetch(
			`https://api.telegram.org/bot${token}/sendMessage`,
			{
				method: 'POST',
				signal: AbortSignal.timeout(10000),
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: chatId,
					text,
					parse_mode: 'HTML',
					disable_web_page_preview: true,
				}),
			},
		)
		return res.ok
	} catch (err) {
		console.error('Telegram notification dispatch error:', err)
		return false
	}
}

export async function sendWebhook(
	url: string,
	payload: Record<string, any>,
): Promise<boolean> {
	if (!url || !url.trim()) return false

	try {
		const res = await fetch(url.trim(), {
			method: 'POST',
				signal: AbortSignal.timeout(10000),
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		})
		return res.ok
	} catch (err) {
		console.error('Webhook notification dispatch error:', err)
		return false
	}
}

export async function notifyNewLead(
	lead: LeadNotificationPayload,
): Promise<void> {
	// 1. Telegram Alert
	const location =
		[lead.country, lead.ip_country].filter(Boolean).join(' / ') || 'Global'
	const scoreText =
		lead.ai_score !== undefined ? `${lead.ai_score}/100` : 'Evaluating'

	const tgMessage = [
		`🎯 <b>NEW B2B LEAD CAPTURED</b>`,
		`━━━━━━━━━━━━━━━━━━━━━━`,
		`👤 <b>Name:</b> ${lead.name || 'Prospect'}`,
		lead.company_name ? `🏢 <b>Company:</b> ${lead.company_name}` : null,
		lead.email ? `✉️ <b>Email:</b> ${lead.email}` : null,
		lead.phone ? `📞 <b>Phone:</b> ${lead.phone}` : null,
		`📍 <b>Location:</b> ${location}`,
		lead.budget_range ? `💰 <b>Budget:</b> ${lead.budget_range}` : null,
		`⚡ <b>AI Score:</b> ${scoreText}`,
		lead.source
			? `🔗 <b>Source:</b> ${lead.source}${lead.utm_source ? ` (${lead.utm_source})` : ''}`
			: null,
		lead.message ? `💬 <b>Requirement:</b> <i>${lead.message}</i>` : null,
		`━━━━━━━━━━━━━━━━━━━━━━`,
		`⏱️ <i>${new Date().toISOString()}</i>`,
	]
		.filter(Boolean)
		.join('\n')

	await sendTelegramMessage(tgMessage).catch(() => {})

	// 2. Generic Webhook (LEAD_WEBHOOK_URL or NOTIFICATION_WEBHOOK_URL)
	const webhookUrl =
		getEnvVarSync('LEAD_WEBHOOK_URL') || getEnvVarSync('NOTIFICATION_WEBHOOK_URL')
	if (webhookUrl) {
		await sendWebhook(webhookUrl, {
			event: 'lead.created',
			timestamp: new Date().toISOString(),
			data: lead,
		}).catch(() => {})
	}

	// 3. Structured CRM Webhook (HubSpot, Klaviyo, Zapier, Make)
	const crmWebhookUrl =
		getEnvVarSync('CRM_WEBHOOK_URL') ||
		getEnvVarSync('HUBSPOT_WEBHOOK_URL') ||
		getEnvVarSync('KLAVIYO_WEBHOOK_URL')
	if (crmWebhookUrl) {
		await sendWebhook(crmWebhookUrl, {
			event:
				lead.source === 'compliance_vault_gated'
					? 'lead.compliance_unlocked'
					: 'lead.created',
			timestamp: new Date().toISOString(),
			contact: {
				email: lead.email,
				name: lead.name,
				phone: lead.phone,
				company: lead.company_name,
				country: lead.country || lead.ip_country,
			},
			qualification: {
				ai_score: lead.ai_score,
				source: lead.source,
			},
			attribution: {
				utm_source: lead.utm_source,
				landing_page_url: lead.landing_page_url,
			},
			raw: lead,
		}).catch(() => {})
	}
}

export async function notifyNewOrder(
	order: OrderNotificationPayload,
): Promise<void> {
	// Parse items
	let itemsList: string = ''
	try {
		const items = JSON.parse(order.items_json || '[]')
		itemsList = items
			.map(
				(it: any) =>
					`• ${it.quantity}x ${it.title} ($${Number(it.price || 0).toFixed(2)})`,
			)
			.join('\n')
	} catch {
		itemsList = order.items_json
	}

	// 1. Telegram Alert
	const tgMessage = [
		`🛒 <b>NEW ORDER #${order.order_number}</b>`,
		`━━━━━━━━━━━━━━━━━━━━━━`,
		`👤 <b>Customer:</b> ${order.customer_name}`,
		order.customer_email ? `✉️ <b>Email:</b> ${order.customer_email}` : null,
		order.customer_phone ? `📞 <b>Phone:</b> ${order.customer_phone}` : null,
		`🚚 <b>Ship to:</b> ${order.shipping_address}, ${order.shipping_country}`,
		`💵 <b>Total:</b> $${Number(order.total).toFixed(2)} ${order.currency || 'USD'}`,
		`━━━━━━━━━━━━━━━━━━━━━━`,
		`📋 <b>Items:</b>\n${itemsList || 'No item details'}`,
		`━━━━━━━━━━━━━━━━━━━━━━`,
		`⏱️ <i>${new Date().toISOString()}</i>`,
	]
		.filter(Boolean)
		.join('\n')

	await sendTelegramMessage(tgMessage).catch(() => {})

	// 2. Custom Webhook from settings or env
	const webhookUrl =
		getEnvVarSync('ORDER_WEBHOOK_URL') ||
		getEnvVarSync('NOTIFICATION_WEBHOOK_URL')

	if (webhookUrl) {
		await sendWebhook(webhookUrl, {
			event: 'order.created',
			timestamp: new Date().toISOString(),
			data: order,
		}).catch(() => {})
	}
}
