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
	const [authorName, setAuthorName] = useState('Ecocros Specialist (Tác giả)')
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
					commentId: comment._id,
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
				showNotify('success', 'Đã cập nhật trạng thái bình luận thành công!')
			} else {
				showNotify('error', data.error || 'Cập nhật thất bại.')
			}
		} catch (err: any) {
			showNotify('error', err?.message || 'Có lỗi kết nối.')
		} finally {
			setIsUpdatingStatus(false)
		}
	}

	// Submit Official Reply
	const handleSubmitOfficialReply = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!replyContent.trim()) {
			showNotify('error', 'Vui lòng nhập nội dung câu trả lời.')
			return
		}

		try {
			setIsSubmittingReply(true)
			const res = await fetch('/api/admin/comments/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					commentId: comment._id,
					action: 'REPLY',
					replyContent: replyContent.trim(),
					authorName: authorName.trim(),
				}),
			})

			const data = await res.json()
			if (data.success) {
				setIsApproved(true)
				onCommentUpdated({ ...comment, isApproved: true })
				if (data.reply && onReplyCreated) {
					onReplyCreated(data.reply)
				}
				setReplyContent('')
				showNotify('success', 'Đã đăng phản hồi chính thức của Tác giả thành công!')
			} else {
				showNotify('error', data.error || 'Đăng phản hồi thất bại.')
			}
		} catch (err: any) {
			showNotify('error', err?.message || 'Có lỗi kết nối.')
		} finally {
			setIsSubmittingReply(false)
		}
	}

	// Delete comment
	const handleDeleteComment = async () => {
		if (
			!window.confirm(
				'Bạn có chắc chắn muốn xóa vĩnh viễn bình luận này khỏi hệ thống? Hành động này không thể khôi phục.',
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
					commentId: comment._id,
					action: 'DELETE',
				}),
			})

			const data = await res.json()
			if (data.success) {
				if (onCommentDeleted) onCommentDeleted(comment._id)
				onClose()
			} else {
				showNotify('error', data.error || 'Xóa thất bại.')
			}
		} catch (err: any) {
			showNotify('error', err?.message || 'Có lỗi kết nối.')
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold shadow-xs">
							<FiMessageSquare className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-base sm:text-lg font-black text-slate-900">
								Kiểm Duyệt & Phản Hồi Bình Luận Blog
							</h3>
							<p className="text-xs text-slate-500">
								Xét duyệt bình luận độc giả, phát hiện spam và đăng phản hồi chuyên gia.
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

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{/* Toast alert */}
					{notification && (
						<div
							className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-bold animate-in fade-in ${
								notification.type === 'success'
									? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
									: 'bg-rose-50 border border-rose-200 text-rose-800'
							}`}
						>
							{notification.type === 'success' ? (
								<FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
							) : (
								<FiAlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
							)}
							<span>{notification.message}</span>
						</div>
					)}

					{/* Post Info & Author Metadata */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
						<div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
								Bài Viết Đích (Blog Article)
							</span>
							<p className="font-bold text-slate-900 text-sm line-clamp-2">
								{comment.post?.title || 'Bài viết Blog'}
							</p>
							{comment.post?.slug && (
								<a
									href={`/blog/${comment.post.slug}`}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline mt-1"
								>
									<span>Xem bài viết thực tế</span>
									<FiExternalLink className="h-3 w-3" />
								</a>
							)}
						</div>

						<div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
								Thông Tin Người Bình Luận
							</span>
							<div className="flex items-center gap-2">
								<p className="font-bold text-slate-900 text-sm">
									{comment.authorName || 'Độc giả'}
								</p>
								{isAuthorReply && (
									<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-extrabold">
										<FiAward className="h-3 w-3" /> Tác Giả / CSKH
									</span>
								)}
							</div>
							<div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
								<FiMail className="h-3 w-3 text-slate-400" />
								<span>{comment.authorEmail || 'Chưa cung cấp email'}</span>
							</div>
							<span className="text-[10px] text-slate-400 mt-1 block">
								Gửi lúc:{' '}
								{comment.createdAt ? new Date(comment.createdAt).toLocaleString('vi-VN') : ''}
							</span>
						</div>
					</div>

					{/* Parent Comment Context if Threaded */}
					{comment.parentComment && (
						<div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-3.5 space-y-1">
							<div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-800">
								<FiCornerDownRight className="h-3.5 w-3.5 text-indigo-600" />
								<span>Bình luận này là phản hồi cho:</span>
							</div>
							<p className="text-xs text-slate-700 italic pl-5">
								"{comment.parentComment.content || 'Nội dung bình luận gốc'}"
							</p>
							<span className="text-[10px] text-slate-400 pl-5 block">
								Bởi {comment.parentComment.authorName || 'Khách'}
							</span>
						</div>
					)}

					{/* Comment Content */}
					<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-2">
						<span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
							Nội Dung Bình Luận
						</span>
						<p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
							{comment.content}
						</p>
					</div>

					{/* Moderation Controls (Approval & Badge) */}
					<div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60 shadow-2xs flex flex-wrap items-center justify-between gap-4">
						<div className="space-y-1">
							<span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
								Trạng Thái Hiển Thị (Duyệt)
							</span>
							<p className="text-[11px] text-slate-500">
								Bình luận chỉ xuất hiện trên website khi đã được duyệt.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								disabled={isUpdatingStatus}
								onClick={() => handleUpdateStatus(true)}
								className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
									isApproved
										? 'bg-emerald-600 text-white shadow-xs'
										: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
								}`}
							>
								<FiCheckCircle className="h-4 w-4" />
								<span>Đã duyệt (Hiện trên Blog)</span>
							</button>

							<button
								type="button"
								disabled={isUpdatingStatus}
								onClick={() => handleUpdateStatus(false)}
								className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
									!isApproved
										? 'bg-amber-600 text-white shadow-xs'
										: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
								}`}
							>
								<FiClock className="h-4 w-4" />
								<span>Chờ duyệt / Ẩn</span>
							</button>
						</div>
					</div>

					{/* Official Author Reply Form */}
					<form
						onSubmit={handleSubmitOfficialReply}
						className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-3"
					>
						<div className="flex items-center justify-between">
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
								Đăng Phản Hồi Chính Thức (Tác Giả / Chuyên Gia)
							</label>
							<span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
								Hiển thị huy hiệu Verified Author
							</span>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							<div>
								<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
									Tên hiển thị Tác giả
								</span>
								<input
									type="text"
									value={authorName}
									onChange={(e) => setAuthorName(e.target.value)}
									placeholder="Ecocros Specialist (Tác giả)"
									className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-hidden"
								/>
							</div>
						</div>

						<div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
								Nội dung câu trả lời
							</span>
							<textarea
								rows={3}
								value={replyContent}
								onChange={(e) => setReplyContent(e.target.value)}
								placeholder="Chào bạn, cảm ơn câu hỏi của bạn. Về vấn đề này..."
								className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 leading-relaxed focus:border-indigo-600 focus:outline-hidden"
							/>
						</div>

						<div className="flex justify-end">
							<button
								type="submit"
								disabled={isSubmittingReply || !replyContent.trim()}
								className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
							>
								<FiSend className="h-3.5 w-3.5" />
								<span>{isSubmittingReply ? 'Đang đăng...' : 'Đăng Trả Lời Chính Thức'}</span>
							</button>
						</div>
					</form>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
					<button
						type="button"
						disabled={isDeleting}
						onClick={handleDeleteComment}
						className="inline-flex items-center gap-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-bold transition cursor-pointer"
					>
						<FiTrash2 className="h-3.5 w-3.5" />
						<span>{isDeleting ? 'Đang xóa...' : 'Xóa Bình Luận'}</span>
					</button>

					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
					>
						Đóng
					</button>
				</div>
			</div>
		</div>
	)
}
