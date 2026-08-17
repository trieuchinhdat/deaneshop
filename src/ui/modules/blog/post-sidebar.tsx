'use client'

import Link from 'next/link'
import { BookOpen, ListTree, Clock } from 'lucide-react'
import { ROUTES } from '@/lib/env'
import { cn } from '@/lib/utils'
import type { BlogPost } from '@/sanity/types'
import Img from '@/ui/img'
import DateComponent from './date'
import ReadTime from './read-time'

interface PostSidebarProps {
	headings?: Array<{ style: string | null; text: string | null }> | null
	showToc?: boolean
	relatedPosts?: (BlogPost & { readTime?: number; excerpt?: string })[]
	className?: string
}

export default function PostSidebar({
	headings,
	showToc = false,
	relatedPosts = [],
	className,
}: PostSidebarProps) {
	const hasHeadings = showToc && headings && headings.length > 0
	const hasRelated = relatedPosts && relatedPosts.length > 0

	if (!hasHeadings && !hasRelated) return null

	return (
		<aside
			className={cn(
				'space-y-6 max-h-[calc(100vh-var(--header-height,70px)-3rem)] overflow-y-auto scrollbar-none pr-1',
				className,
			)}
		>
			{/* 1. Sidebar Table of Contents (TOC) */}
			{hasHeadings && (
				<div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-2xs">
					<div className="flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800">
						<ListTree className="size-4 text-blue-600 dark:text-blue-400" />
						<h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
							Table of Contents
						</h4>
					</div>

					<nav className="pt-3 max-h-[30vh] overflow-y-auto scrollbar-thin">
						<ol className="space-y-2 text-xs">
							{headings?.map((heading, idx) => {
								if (!heading.text) return null
								const slug = heading.text
									.toLowerCase()
									.replace(/[^a-z0-9]+/g, '-')
									.replace(/(^-|-$)+/g, '')

								const isSubheading =
									heading.style === 'h3' ||
									heading.style === 'h4'

								return (
									<li
										key={idx}
										className={cn(
											'leading-snug transition-colors hover:text-blue-600 dark:hover:text-blue-400',
											isSubheading
												? 'pl-3 text-zinc-500 dark:text-zinc-400'
												: 'font-semibold text-zinc-800 dark:text-zinc-200',
										)}
									>
										<a
											href={`#${slug}`}
											className="block py-1 truncate hover:underline"
										>
											{heading.text}
										</a>
									</li>
								)
							})}
						</ol>
					</nav>
				</div>
			)}

			{/* 2. Sidebar Related Articles List */}
			{hasRelated && (
				<div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs space-y-4">
					<div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
						<div className="flex items-center gap-2">
							<BookOpen className="size-4 text-blue-600 dark:text-blue-400" />
							<h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
								Related Articles
							</h4>
						</div>
						<Link
							href={`/${ROUTES.blog}`}
							className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
						>
							View All
						</Link>
					</div>

					<div className="divide-y divide-zinc-100 dark:divide-zinc-800">
						{Array.from(
							new Map(
								relatedPosts
									.filter(Boolean)
									.map((item) => [item._id, item]),
							).values(),
						)
							.slice(0, 4)
							.map((item, idx) => {
								const slug =
									item.metadata?.slug?.current ||
									(item as any).slug?.replace(`/${ROUTES.blog}/`, '') ||
									item._id
								const postUrl = `/${ROUTES.blog}/${slug}`

								return (
									<article
										key={`${item._id || 'sidebar-post'}-${idx}`}
										className="group flex gap-3 py-3 first:pt-0 last:pb-0 items-start"
									>
									{item.metadata?.image && (
										<figure className="relative aspect-16/9 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 mt-0.5">
											<Img
												image={item.metadata.image}
												width={200}
												height={120}
												alt={item.title ?? 'Thumbnail'}
												className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
											/>
										</figure>
									)}

									<div className="flex-1 space-y-1 min-w-0">
										<h5 className="font-bold text-xs sm:text-sm text-zinc-900 line-clamp-2 leading-snug dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
											<Link href={postUrl}>
												{item.title}
											</Link>
										</h5>
										<div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
											<DateComponent date={item.publishDate} />
											<span>•</span>
											<ReadTime value={item.readTime || 3} />
										</div>
									</div>
								</article>
							)
						})}
					</div>
				</div>
			)}
		</aside>
	)
}
