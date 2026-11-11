import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { groq, PortableText } from 'next-sanity'
import { ROUTES } from '@/lib/env'
import { cn } from '@/lib/utils'
import { sanityFetchLive } from '@/sanity/lib/live'
import { getBlogSettings } from '@/sanity/lib/queries'
import type { BlogPost, BlogPostList } from '@/sanity/types'
import ResponsiveImage from '@/ui/responsiveImage'
import { moduleAttributes } from '..'
import BlogPostListCarousel from './blog-post-list-carousel'
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
			slug,
			"postCount": count(*[_type == "blog.post" && references(^._id) && metadata.noIndex != true])
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
		case 'blog.category':
			return `/${ROUTES.blog}/category/${slug}`
		case 'collection':
			return `/collections/${slug}`
		case 'page':
			return slug === 'home' || slug === 'index' ? '/' : `/${slug}`
		default:
			return `/${slug}`
	}
}

interface BlogPostListProps
	extends Omit<Partial<BlogPostList>, 'layout' | 'cardStyle'> {
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
	mobileLayout?: 'carousel' | 'stack' | 'grid-2'
	showNavigationArrows?: boolean
	headerAlignment?: 'left' | 'center'
	cardStyle?: 'inherit' | 'boxed' | 'minimalist'
	cardShowCategoryCount?: boolean
	cardImageAspectRatio?: 'inherit' | '16:9' | '3:2' | '4:3' | '1:1'
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
	mobileLayout = 'carousel',
	showNavigationArrows = true,
	headerAlignment = 'left',
	cardStyle = 'inherit',
	cardShowCategoryCount,
	cardImageAspectRatio = 'inherit',
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

	// 3. Fallback / Empty State Handling
	if (!posts || posts.length === 0) return null

	// 4. Resolve Effective Card Settings
	const effectiveCardSettings = {
		...blogSettings,
		...(cardStyle && cardStyle !== 'inherit' ? { cardStyle } : {}),
		...(cardImageAspectRatio && cardImageAspectRatio !== 'inherit'
			? { cardImageAspectRatio }
			: {}),
		...(typeof cardShowCategoryCount === 'boolean'
			? { cardShowCategoryCount }
			: {}),
	}

	// 5. Resolve Target CTA Link and Label
	const categorySlug =
		category?.slug?.current || category?.slug || category?.metadata?.slug?.current
	const categoryTitle = category?.title || ''
	const categoryPostCount = category?.postCount

	const defaultCtaUrl = categorySlug
		? `/${ROUTES.blog}/category/${categorySlug}`
		: `/${ROUTES.blog}`

	const finalCtaUrl = ctaLink || defaultCtaUrl
	const finalCtaText =
		ctaText ||
		(categoryTitle
			? typeof categoryPostCount === 'number' && categoryPostCount > 0
				? `Explore all ${categoryPostCount} ${categoryTitle} articles`
				: `Explore all ${categoryTitle} articles`
			: 'Explore all articles')

	// 6. Resolve Banner Link
	let bannerHref: string | null = null
	if (image?.linkBannerType === 'external' && image?.external) {
		bannerHref = image.external
	} else if (image?.linkBannerType === 'internal' && image?.internalSlug) {
		bannerHref = resolveInternalLink(image.internalSlug, image.internalType)
	}

	// 7. Heading Semantic Tags (WCAG 1.3.1 Hierarchy)
	const HeadingTag = headingLevel === 'h3' ? 'h3' : 'h2'
	const cardHeadingLevel = headingLevel === 'h3' ? 'h4' : 'h3'

	// 8. Desktop Columns Class
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
				<div className="mb-6 w-full overflow-hidden rounded-2xl">
					{bannerHref ? (
						<Link
							href={bannerHref}
							aria-label={image.alt || title || 'Featured section banner'}
							target={image.linkBannerType === 'external' ? '_blank' : undefined}
							rel={
								image.linkBannerType === 'external'
									? 'noopener noreferrer'
									: undefined
							}
							className="group/banner block"
						>
							<ResponsiveImage
								className="block w-full overflow-hidden rounded-2xl"
								imgClassName="w-full h-auto object-cover transition-transform duration-500 group-hover/banner:scale-102"
								image={image}
								desktop={{ width: 1280 }}
								mobile={{ width: 390 }}
							/>
						</Link>
					) : (
						<ResponsiveImage
							className="block w-full overflow-hidden rounded-2xl"
							imgClassName="w-full h-auto object-cover"
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
						'rounded-3xl border border-zinc-200/60 bg-zinc-50/70 p-4 sm:p-8 lg:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/40',
					containerStyle === 'bordered' &&
						'rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-8 lg:p-10 dark:border-zinc-800 dark:bg-zinc-950',
				)}
			>
				{/* Section Header */}
				<header
					className={cn(
						'flex flex-col gap-4 border-b border-zinc-200/60 pb-5 dark:border-zinc-800',
						headerAlignment === 'center'
							? 'items-center justify-center text-center'
							: 'sm:flex-row sm:items-end sm:justify-between',
					)}
				>
					{intro && intro.length > 0 ? (
						<div
							className={cn(
								'prose max-w-3xl dark:prose-invert',
								headerAlignment === 'center' && 'mx-auto text-center',
							)}
						>
							<PortableText value={intro} />
						</div>
					) : (
						<div
							className={cn(
								'space-y-2 max-w-2xl',
								headerAlignment === 'center' && 'mx-auto flex flex-col items-center',
							)}
						>
							{tagline && (
								<div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold tracking-wider text-primary uppercase shadow-2xs">
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
								<p className="text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
									{subtitle}
								</p>
							)}
						</div>
					)}

					{/* Desktop Header CTA */}
					{showCta && (
						<Link
							href={finalCtaUrl}
							className={cn(
								'group/cta hidden shrink-0 items-center gap-1.5 text-sm font-bold text-zinc-900 transition hover:text-primary sm:inline-flex dark:text-zinc-100 dark:hover:text-primary',
								headerAlignment === 'center' && 'mt-2',
							)}
						>
							<span>{finalCtaText}</span>
							<ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" />
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
								headingLevel={cardHeadingLevel}
								priority={!image?.asset}
							/>
						)}

						{/* Secondary Posts Grid */}
						{posts.length > 1 && (
							<div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
								{posts.slice(1).map((post) => (
									<PostPreview
										key={post._id}
										post={post}
										cardSettings={effectiveCardSettings}
										headingLevel={cardHeadingLevel}
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
								headingLevel={cardHeadingLevel}
								layout="list"
								as="article"
							/>
						))}
					</div>
				)}

				{/* Presentation Layout 3: TOUCH / DESKTOP CAROUSEL */}
				{layout === 'carousel' && (
					<BlogPostListCarousel
						isDesktopCarousel={true}
						isMobileCarousel={true}
						showArrows={showNavigationArrows}
						ariaLabel={title || 'Article recommendations'}
					>
						<div className="flex gap-4 sm:gap-6">
							{posts.map((post, idx) => (
								<div
									key={`${post._id}-${idx}`}
									className={cn(
										'w-[82vw] shrink-0 snap-start',
										columnsDesktop === 2 && 'sm:w-[calc(50%-0.75rem)]',
										columnsDesktop === 3 &&
											'sm:w-[340px] lg:w-[calc((100%-3rem)/3)]',
										columnsDesktop === 4 &&
											'sm:w-[280px] lg:w-[calc((100%-4.5rem)/4)]',
									)}
								>
									<PostPreview
										post={post}
										cardSettings={effectiveCardSettings}
										headingLevel={cardHeadingLevel}
										layout="grid"
										as="article"
										className="h-full"
									/>
								</div>
							))}
						</div>
					</BlogPostListCarousel>
				)}

				{/* Presentation Layout 4: RESPONSIVE GRID (With Mobile Layout Adaptability) */}
				{layout === 'grid' && (
					<>
						{/* Mobile Layout = Swipe Carousel */}
						{mobileLayout === 'carousel' ? (
							<BlogPostListCarousel
								isMobileCarousel={true}
								isDesktopCarousel={false}
								showArrows={false}
								ariaLabel={title || 'Article recommendations'}
							>
								<div
									className={cn(
										'flex gap-4 sm:grid sm:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:gap-6',
										gridColsClass,
									)}
								>
									{posts.map((post) => (
										<div
											key={post._id}
											className="w-[82vw] shrink-0 snap-start sm:w-auto"
										>
											<PostPreview
												post={post}
												cardSettings={effectiveCardSettings}
												headingLevel={cardHeadingLevel}
												layout="grid"
												as="article"
												className="h-full"
											/>
										</div>
									))}
								</div>
							</BlogPostListCarousel>
						) : mobileLayout === 'grid-2' ? (
							/* Mobile Layout = 2-Column Compact Grid */
							<div
								className={cn(
									'grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:gap-6',
									gridColsClass,
								)}
							>
								{posts.map((post) => (
									<PostPreview
										key={post._id}
										post={post}
										cardSettings={effectiveCardSettings}
										headingLevel={cardHeadingLevel}
										layout="grid"
										as="article"
										className="h-full"
									/>
								))}
							</div>
						) : (
							/* Mobile Layout = 1-Column Stack */
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
										headingLevel={cardHeadingLevel}
										layout="grid"
										as="article"
										className="h-full"
									/>
								))}
							</div>
						)}
					</>
				)}

				{/* Mobile Bottom CTA (44px min touch target) */}
				{showCta && (
					<div className="flex justify-center pt-2 sm:hidden">
						<Link
							href={finalCtaUrl}
							className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-xs font-bold text-white shadow-xs transition active:scale-98 dark:bg-zinc-100 dark:text-zinc-900"
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
