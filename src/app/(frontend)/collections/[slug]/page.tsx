import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ROUTES } from '@/lib/env'
import { enrichProductsWithD1Reviews } from '@/lib/reviews'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'
import { PRODUCT_CARD_FIELDS } from '@/sanity/lib/product-card-query'
import {
	getProductSettings,
	GLOBAL_MODULE_PATH_QUERY,
	MODULES_QUERY,
} from '@/sanity/lib/queries'
import ModulesResolver from '@/ui/modules'
import Breadcrumbs from '@/ui/modules/breadcrumbs'
import CollectionContent from '@/ui/modules/collection/collection-content'

export const dynamic = 'force-dynamic'

type Props = {
	params: Promise<{ slug: string }>
}

export default async function CollectionPage({ params }: Props) {
	const { slug } = await params
	const [collection, productSettings] = await Promise.all([
		getCollection(slug),
		getProductSettings(),
	])

	if (!collection) notFound()

	const globalBefore = (collection as any).globalBefore || []
	const customModules =
		(collection as any).customModules || collection.modules || []
	const globalAfter = (collection as any).globalAfter || []

	const bottomModules = [
		...customModules.filter(
			(m: any) =>
				m?._type !== 'collection-content' && m?._type !== 'breadcrumbs',
		),
		...globalAfter,
	]

	return (
		<>
			{/* 1. Breadcrumbs Navigation */}
			<Breadcrumbs currentPage={collection} />

			{/* 2. Top Global Modules (Urgency banners, sitewide notices) */}
			{globalBefore.length > 0 && (
				<ModulesResolver
					modules={globalBefore}
					collection={collection}
					productSettings={productSettings}
				/>
			)}

			{/* 3. Fixed Core Entity View: Collection Catalog & Filters */}
			<CollectionContent
				collection={collection}
				productSettings={productSettings}
			/>

			{/* 4. Bottom CRO Modules (Lead capture, Testimonials, FAQ) */}
			{bottomModules.length > 0 && (
				<ModulesResolver
					modules={bottomModules}
					collection={collection}
					productSettings={productSettings}
				/>
			)}
		</>
	)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const collection = await getCollection(slug)
	const { title, description, image, noIndex } = collection?.metadata ?? {}

	const metaTitle = title || collection?.title || 'Collection'
	const metaDescription = description || ''

	return {
		title: metaTitle,
		description: metaDescription,
		openGraph: {
			title: metaTitle,
			description: metaDescription,
			url: `${process.env.NEXT_PUBLIC_BASE_URL}/${ROUTES.collections}/${slug}`,
			images: [
				image
					? urlFor(image).width(1200).url()
					: collection?.image
						? urlFor(collection.image).width(1200).url()
						: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?slug=${ROUTES.collections}/${slug}`,
			],
		},
		robots: {
			index: noIndex ? false : undefined,
		},
	}
}

export async function generateStaticParams() {
	return await client.fetch<{ slug: string }[]>(
		groq`
			*[_type == 'collection' && defined(metadata.slug.current)]{
				'slug': metadata.slug.current
			}
		`,
	)
}

async function getCollection(slug: string) {
	const collection = await sanityFetchLive<any>({
		query: COLLECTION_QUERY,
		params: {
			slug,
			collectionDir: `${ROUTES.collections}/`,
		},
	})

	if (!collection && slug === 'all') {
		const allProducts = await sanityFetchLive<any[]>({
			query: ALL_PRODUCTS_QUERY,
		})

		return {
			_id: 'all-collection',
			_type: 'collection',
			title: 'All Products',
			slug: 'all',
			products: await enrichProductsWithD1Reviews(allProducts || []),
		}
	}

	if (collection?.products) {
		return {
			...collection,
			products: await enrichProductsWithD1Reviews(collection.products),
		}
	}

	return collection
}

const ALL_PRODUCTS_QUERY = groq`
*[_type == "product"] | order(_createdAt desc) {
${PRODUCT_CARD_FIELDS}
}
`

const COLLECTION_QUERY = groq`
*[_type == 'collection' && metadata.slug.current == $slug][0]{
	_id,
	_type,
	title,
	"slug": metadata.slug.current,
	description,
	image {
		...,
		asset->
	},

	products[@-> != null]->{
${PRODUCT_CARD_FIELDS}
},

	'globalBefore': (
		*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
		+ *[_type == 'global-module' && path == $collectionDir].before[]{ ${MODULES_QUERY} }
	),
	'customModules': coalesce(modules, [])[]{ ${MODULES_QUERY} },
	'globalAfter': (
		*[_type == 'global-module' && path == $collectionDir].after[]{ ${MODULES_QUERY} }
		+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
	),

	metadata
}
`
