import { NextResponse } from 'next/server'
import { broadcastAdminEvent } from '@/lib/admin-events'
import { parseAttributionCookie } from '@/lib/attribution'
import { scheduleBackgroundTask } from '@/lib/cf-env'
import { CommerceError, textField } from '@/lib/commerce'
import { lookupPublishedComplianceAsset } from '@/lib/compliance-assets'
import { d1Query, leadsDb } from '@/lib/d1'
import {
	calculateLeadScore,
	generateLeadSummaryAndPitch,
} from '@/lib/lead-scoring'
import {
	LeadSubmissionConflict,
	leadSubmissionIdentity,
	replayLeadSubmission,
} from '@/lib/lead-submission-store'
import { drainOutbox } from '@/lib/outbox'
import { takeRateLimit } from '@/lib/rate-limit'
import { client } from '@/sanity/lib/client'

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}))
		if (!body || typeof body !== 'object' || Array.isArray(body))
			throw new CommerceError('Invalid payload')
		for (const key of [
			'name',
			'email',
			'phone',
			'country',
			'company_name',
			'companyName',
			'company_size',
			'companySize',
			'budget_range',
			'budgetRange',
			'source',
			'landing_page_url',
			'landingPageUrl',
			'message',
			'utm_source',
			'utm_medium',
			'utm_campaign',
			'utmSource',
			'utmMedium',
			'utmCampaign',
			'utm_term',
			'utm_content',
			'click_id',
			'assetId',
			'asset_id',
		]) {
			if (body[key] != null)
				body[key] = textField(
					body[key],
					key,
					false,
					key === 'message' ? 4000 : 500,
				)
		}
		if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
			throw new CommerceError('Invalid email')
		if (!body.email && !body.phone)
			throw new CommerceError('Contact details required')
		const identity = leadSubmissionIdentity(req, body)
		const previous = await replayLeadSubmission(identity)
		if (previous) return NextResponse.json(previous)

		const clientIp = (
			req.headers.get('cf-connecting-ip') ||
			req.headers.get('x-forwarded-for') ||
			''
		)
			.split(',')[0]
			.trim()
		const rateQuery = typeof d1Query === 'function' ? d1Query : undefined
		if (
			clientIp &&
			rateQuery &&
			!(await takeRateLimit('lead-ip', clientIp, 30, 3600, rateQuery))
		) {
			return NextResponse.json(
				{ success: false, error: 'Too many requests' },
				{ status: 429 },
			)
		}
		if (
			rateQuery &&
			!(await takeRateLimit(
				'lead',
				body.email || body.phone,
				10,
				3600,
				rateQuery,
			))
		) {
			return NextResponse.json(
				{ success: false, error: 'Too many requests for this contact' },
				{ status: 429 },
			)
		}
		delete body.assigned_to
		delete body.internal_notes
		// Never trust client-supplied asset_url / asset_title for email dispatch (DF-024)
		delete body.asset_url
		delete body.asset_title
		delete body.asset_category
		delete body.asset_size

		const {
			name,
			email,
			phone,
			country,
			company_name,
			companyName,
			company_size,
			companySize,
			budget_range,
			budgetRange,
			source,
			landing_page_url,
			landingPageUrl,
			message,
			journey_json,
			journeyJson,
			utm_source,
			utm_medium,
			utm_campaign,
			utmSource,
			utmMedium,
			utmCampaign,
			internal_notes,
		} = body

		const cfCountry = req.headers.get('cf-ipcountry') || null
		const cfCity = req.headers.get('cf-ipcity') || null
		const referer = req.headers.get('referer') || null

		const cleanName = (name || '').trim()
		const cleanEmail = (email || '').trim()
		const cleanPhone = (phone || '').trim()
		const cleanCountry = (country || cfCountry || '').trim()
		const cleanCompany = (company_name || companyName || '').trim()
		const cleanCompanySize = (company_size || companySize || '').trim()
		const cleanBudget = (budget_range || budgetRange || '').trim()
		const cleanSource = (
			source || (referer ? 'web_referral' : 'landing_page')
		).trim()
		const cleanUrl = (
			landing_page_url ||
			landingPageUrl ||
			referer ||
			''
		).trim()
		const cleanMessage = (message || '').trim()
		const rawUtmSource = (utm_source || utmSource || '').trim()
		const rawUtmMedium = (utm_medium || utmMedium || '').trim()
		const rawUtmCampaign = (utm_campaign || utmCampaign || '').trim()
		const cookieAttr = parseAttributionCookie(req.headers.get('cookie'))
		const finalUtmSource = rawUtmSource || cookieAttr?.utm_source || null
		const finalUtmMedium = rawUtmMedium || cookieAttr?.utm_medium || null
		const finalUtmCampaign = rawUtmCampaign || cookieAttr?.utm_campaign || null
		const finalUtmTerm =
			(body.utm_term || cookieAttr?.utm_term || '').trim() || null
		const finalUtmContent =
			(body.utm_content || cookieAttr?.utm_content || '').trim() || null
		const finalClickId =
			(body.click_id || cookieAttr?.click_id || '').trim() || null
		const cleanNotes = (internal_notes || '').trim()
		const rawJourney = journey_json || journeyJson || []
		const journey =
			typeof rawJourney === 'string' ? JSON.parse(rawJourney) : rawJourney
		if (!Array.isArray(journey) || journey.length > 40)
			throw new CommerceError('Invalid journey')
		if (
			journey.some(
				(step) =>
					!step ||
					typeof step !== 'object' ||
					typeof step.path !== 'string' ||
					!step.path.startsWith('/') ||
					typeof step.timestamp !== 'string' ||
					!Number.isFinite(Date.parse(step.timestamp)),
			)
		)
			throw new CommerceError('Invalid journey entry')
		const cleanJourney = JSON.stringify(
			journey.map((step) => ({
				path: textField(step.path, 'journey path', true, 2000).split('?')[0],
				title: textField(step.title, 'journey title', false, 200),
				timestamp: textField(step.timestamp, 'journey timestamp', true, 40),
				event: [
					'page_view',
					'form_start',
					'cta_click',
					'contact_click',
					'catalog_download',
				].includes(step.event)
					? step.event
					: 'page_view',
			})),
		)

		if (!cleanName && !cleanEmail && !cleanPhone) {
			return NextResponse.json(
				{
					success: false,
					error: 'Please provide a name, email address, or phone number.',
				},
				{ status: 400 },
			)
		}

		// Resolve compliance asset strictly server-side from published Sanity documents (DF-024)
		const requestedAssetId = (body.assetId || body.asset_id || '').trim()
		let resolvedAsset: Awaited<
			ReturnType<typeof lookupPublishedComplianceAsset>
		> = null
		if (cleanSource === 'compliance_vault_gated') {
			if (!requestedAssetId) {
				throw new CommerceError('A valid compliance assetId is required')
			}
			resolvedAsset = await lookupPublishedComplianceAsset(requestedAssetId)
			if (!resolvedAsset?.downloadUrl) {
				throw new CommerceError('Requested compliance asset is not available')
			}
		}

		const siteDoc = await client
			.fetch(`*[_type == "site"][0]{ siteName, title }`)
			.catch(() => null)
		const brandName =
			siteDoc?.siteName ||
			siteDoc?.title ||
			process.env.NEXT_PUBLIC_SITE_NAME ||
			'Enterprise'

		const scoreResult = calculateLeadScore({
			name: cleanName,
			email: cleanEmail,
			phone: cleanPhone,
			company_name: cleanCompany,
			budget_range: cleanBudget,
			message: cleanMessage,
			source: cleanSource,
		})

		const { summary: aiSummary, pitchDraft: aiPitchDraft } =
			generateLeadSummaryAndPitch(
				{
					name: cleanName,
					email: cleanEmail,
					company_name: cleanCompany,
					budget_range: cleanBudget,
					message: cleanMessage,
					source: cleanSource,
					country: cleanCountry,
				},
				brandName,
			)

		const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
		const submissionResult = {
			success: true,
			message: 'Thank you! Your information has been received successfully.',
			leadId,
			score: scoreResult.score,
			tier: scoreResult.tier,
			...(resolvedAsset
				? { downloadUrl: resolvedAsset.downloadUrl, dossierStatus: 'queued' }
				: {}),
		}
		let lead
		try {
			lead = await leadsDb.create({
				id: leadId,
				submission_key: identity?.key,
				submission_hash: identity?.hash,
				submission_result: identity ? JSON.stringify(submissionResult) : null,
				dossier_payload: resolvedAsset
					? JSON.stringify({
							downloadUrl: resolvedAsset.downloadUrl,
							documentTitle: resolvedAsset.title,
							documentCategory: resolvedAsset.category,
							fileSize: resolvedAsset.fileSize,
							brandName,
						})
					: null,
				attribution_json: JSON.stringify(cookieAttr || {}),
				consent_json: JSON.stringify({
					marketing: body.consent === true,
					dossierCommunication:
						body.dossierConsent === true ||
						(cleanSource === 'compliance_vault_gated' && body.consent === true),
					policyVersion: '2026-11-10',
					capturedAt: new Date().toISOString(),
				}),
				name: cleanName || 'Prospect',
				email: cleanEmail || null,
				phone: cleanPhone || null,
				country: cleanCountry || null,
				company_name: cleanCompany || null,
				company_size: cleanCompanySize || null,
				budget_range: cleanBudget || null,
				source: cleanSource,
				landing_page_url: cleanUrl || null,
				message: cleanMessage || null,
				status: 'new',
				is_corporate_email: scoreResult.isCorporate ? 1 : 0,
				ai_score: scoreResult.score,
				ai_summary: aiSummary,
				ai_pitch_draft: aiPitchDraft,
				journey_json: cleanJourney,
				ip_country: cfCountry,
				ip_city: cfCity,
				assigned_to: null,
				last_contacted_at: null,
				utm_source: finalUtmSource,
				utm_medium: finalUtmMedium,
				utm_campaign: finalUtmCampaign,
				utm_term: finalUtmTerm,
				utm_content: finalUtmContent,
				click_id: finalClickId,
				internal_notes: cleanNotes || null,
				enqueue_notify: 1,
				dossier_asset_id: resolvedAsset?.assetId || null,
			})
		} catch (error) {
			// A concurrent retry may have committed the same unique submission key.
			const replay = await replayLeadSubmission(identity)
			if (replay) return NextResponse.json(replay)
			throw error
		}

		broadcastAdminEvent('NEW_LEAD', {
			id: lead.id,
			name: lead.name,
			email: lead.email,
			company_name: lead.company_name,
		})

		// Durable background drain; if interrupted, Cloudflare Cron recovers from outbox (DF-029)
		scheduleBackgroundTask(() => drainOutbox(5))

		return NextResponse.json(submissionResult)
	} catch (error: any) {
		console.error('API /api/leads error:', error)
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof CommerceError || error instanceof SyntaxError
						? error.message
						: 'Lead capture unavailable',
			},
			{
				status:
					error instanceof LeadSubmissionConflict
						? 409
						: error instanceof CommerceError || error instanceof SyntaxError
							? 400
							: 503,
			},
		)
	}
}

export { GET } from '../admin/leads/route'
