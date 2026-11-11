import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ROUTES } from '@/lib/env'
import { serializeJsonLd } from '@/lib/json-ld'
import { getApprovedReviewsForProduct, type PublicProductReview } from '@/lib/reviews'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'
import { GLOBAL_MODULE_PATH_QUERY, MODULES_QUERY, getProductSettings } from '@/sanity/lib/queries'
import type { PRODUCT_QUERY_RESULT } from '@/sanity/types'
import Breadcrumbs from '@/ui/modules/breadcrumbs'
import ProductContent from '@/ui/modules/product/product-content'
import ModulesResolver from '@/ui/modules'

// D1 is bound to Worker requests and must not be queried during static builds.
export const dynamic = 'force-dynamic'

type Props = {
	params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: Props) {
	const { slug } = await params
	const [product, productSettings] = await Promise.all([
		getProduct(slug),
		getProductSettings(),
	])

	if (!product) notFound()

	const d1Reviews = await getApprovedReviewsForProduct(product._id, { limit: 50, offset: 0 })
	const productWithReviews = {
		...product,
		approvedReviews: d1Reviews.reviews,
		reviewSummary: { count: d1Reviews.total, avgRating: d1Reviews.averageRating },
	} as unknown as NonNullable<PRODUCT_QUERY_RESULT>

	const jsonLd = generateProductJsonLd(productWithReviews as any, slug, d1Reviews)

	const globalBefore = (productWithReviews as any).globalBefore || []
	const customModules = (productWithReviews as any).customModules || (productWithReviews.modules || [])
	const globalAfter = (productWithReviews as any).globalAfter || []

	const bottomModules = [
		...customModules.filter(
			(m: any) => m?._type !== 'product-content' && m?._type !== 'breadcrumbs',
		),
		...globalAfter,
	]

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
			/>

			{/* 1. Breadcrumbs Navigation */}
			<Breadcrumbs currentPage={productWithReviews} />

			{/* 2. Top Global Modules (Urgency banners, sitewide notices) */}
			{globalBefore.length > 0 && (
				<ModulesResolver
					modules={globalBefore}
					product={productWithReviews}
					productSettings={productSettings}
				/>
			)}

			{/* 3. Fixed Core Entity View: PDP Gallery, Pricing, Options & Reviews */}
			<ProductContent
				product={productWithReviews}
				productSettings={productSettings}
			/>

			{/* 4. Bottom CRO Modules (Tiered pricing, Compliance vault, Related products) */}
			{bottomModules.length > 0 && (
				<ModulesResolver
					modules={bottomModules}
					product={productWithReviews}
					productSettings={productSettings}
				/>
			)}
		</>
	)
}

function generateProductJsonLd(
	product: NonNullable<PRODUCT_QUERY_RESULT>,
	slug: string,
	d1Reviews?: { reviews: PublicProductReview[]; total: number; averageRating: number },
) {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
	const productUrl = `${baseUrl}/${ROUTES.products}/${slug}`

	const images = (product.images || [])
		.map((img: any) => {
			if (
				img?._type === 'image' ||
				(!img?._type && img?.asset && !img?.asset?.mimeType?.includes('video'))
			) {
				try {
					return urlFor(img).width(1200).url()
				} catch {
					return null
				}
			}
			return null
		})
		.filter(Boolean) as string[]

	const approvedReviews = d1Reviews?.reviews || (product as any)?.approvedReviews || []
	const totalReviews = d1Reviews?.total ?? approvedReviews.length
	const avgRating =
		totalReviews > 0
			? (
					d1Reviews?.averageRating ??
					approvedReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) /
						Math.max(1, approvedReviews.length)
				).toFixed(1)
			: undefined

	const jsonLd: Record<string, any> = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.title || 'Product',
		image: images.length > 0 ? images : undefined,
		description: product.metadata?.description || product.title,
		sku: product.sku || product._id,
	}

	const tiers = ((product as any)?.priceTiers || []).filter(
		(t: any) => typeof t.unitPrice === 'number' && t.unitPrice > 0,
	)

	if (tiers.length > 0) {
		const tierPrices = tiers.map((t: any) => t.unitPrice)
		const lowPrice = Math.min(...tierPrices)
		const highPrice = Math.max(...tierPrices, product.price || lowPrice)

		jsonLd.offers = {
			'@type': 'AggregateOffer',
			url: productUrl,
			priceCurrency: (product as any)?.currency || 'USD',
			lowPrice,
			highPrice,
			offerCount: tiers.length,
			offers: tiers.map((t: any) => ({
				'@type': 'Offer',
				price: t.unitPrice,
				priceCurrency: (product as any)?.currency || 'USD',
				eligibleQuantity: {
					'@type': 'QuantitativeValue',
					minValue: t.minQty,
					maxValue: t.maxQty || undefined,
					unitCode: 'C62',
				},
				availability:
					(product.stock ?? 1) > 0
						? 'https://schema.org/InStock'
						: 'https://schema.org/OutOfStock',
			})),
		}
	} else {
		jsonLd.offers = {
			'@type': 'Offer',
			url: productUrl,
			priceCurrency: (product as any)?.currency || 'USD',
			price: product.price || 0,
			availability:
				(product.stock ?? 1) > 0
					? 'https://schema.org/InStock'
					: 'https://schema.org/OutOfStock',
		}
	}

	if (totalReviews > 0 && avgRating) {
		jsonLd.aggregateRating = {
			'@type': 'AggregateRating',
			ratingValue: avgRating,
			reviewCount: totalReviews,
			bestRating: '5',
			worstRating: '1',
		}
		jsonLd.review = approvedReviews.map((r: any) => ({
			'@type': 'Review',
			author: {
				'@type': 'Person',
				name: r.author || 'Customer',
			},
			reviewRating: {
				'@type': 'Rating',
				ratingValue: r.rating || 5,
				bestRating: '5',
				worstRating: '1',
			},
			reviewBody: r.comment || '',
			datePublished: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
		}))
	}

	return jsonLd
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const product = await getProduct(slug)
	const { title, description, image, noIndex } = product?.metadata ?? {}

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: `${process.env.NEXT_PUBLIC_BASE_URL}/${ROUTES.products}/${slug}`,
			images: [
				image
					? urlFor(image).width(1200).url()
					: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?slug=${ROUTES.products}/${slug}`,
			],
		},
		robots: {
			index: noIndex ? false : undefined,
		},
		alternates: {
			types: {
				'application/rss+xml': `/${ROUTES.products}/rss.xml`,
			},
		},
	}
}

export async function generateStaticParams() {
	return await client.fetch<{ slug: string }[]>(
		groq`
			*[_type == 'product' && defined(metadata.slug.current)]{
				'slug': metadata.slug.current
			}
		`,
	)
}

async function getProduct(slug: string) {
	return await sanityFetchLive<PRODUCT_QUERY_RESULT>({
		query: PRODUCT_QUERY,
		params: {
			slug,
			productDir: `${ROUTES.products}/`,
		},
	})
}

const PRODUCT_QUERY = groq`
*[_type == 'product' && metadata.slug.current == $slug][0]{
	...,

	description[]{
		...,
		_type == 'image' => {
			...,
			asset->
		}
	},

	images[]{
		...,
		asset->
	},

	sku,
	price,
	compareAtPrice,
	stock,
	sold,
	inStock,
	shortPitch,
	keyBenefits,
	specs,
	moq,
	leadTime,
	pricingModel,
	conversionType,
	currency,
	priceNote,
	priceTiers,
	specSheetPdf{
		asset->{
			url,
			originalFilename,
			size
		}
	},

	hasVariants,
	options[]{
		name,
		values
	},
	variants[]{
		_key,
		title,
		sku,
		price,
		compareAtPrice,
		stock,
		image{
			...,
			asset->{
				...,
				metadata
			}
		},
		options[]{
			name,
			value
		}
	},

	categories[]->{
		title,
		slug
	},

	'globalBefore': (
		*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
		+ *[_type == 'global-module' && path == $productDir].before[]{ ${MODULES_QUERY} }
	),
	'customModules': coalesce(modules, [])[]{ ${MODULES_QUERY} },
	'globalAfter': (
		*[_type == 'global-module' && path == $productDir].after[]{ ${MODULES_QUERY} }
		+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
	)
}
`
