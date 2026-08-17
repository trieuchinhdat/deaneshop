'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import Img from '@/ui/img'

interface VideoEmbedProps {
	url?: string
	title?: string
	customThumbnail?: any
	caption?: string
	aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16'
}

function getYouTubeId(url: string): string | null {
	if (!url) return null
	const match = url.match(
		/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
	)
	return match ? match[1] : null
}

function getVimeoId(url: string): string | null {
	if (!url) return null
	const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/)
	return match ? match[3] : null
}

export default function VideoEmbed({
	url,
	title,
	customThumbnail,
	caption,
	aspectRatio = '16:9',
}: VideoEmbedProps) {
	const [isPlaying, setIsPlaying] = useState(false)

	if (!url) return null

	const ytId = getYouTubeId(url)
	const vimeoId = getVimeoId(url)

	const defaultThumbnail = ytId
		? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
		: null

	const aspectClasses = {
		'16:9': 'aspect-video',
		'4:3': 'aspect-4/3',
		'1:1': 'aspect-square',
		'9:16': 'aspect-9/16 max-w-sm mx-auto',
	}[aspectRatio] || 'aspect-video'

	return (
		<figure className="my-8 space-y-2">
			<div
				className={cn(
					'relative w-full overflow-hidden rounded-2xl bg-zinc-950 shadow-md',
					aspectClasses,
				)}
			>
				{isPlaying ? (
					ytId ? (
						<iframe
							src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
							title={title || 'Embedded Video'}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
							className="size-full border-0"
						/>
					) : vimeoId ? (
						<iframe
							src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
							title={title || 'Embedded Video'}
							allow="autoplay; fullscreen; picture-in-picture"
							allowFullScreen
							className="size-full border-0"
						/>
					) : (
						<video
							src={url}
							controls
							autoPlay
							className="size-full object-cover"
						/>
					)
				) : (
					/* Facade Poster (Zero weight before interaction) */
					<button
						type="button"
						onClick={() => setIsPlaying(true)}
						className="group relative size-full cursor-pointer focus:outline-hidden"
						aria-label={`Play video: ${title || 'Video'}`}
					>
						{customThumbnail ? (
							<Img
								image={customThumbnail}
								width={1280}
								height={720}
								alt={title ?? 'Video thumbnail'}
								className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
							/>
						) : defaultThumbnail ? (
							<img
								src={defaultThumbnail}
								alt={title ?? 'Video thumbnail'}
								className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
								loading="lazy"
							/>
						) : (
							<div className="size-full bg-zinc-900" />
						)}

						{/* Dark Overlay */}
						<div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />

						{/* Play Button */}
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="flex size-16 sm:size-20 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-xl backdrop-blur-xs transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-active:scale-95">
								<Play className="ml-1 size-7 sm:size-8 fill-zinc-900 text-zinc-900" />
							</div>
						</div>

						{/* Video Title Header */}
						{title && (
							<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-6 text-left">
								<span className="line-clamp-2 text-sm sm:text-base font-semibold text-white drop-shadow-xs">
									{title}
								</span>
							</div>
						)}
					</button>
				)}
			</div>
			{caption && (
				<figcaption className="text-xs text-zinc-500 dark:text-zinc-400 italic text-center">
					{caption}
				</figcaption>
			)}
		</figure>
	)
}
