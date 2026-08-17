'use client'

import { useState } from 'react'
import { FiAlertCircle, FiGift, FiLoader, FiMail, FiPhone, FiUser } from 'react-icons/fi'
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
		rewardCouponCode,
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
	const showEmail = formFields === 'email' || formFields === 'both' || formFields === 'full'
	const showPhone = formFields === 'phone' || formFields === 'both' || formFields === 'full'

	const hasBanner = Boolean(bannerImage?.asset || mobileBannerImage?.asset)
	const imgObject = bannerImage
		? { ...bannerImage, mobileImage: mobileBannerImage }
		: mobileBannerImage

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		// Validation
		if (showEmail && !email.trim()) {
			setError('Vui lòng nhập địa chỉ Email của bạn.')
			return
		}
		if (showEmail && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			setError('Địa chỉ Email không hợp lệ.')
			return
		}
		if (showPhone && !phone.trim()) {
			setError('Vui lòng nhập Số điện thoại của bạn.')
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
					pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
					source: 'popup',
				}),
			})

			const data = await res.json()

			if (!res.ok) {
				throw new Error(data?.error || 'Không thể gửi biểu mẫu. Vui lòng thử lại.')
			}

			// Lưu localStorage đánh dấu đã submit
			if (typeof window !== 'undefined') {
				localStorage.setItem('ecocros_popup_submitted', 'true')
			}

			setIsSubmitted(true)
		} catch (err: any) {
			setError(err?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
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
				onClose={onClose}
			/>
		)
	}

	return (
		<div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl border border-white/10 min-h-[420px] flex items-center justify-center">
			{/* BANNER NỀN TOÀN PHẦN (FULL BACKGROUND IMAGE) */}
			{hasBanner ? (
				<div className="absolute inset-0 z-0">
					<ResponsiveImage
						image={imgObject}
						desktop={{ width: 1000 }}
						mobile={{ width: 600 }}
						className="h-full w-full object-cover scale-105 filter transition-transform duration-700 hover:scale-100"
					/>
					{/* Lớp phủ tối ưu tương phản text & glassmorphism */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/45 backdrop-blur-[2px]" />
				</div>
			) : (
				<div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-neutral-900 to-gray-950" />
			)}

			{/* NỘI DUNG FORM NỔI TRÊN NỀN BANNER */}
			<div className="relative z-10 w-full max-w-lg mx-auto p-6 sm:p-8 md:p-10 flex flex-col text-center">
				{/* Badge Quà Tặng */}
				{formBadge && (
					<div className="mb-3 inline-flex items-center gap-1.5 self-center rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold tracking-wider text-emerald-300 uppercase border border-emerald-400/30 backdrop-blur-md shadow-xs">
						<FiGift className="h-3.5 w-3.5 text-emerald-400" />
						<span>{formBadge}</span>
					</div>
				)}

				{/* Tiêu đề Form */}
				<h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-snug drop-shadow-md">
					{formTitle || 'Nhận Ngay Voucher Ưu Đãi Độc Quyền'}
				</h3>

				{/* Mô tả ưu đãi */}
				{formDescription && (
					<p className="mt-2.5 text-xs sm:text-sm text-gray-200 leading-relaxed max-w-md mx-auto drop-shadow-xs">
						{formDescription}
					</p>
				)}

				{/* Form Fields */}
				<form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
					{/* Error Alert */}
					{error && (
						<div className="flex items-center gap-2 rounded-xl bg-red-950/80 p-3 text-xs font-semibold text-red-200 border border-red-500/50 backdrop-blur-md text-left">
							<FiAlertCircle className="h-4 w-4 flex-none text-red-400" />
							<span>{error}</span>
						</div>
					)}

					{/* Tên */}
					{showName && (
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
								<FiUser className="h-4 w-4" />
							</div>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Họ và tên của bạn"
								className="w-full rounded-xl border border-white/25 bg-black/40 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-400 backdrop-blur-md transition-all focus:border-emerald-400 focus:bg-black/60 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/30"
							/>
						</div>
					)}

					{/* Email */}
					{showEmail && (
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
								<FiMail className="h-4 w-4" />
							</div>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Nhập địa chỉ email của bạn"
								required
								className="w-full rounded-xl border border-white/25 bg-black/40 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-400 backdrop-blur-md transition-all focus:border-emerald-400 focus:bg-black/60 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/30"
							/>
						</div>
					)}

					{/* Số điện thoại */}
					{showPhone && (
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
								<FiPhone className="h-4 w-4" />
							</div>
							<input
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="Số điện thoại nhận ưu đãi"
								required={!showEmail}
								className="w-full rounded-xl border border-white/25 bg-black/40 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-400 backdrop-blur-md transition-all focus:border-emerald-400 focus:bg-black/60 focus:outline-hidden focus:ring-2 focus:ring-emerald-400/30"
							/>
						</div>
					)}

					{/* Nút Submit */}
					<button
						type="submit"
						disabled={loading}
						className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-950/40 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
					>
						{loading ? (
							<>
								<FiLoader className="h-4 w-4 animate-spin" />
								<span>Đang xử lý...</span>
							</>
						) : (
							<span>{formSubmitLabel || 'Nhận Mã Ưu Đãi Ngay'}</span>
						)}
					</button>
				</form>
			</div>
		</div>
	)
}
