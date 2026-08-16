import type { Metadata } from 'next'
import { getPage, getProductSettings } from '@/sanity/lib/queries'
import BreadcrumbsComponent from '@/ui/modules/breadcrumbs'
import ModulesResolver from '@/ui/modules'
import WishlistClient from '@/ui/modules/wishlist/wishlist-client'

export async function generateMetadata(): Promise<Metadata> {
	const page = await getPage(['wishlist'])
	const { title, description, noIndex } = page?.metadata ?? {}

	return {
		title: title || 'Danh sách yêu thích | ECOCROS',
		description: description || 'Những sản phẩm bạn đã lưu để xem lại và mua sắm sau tại ECOCROS.',
		robots: {
			index: noIndex ? false : undefined,
		},
	}
}

export default async function WishlistPage() {
	const [page, productSettings] = await Promise.all([
		getPage(['wishlist']),
		getProductSettings(),
	])

	// Tìm module wishlist từ page nếu có cấu hình trên Sanity
	const pageWishlistModule = page?.modules?.find(
		(m: any) => m?._type === 'wishlist',
	) as any

	// Lọc bớt các module wishlist trong page modules để tránh render đúp
	const otherModules = page?.modules?.filter(
		(m: any) => m?._type !== 'wishlist' && m?._type !== 'breadcrumbs',
	)

	// Kiểm tra xem trang có module breadcrumbs từ Sanity không
	const hasBreadcrumbsModule = page?.modules?.some(
		(m: any) => m?._type === 'breadcrumbs',
	)

	const title = pageWishlistModule?.title || page?.title || 'Danh sách yêu thích'
	const description =
		pageWishlistModule?.description || (page as any)?.description || 'Những sản phẩm bạn đã lưu để xem lại và mua sắm sau.'
	const emptyTitle = pageWishlistModule?.emptyTitle
	const emptyDescription = pageWishlistModule?.emptyDescription
	const emptyButtonText = pageWishlistModule?.emptyButtonText
	const emptyButtonLink = pageWishlistModule?.emptyButtonLink
	const showMoveAllToCart = pageWishlistModule?.showMoveAllToCart ?? true
	const showClearAll = pageWishlistModule?.showClearAll ?? true

	return (
		<main className="min-h-screen bg-gray-50/40 pb-12">
			{/* Breadcrumb điều hướng ở đầu trang */}
			<BreadcrumbsComponent
				_type="breadcrumbs"
				crumbs={[
					{
						_key: 'home',
						_type: 'link',
						label: 'Trang chủ',
						type: 'external',
						external: '/',
					} as any,
				]}
				currentPage={{ title }}
			/>

			{/* Khối danh sách yêu thích chính (sử dụng ProductCard đồng bộ với toàn trang) */}
			<WishlistClient
				title={title}
				description={description}
				emptyTitle={emptyTitle}
				emptyDescription={emptyDescription}
				emptyButtonText={emptyButtonText}
				emptyButtonLink={emptyButtonLink}
				showMoveAllToCart={showMoveAllToCart}
				showClearAll={showClearAll}
				productSettings={productSettings}
			/>

			{/* Render các Dynamic Modules bổ sung từ Sanity (như Banner, Gợi ý sản phẩm, FAQ...) nếu có */}
			{otherModules && otherModules.length > 0 && (
				<div className="mt-8">
					<ModulesResolver
						page={{ ...(page as any), modules: otherModules as any }}
						productSettings={productSettings}
					/>
				</div>
			)}
		</main>
	)
}
