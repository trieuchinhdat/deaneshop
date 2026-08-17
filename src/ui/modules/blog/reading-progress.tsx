'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgress() {
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		const updateProgress = () => {
			const scrollTop = window.scrollY
			const docHeight = document.documentElement.scrollHeight - window.innerHeight
			if (docHeight > 0) {
				const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100))
				setProgress(pct)
			}
		}

		updateProgress()
		window.addEventListener('scroll', updateProgress, { passive: true })
		return () => window.removeEventListener('scroll', updateProgress)
	}, [])

	return (
		<div
			className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent pointer-events-none"
			aria-hidden="true"
		>
			<div
				className="h-full bg-gradient-to-r from-zinc-800 via-zinc-900 to-black transition-all duration-75 dark:from-zinc-400 dark:to-white"
				style={{ width: `${progress}%` }}
			/>
		</div>
	)
}
