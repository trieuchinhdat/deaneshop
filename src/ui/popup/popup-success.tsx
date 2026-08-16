'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiCheck, FiCopy, FiGift, FiShoppingBag } from 'react-icons/fi'

type PopupSuccessProps = {
	title?: string
	description?: string
	voucherCode?: string
	onClose: () => void
}

export default function PopupSuccess({
	title,
	description,
	voucherCode,
	onClose,
}: PopupSuccessProps) {
	const [copied, setCopied] = useState(false)

	const handleCopy = () => {
		if (!voucherCode) return
		navigator.clipboard.writeText(voucherCode)
		setCopied(true)
		setTimeout(() => setCopied(false), 2500)
	}

	return (
		<div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-lg mx-auto">
			{/* Icon Celebration */}
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner mb-5">
				<FiGift className="h-8 w-8 stroke-[2.2] animate-bounce" />
			</div>

			{/* Tiêu đề & Lời chúc */}
			<h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug">
				{title || 'Chúc Mừng Bạn Đã Nhận Ưu Đãi! 🎉'}
			</h3>

			<p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed max-w-md">
				{description ||
					'Mã giảm giá độc quyền của bạn đã sẵn sàng. Hãy sao chép và áp dụng ngay khi đặt hàng!'}
			</p>

			{/* Box Mã Voucher */}
			{voucherCode && (
				<div className="mt-6 w-full rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/70 p-4 sm:p-5">
					<span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
						Mã Khuyến Mãi Của Bạn
					</span>
					<div className="flex items-center justify-center gap-3">
						<span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-emerald-950">
							{voucherCode}
						</span>
						<button
							type="button"
							onClick={handleCopy}
							className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer ${
								copied
									? 'bg-emerald-600 text-white'
									: 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
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
									<span>Sao chép</span>
								</>
							)}
						</button>
					</div>
				</div>
			)}

			{/* Nút Hành Động Mua Ngay */}
			<div className="mt-6 w-full flex flex-col gap-2.5">
				<Link
					href="/collections/all"
					onClick={onClose}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-gray-800 active:scale-[0.98]"
				>
					<FiShoppingBag className="h-4 w-4" />
					<span>Khám Phá & Mua Sắm Ngay</span>
				</Link>

				<button
					type="button"
					onClick={onClose}
					className="py-2 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
				>
					Đóng cửa sổ
				</button>
			</div>
		</div>
	)
}
