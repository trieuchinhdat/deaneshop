'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react'

interface NewsletterFormProps {
	title?: string
	description?: string
	placeholder?: string
	buttonText?: string
}

export default function NewsletterForm({
	title = 'Join our Community',
	description = 'Subscribe to receive special offers, free giveaways, and once-in-a-lifetime deals.',
	placeholder = 'Enter your email address...',
	buttonText = 'Subscribe',
}: NewsletterFormProps) {
	const [email, setEmail] = useState('')
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
	const [errorMessage, setErrorMessage] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!email || !email.includes('@')) {
			setErrorMessage('Please enter a valid email address')
			setStatus('error')
			return
		}

		setStatus('loading')
		setErrorMessage('')

		try {
			const res = await fetch('/api/popup/lead', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					source: 'Footer Newsletter Form',
				}),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(data.message || 'Subscription failed. Please try again.')
			}

			setStatus('success')
			setEmail('')
		} catch (err: any) {
			setStatus('error')
			setErrorMessage(err.message || 'Something went wrong. Please try again.')
		}
	}

	return (
		<div className="flex flex-col gap-3">
			<div>
				<h4 className="text-base font-semibold tracking-tight text-foreground">
					{title}
				</h4>
				{description && (
					<p className="mt-1 text-sm text-muted-foreground leading-relaxed">
						{description}
					</p>
				)}
			</div>

			{status === 'success' ? (
				<div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 p-3.5 text-sm text-primary animate-in fade-in zoom-in duration-300">
					<CheckCircle2 className="size-5 shrink-0" />
					<p className="font-medium">
						Thank you for subscribing! Check your inbox for your welcome offer.
					</p>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
					<div className="relative flex items-center">
						<Mail className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
						<input
							type="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value)
								if (status === 'error') setStatus('idle')
							}}
							placeholder={placeholder}
							disabled={status === 'loading'}
							required
							className="w-full rounded-xl border border-border/80 bg-surface/80 py-2.5 pl-10 pr-28 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all focus:border-primary focus:bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
						/>
						<button
							type="submit"
							disabled={status === 'loading'}
							className="absolute right-1.5 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
						>
							{status === 'loading' ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								<>
									<span>{buttonText}</span>
									<ArrowRight className="size-3" />
								</>
							)}
						</button>
					</div>

					{status === 'error' && (
						<p className="text-xs font-medium text-destructive animate-in fade-in">
							{errorMessage}
						</p>
					)}
				</form>
			)}
		</div>
	)
}
