import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ROUTES } from '@/lib/env'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'
import { GLOBAL_MODULE_PATH_QUERY, MODULES_QUERY } from '@/sanity/lib/queries'
import ModulesResolver from '@/ui/modules'

type Props = {
	params: Promise<{ slug: string }>
}

export default async function CollectionPage({ params }: Props) {
	const { slug } = await params
	const collection = await getCollection(slug)

	if (!collection) notFound()

	return <ModulesResolver collection={collection} />
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
	return await sanityFetchLive<any>({
		query: COLLECTION_QUERY,
		params: {
			slug,
			collectionDir: `${ROUTES.collections}/`,
		},
	})
}

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
		"slug": metadata.slug.current,
		images[]{
			...,
			asset->
		},
		reviews,
		categories[]->{
			title,
			"slug": slug.current
		}
	},

	'modules': (
		// global modules (before)
		*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
		// path modules (before)
		+ *[_type == 'global-module' && path == $collectionDir].before[]{ ${MODULES_QUERY} }
		// collection modules
		+ coalesce(modules, [])[]{ ${MODULES_QUERY} }
		// path modules (after)
		+ *[_type == 'global-module' && path == $collectionDir].after[]{ ${MODULES_QUERY} }
		// global modules (after)
		+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
	),

	metadata
}
`
