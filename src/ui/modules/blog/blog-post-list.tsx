import { groq, PortableText } from 'next-sanity'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { ROUTES } from '@/lib/env'
import { cn } from '@/lib/utils'
import { sanityFetchLive } from '@/sanity/lib/live'
import { getBlogSettings } from '@/sanity/lib/queries'
import type { BlogPost, BlogPostList } from '@/sanity/types'
import ResponsiveImage from '@/ui/responsiveImage'
import { moduleAttributes } from '..'
import PostPreview from './post-preview'
import PostPreviewLarge from './post-preview-large'

const BLOG_POST_LIST_DYNAMIC_QUERY = groq`
	*[
		_type == "blog.post"
		&& metadata.noIndex != true
		&& ($featuredOnly == false || isFeatured == true)
		&& ($categoryRef == null || references($categoryRef))
	]
	| order(publishDate desc)[0...$limit] {
		_id,
		title,
		publishDate,
		excerpt,
		isFeatured,
		'readTime': length(string::split(pt::text(content), ' ')) / 200,
		categories[]->{
			_id,
			title,
			slug
		},
		author->{
			name,
			role,
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
		case 'product':
			return `/products/${slug}`
		case 'blog.post':
			return `/${ROUTES.blog}/${slug}`
		case 'collection':
			return `/collections/${slug}`
		case 'page':
			return slug === 'home' || slug === 'index' ? '/' : `/${slug}`
		default:
			return `/${slug}`
	}
}

interface BlogPostListProps extends Omit<Partial<BlogPostList>, 'layout' | 'cardStyle'> {
	_key?: string
	sourceType?: 'recent' | 'category' | 'featured' | 'manual'
	category?: any
	manualPosts?: any[]
	limit?: number
	tagline?: string
	headingLevel?: 'h2' | 'h3'
	title?: string
	subtitle?: string
	intro?: any[]
	layout?: 'grid' | 'carousel' | 'spotlight' | 'list'
	columnsDesktop?: 2 | 3 | 4
	cardStyle?: 'inherit' | 'boxed' | 'minimalist'
	containerStyle?: 'transparent' | 'muted' | 'bordered'
	showCta?: boolean
	ctaText?: string
	ctaLink?: string
	image?: any
	blogSettings?: any
}

export default async function BlogPostListModule({
	sourceType = 'recent',
	category,
	manualPosts,
	limit = 3,
	tagline,
	headingLevel = 'h2',
	title,
	subtitle,
	intro = [],
	layout = 'grid',
	columnsDesktop = 3,
	cardStyle = 'inherit',
	containerStyle = 'transparent',
	showCta = true,
	ctaText,
	ctaLink,
	image,
	blogSettings: initialBlogSettings,
	...props
}: BlogPostListProps) {
	// 1. Fetch fallback blog settings if not passed down
	const blogSettings = initialBlogSettings || (await getBlogSettings())

	// 2. Resolve Posts Data
	let posts: BlogPost[] = []

	if (sourceType === 'manual' && manualPosts && manualPosts.length > 0) {
		posts = manualPosts.filter(Boolean) as BlogPost[]
	} else {
		const categoryRef =
			category?._id ||
			category?._ref ||
			(typeof category === 'string' ? category : null)

		posts = await sanityFetchLive<BlogPost[]>({
			query: BLOG_POST_LIST_DYNAMIC_QUERY,
			params: {
				limit,
				blogDir: `/${ROUTES.blog}/`,
				categoryRef: sourceType === 'category' ? categoryRef : null,
				featuredOnly: sourceType === 'featured',
			},
		})
	}

	if (!posts || posts.length === 0) return null

	// 3. Resolve Effective Card Settings
	const effectiveCardSettings = {
		...blogSettings,
		...(cardStyle && cardStyle !== 'inherit' ? { cardStyle } : {}),
	}

	// 4. Resolve Target CTA Link and Label
	const categorySlug =
		category?.slug?.current || category?.slug || category?.metadata?.slug?.current
	const categoryTitle = category?.title || ''

	const defaultCtaUrl = categorySlug
		? `/${ROUTES.blog}/category/${categorySlug}`
		: `/${ROUTES.blog}`

	const finalCtaUrl = ctaLink || defaultCtaUrl
	const finalCtaText =
		ctaText ||
		(categoryTitle
			? `Explore all ${categoryTitle} articles`
			: 'Explore all articles')

	// 5. Resolve Banner Link
	let bannerHref: string | null = null
	if (image?.linkBannerType === 'external' && image?.external) {
		bannerHref = image.external
	} else if (image?.linkBannerType === 'internal' && image?.internalSlug) {
		bannerHref = resolveInternalLink(image.internalSlug, image.internalType)
	}

	// 6. Heading Semantic Tag
	const HeadingTag = headingLevel === 'h3' ? 'h3' : 'h2'

	// 7. Desktop Columns Class
	const gridColsClass =
		columnsDesktop === 2
			? 'lg:grid-cols-2'
			: columnsDesktop === 4
				? 'lg:grid-cols-4'
				: 'lg:grid-cols-3'

	return (
		<section className="section my-8 sm:my-14" {...moduleAttributes(props)}>
			{/* Optional Banner Image */}
			{image?.asset && (
				<div className="mb-6 overflow-hidden rounded-2xl w-full">
					{bannerHref ? (
						<Link
							href={bannerHref}
							target={image.linkBannerType === 'external' ? '_blank' : undefined}
							rel={
								image.linkBannerType === 'external'
									? 'noopener noreferrer'
									: undefined
							}
						>
							<ResponsiveImage
								className="w-full object-cover transition-transform duration-500 hover:scale-102"
								image={image}
								desktop={{ width: 1280 }}
								mobile={{ width: 390 }}
							/>
						</Link>
					) : (
						<ResponsiveImage
							className="w-full object-cover"
							image={image}
							desktop={{ width: 1280 }}
							mobile={{ width: 390 }}
						/>
					)}
				</div>
			)}

			<div
				className={cn(
					'space-y-6 sm:space-y-8',
					containerStyle === 'muted' &&
						'rounded-3xl bg-zinc-50/70 p-6 sm:p-10 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80',
					containerStyle === 'bordered' &&
						'rounded-3xl border border-zinc-200/80 p-6 sm:p-10 dark:border-zinc-800 bg-white dark:bg-zinc-950',
				)}
			>
				{/* Section Header (Mobile-First semantic header) */}
				<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-200/60 pb-5 dark:border-zinc-800">
					{intro && intro.length > 0 ? (
						<div className="prose max-w-3xl dark:prose-invert">
							<PortableText value={intro} />
						</div>
					) : (
						<div className="space-y-2 max-w-2xl">
							{tagline && (
								<div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold tracking-wider text-blue-700 uppercase dark:bg-blue-950/50 dark:text-blue-300">
									<Sparkles className="size-3.5" />
									<span>{tagline}</span>
								</div>
							)}

							{title ? (
								<HeadingTag className="text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl dark:text-zinc-50 text-balance">
									{title}
								</HeadingTag>
							) : (
								<HeadingTag className="text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
									{sourceType === 'featured'
										? 'Featured Stories & Case Studies'
										: categoryTitle
											? `${categoryTitle} Insights`
											: 'Latest Articles & Guides'}
								</HeadingTag>
							)}

							{subtitle && (
								<p className="text-sm text-zinc-600 sm:text-base dark:text-zinc-400 leading-relaxed">
									{subtitle}
								</p>
							)}
						</div>
					)}

					{/* Desktop Top Header CTA */}
					{showCta && (
						<Link
							href={finalCtaUrl}
							className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-zinc-900 transition hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400 shrink-0"
						>
							<span>{finalCtaText}</span>
							<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
						</Link>
					)}
				</header>

				{/* Presentation Layout 1: SPOTLIGHT FEATURE (1 Hero Card + Secondary Posts) */}
				{layout === 'spotlight' && (
					<div className="space-y-6">
						{/* Main Featured Hero Card */}
						{posts[0] && (
							<PostPreviewLarge
								post={posts[0]}
								cardSettings={effectiveCardSettings}
							/>
						)}

						{/* Secondary Posts Grid (Mobile: 1 col / scroll, Desktop: 2 or 3 cols) */}
						{posts.length > 1 && (
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
								{posts.slice(1).map((post) => (
									<PostPreview
										key={post._id}
										post={post}
										cardSettings={effectiveCardSettings}
										layout="grid"
										as="article"
									/>
								))}
							</div>
						)}
					</div>
				)}

				{/* Presentation Layout 2: EDITORIAL LIST (Compact horizontal rows) */}
				{layout === 'list' && (
					<div
						className={cn(
							effectiveCardSettings.cardStyle === 'minimalist'
								? 'space-y-6 sm:space-y-8'
								: 'space-y-4 sm:space-y-5',
						)}
					>
						{posts.map((post) => (
							<PostPreview
								key={post._id}
								post={post}
								cardSettings={effectiveCardSettings}
								layout="list"
								as="article"
							/>
						))}
					</div>
				)}

				{/* Presentation Layout 3: TOUCH CAROUSEL (Mobile-First Snap Scroll / Responsive) */}
				{layout === 'carousel' && (
					<div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 scrollbar-none snap-x snap-mandatory">
						{posts.map((post, idx) => (
							<div
								key={`${post._id}-${idx}`}
								className="w-72 shrink-0 snap-start sm:w-auto"
							>
								<PostPreview
									post={post}
									cardSettings={effectiveCardSettings}
									layout="grid"
									as="article"
									className="h-full"
								/>
							</div>
						))}
					</div>
				)}

				{/* Presentation Layout 4: RESPONSIVE GRID (Default) */}
				{layout === 'grid' && (
					<div
						className={cn(
							'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:gap-6',
							gridColsClass,
						)}
					>
						{posts.map((post) => (
							<PostPreview
								key={post._id}
								post={post}
								cardSettings={effectiveCardSettings}
								layout="grid"
								as="article"
								className="h-full"
							/>
						))}
					</div>
				)}

				{/* Mobile Bottom CTA (Easier to tap on touchscreens) */}
				{showCta && (
					<div className="flex justify-center pt-2 sm:hidden">
						<Link
							href={finalCtaUrl}
							className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition active:scale-98 dark:bg-zinc-100 dark:text-zinc-900"
						>
							<span>{finalCtaText}</span>
							<ArrowRight className="size-3.5" />
						</Link>
					</div>
				)}
			</div>
		</section>
	)
}
