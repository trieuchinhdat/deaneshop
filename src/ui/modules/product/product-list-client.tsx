'use client'

import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { useEffect, useMemo, useState, Suspense } from 'react'
import { Autoplay, Grid, Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import { ROUTES } from '@/lib/env'
import { formatVND } from '@/lib/utils'
import ResponsiveImage from '@/ui/responsiveImage'

// 1. Định nghĩa Type Product
type Product = {
	_id: string
	title: string
	slug: string
	price: number
	compareAtPrice?: number
	images?: any[]
	categories?: { slug: string }[]
	_createdAt?: string
}

// 2. Options Sắp xếp
const SORT_OPTIONS = [
	{ value: 'default', label: 'Mặc định' },
	{ value: 'price_asc', label: 'Giá: Thấp đến Cao' },
	{ value: 'price_desc', label: 'Giá: Cao đến Thấp' },
	{ value: 'title_asc', label: 'Tên: A-Z' },
	{ value: 'title_desc', label: 'Tên: Z-A' },
]

type ProductListClientProps = {
	products: any[] | undefined
	layout: string
	itemsPerPage?: number
	rowsDesktop: number
	rowsMobile: number
	autoSlide: boolean
	enableFilter: boolean
}

function ProductListClientContent({
	products,
	layout,
	itemsPerPage = 4,
	rowsDesktop,
	rowsMobile,
	autoSlide = false,
	enableFilter = false,
}: ProductListClientProps) {
	// 3. Vẫn gọi Hooks (Bắt buộc phải gọi ở top-level, không được đưa vào if)
	const [urlCategory] = useQueryState('category')
	const [urlSort, setUrlSort] = useQueryState('sort', {
		defaultValue: 'default',
	})

	// 4. LOGIC QUAN TRỌNG: Quyết định giá trị sử dụng dựa trên enableFilter
	// Nếu enableFilter tắt, ta bỏ qua giá trị từ URL và dùng mặc định
	const activeCategory = enableFilter ? urlCategory : null
	const activeSort = enableFilter ? urlSort : 'default'

	// 5. Logic Xử lý dữ liệu
	const processedProducts = useMemo(() => {
		if (!products) return []

		// A. Filter (Dùng activeCategory)
		let result = products.filter((product) => {
			if (!activeCategory) return true
			return product.categories?.some((c: any) => c.slug === activeCategory)
		})

		// B. Sort (Dùng activeSort)
		switch (activeSort) {
			case 'price_asc':
				result = [...result].sort((a, b) => a.price - b.price)
				break
			case 'price_desc':
				result = [...result].sort((a, b) => b.price - a.price)
				break
			case 'title_asc':
				result = [...result].sort((a, b) => a.title.localeCompare(b.title))
				break
			case 'title_desc':
				result = [...result].sort((a, b) => b.title.localeCompare(a.title))
				break
			default:
				break
		}

		return result
	}, [products, activeCategory, activeSort]) // Dependency thay đổi theo biến đã qua xử lý

	if (!products?.length) return null

	// State Load More
	const [visibleCount, setVisibleCount] = useState(itemsPerPage)

	// Reset visibleCount khi filter/sort thay đổi (Chỉ khi enableFilter = true thì activeCategory mới đổi)
	useEffect(() => {
		setVisibleCount(itemsPerPage)
	}, [activeCategory, activeSort, itemsPerPage])

	const visibleProducts = processedProducts.slice(0, visibleCount)
	const handleLoadMore = () => setVisibleCount((prev) => prev + itemsPerPage)
	const isFinished = visibleCount >= processedProducts.length

	const cssVars = {
		'--mobile-rows': rowsMobile ?? 1,
		'--desktop-rows': rowsDesktop ?? 1,
	} as React.CSSProperties

	return (
		<div className="space-y-4">
			{/* Chỉ hiển thị UI Filter/Sort khi enableFilter = true */}
			{enableFilter && (
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="text-sm">
						Hiển thị <strong>{visibleProducts.length}</strong> of{' '}
						<strong>{processedProducts.length}</strong> sản phẩm
					</div>

					<div className="flex items-center gap-2">
						<label htmlFor="sort-select" className="text-sm whitespace-nowrap">
							Sắp xếp:
						</label>
						<div className="relative">
							<select
								id="sort-select"
								// Dùng activeSort để hiển thị đúng giá trị
								value={activeSort || 'default'}
								// Gọi setUrlSort để cập nhật URL
								onChange={(e) => setUrlSort(e.target.value)}
								className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pr-8 pl-3 text-sm focus:border-black focus:outline-none"
							>
								{SORT_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
								<svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
									<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
								</svg>
							</div>
						</div>
					</div>
				</div>
			)}

			{processedProducts.length === 0 ? (
				<div className="py-12 text-center">
					<p className="text-gray-500">Không tìm thấy sản phẩm phù hợp.</p>
				</div>
			) : (
				<>
					{layout === 'carousel' ? (
						/* --- CAROUSEL VIEW --- */
						<div className="carousel-list-product" style={cssVars}>
							<Swiper
								modules={[Navigation, Grid, Autoplay]}
								navigation
								spaceBetween={8}
								slidesPerView={2}
								grid={{ rows: rowsMobile ?? 1, fill: 'row' }}
								autoplay={
									autoSlide
										? { delay: 3000, disableOnInteraction: false }
										: false
								}
								breakpoints={{
									0: {
										slidesPerView: 2,
										spaceBetween: 8,
										grid: { rows: rowsMobile ?? 1, fill: 'row' },
									},
									1024: {
										slidesPerView: 4,
										spaceBetween: 16,
										grid: { rows: rowsDesktop ?? 1, fill: 'row' },
									},
								}}
								className="!px-0.5 !pt-0.5"
							>
								{processedProducts.map((product) => (
									<SwiperSlide key={product._id} className="!h-auto">
										<ProductCard product={product} />
									</SwiperSlide>
								))}
							</Swiper>
						</div>
					) : (
						/* --- GRID VIEW --- */
						<div className="grid-list-product space-y-4">
							<div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
								{visibleProducts.map((product) => (
									<div key={product._id} className="h-full">
										<ProductCard product={product} />
									</div>
								))}
							</div>

							{!isFinished && (
								<div className="flex justify-center">
									<button
										onClick={handleLoadMore}
										className="rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-medium transition hover:bg-gray-50"
									>
										Xem thêm ({processedProducts.length - visibleCount} sản
										phẩm)
									</button>
								</div>
							)}
						</div>
					)}
				</>
			)}
		</div>
	)
}

export default function ProductListClient(props: ProductListClientProps) {
	return (
		<Suspense fallback={null}>
			<ProductListClientContent {...props} />
		</Suspense>
	)
}

function ProductCard({ product }: { product: Product }) {
	return (
		<Link href={`/${ROUTES.products}/${product.slug}`} className="block h-full">
			<div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md">
				<div className="relative aspect-square overflow-hidden">
					<ResponsiveImage
						className="h-full w-full object-cover transition-transform duration-300"
						image={product.images?.[0]}
						desktop={{ width: 600 }}
						mobile={{ width: 300 }}
					/>
					{product.compareAtPrice &&
						product.compareAtPrice > product.price &&
						product.price != 0 && (
							<span className="absolute top-2 left-2 rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white lg:text-xs">
								-
								{Math.round(
									((product.compareAtPrice - product.price) /
										product.compareAtPrice) *
										100,
								)}
								%
							</span>
						)}
				</div>

				<div className="flex flex-1 flex-col justify-between p-3">
					<h3 className="line-clamp-2 text-center text-xs font-semibold lg:text-sm">
						{product.title}
					</h3>

					<div className="mt-2">
						{product.compareAtPrice &&
						product.compareAtPrice > product.price &&
						product.price != 0 ? (
							<div className="flex flex-wrap items-baseline justify-center gap-2">
								<span className="text-sm font-bold text-red-600 lg:text-base">
									{formatVND(product.price)}
								</span>
								<span className="text-[10px] text-gray-400 line-through lg:text-xs">
									{formatVND(product.compareAtPrice)}
								</span>
							</div>
						) : (
							<span className="text-sm font-semibold text-red-600 lg:text-base">
								{product.price === 0 ? 'Contact' : formatVND(product.price)}
							</span>
						)}
					</div>
				</div>
			</div>
		</Link>
	)
}
