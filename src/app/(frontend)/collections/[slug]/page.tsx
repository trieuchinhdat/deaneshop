import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ROUTES } from '@/lib/env'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'
import { GLOBAL_MODULE_PATH_QUERY, MODULES_QUERY, getProductSettings } from '@/sanity/lib/queries'
import ModulesResolver from '@/ui/modules'

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

	return <ModulesResolver collection={collection} productSettings={productSettings} />
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
			title: 'Tất cả sản phẩm',
			slug: 'all',
			products: allProducts || [],
			modules: [
				{
					_type: 'collection-content',
					_key: 'all-collection-content',
					showTitle: true,
					showDescription: false,
					enableFilter: true,
					itemsPerPage: 12,
					layout: 'grid',
				},
			],
		}
	}

	if (!collection) return null

	const globalBefore = collection.globalBefore || []
	const customModules = collection.customModules || []
	const globalAfter = collection.globalAfter || []

	const hasBreadcrumbs = [...globalBefore, ...customModules, ...globalAfter].some(
		(m: any) => m?._type === 'breadcrumbs',
	)

	const hasCollectionContent = [...globalBefore, ...customModules, ...globalAfter].some(
		(m: any) => m?._type === 'collection-content',
	)

	let finalCustomModules = [...customModules]

	if (!hasCollectionContent) {
		finalCustomModules.unshift({
			_type: 'collection-content',
			_key: `${collection._id}-default-content`,
			showTitle: true,
			showDescription: true,
			enableFilter: true,
			itemsPerPage: 12,
			layout: 'grid',
		})
	}

	if (!hasBreadcrumbs) {
		finalCustomModules.unshift({
			_type: 'breadcrumbs',
			_key: `${collection._id}-default-breadcrumbs`,
		})
	}

	collection.modules = [...globalBefore, ...finalCustomModules, ...globalAfter]

	return collection
}

const ALL_PRODUCTS_QUERY = groq`
*[_type == "product"] | order(_createdAt desc) {
	_id,
	title,
	price,
	compareAtPrice,
	tags,
	sold,
	stock,
	hasVariants,
	options[]{
		name,
		values
	},
	variants[]{
		_key,
		sku,
		title,
		price,
		compareAtPrice,
		stock,
		options[]{
			name,
			value
		},
		image{
			...,
			asset->
		}
	},
	"slug": metadata.slug.current,
	images[]{
		...,
		asset->
	},
	"reviews": *[_type == "review" && references(^._id) && isApproved == true]{ rating },
	categories[]->{
		title,
		"slug": slug.current
	}
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
		_id,
		title,
		price,
		compareAtPrice,
		tags,
		sold,
		stock,
		hasVariants,
		options[]{
			name,
			values
		},
		variants[]{
			_key,
			sku,
			title,
			price,
			compareAtPrice,
			stock,
			options[]{
				name,
				value
			},
			image{
				...,
				asset->
			}
		},
		"slug": metadata.slug.current,
		images[]{
			...,
			asset->
		},
		"reviews": *[_type == "review" && references(^._id) && isApproved == true]{ rating },
		categories[]->{
			title,
			"slug": slug.current
		}
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
