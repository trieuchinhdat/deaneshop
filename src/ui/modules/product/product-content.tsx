import { cn } from '@/lib/utils'
import type { PRODUCT_QUERY_RESULT, PRODUCT_SETTINGS_QUERY_RESULT, ProductContent } from '@/sanity/types'
import ProductContentClient from './product-content-client'

export default function ProductContent({
	product,
	productSettings,
}: {
	product: PRODUCT_QUERY_RESULT
	productSettings?: PRODUCT_SETTINGS_QUERY_RESULT
} & Partial<ProductContent>) {
	if (!product) return null

	return (
		<>
			<section className={cn('section')}>
				<ProductContentClient
					title={product.title ?? 'No title'}
					sku={product.sku ?? 'No SKU'}
					category={product.categories as any[] | undefined}
					tags={(product as any)?.tags as string[] | undefined}
					slug={product.metadata?.slug?.current ?? ''}
					price={product.price ?? 0}
					compareAtPrice={product.compareAtPrice ?? 0}
					description={product.description ?? []}
					images={product.images ?? []}
					sales={product?.sold ?? 0}
					productId={product._id}
					approvedReviews={(product as any)?.approvedReviews}
					reviewSummary={(product as any)?.reviewSummary}
					stock={product.stock ?? undefined}
					inStock={(product as any)?.inStock ?? ((product.stock ?? 1) > 0)}
					shortPitch={(product as any)?.shortPitch}
					keyBenefits={(product as any)?.keyBenefits}
					specs={(product as any)?.specs}
					productSettings={productSettings}
					hasVariants={(product as any)?.hasVariants ?? false}
					options={(product as any)?.options}
					variants={(product as any)?.variants}
					promotionMode={(product as any)?.promotionMode}
					promotions={(product as any)?.promotions}
					enableSpecialDeal={(product as any)?.enableSpecialDeal}
					specialDealConfig={(product as any)?.specialDealConfig}
					moq={(product as any)?.moq}
					priceTiers={(product as any)?.priceTiers}
					leadTime={(product as any)?.leadTime}
					specSheetPdf={(product as any)?.specSheetPdf}
					pricingModel={(product as any)?.pricingModel}
					currency={(product as any)?.currency}
					priceNote={(product as any)?.priceNote}
					conversionType={(product as any)?.conversionType}
				/>
			</section>
		</>
	)
}
