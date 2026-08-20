'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, MessageSquare, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CommentForm({
	postId,
	parentCommentId,
	replyingToName,
	onSuccess,
}: {
	postId: string
	parentCommentId?: string
	replyingToName?: string
	onSuccess?: () => void
}) {
	const [authorName, setAuthorName] = useState('')
	const [authorEmail, setAuthorEmail] = useState('')
	const [content, setContent] = useState('')
	const [honeypot, setHoneypot] = useState('') // Invisible anti-bot trap

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errorMsg, setErrorMsg] = useState<string | null>(null)
	const [successMsg, setSuccessMsg] = useState<string | null>(null)
	const [isFocused, setIsFocused] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setErrorMsg(null)

		// Basic client validation
		if (!authorName.trim() || !authorEmail.trim() || !content.trim()) {
			setErrorMsg('Please fill in all required fields.')
			return
		}

		setIsSubmitting(true)

		try {
			const res = await fetch('/api/blog/comments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					postId,
					authorName: authorName.trim(),
					authorEmail: authorEmail.trim(),
					content: content.trim(),
					parentCommentId,
					honeypot,
				}),
			})

			const data = await res.json()

			if (!res.ok) {
				throw new Error(data.error || 'Failed to submit comment. Please try again.')
			}

			setSuccessMsg(
				data.message ||
					'Thank you! Your comment has been submitted and will appear after moderation.',
			)
			setAuthorName('')
			setAuthorEmail('')
			setContent('')
			setIsFocused(false)

			if (onSuccess) {
				setTimeout(() => {
					onSuccess()
				}, 3000)
			}
		} catch (err: any) {
			setErrorMsg(err.message || 'An error occurred. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-7 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90 transition-all">
			{replyingToName && (
				<div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
					<span>
						Replying to <strong className="text-zinc-900 dark:text-zinc-100">{replyingToName}</strong>
					</span>
				</div>
			)}

			{successMsg ? (
				<div className="flex items-start gap-3 rounded-2xl bg-emerald-50/80 p-4.5 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
					<CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
					<div className="space-y-1">
						<p className="font-bold">Comment Submitted</p>
						<p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
							{successMsg}
						</p>
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-4">
					{errorMsg && (
						<div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
							<AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
							<span>{errorMsg}</span>
						</div>
					)}

					{/* Invisible Honeypot Field for Bot Prevention */}
					<div className="hidden" aria-hidden="true">
						<label htmlFor={`website-url-${postId}`}>Leave empty</label>
						<input
							type="text"
							id={`website-url-${postId}`}
							name="website_url"
							value={honeypot}
							onChange={(e) => setHoneypot(e.target.value)}
							tabIndex={-1}
							autoComplete="off"
						/>
					</div>

					{/* Textarea */}
					<div className="space-y-1.5">
						<label
							htmlFor={`comment-content-${postId}-${parentCommentId || 'root'}`}
							className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
						>
							Your Message / Question <span className="text-rose-500">*</span>
						</label>
						<textarea
							id={`comment-content-${postId}-${parentCommentId || 'root'}`}
							rows={isFocused || parentCommentId ? 4 : 3}
							value={content}
							onChange={(e) => setContent(e.target.value)}
							onFocus={() => setIsFocused(true)}
							placeholder={
								replyingToName
									? `Write your reply to ${replyingToName}...`
									: 'Ask a question, share your perspective, or leave a review...'
							}
							required
							minLength={5}
							maxLength={1000}
							className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-zinc-200 dark:focus:bg-zinc-900 transition-all resize-y"
						/>
					</div>

					{/* Name and Email Row (Expands smoothly on focus or reply) */}
					<div
						className={cn(
							'grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-300',
							isFocused || content.length > 0 || parentCommentId
								? 'opacity-100 max-h-40'
								: 'opacity-100',
						)}
					>
						<div className="space-y-1.5">
							<label
								htmlFor={`comment-name-${postId}-${parentCommentId || 'root'}`}
								className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
							>
								Full Name <span className="text-rose-500">*</span>
							</label>
							<input
								type="text"
								id={`comment-name-${postId}-${parentCommentId || 'root'}`}
								value={authorName}
								onChange={(e) => setAuthorName(e.target.value)}
								placeholder="e.g. Alex Nguyen"
								required
								maxLength={80}
								className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-zinc-200 dark:focus:bg-zinc-900 transition-all"
							/>
						</div>

						<div className="space-y-1.5">
							<label
								htmlFor={`comment-email-${postId}-${parentCommentId || 'root'}`}
								className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
							>
								Email Address <span className="text-rose-500">*</span>
							</label>
							<input
								type="email"
								id={`comment-email-${postId}-${parentCommentId || 'root'}`}
								value={authorEmail}
								onChange={(e) => setAuthorEmail(e.target.value)}
								placeholder="alex@company.com (Private)"
								required
								className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-600 dark:placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-zinc-200 dark:focus:bg-zinc-900 transition-all"
							/>
						</div>
					</div>

					{/* Action Bar */}
					<div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
						<p className="text-[11px] text-zinc-600 dark:text-zinc-400 text-center sm:text-left">
							🔒 Email is kept strictly confidential and never displayed publicly.
						</p>

						<button
							type="submit"
							disabled={isSubmitting}
							className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 py-2.5 text-xs font-bold tracking-wide uppercase text-white shadow-xs transition hover:bg-zinc-800 active:scale-98 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									<span>Submitting...</span>
								</>
							) : (
								<>
									<Send className="size-3.5" />
									<span>{parentCommentId ? 'Post Reply' : 'Submit Comment'}</span>
								</>
							)}
						</button>
					</div>
				</form>
			)}
		</div>
	)
}
