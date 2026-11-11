'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
	HiOutlineArrowLeft,
	HiOutlineCalendar,
	HiOutlineChatBubbleLeftRight,
	HiOutlineCheckBadge,
	HiOutlineClock,
	HiOutlineDocumentCheck,
	HiOutlineEllipsisHorizontal,
	HiOutlineExclamationTriangle,
	HiOutlineInformationCircle,
	HiOutlinePencilSquare,
	HiOutlinePhone,
	HiOutlinePrinter,
	HiOutlineShieldCheck,
	HiOutlineXMark,
} from 'react-icons/hi2'
import { formatPrice } from '@/lib/utils'

export type QuoteItem = {
	id?: string
	productId?: string
	title: string
	sku?: string
	price: number
	quantity: number
	total?: number
	image?: string
}

export type QuoteRevisionItem = {
	timestamp: string
	customerName?: string
	customerEmail?: string
	requestedChanges: string
	status?: string
}

export type QuoteData = {
	version?: number
	quoteNumber: string
	customerName: string
	customerEmail: string
	customerPhone?: string | null
	companyName?: string | null
	shippingAddress?: string | null
	shippingCountry?: string | null
	shippingCity?: string | null
	incoterm?: string
	portOfDestination?: string | null
	targetDeliveryDate?: string | null
	paymentTerms?: string | null
	quoteStatus?: string | null
	quoteApprovedAt?: string | null
	quoteApprovedBy?: string | null
	quoteApprovedTitle?: string | null
	quotePoNumber?: string | null
	quoteValidUntil?: string | null
	taxId?: string | null
	taxRate?: number | null
	taxAmount?: number | null
	customerNote?: string | null
	revisionHistory?: QuoteRevisionItem[]
	items: QuoteItem[]
	subtotal: number
	shippingFee?: number
	discount?: number
	total: number
	currency: string
	createdAt: string
	isExpired?: boolean
	isDraftPreview?: boolean
}

type Props = {
	quote: QuoteData
	brandName?: string
	legalCompany?: string
	brandAddress?: string
	supportEmail?: string
	supportPhone?: string
	whatsappNumber?: string
	bookingUrl?: string
}

export default function QuoteViewClient({
	quote,
	brandName = 'DeanFlow',
	legalCompany = 'DEANFLOW GLOBAL COMMERCE CORP',
	brandAddress = 'Industrial Manufacturing Hub, Hai Phong Port / Ho Chi Minh City, Vietnam',
	supportEmail = 'support@deanflow.com',
	supportPhone = '+84 901 234 567',
	whatsappNumber = '+84901234567',
	bookingUrl = 'https://calendly.com',
}: Props) {
	const [quoteStatus, setQuoteStatus] = useState<string>(
		(quote.quoteStatus || 'sent').toLowerCase(),
	)
	const [approvedAt, setApprovedAt] = useState<string | null>(quote.quoteApprovedAt || null)
	const [approvedBy, setApprovedBy] = useState<string | null>(quote.quoteApprovedBy || null)

	const currency = (quote.currency || 'USD').toUpperCase()
	const locale = currency === 'VND' ? 'vi-VN' : 'en-US'
	const renderPrice = (val: number | string | undefined | null) =>
		formatPrice(val, currency, locale)

	// Modal state for digital approval
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [signerName, setSignerName] = useState(quote.customerName || '')
	const [signerTitle, setSignerTitle] = useState('Procurement Director')
	const [signerCompany, setSignerCompany] = useState(quote.companyName || '')
	const [poNumber, setPoNumber] = useState(quote.quotePoNumber || '')
	const [isAuthorized, setIsAuthorized] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [approvalSuccess, setApprovalSuccess] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	// Modal state for revision request
	const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false)
	const [revisionRequesterName, setRevisionRequesterName] = useState(quote.customerName || '')
	const [revisionRequesterEmail, setRevisionRequesterEmail] = useState(quote.customerEmail || '')
	const [revisionNotes, setRevisionNotes] = useState('')
	const [isSubmittingRevision, setIsSubmittingRevision] = useState(false)
	const [revisionSuccess, setRevisionSuccess] = useState(false)
	const [revisionError, setRevisionError] = useState<string | null>(null)

	// Quick Contact Sheet for mobile
	const [isContactSheetOpen, setIsContactSheetOpen] = useState(false)

	// Keyboard accessibility: ESC key closes modals
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsModalOpen(false)
				setIsRevisionModalOpen(false)
				setIsContactSheetOpen(false)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	const isApproved = quoteStatus === 'approved'
	const isExpired = quoteStatus === 'expired' || Boolean(quote.isExpired)
	const isCancelled = quoteStatus === 'cancelled'
	const isRevisionRequested = quoteStatus === 'revision_requested'

	const handlePrint = () => {
		if (typeof window !== 'undefined') {
			window.print()
		}
	}

	const handleApproveQuote = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!signerName.trim() || !signerTitle.trim() || !isAuthorized) return

		try {
			setIsSubmitting(true)
			setErrorMessage(null)

			const res = await fetch('/api/orders/approve-quote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					quoteId: quote.quoteNumber,
					version: quote.version,
					token: new URLSearchParams(window.location.search).get('token'),
					orderNumber: quote.quoteNumber,
					approvedBy: signerName.trim(),
					title: signerTitle.trim(),
					company: signerCompany.trim(),
					notes: poNumber.trim() ? `PO #${poNumber.trim()}` : undefined,
				}),
			})

			const data = await res.json()
			if (data.success) {
				setQuoteStatus('approved')
				setApprovedBy(data.approvedBy || `${signerName.trim()} (${signerTitle.trim()})`)
				setApprovedAt(data.approvedAt || new Date().toISOString())
				setApprovalSuccess(true)
				setIsModalOpen(false)
			} else {
				setErrorMessage(data.message || 'Unable to record quotation approval.')
			}
		} catch (err: any) {
			console.error('Quotation approval error:', err)
			setErrorMessage(err.message || 'Network error while submitting approval.')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleRequestRevision = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!revisionNotes.trim() || revisionNotes.trim().length < 5) return

		try {
			setIsSubmittingRevision(true)
			setRevisionError(null)

			const res = await fetch('/api/orders/request-revision', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					quoteId: quote.quoteNumber,
					version: quote.version,
					token: new URLSearchParams(window.location.search).get('token'),
					orderNumber: quote.quoteNumber,
					customerName: revisionRequesterName.trim() || quote.customerName,
					customerEmail: revisionRequesterEmail.trim() || quote.customerEmail,
					requestedChanges: revisionNotes.trim(),
				}),
			})

			const data = await res.json()
			if (data.success) {
				setQuoteStatus('revision_requested')
				setRevisionSuccess(true)
				setTimeout(() => {
					setIsRevisionModalOpen(false)
					setRevisionSuccess(false)
					setRevisionNotes('')
				}, 2200)
			} else {
				setRevisionError(data.message || 'Unable to submit revision request.')
			}
		} catch (err: any) {
			console.error('Revision request error:', err)
			setRevisionError(err.message || 'Network error while submitting revision request.')
		} finally {
			setIsSubmittingRevision(false)
		}
	}

	const createdDate = new Date(quote.createdAt)
	const formattedDate = createdDate.toLocaleDateString(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	const validUntilDate = quote.quoteValidUntil
		? new Date(quote.quoteValidUntil)
		: new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000)

	const formattedValidUntil = validUntilDate.toLocaleDateString(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	const effectiveShipping = Number(quote.shippingFee) || 0
	const effectiveDiscount = Number(quote.discount) || 0
	const effectiveTax = Number(quote.taxAmount) || 0
	const effectiveTotal =
		Number(quote.total) ||
		Math.max(0, quote.subtotal + effectiveShipping + effectiveTax - effectiveDiscount)

	return (
		<main className="min-h-screen bg-slate-100 py-4 sm:py-10 pb-28 sm:pb-12 print:min-h-0 print:bg-white print:py-0 print:px-0 print:m-0 text-slate-900 font-sans">
			{/* Non-printable Action Toolbar */}
			<header className="mx-auto max-w-4xl px-3 sm:px-4 mb-4 sm:mb-6 print:hidden" aria-label="Proposal Action Toolbar">
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 p-3.5 sm:p-4 text-white shadow-xl">
					<div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
						<Link
							href="/"
							className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white transition focus-visible:ring-2 focus-visible:ring-emerald-400"
							title="Return to storefront"
							aria-label="Return to storefront"
						>
							<HiOutlineArrowLeft className="text-lg" />
						</Link>
						<div className="min-w-0">
							<div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
								<span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
									Commercial Proposal
								</span>
								{isApproved ? (
									<span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
										APPROVED
									</span>
								) : isExpired ? (
									<span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-300 border border-amber-500/40">
										EXPIRED
									</span>
								) : isCancelled ? (
									<span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-rose-300 border border-rose-500/40">
										CANCELLED
									</span>
								) : isRevisionRequested ? (
									<span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-purple-300 border border-purple-500/40">
										UNDER REVIEW
									</span>
								) : quote.isDraftPreview ? (
									<span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-amber-300 border border-amber-500/40">
										DRAFT PREVIEW
									</span>
								) : (
									<span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-blue-300 border border-blue-500/30">
										OFFICIAL ESTIMATE
									</span>
								)}
							</div>
							<h1 className="text-xs sm:text-sm font-extrabold text-white font-mono truncate">
								#{quote.quoteNumber}
							</h1>
						</div>
					</div>

					{/* Desktop Actions Row (hidden on mobile, mobile uses sticky bottom dock) */}
					<div className="hidden sm:flex flex-wrap items-center gap-2">
						{/* Accept / Approve Button */}
						{isApproved ? (
							<div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/90 px-4 py-2 text-xs font-bold text-white shadow-md">
								<HiOutlineCheckBadge className="text-base text-emerald-200" />
								<span>Approved by {approvedBy?.split('(')[0]?.trim() || 'Buyer'}</span>
							</div>
						) : isExpired || isCancelled ? (
							<button
								type="button"
								onClick={() => setIsRevisionModalOpen(true)}
								className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-500 transition cursor-pointer"
							>
								<HiOutlinePencilSquare className="text-base" />
								<span>Request Price Refresh</span>
							</button>
						) : isRevisionRequested || quote.isDraftPreview ? (
							<span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300">
								<HiOutlineClock className="text-sm" />
								<span>{quote.isDraftPreview ? 'Internal Draft Preview' : 'Revision In Progress'}</span>
							</span>
						) : (
							<>
								<button
									type="button"
									onClick={() => setIsModalOpen(true)}
									className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:bg-emerald-500 transition active:scale-95 cursor-pointer ring-2 ring-emerald-400/50"
								>
									<HiOutlineCheckBadge className="text-base" />
									<span>Accept & Approve Quote</span>
								</button>

								<button
									type="button"
									onClick={() => setIsRevisionModalOpen(true)}
									className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
									title="Request changes to quantities, Incoterms, or schedule"
								>
									<HiOutlinePencilSquare className="text-sm text-slate-300" />
									<span>Request Revision</span>
								</button>
							</>
						)}

						<button
							type="button"
							onClick={handlePrint}
							className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition active:scale-95 cursor-pointer"
							title="Print or export proforma PDF"
						>
							<HiOutlinePrinter className="text-base" />
							<span>Print / Save PDF</span>
						</button>

						<a
							href={bookingUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
						>
							<HiOutlineCalendar className="text-base text-amber-400" />
							<span>Schedule Call</span>
						</a>

						<a
							href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I would like to discuss commercial quotation #${quote.quoteNumber}.`)}`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition"
						>
							<HiOutlineChatBubbleLeftRight className="text-base" />
							<span>WhatsApp</span>
						</a>
					</div>

					{/* Mobile Quick Actions Pill Button (<640px) */}
					<div className="flex sm:hidden items-center gap-2">
						<button
							type="button"
							onClick={() => setIsContactSheetOpen(true)}
							className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
							aria-label="Open contact and export options"
						>
							<HiOutlineEllipsisHorizontal className="text-base" />
							<span>Options</span>
						</button>
					</div>
				</div>

				{/* Contextual Lifecycle Status Banners */}
				{isApproved ? (
					<div className="mt-3 flex items-start sm:items-center gap-3 rounded-2xl bg-emerald-50 p-3 sm:px-5 sm:py-3.5 text-xs text-emerald-950 border-2 border-emerald-300 shadow-sm animate-in fade-in" role="status">
						<HiOutlineCheckBadge className="text-2xl text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
						<div>
							<p className="font-extrabold text-emerald-950 text-xs sm:text-sm">
								Official Commercial Quotation Approved & Executed
							</p>
							<p className="text-emerald-800 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
								Digitally approved by <strong>{approvedBy}</strong> on{' '}
								{new Date(approvedAt || Date.now()).toLocaleDateString(locale, {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit',
								})}
								. Our export management division is preparing your binding Sales Contract and commercial proforma invoice for vessel booking.
							</p>
						</div>
					</div>
				) : isExpired ? (
					<div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-amber-50 p-3.5 sm:px-5 sm:py-3.5 text-xs text-amber-950 border-2 border-amber-300 shadow-sm" role="alert">
						<div className="flex items-start gap-2.5">
							<HiOutlineExclamationTriangle className="text-xl text-amber-600 shrink-0 mt-0.5" />
							<div>
								<p className="font-bold text-amber-950 text-xs sm:text-sm">
									Commercial Proposal Expired on {formattedValidUntil}
								</p>
								<p className="text-amber-800 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
									Container vessel freight slots and international commodity prices are subject to periodic market adjustments. Please click <strong>&quot;Refresh Quote&quot;</strong> to receive an updated quotation.
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => setIsRevisionModalOpen(true)}
							className="w-full sm:w-auto text-center shrink-0 rounded-xl bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer"
						>
							Refresh Quote
						</button>
					</div>
				) : isCancelled ? (
					<div className="mt-3 flex items-center gap-3 rounded-2xl bg-rose-50 p-3 sm:px-5 sm:py-3.5 text-xs text-rose-950 border-2 border-rose-300 shadow-sm" role="alert">
						<HiOutlineInformationCircle className="text-xl text-rose-600 shrink-0" />
						<p className="text-[11px] sm:text-xs leading-relaxed">
							<strong>Quotation Withdrawn:</strong> This commercial proposal has been closed or cancelled by sales operations. Please contact your account representative for details.
						</p>
					</div>
				) : isRevisionRequested ? (
					<div className="mt-3 flex items-start sm:items-center gap-3 rounded-2xl bg-purple-50 p-3 sm:px-5 sm:py-3.5 text-xs text-purple-950 border-2 border-purple-300 shadow-sm" role="status">
						<HiOutlineClock className="text-xl text-purple-600 shrink-0 mt-0.5 sm:mt-0" />
						<div>
							<p className="font-bold text-purple-950 text-xs sm:text-sm">
								Revision Request Received & Under Review
							</p>
							<p className="text-purple-800 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
								Your requested modifications have been forwarded to our trade desk. An export specialist is recalculating logistics and will dispatch an updated proposal shortly.
							</p>
						</div>
					</div>
				) : quote.isDraftPreview ? (
					<div className="mt-3 flex items-start sm:items-center gap-3 rounded-2xl bg-amber-50 p-3 sm:px-5 sm:py-3.5 text-xs text-amber-950 border-2 border-amber-300 shadow-sm" role="status">
						<HiOutlineClock className="text-xl text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
						<div>
							<p className="font-bold text-amber-950 text-xs sm:text-sm">
								Internal Draft Preview
							</p>
							<p className="text-amber-800 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
								This quotation is currently in draft status and is visible only to staff. Buyers continue to see the last issued version until a new version is sent.
							</p>
						</div>
					</div>
				) : (
					<div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-slate-50 p-3 sm:px-4 sm:py-2.5 text-xs text-slate-800 border border-slate-200">
						<div className="flex items-center gap-2">
							<HiOutlineShieldCheck className="text-base text-blue-600 shrink-0" />
							<span className="text-[11px] sm:text-xs leading-relaxed">
								<strong>Negotiated Estimate:</strong> Valid until <strong>{formattedValidUntil}</strong>. Click <strong>&quot;Approve&quot;</strong> to accept, or <strong>&quot;Revise&quot;</strong> for adjustments.
							</span>
						</div>
						<button
							type="button"
							onClick={() => setIsModalOpen(true)}
							className="text-emerald-700 font-extrabold hover:underline text-left sm:text-right shrink-0 cursor-pointer hidden sm:inline"
						>
							Approve Now →
						</button>
					</div>
				)}
			</header>

			{/* Printable A4 Commercial Invoice Container (Optimized Mobile Padding) */}
			<article
				className="mx-auto max-w-4xl bg-white p-4 sm:p-8 md:p-12 text-slate-900 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl border border-slate-200/80 print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:w-full print:max-w-none"
				aria-label="Commercial Proforma Document"
			>
				{/* Top Branding Header */}
				<section className="flex flex-col sm:flex-row print:flex-row justify-between items-start border-b-2 border-slate-900 pb-5 sm:pb-6 gap-4 sm:gap-6 print:pb-3 print:gap-4 avoid-break">
					<div>
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase print:text-xl">
								{brandName}
							</span>
							<span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-800 uppercase tracking-wider print:px-1.5 print:py-0.2">
								Export Compliant
							</span>
						</div>
						<p className="text-xs font-semibold text-slate-700 mt-1 print:text-[11px] print:mt-0.5">{legalCompany}</p>
						<p className="text-[11px] text-slate-500 max-w-md mt-0.5 leading-relaxed print:text-[10px] print:leading-snug">
							{brandAddress}
						</p>
						<p className="text-[11px] text-slate-600 mt-1 font-mono print:text-[10px] print:mt-0.5">
							Email: {supportEmail} • Tel: {supportPhone}
						</p>
					</div>

					<div className="text-left sm:text-right print:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
						<span className="rounded bg-slate-900 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white inline-block print:px-2 print:py-0.5 print:text-[10px]">
							{isApproved ? 'Approved Proforma Quotation' : 'Proforma Quotation'}
						</span>
						<p className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1.5 sm:mt-2 print:text-base print:mt-1">
							#{quote.quoteNumber}
						</p>
						<div className="text-xs text-slate-500 mt-1 space-y-0.5 print:text-[10px] print:mt-0.5">
							<p>Issued Date: <strong className="text-slate-800">{formattedDate}</strong></p>
							<p>Valid Until: <strong className="text-amber-700 font-semibold">{formattedValidUntil}</strong></p>
						</div>
					</div>
				</section>

				{/* Commercial Parties Info */}
				<section className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 sm:gap-6 py-4 sm:py-6 border-b border-slate-200 text-xs print:gap-3 print:py-3 print:text-[11px] avoid-break">
					<div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/60 print:p-2.5 print:rounded-lg">
						<span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-2 print:text-[9px] print:mb-1">
							BILL TO / IMPORTER INFORMATION
						</span>
						<p className="font-extrabold text-sm text-slate-950 print:text-xs">{quote.customerName}</p>
						{quote.companyName && (
							<p className="font-bold text-xs text-slate-800 mt-0.5 print:text-[11px]">{quote.companyName}</p>
						)}
						{quote.taxId && (
							<p className="font-mono text-[11px] text-slate-600 mt-0.5 print:text-[10px]">VAT / EIN / Tax ID: {quote.taxId}</p>
						)}
						<p className="text-slate-600 mt-1 print:text-[10px] print:mt-0.5">Email: {quote.customerEmail}</p>
						{quote.customerPhone && (
							<p className="font-mono text-slate-600 print:text-[10px]">Phone: {quote.customerPhone}</p>
						)}
						{quote.shippingAddress && (
							<p className="text-slate-700 mt-1 font-medium leading-relaxed print:text-[10px] print:leading-snug print:mt-0.5">
								Address: {quote.shippingAddress}
							</p>
						)}
					</div>

					<div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/60 print:p-2.5 print:rounded-lg">
						<span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block mb-2 print:text-[9px] print:mb-1">
							INCOTERMS® 2020 & DISPATCH SCHEDULE
						</span>
						<div className="space-y-1.5 text-xs text-slate-700 print:space-y-0.5 print:text-[10.5px]">
							<div className="flex justify-between">
								<span className="text-slate-500">Price Basis / Incoterm:</span>
								<strong className="text-slate-900 font-mono">{quote.incoterm || 'FOB (Vietnam Port)'}</strong>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Payment Terms:</span>
								<strong className="text-blue-900 font-semibold text-right max-w-[65%] truncate">
									{quote.paymentTerms || 'T/T 30% advance, 70% before shipment'}
								</strong>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Destination Port / Hub:</span>
								<strong className="text-slate-900 text-right">{quote.portOfDestination || quote.shippingCountry || 'International Port'}</strong>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Target Delivery Date:</span>
								<strong className="text-slate-900">{quote.targetDeliveryDate || 'Within 2-3 Weeks'}</strong>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Origin Fulfillment:</span>
								<strong className="text-slate-900">Hai Phong / Ho Chi Minh, Vietnam</strong>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-500">Commercial Currency:</span>
								<strong className="text-slate-900 font-mono">{currency}</strong>
							</div>
						</div>
					</div>
				</section>

				{/* Line Items Schedule (Responsive: Mobile Cards + Desktop/Print Table) */}
				<section className="py-4 sm:py-6 print:py-2.5 avoid-break" aria-label="Itemized Quotation Schedule">
					{/* Mobile Card Layout (<640px) */}
					<div className="block sm:hidden print:hidden space-y-3">
						<div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
							<span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
								Itemized Schedule ({quote.items.length})
							</span>
							<span className="text-[10px] font-bold text-slate-500 font-mono">
								{quote.incoterm || 'FOB'}
							</span>
						</div>

						{quote.items.map((item, idx) => (
							<div
								key={idx}
								className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 shadow-2xs"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0">
										<span className="inline-block rounded-md bg-slate-200 px-2 py-0.5 text-[9px] font-mono font-bold text-slate-700 mb-1">
											Line #{idx + 1}
										</span>
										<h4 className="font-bold text-xs text-slate-950 leading-snug">
											{item.title}
										</h4>
									</div>
									{item.sku && (
										<span className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-mono text-slate-600">
											{item.sku}
										</span>
									)}
								</div>

								<div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
									<div className="rounded-xl bg-white p-2 border border-slate-100">
										<span className="text-[9px] text-slate-400 block font-semibold uppercase">Qty</span>
										<strong className="text-xs font-mono text-slate-900">
											{item.quantity.toLocaleString()}
										</strong>
									</div>
									<div className="rounded-xl bg-white p-2 border border-slate-100">
										<span className="text-[9px] text-slate-400 block font-semibold uppercase">Unit Price</span>
										<strong className="text-xs font-mono text-slate-900">
											{renderPrice(item.price)}
										</strong>
									</div>
									<div className="rounded-xl bg-emerald-50/80 p-2 border border-emerald-100">
										<span className="text-[9px] text-emerald-700 block font-semibold uppercase">Total</span>
										<strong className="text-xs font-mono font-black text-emerald-800">
											{renderPrice(item.total || item.price * item.quantity)}
										</strong>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Desktop & Print Tabular Grid (>=640px) */}
					<table className="hidden sm:table print:table w-full text-left border-collapse">
						<thead>
							<tr className="border-b-2 border-slate-900 text-[11px] font-black uppercase tracking-wider text-slate-600 print:text-[10px]">
								<th className="py-3 px-2 print:py-1.5 print:px-1.5">#</th>
								<th className="py-3 px-2 print:py-1.5 print:px-1.5">Description & Specification</th>
								<th className="py-3 px-2 font-mono print:py-1.5 print:px-1.5">SKU / Model</th>
								<th className="py-3 px-2 text-center print:py-1.5 print:px-1.5">Quantity (Units)</th>
								<th className="py-3 px-2 text-right print:py-1.5 print:px-1.5">Unit Price ({quote.incoterm || 'FOB'})</th>
								<th className="py-3 px-2 text-right print:py-1.5 print:px-1.5">Amount ({currency})</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 text-xs text-slate-800 print:text-[10.5px]">
							{quote.items.map((item, idx) => (
								<tr key={idx} className="hover:bg-slate-50/50 avoid-break">
									<td className="py-3 px-2 text-slate-400 font-mono print:py-1.5 print:px-1.5 print:text-[10px]">{idx + 1}</td>
									<td className="py-3 px-2 font-bold text-slate-950 print:py-1.5 print:px-1.5">
										{item.title}
									</td>
									<td className="py-3 px-2 font-mono text-slate-500 text-[11px] print:py-1.5 print:px-1.5 print:text-[9.5px]">
										{item.sku || 'N/A'}
									</td>
									<td className="py-3 px-2 text-center font-extrabold text-slate-900 print:py-1.5 print:px-1.5">
										{item.quantity.toLocaleString()}
									</td>
									<td className="py-3 px-2 text-right font-mono print:py-1.5 print:px-1.5">
										{renderPrice(item.price)}
									</td>
									<td className="py-3 px-2 text-right font-black font-mono text-slate-950 print:py-1.5 print:px-1.5">
										{renderPrice(item.total || item.price * item.quantity)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</section>

				{/* Subtotal & Financial Summary */}
				<section className="flex flex-col sm:flex-row print:flex-row justify-between items-start border-t-2 border-slate-900 pt-5 sm:pt-6 gap-5 sm:gap-6 print:pt-3 print:gap-4 avoid-break">
					<div className="text-xs text-slate-600 max-w-sm space-y-2 print:max-w-xs print:space-y-1 print:text-[10px]">
						<p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] print:text-[10px]">
							Commercial Terms & Export Specifications:
						</p>
						<ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 print:space-y-0.5 print:text-[9.5px] print:leading-snug">
							<li>Standard 5-ply export master carton packaging with interior moisture-barrier liner.</li>
							<li>Official Certificate of Origin (Form D / EUR.1 / GSP Form A) provided with shipping documents.</li>
							<li>Standard manufacturer warranty: 12 months covering production integrity.</li>
							<li>Quotation includes export customs clearance and terminal handling at Vietnam origin port.</li>
						</ul>

						{quote.customerNote && (
							<div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
								<span className="font-bold text-slate-700 block text-[10px] uppercase">Buyer Special Instructions:</span>
								<p className="italic text-slate-600 mt-0.5 text-[11px] leading-relaxed">{quote.customerNote}</p>
							</div>
						)}
					</div>

					<div className="w-full sm:w-80 space-y-2 text-xs print:w-72 print:space-y-0.5 print:text-[10.5px]">
						<div className="flex justify-between py-1 border-b border-slate-200 text-slate-600 print:py-0.5">
							<span>FOB Products Subtotal:</span>
							<span className="font-bold font-mono text-slate-900">
								{renderPrice(quote.subtotal)}
							</span>
						</div>

						<div className="flex justify-between py-1 border-b border-slate-200 text-slate-600 print:py-0.5">
							<span>Ocean / Air Freight:</span>
							<span className="font-mono font-medium text-slate-900">
								{effectiveShipping > 0
									? renderPrice(effectiveShipping)
									: currency === 'VND'
										? 'Free / Included'
										: 'To be quoted upon vessel booking'}
							</span>
						</div>

						{effectiveDiscount > 0 && (
							<div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700 print:py-0.5">
								<span>Negotiated Discount:</span>
								<span className="font-mono font-bold">-{renderPrice(effectiveDiscount)}</span>
							</div>
						)}

						{effectiveTax > 0 && (
							<div className="flex justify-between py-1 border-b border-slate-200 text-slate-600 print:py-0.5">
								<span>Applicable Tax / VAT ({quote.taxRate || 0}%):</span>
								<span className="font-mono font-medium text-slate-900">{renderPrice(effectiveTax)}</span>
							</div>
						)}

						<div className="flex justify-between py-1 border-b border-slate-200 text-slate-600 print:py-0.5">
							<span>Export Documentation & CoO:</span>
							<span className="font-bold text-emerald-700">Included</span>
						</div>

						<div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-950 print:py-1 print:text-xs">
							<span>Total Landed Value:</span>
							<span className="text-lg font-mono text-emerald-700 font-black print:text-sm">
								{renderPrice(effectiveTotal)}
							</span>
						</div>
					</div>
				</section>

				{/* Signatures & Execution Section (Mobile Stacking: 1 Column Mobile, 2 Columns Desktop) */}
				<section className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pt-8 sm:pt-12 mt-8 border-t border-slate-200 text-xs print:grid-cols-2 print:gap-4 print:pt-3 print:mt-3 print:text-[10px] avoid-break">
					<div className="space-y-4 sm:space-y-6 print:space-y-2">
						<span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block print:text-[9px]">
							PREPARED & AUTHORIZED BY:
						</span>
						<div className="rounded-xl bg-slate-50 p-3.5 sm:p-4 border border-slate-200/80 print:p-2 print:rounded-lg">
							<p className="font-black text-slate-900 text-xs sm:text-sm print:text-[11px]">{brandName} B2B Export Division</p>
							<p className="text-[11px] text-slate-500 mt-0.5 print:text-[9.5px]">Global Trade & Supply Operations</p>
							<div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold print:mt-1.5 print:pt-1 print:text-[9px]">
								<HiOutlineShieldCheck className="text-sm print:text-xs" /> Verified Commercial Entity
							</div>
						</div>
					</div>

					<div className="space-y-4 sm:space-y-6 text-left sm:text-right print:text-right print:space-y-2">
						<span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block print:text-[9px]">
							BUYER ACKNOWLEDGMENT:
						</span>
						{isApproved ? (
							<div className="rounded-xl bg-emerald-50 p-3.5 sm:p-4 border border-emerald-300 text-left print:p-2 print:rounded-lg">
								<div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1 print:text-[10.5px]">
									<HiOutlineCheckBadge className="text-base text-emerald-600 print:text-sm" />
									<span>DIGITALLY SIGNED & APPROVED</span>
								</div>
								<p className="font-extrabold text-slate-900 text-xs sm:text-sm print:text-[11px]">{approvedBy}</p>
								<p className="text-[11px] text-slate-600 mt-0.5 print:text-[9.5px]">
									Date: {new Date(approvedAt || Date.now()).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
								</p>
								<p className="text-[10px] font-mono text-emerald-700 mt-1 print:text-[8.5px]">
									Protocol: Electronic Acceptance Verified (1-Click Sign-off)
								</p>
							</div>
						) : isRevisionRequested || quote.isDraftPreview ? (
							<span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600">
								<HiOutlineClock className="text-sm" />
								<span>{quote.isDraftPreview ? 'Draft' : 'Under Revision'}</span>
							</span>
						) : (
							<div className="space-y-2 print:space-y-1">
								<div className="border-b-2 border-slate-400 w-full sm:w-48 sm:ml-auto print:w-36 pt-4 sm:pt-6 print:pt-4"></div>
								<p className="font-bold text-slate-800 text-[11px] print:text-[9.5px]">Authorized Signature & Company Stamp</p>
								{!isExpired && !isCancelled && !isRevisionRequested && !quote.isDraftPreview && (
									<div className="print:hidden pt-2">
										<button
											type="button"
											onClick={() => setIsModalOpen(true)}
											className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition cursor-pointer"
										>
											<HiOutlineDocumentCheck className="text-base" />
											<span>Sign & Approve Online</span>
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				</section>

				{/* Mandatory Legal Disclaimer */}
				<footer className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed text-center print:mt-2 print:pt-1.5 print:text-[8.5px] print:leading-tight avoid-break">
					<strong>LEGAL DISCLAIMER:</strong> This Commercial Quotation becomes binding upon formal digital acceptance or countersigning of the mutual International Sales Contract. Ocean freight charges and container vessel availability are subject to carrier surcharges at the time of final bill of lading issuance.
				</footer>
			</article>

			{/* Sticky Mobile Floating Action Dock (<640px) */}
			<aside
				className="fixed bottom-0 inset-x-0 z-40 sm:hidden print:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe"
				aria-label="Mobile Action Dock"
			>
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
							Total Negotiated
						</span>
						<p className="text-base font-black font-mono text-emerald-700 truncate leading-tight">
							{renderPrice(effectiveTotal)}
						</p>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<button
							type="button"
							onClick={() => setIsContactSheetOpen(true)}
							className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer active:scale-95"
							title="More options & contact"
							aria-label="More options & contact"
						>
							<HiOutlineChatBubbleLeftRight className="text-lg" />
						</button>

						{isApproved ? (
							<button
								type="button"
								onClick={handlePrint}
								className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer"
							>
								<HiOutlinePrinter className="text-base text-slate-300" />
								<span>Export PDF</span>
							</button>
						) : isExpired || isCancelled ? (
							<button
								type="button"
								onClick={() => setIsRevisionModalOpen(true)}
								className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer"
							>
								<HiOutlinePencilSquare className="text-base text-amber-200" />
								<span>Refresh Quote</span>
							</button>
						) : isRevisionRequested || quote.isDraftPreview ? (
							<span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600">
								<HiOutlineClock className="text-sm" />
								<span>{quote.isDraftPreview ? 'Draft' : 'Under Revision'}</span>
							</span>
						) : (
							<>
								<button
									type="button"
									onClick={() => setIsRevisionModalOpen(true)}
									className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 active:scale-95 transition cursor-pointer"
								>
									<HiOutlinePencilSquare className="text-sm text-slate-500" />
									<span>Revise</span>
								</button>

								<button
									type="button"
									onClick={() => setIsModalOpen(true)}
									className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-extrabold text-white shadow-md active:scale-95 transition cursor-pointer ring-2 ring-emerald-400/50"
								>
									<HiOutlineCheckBadge className="text-base" />
									<span>Approve</span>
								</button>
							</>
						)}
					</div>
				</div>
			</aside>

			{/* Mobile Quick Contact & Share Drawer Sheet */}
			{isContactSheetOpen && (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="contact-sheet-title"
					className="fixed inset-0 z-50 flex items-end sm:hidden bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 print:hidden"
				>
					<div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200 space-y-4 pb-safe">
						<div className="flex items-center justify-between border-b border-slate-100 pb-3">
							<div>
								<h3 id="contact-sheet-title" className="font-bold text-sm text-slate-900">
									Proposal Inquiries & Assistance
								</h3>
								<p className="text-[11px] text-slate-500 font-mono">
									Quote #{quote.quoteNumber}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setIsContactSheetOpen(false)}
								className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
								aria-label="Close contact drawer"
							>
								<HiOutlineXMark className="text-lg" />
							</button>
						</div>

						<div className="grid grid-cols-2 gap-2 text-xs">
							<a
								href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I would like to discuss commercial quotation #${quote.quoteNumber}.`)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold active:scale-95 transition"
							>
								<HiOutlineChatBubbleLeftRight className="text-xl text-emerald-600" />
								<span>WhatsApp</span>
							</a>

							<a
								href={`tel:${supportPhone}`}
								className="flex items-center gap-2 p-3 rounded-2xl bg-blue-50 text-blue-900 border border-blue-200/80 font-bold active:scale-95 transition"
							>
								<HiOutlinePhone className="text-xl text-blue-600" />
								<span>Direct Call</span>
							</a>

							<a
								href={bookingUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200/80 font-bold active:scale-95 transition"
							>
								<HiOutlineCalendar className="text-xl text-amber-600" />
								<span>Schedule Call</span>
							</a>

							<button
								type="button"
								onClick={() => {
									setIsContactSheetOpen(false)
									handlePrint()
								}}
								className="flex items-center gap-2 p-3 rounded-2xl bg-slate-100 text-slate-900 border border-slate-200 font-bold active:scale-95 transition text-left cursor-pointer"
							>
								<HiOutlinePrinter className="text-xl text-slate-700" />
								<span>Print / PDF</span>
							</button>
						</div>

						<div className="p-3 rounded-2xl bg-slate-50 text-[11px] text-slate-500 border border-slate-100 leading-relaxed text-center">
							Support Email: <strong className="text-slate-800">{supportEmail}</strong>
							<br />
							Operating Hub: <strong className="text-slate-800">Vietnam International Logistics</strong>
						</div>
					</div>
				</div>
			)}

			{/* Digital Approval Modal Dialog (Accessible & Mobile Optimized) */}
			{isModalOpen && (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="approve-modal-title"
					className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 print:hidden"
				>
					<div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-3.5">
							<div className="flex items-center gap-2.5">
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs shrink-0">
									<HiOutlineDocumentCheck className="text-xl" />
								</div>
								<div>
									<h2 id="approve-modal-title" className="font-bold text-sm sm:text-base text-slate-950">
										Approve Commercial Quotation
									</h2>
									<p className="text-xs text-slate-500 font-mono">
										Quote #{quote.quoteNumber} • {renderPrice(effectiveTotal)}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setIsModalOpen(false)}
								className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer shrink-0"
								aria-label="Close approval dialog"
							>
								<HiOutlineXMark className="text-lg" />
							</button>
						</div>

						{errorMessage && (
							<div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200" role="alert">
								{errorMessage}
							</div>
						)}

						<form onSubmit={handleApproveQuote} className="space-y-3.5 text-xs">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label htmlFor="signer-name" className="block font-bold text-slate-700 mb-1">
										Authorized Signatory Name <span className="text-red-500">*</span>
									</label>
									<input
										id="signer-name"
										type="text"
										required
										value={signerName}
										onChange={(e) => setSignerName(e.target.value)}
										placeholder="e.g. John Doe"
										className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base sm:text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
									/>
								</div>

								<div>
									<label htmlFor="signer-title" className="block font-bold text-slate-700 mb-1">
										Job Title / Designation <span className="text-red-500">*</span>
									</label>
									<input
										id="signer-title"
										type="text"
										required
										value={signerTitle}
										onChange={(e) => setSignerTitle(e.target.value)}
										placeholder="e.g. Procurement Director"
										className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base sm:text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
									/>
								</div>
							</div>

							<div>
								<label htmlFor="signer-company" className="block font-bold text-slate-700 mb-1">
									Company Legal Entity
								</label>
								<input
									id="signer-company"
									type="text"
									value={signerCompany}
									onChange={(e) => setSignerCompany(e.target.value)}
									placeholder="e.g. Global Supplies LLC"
									className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base sm:text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
								/>
							</div>

							<div>
								<label htmlFor="po-number" className="block font-bold text-slate-700 mb-1">
									Purchase Order (PO) Number / Internal Reference
								</label>
								<input
									id="po-number"
									type="text"
									value={poNumber}
									onChange={(e) => setPoNumber(e.target.value)}
									placeholder="e.g. PO-2026-US-894 (Optional)"
									className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base sm:text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
								/>
							</div>

							<div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1.5">
								<div className="flex justify-between text-slate-600">
									<span>Trade Incoterm:</span>
									<strong className="text-slate-900">{quote.incoterm || 'FOB'}</strong>
								</div>
								<div className="flex justify-between text-slate-600">
									<span>Payment Terms:</span>
									<strong className="text-slate-900">{quote.paymentTerms || 'T/T 30/70'}</strong>
								</div>
								<div className="flex justify-between text-slate-600">
									<span>Total Agreed Amount:</span>
									<strong className="text-emerald-700 font-mono font-bold text-sm">
										{renderPrice(effectiveTotal)}
									</strong>
								</div>
							</div>

							<label className="flex items-start gap-2.5 p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/80 cursor-pointer">
								<input
									type="checkbox"
									required
									checked={isAuthorized}
									onChange={(e) => setIsAuthorized(e.target.checked)}
									className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
								/>
								<span className="text-[11px] text-slate-700 leading-snug">
									I hereby confirm that I am legally authorized to accept this commercial quotation on behalf of the company and authorize {brandName} to proceed with contract generation.
								</span>
							</label>

							<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
								>
									Cancel
								</button>

								<button
									type="submit"
									disabled={isSubmitting || !isAuthorized || !signerName.trim() || !signerTitle.trim()}
									className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition active:scale-95 disabled:opacity-50 cursor-pointer"
								>
									<HiOutlineCheckBadge className="text-base" />
									<span>{isSubmitting ? 'Recording Acceptance...' : 'Confirm & Digitally Approve'}</span>
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Request Revision Modal Dialog (Accessible & Mobile Optimized) */}
			{isRevisionModalOpen && (
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="revision-modal-title"
					className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 print:hidden"
				>
					<div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-3.5">
							<div className="flex items-center gap-2.5">
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs shrink-0">
									<HiOutlinePencilSquare className="text-xl text-amber-400" />
								</div>
								<div>
									<h2 id="revision-modal-title" className="font-bold text-sm sm:text-base text-slate-950">
										Request Quotation Revision
									</h2>
									<p className="text-xs text-slate-500 font-mono">
										Quote #{quote.quoteNumber}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setIsRevisionModalOpen(false)}
								className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer shrink-0"
								aria-label="Close revision dialog"
							>
								<HiOutlineXMark className="text-lg" />
							</button>
						</div>

						{revisionSuccess ? (
							<div className="py-6 text-center space-y-3" role="status">
								<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
									<HiOutlineCheckBadge className="text-2xl" />
								</div>
								<h3 className="font-bold text-sm text-slate-900">Revision Request Submitted</h3>
								<p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
									Thank you. Our commercial export specialist will review your proposed modifications and issue an updated proforma proposal within 12 business hours.
								</p>
							</div>
						) : isRevisionRequested || quote.isDraftPreview ? (
							<span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600">
								<HiOutlineClock className="text-sm" />
								<span>{quote.isDraftPreview ? 'Draft' : 'Under Revision'}</span>
							</span>
						) : (
							<form onSubmit={handleRequestRevision} className="space-y-3.5 text-xs">
								{revisionError && (
									<div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200" role="alert">
										{revisionError}
									</div>
								)}

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<label htmlFor="rev-name" className="block font-bold text-slate-700 mb-1">
											Your Name <span className="text-red-500">*</span>
										</label>
										<input
											id="rev-name"
											type="text"
											required
											value={revisionRequesterName}
											onChange={(e) => setRevisionRequesterName(e.target.value)}
											placeholder="Full Name"
											className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base sm:text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-hidden"
										/>
									</div>

									<div>
										<label htmlFor="rev-email" className="block font-bold text-slate-700 mb-1">
											Business Email <span className="text-red-500">*</span>
										</label>
										<input
											id="rev-email"
											type="email"
											required
											value={revisionRequesterEmail}
											onChange={(e) => setRevisionRequesterEmail(e.target.value)}
											placeholder="Email address"
											className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base sm:text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-hidden"
										/>
									</div>
								</div>

								<div>
									<label htmlFor="rev-notes" className="block font-bold text-slate-700 mb-1">
										Proposed Modifications & Special Requests <span className="text-red-500">*</span>
									</label>
									<textarea
										id="rev-notes"
										required
										rows={4}
										value={revisionNotes}
										onChange={(e) => setRevisionNotes(e.target.value)}
										placeholder="e.g. Please revise order quantity to 80,000 units, adjust Incoterm to CIF Felixstowe port, and include custom outer carton barcoding."
										className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base sm:text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-hidden leading-relaxed"
									/>
									<span className="text-[10px] text-slate-400 mt-1 block">
										* Minimum 5 characters required. The original proposal #{quote.quoteNumber} remains on file for reference.
									</span>
								</div>

								<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
									<button
										type="button"
										onClick={() => setIsRevisionModalOpen(false)}
										className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
									>
										Cancel
									</button>

									<button
										type="submit"
										disabled={isSubmittingRevision || !revisionNotes.trim() || revisionNotes.trim().length < 5}
										className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
									>
										<HiOutlinePencilSquare className="text-base text-amber-400" />
										<span>{isSubmittingRevision ? 'Submitting Request...' : 'Submit Revision Request'}</span>
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			)}
		</main>
	)
}
