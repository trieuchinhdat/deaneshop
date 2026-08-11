import { PortableText } from 'next-sanity'
import type { CollectionContent as CollectionContentModuleType } from '@/sanity/types'
import ProductListClient from '@/ui/modules/product/product-list-client'
import ResponsiveImage from '@/ui/responsiveImage'
import { moduleAttributes } from '..'

type Props = CollectionContentModuleType & {
	_key: string
	collection?: {
		_id: string
		title?: string
		description?: any[]
		image?: any
		products?: any[]
	}
	productSettings?: any
}

export default function CollectionContent({
	collection,
	showBanner = true,
	showTitle = true,
	showDescription = true,
	itemsPerPage = 12,
	enableFilter = true,
	layout = 'grid',
	productSettings,
	...props
}: Props) {
	if (!collection) return null

	const products = collection.products ?? []

	return (
		<section className="section py-4 lg:py-8" {...moduleAttributes(props)}>
			{/* Banner Image */}
			{showBanner && collection.image && (
				<div className="mb-6 w-full overflow-hidden rounded-xl">
					<ResponsiveImage
						className="w-full object-cover max-h-[360px] lg:max-h-[480px]"
						image={collection.image}
						desktop={{ width: 1440 }}
						mobile={{ width: 480 }}
						priority={true}
						sizes="100vw"
					/>
				</div>
			)}

			{/* Collection Header (Title & Description) */}
			{(showTitle || showDescription) && (
				<div className="mb-6 space-y-3">
					{showTitle && collection.title && (
						<h1 className="text-2xl font-bold tracking-tight text-gray-900 lg:text-4xl">
							{collection.title}
						</h1>
					)}
					{showDescription &&
						collection.description &&
						collection.description.length > 0 && (
							<div className="prose prose-sm lg:prose-base max-w-none text-gray-600">
								<PortableText value={collection.description} />
							</div>
						)}
				</div>
			)}

			{/* Products List Grid */}
			<div>
				{products.length > 0 ? (
					<ProductListClient
						products={products}
						layout={layout}
						itemsPerPage={itemsPerPage}
						rowsDesktop={1}
						rowsMobile={1}
						autoSlide={false}
						enableFilter={enableFilter}
						productSettings={productSettings}
					/>
				) : (
					<div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
						<p className="text-base text-gray-500">
							Chưa có sản phẩm nào trong bộ sưu tập này.
						</p>
					</div>
				)}
			</div>
		</section>
	)
}
