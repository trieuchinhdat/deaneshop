'use client'

import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/grid'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { BlogPost } from '@/sanity/types'
import PostPreview from './post-preview'

type Props = {
	posts: BlogPost[]
	anchorName?: string
	itemsPerPage: number
	layout: string
}

export default function BlogPostListClient({
	posts,
	anchorName,
	itemsPerPage = 4,
	layout = 'grid',
}: Props) {
	if (!posts?.length) return null
	// Khởi tạo state
	const [visibleCount, setVisibleCount] = useState(itemsPerPage)

	// Cắt mảng sản phẩm dựa trên số lượng hiển thị
	const visiblePosts = posts.slice(0, visibleCount)

	const handleLoadMore = () => {
		// itemsPerPage giờ đã có giá trị mặc định nên phép cộng này an toàn
		setVisibleCount((prev) => prev + itemsPerPage)
	}

	const isFinished = visibleCount >= posts.length

	return (
		<>
			{layout === 'carousel' ? (
				<Swiper
					modules={[Navigation]}
					spaceBetween={8}
					slidesPerView="auto"
					navigation
					className={cn(
						'max-md:full-bleed md:mask-r-from-[calc(100%-2rem)] md:pr-4',
					)}
					breakpoints={{
						0: {
							slidesPerView: 2,
							spaceBetween: 8,
						},
						640: {
							slidesPerView: 2,
							spaceBetween: 8,
						},
						768: {
							slidesPerView: 3,
							spaceBetween: 8,
						},
						1024: {
							slidesPerView: 4,
							spaceBetween: 16,
						},
					}}
				>
					{posts.map((post) => (
						<SwiperSlide key={post._id} className="h-auto">
							<PostPreview post={post} />
						</SwiperSlide>
					))}
				</Swiper>
			) : (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
						{visiblePosts.map((post) => (
							<div key={post._id} className="h-full">
								<PostPreview post={post} />
							</div>
						))}
					</div>

					{/* Button nằm ngoài Grid */}
					{!isFinished && (
						<div className="flex justify-center">
							<button
								onClick={handleLoadMore}
								className="action rounded-lg px-3 py-2 text-xs font-semibold transition lg:px-8 lg:text-sm"
							>
								Xem thêm ({posts.length - visibleCount})
							</button>
						</div>
					)}
				</div>
			)}
		</>
	)
}
