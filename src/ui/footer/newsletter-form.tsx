'use client'

import { ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useId, useState } from 'react'
import { buildTrackingPayload } from '@/lib/tracking-payload'

interface NewsletterFormProps {
	title?: string
	description?: string
	placeholder?: string
	buttonText?: string
	consentText?: string
	layout?: 'embedded' | 'banner'
}

export default function NewsletterForm({
	title = 'Unlock 10% Off Your First Order',
	description = 'Subscribe for exclusive drops, early bird access, and conscious living inspiration.',
	placeholder = 'Enter your email address...',
	buttonText = 'Subscribe',
	consentText = 'By subscribing, you agree to our Privacy Policy and consent to receive marketing updates.',
	layout = 'embedded',
}: NewsletterFormProps) {
	const inputId = useId()
	const [email, setEmail] = useState('')
	const [status, setStatus] = useState<
		'idle' | 'loading' | 'success' | 'error'
	>('idle')
	const [errorMessage, setErrorMessage] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const trimmedEmail = email.trim()

		// Robust RFC5322-compatible email check for US/UK commerce
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
			setErrorMessage(
				'Please enter a valid email address (e.g. name@domain.com)',
			)
			setStatus('error')
			return
		}

		setStatus('loading')
		setErrorMessage('')

		try {
			const tracking = buildTrackingPayload()
			const res = await fetch('/api/popup/lead', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...tracking,
					email: trimmedEmail,
					source: 'footer_newsletter',
					consent: Boolean(consentText.trim()),
					consentText,
				}),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(
					data.message ||
						'Subscription failed. Please check your email and try again.',
				)
			}

			setStatus('success')
			setEmail('')
		} catch (err: any) {
			setStatus('error')
			setErrorMessage(err.message || 'Something went wrong. Please try again.')
		}
	}

	// Helper to format consent micro-copy with active Privacy Policy link
	const renderConsentText = (text: string) => {
		if (!text) return null
		const parts = text.split(/(Privacy Policy)/i)
		return (
			<p className="text-muted-foreground/80 pt-1 text-[11px] leading-relaxed">
				{parts.map((part, index) =>
					part.toLowerCase() === 'privacy policy' ? (
						<Link
							key={index}
							href="/privacy-policy"
							className="hover:text-foreground underline transition-colors"
						>
							{part}
						</Link>
					) : (
						part
					),
				)}
			</p>
		)
	}

	if (layout === 'banner') {
		return (
			<div className="border-border/40 bg-surface/50 rounded-2xl border p-6 sm:p-8 md:p-10">
				<div className="mx-auto max-w-2xl text-center">
					<h3 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
						{title}
					</h3>
					{description && (
						<p className="text-muted-foreground mt-2 text-sm leading-relaxed">
							{description}
						</p>
					)}

					<div className="mt-6">
						{status === 'success' ? (
							<div
								role="alert"
								aria-live="polite"
								className="bg-primary/10 border-primary/20 text-primary animate-in fade-in zoom-in flex items-center justify-center gap-2.5 rounded-xl border p-4 text-sm font-medium duration-300"
							>
								<CheckCircle2 className="size-5 shrink-0" />
								<span>
									Thank you for subscribing! Check your inbox for your 10%
									discount code.
								</span>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="flex flex-col gap-2">
								<div className="relative flex flex-col items-center gap-2 sm:flex-row">
									<label htmlFor={inputId} className="sr-only">
										Email address
									</label>
									<div className="relative w-full">
										<Mail
											className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
											aria-hidden="true"
										/>
										<input
											id={inputId}
											type="email"
											autoComplete="email"
											value={email}
											onChange={(e) => {
												setEmail(e.target.value)
												if (status === 'error') setStatus('idle')
											}}
											placeholder={placeholder}
											disabled={status === 'loading'}
											aria-invalid={status === 'error'}
											aria-required="true"
											className="border-border/80 bg-background/90 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-primary/20 w-full rounded-xl border py-3 pr-4 pl-10 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-hidden disabled:opacity-50"
										/>
									</div>
									<button
										type="submit"
										disabled={status === 'loading'}
										className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-[46px] w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-xs transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
									>
										{status === 'loading' ? (
											<Loader2 className="size-4 animate-spin" />
										) : (
											<>
												<span>{buttonText}</span>
												<ArrowRight className="size-4" aria-hidden="true" />
											</>
										)}
									</button>
								</div>

								{status === 'error' && (
									<p
										role="alert"
										aria-live="polite"
										className="text-destructive animate-in fade-in pt-1 text-left text-xs font-medium sm:text-center"
									>
										{errorMessage}
									</p>
								)}

								{consentText && renderConsentText(consentText)}
							</form>
						)}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-3">
			<div>
				<h3 className="text-foreground text-base font-semibold tracking-tight">
					{title}
				</h3>
				{description && (
					<p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
						{description}
					</p>
				)}
			</div>

			{status === 'success' ? (
				<div
					role="alert"
					aria-live="polite"
					className="bg-primary/10 border-primary/20 text-primary animate-in fade-in zoom-in flex items-start gap-2.5 rounded-xl border p-3.5 text-sm font-medium duration-300"
				>
					<CheckCircle2 className="mt-0.5 size-5 shrink-0" />
					<p className="leading-snug">
						Thank you for subscribing! Check your inbox for your welcome offer.
					</p>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
					<label htmlFor={inputId} className="sr-only">
						Email address
					</label>
					<div className="relative flex items-center">
						<Mail
							className="text-muted-foreground pointer-events-none absolute left-3.5 size-4"
							aria-hidden="true"
						/>
						<input
							id={inputId}
							type="email"
							autoComplete="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value)
								if (status === 'error') setStatus('idle')
							}}
							placeholder={placeholder}
							disabled={status === 'loading'}
							aria-invalid={status === 'error'}
							aria-required="true"
							className="border-border/80 bg-surface/80 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-primary/20 w-full rounded-xl border py-3 pr-28 pl-10 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-hidden disabled:opacity-50"
						/>
						<button
							type="submit"
							disabled={status === 'loading'}
							className="bg-primary text-primary-foreground hover:bg-primary/90 absolute right-1.5 flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-60"
						>
							{status === 'loading' ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								<>
									<span>{buttonText}</span>
									<ArrowRight className="size-3" aria-hidden="true" />
								</>
							)}
						</button>
					</div>

					{status === 'error' && (
						<p
							role="alert"
							aria-live="polite"
							className="text-destructive animate-in fade-in pt-0.5 text-xs font-medium"
						>
							{errorMessage}
						</p>
					)}

					{consentText && renderConsentText(consentText)}
				</form>
			)}
		</div>
	)
}
