'use client'

import { useEffect } from 'react'
import { FiX } from 'react-icons/fi'

type Props = {
	isOpen: boolean
	videoUrl: string | null
	onClose: () => void
}

export default function ReviewVideoLightbox({
	isOpen,
	videoUrl,
	onClose,
}: Props) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}
		if (isOpen) {
			window.addEventListener('keydown', handleKeyDown)
		}
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen, onClose])

	if (!isOpen || !videoUrl) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black p-1 shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-3 right-3 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black"
					aria-label="Close video"
				>
					<FiX className="h-5 w-5" />
				</button>

				{/* Video Player */}
				<video
					src={videoUrl}
					controls
					autoPlay
					playsInline
					className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
				/>
			</div>
		</div>
	)
}
