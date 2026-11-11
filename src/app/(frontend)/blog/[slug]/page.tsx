import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ROUTES } from '@/lib/env'
import { enrichProductsWithD1Reviews } from '@/lib/reviews'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'
import { PRODUCT_CARD_FIELDS } from '@/sanity/lib/product-card-query'
import {
	getBlogSettings,
	getProductSettings,
	LINK_QUERY,
	MODULES_QUERY,
} from '@/sanity/lib/queries'
import type { BLOG_POST_QUERY_RESULT } from '@/sanity/types'
import ModulesResolver from '@/ui/modules'
import BlogPostContent from '@/ui/modules/blog/blog-post-content'
import Breadcrumbs from '@/ui/modules/breadcrumbs'

export const dynamic = 'force-dynamic'

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

	const globalBefore = (post as any).globalBefore || []
	const customModules = (post as any).customModules || []
	const globalAfter = (post as any).globalAfter || []

	const bottomModules = [...customModules, ...globalAfter]

	return (
		<>
			<Breadcrumbs currentPage={post} />

			{globalBefore.length > 0 && (
				<ModulesResolver
					modules={globalBefore}
					productSettings={productSettings}
					blogSettings={blogSettings}
				/>
			)}

			<BlogPostContent
				post={post}
				productSettings={productSettings}
				blogSettings={blogSettings}
			/>

			{bottomModules.length > 0 && (
				<div className="mt-12">
					<ModulesResolver
						modules={bottomModules}
						productSettings={productSettings}
						blogSettings={blogSettings}
					/>
				</div>
			)}
		</>
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
	if (post && Array.isArray((post as any).relatedProducts)) {
		return {
			...post,
			relatedProducts: await enrichProductsWithD1Reviews(
				(post as any).relatedProducts,
			),
		}
	}
	return post
}

const BLOG_POST_QUERY = groq`*[_type == 'blog.post' && metadata.slug.current == $slug][0]{
	...,
	excerpt,
	keyTakeaways,
	isFeatured,
	lastUpdatedDate,
	factCheckedDate,
	ftcDisclosure,
	customFtcDisclosure,
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
				hasVariants,
				inStock,
				stock,
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
		},
		_type == 'cta-banner' => {
			...,
			buttonLink{ ${LINK_QUERY} }
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
	reviewedBy->{
		name,
		role,
		shortBio,
		image{
			...,
			asset->
		}
	},
	relatedProducts[]->{
${PRODUCT_CARD_FIELDS}
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
