import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { ROUTES } from '@/lib/env'
import type { BlogPost } from '@/sanity/types'
import Img from '@/ui/img'
import DateComponent from './date'
import ReadTime from './read-time'

interface RelatedPostsProps {
	posts?: (BlogPost & { readTime?: number; excerpt?: string })[]
	title?: string
}

export default function RelatedPosts({
	posts = [],
	title = 'Related Articles',
}: RelatedPostsProps) {
	if (!posts || posts.length === 0) return null

	return (
		<section className="my-10 sm:my-12 border-t border-zinc-200 pt-8 sm:pt-10 dark:border-zinc-800">
			<div className="flex items-center justify-between gap-4 pb-5">
				<div className="flex items-center gap-2">
					<BookOpen className="size-4 sm:size-5 text-zinc-900 dark:text-zinc-100" />
					<h3 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
						{title}
					</h3>
				</div>
				<Link
					href={`/${ROUTES.blog}`}
					className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
				>
					View All <ArrowRight className="size-3.5" />
				</Link>
			</div>

			{/* Mobile: Horizontal Snap Scroll, Desktop: Grid */}
			<div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3 scrollbar-none">
				{Array.from(
					new Map(
						posts.filter(Boolean).map((item) => [item._id, item]),
					).values(),
				)
					.slice(0, 3)
					.map((post, idx) => {
						const slug = post.metadata?.slug?.current || post._id
						const postUrl = `/${ROUTES.blog}/${slug}`

						return (
							<article
								key={`${post._id || 'rel-post'}-${idx}`}
								className="group relative flex w-72 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:w-auto sm:p-4 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
							>
							<div className="space-y-2.5">
								<div className="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
									{post.metadata?.image && (
										<Img
											image={post.metadata.image}
											width={500}
											height={280}
											alt={post.title ?? 'Article thumbnail'}
											className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
										/>
									)}
								</div>

								<div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-300 font-medium">
									<DateComponent date={post.publishDate} />
									<span>•</span>
									<ReadTime value={post.readTime || 3} />
								</div>

								<h4 className="font-bold text-sm sm:text-base text-zinc-900 line-clamp-2 dark:text-zinc-100 group-hover:underline">
									<Link href={postUrl}>
										<span className="absolute inset-0" />
										{post.title}
									</Link>
								</h4>

								{post.excerpt && (
									<p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
										{post.excerpt}
									</p>
								)}
							</div>
						</article>
					)
				})}
			</div>
		</section>
	)
}
