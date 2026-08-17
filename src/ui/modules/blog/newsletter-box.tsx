'use client'

import { useState } from 'react'
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react'

interface NewsletterBoxProps {
	title?: string
	subtitle?: string
}

export default function NewsletterBox({
	title = 'Subscribe to Our Journal',
	subtitle = 'Get curated articles, expert buying guides, and exclusive member discounts delivered directly to your inbox.',
}: NewsletterBoxProps) {
	const [email, setEmail] = useState('')
	const [submitted, setSubmitted] = useState(false)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (email) {
			setSubmitted(true)
		}
	}

	return (
		<section className="my-16 relative overflow-hidden rounded-3xl bg-zinc-950 p-8 sm:p-12 text-white shadow-xl">
			{/* Ambient background glow */}
			<div className="absolute top-0 right-0 size-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
			<div className="absolute bottom-0 left-0 size-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

			<div className="relative z-10 mx-auto max-w-2xl text-center space-y-6">
				<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-xs">
					<Mail className="size-6" />
				</div>

				<div className="space-y-2">
					<h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
						{title}
					</h3>
					<p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
						{subtitle}
					</p>
				</div>

				{submitted ? (
					<div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-950/80 border border-emerald-800 px-6 py-4 text-sm font-semibold text-emerald-300">
						<CheckCircle2 className="size-5 text-emerald-400" />
						Thank you for subscribing! Check your inbox soon.
					</div>
				) : (
					<form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-3">
						<div className="flex flex-col sm:flex-row gap-2">
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your work or personal email..."
								className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-white focus:outline-hidden"
							/>
							<button
								type="submit"
								className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-100 hover:scale-102 active:scale-98"
							>
								Subscribe <ArrowRight className="size-4" />
							</button>
						</div>
						<p className="text-[11px] text-zinc-500">
							Zero spam. Unsubscribe at any time with 1 click.
						</p>
					</form>
				)}
			</div>
		</section>
	)
}
