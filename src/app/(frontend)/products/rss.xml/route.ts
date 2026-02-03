import { escapeHTML, toHTML } from '@portabletext/to-html'
import { groq } from 'next-sanity'
import { ROUTES } from '@/lib/env'
import { getBlockText } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'
import type { PRODUCT_RSS_QUERY_RESULT } from '@/sanity/types'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_UR
export async function GET() {
	const { page, products } = await sanityFetchLive<PRODUCT_RSS_QUERY_RESULT>({
		query: PRODUCT_RSS_QUERY,
		params: {
			productDir: ROUTES.products,
		},
	})

	const rssXML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
	<title>${page?.metadata?.title ?? 'Products'}</title>
	<description>${page?.metadata?.description ?? ''}</description>
	<link>${BASE_URL}/${ROUTES.products}</link>
	<language>en-US</language>
	<lastBuildDate>${new Date().toISOString()}</lastBuildDate>

	${products.map((product: any) => Item({ product })).join('')}
</channel>
</rss>`

	return new Response(rssXML, {
		headers: {
			'Content-Type': 'application/rss+xml',
		},
	})
}

function Item({
	product,
}: {
	product: PRODUCT_RSS_QUERY_RESULT['products'][number]
}) {
	const url = `${BASE_URL}/${ROUTES.products}/${product.metadata?.slug?.current}`

	return `<item>
	<title><![CDATA[${escapeHTML(product.title ?? '')}]]></title>
	<description><![CDATA[
		${escapeHTML(product.metadata?.description ?? '')}
	]]></description>

	<link>${url}</link>
	<guid isPermaLink="true">${url}</guid>

	${[
		product.categories
			?.map((category: any) => `<category>${category.title}</category>`)
			.join(''),

		product.metadata?.image &&
			`<enclosure 
				url="${urlFor(product.metadata.image).format('jpg').url()}" 
				length="0" 
				type="image/jpeg" 
			/>`,

		product.description &&
			`<content:encoded><![CDATA[
				${toHTML(product.description, {
					components: {
						marks: {
							code: ({ text }) => `<code>${escapeHTML(text)}</code>`,
						},
						types: {
							image: ({ value: { alt = '', figcaption, ...value } }) =>
								`<figure>${[
									`<img src="${urlFor(value).url()}" alt="${escapeHTML(alt)}" />`,
									figcaption &&
										`<figcaption>${escapeHTML(
											getBlockText(figcaption),
										)}</figcaption>`,
								]
									.filter(Boolean)
									.join('')}</figure>`,
							code: ({ value: { code } }) =>
								code && `<pre><code>${escapeHTML(code)}</code></pre>`,
							'custom-html': ({ value: { html } }) => html?.code,
						},
					},
				})}
			]]></content:encoded>`,
	]
		.filter(Boolean)
		.join('')}
</item>`
}

const PRODUCT_RSS_QUERY = groq`{
	'page': *[
		_type == 'page' 
		&& metadata.slug.current == $productDir
	][0]{
		metadata
	},

	'products': *[
		_type == 'product' 
		&& metadata.noIndex != true
	]|order(_createdAt desc){
		title,
		description,
		sku,
		price,
		compareAtPrice,
		stock,

		categories[]->{ title },

		metadata{
			slug,
			description,
			image
		}
	}
}`
