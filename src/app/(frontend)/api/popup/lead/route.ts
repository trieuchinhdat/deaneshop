import { NextResponse } from 'next/server'
import { broadcastAdminEvent } from '@/lib/admin-events'
import { parseAttributionCookie } from '@/lib/attribution'
import { scheduleBackgroundTask } from '@/lib/cf-env'
import { CommerceError, textField } from '@/lib/commerce'
import { leadsDb, PersistenceError } from '@/lib/d1'
import { drainOutbox } from '@/lib/outbox'
import { takeRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}))
		if (!body || typeof body !== 'object' || Array.isArray(body)) {
			return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
		}

		const cleanPhone = textField(body.phone, 'phone', false, 40)
		const cleanEmail = textField(body.email, 'email', false, 254)
		const cleanName = textField(body.name, 'name', false, 200)
		const couponGiven = textField(body.couponGiven, 'couponGiven', false, 100)
		const pageUrl = textField(body.pageUrl, 'pageUrl', false, 500)
		const source = textField(body.source, 'source', false, 100)

		if (!cleanEmail && !cleanPhone) {
			return NextResponse.json(
				{ error: 'Please provide an email or phone number to proceed.' },
				{ status: 400 },
			)
		}
		if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
			return NextResponse.json(
				{ error: 'Invalid email address.' },
				{ status: 400 },
			)
		}

		if (
			!(await takeRateLimit('popup_lead', cleanEmail || cleanPhone, 10, 3600))
		) {
			return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
		}

		// Normalize source code (newsletter | popup)
		const cleanSource =
			source === 'newsletter' || source.toLowerCase().includes('newsletter')
				? 'newsletter'
				: 'popup'

		const cookieAttr = parseAttributionCookie(req.headers.get('cookie'))
		const cfCountry = req.headers.get('cf-ipcountry') || null
		const cfCity = req.headers.get('cf-ipcity') || null

		// 1. Insert into Cloudflare D1 (Primary fast edge storage)
		const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
		const d1Lead = await leadsDb.create({
			id: leadId,
			name: cleanName || (cleanEmail ? cleanEmail.split('@')[0] : 'Subscriber'),
			email: cleanEmail || null,
			phone: cleanPhone || null,
			country: cfCountry,
			ip_country: cfCountry,
			ip_city: cfCity,
			source: cleanSource,
			landing_page_url: pageUrl || null,
			message: couponGiven ? `Coupon claimed: ${couponGiven}` : null,
			utm_source: cookieAttr?.utm_source || null,
			utm_medium: cookieAttr?.utm_medium || null,
			utm_campaign: cookieAttr?.utm_campaign || null,
			utm_term: cookieAttr?.utm_term || null,
			utm_content: cookieAttr?.utm_content || null,
			click_id: cookieAttr?.click_id || null,
			attribution_json: JSON.stringify(cookieAttr || {}),
			consent_json: JSON.stringify({
				marketing: body.consent === true,
				capturedAt: new Date().toISOString(),
				policyVersion: '2026-11-11',
				form: cleanSource,
				consentText: textField(body.consentText, 'consentText', false, 2000),
			}),
			enqueue_notify: 1,
			status: 'new',
		})

		broadcastAdminEvent('NEW_LEAD', {
			id: d1Lead.id,
			name: d1Lead.name,
			email: d1Lead.email,
		})

		scheduleBackgroundTask(() => drainOutbox(5))

		return NextResponse.json({
			success: true,
			message: 'Subscribed successfully!',
			leadId: d1Lead.id,
		})
	} catch (error: any) {
		if (error instanceof CommerceError) {
			return NextResponse.json({ error: error.message }, { status: 400 })
		}
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('Error saving lead:', error)
		return NextResponse.json(
			{
				error:
					status === 503
						? 'Lead storage unavailable. Please try again.'
						: error?.message ||
							'An error occurred while saving information. Please try again.',
			},
			{ status },
		)
	}
}
