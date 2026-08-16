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
		bannerBadge,
		bannerTitle,
		bannerDescription,
		couponCode,
		bannerCtaText,
		bannerCtaUrl,
		layoutStyle = 'split',
	} = settings || {}

	const handleCopyCoupon = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!couponCode) return
		navigator.clipboard.writeText(couponCode)
		setCopied(true)
		setTimeout(() => setCopied(false), 2500)
	}

	const hasImage = Boolean(bannerImage?.asset || mobileBannerImage?.asset)
	const isFullImage = layoutStyle === 'full-image' && hasImage

	const imgObject = bannerImage
		? { ...bannerImage, mobileImage: mobileBannerImage }
		: mobileBannerImage

	// Nếu là dạng Full Image đơn thuần
	if (isFullImage) {
		const Content = (
			<div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl bg-neutral-900 group cursor-pointer shadow-2xl">
				<ResponsiveImage
					image={imgObject}
					desktop={{ width: 900 }}
					mobile={{ width: 500 }}
					className="w-full h-auto max-h-[80vh] object-cover transition-transform duration-500 group-hover:scale-105"
				/>
				{bannerCtaText && (
					<div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-10">
						<span className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-900 shadow-xl transition-all hover:bg-neutral-100 hover:scale-105 active:scale-95">
							{bannerCtaText}
							<FiArrowRight className="h-4 w-4" />
						</span>
					</div>
				)}
			</div>
		)

		if (bannerCtaUrl) {
			return (
				<Link href={bannerCtaUrl} onClick={onClose} className="block">
					{Content}
				</Link>
			)
		}

		return Content
	}

	return (
		<div className="flex flex-col md:flex-row w-full overflow-hidden rounded-2xl md:rounded-3xl bg-white text-gray-900 shadow-2xl border border-gray-100">
			{/* Cột Ảnh Banner (Desktop: Left, Mobile: Top) */}
			{hasImage && (
				<div className="relative w-full md:w-1/2 h-36 sm:h-48 md:h-auto md:min-h-[360px] bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
					<ResponsiveImage
						image={imgObject}
						desktop={{ width: 700 }}
						mobile={{ width: 500 }}
						className="h-full w-full object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:hidden" />
				</div>
			)}

			{/* Cột Nội Dung */}
			<div
				className={`flex flex-col justify-center p-4 sm:p-6 md:p-8 ${
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
					{bannerTitle || 'Ưu Đãi Đặc Biệt Dành Cho Bạn'}
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
							<span>{bannerCtaText || 'Nhận Ngay'}</span>
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
