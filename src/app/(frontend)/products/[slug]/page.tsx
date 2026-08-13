import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ROUTES } from '@/lib/env'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'
import { GLOBAL_MODULE_PATH_QUERY, MODULES_QUERY, getProductSettings } from '@/sanity/lib/queries'
import type { PRODUCT_QUERY_RESULT } from '@/sanity/types'
import ModulesResolver from '@/ui/modules'

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

	const jsonLd = generateProductJsonLd(product, slug)

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<ModulesResolver product={product} productSettings={productSettings} />
		</>
	)
}

function generateProductJsonLd(product: NonNullable<PRODUCT_QUERY_RESULT>, slug: string) {
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

	const approvedReviews = (product as any)?.approvedReviews || []
	const totalReviews = approvedReviews.length
	const totalRating = approvedReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0)
	const avgRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : undefined

	const jsonLd: Record<string, any> = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.title || 'Product',
		image: images.length > 0 ? images : undefined,
		description: product.metadata?.description || product.title,
		sku: product.sku || product._id,
		offers: {
			'@type': 'Offer',
			url: productUrl,
			priceCurrency: 'VND',
			price: product.price || 0,
			availability:
				(product.stock ?? 1) > 0
					? 'https://schema.org/InStock'
					: 'https://schema.org/OutOfStock',
		},
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
				name: r.author || 'Khách hàng',
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
	const product = await sanityFetchLive<PRODUCT_QUERY_RESULT>({
		query: PRODUCT_QUERY,
		params: {
			slug,
			productDir: `${ROUTES.products}/`,
		},
	})

	if (!product) return null

	const globalBefore = (product as any).globalBefore || []
	const customModules = (product as any).customModules || []
	const globalAfter = (product as any).globalAfter || []

	const hasBreadcrumbs = [...globalBefore, ...customModules, ...globalAfter].some(
		(m: any) => m?._type === 'breadcrumbs',
	)

	const hasProductContent = [...globalBefore, ...customModules, ...globalAfter].some(
		(m: any) => m?._type === 'product-content',
	)

	let finalCustomModules = [...customModules]
	if (!hasProductContent) {
		finalCustomModules.unshift({
			_type: 'product-content',
			_key: 'default-product-content',
		})
	}

	if (!hasBreadcrumbs) {
		finalCustomModules.unshift({
			_type: 'breadcrumbs',
			_key: 'default-breadcrumbs',
		})
	}

	product.modules = [...globalBefore, ...finalCustomModules, ...globalAfter] as any

	return product
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

	"approvedReviews": *[_type == "review" && references(^._id) && isApproved == true] | order(createdAt desc) {
		_id,
		author,
		rating,
		comment,
		response,
		createdAt,
		images[]{
			...,
			asset->
		},
		videos[]{
			...,
			asset->
		}
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
