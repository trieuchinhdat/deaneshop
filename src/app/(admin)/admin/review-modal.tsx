'use client'

import { useState } from 'react'
import {
	FiCheck,
	FiCheckCircle,
	FiClock,
	FiFilm,
	FiImage,
	FiMessageSquare,
	FiSave,
	FiStar,
	FiTrash2,
	FiUser,
	FiX,
	FiXCircle,
} from 'react-icons/fi'

type ReviewModalProps = {
	review: any
	onClose: () => void
	onReviewUpdated: (updatedReview: any) => void
	onReviewDeleted?: (deletedId: string) => void
}

export default function ReviewModal({
	review,
	onClose,
	onReviewUpdated,
	onReviewDeleted,
}: ReviewModalProps) {
	const [isApproved, setIsApproved] = useState(Boolean(review.isApproved))
	const [response, setResponse] = useState(review.response || '')
	const [isSaving, setIsSaving] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)
	const [selectedMedia, setSelectedMedia] = useState<string | null>(null)

	const safeImages = Array.isArray(review?.images) ? review.images : []
	const safeVideos = Array.isArray(review?.videos) ? review.videos : []
	const ratingVal = Number(review.rating) || 5

	const handleSaveChanges = async () => {
		try {
			setIsSaving(true)
			setSaveSuccess(false)

			const res = await fetch('/api/admin/reviews/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reviewId: review._id || review.id,
					isApproved,
					response: response.trim(),
				}),
			})

			const data = await res.json()
			if (data.success) {
				setSaveSuccess(true)
				const updated = {
					...review,
					isApproved,
					response: response.trim(),
				}
				onReviewUpdated(updated)
				setTimeout(() => setSaveSuccess(false), 2500)
			}
		} catch (err) {
			console.error('Update review failed:', err)
		} finally {
			setIsSaving(false)
		}
	}

	const handleDeleteReview = async () => {
		if (!confirm('Are you sure you want to permanently delete this customer review?')) return
		try {
			setIsDeleting(true)
			const res = await fetch('/api/admin/reviews/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reviewId: review._id || review.id,
					action: 'DELETE',
				}),
			})
			const data = await res.json()
			if (data.success) {
				if (onReviewDeleted) onReviewDeleted(review._id || review.id)
				onClose()
			}
		} catch (err) {
			console.error('Delete review error:', err)
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
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold shadow-xs">
							<FiStar className="h-5 w-5 fill-white" />
						</div>
						<div>
							<h3 className="text-base sm:text-lg font-black text-slate-900">
								Product Review Moderation
							</h3>
							<p className="text-xs text-slate-500">
								Inspect customer ratings, review attached media, and post official responses.
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

				{/* Modal Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{/* Review Header Card */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
						<div>
							<div className="flex items-center gap-2">
								<FiUser className="h-4 w-4 text-slate-400" />
								<span className="font-bold text-slate-900 text-sm">
									{review.author || 'Anonymous Customer'}
								</span>
								<span className="text-xs text-slate-400 font-mono">
									{review.createdAt
										? new Date(review.createdAt).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											})
										: ''}
								</span>
							</div>

							<div className="flex items-center gap-1.5 mt-1.5">
								<div className="flex text-amber-400">
									{[1, 2, 3, 4, 5].map((star) => (
										<FiStar
											key={star}
											className={`h-4 w-4 ${
												star <= ratingVal ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
											}`}
										/>
									))}
								</div>
								<span className="text-xs font-black text-slate-700">{ratingVal}.0 / 5.0</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<span
								className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
									isApproved
										? 'bg-emerald-50 text-emerald-800 border-emerald-200'
										: 'bg-amber-50 text-amber-800 border-amber-200'
								}`}
							>
								{isApproved ? <FiCheckCircle className="h-3.5 w-3.5" /> : <FiClock className="h-3.5 w-3.5" />}
								<span>{isApproved ? 'Approved & Visible' : 'Pending Moderation'}</span>
							</span>

							<button
								type="button"
								onClick={() => setIsApproved(!isApproved)}
								className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
									isApproved
										? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
										: 'bg-emerald-600 text-white hover:bg-emerald-700'
								}`}
							>
								{isApproved ? 'Unapprove' : 'Approve Now'}
							</button>
						</div>
					</div>

					{/* Product Reference */}
					{review.product?.title && (
						<div className="text-xs bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
							<span className="text-slate-500">Reviewed Product:</span>
							<span className="font-bold text-slate-900">{review.product.title}</span>
						</div>
					)}

					{/* Customer Review Content */}
					<div className="space-y-2">
						<label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
							Customer Feedback
						</label>
						<p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
							&quot;{review.comment || 'No comment text provided.'}&quot;
						</p>
					</div>

					{/* Attached Media Photos & Videos */}
					{(safeImages.length > 0 || safeVideos.length > 0) && (
						<div className="space-y-2">
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
								Customer Attached Media ({safeImages.length + safeVideos.length})
							</label>
							<div className="flex flex-wrap gap-2">
								{safeImages.map((img: any, idx: number) => {
									const url = img?.asset?.url || img?.url || ''
									if (!url) return null
									return (
										<button
											key={idx}
											type="button"
											onClick={() => setSelectedMedia(url)}
											className="h-16 w-16 rounded-xl overflow-hidden border border-slate-200 hover:opacity-80 transition cursor-pointer relative"
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img src={url} alt="Review Media" className="h-full w-full object-cover" />
										</button>
									)
								})}
								{safeVideos.map((vid: any, idx: number) => {
									const url = vid?.asset?.url || vid?.url || ''
									if (!url) return null
									return (
										<div
											key={idx}
											className="h-16 w-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center text-white"
										>
											<FiFilm className="h-6 w-6" />
										</div>
									)
								})}
							</div>
						</div>
					)}

					{/* Official Store Response */}
					<div className="space-y-2">
						<label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
							Official Store Response (Displayed Publicly)
						</label>
						<textarea
							rows={3}
							value={response}
							onChange={(e) => setResponse(e.target.value)}
							placeholder="Write a professional store reply thanking the customer or addressing questions..."
							className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base sm:text-xs text-slate-900 leading-relaxed focus:border-slate-900 focus:outline-hidden"
						/>
					</div>
				</div>

				{/* Modal Footer */}
				<div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-3.5 sm:py-4">
					<div className="flex items-center gap-3">
						{saveSuccess && (
							<span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl animate-in fade-in">
								<FiCheck className="h-4 w-4" /> Review updated successfully!
							</span>
						)}

						<button
							type="button"
							onClick={handleDeleteReview}
							disabled={isDeleting}
							className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer disabled:opacity-50"
						>
							<FiTrash2 className="h-3.5 w-3.5" />
							<span>{isDeleting ? 'Deleting...' : 'Delete Review'}</span>
						</button>
					</div>

					<div className="flex items-center gap-3 w-full sm:w-auto justify-end">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer text-center"
						>
							Close
						</button>

						<button
							type="button"
							onClick={handleSaveChanges}
							disabled={isSaving}
							className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
						>
							<FiSave className="h-4 w-4" />
							<span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
