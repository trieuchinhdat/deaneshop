import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Clock, Sparkles } from 'lucide-react'
import { ROUTES } from '@/lib/env'
import { cn } from '@/lib/utils'
import type { BlogCategory, BlogPost, Person } from '@/sanity/types'
import Img from '@/ui/img'
import Byline from './byline'
import DateComponent from './date'
import ReadTime from './read-time'
import type { BlogCardSettings } from './post-preview'

export default function PostPreviewLarge({
	post,
	cardSettings,
	headingLevel = 'h2',
	priority = false,
	className,
}: {
	post: BlogPost & any
	cardSettings?: BlogCardSettings
	headingLevel?: 'h2' | 'h3' | 'h4'
	priority?: boolean
	className?: string
} & React.ComponentProps<'article'>) {
	if (!post) return null

	const {
		cardStyle = 'boxed',
		cardShowCategory = true,
		cardShowCategoryCount = false,
		cardShowExcerpt = true,
		cardShowAuthor = true,
		cardShowDate = true,
		cardShowReadTime = true,
	} = cardSettings || {}

	const isMinimalist = cardStyle === 'minimalist'

	const slug =
		post.metadata?.slug?.current ||
		post.slug?.replace(`/${ROUTES.blog}/`, '') ||
		post._id
	const postUrl = `/${ROUTES.blog}/${slug}`
	const primaryCategory = post.categories?.[0] as
		| (BlogCategory & { postCount?: number })
		| undefined
	const HeadingTag = headingLevel

	return (
		<article
			className={cn(
				'group relative transition-all duration-300 rounded-3xl',
				'focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2',
				isMinimalist
					? 'bg-transparent p-0 border-0 shadow-none'
					: 'overflow-hidden border border-zinc-200/80 bg-white p-5 sm:p-8 lg:p-10 shadow-xs hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900',
				className,
			)}
		>
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
				{/* Image Column (7 cols) */}
				<figure className="relative aspect-[16/10] sm:aspect-16/9 lg:aspect-[16/10] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 lg:col-span-7">
					{post.metadata?.image ? (
						<Img
							className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
							image={post.metadata.image}
							width={800}
							height={500}
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 800px)"
							priority={priority}
							loading={priority ? 'eager' : 'lazy'}
							alt={post.title ?? 'Featured article'}
						/>
					) : (
						<Image
							src={`/api/og?slug=${ROUTES.blog}/${slug}&invert=1`}
							className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
							alt={post.title ?? 'Featured article'}
							width={800}
							height={500}
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 800px)"
							priority={priority}
							loading={priority ? 'eager' : 'lazy'}
						/>
					)}

					{/* Badge Overlay */}
					<div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-wrap gap-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/90 px-3 py-1 text-xs font-bold tracking-wide uppercase text-white backdrop-blur-xs shadow-xs dark:bg-white/90 dark:text-zinc-900">
							<Sparkles className="size-3 text-amber-400 fill-amber-400" />
							Featured Story
						</span>
						{cardShowCategory && primaryCategory?.title && (
							<span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-900 backdrop-blur-xs shadow-xs dark:bg-zinc-900/90 dark:text-zinc-100">
								{primaryCategory.title}
								{cardShowCategoryCount && typeof primaryCategory.postCount === 'number' && (
									<span className="ml-1 opacity-75 font-normal">({primaryCategory.postCount})</span>
								)}
							</span>
						)}
					</div>
				</figure>

				{/* Content Column (5 cols) */}
				<div className="flex flex-col justify-center space-y-4 sm:space-y-5 lg:col-span-5">
					{/* Meta line */}
					{(cardShowDate || cardShowReadTime) && (
						<div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
							{cardShowDate && <DateComponent date={post.publishDate} />}
							{cardShowDate && cardShowReadTime && <span>•</span>}
							{cardShowReadTime && (
								<div className="inline-flex items-center gap-1">
									<Clock className="size-3" />
									<ReadTime value={post.readTime || 4} />
								</div>
							)}
						</div>
					)}

					{/* Title */}
					<HeadingTag className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight transition-colors group-hover:text-primary dark:group-hover:text-primary">
						<Link href={postUrl} className="focus:outline-none focus-visible:underline">
							<span className="absolute inset-0 z-10" />
							{post.title}
						</Link>
					</HeadingTag>

					{/* Excerpt */}
					{cardShowExcerpt && (post.excerpt || post.metadata?.description) && (
						<p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
							{post.excerpt || post.metadata?.description}
						</p>
					)}

					{/* Author and CTA */}
					<div
						className={cn(
							'relative z-20 flex flex-wrap items-center justify-between gap-4 pt-3 sm:pt-4',
							isMinimalist
								? 'border-t-0'
								: 'border-t border-zinc-100 dark:border-zinc-800',
						)}
					>
						{cardShowAuthor && post.author ? (
							<Byline
								author={post.author as unknown as Person}
								className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200"
							/>
						) : (
							<span />
						)}

						<span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-primary dark:group-hover:text-primary group-hover:translate-x-1 transition-all">
							Read Article <ArrowRight className="size-4" />
						</span>
					</div>
				</div>
			</div>
		</article>
	)
}
