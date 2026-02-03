import { groq, PortableText } from 'next-sanity'
import Link from 'next/link'
import { ROUTES } from '@/lib/env'
import { sanityFetchLive } from '@/sanity/lib/live'
import type { BlogPost, BlogPostList } from '@/sanity/types'
import ResponsiveImage from '@/ui/responsiveImage'
import { moduleAttributes } from '..'
import BlogPostListClient from './blog-post-list-client'

const BLOG_POST_LIST_QUERY = groq`
	*[
		_type == "blog.post"
		&& ($categoryRef == null || references($categoryRef))
	]
	| order(publishDate desc)[0...$limit] {
		...,
		categories[]->{
			title,
			slug
		},
		author->{
			name,
			image{
				...,
				asset->
			}
		},
		metadata{
			...,
			image{
				...,
				asset->
			}
		},
		"slug": $blogDir + metadata.slug.current
	}
`

const resolveInternalLink = (slug: string, type: string) => {
	switch (type) {
		case 'product': // Nếu là sản phẩm
			return `/products/${slug}`
		case 'blog.post': // Nếu là bài viết (check tên schema trong sanity của bạn)
			return `/blog/${slug}`
		case 'page': // Nếu là page thường
			return slug === 'home' || slug === 'index' ? '/' : `/${slug}`
		default: // Mặc định
			return `/${slug}`
	}
}

export default async function ({
	image,
	intro = [],
	category,
	limit = 8,
	itemsPerPage = 8,
	layout = 'grid',
	backgroundColor = '#ffffff',
	textColor = '#000000',
	...props
}: BlogPostList & { image: any; _key: string; category?: any }) {
	const posts = await sanityFetchLive<BlogPost[]>({
		query: BLOG_POST_LIST_QUERY,
		params: {
			limit,
			blogDir: `/${ROUTES.blog}/`,
			categoryRef: category?._ref ?? null,
		},
	})
	// Logic tạo href
	let bannerHref = null

	if (image?.linkBannerType === 'external' && image?.external) {
		bannerHref = image.external
	} else if (image?.linkBannerType === 'internal' && image?.internalSlug) {
		bannerHref = resolveInternalLink(image.internalSlug, image.internalType)
	}

	if (!posts?.length) return null

	return (
		<section className="section" {...moduleAttributes(props)}>
			{/* Banner */}
			{image && (
				<div className="w-full">
					{bannerHref ? (
						<Link
							href={bannerHref}
							target={image.type === 'external' ? '_blank' : undefined}
						>
							<ResponsiveImage
								className="w-full"
								image={image}
								desktop={{ width: 1280 }}
								mobile={{ width: 390 }}
							/>
						</Link>
					) : (
						<ResponsiveImage
							className="w-full"
							image={image}
							desktop={{ width: 1280 }}
							mobile={{ width: 390 }}
						/>
					)}
				</div>
			)}
			<div
				className={`relative space-y-2 p-2 lg:space-y-4 lg:p-4 ${
					image?.asset ? 'rounded-b-xl' : 'rounded-xl'
				}`}
				style={{ backgroundColor: backgroundColor, color: textColor }}
			>
				{/* Intro */}
				{intro?.length > 0 && (
					<header className="prose">
						<PortableText value={intro} />
					</header>
				)}

				{/* Swiper */}
				<BlogPostListClient
					posts={posts}
					itemsPerPage={itemsPerPage}
					layout={layout}
				/>
			</div>
		</section>
	)
}
