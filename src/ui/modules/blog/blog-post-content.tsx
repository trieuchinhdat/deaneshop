import { PortableText } from 'next-sanity'
import { ROUTES } from '@/lib/env'
import { cn } from '@/lib/utils'
import type {
	BLOG_POST_QUERY_RESULT,
	BlogCategory,
	BlogPost,
	BlogPostContent,
	Person,
} from '@/sanity/types'
import CustomHTML from '@/ui/modules/custom-html'
import AnchoredHeading from '@/ui/modules/prose/anchored-heading'
import Code from '@/ui/modules/prose/code'
import Image from '@/ui/modules/prose/image'
import Toc from '@/ui/table-of-contents/toc'
import { moduleAttributes } from '..'
import AffiliateLink from '../affiliate-link'
import AuthorBox from './author-box'
// Custom Blocks
import CalloutBox from './blocks/callout-box'
import ComparisonTable from './blocks/comparison-table'
import CTABanner from './blocks/cta-banner'
import FAQAccordion from './blocks/faq-accordion'
import ImageGallery from './blocks/image-gallery'
import ProductEmbed from './blocks/product-embed'
import VideoEmbed from './blocks/video-embed'
import css from './blog-post-content.module.css'
import Byline from './byline'
import Categories from './categories'
import DateComponent from './date'
import PostSidebar from './post-sidebar'
import ReadTime from './read-time'
import ReadingProgress from './reading-progress'
import RelatedPosts from './related-posts'
import RelatedProducts from './related-products'
import Schema from './schema'
import SocialShare from './social-share'
import CommentsSection from './comments/comments-section'

export default function BlogPostContentComponent({
	post,
	tableOfContents,
	productSettings,
	blogSettings,
	...props
}: {
	post: BLOG_POST_QUERY_RESULT & any
	productSettings?: any
	blogSettings?: any
} & BlogPostContent) {
	if (!post) return null

	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
	const currentSlug = post.metadata?.slug?.current || ''
	const fullUrl = `${baseUrl}/${ROUTES.blog}/${currentSlug}`
	const title = post.title || post.metadata?.title || 'Untitled Post'
	const description = post.metadata?.description || post.excerpt || ''

	// 1. Resolve Effective TOC Position (Post Override -> Blog Settings -> Default)
	const rawPostToc = post.tableOfContents
	const effectiveTocPosition =
		rawPostToc && rawPostToc !== 'default'
			? rawPostToc
			: blogSettings?.defaultTocPosition || 'sticky-bar'

	// 2. Resolve Effective Desktop Sidebar Layout (Post Override -> Blog Settings -> Default)
	const rawPostSidebar = post.sidebarLayout
	const effectiveSidebar =
		rawPostSidebar && rawPostSidebar !== 'default'
			? rawPostSidebar
			: blogSettings?.postSidebarLayout ||
				(effectiveTocPosition === 'left' || effectiveTocPosition === 'right'
					? effectiveTocPosition
					: 'none')

	// 3. Resolve & Deduplicate Related Articles (filter duplicates & current post)
	const enableRelatedPosts = blogSettings?.enableRelatedPosts ?? true
	const enableRelatedProducts = blogSettings?.enableRelatedProducts ?? true
	const enableLatestPosts = blogSettings?.enableLatestPosts ?? true

	const rawRelated: any[] = enableRelatedPosts
		? (post.relatedPosts && post.relatedPosts.length > 0
				? post.relatedPosts
				: post.categoryRelatedPosts || []
			).filter((p: any) => p && p._id && p._id !== post._id)
		: []

	const relatedArticles = Array.from(
		new Map<string, any>(rawRelated.map((p: any) => [p._id, p])).values(),
	) as (BlogPost & { readTime?: number; excerpt?: string })[]

	// 4. Check if Sidebar actually has content widgets to display
	const isConfiguredSidebar = effectiveSidebar === 'left' || effectiveSidebar === 'right'
	const showSidebarToc =
		(effectiveSidebar === 'left' && effectiveTocPosition === 'left') ||
		(effectiveSidebar === 'right' && effectiveTocPosition === 'right')
	const hasSidebarHeadings = Boolean(showSidebarToc && post.headings && post.headings.length > 0)
	const hasSidebarRelated = Boolean(enableRelatedPosts && relatedArticles.length > 0)

	// True ONLY when sidebar is configured AND contains at least one non-empty widget
	const hasActiveSidebar = isConfiguredSidebar && (hasSidebarHeadings || hasSidebarRelated)

	// 5. Resolve Latest Articles (excluding current post and posts already featured in relatedArticles)
	const rawLatest: any[] = enableLatestPosts
		? ((post as any).latestPosts || []).filter(
				(p: any) =>
					p &&
					p._id &&
					p._id !== post._id &&
					!relatedArticles.some((r) => r._id === p._id),
			)
		: []

	const latestArticles = Array.from(
		new Map<string, any>(rawLatest.map((p: any) => [p._id, p])).values(),
	).slice(0, 3) as (BlogPost & { readTime?: number; excerpt?: string })[]

	return (
		<>
			{/* Top Scroll Reading Progress */}
			<ReadingProgress />

			<article {...moduleAttributes(props)} className="section">
				<div className="relative rounded-3xl bg-white py-6 lg:py-10 dark:bg-zinc-950">
					{/* Header */}
					<header className="relative border-b border-zinc-100 pb-6 text-center lg:pb-10 dark:border-zinc-900">
						<div className="relative mx-auto max-w-4xl space-y-4 px-4">
							{/* Categories */}
							{post.categories && post.categories.length > 0 && (
								<div className="flex justify-center">
									<Categories
										categories={post.categories as BlogCategory[]}
										linked
										className="inline-flex gap-2 text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400"
									/>
								</div>
							)}

							{/* Headline */}
							<h1 className="text-3xl leading-tight font-extrabold tracking-tight text-balance text-zinc-950 sm:text-4xl lg:text-5xl dark:text-zinc-50">
								{title}
							</h1>

							{/* Excerpt */}
							{post.excerpt && (
								<p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
									{post.excerpt}
								</p>
							)}

							{/* Meta line */}
							<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 text-xs font-medium text-zinc-600 sm:text-sm dark:text-zinc-300">
								<Byline author={post.author as unknown as Person} />
								<span>•</span>
								<DateComponent date={post.publishDate} />
								<span>•</span>
								<ReadTime value={post.readTime || 3} />
							</div>

							{/* Top Social Share */}
							<div className="flex justify-center pt-2">
								<SocialShare
									url={fullUrl}
									title={title}
									description={description}
								/>
							</div>
						</div>
					</header>

					{/* Floating Header TOC (Only when effectiveTocPosition is 'sticky-bar') */}
					{effectiveTocPosition === 'sticky-bar' &&
						post.headings &&
						post.headings.length > 0 && (
							<div className="px-4 pt-6 sm:px-6 lg:px-8">
								<Toc headings={post.headings} />
							</div>
						)}

					{/* Article Body + Optional Desktop Sidebar Grid */}
					<section
						className={cn(
							'px-4 pt-8 sm:px-6 lg:px-8',
							hasActiveSidebar
								? 'items-start lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-12'
								: 'mx-auto max-w-4xl',
						)}
					>
						{/* Left Sidebar on Desktop */}
						{hasActiveSidebar && effectiveSidebar === 'left' && (
							<div className="z-20 hidden transition-[top] duration-200 lg:sticky lg:top-[calc(var(--header-height,70px)+1.5rem)] lg:order-first lg:col-span-4 lg:block lg:self-start">
								<PostSidebar
									headings={post.headings}
									showToc={effectiveTocPosition === 'left'}
									relatedPosts={relatedArticles}
									relatedTitle={blogSettings?.relatedPostsTitle}
								/>
							</div>
						)}

						{/* Main Content Column */}
						<div
							className={cn(
								css.body,
								'prose prose-zinc dark:prose-invert w-full min-w-0 leading-relaxed text-zinc-800 sm:text-lg dark:text-zinc-200',
								hasActiveSidebar ? 'max-w-none lg:col-span-8' : 'mx-auto max-w-3xl',
							)}
						>
							<PortableText
								value={post.content ?? []}
								components={{
									block: {
										h1: (node) => <AnchoredHeading as="h1" {...node} />,
										h2: (node) => <AnchoredHeading as="h2" {...node} />,
										h3: (node) => <AnchoredHeading as="h3" {...node} />,
										h4: (node) => <AnchoredHeading as="h4" {...node} />,
										h5: (node) => <AnchoredHeading as="h5" {...node} />,
										h6: (node) => <AnchoredHeading as="h6" {...node} />,
									},
									types: {
										image: Image,
										code: Code,
										'custom-html': ({ value }) => (
											<CustomHTML {...value} className="my-6" />
										),
										affiliateLink: ({ value }: any) => {
											return <AffiliateLink {...value} />
										},
										'callout-box': ({ value }) => <CalloutBox {...value} />,
										'product-embed': ({ value }) => <ProductEmbed {...value} />,
										'comparison-table': ({ value }) => (
											<ComparisonTable {...value} />
										),
										'video-embed': ({ value }) => <VideoEmbed {...value} />,
										'faq-accordion': ({ value }) => <FAQAccordion {...value} />,
										'image-gallery': ({ value }) => <ImageGallery {...value} />,
										'cta-banner': ({ value }) => <CTABanner {...value} />,
									},
								}}
							/>
						</div>

						{/* Right Sidebar on Desktop */}
						{hasActiveSidebar && effectiveSidebar === 'right' && (
							<div className="z-20 hidden transition-[top] duration-200 lg:sticky lg:top-[calc(var(--header-height,70px)+1.5rem)] lg:col-span-4 lg:block lg:self-start">
								<PostSidebar
									headings={post.headings}
									showToc={effectiveTocPosition === 'right'}
									relatedPosts={relatedArticles}
									relatedTitle={blogSettings?.relatedPostsTitle}
								/>
							</div>
						)}
					</section>

					{/* Post Footer Elements */}
					<footer className="mx-auto space-y-8 px-4 pt-10 sm:px-6 lg:px-8">
						{/* Tags */}
						{post.tags && post.tags.length > 0 && (
							<div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
								<span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-400">
									Tags:
								</span>
								{post.tags.map((tag: string, idx: number) => (
									<span
										key={idx}
										className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
									>
										#{tag}
									</span>
								))}
							</div>
						)}

						{/* Bottom Social Share */}
						<div className="flex flex-wrap items-center justify-between gap-4 border-y border-zinc-200/80 py-4 dark:border-zinc-800">
							<span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
								Did you enjoy this article? Share it!
							</span>
							<SocialShare
								url={fullUrl}
								title={title}
								description={description}
							/>
						</div>

						{/* Author E-E-A-T Bio Box */}
						{post.author && <AuthorBox author={post.author} />}

						{/* Comments & Discussion Thread Engine (UI/UX Pro Max) */}
						<CommentsSection
							postId={post._id}
							comments={post.comments || []}
							enableComments={blogSettings?.enableComments !== false}
							allowComments={post.allowComments !== false}
							title={blogSettings?.commentSectionTitle}
							subtitle={blogSettings?.commentSectionSubtitle}
						/>

						{/* Related Products Showcase (reusing official ProductCard UI) */}
						{enableRelatedProducts &&
							post.relatedProducts &&
							post.relatedProducts.length > 0 && (
								<RelatedProducts
									products={post.relatedProducts}
									title={blogSettings?.relatedProductsTitle}
									productSettings={productSettings}
								/>
							)}

						{/* Related Articles (Shown at bottom when no sidebar is active, or on mobile) */}
						{enableRelatedPosts && relatedArticles.length > 0 && (
							<div className={cn(hasActiveSidebar && 'lg:hidden')}>
								<RelatedPosts
									posts={relatedArticles}
									title={blogSettings?.relatedPostsTitle}
									icon="book"
								/>
							</div>
						)}

						{/* Latest Articles (Shown below related articles) */}
						{enableLatestPosts && latestArticles.length > 0 && (
							<RelatedPosts
								posts={latestArticles}
								title={blogSettings?.latestPostsTitle || 'Latest Articles'}
								icon="sparkles"
							/>
						)}
					</footer>
				</div>
			</article>

			{/* Enterprise JSON-LD Schema */}
			<Schema post={post} />
		</>
	)
}
