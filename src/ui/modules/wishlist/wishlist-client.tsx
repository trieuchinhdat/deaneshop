'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
	HiOutlineArrowRight,
	HiOutlineHeart,
	HiOutlineShoppingBag,
	HiOutlineTrash,
} from 'react-icons/hi2'
import Swal from 'sweetalert2'
import { useCartStore } from '@/store/use-cart-store'
import { useWishlistStore } from '@/store/use-wishlist-store'
import { ProductCard } from '../product/product-list-client'
import QuickViewModal from '../product/quick-view-modal'

interface WishlistClientProps {
	title?: string
	description?: string
	emptyTitle?: string
	emptyDescription?: string
	emptyButtonText?: string
	emptyButtonLink?: string
	showMoveAllToCart?: boolean
	showClearAll?: boolean
	productSettings?: any
}

export default function WishlistClient({
	title = 'Danh sách yêu thích',
	description = 'Những sản phẩm bạn đã lưu để xem lại và mua sắm sau.',
	emptyTitle = 'Danh sách yêu thích của bạn đang trống',
	emptyDescription = 'Hãy thêm những sản phẩm bạn yêu thích bằng cách nhấn vào biểu tượng trái tim để xem lại bất cứ lúc nào!',
	emptyButtonText = 'Khám phá sản phẩm ngay',
	emptyButtonLink = '/collections/all',
	showMoveAllToCart = true,
	showClearAll = true,
	productSettings,
}: WishlistClientProps) {
	const [mounted, setMounted] = useState(false)
	const [products, setProducts] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null)
	const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

	const wishlistItems = useWishlistStore((state) => state.items)
	const clearWishlist = useWishlistStore((state) => state.clearWishlist)
	const addItemToCart = useCartStore((state) => state.addItem)

	useEffect(() => {
		setMounted(true)
	}, [])

	// Fetch dữ liệu sản phẩm mới nhất từ Sanity theo danh sách ID
	useEffect(() => {
		if (!mounted) return

		const ids = wishlistItems.map((item) => item._id)
		if (!ids.length) {
			setProducts([])
			setIsLoading(false)
			return
		}

		let isCancelled = false
		setIsLoading(true)

		fetch('/api/wishlist/query', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ids }),
		})
			.then((res) => res.json())
			.then((data) => {
				if (!isCancelled) {
					setProducts(data?.products || [])
					setIsLoading(false)
				}
			})
			.catch((err) => {
				console.error('[WISHLIST_FETCH_ERROR]', err)
				if (!isCancelled) {
					setIsLoading(false)
				}
			})

		return () => {
			isCancelled = true
		}
	}, [mounted, wishlistItems])

	// Lọc lại các sản phẩm vẫn còn trong wishlistItems
	const activeProducts = products.filter((p) =>
		wishlistItems.some((item) => item._id === p._id),
	)

	// Xóa tất cả
	const handleClearAll = () => {
		Swal.fire({
			title: 'Xóa toàn bộ danh sách?',
			text: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Xóa tất cả',
			cancelButtonText: 'Hủy',
			customClass: {
				container: 'z-[999]',
			},
		}).then((result) => {
			if (result.isConfirmed) {
				clearWishlist()
				setProducts([])
				Swal.fire({
					toast: true,
					position: 'top-end',
					icon: 'success',
					title: 'Đã xóa toàn bộ danh sách yêu thích',
					showConfirmButton: false,
					timer: 2000,
					timerProgressBar: true,
					customClass: {
						popup:
							'!p-3 !rounded-2xl !border !border-gray-200/90 !shadow-xl !bg-white !w-auto !min-w-[250px]',
						container: 'mt-20 md:mt-24 z-[999]',
					},
				})
			}
		})
	}

	// Chuyển tất cả sản phẩm còn hàng vào giỏ hàng
	const handleMoveAllToCart = () => {
		const inStockProducts = activeProducts.filter((p) => {
			const totalStock =
				typeof p.stock === 'number'
					? p.stock
					: (p.variants?.reduce(
							(sum: number, v: any) => sum + (v.stock ?? 0),
							0,
						) ?? 1)
			return totalStock > 0
		})

		if (!inStockProducts.length) {
			Swal.fire({
				toast: true,
				position: 'top-end',
				icon: 'info',
				title: 'Không có sản phẩm nào còn hàng để thêm',
				showConfirmButton: false,
				timer: 2500,
				customClass: {
					popup:
						'!p-3 !rounded-2xl !border !border-gray-200/90 !shadow-xl !bg-white !w-auto !min-w-[250px]',
					container: 'mt-20 md:mt-24 z-[999]',
				},
			})
			return
		}

		let addedCount = 0

		inStockProducts.forEach((p) => {
			const hasVariants =
				p.hasVariants || (Array.isArray(p.variants) && p.variants.length > 0)

			if (hasVariants && p.variants?.length) {
				// Tìm variant còn hàng đầu tiên (hoặc fallback về variant đầu tiên)
				const targetVariant =
					p.variants.find((v: any) => (v.stock ?? 1) > 0) || p.variants[0]

				const selectedOpts: Record<string, string> = {}
				if (Array.isArray(targetVariant?.options)) {
					targetVariant.options.forEach((opt: any) => {
						if (opt.name && opt.value) {
							selectedOpts[opt.name] = opt.value
						}
					})
				}

				const variantId = targetVariant?._key || targetVariant?.sku
				const cartItemId = variantId ? `${p._id}_${variantId}` : p._id
				const itemTitle = targetVariant?.title
					? `${p.title} (${targetVariant.title})`
					: p.title
				const itemPrice = targetVariant?.price ?? p.price
				const itemCompareAtPrice =
					targetVariant?.compareAtPrice ?? p.compareAtPrice
				const itemImage =
					targetVariant?.image || p.images?.[0] || '/fallback-image.png'

				addItemToCart({
					id: cartItemId,
					productId: p._id,
					productTitle: p.title,
					variantId,
					variantTitle: targetVariant?.title,
					selectedOptions: selectedOpts,
					sku: targetVariant?.sku || p.sku || '',
					title: itemTitle,
					price: itemPrice,
					compareAtPrice: itemCompareAtPrice,
					slug: p.slug,
					quantity: 1,
					image: itemImage,
					hasVariants: true,
					options: p.options,
					variants: p.variants,
				})
				addedCount++
			} else {
				addItemToCart({
					id: p._id,
					productId: p._id,
					productTitle: p.title,
					title: p.title,
					price: p.price,
					compareAtPrice: p.compareAtPrice,
					slug: p.slug,
					quantity: 1,
					image: p.images?.[0],
					hasVariants: false,
				})
				addedCount++
			}
		})

		Swal.fire({
			toast: true,
			position: 'top-end',
			icon: 'success',
			title: `Đã thêm ${addedCount} sản phẩm vào giỏ hàng`,
			showConfirmButton: false,
			timer: 3000,
			timerProgressBar: true,
			customClass: {
				popup:
					'!p-3 !rounded-2xl !border !border-gray-200/90 !shadow-xl !bg-white !w-auto !min-w-[250px]',
				container: 'mt-20 md:mt-24 z-[999]',
			},
		})
	}

	if (!mounted) {
		return (
			<div className="container-max py-8 lg:py-12">
				<div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-4" />
				<div className="h-4 w-96 bg-gray-100 animate-pulse rounded mb-8" />
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-2xl" />
					))}
				</div>
			</div>
		)
	}

	// Trường hợp danh sách rỗng
	if (!isLoading && activeProducts.length === 0) {
		return (
			<div className="container-max py-12 lg:py-20">
				<div className="max-w-md mx-auto text-center px-4">
					<div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
						<HiOutlineHeart className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
					</div>
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
						{emptyTitle}
					</h1>
					<p className="text-gray-600 mb-8 leading-relaxed text-sm sm:text-base">
						{emptyDescription}
					</p>
					<Link
						href={emptyButtonLink}
						className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-medium text-sm rounded-full shadow-lg shadow-gray-900/10 transition-all hover:scale-105 active:scale-95"
					>
						<span>{emptyButtonText}</span>
						<HiOutlineArrowRight className="w-4 h-4" />
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="container-max py-6 lg:py-10">
			{/* Header trang */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-100 mb-6 lg:mb-8">
				<div>
					<div className="flex items-center gap-3 mb-2">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
							{title}
						</h1>
						<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
							{activeProducts.length} món
						</span>
					</div>
					{description && (
						<p className="text-sm text-gray-500 max-w-xl">{description}</p>
					)}
				</div>

				{/* Toolbar hành động nhanh */}
				{activeProducts.length > 0 && (
					<div className="flex items-center gap-2 sm:gap-3 flex-wrap">
						{showMoveAllToCart && (
							<button
								onClick={handleMoveAllToCart}
								className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-medium rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
							>
								<HiOutlineShoppingBag className="w-4 h-4" />
								<span>Chuyển tất cả vào giỏ</span>
							</button>
						)}
						{showClearAll && (
							<button
								onClick={handleClearAll}
								className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 text-xs sm:text-sm font-medium rounded-xl transition-all border border-gray-200 hover:border-rose-200 cursor-pointer"
							>
								<HiOutlineTrash className="w-4 h-4" />
								<span>Xóa tất cả</span>
							</button>
						)}
					</div>
				)}
			</div>

			{/* Loading Skeleton */}
			{isLoading ? (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="flex flex-col gap-3">
							<div className="aspect-[3/4] bg-gray-100 animate-pulse rounded-2xl" />
							<div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
							<div className="h-4 bg-gray-100 animate-pulse rounded w-1/2" />
						</div>
					))}
				</div>
			) : (
				/* Grid danh sách sản phẩm dùng chung ProductCard chuẩn của hệ thống */
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
					{activeProducts.map((product) => (
						<ProductCard
							key={product._id}
							product={product}
							productSettings={productSettings}
							onOpenQuickView={(p) => {
								setQuickViewProduct(p)
								setIsQuickViewOpen(true)
							}}
						/>
					))}
				</div>
			)}

			{/* Modal Quick View khi chọn phân loại */}
			{isQuickViewOpen && quickViewProduct && (
				<QuickViewModal
					isOpen={isQuickViewOpen}
					product={quickViewProduct}
					productSettings={productSettings}
					onClose={() => {
						setIsQuickViewOpen(false)
						setQuickViewProduct(null)
					}}
				/>
			)}
		</div>
	)
}
