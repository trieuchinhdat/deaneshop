'use client'

import { useRouter } from 'next/navigation'
import { isStaticStorefront } from '@/lib/deployment-profile'
import { isRuntimePath } from '@/lib/static-runtime-routes'
import { useEffect, useId, useRef, useState } from 'react'
import {
	FiArrowRight,
	FiBriefcase,
	FiCheckCircle,
	FiDollarSign,
	FiGlobe,
	FiLock,
	FiMail,
	FiMessageSquare,
	FiPhone,
	FiShield,
	FiUser,
	FiX,
} from 'react-icons/fi'
import { recordPageVisit } from '@/lib/journey-tracker'
import { leadSubmissionKey, retireLeadSubmission } from '@/lib/lead-submission'
import { buildTrackingPayload } from '@/lib/tracking-payload'
import { cn } from '@/lib/utils'

export interface LeadCaptureFormClientProps {
	badge?: string
	headline?: string
	subtitle?: string
	benefits?: string[]
	fieldOptions?: {
		showName?: boolean
		nameRequired?: boolean
		showEmail?: boolean
		emailRequired?: boolean
		showPhone?: boolean
		phoneRequired?: boolean
		showCompany?: boolean
		companyRequired?: boolean
		showCountry?: boolean
		countryRequired?: boolean
		showBudget?: boolean
		budgetRequired?: boolean
		showMessage?: boolean
		messageRequired?: boolean
		messagePlaceholder?: string
		showConsent?: boolean
		consentRequired?: boolean
		consentText?: string
	}
	ctaText?: string
	ctaSubtext?: string
	leadSource?: string
	successBehavior?: {
		action?: 'message' | 'redirect'
		thankYouHeading?: string
		thankYouMessage?: string
		redirectUrl?: string
	}
	layout?: 'split' | 'card' | 'centered'
	bgStyle?: 'white' | 'slate' | 'gradient' | 'dark'
}

export default function LeadCaptureFormClient({
	badge,
	headline = 'Request Your Free Quote & Consultation',
	subtitle = 'Fill out the form below and one of our dedicated commercial specialists will connect with you within 24 business hours to discuss your project.',
	benefits = [
		'Fast turnaround with 24-hour response guarantee',
		'Tailored quotation matching your exact business specifications',
		'Completely free with zero purchase obligation',
		'Strict confidentiality & non-disclosure protection',
	],
	fieldOptions = {
		showName: true,
		nameRequired: true,
		showEmail: true,
		emailRequired: true,
		showPhone: true,
		phoneRequired: false,
		showCompany: true,
		companyRequired: false,
		showCountry: false,
		countryRequired: false,
		showBudget: false,
		budgetRequired: false,
		showMessage: true,
		messageRequired: false,
		messagePlaceholder:
			'Tell us about your requirements, specifications, or questions...',
		showConsent: false,
		consentRequired: true,
		consentText:
			'I agree to receive communications regarding this inquiry and accept the Privacy Policy.',
	},
	ctaText = 'Request Free Quote',
	ctaSubtext = '100% confidential. Strict privacy and zero spam guarantee.',
	leadSource,
	successBehavior = {
		action: 'message',
		thankYouHeading: 'Thank you! We received your request.',
		thankYouMessage:
			'A representative will review your inquiry and reach out within 24 hours. Check your inbox for confirmation.',
	},
	layout = 'split',
	bgStyle = 'slate',
}: LeadCaptureFormClientProps) {
	const router = useRouter()
	const formId = useId()
	const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [company, setCompany] = useState('')
	const [country, setCountry] = useState('')
	const [budget, setBudget] = useState('')
	const [message, setMessage] = useState('')
	const [consent, setConsent] = useState(false)
	const [selectedTierSpec, setSelectedTierSpec] = useState<string | null>(null)

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isSuccess, setIsSuccess] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	// Clean up redirect timeout on unmount
	useEffect(() => {
		return () => {
			if (redirectTimeoutRef.current) {
				clearTimeout(redirectTimeoutRef.current)
			}
		}
	}, [])

	// Record mount visit and listen for Tiered Volume Pricing RFQ prefill selections
	useEffect(() => {
		if (typeof window !== 'undefined') {
			recordPageVisit('Lead Consultation Request')

			// Listen for Tiered Volume Pricing RFQ prefill selections
			const handleTierSelect = (e: any) => {
				const detail = e.detail
				if (!detail) return
				const formattedQty = Number(detail.quantity || 0).toLocaleString(
					'en-US',
				)
				const rateText = detail.unitPrice
					? `${detail.unitPrice} / unit (${detail.incoterm || 'FOB'})`
					: 'VIP Custom Factory Quote'
				const costText = detail.totalCost
					? detail.totalCost
					: 'To be confirmed on proforma'
				const savingsText = detail.savings
					? ` | Est. Savings: ${detail.savings}`
					: ''

				const quoteSpec = `[Wholesale Ingestion] Requested Order Volume: ${formattedQty} pcs\n• Target Unit Rate: ${rateText}\n• Est. Batch Investment: ${costText}${savingsText}`

				setSelectedTierSpec(`${formattedQty} units (${rateText})`)

				setMessage((prev) => {
					if (!prev || prev.includes('[Wholesale Ingestion]')) {
						return quoteSpec
					}
					return `${quoteSpec}\n\nAdditional Requirements:\n${prev}`
				})
			}

			window.addEventListener('tiered-pricing:select', handleTierSelect)
			return () =>
				window.removeEventListener('tiered-pricing:select', handleTierSelect)
		}
	}, [])

	const handleReset = () => {
		setIsSuccess(false)
		setName('')
		setEmail('')
		setPhone('')
		setCompany('')
		setCountry('')
		setBudget('')
		setMessage('')
		setConsent(false)
		setSelectedTierSpec(null)
		setErrorMessage(null)
	}

	const handleClearTier = () => {
		setSelectedTierSpec(null)
		setMessage((prev) => {
			if (!prev.includes('[Wholesale Ingestion]')) return prev
			// Strip out the [Wholesale Ingestion] block
			const parts = prev.split('Additional Requirements:\n')
			return parts.length > 1 ? parts[1] : ''
		})
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setErrorMessage(null)

		// Validate consent if configured and mandatory
		if (
			fieldOptions?.showConsent &&
			fieldOptions?.consentRequired &&
			!consent
		) {
			setErrorMessage('Please accept the consent terms to submit your request.')
			return
		}

		setIsSubmitting(true)

		try {
			const tracking = buildTrackingPayload()
			const internalNotesArray: string[] = []
			if (company.trim()) {
				internalNotesArray.push(`Company: ${company.trim()}`)
			}
			if (fieldOptions?.showConsent && consent) {
				internalNotesArray.push(`Consent granted: ${new Date().toISOString()}`)
			}

			const payload = {
				...tracking,
				consent,
				name: name.trim() || 'Prospective Client',
				email: email.trim() || undefined,
				phone: phone.trim() || undefined,
				country: country.trim() || undefined,
				company_name: company.trim() || undefined,
				budget_range: budget.trim() || undefined,
				message: company.trim()
					? `[Company: ${company.trim()}]\n\n${message.trim()}`
					: message.trim(),
				source: leadSource || 'lead_capture_form',
				internal_notes:
					internalNotesArray.length > 0
						? internalNotesArray.join(' | ')
						: undefined,
			}

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
				throw new Error(
					result.error || 'Failed to submit form. Please try again.',
				)
			}

			await retireLeadSubmission(payload)
			setIsSuccess(true)

			if (
				successBehavior.action === 'redirect' &&
				successBehavior.redirectUrl
			) {
				const dest = successBehavior.redirectUrl
				redirectTimeoutRef.current = setTimeout(() => {
					if (dest.startsWith('/') && !(isStaticStorefront && isRuntimePath(new URL(dest, window.location.href).pathname))) {
						router.push(dest)
					} else {
						window.location.assign(dest)
					}
				}, 1200)
			}
		} catch (err: any) {
			setErrorMessage(
				err.message ||
					'Something went wrong. Please check your network connection and try again.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	const isDark = bgStyle === 'dark'

	const bgContainerClasses = {
		white: 'bg-background text-foreground border-border/80',
		slate: 'bg-surface text-foreground border-border/80',
		gradient:
			'bg-linear-to-br from-primary/10 via-surface to-background text-foreground border-primary/20',
		dark: 'bg-gray-950 text-white border-gray-800',
	}[bgStyle]

	const inputBaseClasses = cn(
		'w-full rounded-xl border px-3.5 py-3 text-sm transition-all duration-200 outline-none',
		isDark
			? 'bg-gray-900 border-gray-700/80 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
			: 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/15 shadow-2xs',
	)

	return (
		<div
			className={cn(
				'relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all sm:p-8 lg:p-12',
				bgContainerClasses,
			)}
		>
			{/* Decorative ambient background accents */}
			<div
				className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl"
				aria-hidden="true"
			/>
			<div
				className="bg-primary/5 pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl"
				aria-hidden="true"
			/>

			{layout === 'split' ? (
				<div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
					{/* Left Column: Headlines, Value Props & Trust Badges */}
					<div className="space-y-6 lg:col-span-6">
						{badge && (
							<div
								className={cn(
									'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide',
									isDark
										? 'bg-primary/20 text-primary-foreground border-primary/30 border'
										: 'bg-primary/10 text-primary border-primary/20 border',
								)}
							>
								<span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
								<span>{badge}</span>
							</div>
						)}

						<h2
							className={cn(
								'text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl lg:leading-tight',
								isDark ? 'text-white' : 'text-gray-950',
							)}
						>
							{headline}
						</h2>

						<p
							className={cn(
								'text-sm leading-relaxed sm:text-base',
								isDark ? 'text-gray-300' : 'text-gray-600',
							)}
						>
							{subtitle}
						</p>

						{benefits && benefits.length > 0 && (
							<div className="space-y-3.5 pt-2">
								{benefits.map((benefit, idx) => (
									<div key={idx} className="flex items-start gap-3">
										<div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
											<FiCheckCircle className="h-4 w-4" aria-hidden="true" />
										</div>
										<span
											className={cn(
												'text-sm leading-snug font-medium',
												isDark ? 'text-gray-200' : 'text-gray-700',
											)}
										>
											{benefit}
										</span>
									</div>
								))}
							</div>
						)}

						{/* Security & Confidentiality Pill */}
						<div
							className={cn(
								'mt-6 inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium',
								isDark
									? 'border-gray-800 bg-gray-900/60 text-gray-300'
									: 'bg-background/80 border-border text-gray-600',
							)}
						>
							<FiShield
								className="h-4 w-4 text-emerald-500"
								aria-hidden="true"
							/>
							<span>
								256-bit encrypted submission • Non-disclosure protected
							</span>
						</div>
					</div>

					{/* Right Column: Form Container Card */}
					<div className="lg:col-span-6">
						<div
							className={cn(
								'rounded-2xl border p-5 shadow-xl transition-all sm:p-7 lg:p-8',
								isDark
									? 'border-gray-800 bg-gray-900/90'
									: 'border-gray-200/90 bg-white/95 backdrop-blur-md',
							)}
						>
							{isSuccess ? (
								<SuccessBox
									successBehavior={successBehavior}
									isDark={isDark}
									onReset={handleReset}
								/>
							) : (
								<FormInner
									formId={formId}
									name={name}
									setName={setName}
									email={email}
									setEmail={setEmail}
									phone={phone}
									setPhone={setPhone}
									company={company}
									setCompany={setCompany}
									country={country}
									setCountry={setCountry}
									budget={budget}
									setBudget={setBudget}
									message={message}
									setMessage={setMessage}
									consent={consent}
									setConsent={setConsent}
									selectedTierSpec={selectedTierSpec}
									onClearTier={handleClearTier}
									fieldOptions={fieldOptions}
									ctaText={ctaText}
									ctaSubtext={ctaSubtext}
									isSubmitting={isSubmitting}
									errorMessage={errorMessage}
									inputBaseClasses={inputBaseClasses}
									isDark={isDark}
									onSubmit={handleSubmit}
								/>
							)}
						</div>
					</div>
				</div>
			) : layout === 'centered' ? (
				/* Centered Minimal Layout */
				<div className="relative z-10 mx-auto max-w-2xl text-center">
					{badge && (
						<div
							className={cn(
								'mb-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide',
								isDark
									? 'bg-primary/20 text-primary-foreground border-primary/30 border'
									: 'bg-primary/10 text-primary border-primary/20 border',
							)}
						>
							<span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
							<span>{badge}</span>
						</div>
					)}

					<h2
						className={cn(
							'text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl',
							isDark ? 'text-white' : 'text-gray-950',
						)}
					>
						{headline}
					</h2>

					<p
						className={cn(
							'mt-3 mb-8 text-sm leading-relaxed sm:text-base',
							isDark ? 'text-gray-300' : 'text-gray-600',
						)}
					>
						{subtitle}
					</p>

					<div
						className={cn(
							'rounded-2xl border p-5 text-left shadow-xl sm:p-8',
							isDark
								? 'border-gray-800 bg-gray-900/90'
								: 'border-gray-200/90 bg-white/95 backdrop-blur-md',
						)}
					>
						{isSuccess ? (
							<SuccessBox
								successBehavior={successBehavior}
								isDark={isDark}
								onReset={handleReset}
							/>
						) : (
							<FormInner
								formId={formId}
								name={name}
								setName={setName}
								email={email}
								setEmail={setEmail}
								phone={phone}
								setPhone={setPhone}
								company={company}
								setCompany={setCompany}
								country={country}
								setCountry={setCountry}
								budget={budget}
								setBudget={setBudget}
								message={message}
								setMessage={setMessage}
								consent={consent}
								setConsent={setConsent}
								selectedTierSpec={selectedTierSpec}
								onClearTier={handleClearTier}
								fieldOptions={fieldOptions}
								ctaText={ctaText}
								ctaSubtext={ctaSubtext}
								isSubmitting={isSubmitting}
								errorMessage={errorMessage}
								inputBaseClasses={inputBaseClasses}
								isDark={isDark}
								onSubmit={handleSubmit}
							/>
						)}
					</div>
				</div>
			) : (
				/* Contained Card Layout */
				<div className="relative z-10 mx-auto max-w-2xl">
					<div className="mb-6 space-y-3 text-center sm:mb-8">
						{badge && (
							<div
								className={cn(
									'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide',
									isDark
										? 'bg-primary/20 text-primary-foreground border-primary/30 border'
										: 'bg-primary/10 text-primary border-primary/20 border',
								)}
							>
								<span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
								<span>{badge}</span>
							</div>
						)}
						<h2
							className={cn(
								'text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl',
								isDark ? 'text-white' : 'text-gray-950',
							)}
						>
							{headline}
						</h2>
						<p
							className={cn(
								'mx-auto max-w-xl text-sm leading-relaxed sm:text-base',
								isDark ? 'text-gray-300' : 'text-gray-600',
							)}
						>
							{subtitle}
						</p>
					</div>

					<div
						className={cn(
							'rounded-2xl border p-5 shadow-xl sm:p-8 lg:p-10',
							isDark
								? 'border-gray-800 bg-gray-900/90'
								: 'border-gray-200/90 bg-white/95 backdrop-blur-md',
						)}
					>
						{isSuccess ? (
							<SuccessBox
								successBehavior={successBehavior}
								isDark={isDark}
								onReset={handleReset}
							/>
						) : (
							<FormInner
								formId={formId}
								name={name}
								setName={setName}
								email={email}
								setEmail={setEmail}
								phone={phone}
								setPhone={setPhone}
								company={company}
								setCompany={setCompany}
								country={country}
								setCountry={setCountry}
								budget={budget}
								setBudget={setBudget}
								message={message}
								setMessage={setMessage}
								consent={consent}
								setConsent={setConsent}
								selectedTierSpec={selectedTierSpec}
								onClearTier={handleClearTier}
								fieldOptions={fieldOptions}
								ctaText={ctaText}
								ctaSubtext={ctaSubtext}
								isSubmitting={isSubmitting}
								errorMessage={errorMessage}
								inputBaseClasses={inputBaseClasses}
								isDark={isDark}
								onSubmit={handleSubmit}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

function FormInner({
	formId,
	name,
	setName,
	email,
	setEmail,
	phone,
	setPhone,
	company,
	setCompany,
	country,
	setCountry,
	budget,
	setBudget,
	message,
	setMessage,
	consent,
	setConsent,
	selectedTierSpec,
	onClearTier,
	fieldOptions,
	ctaText,
	ctaSubtext,
	isSubmitting,
	errorMessage,
	inputBaseClasses,
	isDark,
	onSubmit,
}: {
	formId: string
	name: string
	setName: (v: string) => void
	email: string
	setEmail: (v: string) => void
	phone: string
	setPhone: (v: string) => void
	company: string
	setCompany: (v: string) => void
	country: string
	setCountry: (v: string) => void
	budget: string
	setBudget: (v: string) => void
	message: string
	setMessage: React.Dispatch<React.SetStateAction<string>>
	consent: boolean
	setConsent: (v: boolean) => void
	selectedTierSpec: string | null
	onClearTier: () => void
	fieldOptions?: LeadCaptureFormClientProps['fieldOptions']
	ctaText: string
	ctaSubtext?: string
	isSubmitting: boolean
	errorMessage: string | null
	inputBaseClasses: string
	isDark: boolean
	onSubmit: (e: React.FormEvent) => void
}) {
	const showName = fieldOptions?.showName !== false
	const showEmail = fieldOptions?.showEmail !== false
	const showPhone = fieldOptions?.showPhone !== false
	const showCompany = Boolean(fieldOptions?.showCompany)
	const showCountry = Boolean(fieldOptions?.showCountry)
	const showBudget = Boolean(fieldOptions?.showBudget)
	const showMessage = fieldOptions?.showMessage !== false
	const showConsent = Boolean(fieldOptions?.showConsent)

	const nameId = `${formId}-name`
	const emailId = `${formId}-email`
	const phoneId = `${formId}-phone`
	const companyId = `${formId}-company`
	const countryId = `${formId}-country`
	const budgetId = `${formId}-budget`
	const messageId = `${formId}-message`
	const consentId = `${formId}-consent`

	const labelClasses = cn(
		'mb-1.5 block text-xs font-semibold tracking-wide',
		isDark ? 'text-gray-300' : 'text-gray-700',
	)

	return (
		<form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
			{/* Error Alert */}
			{errorMessage && (
				<div
					role="alert"
					aria-live="assertive"
					className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-medium text-red-600 sm:text-sm"
				>
					{errorMessage}
				</div>
			)}

			{/* Pre-selected Volume Quote Chip */}
			{selectedTierSpec && (
				<div className="border-primary/20 bg-primary/5 text-primary flex items-center justify-between rounded-xl border px-3.5 py-2 text-xs font-medium">
					<div className="flex items-center gap-2 overflow-hidden">
						<span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
							Attached Tier
						</span>
						<span className="truncate">{selectedTierSpec}</span>
					</div>
					<button
						type="button"
						onClick={onClearTier}
						className="text-muted-foreground hover:text-foreground ml-2 inline-flex items-center gap-0.5 text-[11px]"
						title="Remove attached tier"
					>
						<FiX className="h-3.5 w-3.5" aria-hidden="true" />
						<span className="sr-only">Remove attached volume tier</span>
					</button>
				</div>
			)}

			{/* Contact Row: Name & Email */}
			{(showName || showEmail) && (
				<div className="grid gap-4 sm:grid-cols-2">
					{showName && (
						<div className={cn(showEmail ? 'sm:col-span-1' : 'sm:col-span-2')}>
							<label htmlFor={nameId} className={labelClasses}>
								Full Name{' '}
								{fieldOptions?.nameRequired && (
									<span className="text-red-500" aria-hidden="true">
										*
									</span>
								)}
								{fieldOptions?.nameRequired && (
									<span className="sr-only">(required)</span>
								)}
							</label>
							<div className="relative">
								<FiUser
									className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400"
									aria-hidden="true"
								/>
								<input
									id={nameId}
									type="text"
									name="fullName"
									autoComplete="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required={fieldOptions?.nameRequired}
									aria-required={
										fieldOptions?.nameRequired ? 'true' : undefined
									}
									placeholder="John Doe"
									className={cn(inputBaseClasses, 'pl-10')}
								/>
							</div>
						</div>
					)}

					{showEmail && (
						<div className={cn(showName ? 'sm:col-span-1' : 'sm:col-span-2')}>
							<label htmlFor={emailId} className={labelClasses}>
								Work Email{' '}
								{fieldOptions?.emailRequired && (
									<span className="text-red-500" aria-hidden="true">
										*
									</span>
								)}
								{fieldOptions?.emailRequired && (
									<span className="sr-only">(required)</span>
								)}
							</label>
							<div className="relative">
								<FiMail
									className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400"
									aria-hidden="true"
								/>
								<input
									id={emailId}
									type="email"
									name="email"
									inputMode="email"
									autoComplete="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required={fieldOptions?.emailRequired}
									aria-required={
										fieldOptions?.emailRequired ? 'true' : undefined
									}
									placeholder="john@company.com"
									className={cn(inputBaseClasses, 'pl-10')}
								/>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Business Contact Row: Phone & Company */}
			{(showPhone || showCompany) && (
				<div className="grid gap-4 sm:grid-cols-2">
					{showPhone && (
						<div
							className={cn(showCompany ? 'sm:col-span-1' : 'sm:col-span-2')}
						>
							<label htmlFor={phoneId} className={labelClasses}>
								Phone / WhatsApp{' '}
								{fieldOptions?.phoneRequired && (
									<span className="text-red-500" aria-hidden="true">
										*
									</span>
								)}
								{fieldOptions?.phoneRequired && (
									<span className="sr-only">(required)</span>
								)}
							</label>
							<div className="relative">
								<FiPhone
									className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400"
									aria-hidden="true"
								/>
								<input
									id={phoneId}
									type="tel"
									name="phone"
									inputMode="tel"
									autoComplete="tel"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									required={fieldOptions?.phoneRequired}
									aria-required={
										fieldOptions?.phoneRequired ? 'true' : undefined
									}
									placeholder="+1 (555) 000-0000"
									className={cn(inputBaseClasses, 'pl-10')}
								/>
							</div>
						</div>
					)}

					{showCompany && (
						<div className={cn(showPhone ? 'sm:col-span-1' : 'sm:col-span-2')}>
							<label htmlFor={companyId} className={labelClasses}>
								Company / Organization{' '}
								{fieldOptions?.companyRequired && (
									<span className="text-red-500" aria-hidden="true">
										*
									</span>
								)}
								{fieldOptions?.companyRequired && (
									<span className="sr-only">(required)</span>
								)}
							</label>
							<div className="relative">
								<FiBriefcase
									className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400"
									aria-hidden="true"
								/>
								<input
									id={companyId}
									type="text"
									name="company"
									autoComplete="organization"
									value={company}
									onChange={(e) => setCompany(e.target.value)}
									required={fieldOptions?.companyRequired}
									aria-required={
										fieldOptions?.companyRequired ? 'true' : undefined
									}
									placeholder="Acme Enterprises"
									className={cn(inputBaseClasses, 'pl-10')}
								/>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Qualification Row: Country & Budget Range */}
			{(showCountry || showBudget) && (
				<div className="grid gap-4 sm:grid-cols-2">
					{showCountry && (
						<div className={cn(showBudget ? 'sm:col-span-1' : 'sm:col-span-2')}>
							<label htmlFor={countryId} className={labelClasses}>
								Destination Country / Region{' '}
								{fieldOptions?.countryRequired && (
									<span className="text-red-500" aria-hidden="true">
										*
									</span>
								)}
								{fieldOptions?.countryRequired && (
									<span className="sr-only">(required)</span>
								)}
							</label>
							<div className="relative">
								<FiGlobe
									className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400"
									aria-hidden="true"
								/>
								<input
									id={countryId}
									type="text"
									name="country"
									autoComplete="country-name"
									value={country}
									onChange={(e) => setCountry(e.target.value)}
									required={fieldOptions?.countryRequired}
									aria-required={
										fieldOptions?.countryRequired ? 'true' : undefined
									}
									placeholder="United States, United Kingdom, etc."
									className={cn(inputBaseClasses, 'pl-10')}
								/>
							</div>
						</div>
					)}

					{showBudget && (
						<div
							className={cn(showCountry ? 'sm:col-span-1' : 'sm:col-span-2')}
						>
							<label htmlFor={budgetId} className={labelClasses}>
								Estimated Budget / Volume{' '}
								{fieldOptions?.budgetRequired && (
									<span className="text-red-500" aria-hidden="true">
										*
									</span>
								)}
								{fieldOptions?.budgetRequired && (
									<span className="sr-only">(required)</span>
								)}
							</label>
							<div className="relative">
								<FiDollarSign
									className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400"
									aria-hidden="true"
								/>
								<select
									id={budgetId}
									name="budget"
									value={budget}
									onChange={(e) => setBudget(e.target.value)}
									required={fieldOptions?.budgetRequired}
									aria-required={
										fieldOptions?.budgetRequired ? 'true' : undefined
									}
									className={cn(
										inputBaseClasses,
										'cursor-pointer appearance-none pl-10',
									)}
								>
									<option value="">Select an estimated volume tier...</option>
									<option value="< $10,000">
										&lt; $10,000 (Pilot / Samples)
									</option>
									<option value="$10,000 - $50,000">
										$10,000 - $50,000 (Standard Order)
									</option>
									<option value="$50,000 - $250,000">
										$50,000 - $250,000 (Commercial Batch)
									</option>
									<option value="$250,000+">
										$250,000+ (Enterprise Volume)
									</option>
								</select>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Project Notes & Inquiry Description */}
			{showMessage && (
				<div>
					<label htmlFor={messageId} className={labelClasses}>
						Inquiry & Specification Details{' '}
						{fieldOptions?.messageRequired && (
							<span className="text-red-500" aria-hidden="true">
								*
							</span>
						)}
						{fieldOptions?.messageRequired && (
							<span className="sr-only">(required)</span>
						)}
					</label>
					<div className="relative">
						<FiMessageSquare
							className="pointer-events-none absolute top-3.5 left-3.5 text-gray-400"
							aria-hidden="true"
						/>
						<textarea
							id={messageId}
							name="message"
							rows={3}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							required={fieldOptions?.messageRequired}
							aria-required={fieldOptions?.messageRequired ? 'true' : undefined}
							placeholder={
								fieldOptions?.messagePlaceholder ||
								'Tell us about your requirements, specifications, target delivery date, or questions...'
							}
							className={cn(inputBaseClasses, 'min-h-[96px] resize-none pl-10')}
						/>
					</div>
				</div>
			)}

			{/* GDPR / Privacy Policy Consent Checkbox */}
			{showConsent && (
				<div className="pt-1">
					<div className="flex items-start gap-2.5">
						<input
							id={consentId}
							type="checkbox"
							name="consent"
							checked={consent}
							onChange={(e) => setConsent(e.target.checked)}
							required={fieldOptions?.consentRequired}
							aria-required={fieldOptions?.consentRequired ? 'true' : undefined}
							className="text-primary focus:ring-primary mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 focus:ring-2 focus:ring-offset-1"
						/>
						<label
							htmlFor={consentId}
							className={cn(
								'cursor-pointer text-xs leading-normal select-none',
								isDark ? 'text-gray-300' : 'text-gray-600',
							)}
						>
							{fieldOptions?.consentText ||
								'I agree to receive communications regarding this inquiry and accept the Privacy Policy.'}
							{fieldOptions?.consentRequired && (
								<span className="ml-0.5 text-red-500" aria-hidden="true">
									*
								</span>
							)}
						</label>
					</div>
				</div>
			)}

			{/* Submit Button & Trust Subtext */}
			<div className="pt-2">
				<button
					type="submit"
					disabled={isSubmitting}
					className="group bg-primary text-primary-foreground focus-visible:ring-primary relative flex h-11 w-full items-center justify-center gap-2 rounded-xl px-6 text-center text-xs font-bold shadow-md transition-all outline-none hover:opacity-95 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-70 sm:h-12 sm:text-sm"
				>
					{isSubmitting ? (
						<div className="flex items-center gap-2">
							<svg
								className="h-5 w-5 animate-spin text-white"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8v8H4z"
								/>
							</svg>
							<span>Submitting Request...</span>
						</div>
					) : (
						<>
							<span>{ctaText}</span>
							<FiArrowRight
								className="h-4 w-4 transition-transform group-hover:translate-x-1"
								aria-hidden="true"
							/>
						</>
					)}
				</button>

				{ctaSubtext && (
					<p
						className={cn(
							'mt-3 flex items-center justify-center gap-1.5 text-center text-xs',
							isDark ? 'text-gray-400' : 'text-gray-500',
						)}
					>
						<FiLock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
						<span>{ctaSubtext}</span>
					</p>
				)}
			</div>
		</form>
	)
}

function SuccessBox({
	successBehavior,
	isDark,
	onReset,
}: {
	successBehavior?: LeadCaptureFormClientProps['successBehavior']
	isDark: boolean
	onReset: () => void
}) {
	return (
		<div
			role="status"
			aria-live="polite"
			className="animate-in fade-in py-8 text-center duration-300 sm:py-10"
		>
			<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 ring-8 ring-emerald-500/10">
				<FiCheckCircle className="h-8 w-8" aria-hidden="true" />
			</div>
			<h3
				className={cn(
					'text-xl font-bold tracking-tight sm:text-2xl',
					isDark ? 'text-white' : 'text-gray-950',
				)}
			>
				{successBehavior?.thankYouHeading ||
					'Thank you! We received your request.'}
			</h3>
			<p
				className={cn(
					'mx-auto mt-2.5 max-w-md text-sm leading-relaxed',
					isDark ? 'text-gray-300' : 'text-gray-600',
				)}
			>
				{successBehavior?.thankYouMessage ||
					'A representative will review your inquiry and reach out within 24 business hours.'}
			</p>
			{successBehavior?.action === 'redirect' &&
				successBehavior.redirectUrl && (
					<p className="text-muted-foreground mt-3 animate-pulse text-xs">
						Redirecting to confirmation page...
					</p>
				)}
			<button
				type="button"
				onClick={onReset}
				className="text-primary mt-6 inline-flex items-center text-xs font-semibold underline underline-offset-4 transition-opacity hover:opacity-80"
			>
				Submit another inquiry
			</button>
		</div>
	)
}
