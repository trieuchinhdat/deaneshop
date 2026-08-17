'use client'

import { useState } from 'react'
import {
	Share2,
	Link2,
	Check,
	Facebook,
	Linkedin,
	Twitter,
	MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SocialShareProps {
	url: string
	title: string
	description?: string
	className?: string
}

export default function SocialShare({
	url,
	title,
	description = '',
	className,
}: SocialShareProps) {
	const [copied, setCopied] = useState(false)

	const encodedUrl = encodeURIComponent(url)
	const encodedTitle = encodeURIComponent(title)

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(url)
			setCopied(true)
			setTimeout(() => setCopied(false), 2500)
		} catch (err) {
			console.error('Failed to copy URL:', err)
		}
	}

	const handleNativeShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title,
					text: description,
					url,
				})
			} catch (err) {
				// User dismissed share sheet
			}
		} else {
			handleCopy()
		}
	}

	const shareLinks = [
		{
			name: 'X (Twitter)',
			icon: Twitter,
			href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
			color: 'hover:bg-zinc-900 hover:text-white',
		},
		{
			name: 'LinkedIn',
			icon: Linkedin,
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
			color: 'hover:bg-[#0A66C2] hover:text-white',
		},
		{
			name: 'Facebook',
			icon: Facebook,
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
			color: 'hover:bg-[#1877F2] hover:text-white',
		},
		{
			name: 'WhatsApp',
			icon: MessageCircle,
			href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
			color: 'hover:bg-[#25D366] hover:text-white',
		},
	]

	return (
		<div
			className={cn(
				'flex flex-wrap items-center gap-2 py-3 text-xs sm:text-sm',
				className,
			)}
		>
			<span className="font-semibold text-zinc-500 uppercase tracking-wider text-[11px] mr-1">
				Share:
			</span>

			{/* Native Share on mobile devices */}
			<button
				type="button"
				onClick={handleNativeShare}
				className="flex size-10 sm:size-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700 transition-all hover:bg-zinc-900 hover:text-white hover:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-zinc-900 cursor-pointer shadow-2xs"
				title="Share"
				aria-label="Share this article"
			>
				<Share2 className="size-4" />
			</button>

			{/* Global Social Icons */}
			{shareLinks.map((item) => {
				const Icon = item.icon
				return (
					<a
						key={item.name}
						href={item.href}
						target="_blank"
						rel="noopener noreferrer"
						className={cn(
							'flex size-10 sm:size-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-2xs transition-all hover:scale-105 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
							item.color,
						)}
						title={`Share on ${item.name}`}
						aria-label={`Share on ${item.name}`}
					>
						<Icon className="size-4" />
					</a>
				)
			})}

			{/* Copy Link Button */}
			<button
				type="button"
				onClick={handleCopy}
				className={cn(
					'relative flex min-h-[40px] sm:min-h-[36px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer',
					copied
						? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
						: 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
				)}
				title="Copy link to clipboard"
			>
				{copied ? (
					<>
						<Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
						<span>Copied!</span>
					</>
				) : (
					<>
						<Link2 className="size-3.5" />
						<span>Copy Link</span>
					</>
				)}
			</button>
		</div>
	)
}
