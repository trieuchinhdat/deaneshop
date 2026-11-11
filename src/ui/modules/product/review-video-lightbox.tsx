'use client'

import { useEffect } from 'react'
import { FiX } from 'react-icons/fi'

type Props = {
	isOpen: boolean
	videoUrl: string | null
	onClose: () => void
}

function getEmbedUrl(url: string): string | null {
	if (!url || typeof url !== 'string') return null
	const trimmed = url.trim()

	// 1. YouTube (Watch, Shorts, Embed)
	const ytMatch = trimmed.match(
		/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/i,
	)
	if (ytMatch && ytMatch[1]) {
		return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
	}

	// 2. Vimeo
	const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
	if (vimeoMatch && vimeoMatch[1]) {
		return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
	}

	// 3. TikTok
	const ttMatch = trimmed.match(
		/tiktok\.com\/(?:@[^\/]+\/video\/|v\/|embed\/v2\/)(\d+)/i,
	)
	if (ttMatch && ttMatch[1]) {
		return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`
	}

	return null
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
			document.body.style.overflow = 'hidden'
		}
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = ''
		}
	}, [isOpen, onClose])

	if (!isOpen || !videoUrl) return null

	const embedUrl = getEmbedUrl(videoUrl)

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-label="Customer review video player"
		>
			<div
				className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black p-1 shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-3 right-3 z-20 flex size-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
					aria-label="Close review video"
				>
					<FiX className="h-5 w-5" />
				</button>

				{/* Video Player: Iframe Embed OR Native HTML5 Video */}
				{embedUrl ? (
					<iframe
						src={embedUrl}
						title="Customer video review"
						className="h-[75vh] w-[90vw] max-w-3xl rounded-xl border-0 aspect-video sm:aspect-[9/16] md:aspect-video"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					/>
				) : (
					<video
						src={videoUrl}
						controls
						autoPlay
						playsInline
						className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
					/>
				)}
			</div>
		</div>
	)
}
