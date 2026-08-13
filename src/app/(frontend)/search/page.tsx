import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPage, getProductSettings } from '@/sanity/lib/queries'
import Loading from '@/ui/loading'
import SearchModule from '@/ui/modules/search'
import ModulesResolver from '@/ui/modules'

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

	// Lấy module search-module từ Sanity page nếu có
	const searchModuleData = page?.modules?.find(
		(m: any) => m?._type === 'search-module',
	) as any

	// Loại bỏ search-module khỏi các modules còn lại để tránh render lặp
	const otherModules = page?.modules?.filter(
		(m: any) => m?._type !== 'search-module',
	)

	return (
		<main className="min-h-screen py-6 lg:py-10">
			<div className="container mx-auto px-4 max-w-7xl">
				<Suspense fallback={<Loading>Đang tải trang tìm kiếm...</Loading>}>
					<SearchModule
						_type="search-module"
						intro={searchModuleData?.intro || []}
						scope={searchModuleData?.scope || 'all'}
					/>
				</Suspense>
			</div>

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
