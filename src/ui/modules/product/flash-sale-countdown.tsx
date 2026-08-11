'use client'

import { useEffect, useState } from 'react'

type Props = {
	endTime?: string
	totalQuota?: number
	remainingQuota?: number
}

export default function FlashSaleCountdown({
	endTime,
	totalQuota = 20,
	remainingQuota = 14,
}: Props) {
	const [timeLeft, setTimeLeft] = useState<{
		hours: string
		minutes: string
		seconds: string
	}>({
		hours: '12',
		minutes: '00',
		seconds: '00',
	})

	useEffect(() => {
		if (!endTime) return

		const target = new Date(endTime).getTime()
		if (isNaN(target)) return

		const updateCountdown = () => {
			const now = new Date().getTime()
			const diff = target - now

			if (diff <= 0) {
				setTimeLeft({ hours: '00', minutes: '00', seconds: '00' })
				return
			}

			const h = Math.floor(diff / (1000 * 60 * 60))
			const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
			const s = Math.floor((diff % (1000 * 60)) / 1000)

			setTimeLeft({
				hours: String(h).padStart(2, '0'),
				minutes: String(m).padStart(2, '0'),
				seconds: String(s).padStart(2, '0'),
			})
		}

		updateCountdown()
		const timer = setInterval(updateCountdown, 1000)
		return () => clearInterval(timer)
	}, [endTime])

	const percentage =
		totalQuota > 0 ? Math.min(100, Math.max(5, (remainingQuota / totalQuota) * 100)) : 70

	return (
		<div className="flex flex-col items-end space-y-1.5 min-w-[170px]">
			{/* Countdown Header & Boxes */}
			<div className="flex items-center gap-1 text-xs text-white">
				<span className="font-medium opacity-90 text-[12px] sm:text-[13px]">Kết thúc sau</span>
				<div className="flex items-center gap-1 font-bold text-white">
					<span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-sm bg-red-950/80 text-xs">
						{timeLeft.hours}
					</span>
					<span className="text-xs font-bold text-white/90">:</span>
					<span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-sm bg-red-950/80 text-xs">
						{timeLeft.minutes}
					</span>
					<span className="text-xs font-bold text-white/90">:</span>
					<span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-sm bg-red-950/80 text-xs">
						{timeLeft.seconds}
					</span>
				</div>
			</div>

			{/* Progress Bar Container */}
			<div className="w-full max-w-[180px]">
				<div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/30">
					<div
						className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-500"
						style={{ width: `${percentage}%` }}
					/>
				</div>
				<div className="mt-1 text-right text-[11px] sm:text-xs font-bold text-white">
					Còn {remainingQuota}/{totalQuota} suất
				</div>
			</div>
		</div>
	)
}
