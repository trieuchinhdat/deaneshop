'use client'

import { usePagination } from '@/hooks/usePagination'
import { cn } from '@/lib/utils'
import type { BLOG_INDEX_QUERY_RESULT, BlogPost } from '@/sanity/types'
import PostPreview, { type BlogCardSettings } from '@/ui/modules/blog/post-preview'
import PostPreviewLarge from '@/ui/modules/blog/post-preview-large'
import { useBlogIndexStore } from './store'

export default function PaginatedPosts({
	posts,
	postsPerPage = 9,
	cardSettings,
}: {
	posts: (BLOG_INDEX_QUERY_RESULT[number] & any)[]
	postsPerPage?: number
	cardSettings?: BlogCardSettings
}) {
	const { categoryParam, sortBy, searchQuery } = useBlogIndexStore()
	const layoutMode = cardSettings?.defaultLayout || 'magazine'

	// 1. Identify Featured Post (if marked isFeatured or default first post)
	const featuredPost =
		posts?.find((p) => p.isFeatured) || posts?.[0]

	// 2. Filter posts by Category and Search query
	const filteredPosts = posts
		?.filter((post) => {
			// Category Filter
			if (categoryParam) {
				const hasCategory = post.categories?.some(
					(c: any) => c.slug?.current === categoryParam,
				)
				if (!hasCategory) return false
			}

			// Keyword Search Filter
			if (searchQuery && searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim()
				const matchTitle = post.title?.toLowerCase().includes(q)
				const matchExcerpt = post.excerpt?.toLowerCase().includes(q)
				const matchTags = post.tags?.some((t: string) =>
					t.toLowerCase().includes(q),
				)
				if (!matchTitle && !matchExcerpt && !matchTags) return false
			}

			// In magazine layout, if on page 1 without filters, exclude the featured post from the sub-grid
			if (layoutMode === 'magazine' && !categoryParam && !searchQuery && featuredPost) {
				return post._id !== featuredPost._id
			}

			return true
		})
		?.sort((a, b) => {
			if (sortBy === 'publishDate_desc')
				return (b.publishDate || '').localeCompare(a.publishDate || '')
			if (sortBy === 'publishDate_asc')
				return (a.publishDate || '').localeCompare(b.publishDate || '')
			if (sortBy === 'title_asc')
				return (a.title || '').localeCompare(b.title || '')
			if (sortBy === 'title_desc')
				return (b.title || '').localeCompare(a.title || '')
			return 0
		})

	const { paginatedItems, Pagination, currentPage } = usePagination({
		items: filteredPosts,
		itemsPerPage: postsPerPage,
	})

	const isMagazineHeroVisible =
		layoutMode === 'magazine' &&
		!categoryParam &&
		!searchQuery &&
		currentPage === 1 &&
		Boolean(featuredPost)

	return (
		<div className="space-y-10">
			{/* Featured Magazine Hero (Only when layout is 'magazine' on Page 1) */}
			{isMagazineHeroVisible && (
				<div className="space-y-8">
					<PostPreviewLarge
						post={featuredPost as unknown as BlogPost}
						cardSettings={cardSettings}
					/>
					<div className="border-t border-zinc-200 dark:border-zinc-800" />
				</div>
			)}

			{/* Empty State */}
			{paginatedItems.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
					<p className="text-base font-medium">
						No articles found matching your criteria.
					</p>
					<p className="text-xs text-zinc-400 mt-1">
						Try adjusting your search query or category filters.
					</p>
				</div>
			) : (
				/* Posts Grid / List Layout */
				<ul
					className={cn(
						layoutMode === 'list'
							? 'grid grid-cols-1 gap-5 sm:gap-6'
							: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8',
					)}
				>
					{paginatedItems?.map((post) => (
						<PostPreview
							post={post as unknown as BlogPost}
							cardSettings={cardSettings}
							layout={layoutMode === 'list' ? 'list' : 'grid'}
							className="anim-fade"
							key={post._id}
						/>
					))}
				</ul>
			)}

			{/* Pagination Controls */}
			<Pagination
				className="flex items-center justify-center gap-2 pt-6 tabular-nums"
				buttonClassName="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
			/>
		</div>
	)
}
