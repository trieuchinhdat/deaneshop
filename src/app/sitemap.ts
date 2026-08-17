import type { MetadataRoute } from 'next'
import { groq } from 'next-sanity'
import { ROUTES } from '@/lib/env'
import { sanityFetchLive } from '@/sanity/lib/live'

export const dynamic = 'force-dynamic'

export default async function (): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'

	const data = await sanityFetchLive<{
		pages: MetadataRoute.Sitemap
		categories: MetadataRoute.Sitemap
		posts: MetadataRoute.Sitemap
		product: MetadataRoute.Sitemap
	}>({
		query: groq`{
			'pages': *[
				_type == 'page'
				&& defined(metadata.slug.current)
				&& !(metadata.slug.current in ['404'])
				&& metadata.noIndex != true
			]|order(metadata.slug.current != 'index', metadata.slug.current){
				'url': $baseUrl + select(
					metadata.slug.current == 'index' => '',
					'/' + metadata.slug.current
				),
				'lastModified': _updatedAt,
				'priority': select(
					metadata.slug.current == 'index' => 1.0,
					0.8
				)
			},
			'categories': *[
				_type == 'blog.category'
				&& defined(slug.current)
				&& metadata.noIndex != true
			]{
				'url': $baseUrl + '/' + $blogDir + '/category/' + slug.current,
				'lastModified': _updatedAt,
				'priority': 0.6
			},
			'posts': *[
				_type == 'blog.post'
				&& defined(metadata.slug.current)
				&& metadata.noIndex != true
			]|order(publishDate desc){
				'url': $baseUrl + '/' + $blogDir + '/' + metadata.slug.current,
				'lastModified': coalesce(lastUpdatedDate, _updatedAt),
				'priority': 0.7
			},
			'product': *[
				_type == 'product'
				&& defined(metadata.slug.current)
				&& metadata.noIndex != true
			]|order(publishDate desc){
				'url': $baseUrl + '/' + $productDir + '/' + metadata.slug.current,
				'lastModified': _updatedAt,
				'priority': 0.8
			}
		}`,
		params: {
			baseUrl,
			blogDir: ROUTES.blog,
			productDir: ROUTES.products,
		},
	})

	return Object.values(data).flat()
}
