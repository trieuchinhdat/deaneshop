import pkg from '@@/package.json'
import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ROUTES } from '@/lib/env'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { getPage, getProductSettings } from '@/sanity/lib/queries'
import ModulesResolver from '@/ui/modules'

type Props = {
	params: Promise<{ slug?: string[] }>
}

export default async function Page({ params }: Props) {
	const { slug } = await params
	const [page, productSettings] = await Promise.all([
		getPage(slug),
		getProductSettings(),
	])
	if (!page) notFound()

	return <ModulesResolver page={page} productSettings={productSettings} />
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const page = await getPage(slug)
	const { title, description, image, noIndex } = page?.metadata ?? {}

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: [process.env.NEXT_PUBLIC_BASE_URL, slug?.join('/')]
				.filter(Boolean)
				.join('/'),
			images: [
				image
					? urlFor(image).width(1200).url()
					: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?slug=${slug?.join('/')}`,
			],
		},
		robots: {
			index: noIndex ? false : undefined,
		},
		alternates: {
			types: {
				'application/rss+xml': `/${ROUTES.blog}/rss.xml`,
			},
		},
		generator: `SanityPress v${pkg.version}`,
	}
}

export async function generateStaticParams() {
	const slugs = await client.fetch<string[]>(
		groq`
			*[
				_type == 'page'
				&& defined(metadata.slug.current)
				&& !(metadata.slug.current in ['404'])
			].metadata.slug.current
		`,
	)

	return slugs.map((slug) => ({
		slug: slug === 'index' ? undefined : slug.split('/'),
	}))
}

