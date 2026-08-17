import { groq } from 'next-sanity'
import { ROUTES } from '@/lib/env'
import { sanityFetchLive } from '@/sanity/lib/live'

export const revalidate = 3600

const LLMS_FULL_QUERY = groq`{
	'site': *[_type == 'site'][0]{
		title,
		description
	},
	'pages': *[
		_type == 'page'
		&& defined(metadata.slug.current)
		&& !(metadata.slug.current in ['404'])
		&& metadata.noIndex != true
	]|order(metadata.slug.current != 'index', metadata.slug.current){
		title,
		'description': metadata.description,
		'slug': select(
			metadata.slug.current == 'index' => '',
			'/' + metadata.slug.current
		)
	},
	'collections': *[
		_type == 'collection'
		&& defined(metadata.slug.current)
		&& metadata.noIndex != true
	]|order(title asc){
		title,
		'description': metadata.description,
		'slug': '/collections/' + metadata.slug.current
	},
	'products': *[
		_type == 'product'
		&& defined(metadata.slug.current)
		&& metadata.noIndex != true
	]|order(publishDate desc){
		title,
		'description': coalesce(metadata.description, excerpt, ''),
		'slug': '/' + $productDir + '/' + metadata.slug.current,
		price,
		compareAtPrice
	},
	'posts': *[
		_type == 'blog.post'
		&& defined(metadata.slug.current)
		&& metadata.noIndex != true
	]|order(publishDate desc){
		title,
		'description': coalesce(excerpt, metadata.description, ''),
		'slug': '/' + $blogDir + '/' + metadata.slug.current,
		publishDate
	}
}`

export async function GET() {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ecocros.com'

	try {
		const fetchPromise = sanityFetchLive<any>({
			query: LLMS_FULL_QUERY,
			params: {
				blogDir: ROUTES.blog,
				productDir: ROUTES.products,
			},
		})

		const timeoutPromise = new Promise<null>((resolve) =>
			setTimeout(() => resolve(null), 3000),
		)

		const data = await Promise.race([fetchPromise, timeoutPromise])

		const siteTitle = data?.site?.title || 'Ecocros'
		const siteDescription =
			data?.site?.description ||
			'Ecocros - Modern E-Commerce Platform offering curated lifestyle, home, and tech products.'

		const sections: string[] = []

		sections.push(`# ${siteTitle} - Full Knowledge Base`)
		sections.push(`> ${siteDescription}`)
		sections.push('')
		sections.push(
			`This document contains the comprehensive inventory and contents of **${siteTitle}** for advanced indexing and deep contextual processing by AI and LLM agents.`,
		)
		sections.push('')

		if (data?.pages?.length) {
			sections.push('## Static & Policy Pages')
			for (const page of data.pages) {
				const url = `${baseUrl}${page.slug}`
				sections.push(`### [${page.title || 'Page'}](${url})`)
				if (page.description) sections.push(page.description)
				sections.push('')
			}
		}

		if (data?.collections?.length) {
			sections.push('## Collections & Categories')
			for (const col of data.collections) {
				const url = `${baseUrl}${col.slug}`
				sections.push(`### [${col.title || 'Collection'}](${url})`)
				if (col.description) sections.push(col.description)
				sections.push('')
			}
		}

		if (data?.products?.length) {
			sections.push('## Full Product Catalog')
			for (const prod of data.products) {
				const url = `${baseUrl}${prod.slug}`
				const priceText = prod.price ? ` - Price: ${prod.price.toLocaleString()} VND` : ''
				sections.push(`### [${prod.title || 'Product'}](${url})${priceText}`)
				if (prod.description) sections.push(prod.description)
				sections.push('')
			}
		}

		if (data?.posts?.length) {
			sections.push('## Blog Articles & Guides')
			for (const post of data.posts) {
				const url = `${baseUrl}${post.slug}`
				const dateText = post.publishDate ? ` (${post.publishDate})` : ''
				sections.push(`### [${post.title || 'Article'}](${url})${dateText}`)
				if (post.description) sections.push(post.description)
				sections.push('')
			}
		}

		const markdown = sections.join('\n')

		return new Response(markdown, {
			status: 200,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control':
					'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
			},
		})
	} catch (error) {
		console.error('Error generating llms-full.txt:', error)
		return new Response(`# Ecocros\n> Full knowledge base fallback.\n`, {
			status: 200,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
			},
		})
	}
}
