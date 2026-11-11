'use client'

import { useState } from 'react'
import { FiCamera, FiCheckCircle, FiStar, FiX } from 'react-icons/fi'
import {
	ALLOWED_IMAGE_MIME_TYPES,
	MAX_IMAGE_BYTES,
	MAX_REVIEW_IMAGES,
} from '@/lib/upload-policy'

type Props = {
	isOpen: boolean
	onClose: () => void
	productId: string
	productTitle: string
	productSlug?: string
}

export default function ReviewFormModal({
	isOpen,
	onClose,
	productId,
	productTitle,
	productSlug,
}: Props) {
	const [rating, setRating] = useState(5)
	const [hoverRating, setHoverRating] = useState(0)
	const [author, setAuthor] = useState('')
	const [comment, setComment] = useState('')
	const [images, setImages] = useState<File[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [isSubmitted, setIsSubmitted] = useState(false)

	if (!isOpen) return null

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return
		const filesArray = Array.from(e.target.files)
		const rejected: string[] = []
		const accepted: File[] = []

		for (const file of filesArray) {
			if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as any)) {
				rejected.push(`${file.name} (unsupported format; JPEG, PNG, or WebP only)`)
				continue
			}
			if (file.size > MAX_IMAGE_BYTES || file.size <= 0) {
				rejected.push(`${file.name} (exceeds 5 MB max limit)`)
				continue
			}
			accepted.push(file)
		}

		if (images.length + accepted.length > MAX_REVIEW_IMAGES) {
			setError(`Maximum ${MAX_REVIEW_IMAGES} photos allowed per review.`)
		} else if (rejected.length > 0) {
			setError(`Skipped invalid image(s): ${rejected.join('; ')}`)
		} else {
			setError('')
		}

		if (accepted.length > 0) {
			setImages((prev) => [...prev, ...accepted].slice(0, MAX_REVIEW_IMAGES))
		}
		e.target.value = ''
	}

	const removeImage = (index: number) => {
		setImages((prev) => prev.filter((_, i) => i !== index))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!author.trim() || !comment.trim()) {
			setError('Please enter your full name and review comments.')
			return
		}

		if (!productId) {
			setError('Product information not found.')
			return
		}

		setLoading(true)
		setError('')

		try {
			const formData = new FormData()
			formData.append('productId', productId)
			formData.append('productTitle', productTitle)
			if (productSlug) formData.append('productSlug', productSlug)
			formData.append('author', author.trim())
			formData.append('rating', rating.toString())
			formData.append('comment', comment.trim())

			images.slice(0, MAX_REVIEW_IMAGES).forEach((file) => formData.append('images', file))

			const res = await fetch('/api/reviews', {
				method: 'POST',
				body: formData,
			})

			const data = await res.json().catch(() => ({}))

			if (!res.ok) {
				throw new Error(data.error || 'Failed to submit review')
			}

			setIsSubmitted(true)
		} catch (err: any) {
			setError(err.message || 'An error occurred, please try again.')
		} finally {
			setLoading(false)
		}
	}

	const handleResetAndClose = () => {
		setIsSubmitted(false)
		setAuthor('')
		setComment('')
		setRating(5)
		setImages([])
		setError('')
		onClose()
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
			<div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
				{/* Close Button */}
				<button
					type="button"
					onClick={handleResetAndClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
				>
					<FiX className="h-6 w-6" />
				</button>

				{isSubmitted ? (
					<div className="py-8 text-center space-y-4">
						<FiCheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
						<h3 className="text-xl font-bold text-gray-900">
							Thank You for Your Feedback!
						</h3>
						<p className="text-sm text-gray-600">
							Your review has been submitted successfully and will be published once approved by our team.
						</p>
						<button
							type="button"
							onClick={handleResetAndClose}
							className="mt-4 rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white transition hover:bg-slate-800"
						>
							Done
						</button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
							Submit Product Review
						</h3>
						<p className="text-xs text-gray-500 line-clamp-1">
							Product: <span className="font-semibold text-gray-800">{productTitle}</span>
						</p>

						{/* Star Rating Selection */}
						<div>
							<label className="block text-xs font-semibold text-gray-700 mb-1">
								Your Rating
							</label>
							<div className="flex items-center gap-1">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										type="button"
										key={star}
										onClick={() => setRating(star)}
										onMouseEnter={() => setHoverRating(star)}
										onMouseLeave={() => setHoverRating(0)}
										className="p-1 transition-transform hover:scale-110 focus:outline-hidden"
									>
										<FiStar
											className={`h-7 w-7 ${
												(hoverRating || rating) >= star
													? 'fill-amber-400 text-amber-400'
													: 'text-gray-300'
											}`}
										/>
									</button>
								))}
								<span className="ml-2 text-sm font-semibold text-amber-600">
									{rating}/5 Stars
								</span>
							</div>
						</div>

						{/* Author Name */}
						<div>
							<label className="block text-xs font-semibold text-gray-700 mb-1">
								Your Name <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={author}
								onChange={(e) => setAuthor(e.target.value)}
								placeholder="e.g. Johnathan Miller"
								className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-slate-800 focus:outline-hidden"
								required
							/>
						</div>

						{/* Comment */}
						<div>
							<label className="block text-xs font-semibold text-gray-700 mb-1">
								Review Comments <span className="text-red-500">*</span>
							</label>
							<textarea
								rows={3}
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								placeholder="Share your experience regarding material quality, durability, and dispatch speed..."
								className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-slate-800 focus:outline-hidden"
								required
							/>
						</div>

						{/* Attachments: Photos Only (Max 3, 5MB each) */}
						<div>
							<label className="block text-xs font-semibold text-gray-700 mb-1">
								Attach Photos (Optional — JPEG, PNG, or WebP)
							</label>
							<label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
								<FiCamera className="h-4 w-4 text-emerald-600" />
								<span>
									Upload Photos (Max {MAX_REVIEW_IMAGES}, up to 5 MB each)
								</span>
								<input
									type="file"
									accept="image/jpeg,image/png,image/webp"
									multiple
									onChange={handleImageChange}
									className="hidden"
								/>
							</label>
						</div>

						{/* Previews */}
						{images.length > 0 && (
							<div className="space-y-2 border-t border-gray-100 pt-2">
								<div className="flex flex-wrap gap-2">
									{images.map((file, i) => (
										<div key={i} className="relative h-12 w-12 rounded overflow-hidden border border-gray-200">
											<img
												src={URL.createObjectURL(file)}
												alt="preview"
												className="h-full w-full object-cover"
											/>
											<button
												type="button"
												onClick={() => removeImage(i)}
												className="absolute top-0 right-0 bg-black/70 text-white p-0.5"
											>
												<FiX className="h-3 w-3" />
											</button>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Error */}
						{error && (
							<p className="text-xs font-semibold text-red-600">{error}</p>
						)}

						{/* Submit CTA */}
						<div className="pt-2">
							<button
								type="submit"
								disabled={loading}
								className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
							>
								{loading ? 'Submitting Review...' : 'Submit Review'}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	)
}
