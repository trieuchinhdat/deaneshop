'use client'

import { useState } from 'react'
import {
	FiAlertTriangle,
	FiAward,
	FiCheck,
	FiCheckCircle,
	FiClock,
	FiCornerDownRight,
	FiExternalLink,
	FiMail,
	FiMessageCircle,
	FiMessageSquare,
	FiSend,
	FiTrash2,
	FiUser,
	FiX,
} from 'react-icons/fi'

type CommentModalProps = {
	comment: any
	onClose: () => void
	onCommentUpdated: (updatedComment: any) => void
	onCommentDeleted?: (deletedId: string) => void
	onReplyCreated?: (newReply: any) => void
}

export default function CommentModal({
	comment,
	onClose,
	onCommentUpdated,
	onCommentDeleted,
	onReplyCreated,
}: CommentModalProps) {
	const [isApproved, setIsApproved] = useState<boolean>(Boolean(comment.isApproved))
	const [isAuthorReply, setIsAuthorReply] = useState<boolean>(Boolean(comment.isAuthorReply))
	const [replyContent, setReplyContent] = useState('')
	const [authorName, setAuthorName] = useState('Editorial Team')
	const [isSubmittingReply, setIsSubmittingReply] = useState(false)
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [notification, setNotification] = useState<{
		type: 'success' | 'error'
		message: string
	} | null>(null)

	const showNotify = (type: 'success' | 'error', message: string) => {
		setNotification({ type, message })
		setTimeout(() => setNotification(null), 3000)
	}

	// Toggle Approved status or Author badge
	const handleUpdateStatus = async (
		newApprovedState?: boolean,
		newAuthorBadgeState?: boolean,
	) => {
		try {
			setIsUpdatingStatus(true)
			const nextApproved =
				typeof newApprovedState === 'boolean' ? newApprovedState : isApproved
			const nextAuthor =
				typeof newAuthorBadgeState === 'boolean' ? newAuthorBadgeState : isAuthorReply

			const res = await fetch('/api/admin/comments/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					commentId: comment._id || comment.id,
					isApproved: nextApproved,
					isAuthorReply: nextAuthor,
				}),
			})

			const data = await res.json()
			if (data.success) {
				if (typeof newApprovedState === 'boolean') setIsApproved(newApprovedState)
				if (typeof newAuthorBadgeState === 'boolean') setIsAuthorReply(newAuthorBadgeState)
				onCommentUpdated({
					...comment,
					isApproved: nextApproved,
					isAuthorReply: nextAuthor,
				})
				showNotify('success', 'Comment status updated successfully!')
			} else {
				showNotify('error', data.error || 'Failed to update comment status.')
			}
		} catch (err: any) {
			showNotify('error', err?.message || 'Connection error.')
		} finally {
			setIsUpdatingStatus(false)
		}
	}

	// Submit Official Reply
	const handleSubmitOfficialReply = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!replyContent.trim()) {
			showNotify('error', 'Please enter a reply message.')
			return
		}

		try {
			setIsSubmittingReply(true)
			const res = await fetch('/api/admin/comments/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'REPLY',
					commentId: comment._id || comment.id,
					replyContent: replyContent.trim(),
					authorName: authorName.trim(),
				}),
			})

			const data = await res.json()
			if (data.success) {
				showNotify('success', 'Official specialist reply posted!')
				setReplyContent('')
				setIsApproved(true)
				onCommentUpdated({
					...comment,
					isApproved: true,
				})
				if (onReplyCreated && data.reply) {
					onReplyCreated(data.reply)
				}
			} else {
				showNotify('error', data.error || 'Failed to post reply.')
			}
		} catch (err: any) {
			showNotify('error', err?.message || 'Failed to connect.')
		} finally {
			setIsSubmittingReply(false)
		}
	}

	// Delete Comment
	const handleDelete = async () => {
		if (
			!window.confirm(
				'Are you sure you want to permanently delete this comment? This action cannot be undone.',
			)
		) {
			return
		}

		try {
			setIsDeleting(true)
			const res = await fetch('/api/admin/comments/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'DELETE',
					commentId: comment._id || comment.id,
				}),
			})

			const data = await res.json()
			if (data.success) {
				if (onCommentDeleted) onCommentDeleted(comment._id || comment.id)
				onClose()
			} else {
				showNotify('error', data.error || 'Failed to delete comment.')
			}
		} catch (err: any) {
			showNotify('error', err?.message || 'Delete operation failed.')
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 print:hidden">
			<div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold shadow-xs">
							<FiMessageSquare className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-base sm:text-lg font-black text-slate-900">
								Blog Comment Moderation
							</h3>
							<p className="text-xs text-slate-500">
								Approve user discussions, reply as an editorial author, or remove spam.
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
					>
						<FiX className="h-5 w-5" />
					</button>
				</div>

				{/* Floating Notification */}
				{notification && (
					<div
						className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200 ${
							notification.type === 'success'
								? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
								: 'bg-rose-50 text-rose-800 border-b border-rose-200'
						}`}
					>
						<div className="flex items-center gap-2">
							{notification.type === 'success' ? (
								<FiCheck className="h-4 w-4 text-emerald-600" />
							) : (
								<FiAlertTriangle className="h-4 w-4 text-rose-600" />
							)}
							<span>{notification.message}</span>
						</div>
						<button
							type="button"
							onClick={() => setNotification(null)}
							className="text-slate-400 hover:text-slate-600"
						>
							<FiX className="h-3.5 w-3.5" />
						</button>
					</div>
				)}

				{/* Modal Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{/* Comment Header & Approval Actions */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
						<div>
							<div className="flex items-center gap-2">
								<FiUser className="h-4 w-4 text-slate-400" />
								<span className="font-bold text-slate-900 text-sm">
									{comment.authorName || 'Guest Reader'}
								</span>
								{isAuthorReply && (
									<span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-black text-indigo-700">
										<FiAward className="h-3 w-3" /> Staff / Specialist
									</span>
								)}
							</div>

							<div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
								{comment.authorEmail && (
									<div className="flex items-center gap-1">
										<FiMail className="h-3 w-3" />
										<span>{comment.authorEmail}</span>
									</div>
								)}
								<div className="flex items-center gap-1">
									<FiClock className="h-3 w-3" />
									<span>
										{comment.createdAt
											? new Date(comment.createdAt).toLocaleDateString('en-US', {
													month: 'short',
													day: 'numeric',
													year: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
												})
											: ''}
									</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2 self-start sm:self-auto">
							<span
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
									isApproved
										? 'bg-emerald-50 text-emerald-800 border-emerald-200'
										: 'bg-amber-50 text-amber-800 border-amber-200'
								}`}
							>
								{isApproved ? <FiCheckCircle className="h-3.5 w-3.5" /> : <FiClock className="h-3.5 w-3.5" />}
								<span>{isApproved ? 'Approved' : 'Pending Moderation'}</span>
							</span>

							<button
								type="button"
								onClick={() => handleUpdateStatus(!isApproved, isAuthorReply)}
								disabled={isUpdatingStatus}
								className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
									isApproved
										? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
										: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
								}`}
							>
								{isApproved ? 'Unapprove' : 'Approve Now'}
							</button>
						</div>
					</div>

					{/* Article Reference Card */}
					{comment.post && (
						<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-1">
							<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
								Commented Article:
							</span>
							<div className="flex items-center justify-between">
								<h4 className="font-bold text-sm text-slate-900">
									{comment.post.title || 'Blog Article'}
								</h4>
								{comment.post.slug && (
									<a
										href={`/blog/${comment.post.slug}`}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
									>
										<span>View Post</span>
										<FiExternalLink className="h-3.5 w-3.5" />
									</a>
								)}
							</div>
						</div>
					)}

					{/* Parent Comment Context (If this is a reply) */}
					{comment.parentComment && (
						<div className="rounded-2xl border border-dashed border-slate-300 p-4 bg-slate-50/50 space-y-1">
							<div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
								<FiCornerDownRight className="h-3.5 w-3.5" />
								<span>Replying to {comment.parentComment.authorName || 'User'}:</span>
							</div>
							<p className="text-xs text-slate-600 italic line-clamp-2">
								&quot;{comment.parentComment.content}&quot;
							</p>
						</div>
					)}

					{/* Comment Body */}
					<div className="space-y-2">
						<label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
							Comment Content
						</label>
						<p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
							{comment.content}
						</p>
					</div>

					{/* Quick Actions Bar */}
					<div className="flex items-center justify-between pt-2 border-t border-slate-100">
						<button
							type="button"
							onClick={() => handleUpdateStatus(isApproved, !isAuthorReply)}
							disabled={isUpdatingStatus}
							className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer disabled:opacity-50"
						>
							<FiAward className="h-3.5 w-3.5" />
							<span>{isAuthorReply ? 'Remove Official Author Badge' : 'Mark as Author / Specialist'}</span>
						</button>

						<button
							type="button"
							onClick={handleDelete}
							disabled={isDeleting}
							className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer disabled:opacity-50"
						>
							<FiTrash2 className="h-3.5 w-3.5" />
							<span>{isDeleting ? 'Deleting...' : 'Delete Comment'}</span>
						</button>
					</div>

					{/* Reply Form */}
					<form
						onSubmit={handleSubmitOfficialReply}
						className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4 shadow-2xs"
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<FiMessageCircle className="h-4 w-4 text-indigo-600" />
								<h4 className="font-bold text-xs uppercase tracking-wider text-indigo-950">
									Post Official Specialist Reply
								</h4>
							</div>
							<span className="text-[10px] text-indigo-600 font-bold bg-indigo-100/70 px-2 py-0.5 rounded-md">
								Auto-Approves Comment
							</span>
						</div>

						<div className="space-y-3">
							<div>
								<label className="block text-[11px] font-bold text-slate-600 mb-1">
									Display Name
								</label>
								<input
									type="text"
									value={authorName}
									onChange={(e) => setAuthorName(e.target.value)}
									placeholder="e.g. Editorial Team, Community Lead"
									className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base sm:text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-hidden"
								/>
							</div>

							<div>
								<label className="block text-[11px] font-bold text-slate-600 mb-1">
									Reply Message
								</label>
								<textarea
									rows={3}
									value={replyContent}
									onChange={(e) => setReplyContent(e.target.value)}
									placeholder="Write an insightful, professional response addressing the reader's question..."
									className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base sm:text-xs text-slate-900 leading-relaxed focus:border-indigo-600 focus:outline-hidden"
								/>
							</div>
						</div>

						<div className="flex justify-end">
							<button
								type="submit"
								disabled={isSubmittingReply || !replyContent.trim()}
								className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
							>
								<FiSend className="h-3.5 w-3.5" />
								<span>{isSubmittingReply ? 'Posting...' : 'Post Official Reply'}</span>
							</button>
						</div>
					</form>
				</div>

				{/* Modal Footer */}
				<div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	)
}
