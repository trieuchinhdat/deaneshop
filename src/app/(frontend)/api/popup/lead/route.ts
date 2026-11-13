import { NextResponse } from 'next/server'
import { broadcastAdminEvent } from '@/lib/admin-events'
import { CommerceError, textField } from '@/lib/commerce'
import { leadsDb, PersistenceError } from '@/lib/d1'
import {
	calculateLeadScore,
	generateLeadSummaryAndPitch,
} from '@/lib/lead-scoring'
import { takeRateLimit } from '@/lib/rate-limit'
import {
	resolveRequestTrackingContext,
	trackServerConversion,
} from '@/lib/request-tracking'

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

		const tracking = resolveRequestTrackingContext(req, body, {
			formSource: cleanSource,
			policyVersion: '2026-11-11',
			strictJourney: false,
		})
		const resolvedName =
			cleanName || (cleanEmail ? cleanEmail.split('@')[0] : 'Subscriber')
		const leadMessage = couponGiven ? `Coupon claimed: ${couponGiven}` : null
		const scoreResult = calculateLeadScore({
			name: resolvedName,
			email: cleanEmail || null,
			phone: cleanPhone || null,
			message: leadMessage,
			source: cleanSource,
		})
		const { summary: aiSummary, pitchDraft: aiPitchDraft } =
			generateLeadSummaryAndPitch(
				{
					name: resolvedName,
					email: cleanEmail || null,
					message: leadMessage,
					source: cleanSource,
					country: tracking.cfCountry,
				},
				process.env.NEXT_PUBLIC_SITE_NAME || 'Enterprise',
			)

		// 1. Insert into Cloudflare D1 (Primary fast edge storage)
		const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
		const d1Lead = await leadsDb.create({
			id: leadId,
			name: resolvedName,
			email: cleanEmail || null,
			phone: cleanPhone || null,
			country: tracking.cfCountry,
			ip_country: tracking.cfCountry,
			ip_city: tracking.cfCity,
			source: cleanSource,
			landing_page_url: tracking.landingPageUrl,
			message: leadMessage,
			is_corporate_email: scoreResult.isCorporate ? 1 : 0,
			ai_score: scoreResult.score,
			ai_summary: aiSummary,
			ai_pitch_draft: aiPitchDraft,
			journey_json: tracking.journeyJson,
			utm_source: tracking.utmSource,
			utm_medium: tracking.utmMedium,
			utm_campaign: tracking.utmCampaign,
			utm_term: tracking.utmTerm,
			utm_content: tracking.utmContent,
			click_id: tracking.clickId,
			attribution_json: tracking.attributionJson,
			consent_json: tracking.consentJson,
			enqueue_notify: 1,
			status: 'new',
		})

		broadcastAdminEvent('NEW_LEAD', {
			id: d1Lead.id,
			name: d1Lead.name,
			email: d1Lead.email,
		})

		await trackServerConversion(tracking, {
			placement: cleanSource,
			label: cleanSource,
		})

		// Delivery is handled by the scheduled outbox processor after the durable commit.

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
