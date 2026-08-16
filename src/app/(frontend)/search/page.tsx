import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPage, getProductSettings } from '@/sanity/lib/queries'
import Loading from '@/ui/loading'
import ModulesResolver from '@/ui/modules'
import Breadcrumbs from '@/ui/modules/breadcrumbs'
import SearchModule from '@/ui/modules/search'

export async function generateMetadata(): Promise<Metadata> {
	const page = await getPage(['search'])
	const { title, description, noIndex } = page?.metadata ?? {}

	return {
		title: title || 'Tìm kiếm sản phẩm',
		description: description || 'Tìm kiếm tất cả sản phẩm trong cửa hàng',
		robots: {
			index: noIndex ? false : undefined,
		},
	}
}

export default async function SearchPage() {
	const [page, productSettings] = await Promise.all([
		getPage(['search']),
		getProductSettings(),
	])

	const currentPage = {
		_type: 'page',
		title: page?.metadata?.title || page?.title || 'Tìm kiếm',
		...page,
	}

	// Lấy module search-module từ Sanity page nếu có
	const searchModuleData = page?.modules?.find(
		(m: any) => m?._type === 'search-module',
	) as any

	// Lấy breadcrumbs module cấu hình từ Sanity nếu có
	const sanityBreadcrumbs = page?.modules?.find(
		(m: any) => m?._type === 'breadcrumbs',
	) as any

	// Loại bỏ search-module và breadcrumbs khỏi các modules còn lại để tránh render lặp
	const otherModules = page?.modules?.filter(
		(m: any) => m?._type !== 'search-module' && m?._type !== 'breadcrumbs',
	)

	return (
		<main className="min-h-screen">
			{/* Breadcrumbs Navigation */}
			<Breadcrumbs
				_type="breadcrumbs"
				crumbs={sanityBreadcrumbs?.crumbs}
				currentPage={currentPage}
			/>

			<Suspense fallback={<Loading>Đang tải trang tìm kiếm...</Loading>}>
				<SearchModule
					_type="search-module"
					intro={searchModuleData?.intro || []}
					scope={searchModuleData?.scope || 'all'}
				/>
			</Suspense>

			{/* Render các Global Modules hoặc Modules bổ sung từ Sanity nếu có */}
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

