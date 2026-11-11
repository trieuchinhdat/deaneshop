'use client'

import { useEffect, useState } from 'react'
import {
	FiAlertCircle,
	FiBriefcase,
	FiCheckCircle,
	FiClock,
	FiFileText,
	FiGlobe,
	FiInfo,
	FiMail,
	FiPhone,
	FiShield,
	FiUser,
	FiX,
} from 'react-icons/fi'
import { HiOutlineSparkles } from 'react-icons/hi2'
import { getSessionJourney } from '@/lib/journey-tracker'
import { leadSubmissionKey, retireLeadSubmission } from '@/lib/lead-submission'
import { formatPrice } from '@/lib/utils'

interface InPageRfqModalProps {
	isOpen: boolean
	onClose: () => void
	productId: string
	variantId?: string
	productTitle: string
	sku?: string
	quantity: number
	unitPrice: number
	currency?: string
	incoterm?: string
	image?: string
	isSampleMode?: boolean
}

const FREE_EMAIL_PROVIDERS = [
	'gmail.com',
	'yahoo.com',
	'hotmail.com',
	'outlook.com',
	'icloud.com',
	'aol.com',
	'mail.com',
	'zoho.com',
	'protonmail.com',
]

export default function InPageRfqModal({
	isOpen,
	onClose,
	productId,
	variantId,
	productTitle,
	sku,
	quantity: initialQuantity,
	unitPrice,
	currency = 'USD',
	incoterm = 'FOB',
	image,
	isSampleMode = false,
}: InPageRfqModalProps) {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [companyName, setCompanyName] = useState('')
	const [phone, setPhone] = useState('')
	const [country, setCountry] = useState('United States')
	const [destinationPort, setDestinationPort] = useState('')
	const [selectedIncoterm, setSelectedIncoterm] = useState(incoterm || 'FOB')
	const [targetDeliveryDate, setTargetDeliveryDate] = useState('')
	const [customizationRequirements, setCustomizationRequirements] = useState('')
	const [orderQuantity, setOrderQuantity] = useState(initialQuantity || 1)

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isSubmitted, setIsSubmitted] = useState(false)
	const [submittedRfqId, setSubmittedRfqId] = useState('')
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (isOpen) {
			setOrderQuantity(initialQuantity || (isSampleMode ? 2 : 100))
			setIsSubmitted(false)
			setError(null)
		}
	}, [isOpen, initialQuantity, isSampleMode])

	if (!isOpen) return null

	const isCorporateEmail = (em: string): boolean => {
		if (!em || !em.includes('@')) return false
		const domain = em.split('@')[1]?.toLowerCase().trim()
		return Boolean(
			domain && !FREE_EMAIL_PROVIDERS.includes(domain) && domain.includes('.'),
		)
	}

	const estimatedBatchTotal = (unitPrice || 0) * (orderQuantity || 1)
	const hasWorkEmailNotice =
		email.length > 5 && email.includes('@') && !isCorporateEmail(email)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim() || !email.trim()) {
			setError('Please provide your full name and work email address.')
			return
		}

		setIsSubmitting(true)
		setError(null)

		const payload = {
			name: name.trim(),
			email: email.trim(),
			phone: phone.trim(),
			company_name: companyName.trim(),
			country: country.trim(),
			source: isSampleMode ? 'product_sample_request' : 'product_quote_request',
			landing_page_url: window.location.href,
			journey_json: getSessionJourney(),
			message: `Product: ${productTitle} (${productId})\nSKU: ${sku || productId}\nVariant: ${variantId || 'Default'}\nQuantity: ${orderQuantity} units\nDestination: ${country} ${destinationPort}\nTimeline: ${targetDeliveryDate || 'Not specified'}\nRequirements: ${customizationRequirements || 'Not specified'}`,
		}

		try {
			// 1. Submit to Orders / Quotes Pipeline
			const submissionKey = await leadSubmissionKey(payload)
			const res = await fetch('/api/leads', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Idempotency-Key': submissionKey,
				},
				body: JSON.stringify(payload),
			})

			const result = await res.json()
			if (!res.ok || !result.success) {
				throw new Error(result.error || 'Failed to submit quotation request')
			}

			await retireLeadSubmission(payload)
			setSubmittedRfqId(result.leadId)
			setIsSubmitted(true)
		} catch (err: any) {
			setError(
				err?.message ||
					'Unable to submit quotation request. Please try again or contact us directly.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-4">
			<div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl transition-all sm:p-7">
				{/* Close Button */}
				<button
					type="button"
					onClick={onClose}
					aria-label="Close quote modal"
					className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
				>
					<FiX className="h-5 w-5" />
				</button>

				{isSubmitted ? (
					/* High-Trust Success Screen */
					<div className="space-y-4 py-6 text-center">
						<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
							<FiCheckCircle className="h-9 w-9" />
						</div>
						<div className="space-y-1.5">
							<span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wider text-emerald-700 uppercase">
								Request Received • {submittedRfqId}
							</span>
							<h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
								{isSampleMode
									? 'Sample Request Confirmed'
									: 'Quote Request Received'}
							</h3>
							<p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600">
								Thank you, <strong>{name}</strong>. Our team will review the
								requirements from{' '}
								<strong>{companyName || 'your organization'}</strong>.
							</p>
						</div>

						<div className="mx-auto max-w-lg space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-left text-xs">
							<div className="flex items-center gap-2 font-semibold text-emerald-900">
								<FiClock className="h-4 w-4 flex-none text-emerald-600" />
								<span>Your request has been added to our inquiry inbox</span>
							</div>
							<div className="flex items-center gap-2 font-semibold text-emerald-900">
								<FiFileText className="h-4 w-4 flex-none text-emerald-600" />
								<span>
									We will respond using <strong>{email}</strong>
								</span>
							</div>
							<div className="flex items-center gap-2 font-semibold text-emerald-900">
								<FiShield className="h-4 w-4 flex-none text-emerald-600" />
								<span>No payment is required to submit an inquiry.</span>
							</div>
						</div>

						<div className="pt-2">
							<button
								type="button"
								onClick={onClose}
								className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
							>
								Return to Product Overview
							</button>
						</div>
					</div>
				) : (
					/* Quotation Request Form */
					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Header */}
						<div className="space-y-1 border-b border-gray-100 pb-3">
							<div className="flex items-center gap-2">
								<span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-bold tracking-wider text-emerald-800 uppercase">
									<HiOutlineSparkles className="h-3.5 w-3.5 text-emerald-600" />
									{isSampleMode
										? 'Sample Evaluation'
										: 'Direct Factory Quotation (RFQ)'}
								</span>
								{sku && (
									<span className="font-mono text-xs text-gray-400">
										SKU: {sku}
									</span>
								)}
							</div>
							<h2 className="text-lg font-bold text-gray-900 sm:text-xl">
								{isSampleMode
									? `Request Evaluation Sample: ${productTitle}`
									: `Request Official Landed Quotation: ${productTitle}`}
							</h2>
							<p className="text-xs text-gray-500">
								Receive a comprehensive Proforma Invoice with container load
								plans, technical specifications, and shipping schedules.
							</p>
						</div>

						{/* Product Batch Summary Pill */}
						<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
							<div className="flex items-center gap-3">
								{image && (
									<img
										src={image}
										alt={productTitle}
										className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
									/>
								)}
								<div>
									<p className="line-clamp-1 font-semibold text-gray-900">
										{productTitle}
									</p>
									<span className="font-mono text-gray-500">
										Terms: {selectedIncoterm} Vietnam Port
									</span>
								</div>
							</div>
							<div className="text-right">
								<span className="block text-[11px] text-gray-500">
									Estimated Value:
								</span>
								<strong className="text-sm font-extrabold text-slate-900">
									{isSampleMode
										? 'Free Sample (Freight quoted)'
										: formatPrice(estimatedBatchTotal)}
								</strong>
							</div>
						</div>

						{error && (
							<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
								<FiAlertCircle className="h-4 w-4 flex-none text-red-600" />
								<span>{error}</span>
							</div>
						)}

						{/* Section 1: Contact Information */}
						<div className="space-y-3">
							<h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-800 uppercase">
								<FiUser className="text-primary" />
								1. Business Contact Details
							</h4>

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<div>
									<label className="mb-1 block text-xs font-medium text-gray-700">
										Full Name <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<input
											type="text"
											required
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="e.g. Johnathan Miller"
											className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-8 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
										/>
										<FiUser className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-gray-400" />
									</div>
								</div>

								<div>
									<label className="mb-1 block text-xs font-medium text-gray-700">
										Work Email <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<input
											type="email"
											required
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="name@company.com"
											className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-8 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
										/>
										<FiMail className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-gray-400" />
									</div>
									{hasWorkEmailNotice && (
										<p className="mt-1 flex items-center gap-1 text-[11px] text-amber-700">
											<FiInfo className="h-3 w-3 flex-none text-amber-600" />
											<span>
												Providing a corporate email prioritizes your inquiry in
												our wholesale queue.
											</span>
										</p>
									)}
								</div>

								<div>
									<label className="mb-1 block text-xs font-medium text-gray-700">
										Company / Organization Name{' '}
										<span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<input
											type="text"
											required
											value={companyName}
											onChange={(e) => setCompanyName(e.target.value)}
											placeholder="e.g. Eco Distributors LLC"
											className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-8 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
										/>
										<FiBriefcase className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-gray-400" />
									</div>
								</div>

								<div>
									<label className="mb-1 block text-xs font-medium text-gray-700">
										Phone / WhatsApp (with country code)
									</label>
									<div className="relative">
										<input
											type="tel"
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
											placeholder="+1 (555) 000-0000"
											className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-8 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
										/>
										<FiPhone className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-gray-400" />
									</div>
								</div>
							</div>
						</div>

						{/* Section 2: Order & Commercial Logistics */}
						<div className="space-y-3 pt-1">
							<h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-800 uppercase">
								<FiGlobe className="text-primary" />
								2. Order Volume & Shipping Logistics
							</h4>

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
								<div>
									<label className="mb-1 block text-xs font-medium text-gray-700">
										Target Order Units
									</label>
									<input
										type="number"
										min={1}
										value={orderQuantity}
										onChange={(e) =>
											setOrderQuantity(Math.max(1, Number(e.target.value) || 1))
										}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
									/>
								</div>

								<div>
									<label className="mb-1 block text-xs font-medium text-gray-700">
										Incoterm Preference
									</label>
									<select
										value={selectedIncoterm}
										onChange={(e) => setSelectedIncoterm(e.target.value)}
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
									>
										<option value="FOB">
											FOB (Free On Board - Vietnam Port)
										</option>
										<option value="CIF">
											CIF (Cost, Insurance & Freight to Your Port)
										</option>
										<option value="EXW">EXW (Ex-Works - Factory Gate)</option>
										<option value="DDP">
											DDP (Delivered Duty Paid - Direct to Warehouse)
										</option>
									</select>
								</div>

								<div>
									<label className="mb-1 block text-xs font-medium text-gray-700">
										Destination Country
									</label>
									<input
										type="text"
										value={country}
										onChange={(e) => setCountry(e.target.value)}
										placeholder="e.g. United States, Germany, Japan"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<div>
									<label className="mb-1 block text-xs font-medium text-gray-700">
										Destination Port / City
									</label>
									<input
										type="text"
										value={destinationPort}
										onChange={(e) => setDestinationPort(e.target.value)}
										placeholder="e.g. Long Beach Port, CA / Hamburg / Rotterdam"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
									/>
								</div>

								<div>
									<label className="mb-1 block text-xs font-medium text-gray-700">
										Target Delivery Schedule
									</label>
									<input
										type="text"
										value={targetDeliveryDate}
										onChange={(e) => setTargetDeliveryDate(e.target.value)}
										placeholder="e.g. Q3 2026 / Immediate dispatch"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
									/>
								</div>
							</div>

							<div>
								<label className="mb-1 block text-xs font-medium text-gray-700">
									Custom OEM / Private Label / Packaging Requirements
								</label>
								<textarea
									rows={2}
									value={customizationRequirements}
									onChange={(e) => setCustomizationRequirements(e.target.value)}
									placeholder="e.g. Laser engraving logo on bottom, custom barcoded retail box, FSC certified paper wrapper..."
									className="w-full rounded-lg border border-gray-300 p-2.5 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
								/>
							</div>
						</div>

						{/* Submit Button & Zero-Payment Reassurance */}
						<div className="space-y-2 border-t border-gray-100 pt-2">
							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full cursor-pointer rounded-xl bg-slate-900 py-3 text-center text-xs font-extrabold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 sm:text-sm"
							>
								{isSubmitting
									? 'Submitting Request...'
									: isSampleMode
										? 'Submit Evaluation Sample Request'
										: 'Submit Official Quotation Request (No Payment)'}
							</button>

							<div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
								<FiShield className="h-3.5 w-3.5 flex-none text-emerald-600" />
								<span>
									No payment required today. Our team will review your
									requirements.
								</span>
							</div>
						</div>
					</form>
				)}
			</div>
		</div>
	)
}
