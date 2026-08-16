'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiArrowRight, FiCheck, FiCopy, FiTag } from 'react-icons/fi'
import ResponsiveImage from '@/ui/responsiveImage'

type PopupBannerProps = {
	settings: any
	onClose: () => void
}

export default function PopupBanner({ settings, onClose }: PopupBannerProps) {
	const [copied, setCopied] = useState(false)

	const {
		bannerImage,
		mobileBannerImage,
		transparentBackground = false,
		bannerBadge,
		bannerTitle,
		bannerDescription,
		couponCode,
		bannerCtaText,
		bannerCtaUrl,
	} = settings || {}

	const handleCopyCoupon = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!couponCode) return
		navigator.clipboard.writeText(couponCode)
		setCopied(true)
		setTimeout(() => setCopied(false), 2500)
	}

	const hasImage = Boolean(bannerImage?.asset || mobileBannerImage?.asset)
	const hasText = Boolean(bannerTitle || bannerDescription)

	const imgObject = bannerImage
		? { ...bannerImage, mobileImage: mobileBannerImage }
		: mobileBannerImage

	// ================= 1. TRƯỜNG HỢP NỀN TRONG SUỐT (FRAMELESS / TRANSPARENT DIE-CUT BANNER) =================
	if (transparentBackground && hasImage) {
		const ImageElement = (
			<div className="relative flex flex-col items-center justify-center select-none group">
				<ResponsiveImage
					image={imgObject}
					desktop={{ width: 900 }}
					mobile={{ width: 500 }}
					className="max-h-[80vh] w-auto max-w-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
				/>

				{/* Floating Coupon nếu có */}
				{couponCode && (
					<div className="mt-3 inline-flex items-center gap-2.5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-gray-900 shadow-xl backdrop-blur-md border border-white/40">
						<span className="font-mono text-sm tracking-wider text-emerald-700 font-extrabold">
							{couponCode}
						</span>
						<button
							type="button"
							onClick={handleCopyCoupon}
							className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
						>
							{copied ? (
								<>
									<FiCheck className="h-3.5 w-3.5 stroke-[3]" />
									<span>Đã sao chép</span>
								</>
							) : (
								<>
									<FiCopy className="h-3.5 w-3.5" />
									<span>Sao chép</span>
								</>
							)}
						</button>
					</div>
				)}

				{/* Floating CTA Button nếu có */}
				{bannerCtaText && (
					<div className="mt-3">
						<span className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-2xl transition-all hover:bg-gray-800 hover:scale-105 active:scale-95">
							<span>{bannerCtaText}</span>
							<FiArrowRight className="h-4 w-4" />
						</span>
					</div>
				)}
			</div>
		)

		if (bannerCtaUrl) {
			return (
				<Link href={bannerCtaUrl} onClick={onClose} className="block cursor-pointer">
					{ImageElement}
				</Link>
			)
		}

		return ImageElement
	}

	// ================= 2. TRƯỜNG HỢP BANNER ĐỒ HỌA THUẦN (FULL GRAPHIC BANNER - KHÔNG CẦN CHỮ) =================
	if (hasImage && !hasText) {
		const Content = (
			<div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl bg-neutral-900 shadow-2xl group border border-neutral-800">
				<ResponsiveImage
					image={imgObject}
					desktop={{ width: 900 }}
					mobile={{ width: 500 }}
					className="w-full h-auto max-h-[82vh] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
				/>

				{/* Lớp phủ hành động dưới đáy banner nếu có CTA hoặc Coupon */}
				{(bannerCtaText || couponCode) && (
					<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
						{couponCode && (
							<button
								type="button"
								onClick={handleCopyCoupon}
								className="inline-flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-gray-900 shadow-lg hover:bg-white transition-all cursor-pointer"
							>
								<span className="font-mono text-emerald-800 font-extrabold">{couponCode}</span>
								{copied ? (
									<FiCheck className="h-4 w-4 text-emerald-600 stroke-[3]" />
								) : (
									<FiCopy className="h-4 w-4 text-gray-600" />
								)}
							</button>
						)}

						{bannerCtaText && (
							<span className="ml-auto inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 shadow-xl transition-all group-hover:bg-neutral-100 group-hover:scale-105 active:scale-95">
								<span>{bannerCtaText}</span>
								<FiArrowRight className="h-4 w-4" />
							</span>
						)}
					</div>
				)}
			</div>
		)

		if (bannerCtaUrl) {
			return (
				<Link href={bannerCtaUrl} onClick={onClose} className="block cursor-pointer">
					{Content}
				</Link>
			)
		}

		return Content
	}

	// ================= 3. TRƯỜNG HỢP BANNER KÈM NỘI DUNG CHỮ (IMAGE + TEXT & COUPON) =================
	return (
		<div className="flex flex-col md:flex-row w-full overflow-hidden rounded-2xl md:rounded-3xl bg-white text-gray-900 shadow-2xl border border-gray-100">
			{/* Cột Ảnh Banner */}
			{hasImage && (
				<div className="relative w-full md:w-1/2 h-40 sm:h-52 md:h-auto md:min-h-[380px] bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
					<ResponsiveImage
						image={imgObject}
						desktop={{ width: 700 }}
						mobile={{ width: 500 }}
						className="h-full w-full object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:hidden" />
				</div>
			)}

			{/* Cột Nội Dung & Ưu Đãi */}
			<div
				className={`flex flex-col justify-center p-5 sm:p-7 md:p-9 ${
					hasImage ? 'w-full md:w-1/2' : 'w-full max-w-xl mx-auto text-center'
				}`}
			>
				{/* Badge sự kiện */}
				{bannerBadge && (
					<div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wider text-emerald-700 uppercase border border-emerald-200/60 shadow-2xs">
						<FiTag className="h-3.5 w-3.5 text-emerald-600" />
						<span>{bannerBadge}</span>
					</div>
				)}

				{/* Tiêu đề */}
				<h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
					{bannerTitle || 'Ưu Đãi Đặc Biệt'}
				</h3>

				{/* Mô tả */}
				{bannerDescription && (
					<p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
						{bannerDescription}
					</p>
				)}

				{/* Voucher Box (1-Click Copy) */}
				{couponCode && (
					<div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-emerald-400/80 bg-emerald-50/50 p-3 sm:p-3.5 transition-all">
						<div className="flex flex-col text-left">
							<span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
								Mã Ưu Đãi Của Bạn
							</span>
							<span className="font-mono text-base sm:text-lg font-black tracking-widest text-emerald-950">
								{couponCode}
							</span>
						</div>

						<button
							type="button"
							onClick={handleCopyCoupon}
							className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer ${
								copied
									? 'bg-emerald-600 text-white'
									: 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
							}`}
						>
							{copied ? (
								<>
									<FiCheck className="h-4 w-4 stroke-[3]" />
									<span>Đã sao chép!</span>
								</>
							) : (
								<>
									<FiCopy className="h-4 w-4" />
									<span>Sao chép mã</span>
								</>
							)}
						</button>
					</div>
				)}

				{/* Nút Hành Động CTA */}
				<div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
					{bannerCtaUrl ? (
						<Link
							href={bannerCtaUrl}
							onClick={onClose}
							className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
						>
							<span>{bannerCtaText || 'Khám Phá Ngay'}</span>
							<FiArrowRight className="h-4 w-4" />
						</Link>
					) : (
						<button
							type="button"
							onClick={onClose}
							className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-gray-800 active:scale-[0.98] cursor-pointer"
						>
							<span>{bannerCtaText || 'Đã Hiểu'}</span>
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
