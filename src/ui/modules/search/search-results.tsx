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
import type { SearchModule } from '@/sanity/types'
import Img from '@/ui/img'
import ProductCard, { type Product } from '@/ui/modules/product/product-card'
import QuickViewModal from '@/ui/modules/product/quick-view-modal'
import { useSearchStore } from './store'

export default function SearchResults({
	query,
	scope = 'all',
}: {
	query: string
	scope?: SearchModule['scope']
}) {
	const {
		products,
		blogs,
		pages,
		totals,
		pageSize,
		search,
		clearResults,
		loading,
		error,
	} = useSearchStore()
	const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

	// Server pagination state for each group
	const [productPage, setProductPage] = useState(1)
	const [blogPage, setBlogPage] = useState(1)
	const [pagePage, setPagePage] = useState(1)

	// Reset pages to 1 whenever query or scope changes
	useEffect(() => {
		setProductPage(1)
		setBlogPage(1)
		setPagePage(1)
	}, [query, scope])

	// Trigger search or clear results when query, scope, or pages change
	useEffect(() => {
		if (!query || !query.trim()) {
			clearResults()
			return
		}
		search({
			query,
			scope,
			productPage,
			blogPage,
			pagePage,
		})
	}, [query, scope, productPage, blogPage, pagePage, search, clearResults])

	if (error) {
		return (
			<div
				role="alert"
				className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700"
			>
				{error}
			</div>
		)
	}

	const totalResults = products.length + blogs.length + pages.length
	if (!totalResults) {
		if (loading) return null

		return (
			<div className="py-10 text-center text-gray-500">
				No results found for &quot;{query}&quot;
			</div>
		)
	}

	return (
		<div className="space-y-10">
			{/* SECTION 1: PRODUCTS */}
			{products.length > 0 && (
				<section>
					<h3 className="mb-4 flex items-center gap-2 border-b pb-2 text-xl font-bold">
						<VscPackage /> Product ({totals.products})
					</h3>

					<div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
						{products.map((result: any) => (
							<ProductCard
								key={result._id}
								product={result}
								onOpenQuickView={(p) => setQuickViewProduct(p)}
							/>
						))}
					</div>

					<PaginationControls
						totalItems={totals.products}
						pageSize={pageSize}
						currentPage={productPage}
						onPageChange={setProductPage}
					/>
				</section>
			)}

			{/* SECTION 2: BLOG */}
			{blogs.length > 0 && (
				<section>
					<h3 className="mb-4 flex items-center gap-2 border-b pb-2 text-xl font-bold">
						<VscBook /> Blog ({totals.blogs})
					</h3>
					<div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
						{blogs.map((result: any) => (
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

					<PaginationControls
						totalItems={totals.blogs}
						pageSize={pageSize}
						currentPage={blogPage}
						onPageChange={setBlogPage}
					/>
				</section>
			)}

			{/* SECTION 3: PAGES */}
			{pages.length > 0 && (
				<section>
					<h3 className="mb-4 flex items-center gap-2 border-b pb-2 text-xl font-bold">
						<VscFile /> Page ({totals.pages})
					</h3>
					<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{pages.map((result: any) => (
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

					<PaginationControls
						totalItems={totals.pages}
						pageSize={pageSize}
						currentPage={pagePage}
						onPageChange={setPagePage}
					/>
				</section>
			)}

			{/* Reusable Quick View Modal */}
			<QuickViewModal
				isOpen={Boolean(quickViewProduct)}
				product={quickViewProduct}
				onClose={() => setQuickViewProduct(null)}
			/>
		</div>
	)
}

function PaginationControls({
	totalItems,
	pageSize,
	currentPage,
	onPageChange,
}: {
	totalItems: number
	pageSize: number
	currentPage: number
	onPageChange: (page: number) => void
}) {
	const totalPages = Math.ceil(totalItems / Math.max(1, pageSize))

	if (totalPages <= 1) return null

	return (
		<div className="mt-6 flex items-center justify-center gap-4">
			<button
				type="button"
				onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
				disabled={currentPage === 1}
				className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
				aria-label="Previous page"
			>
				<VscChevronLeft className="text-base" /> Previous
			</button>

			<span className="text-sm font-medium text-gray-700">
				Page {currentPage} / {totalPages}
			</span>

			<button
				type="button"
				onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
				disabled={currentPage === totalPages}
				className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
				aria-label="Next page"
			>
				Next <VscChevronRight className="text-base" />
			</button>
		</div>
	)
}
