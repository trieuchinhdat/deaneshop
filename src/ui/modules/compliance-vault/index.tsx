'use client'

import Image from 'next/image'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
	HiArrowPath,
	HiOutlineArrowDownTray,
	HiOutlineArrowTopRightOnSquare,
	HiOutlineCheck,
	HiOutlineCheckBadge,
	HiOutlineCheckCircle,
	HiOutlineDocumentText,
	HiOutlineExclamationCircle,
	HiOutlineLockClosed,
	HiOutlineShieldCheck,
	HiXMark,
} from 'react-icons/hi2'
import { leadSubmissionKey, retireLeadSubmission } from '@/lib/lead-submission'
import { buildTrackingPayload } from '@/lib/tracking-payload'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import { moduleAttributes, type ModuleProps } from '../module-utils'

export type CertItem = {
	_key?: string
	_type?: string
	title?: string
	issuer?: string
	code?: string
	scope?: string
	validUntil?: string
	description?: string
	badgeIcon?: any
	verifyUrl?: string
}

export type GatedDocItem = {
	_key?: string
	_type?: string
	assetId?: string
	hasFile?: boolean
	title?: string
	category?: 'audit' | 'specs' | 'catalog' | 'test' | 'esg' | string
	description?: string
	fileSize?: string
	fileAsset?: {
		_type?: string
		asset?: {
			_id?: string
			originalFilename?: string
			size?: number
			mimeType?: string
			extension?: string
		}
	}
}

export type FactoryMetric = {
	_key?: string
	_type?: string
	label?: string
	value?: string
	subtitle?: string
}

export type ComplianceVaultProps = ModuleProps & {
	badge?: string
	headline?: string
	subtitle?: string
	headerAlignment?: 'center' | 'left'
	showMetrics?: boolean
	showCertificates?: boolean
	showGatedDocuments?: boolean
	certificatesTitle?: string
	certificatesSubtitle?: string
	certificates?: CertItem[]
	dossierBadge?: string
	dossierHeadline?: string
	dossierSubtitle?: string
	privacyNotice?: string
	gatedDocuments?: GatedDocItem[]
	factoryMetrics?: FactoryMetric[]
	vaultTheme?: 'dark' | 'light'
	sanityAttr?: any
}

const CATEGORY_TAGS: Record<string, { label: string; badgeClass: string }> = {
	audit: {
		label: 'Factory Audit',
		badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
	},
	specs: {
		label: 'TDS / MSDS',
		badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
	},
	catalog: {
		label: 'Price Catalog',
		badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
	},
	test: {
		label: 'Lab Migration Test',
		badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
	},
	esg: {
		label: 'ESG / Sustainability',
		badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
	},
}

function getAssetIdentifier(doc: GatedDocItem): string {
	return doc.assetId || doc._key || doc.fileAsset?.asset?._id || ''
}

export default function ComplianceVault({
	badge = 'Quality & Compliance Documentation',
	headline = 'Manufacturing Standards & Technical Dossiers',
	subtitle = 'Review published product compliance records and request technical documentation from our export team.',
	headerAlignment = 'center',
	showMetrics = true,
	showCertificates = true,
	showGatedDocuments = true,
	certificatesTitle = 'Standards & Accreditations',
	certificatesSubtitle = 'Published audit and certification records',
	certificates = [],
	dossierBadge = 'Technical Dossier & Compliance Vault',
	dossierHeadline = 'Request Audit Reports, Technical Data Sheets & Product Catalogs',
	dossierSubtitle = 'Submit your contact details to request access from our export operations team.',
	privacyNotice = 'Your contact information is used strictly to fulfill your documentation request.',
	gatedDocuments = [],
	factoryMetrics = [],
	vaultTheme = 'dark',
	sanityAttr,
	...props
}: ComplianceVaultProps) {
	const [unlockedEmail, setUnlockedEmail] = useState<string | null>(null)
	const [grantedUrls, setGrantedUrls] = useState<Record<string, string | null>>(
		{},
	)
	const [activeModalDoc, setActiveModalDoc] = useState<GatedDocItem | null>(
		null,
	)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [modalStatus, setModalStatus] = useState<'form' | 'success'>('form')
	const [resolvedDownloadUrl, setResolvedDownloadUrl] = useState<string | null>(
		null,
	)
	const [formError, setFormError] = useState<string | null>(null)

	const modalRef = useRef<HTMLDivElement>(null)
	const triggerBtnRef = useRef<HTMLButtonElement | null>(null)
	const closeBtnRef = useRef<HTMLButtonElement | null>(null)
	const firstInputRef = useRef<HTMLInputElement | null>(null)

	const nameInputId = useId()
	const emailInputId = useId()
	const companyInputId = useId()
	const phoneInputId = useId()
	const consentInputId = useId()

	const [leadForm, setLeadForm] = useState({
		name: '',
		email: '',
		company: '',
		phone: '',
		consent: false,
		botField: '',
	})

	const executeDirectDownload = useCallback(
		(doc: GatedDocItem, directUrl: string | null) => {
			if (directUrl && directUrl !== '#') {
				const link = document.createElement('a')
				link.href = directUrl
				link.target = '_blank'
				link.rel = 'noopener noreferrer'
				link.download =
					doc.fileAsset?.asset?.originalFilename ||
					`${(doc.title || 'compliance-document').toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
			}
		},
		[],
	)

	const handleDocumentAction = (
		doc: GatedDocItem,
		e?: React.MouseEvent<HTMLButtonElement>,
	) => {
		if (e) {
			triggerBtnRef.current = e.currentTarget
		}
		const assetId = getAssetIdentifier(doc)
		if (unlockedEmail && assetId && Object.hasOwn(grantedUrls, assetId)) {
			const url = grantedUrls[assetId] || null
			setResolvedDownloadUrl(url)
			setActiveModalDoc(doc)
			setModalStatus('success')
			executeDirectDownload(doc, url)
		} else {
			setActiveModalDoc(doc)
			setModalStatus('form')
			setFormError(null)
		}
	}

	const closeModal = useCallback(() => {
		setActiveModalDoc(null)
		setModalStatus('form')
		setFormError(null)
		setResolvedDownloadUrl(null)
		if (triggerBtnRef.current) {
			triggerBtnRef.current.focus()
		}
	}, [])

	useEffect(() => {
		if (!activeModalDoc) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault()
				closeModal()
				return
			}

			if (e.key === 'Tab' && modalRef.current) {
				const focusableElements =
					modalRef.current.querySelectorAll<HTMLElement>(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
					)
				if (focusableElements.length === 0) return

				const firstElement = focusableElements[0]
				const lastElement = focusableElements[focusableElements.length - 1]

				if (e.shiftKey) {
					if (document.activeElement === firstElement) {
						e.preventDefault()
						lastElement.focus()
					}
				} else {
					if (document.activeElement === lastElement) {
						e.preventDefault()
						firstElement.focus()
					}
				}
			}
		}

		const originalOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		window.addEventListener('keydown', handleKeyDown)

		const timer = setTimeout(() => {
			if (modalStatus === 'form' && firstInputRef.current) {
				firstInputRef.current.focus()
			} else if (closeBtnRef.current) {
				closeBtnRef.current.focus()
			}
		}, 60)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = originalOverflow
			clearTimeout(timer)
		}
	}, [activeModalDoc, closeModal, modalStatus])

	const handleUnlockSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!activeModalDoc) return

		if (leadForm.botField) {
			closeModal()
			return
		}

		const cleanEmail = leadForm.email.trim().toLowerCase()
		if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
			setFormError('Please enter a valid commercial email address.')
			return
		}

		const assetId = getAssetIdentifier(activeModalDoc)
		if (!assetId) {
			setFormError('This compliance asset is missing a published identifier.')
			return
		}

		setIsSubmitting(true)
		setFormError(null)

		try {
			const tracking = buildTrackingPayload()
			const payload = {
				...tracking,
				name: leadForm.name.trim() || 'Procurement Partner',
				email: cleanEmail,
				phone: leadForm.phone.trim() || undefined,
				company_name: leadForm.company.trim() || undefined,
				source: 'compliance_vault_gated',
				assetId,
				dossierConsent: Boolean(leadForm.consent),
				consent: false,
				message: `[Compliance Vault Request]\nAsset ID: ${assetId}\nRequested Asset: ${activeModalDoc.title || 'Technical Document'}`,
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

			const data = await res.json().catch(() => ({}))
			if (!res.ok || !data?.success) {
				setFormError(
					data?.error ||
						data?.message ||
						'Unable to submit your request right now. Please try again.',
				)
				return
			}

			await retireLeadSubmission(payload)
			const serverDownloadUrl =
				typeof data.downloadUrl === 'string' ? data.downloadUrl : null
			setUnlockedEmail(cleanEmail)
			setGrantedUrls((prev) => ({ ...prev, [assetId]: serverDownloadUrl }))
			setResolvedDownloadUrl(serverDownloadUrl)
			setModalStatus('success')
			executeDirectDownload(activeModalDoc, serverDownloadUrl)
		} catch (err) {
			console.error('Lead submission network error:', err)
			setFormError(
				'Network error while submitting request. Please check your connection and try again.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleResetAccess = () => {
		setUnlockedEmail(null)
		setGrantedUrls({})
		closeModal()
	}

	const isDarkVault = vaultTheme === 'dark'

	// Never inject fabricated certificates, metrics, or documents when CMS fields are empty (DF-025)
	const displayCerts = Array.isArray(certificates) ? certificates : []
	const displayDocs = Array.isArray(gatedDocuments) ? gatedDocuments : []
	const displayMetrics = Array.isArray(factoryMetrics) ? factoryMetrics : []

	const hasMetrics = showMetrics && displayMetrics.length > 0
	const hasCerts = showCertificates && displayCerts.length > 0
	const hasDocs = showGatedDocuments && displayDocs.length > 0

	if (!hasMetrics && !hasCerts && !hasDocs) {
		return null
	}

	return (
		<section
			className="bg-surface text-foreground w-full overflow-hidden py-12 transition-colors sm:py-16 lg:py-24"
			{...moduleAttributes(props)}
		>
			<div className="section mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<header
					className={cn(
						'mb-10 max-w-3xl sm:mb-14',
						headerAlignment === 'center' ? 'mx-auto text-center' : 'text-left',
					)}
				>
					{badge && (
						<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold tracking-wider text-emerald-800 uppercase shadow-2xs dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
							<HiOutlineShieldCheck
								className="shrink-0 text-base text-emerald-600 dark:text-emerald-400"
								aria-hidden="true"
							/>
							<span>{badge}</span>
						</div>
					)}
					<h2 className="text-2xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
						{headline}
					</h2>
					{subtitle && (
						<p className="mt-3.5 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
							{subtitle}
						</p>
					)}
				</header>

				{/* 1. Factory Scale Metrics Bar */}
				{hasMetrics && (
					<div
						className="mb-12 grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white shadow-xl sm:mb-16 sm:gap-4 sm:rounded-3xl sm:p-6 lg:grid-cols-4 lg:p-8"
						aria-label="Factory scale and operational metrics"
					>
						{displayMetrics.map((metric, idx) => (
							<div
								key={metric._key || idx}
								className="flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-800/40 p-3 text-center transition hover:bg-slate-800/70 sm:rounded-2xl sm:p-4"
							>
								<p className="font-mono text-2xl font-black tracking-tight text-amber-400 sm:text-3xl lg:text-4xl">
									{metric.value}
								</p>
								<p className="mt-1 text-xs leading-snug font-bold text-slate-100 sm:mt-1.5 sm:text-sm">
									{metric.label}
								</p>
								{metric.subtitle && (
									<p className="mt-1 text-[11px] leading-relaxed text-slate-300 sm:text-xs">
										{metric.subtitle}
									</p>
								)}
							</div>
						))}
					</div>
				)}

				{/* 2. Public Accreditations Grid */}
				{hasCerts && (
					<div className="mb-14 sm:mb-20">
						<div className="border-border/80 mb-6 flex flex-col justify-between gap-3 border-b pb-4 sm:mb-8 sm:flex-row sm:items-end">
							<div>
								<h3 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
									{certificatesTitle}
								</h3>
								{certificatesSubtitle && (
									<p className="mt-1 text-xs text-slate-600 sm:text-sm dark:text-slate-400">
										{certificatesSubtitle}
									</p>
								)}
							</div>
							<span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs sm:self-auto dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
								<HiOutlineCheckBadge
									className="shrink-0 text-sm"
									aria-hidden="true"
								/>
								<span>Published Records</span>
							</span>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
							{displayCerts.map((cert, idx) => {
								const iconUrl = cert.badgeIcon?.asset
									? urlFor(cert.badgeIcon).auto('format').quality(85).url()
									: null

								return (
									<article
										key={cert._key || idx}
										className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md sm:p-6 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700"
									>
										<div>
											<div className="mb-3.5 flex items-center justify-between gap-2">
												{iconUrl ? (
													<div className="relative flex h-9 w-auto max-w-[120px] items-center">
														<Image
															src={iconUrl}
															alt={cert.title || 'Certification Emblem'}
															width={96}
															height={36}
															className="h-8 w-auto object-contain"
															loading="lazy"
														/>
													</div>
												) : (
													<div
														className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs dark:border-emerald-800/60 dark:bg-emerald-950/80 dark:text-emerald-400"
														aria-hidden="true"
													>
														<HiOutlineShieldCheck className="text-xl" />
													</div>
												)}
												{cert.code && (
													<span className="rounded-md border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
														{cert.code}
													</span>
												)}
											</div>

											<h4 className="text-sm leading-snug font-bold text-slate-900 sm:text-base dark:text-white">
												{cert.title}
											</h4>
											{cert.issuer && (
												<p className="text-primary dark:text-primary-foreground mt-1 text-xs font-semibold">
													{cert.issuer}
												</p>
											)}
											{(cert.scope || cert.validUntil) && (
												<p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
													{cert.scope ? `Scope: ${cert.scope}` : ''}
													{cert.scope && cert.validUntil ? ' • ' : ''}
													{cert.validUntil
														? `Valid until: ${cert.validUntil}`
														: ''}
												</p>
											)}
											{cert.description && (
												<p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
													{cert.description}
												</p>
											)}
										</div>

										{cert.verifyUrl && (
											<a
												href={cert.verifyUrl}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={`Verify ${cert.title || 'certificate'} online on official register (opens in a new window)`}
												className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/90 focus-visible:ring-primary mt-5 inline-flex items-center gap-1.5 rounded py-1 text-xs font-bold transition focus-visible:ring-2 focus-visible:outline-none"
											>
												<span>Verify registry record</span>
												<HiOutlineArrowTopRightOnSquare
													className="shrink-0 text-xs"
													aria-hidden="true"
												/>
											</a>
										)}
									</article>
								)
							})}
						</div>
					</div>
				)}

				{/* 3. Gated Documents Vault (B2B Lead Generation Dossier) */}
				{hasDocs && (
					<div
						className={cn(
							'rounded-3xl border p-6 shadow-2xl transition-all sm:p-8 lg:p-10',
							isDarkVault
								? 'border-slate-800 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white'
								: 'border-slate-200 bg-linear-to-br from-slate-50 via-white to-slate-100/90 text-slate-900 shadow-xl',
						)}
					>
						<div
							className={cn(
								'mb-8 flex flex-col items-start justify-between gap-4 border-b pb-6 md:flex-row md:items-center',
								isDarkVault ? 'border-slate-800' : 'border-slate-200',
							)}
						>
							<div>
								{dossierBadge && (
									<div
										className={cn(
											'mb-2.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase',
											isDarkVault
												? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
												: 'border-emerald-300 bg-emerald-50 text-emerald-800',
										)}
									>
										<HiOutlineLockClosed
											className="shrink-0 text-xs"
											aria-hidden="true"
										/>
										<span>{dossierBadge}</span>
									</div>
								)}
								<h3
									className={cn(
										'text-xl leading-snug font-black tracking-tight sm:text-2xl',
										isDarkVault ? 'text-white' : 'text-slate-900',
									)}
								>
									{dossierHeadline}
								</h3>
								{dossierSubtitle && (
									<p
										className={cn(
											'mt-1.5 max-w-2xl text-xs leading-relaxed sm:text-sm',
											isDarkVault ? 'text-slate-300' : 'text-slate-600',
										)}
									>
										{dossierSubtitle}
									</p>
								)}
							</div>

							{unlockedEmail && (
								<div className="flex flex-col items-start gap-2 self-stretch sm:flex-row sm:items-center md:self-auto">
									<span
										className={cn(
											'flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold shadow-2xs',
											isDarkVault
												? 'border-emerald-500/50 bg-emerald-950/80 text-emerald-300'
												: 'border-emerald-300 bg-emerald-50 text-emerald-800',
										)}
									>
										<HiOutlineCheckCircle
											className="shrink-0 text-base text-emerald-500"
											aria-hidden="true"
										/>
										<span className="max-w-[220px] truncate">
											Request saved: {unlockedEmail}
										</span>
									</span>
									<button
										type="button"
										onClick={handleResetAccess}
										className={cn(
											'focus-visible:ring-primary cursor-pointer rounded px-1 py-0.5 text-[11px] font-semibold underline underline-offset-2 hover:opacity-80 focus-visible:ring-1 focus-visible:outline-none',
											isDarkVault ? 'text-slate-400' : 'text-slate-600',
										)}
									>
										Switch Account
									</button>
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
							{displayDocs.map((doc, idx) => {
								const catInfo = doc.category
									? CATEGORY_TAGS[doc.category]
									: null
								const assetId = getAssetIdentifier(doc)
								const isGranted = Boolean(
									unlockedEmail &&
									assetId &&
									Object.hasOwn(grantedUrls, assetId),
								)

								return (
									<div
										key={doc._key || idx}
										className={cn(
											'group flex flex-col justify-between rounded-2xl border p-5 transition-all sm:p-6',
											isDarkVault
												? 'border-slate-800 bg-slate-900/90 shadow-md hover:border-slate-600'
												: 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
										)}
									>
										<div>
											<div className="mb-3.5 flex items-center justify-between gap-2">
												<span
													className={cn(
														'flex items-center justify-center rounded-xl p-2.5 shadow-2xs',
														isDarkVault
															? 'bg-slate-800 text-amber-400'
															: 'bg-slate-100 text-slate-800',
													)}
													aria-hidden="true"
												>
													<HiOutlineDocumentText className="text-xl" />
												</span>

												<div className="flex flex-wrap items-center justify-end gap-1.5">
													{catInfo && (
														<span
															className={cn(
																'rounded-md border px-2 py-0.5 text-[10px] font-bold',
																catInfo.badgeClass,
															)}
														>
															{catInfo.label}
														</span>
													)}
													<span
														className={cn(
															'rounded-md px-2 py-0.5 font-mono text-[11px] font-bold',
															isDarkVault
																? 'border border-slate-700 bg-slate-800/80 text-slate-400'
																: 'border border-slate-200 bg-slate-100 text-slate-600',
														)}
													>
														{doc.fileSize || 'PDF'}
													</span>
												</div>
											</div>

											<h4
												className={cn(
													'text-sm leading-snug font-bold sm:text-base',
													isDarkVault ? 'text-white' : 'text-slate-900',
												)}
											>
												{doc.title}
											</h4>
											<p
												className={cn(
													'mt-2 text-xs leading-relaxed',
													isDarkVault ? 'text-slate-300' : 'text-slate-600',
												)}
											>
												{doc.description ||
													'Complete technical documentation available upon request.'}
											</p>
										</div>

										<button
											type="button"
											onClick={(e) => handleDocumentAction(doc, e)}
											className={cn(
												'mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] sm:py-3',
												isGranted
													? 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500'
													: isDarkVault
														? 'bg-white text-slate-900 hover:bg-slate-100 focus-visible:ring-white focus-visible:ring-offset-slate-900'
														: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900 focus-visible:ring-offset-white',
											)}
										>
											{isGranted ? (
												<>
													<HiOutlineArrowDownTray
														className="shrink-0 text-base"
														aria-hidden="true"
													/>
													<span>Download PDF</span>
												</>
											) : (
												<>
													<HiOutlineLockClosed
														className="shrink-0 text-sm opacity-70"
														aria-hidden="true"
													/>
													<span>Request &amp; Access (PDF)</span>
												</>
											)}
										</button>
									</div>
								)
							})}
						</div>
					</div>
				)}

				{/* Gated Unlock / Request Modal Dialog */}
				{activeModalDoc && (
					<div
						className="animate-in fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs transition-opacity duration-200"
						role="dialog"
						aria-modal="true"
						aria-labelledby="compliance-vault-modal-title"
						aria-describedby="compliance-vault-modal-description"
						onClick={(e) => {
							if (e.target === e.currentTarget) closeModal()
						}}
					>
						<div
							ref={modalRef}
							className="animate-in zoom-in-95 relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl transition-transform duration-200 focus:outline-none sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
							tabIndex={-1}
						>
							<button
								ref={closeBtnRef}
								type="button"
								onClick={closeModal}
								className="focus-visible:ring-primary absolute top-5 right-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-slate-800 dark:hover:text-slate-200"
								aria-label="Close dialog"
							>
								<HiXMark className="text-xl" aria-hidden="true" />
							</button>

							{modalStatus === 'form' ? (
								<>
									<div className="mb-3 flex items-center gap-2">
										<div className="bg-primary/10 text-primary rounded-xl p-2">
											<HiOutlineLockClosed
												className="text-xl"
												aria-hidden="true"
											/>
										</div>
										<span className="text-primary text-xs font-bold tracking-wider uppercase">
											Technical Asset Vault
										</span>
									</div>

									<h3
										id="compliance-vault-modal-title"
										className="text-xl leading-tight font-black text-slate-900 dark:text-white"
									>
										Request Document Access
									</h3>
									<p
										id="compliance-vault-modal-description"
										className="mt-1.5 text-xs text-slate-600 sm:text-sm dark:text-slate-300"
									>
										<span className="font-semibold text-slate-800 dark:text-slate-100">
											{activeModalDoc.title}
										</span>{' '}
										({activeModalDoc.fileSize || 'PDF Asset'})
									</p>

									{formError && (
										<div
											role="alert"
											className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
										>
											<HiOutlineExclamationCircle className="shrink-0 text-base" />
											<span>{formError}</span>
										</div>
									)}

									<form
										onSubmit={handleUnlockSubmit}
										className="mt-5 space-y-3.5"
									>
										<div className="hidden" aria-hidden="true">
											<label htmlFor="company_website_honeypot">Website</label>
											<input
												id="company_website_honeypot"
												type="text"
												tabIndex={-1}
												autoComplete="off"
												value={leadForm.botField}
												onChange={(e) =>
													setLeadForm({ ...leadForm, botField: e.target.value })
												}
											/>
										</div>

										<div>
											<label
												htmlFor={nameInputId}
												className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300"
											>
												Contact Person Name{' '}
												<span className="text-rose-500">*</span>
											</label>
											<input
												ref={firstInputRef}
												required
												id={nameInputId}
												type="text"
												placeholder="e.g. John Smith"
												value={leadForm.name}
												onChange={(e) =>
													setLeadForm({ ...leadForm, name: e.target.value })
												}
												className="focus:border-primary focus:ring-primary w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 transition placeholder:text-slate-400 focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
											/>
										</div>

										<div>
											<label
												htmlFor={emailInputId}
												className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300"
											>
												Business Work Email{' '}
												<span className="text-rose-500">*</span>
											</label>
											<input
												required
												id={emailInputId}
												type="email"
												placeholder="procurement@company.com"
												value={leadForm.email}
												onChange={(e) =>
													setLeadForm({ ...leadForm, email: e.target.value })
												}
												className="focus:border-primary focus:ring-primary w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 transition placeholder:text-slate-400 focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
											/>
										</div>

										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											<div>
												<label
													htmlFor={companyInputId}
													className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300"
												>
													Company / Entity Name
												</label>
												<input
													id={companyInputId}
													type="text"
													placeholder="e.g. Acme Imports LLC"
													value={leadForm.company}
													onChange={(e) =>
														setLeadForm({
															...leadForm,
															company: e.target.value,
														})
													}
													className="focus:border-primary focus:ring-primary w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 transition placeholder:text-slate-400 focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
												/>
											</div>
											<div>
												<label
													htmlFor={phoneInputId}
													className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300"
												>
													Direct Phone / WhatsApp
												</label>
												<input
													id={phoneInputId}
													type="tel"
													placeholder="+1 555-019-2834"
													value={leadForm.phone}
													onChange={(e) =>
														setLeadForm({ ...leadForm, phone: e.target.value })
													}
													className="focus:border-primary focus:ring-primary w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 transition placeholder:text-slate-400 focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
												/>
											</div>
										</div>

										<div className="pt-1">
											<label
												htmlFor={consentInputId}
												className="flex cursor-pointer items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400"
											>
												<input
													id={consentInputId}
													type="checkbox"
													checked={leadForm.consent}
													onChange={(e) =>
														setLeadForm({
															...leadForm,
															consent: e.target.checked,
														})
													}
													className="text-primary focus:ring-primary mt-0.5 h-3.5 w-3.5 rounded border-slate-300"
												/>
												<span>
													I agree to receive the requested technical dossier and
													follow-up communication regarding this request.
												</span>
											</label>
										</div>

										<button
											disabled={isSubmitting}
											type="submit"
											className="focus-visible:ring-primary mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-lg transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
										>
											{isSubmitting ? (
												<>
													<HiArrowPath className="animate-spin text-base" />
													<span>Submitting Request...</span>
												</>
											) : (
												<>
													<HiOutlineArrowDownTray className="text-base" />
													<span>Submit &amp; Access Document</span>
												</>
											)}
										</button>

										<p className="pt-1 text-center text-[10px] leading-relaxed text-slate-600 sm:text-[11px] dark:text-slate-400">
											{privacyNotice}
										</p>
									</form>
								</>
							) : (
								<div className="py-4 text-center">
									<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 text-emerald-600 dark:border-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
										<HiOutlineCheck className="text-3xl" aria-hidden="true" />
									</div>

									<h3
										id="compliance-vault-modal-title"
										className="text-xl font-black text-slate-900 dark:text-white"
									>
										Request Received
									</h3>
									<p
										id="compliance-vault-modal-description"
										className="mx-auto mt-2 max-w-sm text-xs text-slate-600 sm:text-sm dark:text-slate-300"
									>
										Your documentation request has been saved and queued for
										follow-up by our export compliance team.
									</p>

									<div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-700 dark:bg-slate-800">
										<p className="text-xs font-bold text-slate-900 dark:text-white">
											{activeModalDoc.title}
										</p>
										<p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
											Format: {activeModalDoc.fileSize || 'PDF Document'}
										</p>
									</div>

									<div className="mt-6 flex flex-col gap-2.5">
										{resolvedDownloadUrl && resolvedDownloadUrl !== '#' ? (
											<a
												href={resolvedDownloadUrl}
												download={
													activeModalDoc.fileAsset?.asset?.originalFilename ||
													`${(activeModalDoc.title || 'compliance-doc').toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`
												}
												target="_blank"
												rel="noopener noreferrer"
												className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-md transition hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
											>
												<HiOutlineArrowDownTray className="text-base" />
												<span>Download Document (PDF)</span>
											</a>
										) : (
											<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
												Your request has been logged for manual review. Our
												compliance officer will follow up via email.
											</div>
										)}

										<button
											type="button"
											onClick={closeModal}
											className="w-full cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
										>
											Return to Compliance Vault
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</section>
	)
}
