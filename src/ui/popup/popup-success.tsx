'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiCheck, FiCopy, FiGift, FiShoppingBag } from 'react-icons/fi'

type PopupSuccessProps = {
	title?: string
	description?: string
	voucherCode?: string
	ctaUrl?: string
	ctaText?: string
	onClose: () => void
}

export default function PopupSuccess({
	title,
	description,
	voucherCode,
	ctaUrl = '/collections/all',
	ctaText,
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
		<div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl shadow-2xl max-w-lg mx-auto">
			{/* Icon Celebration */}
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner mb-5">
				<FiGift className="h-8 w-8 stroke-[2.2] animate-bounce" />
			</div>

			{/* Title & Description */}
			<h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-snug">
				{title || 'Welcome to the Community 🎉'}
			</h3>

			<p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
				{description ||
					"Thank you for subscribing. We've sent a confirmation note to your inbox."}
			</p>

			{/* Optional Voucher Code Box */}
			{voucherCode && (
				<div className="mt-6 w-full rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 sm:p-5">
					<span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
						Your Reward Code
					</span>
					<div className="flex items-center justify-center gap-3">
						<span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-foreground">
							{voucherCode}
						</span>
						<button
							type="button"
							onClick={handleCopy}
							className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer ${
								copied
									? 'bg-primary text-primary-foreground'
									: 'bg-white dark:bg-gray-800 text-primary border border-primary/30 hover:bg-primary/10'
							}`}
						>
							{copied ? (
								<>
									<FiCheck className="h-4 w-4 stroke-[3]" />
									<span>Copied!</span>
								</>
							) : (
								<>
									<FiCopy className="h-4 w-4" />
									<span>Copy Code</span>
								</>
							)}
						</button>
					</div>
				</div>
			)}

			{/* Action Button */}
			<div className="mt-6 w-full flex flex-col gap-2.5">
				<Link
					href={ctaUrl || '/collections/all'}
					onClick={onClose}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white dark:text-gray-900 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
				>
					<FiShoppingBag className="h-4 w-4" />
					<span>{ctaText || 'Explore Collection'}</span>
				</Link>

				<button
					type="button"
					onClick={onClose}
					className="py-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors cursor-pointer"
				>
					Close Window
				</button>
			</div>
		</div>
	)
}
