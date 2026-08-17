import { groq } from 'next-sanity'
import { ROUTES } from '@/lib/env'
import { sanityFetchLive } from '@/sanity/lib/live'

export const revalidate = 3600 // Cache for 1 hour, stale-while-revalidate

const LLMS_QUERY = groq`{
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
	]|order(publishDate desc)[0...30]{
		title,
		'description': coalesce(metadata.description, excerpt, ''),
		'slug': '/' + $productDir + '/' + metadata.slug.current,
		price
	},
	'posts': *[
		_type == 'blog.post'
		&& defined(metadata.slug.current)
		&& metadata.noIndex != true
	]|order(publishDate desc)[0...30]{
		title,
		'description': coalesce(excerpt, metadata.description, ''),
		'slug': '/' + $blogDir + '/' + metadata.slug.current
	}
}`

export async function GET() {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ecocros.com'

	try {
		// Timeout protection (max 2.5s) to guarantee no crawler/Lighthouse timeout
		const fetchPromise = sanityFetchLive<any>({
			query: LLMS_QUERY,
			params: {
				blogDir: ROUTES.blog,
				productDir: ROUTES.products,
			},
		})

		const timeoutPromise = new Promise<null>((resolve) =>
			setTimeout(() => resolve(null), 2500),
		)

		const data = await Promise.race([fetchPromise, timeoutPromise])

		const siteTitle = data?.site?.title || 'Ecocros'
		const siteDescription =
			data?.site?.description ||
			'Ecocros - Modern E-Commerce Platform offering curated lifestyle, technology, and home products with fast shipping and guaranteed quality.'

		const sections: string[] = []

		// 1. Mandatory Header & Summary according to llmstxt.org specification
		sections.push(`# ${siteTitle}`)
		sections.push(`> ${siteDescription}`)
		sections.push('')
		sections.push(
			`Welcome to the machine-readable overview for **${siteTitle}**. This file is provided in the standard [llms.txt](https://llmstxt.org/) format to help Large Language Models (LLMs), AI assistants, and automated agents navigate and understand our store, products, collections, and articles.`,
		)
		sections.push('')

		// 2. Core Pages
		if (data?.pages?.length) {
			sections.push('## Pages')
			for (const page of data.pages) {
				const url = `${baseUrl}${page.slug}`
				const desc = page.description ? `: ${page.description}` : ''
				sections.push(`- [${page.title || 'Page'}](${url})${desc}`)
			}
			sections.push('')
		}

		// 3. Product Collections
		if (data?.collections?.length) {
			sections.push('## Collections')
			for (const collection of data.collections) {
				const url = `${baseUrl}${collection.slug}`
				const desc = collection.description
					? `: ${collection.description}`
					: ''
				sections.push(
					`- [${collection.title || 'Collection'}](${url})${desc}`,
				)
			}
			sections.push('')
		}

		// 4. Featured Products
		if (data?.products?.length) {
			sections.push('## Products')
			for (const product of data.products) {
				const url = `${baseUrl}${product.slug}`
				const desc = product.description ? `: ${product.description}` : ''
				sections.push(`- [${product.title || 'Product'}](${url})${desc}`)
			}
			sections.push('')
		}

		// 5. Blog Posts & Guides
		if (data?.posts?.length) {
			sections.push('## Blog & Articles')
			for (const post of data.posts) {
				const url = `${baseUrl}${post.slug}`
				const desc = post.description ? `: ${post.description}` : ''
				sections.push(`- [${post.title || 'Article'}](${url})${desc}`)
			}
			sections.push('')
		}

		// 6. Machine Feeds & Optional Resources
		sections.push('## Optional Feeds & Indexes')
		sections.push(
			`- [Full LLM Context](${baseUrl}/llms-full.txt): Comprehensive deep context for all products and pages`,
		)
		sections.push(
			`- [XML Sitemap](${baseUrl}/sitemap.xml): Complete URL index of all public web pages`,
		)
		sections.push(
			`- [Blog RSS Feed](${baseUrl}/${ROUTES.blog}/rss.xml): Latest published stories and updates`,
		)
		sections.push('')

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
		console.error('Error generating llms.txt:', error)

		// Resilient fallback markdown complying with llmstxt.org
		const fallbackMarkdown = [
			`# Ecocros`,
			`> Modern E-Commerce Platform offering curated lifestyle, home, and tech products.`,
			``,
			`## Navigation`,
			`- [Home](${baseUrl}/): Main storefront with featured collections and promotions`,
			`- [Collections](${baseUrl}/collections/all): Browse all product catalogs`,
			`- [Blog](${baseUrl}/${ROUTES.blog}): Articles, product reviews, and shopping guides`,
			`- [Search](${baseUrl}/search): Search our product catalog`,
			``,
			`## Optional`,
			`- [XML Sitemap](${baseUrl}/sitemap.xml): Complete URL index`,
			`- [Blog RSS Feed](${baseUrl}/${ROUTES.blog}/rss.xml): Latest blog updates`,
		].join('\n')

		return new Response(fallbackMarkdown, {
			status: 200,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'public, max-age=300',
			},
		})
	}
}
