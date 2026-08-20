'use client'

import { useState } from 'react'
import { CornerDownRight, ShieldCheck, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import CommentForm from './comment-form'

export interface CommentItem {
	_id: string
	authorName: string
	content: string
	isAuthorReply?: boolean
	createdAt: string
	parentId?: string
}

function formatRelativeTime(dateString: string): string {
	try {
		const date = new Date(dateString)
		const now = new Date()
		const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

		if (diffSec < 60) return 'Just now'
		const diffMin = Math.floor(diffSec / 60)
		if (diffMin < 60) return `${diffMin}m ago`
		const diffHour = Math.floor(diffMin / 60)
		if (diffHour < 24) return `${diffHour}h ago`
		const diffDay = Math.floor(diffHour / 24)
		if (diffDay < 7) return `${diffDay}d ago`

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
		})
	} catch {
		return 'Recently'
	}
}

export default function CommentCard({
	comment,
	replies = [],
	postId,
}: {
	comment: CommentItem
	replies?: CommentItem[]
	postId: string
}) {
	const [isReplying, setIsReplying] = useState(false)
	const initial = (comment.authorName || 'U').charAt(0).toUpperCase()

	return (
		<div className="group space-y-3">
			<div className="flex items-start gap-3.5 sm:gap-4">
				{/* Avatar Initial */}
				<div
					className={cn(
						'flex size-10 shrink-0 select-none items-center justify-center rounded-2xl text-sm font-bold shadow-xs',
						comment.isAuthorReply
							? 'bg-blue-600 text-white dark:bg-blue-500'
							: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700',
					)}
					aria-hidden="true"
				>
					{initial || <User className="size-4" />}
				</div>

				{/* Content Box */}
				<div className="flex-1 space-y-1.5 min-w-0">
					{/* Header */}
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-bold text-sm text-zinc-950 dark:text-zinc-50">
							{comment.authorName}
						</span>

						{comment.isAuthorReply && (
							<span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 uppercase tracking-wide dark:bg-blue-950/70 dark:text-blue-300">
								<ShieldCheck className="size-3 text-blue-600 dark:text-blue-400" />
								Author / Team
							</span>
						)}

						<span className="text-zinc-400 dark:text-zinc-500 text-xs">•</span>
						<time
							dateTime={comment.createdAt}
							className="text-xs text-zinc-600 dark:text-zinc-400"
						>
							{formatRelativeTime(comment.createdAt)}
						</time>
					</div>

					{/* Message Body */}
					<div className="rounded-2xl rounded-tl-sm bg-zinc-50/80 p-3.5 sm:p-4 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800/80">
						<p className="whitespace-pre-line">{comment.content}</p>
					</div>

					{/* Reply Action */}
					<div className="pt-0.5">
						<button
							type="button"
							onClick={() => setIsReplying(!isReplying)}
							className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer py-1"
							aria-label={`Reply to ${comment.authorName}`}
						>
							<CornerDownRight className="size-3.5" />
							<span>{isReplying ? 'Cancel Reply' : 'Reply'}</span>
						</button>
					</div>
				</div>
			</div>

			{/* Inline Reply Form */}
			{isReplying && (
				<div className="ml-8 sm:ml-14 pt-1">
					<CommentForm
						postId={postId}
						parentCommentId={comment._id}
						replyingToName={comment.authorName}
						onSuccess={() => setIsReplying(false)}
					/>
				</div>
			)}

			{/* Threaded Nested Replies (1 Level) */}
			{replies.length > 0 && (
				<div className="ml-5 sm:ml-12 border-l-2 border-zinc-200/80 pl-4 sm:pl-6 space-y-4 pt-2 dark:border-zinc-800">
					{replies.map((reply) => {
						const replyInitial = (reply.authorName || 'U').charAt(0).toUpperCase()
						return (
							<div key={reply._id} className="flex items-start gap-3">
								<div
									className={cn(
										'flex size-8 shrink-0 select-none items-center justify-center rounded-xl text-xs font-bold shadow-xs',
										reply.isAuthorReply
											? 'bg-blue-600 text-white dark:bg-blue-500'
											: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700',
									)}
									aria-hidden="true"
								>
									{replyInitial}
								</div>
								<div className="flex-1 space-y-1 min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-bold text-xs text-zinc-950 dark:text-zinc-50">
											{reply.authorName}
										</span>
										{reply.isAuthorReply && (
											<span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 uppercase dark:bg-blue-950/70 dark:text-blue-300">
												<ShieldCheck className="size-2.5 text-blue-600 dark:text-blue-400" />
												Author
											</span>
										)}
										<span className="text-zinc-400 dark:text-zinc-500 text-xs">•</span>
										<time
											dateTime={reply.createdAt}
											className="text-xs text-zinc-600 dark:text-zinc-400"
										>
											{formatRelativeTime(reply.createdAt)}
										</time>
									</div>
									<div className="rounded-xl rounded-tl-sm bg-zinc-50/80 p-3 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800/80">
										<p className="whitespace-pre-line">{reply.content}</p>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
