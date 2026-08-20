import { MessageSquare, Sparkles } from 'lucide-react'
import CommentCard, { type CommentItem } from './comment-card'
import CommentForm from './comment-form'

export interface CommentsSectionProps {
	postId: string
	comments?: CommentItem[]
	enableComments?: boolean
	allowComments?: boolean
	title?: string
	subtitle?: string
}

export default function CommentsSection({
	postId,
	comments = [],
	enableComments = true,
	allowComments = true,
	title = 'Comments & Discussion',
	subtitle = 'Join the conversation or ask a question. Our team reviews all inquiries.',
}: CommentsSectionProps) {
	if (!enableComments || !allowComments) return null

	// Organize into Threaded hierarchy (Root vs Child replies)
	const rootComments = comments.filter((c) => !c.parentId)
	const getRepliesFor = (rootId: string) =>
		comments.filter((c) => c.parentId === rootId)

	const totalCount = comments.length

	return (
		<section
			id="discussion"
			aria-labelledby="discussion-heading"
			className="my-12 sm:my-16 border-t border-zinc-200/80 pt-10 sm:pt-14 dark:border-zinc-800 space-y-8"
		>
			{/* Section Header */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
				<div className="space-y-1.5">
					<div className="flex items-center gap-2.5">
						<div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
							<MessageSquare className="size-4.5" />
						</div>
						<h3
							id="discussion-heading"
							className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50"
						>
							{title}
						</h3>
						<span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
							{totalCount}
						</span>
					</div>
					{subtitle && (
						<p className="text-sm text-zinc-600 dark:text-zinc-400">
							{subtitle}
						</p>
					)}
				</div>
			</div>

			{/* Main Comment Form (Post new root comment) */}
			<CommentForm postId={postId} />

			{/* Comments List */}
			{rootComments.length > 0 ? (
				<div className="space-y-6 pt-4">
					<h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
						Community Thoughts ({totalCount})
					</h4>
					<div className="space-y-6">
						{rootComments.map((rootComment) => (
							<CommentCard
								key={rootComment._id}
								comment={rootComment}
								replies={getRepliesFor(rootComment._id)}
								postId={postId}
							/>
						))}
					</div>
				</div>
			) : (
				<div className="rounded-2xl border border-dashed border-zinc-200/80 p-8 text-center text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
					<Sparkles className="mx-auto size-6 text-zinc-400 mb-2" />
					<p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
						No comments yet.
					</p>
					<p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
						Be the first to share your thoughts or ask a question!
					</p>
				</div>
			)}
		</section>
	)
}
