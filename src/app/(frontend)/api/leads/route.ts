import { NextResponse } from 'next/server'
import { broadcastAdminEvent } from '@/lib/admin-events'
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
import { takeRateLimit } from '@/lib/rate-limit'
import {
	resolveRequestTrackingContext,
	trackServerConversion,
} from '@/lib/request-tracking'
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
			message,
			internal_notes,
		} = body

		const rawSource = (source || (req.headers.get('referer') ? 'web_referral' : 'landing_page')).trim()
		const tracking = resolveRequestTrackingContext(req, body, {
			formSource: rawSource,
			policyVersion: '2026-11-10',
			strictJourney: true,
		})

		const cleanName = (name || '').trim()
		const cleanEmail = (email || '').trim()
		const cleanPhone = (phone || '').trim()
		const cleanCountry = (country || tracking.cfCountry || '').trim()
		const cleanCompany = (company_name || companyName || '').trim()
		const cleanCompanySize = (company_size || companySize || '').trim()
		const cleanBudget = (budget_range || budgetRange || '').trim()
		const cleanSource = rawSource
		const cleanUrl = tracking.landingPageUrl || ''
		const cleanMessage = (message || '').trim()
		const finalUtmSource = tracking.utmSource
		const finalUtmMedium = tracking.utmMedium
		const finalUtmCampaign = tracking.utmCampaign
		const finalUtmTerm = tracking.utmTerm
		const finalUtmContent = tracking.utmContent
		const finalClickId = tracking.clickId
		const cleanNotes = (internal_notes || '').trim()
		const cleanJourney = tracking.journeyJson

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
				attribution_json: tracking.attributionJson,
				consent_json: tracking.consentJson,
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
				ip_country: tracking.cfCountry,
				ip_city: tracking.cfCity,
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

		await trackServerConversion(tracking, {
			placement: cleanSource,
			label: resolvedAsset ? resolvedAsset.title : cleanSource,
		})

		// Delivery is handled by the scheduled outbox processor after the durable commit.

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
