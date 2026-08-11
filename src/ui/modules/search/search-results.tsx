'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
	VscBook,
	VscChevronLeft,
	VscChevronRight,
	VscFile,
	VscPackage,
} from 'react-icons/vsc'
import { formatVND } from '@/lib/utils'
import type { SearchModule } from '@/sanity/types'
import Img from '@/ui/img'
import ResponsiveImage from '@/ui/responsiveImage'
import { useSearchStore } from './store'

const ITEMS_PER_PAGE = 8

// 👇 THÊM SCOPE VÀO PROPS
export default function SearchResults({
	query,
	scope = 'all',
}: {
	query: string
	scope?: SearchModule['scope']
}) {
	// 👇 LẤY HÀM SEARCH TỪ STORE (Đảm bảo bạn đã update store như bước trước)
	const { results, search, loading } = useSearchStore()

	// 1. STATE LƯU TRANG HIỆN TẠI CHO TỪNG NHÓM
	const [productPage, setProductPage] = useState(1)
	const [blogPage, setBlogPage] = useState(1)
	const [pagePage, setPagePage] = useState(1)

	// 👇 LOGIC QUAN TRỌNG: TỰ ĐỘNG GỌI SEARCH KHI CÓ QUERY
	useEffect(() => {
		if (query) {
			search({ query, scope })
		}
	}, [query, scope, search])

	// 2. RESET TRANG VỀ 1 KHI KẾT QUẢ TÌM KIẾM THAY ĐỔI
	useEffect(() => {
		setProductPage(1)
		setBlogPage(1)
		setPagePage(1)
	}, [results])

	if (!results.length) return null

	// 3. PHÂN LOẠI DỮ LIỆU
	const products = results.filter((item: any) => item._type === 'product')
	const blogs = results.filter((item: any) => item._type === 'blog.post')
	const pages = results.filter(
		(item: any) => !['product', 'blog.post'].includes(item._type),
	)

	// 4. HÀM CẮT DỮ LIỆU THEO TRANG (PAGINATE DATA)
	const getPaginatedItems = (items: any[], page: number) => {
		const startIndex = (page - 1) * ITEMS_PER_PAGE
		return items.slice(startIndex, startIndex + ITEMS_PER_PAGE)
	}

	if (!results.length) {
		// Nếu đang loading thì component cha đã lo hiển thị Spinner rồi, ở đây return null cũng được
		// Nhưng nếu loading = false mà ko có kết quả thì phải báo
		if (loading) return null

		return (
			<div className="py-10 text-center text-gray-500">
				Không tìm thấy kết quả nào cho "{query}"
			</div>
		)
	}

	return (
		<div className="space-y-10">
			{/* KHỐI 1: SẢN PHẨM */}
			{products.length > 0 && (
				<section>
					<h3 className="mb-4 flex items-center gap-2 border-b pb-2 text-xl font-bold">
						<VscPackage /> Product ({products.length})
					</h3>

					<div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
						{/* Render dữ liệu đã cắt theo trang */}
						{getPaginatedItems(products, productPage).map((result: any) => (
							<ProductCard key={result._id} product={result} />
						))}
					</div>

					{/* Controls Phân trang Product */}
					<PaginationControls
						totalItems={products.length}
						currentPage={productPage}
						onPageChange={setProductPage}
					/>
				</section>
			)}

			{/* KHỐI 2: BLOG */}
			{blogs.length > 0 && (
				<section>
					<h3 className="mb-4 flex items-center gap-2 border-b pb-2 text-xl font-bold">
						<VscBook /> Blog ({blogs.length})
					</h3>
					<div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
						{getPaginatedItems(blogs, blogPage).map((result: any) => (
							<Link
								key={result._id || result.slug}
								href={result.slug}
								className="group hover:border-primary/50 flex flex-col overflow-hidden rounded-lg bg-white transition-colors"
							>
								<div className="bg-foreground/5 relative aspect-video">
									{result.metadata?.image ? (
										<Img
											className="aspect-video w-full object-cover"
											image={result.metadata?.image}
											width={400}
											alt={result.title ?? ''}
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center text-gray-300">
											<VscBook className="h-10 w-10" />
										</div>
									)}
								</div>
								<div className="flex flex-1 flex-col py-3">
									<h4 className="group-hover:text-primary mb-2 line-clamp-2 text-sm font-semibold">
										{result.title}
									</h4>
									<span className="text-muted-foreground mt-auto flex items-center text-xs">
										Read <VscChevronRight className="ml-1" />
									</span>
								</div>
							</Link>
						))}
					</div>

					{/* Controls Phân trang Blog */}
					<PaginationControls
						totalItems={blogs.length}
						currentPage={blogPage}
						onPageChange={setBlogPage}
					/>
				</section>
			)}

			{/* KHỐI 3: PAGES */}
			{pages.length > 0 && (
				<section>
					<h3 className="mb-4 flex items-center gap-2 border-b pb-2 text-xl font-bold">
						<VscFile /> Page ({pages.length})
					</h3>
					<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{getPaginatedItems(pages, pagePage).map((result: any) => (
							<li key={result._id || result.slug}>
								<Link
									href={result.slug}
									className="group hover:border-primary/30 flex items-center gap-3 rounded-md border border-gray-200 p-3 transition-colors hover:bg-gray-50"
								>
									<div className="group-hover:bg-primary/10 group-hover:text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
										<VscFile />
									</div>
									<span className="group-hover:text-primary truncate text-sm font-medium decoration-1 underline-offset-2 group-hover:underline">
										{result.title}
									</span>
								</Link>
							</li>
						))}
					</ul>

					{/* Controls Phân trang Pages */}
					<PaginationControls
						totalItems={pages.length}
						currentPage={pagePage}
						onPageChange={setPagePage}
					/>
				</section>
			)}
		</div>
	)
}

// 5. COMPONENT ĐIỀU KHIỂN PHÂN TRANG (Tách ra để tái sử dụng)
function PaginationControls({
	totalItems,
	currentPage,
	onPageChange,
}: {
	totalItems: number
	currentPage: number
	onPageChange: (page: number) => void
}) {
	const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

	// Nếu chỉ có 1 trang thì không hiện nút phân trang
	if (totalPages <= 1) return null

	return (
		<div className="mt-4 flex items-center justify-center gap-4">
			<button
				onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
				disabled={currentPage === 1}
				className="flex items-center gap-1 rounded-md border px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
			>
				<VscChevronLeft /> Previous
			</button>

			<span className="text-sm text-gray-600">
				Page {currentPage} / {totalPages}
			</span>

			<button
				onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
				disabled={currentPage === totalPages}
				className="flex items-center gap-1 rounded-md border px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
			>
				Next <VscChevronRight />
			</button>
		</div>
	)
}

const formatSold = (sold?: number) => {
	if (typeof sold !== 'number' || sold <= 0) return null
	if (sold >= 1000) {
		const formatted = (sold / 1000).toFixed(1).replace(/\.0$/, '')
		return `${formatted}k+ sold`
	}
	return `${sold} sold`
}

function ProductCard({ product }: { product: any }) {
	const totalReviews = product.reviews?.length ?? 0
	const averageRating =
		totalReviews > 0
			? product.reviews.reduce(
					(sum: number, r: any) => sum + (r.rating || 0),
					0,
				) / totalReviews
			: 0

	const soldText = formatSold(product.sold)
	const hasRating = totalReviews > 0
	const hasSold = Boolean(soldText)

	return (
		<Link href={product.slug} className="block h-full">
			<div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md">
				{/* Image */}
				<div className="relative aspect-square overflow-hidden">
					<ResponsiveImage
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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

				{/* Content */}
				<div className="flex flex-1 flex-col justify-between p-3">
					<div className="space-y-1">
						<h3 className="line-clamp-2 text-xs font-semibold text-gray-900 lg:text-sm">
							{product.title}
						</h3>

						{(hasRating || hasSold) && (
							<div className="flex flex-wrap items-center justify-center gap-1 text-[11px] lg:text-xs">
								{hasRating && (
									<>
										<span className="font-medium text-gray-700">
											{averageRating.toFixed(1)}
										</span>
										<span className="text-yellow-500">★</span>
										<span className="text-gray-400">({totalReviews})</span>
									</>
								)}

								{hasRating && hasSold && (
									<span className="text-gray-300">|</span>
								)}

								{hasSold && (
									<span className="text-gray-500">{soldText}.</span>
								)}
							</div>
						)}
					</div>

					<div className="mt-2 hidden">
						{product.compareAtPrice &&
						product.compareAtPrice > product.price &&
						product.price != 0 ? (
							<div className="flex flex-wrap items-baseline gap-2">
								<span className="text-sm font-bold text-red-600 lg:text-base">
									{formatVND(product.price)}
								</span>
								<span className="text-[10px] text-gray-400 line-through lg:text-xs">
									{formatVND(product.compareAtPrice)}
								</span>
							</div>
						) : (
							<span className="text-sm font-semibold text-red-600 lg:text-base">
								{product.price <= 0 ? 'Liên hệ' : formatVND(product.price)}
							</span>
						)}
					</div>
				</div>
			</div>
		</Link>
	)
}
