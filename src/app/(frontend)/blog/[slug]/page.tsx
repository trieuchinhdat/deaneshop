import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ROUTES } from '@/lib/env'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'
import { MODULES_QUERY, getProductSettings, getBlogSettings } from '@/sanity/lib/queries'
import type { BLOG_POST_QUERY_RESULT } from '@/sanity/types'
import ModulesResolver from '@/ui/modules'

type Props = {
	params: Promise<{ slug: string }>
}

export default async function BlogPage({ params }: Props) {
	const { slug } = await params
	const [post, productSettings, blogSettings] = await Promise.all([
		getPost(slug),
		getProductSettings(),
		getBlogSettings(),
	])
	if (!post) notFound()

	return (
		<ModulesResolver
			post={post}
			productSettings={productSettings}
			blogSettings={blogSettings}
		/>
	)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const post = await getPost(slug)
	if (!post) return {}

	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
	const canonicalUrl = `${baseUrl}/${ROUTES.blog}/${slug}`
	const title = post.metadata?.title || post.title || 'Blog Post'
	const description = post.metadata?.description || (post as any).excerpt || ''
	const noIndex = post.metadata?.noIndex ?? false
	let ogImage = `${baseUrl}/api/og?slug=${ROUTES.blog}/${slug}`
	if (post.metadata?.image?.asset) {
		try {
			ogImage = urlFor(post.metadata.image).width(1200).height(630).url()
		} catch {
			ogImage = `${baseUrl}/api/og?slug=${ROUTES.blog}/${slug}`
		}
	}

	return {
		title,
		description,
		alternates: {
			canonical: canonicalUrl,
			types: {
				'application/rss+xml': `/${ROUTES.blog}/rss.xml`,
			},
		},
		openGraph: {
			type: 'article',
			title,
			description,
			url: canonicalUrl,
			publishedTime: post.publishDate || (post as any)._createdAt,
			modifiedTime: (post as any).lastUpdatedDate || (post as any)._updatedAt,
			authors: post.author?.name ? [post.author.name] : undefined,
			tags: (post as any).tags || post.categories?.map((c: any) => c.title),
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [ogImage],
		},
		robots: {
			index: !noIndex,
			follow: !noIndex,
		},
	}
}

export async function generateStaticParams() {
	return await client.fetch<{ slug: string }[]>(
		groq`*[_type == 'blog.post' && defined(metadata.slug.current)]{
			'slug': metadata.slug.current
		}`,
	)
}

async function getPost(slug: string) {
	const post = await sanityFetchLive<BLOG_POST_QUERY_RESULT>({
		query: BLOG_POST_QUERY,
		params: { slug, blogDir: `${ROUTES.blog}/` },
	})

	if (!post) return null

	const globalBefore = (post as any).globalBefore || []
	const customModules = (post as any).customModules || []
	const globalAfter = (post as any).globalAfter || []

	const hasBreadcrumbs = [...globalBefore, ...customModules, ...globalAfter].some(
		(m: any) => m?._type === 'breadcrumbs',
	)

	const hasBlogPostContent = [...globalBefore, ...customModules, ...globalAfter].some(
		(m: any) => m?._type === 'blog-post-content',
	)

	let finalCustomModules = [...customModules]

	if (!hasBlogPostContent) {
		finalCustomModules.unshift({
			_type: 'blog-post-content',
			_key: `${post._id}-default-content`,
		})
	}

	if (!hasBreadcrumbs) {
		finalCustomModules.unshift({
			_type: 'breadcrumbs',
			_key: `${post._id}-default-breadcrumbs`,
		})
	}

	;(post as any).modules = [...globalBefore, ...finalCustomModules, ...globalAfter] as any

	return post
}

const BLOG_POST_QUERY = groq`*[_type == 'blog.post' && metadata.slug.current == $slug][0]{
	...,
	excerpt,
	isFeatured,
	lastUpdatedDate,
	tags,
	content[]{
		...,
		_type == 'image' => {
			...,
			asset->
		},
		_type == 'affiliateLink' => {
			...,
			affiliateRef->{
				_id,
				title,
				merchant,
				url,
				price,
				originalPrice,
				couponCode,
				rating,
				ratingCount,
				badge,
				highlights,
				description,
				image{
					...,
					asset->
				}
			}
		},
		_type == 'product-embed' => {
			...,
			product->{
				_id,
				title,
				price,
				salePrice,
				images[]{
					...,
					asset->
				},
				metadata
			}
		},
		_type == 'image-gallery' => {
			...,
			images[]{
				...,
				asset->
			}
		}
	},
	'contentPlainText': pt::text(content),
	'readTime': length(string::split(pt::text(content), ' ')) / 200,
	'headings': content[style in ['h2', 'h3', 'h4', 'h5', 'h6']]{
		style,
		'text': pt::text(@)
	},
	categories[]->{
		title,
		slug
	},
	author->{
		name,
		role,
		shortBio,
		socialLinks,
		image{
			...,
			asset->
		}
	},
	relatedProducts[]->{
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
	relatedPosts[]->{
		_id,
		title,
		publishDate,
		excerpt,
		'readTime': length(string::split(pt::text(content), ' ')) / 200,
		metadata{
			...,
			image{
				...,
				asset->
			}
		}
	},
	'categoryRelatedPosts': *[
		_type == 'blog.post'
		&& references(^.categories[0]._id)
		&& _id != ^._id
	][0...3]{
		_id,
		title,
		publishDate,
		excerpt,
		'readTime': length(string::split(pt::text(content), ' ')) / 200,
		metadata{
			...,
			image{
				...,
				asset->
			}
		}
	},
	'latestPosts': *[
		_type == 'blog.post'
		&& _id != ^._id
		&& metadata.noIndex != true
	] | order(publishDate desc)[0...6]{
		_id,
		title,
		publishDate,
		excerpt,
		'readTime': length(string::split(pt::text(content), ' ')) / 200,
		metadata{
			...,
			image{
				...,
				asset->
			}
		}
	},
	'comments': *[_type == 'blog.comment' && post._ref == ^._id && isApproved == true] | order(createdAt asc){
		_id,
		authorName,
		content,
		isAuthorReply,
		createdAt,
		'parentId': parentComment._ref
	},
	'globalBefore': (
		*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
		+ *[_type == 'global-module' && path == $blogDir].before[]{ ${MODULES_QUERY} }
	),
	'customModules': coalesce(modules, [])[]{ ${MODULES_QUERY} },
	'globalAfter': (
		*[_type == 'global-module' && path == $blogDir].after[]{ ${MODULES_QUERY} }
		+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
	)
}`
