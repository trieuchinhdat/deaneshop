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
import css from './blog-post-content.module.css'
import Byline from './byline'
import Categories from './categories'
import DateComponent from './date'
import ReadTime from './read-time'
import Schema from './schema'
import ReadingProgress from './reading-progress'
import SocialShare from './social-share'
import AuthorBox from './author-box'
import RelatedProducts from './related-products'
import RelatedPosts from './related-posts'
import PostSidebar from './post-sidebar'

// Custom Blocks
import CalloutBox from './blocks/callout-box'
import ProductEmbed from './blocks/product-embed'
import ComparisonTable from './blocks/comparison-table'
import VideoEmbed from './blocks/video-embed'
import FAQAccordion from './blocks/faq-accordion'
import ImageGallery from './blocks/image-gallery'
import CTABanner from './blocks/cta-banner'

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

	const hasSidebar = effectiveSidebar === 'left' || effectiveSidebar === 'right'

	// 3. Resolve & Deduplicate Related Articles (filter duplicates & current post)
	const rawRelated: any[] = (
		post.relatedPosts && post.relatedPosts.length > 0
			? post.relatedPosts
			: post.categoryRelatedPosts || []
	).filter((p: any) => p && p._id && p._id !== post._id)

	const relatedArticles = Array.from(
		new Map<string, any>(rawRelated.map((p: any) => [p._id, p])).values(),
	) as (BlogPost & { readTime?: number; excerpt?: string })[]

	return (
		<>
			{/* Top Scroll Reading Progress */}
			<ReadingProgress />

			<article {...moduleAttributes(props)} className="section">
				<div className="relative rounded-3xl bg-white py-6 lg:py-10 dark:bg-zinc-950">
					{/* Header */}
					<header className="relative pb-6 text-center lg:pb-10 border-b border-zinc-100 dark:border-zinc-900">
						<div className="relative mx-auto max-w-4xl space-y-4 px-4">
							{/* Categories */}
							{post.categories && post.categories.length > 0 && (
								<div className="flex justify-center">
									<Categories
										categories={post.categories as BlogCategory[]}
										linked
										className="inline-flex gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400"
									/>
								</div>
							)}

							{/* Headline */}
							<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 text-balance leading-tight">
								{title}
							</h1>

							{/* Excerpt */}
							{post.excerpt && (
								<p className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
									{post.excerpt}
								</p>
							)}

							{/* Meta line */}
							<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pt-2">
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
							<div className="px-4 sm:px-6 lg:px-8 pt-6">
								<Toc headings={post.headings} />
							</div>
						)}

					{/* Article Body + Optional Desktop Sidebar Grid */}
					<section
						className={cn(
							'px-4 sm:px-6 lg:px-8 pt-8',
							hasSidebar
								? 'lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-12 items-start'
								: 'mx-auto max-w-4xl',
						)}
					>
						{/* Left Sidebar on Desktop */}
						{hasSidebar && effectiveSidebar === 'left' && (
							<div className="hidden lg:block lg:col-span-4 lg:order-first lg:self-start lg:sticky lg:top-[calc(var(--header-height,70px)+1.5rem)] z-20 transition-[top] duration-200">
								<PostSidebar
									headings={post.headings}
									showToc={effectiveTocPosition === 'left'}
									relatedPosts={relatedArticles}
								/>
							</div>
						)}

						{/* Main Content Column */}
						<div
							className={cn(
								css.body,
								'prose prose-zinc dark:prose-invert w-full text-zinc-800 dark:text-zinc-200 leading-relaxed sm:text-lg min-w-0',
								hasSidebar
									? 'lg:col-span-8 max-w-none'
									: 'mx-auto max-w-3xl',
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
						{hasSidebar && effectiveSidebar === 'right' && (
							<div className="hidden lg:block lg:col-span-4 lg:self-start lg:sticky lg:top-[calc(var(--header-height,70px)+1.5rem)] z-20 transition-[top] duration-200">
								<PostSidebar
									headings={post.headings}
									showToc={effectiveTocPosition === 'right'}
									relatedPosts={relatedArticles}
								/>
							</div>
						)}
					</section>

					{/* Post Footer Elements */}
					<footer className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
						{/* Tags */}
						{post.tags && post.tags.length > 0 && (
							<div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
								<span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
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

						{/* Related Products Showcase (reusing official ProductCard UI) */}
						{post.relatedProducts && post.relatedProducts.length > 0 && (
							<RelatedProducts
								products={post.relatedProducts}
								productSettings={productSettings}
							/>
						)}

						{/* Related Articles (Shown at bottom when no sidebar is active, or on mobile) */}
						{relatedArticles.length > 0 && (
							<div className={cn(hasSidebar && 'lg:hidden')}>
								<RelatedPosts posts={relatedArticles} />
							</div>
						)}
						{relatedArticles.length > 0 && !hasSidebar && (
							<RelatedPosts posts={relatedArticles} />
						)}
					</footer>
				</div>
			</article>

			{/* Enterprise JSON-LD Schema */}
			<Schema post={post} />
		</>
	)
}
