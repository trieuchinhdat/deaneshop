import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

interface CTABannerProps {
	badge?: string
	title: string
	description?: string
	buttonText: string
	buttonLink?: SanityLinkType
	style?: 'dark' | 'light' | 'accent'
}

export default function CTABanner({
	badge,
	title,
	description,
	buttonText = 'Learn More',
	buttonLink,
	style = 'dark',
}: CTABannerProps) {
	if (!title) return null

	const styles = {
		dark: 'bg-zinc-950 text-white border-zinc-800',
		light: 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800',
		accent: 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white border-zinc-700',
	}[style] || 'bg-zinc-950 text-white border-zinc-800'

	return (
		<div
			className={cn(
				'my-10 relative overflow-hidden rounded-2xl border p-6 sm:p-8 text-center sm:text-left shadow-md',
				styles,
			)}
		>
			{/* Decorative background glow */}
			<div className="absolute -top-24 -right-24 size-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

			<div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
				<div className="space-y-2 max-w-xl">
					{badge && (
						<span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide uppercase text-white/90 backdrop-blur-xs">
							<Sparkles className="size-3 text-amber-400" />
							{badge}
						</span>
					)}
					<h3 className="text-xl sm:text-2xl font-bold tracking-tight">
						{title}
					</h3>
					{description && (
						<p className="text-sm sm:text-base opacity-80 leading-relaxed">
							{description}
						</p>
					)}
				</div>

				<div className="shrink-0 w-full sm:w-auto">
					{buttonLink ? (
						<SanityLink
							link={buttonLink}
							className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-zinc-950 shadow-md transition-all hover:bg-zinc-100 hover:scale-102 active:scale-98 dark:bg-zinc-100 dark:text-zinc-950"
						>
							{buttonText} <ArrowRight className="size-4" />
						</SanityLink>
					) : (
						<button
							type="button"
							className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-zinc-950 shadow-md transition-all hover:bg-zinc-100 hover:scale-102 active:scale-98 dark:bg-zinc-100 dark:text-zinc-950"
						>
							{buttonText} <ArrowRight className="size-4" />
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
