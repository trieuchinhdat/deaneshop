'use client'

import { useState } from 'react'
import {
	FiAlertCircle,
	FiGift,
	FiLoader,
	FiMail,
	FiPhone,
	FiUser,
} from 'react-icons/fi'
import ResponsiveImage from '@/ui/responsiveImage'
import PopupSuccess from './popup-success'

type PopupFormProps = {
	settings: any
	onClose: () => void
}

export default function PopupForm({ settings, onClose }: PopupFormProps) {
	const {
		bannerImage,
		mobileBannerImage,
		formBadge,
		formTitle,
		formDescription,
		formFields = 'email',
		formSubmitLabel,
		consentText,
		rewardCouponCode,
		bannerCtaUrl,
		bannerCtaText,
		successTitle,
		successDescription,
	} = settings || {}

	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isSubmitted, setIsSubmitted] = useState(false)

	const showName = formFields === 'full'
	const showEmail =
		formFields === 'email' || formFields === 'both' || formFields === 'full'
	const showPhone =
		formFields === 'phone' || formFields === 'both' || formFields === 'full'

	const hasBanner = Boolean(bannerImage?.asset || mobileBannerImage?.asset)
	const imgObject = bannerImage
		? { ...bannerImage, mobileImage: mobileBannerImage }
		: mobileBannerImage

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		// Validation
		if (showEmail && !email.trim()) {
			setError('Please enter your email address.')
			return
		}
		if (
			showEmail &&
			email.trim() &&
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
		) {
			setError('Please enter a valid email address.')
			return
		}
		if (showPhone && !phone.trim()) {
			setError('Please enter your phone number.')
			return
		}

		setLoading(true)

		try {
			const res = await fetch('/api/popup/lead', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim() || undefined,
					email: email.trim() || undefined,
					phone: phone.trim() || undefined,
					couponGiven: rewardCouponCode || undefined,
					pageUrl:
						typeof window !== 'undefined' ? window.location.href : undefined,
					source: 'popup',
					consent: true,
					consentText:
						consentText ||
						'By subscribing, you agree to our Privacy Policy and consent to receive updates.',
				}),
			})

			const data = await res.json()

			if (!res.ok) {
				throw new Error(
					data?.error || 'Unable to submit form. Please try again.',
				)
			}

			// Save to localStorage marking as submitted
			if (typeof window !== 'undefined') {
				localStorage.setItem('deanflow_popup_submitted', 'true')
			}

			setIsSubmitted(true)
		} catch (err: any) {
			setError(err?.message || 'Something went wrong. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	if (isSubmitted) {
		return (
			<PopupSuccess
				title={successTitle}
				description={successDescription}
				voucherCode={rewardCouponCode}
				ctaUrl={bannerCtaUrl}
				ctaText={bannerCtaText}
				onClose={onClose}
			/>
		)
	}

	return (
		<div className="relative flex min-h-[420px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-2xl md:rounded-3xl">
			{/* Full background banner */}
			{hasBanner ? (
				<div className="absolute inset-0 z-0">
					<ResponsiveImage
						image={imgObject}
						desktop={{ width: 1000 }}
						mobile={{ width: 600 }}
						className="h-full w-full scale-105 object-cover filter transition-transform duration-700 hover:scale-100"
					/>
					{/* Gradient overlay for readability */}
					<div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/65 to-black/45 backdrop-blur-[2px]" />
				</div>
			) : (
				<div className="absolute inset-0 z-0 bg-linear-to-br from-gray-900 via-neutral-900 to-gray-950" />
			)}

			{/* Form content */}
			<div className="relative z-10 mx-auto flex w-full max-w-lg flex-col p-6 text-center sm:p-8 md:p-10">
				{/* Badge */}
				{formBadge && (
					<div className="mb-3 inline-flex items-center gap-1.5 self-center rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3.5 py-1 text-xs font-bold tracking-wider text-emerald-300 uppercase shadow-xs backdrop-blur-md">
						<FiGift className="h-3.5 w-3.5 text-emerald-400" />
						<span>{formBadge}</span>
					</div>
				)}

				{/* Title */}
				<h3 className="text-xl leading-snug font-black tracking-tight text-white drop-shadow-md sm:text-2xl md:text-3xl">
					{formTitle || 'Join Our Community'}
				</h3>

				{/* Description */}
				{formDescription && (
					<p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-gray-200 drop-shadow-xs sm:text-sm">
						{formDescription}
					</p>
				)}

				{/* Form Fields */}
				<form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
					{/* Error Alert */}
					{error && (
						<div className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-950/80 p-3 text-left text-xs font-semibold text-red-200 backdrop-blur-md">
							<FiAlertCircle className="h-4 w-4 flex-none text-red-400" />
							<span>{error}</span>
						</div>
					)}

					{/* Name input */}
					{showName && (
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
								<FiUser className="h-4 w-4" />
							</div>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Full name"
								className="w-full rounded-xl border border-white/25 bg-black/40 py-3 pr-4 pl-10 text-sm text-white backdrop-blur-md transition-all placeholder:text-gray-400 focus:border-emerald-400 focus:bg-black/60 focus:ring-2 focus:ring-emerald-400/30 focus:outline-hidden"
							/>
						</div>
					)}

					{/* Email input */}
					{showEmail && (
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
								<FiMail className="h-4 w-4" />
							</div>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email address"
								required
								className="w-full rounded-xl border border-white/25 bg-black/40 py-3 pr-4 pl-10 text-sm text-white backdrop-blur-md transition-all placeholder:text-gray-400 focus:border-emerald-400 focus:bg-black/60 focus:ring-2 focus:ring-emerald-400/30 focus:outline-hidden"
							/>
						</div>
					)}

					{/* Phone input */}
					{showPhone && (
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
								<FiPhone className="h-4 w-4" />
							</div>
							<input
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="Phone number"
								required={!showEmail}
								className="w-full rounded-xl border border-white/25 bg-black/40 py-3 pr-4 pl-10 text-sm text-white backdrop-blur-md transition-all placeholder:text-gray-400 focus:border-emerald-400 focus:bg-black/60 focus:ring-2 focus:ring-emerald-400/30 focus:outline-hidden"
							/>
						</div>
					)}

					{/* Submit Button */}
					<button
						type="submit"
						disabled={loading}
						className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-950/40 transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
					>
						{loading ? (
							<>
								<FiLoader className="h-4 w-4 animate-spin" />
								<span>Processing...</span>
							</>
						) : (
							<span>{formSubmitLabel || 'Subscribe & Get Access'}</span>
						)}
					</button>

					{/* GDPR / CASL Consent Micro-copy */}
					<p className="pt-1 text-[11px] leading-relaxed text-gray-300/80">
						{consentText ||
							'By subscribing, you agree to our Privacy Policy and consent to receive updates.'}
					</p>
				</form>
			</div>
		</div>
	)
}
