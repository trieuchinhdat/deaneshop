import { cn } from '@/lib/utils'
import type { PRODUCT_QUERY_RESULT, ProductContent } from '@/sanity/types'
import ProductContentClient from './product-content-client'

export default function ProductContent({
	product,
}: {
	product: PRODUCT_QUERY_RESULT
} & ProductContent) {
	if (!product) return null

	return (
		<>
			<section className={cn('section')}>
				<ProductContentClient
					title={product.title ?? 'No title'}
					sku={product.sku ?? 'No SKU'}
					category={product.categories as any[] | undefined}
					slug={product.metadata?.slug?.current ?? ''}
					price={product.price ?? 0}
					compareAtPrice={product.compareAtPrice ?? 0}
					description={product.description ?? []}
					images={product.images ?? []}
					sales={product?.sold ?? 0}
					reviews={product.reviews as any[] | undefined}
				/>
			</section>
		</>
	)
}
