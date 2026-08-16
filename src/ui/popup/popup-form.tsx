'use client'

import { useState } from 'react'
import { FiAlertCircle, FiGift, FiLoader, FiLock, FiMail, FiPhone, FiUser } from 'react-icons/fi'
import ResponsiveImage from '@/ui/responsiveImage'
import PopupSuccess from './popup-success'

type PopupFormProps = {
	settings: any
	onClose: () => void
}

export default function PopupForm({ settings, onClose }: PopupFormProps) {
	const {
		formImage,
		formBadge,
		formTitle,
		formDescription,
		formFields = 'email',
		formSubmitLabel,
		formPrivacyText,
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
	const hasImage = Boolean(formImage?.asset)

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
					source: 'Popup Lead / Newsletter',
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
		<div className="flex flex-col md:flex-row w-full overflow-hidden rounded-2xl md:rounded-3xl bg-white text-gray-900 shadow-2xl border border-gray-100">
			{/* Cột Ảnh Form (Nếu có) */}
			{hasImage && (
				<div className="relative w-full md:w-5/12 h-32 sm:h-44 md:h-auto md:min-h-[380px] bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
					<ResponsiveImage
						image={formImage}
						desktop={{ width: 600 }}
						mobile={{ width: 400 }}
						className="h-full w-full object-cover"
					/>
				</div>
			)}

			{/* Cột Form Thu Thập */}
			<div
				className={`flex flex-col justify-center p-4 sm:p-6 md:p-8 ${
					hasImage ? 'w-full md:w-7/12' : 'w-full max-w-xl mx-auto'
				}`}
			>
				{/* Badge */}
				{formBadge && (
					<div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wider text-emerald-700 uppercase border border-emerald-200/60 shadow-2xs">
						<FiGift className="h-3.5 w-3.5 text-emerald-600" />
						<span>{formBadge}</span>
					</div>
				)}

				{/* Tiêu đề & Mô tả */}
				<h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
					{formTitle || 'Nhận Ngay Voucher Ưu Đãi Độc Quyền'}
				</h3>

				{formDescription && (
					<p className="mt-2.5 text-sm text-gray-600 leading-relaxed">{formDescription}</p>
				)}

				{/* Form Inputs */}
				<form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
					{/* Error Alert */}
					{error && (
						<div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
							<FiAlertCircle className="h-4 w-4 flex-none text-red-500" />
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
								className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20"
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
								className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20"
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
								className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20"
							/>
						</div>
					)}

					{/* Nút Submit */}
					<button
						type="submit"
						disabled={loading}
						className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
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

					{/* Privacy Note */}
					{formPrivacyText && (
						<div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
							<FiLock className="h-3 w-3 text-gray-400" />
							<span>{formPrivacyText}</span>
						</div>
					)}
				</form>
			</div>
		</div>
	)
}
