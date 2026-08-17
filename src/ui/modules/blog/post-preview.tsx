import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { ROUTES } from '@/lib/env'
import { cn } from '@/lib/utils'
import type { BlogCategory, BlogPost, Person } from '@/sanity/types'
import Img from '@/ui/img'
import Byline from './byline'
import DateComponent from './date'
import ReadTime from './read-time'

export interface BlogCardSettings {
	defaultLayout?: 'magazine' | 'grid' | 'list' | string
	cardStyle?: 'boxed' | 'minimalist' | string
	cardImageAspectRatio?: '16:9' | '3:2' | '4:3' | '1:1' | string
	cardShowCategory?: boolean
	cardShowExcerpt?: boolean
	cardShowAuthor?: boolean
	cardShowDate?: boolean
	cardShowReadTime?: boolean
}

export default function PostPreview({
	post,
	cardSettings,
	layout = 'grid',
	as: Component = 'li',
	className,
	...props
}: {
	post: BlogPost & any
	cardSettings?: BlogCardSettings
	layout?: 'grid' | 'list'
	as?: 'li' | 'article' | 'div'
} & React.HTMLAttributes<HTMLElement>) {
	if (!post) return null

	const {
		cardStyle = 'boxed',
		cardImageAspectRatio = '16:9',
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

	const aspectClass =
		cardImageAspectRatio === '3:2'
			? 'aspect-3/2'
			: cardImageAspectRatio === '4:3'
				? 'aspect-4/3'
				: cardImageAspectRatio === '1:1'
					? 'aspect-square'
					: 'aspect-16/9'

	const hasFooter =
		(cardShowAuthor && Boolean(post.author)) ||
		cardShowDate ||
		cardShowReadTime

	// 1. EDITORIAL LIST LAYOUT (1 Column Wide Card)
	if (layout === 'list') {
		return (
			<Component
				className={cn(
					'group relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7 transition-all duration-300',
					isMinimalist
						? 'bg-transparent p-0 pb-6 sm:pb-8 border-b border-zinc-200/70 dark:border-zinc-800 last:border-b-0'
						: 'overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900',
					className,
				)}
				{...props}
			>
				{/* Image */}
				<figure
					className={cn(
						'relative w-full sm:w-72 sm:shrink-0 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800',
						aspectClass,
					)}
				>
					{post.metadata?.image ? (
						<Img
							className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
							image={post.metadata.image}
							width={500}
							height={280}
							alt={post.title ?? 'Article thumbnail'}
						/>
					) : (
						<Image
							src={`/api/og?slug=${ROUTES.blog}/${slug}&invert=1`}
							className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
							alt={post.title ?? 'Article thumbnail'}
							width={500}
							height={280}
							unoptimized
						/>
					)}

					{cardShowCategory && primaryCategory?.title && (
						<span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-zinc-900 shadow-xs backdrop-blur-xs dark:bg-zinc-900/95 dark:text-zinc-100">
							{primaryCategory.title}
						</span>
					)}
				</figure>

				{/* Content */}
				<div className="flex flex-1 flex-col justify-between space-y-3">
					<div className="space-y-2">
						{/* Headline */}
						<h3 className="font-bold text-lg sm:text-xl text-zinc-900 line-clamp-2 leading-snug dark:text-zinc-50 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
							<Link href={postUrl}>
								<span className="absolute inset-0 z-10" />
								{post.title}
							</Link>
						</h3>

						{/* Excerpt */}
						{cardShowExcerpt &&
							(post.excerpt || post.metadata?.description) && (
								<p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
									{post.excerpt || post.metadata?.description}
								</p>
							)}
					</div>

					{/* Footer */}
					{hasFooter && (
						<div
							className={cn(
								'relative z-20 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400',
								isMinimalist
									? 'pt-1.5'
									: 'pt-3 border-t border-zinc-100 dark:border-zinc-800',
							)}
						>
							{cardShowAuthor && post.author ? (
								<Byline
									author={post.author as unknown as Person}
									className="truncate font-medium text-zinc-700 dark:text-zinc-300 max-w-[55%]"
								/>
							) : cardShowDate && post.publishDate ? (
								<DateComponent date={post.publishDate} />
							) : (
								<span />
							)}

							<div className="flex items-center gap-1.5 shrink-0">
								{cardShowAuthor && cardShowDate && !post.author && (
									<DateComponent date={post.publishDate} />
								)}
								{cardShowReadTime && (
									<div className="inline-flex items-center gap-1">
										<Clock className="size-3 text-zinc-500 dark:text-zinc-400" />
										<ReadTime value={post.readTime || 3} />
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</Component>
		)
	}

	// 2. STANDARD GRID / MAGAZINE CARD LAYOUT
	return (
		<Component
			className={cn(
				'group relative flex flex-col justify-between transition-all duration-300',
				isMinimalist
					? 'bg-transparent p-0 border-0 shadow-none'
					: 'overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900',
				className,
			)}
			{...props}
		>
			<div className="space-y-3">
				{/* 1. Image Container with Aspect Ratio & Category Badge */}
				<figure
					className={cn(
						'relative w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800',
						aspectClass,
					)}
				>
					{post.metadata?.image ? (
						<Img
							className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
							image={post.metadata.image}
							width={500}
							height={280}
							alt={post.title ?? 'Article thumbnail'}
						/>
					) : (
						<Image
							src={`/api/og?slug=${ROUTES.blog}/${slug}&invert=1`}
							className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
							alt={post.title ?? 'Article thumbnail'}
							width={500}
							height={280}
							unoptimized
						/>
					)}

					{/* Category Badge */}
					{cardShowCategory && primaryCategory?.title && (
						<span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-zinc-900 shadow-xs backdrop-blur-xs dark:bg-zinc-900/95 dark:text-zinc-100">
							{primaryCategory.title}
						</span>
					)}
				</figure>

				{/* 2. Headline */}
				<h3 className="font-bold text-base sm:text-lg text-zinc-900 line-clamp-2 leading-snug dark:text-zinc-50 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
					<Link href={postUrl}>
						<span className="absolute inset-0 z-10" />
						{post.title}
					</Link>
				</h3>

				{/* 3. Excerpt */}
				{cardShowExcerpt && (post.excerpt || post.metadata?.description) && (
					<p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
						{post.excerpt || post.metadata?.description}
					</p>
				)}
			</div>

			{/* 4. Footer */}
			{hasFooter && (
				<div
					className={cn(
						'relative z-20 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400',
						isMinimalist
							? 'pt-3 mt-1.5'
							: 'pt-3.5 mt-3 border-t border-zinc-100 dark:border-zinc-800',
					)}
				>
					{cardShowAuthor && post.author ? (
						<Byline
							author={post.author as unknown as Person}
							className="truncate font-medium text-zinc-700 dark:text-zinc-300 max-w-[55%]"
						/>
					) : cardShowDate && post.publishDate ? (
						<DateComponent date={post.publishDate} />
					) : (
						<span />
					)}

					<div className="flex items-center gap-1.5 shrink-0">
						{cardShowAuthor && cardShowDate && !post.author && (
							<DateComponent date={post.publishDate} />
						)}
						{cardShowReadTime && (
							<div className="inline-flex items-center gap-1">
								<Clock className="size-3 text-zinc-500 dark:text-zinc-400" />
								<ReadTime value={post.readTime || 3} />
							</div>
						)}
					</div>
				</div>
			)}
		</Component>
	)
}
