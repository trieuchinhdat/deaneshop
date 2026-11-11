import { resolveQuoteAccess } from '@/lib/quote-access'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ordersDb, d1Query } from '@/lib/d1'
import { client } from '@/sanity/lib/client'
import QuoteViewClient, { type QuoteData, type QuoteItem } from './quote-view-client'

type Props = {
	params: Promise<{ id: string }>
	searchParams: Promise<{ token?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params
	const cleanId = decodeURIComponent(id).trim()

	return {
		title: `Commercial Quotation #${cleanId} | Confidential Trade Proposal`,
		description: 'Confidential commercial quotation, proforma landed cost schedule, and international trade terms.',
		robots: {
			index: false,
			follow: false,
			nocache: true,
			googleBot: {
				index: false,
				follow: false,
				noimageindex: true,
			},
		},
	}
}

export default async function QuotePage({ params, searchParams }: Props) {
	const { id } = await params
	const cleanId = decodeURIComponent(id).trim()
	const { token } = await searchParams

	let d1Order = await ordersDb.getByOrderNumber(cleanId)
	if (!d1Order) {
		d1Order = await ordersDb.getById(cleanId)
	}

	if (!d1Order || !d1Order.quote_status) notFound()

	const access = await resolveQuoteAccess(d1Order.id, token)
	if (!access.authorized) notFound()

	// If buyer has an older version token that was superseded by a newer issued version:
	if (access.isSuperseded && !access.isStaff) {
		return (
			<main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
				<div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-xl border border-amber-200 text-center space-y-4">
					<span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
						Quotation Superseded
					</span>
					<h1 className="text-xl font-extrabold text-slate-900">
						Quotation #{d1Order.order_number} (v{access.tokenVersion}) Has Been Updated
					</h1>
					<p className="text-sm text-slate-600 leading-relaxed">
						A newer commercial revision (v{access.latestIssuedVersion}) has been issued for this inquiry. For accuracy and compliance, please use the latest quotation link sent to your email or contact your account representative.
					</p>
				</div>
			</main>
		)
	}

	// Fetch business branding profile from Sanity
	const siteDoc = await client
		.fetch(
			`*[_type == "site"][0]{
				title,
				siteName,
				companyName,
				address,
				email,
				hotline,
				taxCode
			}`,
		)
		.catch(() => null)

	const brandName = siteDoc?.siteName || siteDoc?.title || process.env.NEXT_PUBLIC_SITE_NAME || 'DeanFlow'
	const legalCompany = siteDoc?.companyName || `${brandName} Global Supply Corp`
	const brandAddress = siteDoc?.address || 'Industrial Manufacturing Hub, Hai Phong Port / Ho Chi Minh City, Vietnam'
	const supportEmail = siteDoc?.email || 'support@deanflow.com'
	const supportPhone = siteDoc?.hotline || '+84 901 234 567'

	// Buyer views ONLY the immutable snapshot matching their authorized token version (DF-013).
	// Staff can view the latest issued snapshot or internal draft preview when quote is in draft.
	const targetSnapshotVersion = access.tokenVersion
	let snapshotData: Record<string, any> | null = null
	let snapshotCreatedAt: string | null = null

	if (targetSnapshotVersion && targetSnapshotVersion > 0) {
		const snapRes = await d1Query<{ version: number; snapshot: string; created_at: string }>(
			'SELECT version, snapshot, created_at FROM quote_versions WHERE order_id = ? AND version = ? LIMIT 1',
			[d1Order.id, targetSnapshotVersion],
		)
		if (snapRes.results[0]?.snapshot) {
			try {
				snapshotData = JSON.parse(snapRes.results[0].snapshot)
				snapshotCreatedAt = snapRes.results[0].created_at
			} catch {
				snapshotData = null
			}
		}
	}

	if (!access.isStaff && !snapshotData) {
		notFound()
	}

	const useLiveDraft = Boolean(
		access.isStaff && (!snapshotData || d1Order.quote_status === 'draft'),
	)

	const rawItems = useLiveDraft
		? (() => {
				try {
					return JSON.parse(d1Order.items_json || '[]')
				} catch {
					return []
				}
			})()
		: Array.isArray(snapshotData?.items)
			? snapshotData!.items
			: []

	const parsedItems: QuoteItem[] = Array.isArray(rawItems)
		? rawItems.map((item: any) => ({
				id: item.id || item.productId || '',
				productId: item.productId || '',
				title: item.title || 'Product Item',
				sku: item.sku || '',
				price: Number(item.price) || 0,
				quantity: Number(item.quantity) || 1,
				total: (Number(item.price) || 0) * (Number(item.quantity) || 1),
				image: item.image || '',
			}))
		: []

	let trade: Record<string, any> = {}
	try {
		const rawTrade = useLiveDraft ? d1Order.commerce_json : snapshotData?.commerce
		trade = typeof rawTrade === 'string' ? JSON.parse(rawTrade || '{}') : rawTrade || {}
	} catch {
		trade = {}
	}

	const rawStatus = (d1Order.quote_status || 'sent').toLowerCase()
	const validUntil = useLiveDraft
		? d1Order.quote_valid_until || null
		: snapshotData?.validUntil || d1Order.quote_valid_until || null
	const isPastExpiry = validUntil ? new Date(validUntil).getTime() <= Date.now() : false

	// If staff moved an already-issued quote back to draft for v2 editing, do NOT expose draft
	// terms to buyer and indicate revision is in progress on the v1 snapshot.
	const computedStatus =
		rawStatus === 'approved'
			? 'approved'
			: rawStatus === 'cancelled'
				? 'cancelled'
				: !access.isStaff && (rawStatus === 'draft' || rawStatus === 'pending')
					? 'revision_requested'
					: isPastExpiry
						? 'expired'
						: rawStatus

	const quoteData: QuoteData = {
		version: useLiveDraft ? 0 : targetSnapshotVersion || 0,
		quoteNumber: d1Order.order_number,
		customerName: d1Order.customer_name,
		customerEmail: d1Order.customer_email,
		customerPhone: d1Order.customer_phone,
		companyName: trade.company || null,
		shippingAddress: d1Order.shipping_address,
		shippingCountry: d1Order.shipping_country,
		shippingCity: d1Order.shipping_city,
		incoterm: trade.incoterm || '',
		portOfDestination: trade.port || '',
		targetDeliveryDate: trade.targetDate || 'Pending confirmation',
		paymentTerms:
			(useLiveDraft ? d1Order.payment_terms : snapshotData?.paymentTerms) ||
			'T/T 30% advance, 70% before shipment',
		quoteStatus: computedStatus,
		quoteApprovedAt: d1Order.quote_approved_at || null,
		quoteApprovedBy: d1Order.quote_approved_by || null,
		quoteValidUntil: validUntil,
		taxId: trade.taxId || null,
		customerNote: d1Order.customer_note || '',
		items: parsedItems,
		subtotal: Number(useLiveDraft ? d1Order.subtotal : snapshotData?.subtotal) || 0,
		shippingFee: Number(useLiveDraft ? d1Order.shipping_fee : snapshotData?.shipping) || 0,
		discount: Number(useLiveDraft ? d1Order.discount : snapshotData?.discount) || 0,
		total: Number(useLiveDraft ? d1Order.total : snapshotData?.total) || 0,
		currency: (useLiveDraft ? d1Order.currency : snapshotData?.currency) || 'USD',
		createdAt: snapshotCreatedAt || d1Order.created_at || new Date().toISOString(),
		isExpired: isPastExpiry && rawStatus !== 'approved',
		isDraftPreview: useLiveDraft && rawStatus === 'draft',
	}

	return (
		<QuoteViewClient
			quote={quoteData}
			brandName={brandName}
			legalCompany={legalCompany}
			brandAddress={brandAddress}
			supportEmail={supportEmail}
			supportPhone={supportPhone}
		/>
	)
}
