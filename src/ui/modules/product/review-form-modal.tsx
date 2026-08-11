'use client'

import { useState } from 'react'
import { FiCamera, FiCheckCircle, FiStar, FiVideo, FiX } from 'react-icons/fi'

type Props = {
	isOpen: boolean
	onClose: () => void
	productId: string
	productTitle: string
}

export default function ReviewFormModal({
	isOpen,
	onClose,
	productId,
	productTitle,
}: Props) {
	const [rating, setRating] = useState(5)
	const [hoverRating, setHoverRating] = useState(0)
	const [author, setAuthor] = useState('')
	const [comment, setComment] = useState('')
	const [images, setImages] = useState<File[]>([])
	const [videos, setVideos] = useState<File[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [isSubmitted, setIsSubmitted] = useState(false)

	if (!isOpen) return null

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const filesArray = Array.from(e.target.files)
			setImages((prev) => [...prev, ...filesArray].slice(0, 5)) // Tối đa 5 ảnh
		}
	}

	const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const filesArray = Array.from(e.target.files)
			setVideos((prev) => [...prev, ...filesArray].slice(0, 2)) // Tối đa 2 video
		}
	}

	const removeImage = (index: number) => {
		setImages((prev) => prev.filter((_, i) => i !== index))
	}

	const removeVideo = (index: number) => {
		setVideos((prev) => prev.filter((_, i) => i !== index))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!author.trim() || !comment.trim()) {
			setError('Vui lòng nhập tên và nội dung đánh giá.')
			return
		}

		if (!productId) {
			setError('Không tìm thấy thông tin sản phẩm.')
			return
		}

		setLoading(true)
		setError('')

		try {
			const formData = new FormData()
			formData.append('productId', productId)
			formData.append('author', author.trim())
			formData.append('rating', rating.toString())
			formData.append('comment', comment.trim())

			images.forEach((file) => formData.append('images', file))
			videos.forEach((file) => formData.append('videos', file))

			const res = await fetch('/api/reviews', {
				method: 'POST',
				body: formData,
			})

			const data = await res.json()

			if (!res.ok) {
				throw new Error(data.error || 'Gửi đánh giá thất bại')
			}

			setIsSubmitted(true)
		} catch (err: any) {
			setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại!')
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
		setVideos([])
		setError('')
		onClose()
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
			<div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
				{/* Close Button */}
				<button
					onClick={handleResetAndClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
				>
					<FiX className="h-6 w-6" />
				</button>

				{isSubmitted ? (
					<div className="py-8 text-center space-y-4">
						<FiCheckCircle className="mx-auto h-16 w-16 text-green-500" />
						<h3 className="text-xl font-bold text-gray-900">
							Cảm ơn bạn đã đánh giá!
						</h3>
						<p className="text-sm text-gray-600">
							Đánh giá của bạn đã được gửi thành công và sẽ được hiển thị công khai ngay sau khi Admin kiểm duyệt.
						</p>
						<button
							onClick={handleResetAndClose}
							className="mt-4 rounded-xl bg-amber-700 px-6 py-2.5 font-semibold text-white transition hover:bg-amber-800"
						>
							Hoàn tất
						</button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
							Đánh giá sản phẩm
						</h3>
						<p className="text-xs text-gray-500 line-clamp-1">
							Sản phẩm: <span className="font-semibold text-gray-800">{productTitle}</span>
						</p>

						{/* Star Rating Selection */}
						<div>
							<label className="block text-xs font-semibold text-gray-700 mb-1">
								Đánh giá của bạn
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
									{rating}/5 Sao
								</span>
							</div>
						</div>

						{/* Author Name */}
						<div>
							<label className="block text-xs font-semibold text-gray-700 mb-1">
								Họ và tên của bạn <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={author}
								onChange={(e) => setAuthor(e.target.value)}
								placeholder="Ví dụ: Nguyễn Văn A"
								className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
								required
							/>
						</div>

						{/* Comment */}
						<div>
							<label className="block text-xs font-semibold text-gray-700 mb-1">
								Nội dung nhận xét <span className="text-red-500">*</span>
							</label>
							<textarea
								rows={3}
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
								className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
								required
							/>
						</div>

						{/* Attachments: Images & Videos */}
						<div className="grid grid-cols-2 gap-3">
							{/* Images */}
							<div>
								<label className="block text-xs font-semibold text-gray-700 mb-1">
									Đính kèm ảnh
								</label>
								<label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
									<FiCamera className="h-4 w-4 text-amber-600" />
									<span>Tải ảnh (Tối đa 5)</span>
									<input
										type="file"
										accept="image/*"
										multiple
										onChange={handleImageChange}
										className="hidden"
									/>
								</label>
							</div>

							{/* Videos */}
							<div>
								<label className="block text-xs font-semibold text-gray-700 mb-1">
									Đính kèm Video ngắn
								</label>
								<label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
									<FiVideo className="h-4 w-4 text-blue-600" />
									<span>Tải Video ngắn</span>
									<input
										type="file"
										accept="video/*"
										multiple
										onChange={handleVideoChange}
										className="hidden"
									/>
								</label>
							</div>
						</div>

						{/* Previews */}
						{(images.length > 0 || videos.length > 0) && (
							<div className="space-y-2 border-t border-gray-100 pt-2">
								{images.length > 0 && (
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
								)}

								{videos.length > 0 && (
									<div className="flex flex-wrap gap-2 text-xs">
										{videos.map((file, i) => (
											<div key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
												<FiVideo className="h-3 w-3" />
												<span className="max-w-[100px] truncate">{file.name}</span>
												<button type="button" onClick={() => removeVideo(i)}>
													<FiX className="h-3 w-3" />
												</button>
											</div>
										))}
									</div>
								)}
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
								className="w-full rounded-xl bg-amber-700 py-3 font-bold text-white transition hover:bg-amber-800 disabled:opacity-50"
							>
								{loading ? 'Đang gửi đánh giá...' : 'Gửi Đánh Giá Ngay'}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	)
}
