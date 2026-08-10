'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useCartStore } from '@/store/use-cart-store'
import Img from '../../img'
import 'swiper/css'
import 'swiper/css/navigation'
import { SlideshowLightbox } from 'lightbox.js-react'
import { PortableText } from 'next-sanity'
import Link from 'next/link'
import { formatVND } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import Image from '@/ui/modules/prose/image'
import AffiliateLink from '../affiliate-link'
import CustomHtml from '../custom-html'
import AnchoredHeading from '../prose/anchored-heading'
import Categories from './categories'

type Props = {
	title: string
	sku?: string
	category?: any[]
	slug: string
	description?: any[]
	images?: any[]
	price: number
	compareAtPrice?: number
	sales?: number
	reviews?:
		| {
				author?: string
				rating?: number
				comment?: string
				images?: any[]
		  }[]
		| undefined
}

export default function ProductContentClient({
	title,
	sku,
	category = [],
	slug,
	description,
	images = [],
	price,
	compareAtPrice,
	sales,
	reviews = [],
}: Props) {
	const router = useRouter()
	const addItem = useCartStore((s) => s.addItem)

	const [quantity, setQuantity] = useState(1)
	const [activeIndex, setActiveIndex] = useState(0)

	const mainSwiperRef = useRef<SwiperType | null>(null)
	const thumbSwiperRef = useRef<SwiperType | null>(null)

	// 1. finalPrice phải là 'price' (giá bán hiện tại)
	const finalPrice = price

	// 2. hasSale: Chỉ sale khi có giá so sánh VÀ giá so sánh > giá bán
	const hasSale =
		typeof compareAtPrice === 'number' && compareAtPrice > finalPrice

	const handleAddToCart = () => {
		addItem({
			id: sku || slug,
			title,
			price: finalPrice,
			image: urlFor(images?.[0]).url(),
			quantity,
			slug: slug,
			compareAtPrice: compareAtPrice,
		})

		router.push('/checkout')
	}

	const { totalReviews, averageRating } = useMemo(() => {
		if (!reviews || reviews.length === 0) {
			return { totalReviews: 0, averageRating: 0 }
		}

		const total = reviews.reduce((sum, r) => sum + (r.rating as number), 0)

		return {
			totalReviews: reviews.length,
			averageRating: total / reviews.length,
		}
	}, [reviews])

	// 3. Sửa công thức tính % giảm giá: (Giá Gốc - Giá Bán) / Giá Gốc
	const discountPercent =
		hasSale && compareAtPrice && compareAtPrice > 0
			? Math.round(((compareAtPrice - finalPrice) / compareAtPrice) * 100)
			: 0

	// CHUẨN BỊ DATA CHO LIGHTBOX
	const [isOpen, setIsOpen] = useState(false)
	const [photoIndex, setPhotoIndex] = useState(0)

	const lightboxImages = images.map((img) => ({
		src: urlFor(img).width(1200).url(),
		alt: img.alt || 'Product image',
	}))

	// State cho Review Lightbox
	const [isReviewOpen, setIsReviewOpen] = useState(false)
	const [reviewImages, setReviewImages] = useState([])
	const [reviewIndex, setReviewIndex] = useState(0)
	const handleOpenReviewLightbox = (
		imagesOfThisReview: any[],
		indexClicked: number,
	) => {
		const formattedImages = imagesOfThisReview.map((img) => ({
			src: img.asset.url,
			alt: img.alt || 'Review image',
		}))

		// 2. Set dữ liệu vào state
		setReviewImages(formattedImages as any)
		setReviewIndex(indexClicked)

		// 3. Mở
		setIsReviewOpen(true)
	}

	// 1. STATE PHÂN TRANG
	const [currentPage, setCurrentPage] = useState(1)
	const REVIEWS_PER_PAGE = 4

	// 2. LOGIC TÍNH TOÁN CẮT MẢNG
	// Nếu reviews null thì fallback về mảng rỗng để tránh lỗi
	const safeReviews = reviews || []

	const indexOfLastReview = currentPage * REVIEWS_PER_PAGE
	const indexOfFirstReview = indexOfLastReview - REVIEWS_PER_PAGE
	const currentReviews = safeReviews.slice(
		indexOfFirstReview,
		indexOfLastReview,
	)
	const totalPages = Math.ceil(safeReviews.length / REVIEWS_PER_PAGE)

	// Hàm chuyển trang (có scroll lên đầu list review cho UX tốt hơn)
	const handlePageChange = (pageNumber: number) => {
		setCurrentPage(pageNumber)
		// Scroll nhẹ lên đầu mục review (tuỳ chọn)
		document
			.getElementById('product-review')
			?.scrollIntoView({ behavior: 'smooth' })
	}

	return (
		<div className="space-y-8">
			<div className="grid gap-6 rounded-xl bg-white p-2 lg:grid-cols-2 lg:p-4">
				{/* ================= IMAGES (GIỮ NGUYÊN) ================= */}
				{images.length > 0 && (
					<div className="main-image-product-slide space-y-3">
						{/* MAIN */}
						<Swiper
							modules={[Navigation]}
							onSwiper={(s) => (mainSwiperRef.current = s)}
							onSlideChange={(s) => {
								setActiveIndex(s.activeIndex)
								thumbSwiperRef.current?.slideTo(s.activeIndex)
							}}
							navigation
							watchSlidesProgress
							className="aspect-square overflow-hidden rounded-lg border border-[#f5f5f5]"
						>
							{images.map((img, i) => (
								<SwiperSlide key={i}>
									{/* Thay vì bọc Lightbox ở đây, ta dùng onClick để mở Lightbox rời */}
									<div
										className="h-full w-full cursor-pointer"
										onClick={() => {
											setPhotoIndex(i) // Set ảnh hiện tại
											setIsOpen(true) // Mở lightbox
										}}
									>
										<Img
											image={img}
											width={800}
											priority={i === 0}
											sizes="(max-width: 1024px) 100vw, 50vw"
											className="h-full w-full object-cover"
											alt={title}
										/>
									</div>
								</SwiperSlide>
							))}
						</Swiper>
						{/* LIGHTBOX COMPONENT */}
						<SlideshowLightbox
							images={lightboxImages}
							showThumbnails={true}
							open={isOpen}
							lightboxIdentifier="lbox1"
							startingSlideIndex={photoIndex}
							onClose={() => setIsOpen(false)}
							modalClose="clickOutside"
						/>
						{/* THUMBS */}
						<div className="relative">
							<Swiper
								onSwiper={(s) => (thumbSwiperRef.current = s)}
								modules={[Navigation]}
								slidesPerView={6}
								spaceBetween={8}
								navigation={{
									nextEl: '.thumb-next',
									prevEl: '.thumb-prev',
								}}
								className="thumb-swiper w-full"
							>
								{images.map((img, i) => (
									<SwiperSlide key={i}>
										<button
											onClick={() => {
												setActiveIndex(i)
												mainSwiperRef.current?.slideTo(i)
											}}
											className={`overflow-hidden rounded-md transition ${
												activeIndex === i
													? 'border border-black opacity-100'
													: 'opacity-40 hover:opacity-70'
											}`}
										>
											<Img
												image={img}
												width={200}
												className="aspect-square w-full object-cover"
												alt={title}
											/>
										</button>
									</SwiperSlide>
								))}
							</Swiper>

							<button className="thumb-prev absolute top-1/2 left-0 -translate-y-1/2 bg-white p-1 shadow">
								‹
							</button>
							<button className="thumb-next absolute top-1/2 right-0 -translate-y-1/2 bg-white p-1 shadow">
								›
							</button>
						</div>
					</div>
				)}
				{/* ================= INFO ================= */}
				<div className="space-y-4">
					<h1 className="text-2xl font-semibold">{title}</h1>

					{/* META (GIỮ NGUYÊN) */}
					<div className="flex flex-wrap items-center gap-2 text-sm">
						{sku && <span className="font-semibold">SKU: {sku}</span>}

						{totalReviews > 0 && (
							<>
								<span className="text-gray-300">|</span>
								<Link href="#product-review" className="hover:underline">
									<span className="flex items-center gap-1 text-yellow-500">
										<span className="text-gray-500">
											{averageRating.toFixed(1)}
											{<span className="text-yellow-500"> ★</span>} (
											{totalReviews} reviews)
										</span>
									</span>
								</Link>
							</>
						)}

						{typeof sales === 'number' && sales > 0 && (
							<>
								<span className="text-gray-300">|</span>
								<span className="text-green-600">Đã bán {sales}</span>
							</>
						)}
					</div>

					<div className="categories flex items-center gap-2 text-sm">
						<span className="font-semibold">CATEGOTY: </span>
						<Categories categories={category} linked />
					</div>

					{/* PRICING (SỬA LẠI HIỂN THỊ) */}
					<div className="flex items-center gap-3">
						{/* Giá bán chính (Màu đỏ) */}
						<span className="text-2xl font-bold text-red-600">
							{finalPrice <= 0 ? 'Contact' : formatVND(finalPrice)}
						</span>

						{/* Giá gốc gạch ngang (Chỉ hiện khi có Sale) */}
						{hasSale && price != 0 && (
							<>
								<span className="text-sm text-gray-400 line-through">
									{formatVND(compareAtPrice!)}
								</span>

								<span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
									-{discountPercent}%
								</span>
							</>
						)}
					</div>

					{/* CTA */}
					{finalPrice <= 0 ? null : (
						<div className="fixed bottom-0 left-0 z-40 w-full border-t border-[#f5f5f5] bg-white p-1.5 max-lg:mb-0 md:static md:border-0 md:p-0 lg:p-3">
							<div className="flex items-center gap-3">
								<div className="flex overflow-hidden rounded border border-[#f5f5f5]">
									<button
										className="h-10 w-10 border-r border-[#f5f5f5]"
										onClick={() => setQuantity((q) => Math.max(1, q - 1))}
									>
										−
									</button>
									<span className="flex h-10 w-10 items-center justify-center">
										{quantity}
									</span>
									<button
										className="h-10 w-10 border-l border-[#f5f5f5]"
										onClick={() => setQuantity((q) => q + 1)}
									>
										+
									</button>
								</div>

								<button
									onClick={handleAddToCart}
									className="h-10 flex-1 rounded bg-amber-700 font-bold text-white transition hover:bg-amber-800"
								>
									MUA NGAY
								</button>
							</div>
						</div>
					)}

					{/* DESCRIPTION (GIỮ NGUYÊN) */}
					{description && (
						<header className="prose">
							<PortableText
								value={description ?? []}
								components={{
									block: {
										h1: (node) => <AnchoredHeading as="h1" {...node} />,
										h2: (node) => <AnchoredHeading as="h2" {...node} />,
										h3: (node) => <AnchoredHeading as="h3" {...node} />,
										h4: (node) => <AnchoredHeading as="h4" {...node} />,
										h5: (node) => <AnchoredHeading as="h5" {...node} />,
										h6: (node) => <AnchoredHeading as="h6" {...node} />,
									},
									types: {
										image: Image,
										'custom-html': ({ value }) => (
											<CustomHtml {...value} className="my-6" />
										),
										affiliateLink: ({ value }: any) => {
											return <AffiliateLink {...value} />
										},
									},
								}}
							/>
						</header>
					)}
				</div>
			</div>
			{/* REVIEWS (GIỮ NGUYÊN) */}

			{reviews != null && (
				<div className="rounded-xl bg-white p-2 lg:p-4">
					<div
						className="scroll-mt-24 space-y-2 border-[#f5f5f5]"
						id="product-review"
					>
						<div className="prose">
							<h2 className="font-medium">Đánh giá và xếp hạng</h2>
							<div className="gap-1 text-yellow-500">
								<p className="text-gray-900">
									<strong>Tổng quan</strong>
								</p>
								<span className="text-gray-500">
									{averageRating.toFixed(1)}
									{<span className="text-yellow-500"> ★</span>} ({totalReviews}{' '}
									reviews)
								</span>
							</div>
						</div>
						{currentReviews.map((r, i) => (
							<div
								key={i}
								className="mb-6 space-y-1 border-t border-[#f5f5f5] pt-2 text-sm"
							>
								<p>
									<strong>{r.author}</strong>
								</p>

								<div className="flex items-center gap-1">
									<span className="text-yellow-500">
										{'★'.repeat(r.rating || 0)}
										{'☆'.repeat(5 - (r.rating || 0))}
									</span>
								</div>

								<p className="text-muted-foreground">{r.comment}</p>

								{r.images && r.images.length > 0 && (
									<div className="mt-2 flex gap-2">
										{r.images.map((img, imgIndex) =>
											img?.asset ? (
												<Img
													key={imgIndex}
													image={img}
													width={160}
													alt={img.alt || ''}
													className="h-16 w-16 cursor-pointer rounded object-cover transition hover:opacity-80"
													onClick={() =>
														handleOpenReviewLightbox(r.images as any[], imgIndex)
													}
												/>
											) : null,
										)}
									</div>
								)}
							</div>
						))}

						{/* 4. THANH ĐIỀU HƯỚNG PHÂN TRANG */}
						{totalPages > 1 && (
							<div className="flex items-center justify-center gap-2 pt-4 pb-8">
								{/* Nút Prev */}
								<button
									onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
									disabled={currentPage === 1}
									className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
								>
									Trước
								</button>

								{/* Số trang */}
								<span className="text-sm text-gray-600">
									Trang {currentPage} / {totalPages}
								</span>

								{/* Nút Next */}
								<button
									onClick={() =>
										handlePageChange(Math.min(currentPage + 1, totalPages))
									}
									disabled={currentPage === totalPages}
									className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
								>
									Sau
								</button>
							</div>
						)}
					</div>
					{/* LIGHTBOX COMPONENT (Đặt RA NGOÀI vòng lặp map) */}
					<SlideshowLightbox
						lightboxIdentifier="lightbox-reviews" // ID khác với cái main product
						images={reviewImages} // Data động theo từng review
						showThumbnails={true}
						open={isReviewOpen}
						startingSlideIndex={reviewIndex}
						onClose={() => setIsReviewOpen(false)}
						modalClose="clickOutside"
					/>
				</div>
			)}
		</div>
	)
}
