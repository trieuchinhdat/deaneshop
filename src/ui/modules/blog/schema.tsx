import { ROUTES } from '@/lib/env'
import { urlFor } from '@/sanity/lib/image'
import type { BLOG_POST_QUERY_RESULT } from '@/sanity/types'

interface SchemaProps {
	post: BLOG_POST_QUERY_RESULT & {
		lastUpdatedDate?: string
		_updatedAt?: string
		excerpt?: string
		tags?: string[]
		author?: {
			name?: string
			role?: string
			shortBio?: string
			image?: any
			socialLinks?: Array<{ platform?: string; url?: string }>
		}
	}
	siteSettings?: {
		title?: string
		companyName?: string
		logo?: {
			image?: {
				default?: any
			}
		}
	}
}

export default function BlogPostSchema({ post, siteSettings }: SchemaProps) {
	if (!post?.metadata) return null

	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
	const slug = post.metadata.slug?.current
	const postUrl = `${baseUrl}/${ROUTES.blog}/${slug}`
	const blogHubUrl = `${baseUrl}/${ROUTES.blog}`
	const title = post.metadata.title || post.title || 'Untitled Post'
	const description = post.metadata.description || post.excerpt || ''
	const datePublished = post.publishDate || post._createdAt || new Date().toISOString()
	const dateModified = post.lastUpdatedDate || post._updatedAt || datePublished

	// 1. Primary Image URL
	const imageUrl = post.metadata.image
		? urlFor(post.metadata.image).width(1200).height(630).url()
		: `${baseUrl}/api/og?slug=${ROUTES.blog}/${slug}`

	// 2. Publisher info
	const publisherName =
		siteSettings?.companyName || siteSettings?.title || 'Ecocros'
	const publisherLogoUrl = siteSettings?.logo?.image?.default
		? urlFor(siteSettings.logo.image.default).url()
		: `${baseUrl}/favicon.ico`

	// 3. Extract FAQ Items from Content if present
	const faqBlock = post.content?.find((c: any) => c._type === 'faq-accordion') as
		| { items?: Array<{ question: string; answer: any }> }
		| undefined

	const faqQuestions =
		faqBlock?.items?.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text:
					typeof item.answer === 'string'
						? item.answer
						: item.question, // Fallback safe string
			},
		})) || []

	// 4. Primary Category
	const primaryCategory = post.categories?.[0]
	const categoryUrl = primaryCategory?.slug?.current
		? `${baseUrl}/${ROUTES.blog}/category/${primaryCategory.slug.current}`
		: blogHubUrl

	// 5. Author Schema (E-E-A-T)
	const authorSchema = post.author?.name
		? {
				'@type': 'Person',
				name: post.author.name,
				jobTitle: post.author.role || undefined,
				description: post.author.shortBio || undefined,
				image: post.author.image
					? urlFor(post.author.image).width(300).height(300).url()
					: undefined,
				sameAs: post.author.socialLinks?.map((s) => s.url).filter(Boolean) || undefined,
			}
		: {
				'@type': 'Organization',
				name: publisherName,
				url: baseUrl,
			}

	// 6. Assemble Comprehensive Schema Graph
	const schemaGraph: any[] = [
		// Article / BlogPosting Schema
		{
			'@context': 'https://schema.org',
			'@type': 'BlogPosting',
			'@id': `${postUrl}#article`,
			isPartOf: {
				'@type': 'WebSite',
				'@id': `${baseUrl}#website`,
				name: publisherName,
				url: baseUrl,
			},
			mainEntityOfPage: {
				'@type': 'WebPage',
				'@id': postUrl,
			},
			headline: title,
			description: description,
			url: postUrl,
			datePublished: datePublished,
			dateModified: dateModified,
			inLanguage: 'en-US',
			image: {
				'@type': 'ImageObject',
				url: imageUrl,
				width: 1200,
				height: 630,
			},
			keywords:
				post.tags?.join(', ') ||
				post.categories?.map((c) => c.title).join(', ') ||
				undefined,
			articleSection: primaryCategory?.title || 'Editorial',
			author: authorSchema,
			publisher: {
				'@type': 'Organization',
				'@id': `${baseUrl}#organization`,
				name: publisherName,
				url: baseUrl,
				logo: {
					'@type': 'ImageObject',
					url: publisherLogoUrl,
				},
			},
		},

		// BreadcrumbList Schema
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{
					'@type': 'ListItem',
					position: 1,
					name: 'Home',
					item: baseUrl,
				},
				{
					'@type': 'ListItem',
					position: 2,
					name: 'Blog',
					item: blogHubUrl,
				},
				...(primaryCategory
					? [
							{
								'@type': 'ListItem',
								position: 3,
								name: primaryCategory.title,
								item: categoryUrl,
							},
							{
								'@type': 'ListItem',
								position: 4,
								name: title,
								item: postUrl,
							},
						]
					: [
							{
								'@type': 'ListItem',
								position: 3,
								name: title,
								item: postUrl,
							},
						]),
			],
		},
	]

	// Append FAQPage Schema if FAQ block exists
	if (faqQuestions.length > 0) {
		schemaGraph.push({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: faqQuestions,
		})
	}

	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
		/>
	)
}
