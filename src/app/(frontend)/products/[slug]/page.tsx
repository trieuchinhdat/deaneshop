import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ROUTES } from '@/lib/env'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'
import { GLOBAL_MODULE_PATH_QUERY, MODULES_QUERY } from '@/sanity/lib/queries'
import type { PRODUCT_QUERY_RESULT } from '@/sanity/types'
import ModulesResolver from '@/ui/modules'

type Props = {
	params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: Props) {
	const { slug } = await params
	const product = await getProduct(slug)

	if (!product) notFound()

	return <ModulesResolver product={product} />
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

	sku,
	price,
	compareAtPrice,
	stock,
	sold,

	categories[]->{
		title,
		slug
	},

	reviews[]{
		author,
		rating,
		comment,
		images[]{
			...,
			asset->
		}
	},

	'modules': (
		// global modules (before)
		*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
		// path modules (before)
		+ *[_type == 'global-module' && path == $productDir].before[]{ ${MODULES_QUERY} }
		// product modules
		+ coalesce(modules, [])[]{ ${MODULES_QUERY} }
		// product path modules (after)
		+ *[_type == 'global-module' && path == $productDir].after[]{ ${MODULES_QUERY} }
		// global modules (after)
		+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
	)
}
`
