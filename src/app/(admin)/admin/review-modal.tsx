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
	FiUser,
	FiX,
	FiXCircle,
} from 'react-icons/fi'
import { urlFor } from '@/sanity/lib/image'

type ReviewModalProps = {
	review: any
	onClose: () => void
	onReviewUpdated: (updatedReview: any) => void
}

export default function ReviewModal({
	review,
	onClose,
	onReviewUpdated,
}: ReviewModalProps) {
	const [isApproved, setIsApproved] = useState(Boolean(review.isApproved))
	const [response, setResponse] = useState(review.response || '')
	const [isSaving, setIsSaving] = useState(false)
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
					reviewId: review._id,
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

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold shadow-xs">
							<FiStar className="h-5 w-5 fill-white" />
						</div>
						<div>
							<h3 className="text-base sm:text-lg font-black text-slate-900">
								Chi Tiết Đánh Giá Sản Phẩm
							</h3>
							<p className="text-xs text-slate-500">
								Kiểm duyệt nội dung, xem hình ảnh thực tế và gửi phản hồi công khai của shop.
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
					{/* Top Info: Author, Product & Rating */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
						<div>
							<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
								Người Đánh Giá & Sản Phẩm
							</span>
							<p className="font-bold text-slate-900 text-sm">{review.author || 'Khách hàng ẩn danh'}</p>
							<p className="text-xs text-emerald-800 font-semibold mt-0.5">
								📦 {review.product?.title || '[Sản phẩm chung]'}
							</p>
							<span className="text-[10px] text-slate-400 mt-1 block">
								Gửi lúc: {review.createdAt ? new Date(review.createdAt).toLocaleString('vi-VN') : ''}
							</span>
						</div>

						<div>
							<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
								Số Sao Đánh Giá
							</span>
							<div className="flex items-center gap-1">
								{Array.from({ length: 5 }).map((_, i) => (
									<FiStar
										key={i}
										className={`h-5 w-5 ${
											i < ratingVal ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
										}`}
									/>
								))}
								<span className="ml-2 font-mono font-black text-slate-900 text-base">
									{ratingVal}/5
								</span>
							</div>

							<div className="mt-3">
								<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
									Trạng Thái Hiển Thị (Duyệt)
								</span>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => setIsApproved(true)}
										className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
											isApproved
												? 'bg-emerald-600 text-white shadow-xs'
												: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
										}`}
									>
										<FiCheckCircle className="h-4 w-4" />
										<span>Đã duyệt (Hiển thị web)</span>
									</button>

									<button
										type="button"
										onClick={() => setIsApproved(false)}
										className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
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
						</div>
					</div>

					{/* Review Content */}
					<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-2">
						<span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
							Nội Dung Nhận Xét Của Khách Hàng
						</span>
						<p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
							{review.comment || '(Khách hàng không để lại nhận xét bằng văn bản)'}
						</p>
					</div>

					{/* Customer Attached Media (Images & Videos) */}
					{(safeImages.length > 0 || safeVideos.length > 0) && (
						<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-3">
							<span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
								Hình Ảnh & Video Thực Tế Của Khách ({safeImages.length + safeVideos.length})
							</span>

							<div className="flex flex-wrap gap-2">
								{safeImages.map((img: any, idx: number) => {
									const imgUrl = img?.asset?.url || (img ? urlFor(img).url() : '')
									if (!imgUrl) return null

									return (
										<button
											key={idx}
											type="button"
											onClick={() => setSelectedMedia(imgUrl)}
											className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 hover:border-emerald-500 transition hover:scale-105 cursor-pointer"
										>
											<img src={imgUrl} alt="Review" className="h-full w-full object-cover" />
											<span className="absolute bottom-1 right-1 rounded-md bg-black/60 p-0.5 text-white">
												<FiImage className="h-3 w-3" />
											</span>
										</button>
									)
								})}

								{safeVideos.map((vid: any, idx: number) => {
									const vidUrl = vid?.asset?.url || ''
									if (!vidUrl) return null

									return (
										<div
											key={idx}
											className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-white border border-slate-200"
										>
											<video src={vidUrl} className="h-full w-full object-cover" controls />
										</div>
									)
								})}
							</div>
						</div>
					)}

					{/* Shop Official Response */}
					<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-2">
						<label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
							Phản Hồi Chính Thức Của Shop (Hiển thị công khai)
						</label>
						<textarea
							rows={3}
							value={response}
							onChange={(e) => setResponse(e.target.value)}
							placeholder="Cảm ơn bạn đã tin tưởng và đánh giá sản phẩm của Ecocros..."
							className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 leading-relaxed focus:border-emerald-600 focus:outline-hidden"
						/>
						<p className="text-[11px] text-slate-400">
							Câu trả lời của bạn sẽ được hiển thị ngay bên dưới đánh giá của khách hàng trên trang chi tiết sản phẩm.
						</p>
					</div>
				</div>

				{/* Modal Footer */}
				<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
					<div>
						{saveSuccess && (
							<span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl animate-in fade-in">
								<FiCheck className="h-4 w-4" /> Đã lưu phản hồi và duyệt đánh giá thành công!
							</span>
						)}
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={onClose}
							className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
						>
							Đóng
						</button>

						<button
							type="button"
							onClick={handleSaveChanges}
							disabled={isSaving}
							className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
						>
							<FiSave className="h-4 w-4" />
							<span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
