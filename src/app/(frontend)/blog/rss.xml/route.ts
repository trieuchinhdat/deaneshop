import { escapeHTML, toHTML } from '@portabletext/to-html'
import { groq } from 'next-sanity'
import { ROUTES } from '@/lib/env'
import { getBlockText } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'

export async function GET() {
	const { blog, posts } = await sanityFetchLive<any>({
		query: BLOG_RSS_QUERY,
		params: {
			blogDir: ROUTES.blog,
		},
	})

	const rssXML = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
		<title>${escapeHTML(blog?.metadata?.title || 'Ecocros Journal')}</title>
		<description>${escapeHTML(blog?.metadata?.description || 'Curated stories and guides')}</description>
		<link>${BASE_URL}/${ROUTES.blog}</link>
		<language>en-US</language>
		<lastBuildDate>${new Date().toISOString()}</lastBuildDate>
		${(posts || []).map((post: any) => Item({ post })).join('')}</channel></rss>`

	return new Response(rssXML, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
		},
	})
}

function Item({ post }: { post: any }) {
	const url = `${BASE_URL}/${ROUTES.blog}/${post.metadata?.slug?.current || post._id}`
	const desc = post.excerpt || post.metadata?.description || ''

	return `<item>
		<title><![CDATA[${escapeHTML(post.title || 'Untitled')}]]></title>
		<description><![CDATA[${escapeHTML(desc)}]]></description>
		<link>${url}</link>
		<guid isPermaLink="true">${url}</guid>
		${[
			post.publishDate &&
				`<pubDate>${new Date(post.publishDate).toISOString()}</pubDate>`,
			post.categories
				?.map((category: any) => `<category>${escapeHTML(category.title)}</category>`)
				.join(''),
			post.author && `<dc:creator>${escapeHTML(post.author.name)}</dc:creator>`,
			post.metadata?.image?.asset &&
				`<enclosure url="${urlFor(post.metadata.image).format('jpg').width(1200).url()}" length="0" type="image/jpeg" />`,
			post.content &&
				`<content:encoded><![CDATA[${toHTML(post.content, {
					components: {
						marks: {
							code: ({ text }) => `<code>${escapeHTML(text)}</code>`,
						},
						types: {
							image: ({ value: { alt = '', figcaption, ...value } }) =>
								`<figure>${[
									value?.asset ? `<img src="${urlFor(value).url()}" alt="${escapeHTML(alt)}" />` : '',
									figcaption &&
										`<figcaption>${escapeHTML(getBlockText(figcaption))}</figcaption>`,
								]
									.filter(Boolean)
									.join('')}</figure>`,
							code: ({ value: { code } }) =>
								code && `<pre><code>${code}</code></pre>`,
							'custom-html': ({ value: { html } }) => html?.code,
						},
					},
				})}]]></content:encoded>`,
		]
			.filter(Boolean)
			.join('')}
	</item>`
}

const BLOG_RSS_QUERY = groq`{
	'blog': *[_type == 'blog-settings'][0]{
		'metadata': {
			'title': title,
			'description': subtitle
		}
	},
	'posts': *[_type == 'blog.post' && metadata.noIndex != true]|order(publishDate desc){
		title,
		excerpt,
		content,
		publishDate,
		categories[]->{ title },
		author->{ name },
		metadata
	}
}`
