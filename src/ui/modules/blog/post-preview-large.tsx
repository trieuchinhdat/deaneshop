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
	className,
}: {
	post: BlogPost & any
	cardSettings?: BlogCardSettings
} & React.ComponentProps<'article'>) {
	if (!post) return null

	const {
		cardStyle = 'boxed',
		cardShowCategory = true,
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
	const primaryCategory = post.categories?.[0] as BlogCategory | undefined

	return (
		<article
			className={cn(
				'group relative transition-all duration-300',
				isMinimalist
					? 'bg-transparent p-0 border-0 shadow-none'
					: 'overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 lg:p-10 shadow-xs hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900',
				className,
			)}
		>
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
				{/* Image Column (7 cols) */}
				<figure className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 lg:col-span-7">
					{post.metadata?.image ? (
						<Img
							className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
							image={post.metadata.image}
							width={800}
							height={500}
							alt={post.title ?? 'Featured article'}
						/>
					) : (
						<Image
							src={`/api/og?slug=${ROUTES.blog}/${slug}&invert=1`}
							className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
							alt={post.title ?? 'Featured article'}
							width={800}
							height={500}
							unoptimized
						/>
					)}

					{/* Badge Overlay */}
					<div className="absolute top-4 left-4 flex flex-wrap gap-2">
						<span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/90 px-3 py-1 text-xs font-bold tracking-wide uppercase text-white backdrop-blur-xs shadow-xs dark:bg-white/90 dark:text-zinc-900">
							<Sparkles className="size-3 text-amber-400 fill-amber-400" />
							Featured Story
						</span>
						{cardShowCategory && primaryCategory?.title && (
							<span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-900 backdrop-blur-xs shadow-xs dark:bg-zinc-900/90 dark:text-zinc-100">
								{primaryCategory.title}
							</span>
						)}
					</div>
				</figure>

				{/* Content Column (5 cols) */}
				<div className="flex flex-col justify-center space-y-5 lg:col-span-5">
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
					<h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
						<Link href={postUrl}>
							<span className="absolute inset-0 z-10" />
							{post.title}
						</Link>
					</h2>

					{/* Excerpt */}
					{cardShowExcerpt && (post.excerpt || post.metadata?.description) && (
						<p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
							{post.excerpt || post.metadata?.description}
						</p>
					)}

					{/* Author and CTA */}
					<div
						className={cn(
							'relative z-20 flex flex-wrap items-center justify-between gap-4 pt-4',
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

						<span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:translate-x-1 transition-transform">
							Read Article <ArrowRight className="size-4" />
						</span>
					</div>
				</div>
			</div>
		</article>
	)
}
