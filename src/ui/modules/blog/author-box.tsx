import { Globe, Linkedin, Twitter, Instagram, Facebook, Youtube } from 'lucide-react'
import type { Person } from '@/sanity/types'
import Img from '@/ui/img'

interface AuthorBoxProps {
	author?: Person & {
		role?: string
		shortBio?: string
		socialLinks?: Array<{
			_key?: string
			platform?: string
			url?: string
		}>
	}
}

const PLATFORM_ICONS: Record<string, any> = {
	linkedin: Linkedin,
	twitter: Twitter,
	website: Globe,
	instagram: Instagram,
	facebook: Facebook,
	youtube: Youtube,
}

export default function AuthorBox({ author }: AuthorBoxProps) {
	if (!author?.name) return null

	return (
		<div className="my-10 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 sm:p-7 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/40">
			<div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
				{/* Avatar */}
				<div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-full border-2 border-white bg-zinc-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
					{author.image ? (
						<Img
							image={author.image}
							width={160}
							height={160}
							alt={author.name}
							className="size-full object-cover"
						/>
					) : (
						<div className="flex size-full items-center justify-center text-2xl font-bold text-zinc-400">
							{author.name.charAt(0)}
						</div>
					)}
				</div>

				{/* Info */}
				<div className="flex-1 space-y-2">
					<div className="space-y-0.5">
						<span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
							Written by
						</span>
						<h4 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
							{author.name}
						</h4>
						{author.role && (
							<p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
								{author.role}
							</p>
						)}
					</div>

					{author.shortBio && (
						<p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
							{author.shortBio}
						</p>
					)}

					{/* Social Links */}
					{author.socialLinks && author.socialLinks.length > 0 && (
						<div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
							{author.socialLinks.map((link, idx) => {
								if (!link?.url) return null
								const Icon = PLATFORM_ICONS[link.platform || 'website'] || Globe

								return (
									<a
										key={link._key || idx}
										href={link.url}
										target="_blank"
										rel="noopener noreferrer"
										className="flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-2xs transition-all hover:bg-zinc-900 hover:text-white hover:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-white dark:hover:text-zinc-900"
										title={link.platform || 'Website'}
										aria-label={link.platform || 'Website'}
									>
										<Icon className="size-3.5" />
									</a>
								)
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
