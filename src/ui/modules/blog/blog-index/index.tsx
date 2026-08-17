import { groq, PortableText } from 'next-sanity'
import { Suspense } from 'react'
import { ROUTES } from '@/lib/env'
import { cn } from '@/lib/utils'
import { sanityFetchLive } from '@/sanity/lib/live'
import { getBlogSettings } from '@/sanity/lib/queries'
import type { BlogIndex } from '@/sanity/types'
import Loading from '@/ui/loading'
import FilterList from '@/ui/modules/blog/filter-list'
import NewsletterBox from '@/ui/modules/blog/newsletter-box'
import PaginatedPosts from './paginated-posts'
import SearchBar from './search-bar'
import Skeleton from './skeleton'
import SortBy from './sort-by'

export default async function BlogIndexModule({
	intro,
	postsPerPage = 9,
}: BlogIndex) {
	const [data, blogSettings] = await Promise.all([
		sanityFetchLive<any>({
			query: BLOG_INDEX_QUERY,
			params: { blogDir: `/${ROUTES.blog}/` },
		}),
		getBlogSettings(),
	])

	const effectivePostsPerPage =
		blogSettings?.postsPerPage || postsPerPage || 9

	return (
		<section className="section space-y-10 py-6 sm:py-10">
			{/* Editorial Header / Hero */}
			{intro && intro.length > 0 ? (
				<header className="prose max-w-3xl">
					<PortableText value={intro} />
				</header>
			) : (
				<header className="space-y-3 max-w-3xl">
					{blogSettings?.badgeText && (
						<span className="inline-block rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white dark:bg-white dark:text-zinc-900">
							{blogSettings.badgeText}
						</span>
					)}
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
						{blogSettings?.title || 'Editorial & Journal'}
					</h1>
					<p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
						{blogSettings?.subtitle ||
							'Insights, stories, and curated guides from our team of specialists.'}
					</p>
				</header>
			)}

			{/* Filter, Search & Sort Toolbar */}
			<div className="space-y-4">
				<fieldset className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-zinc-200/80 py-4 dark:border-zinc-800">
					<Suspense
						fallback={
							<Loading className="p-[.25em_.5em]">
								Loading topics...
							</Loading>
						}
					>
						<FilterList />
					</Suspense>

					<Suspense fallback={<div className="h-9 w-40" />}>
						<div className="flex flex-wrap items-center gap-3">
							{blogSettings?.enableSearch !== false && <SearchBar />}
							<SortBy />
						</div>
					</Suspense>
				</fieldset>

				{/* Posts Grid / List & Featured Article */}
				<Suspense
					fallback={<Skeleton postsPerPage={effectivePostsPerPage} />}
				>
					<PaginatedPosts
						posts={data || []}
						postsPerPage={effectivePostsPerPage}
						cardSettings={blogSettings}
					/>
				</Suspense>
			</div>

			{/* Lead Capture Newsletter Box */}
			{blogSettings?.enableNewsletter !== false && (
				<NewsletterBox
					title={blogSettings?.newsletterTitle}
					subtitle={blogSettings?.newsletterSubtitle}
				/>
			)}
		</section>
	)
}

const BLOG_INDEX_QUERY = groq`
	*[_type == 'blog.post' && metadata.noIndex != true]|order(publishDate desc){
		...,
		excerpt,
		isFeatured,
		lastUpdatedDate,
		tags,
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
		'slug': $blogDir + metadata.slug.current,
	}
`
