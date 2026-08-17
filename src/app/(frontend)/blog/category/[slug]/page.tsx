import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Tag } from 'lucide-react'
import { ROUTES } from '@/lib/env'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { sanityFetchLive } from '@/sanity/lib/live'
import { getBlogCategory, getBlogSettings } from '@/sanity/lib/queries'
import type { BlogPost } from '@/sanity/types'
import BreadcrumbsComponent from '@/ui/modules/breadcrumbs'
import PostPreview from '@/ui/modules/blog/post-preview'

type Props = {
	params: Promise<{ slug: string }>
}

export default async function BlogCategoryPage({ params }: Props) {
	const { slug } = await params
	const [category, blogSettings] = await Promise.all([
		getBlogCategory(slug),
		getBlogSettings(),
	])

	if (!category) notFound()

	const posts: BlogPost[] = category.posts || []

	return (
		<div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 pb-20">
			<BreadcrumbsComponent
				_type="breadcrumbs"
				crumbs={
					[
						{ _key: 'home', _type: 'link', label: 'Home', type: 'external', external: '/' },
						{ _key: 'blog', _type: 'link', label: 'Blog', type: 'external', external: `/${ROUTES.blog}` },
						{ _key: 'category', _type: 'link', label: category.title || 'Category', type: 'external', external: `/${ROUTES.blog}/category/${slug}` },
					] as any
				}
			/>

			{/* Category Hero Header */}
			<header className="section !py-8 sm:!py-12 border-b border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900">
				<div className="mx-auto max-w-4xl text-center space-y-4">
					<Link
						href={`/${ROUTES.blog}`}
						className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
					>
						<ArrowLeft className="size-3.5" /> Back to All Articles
					</Link>

					<div className="flex items-center justify-center gap-2">
						<Tag className="size-5 text-blue-600 dark:text-blue-400" />
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
							{category.title}
						</h1>
					</div>

					{category.description && (
						<p className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
							{category.description}
						</p>
					)}

					<div className="pt-2">
						<span className="inline-flex items-center rounded-full bg-zinc-100 px-3.5 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
							{posts.length} {posts.length === 1 ? 'Article' : 'Articles'}
						</span>
					</div>
				</div>
			</header>

			{/* Posts Grid */}
			<main className="section pt-10">
				{posts.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
						<p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
							No articles published under this category yet.
						</p>
						<Link
							href={`/${ROUTES.blog}`}
							className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 min-h-[44px]"
						>
							Explore Other Articles
						</Link>
					</div>
				) : (
					<ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
						{posts.map((post) => (
							<PostPreview
								key={post._id}
								post={post}
								cardSettings={blogSettings}
								className="anim-fade"
							/>
						))}
					</ul>
				)}
			</main>
		</div>
	)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const category = await getBlogCategory(slug)
	if (!category) return {}

	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
	const canonicalUrl = `${baseUrl}/${ROUTES.blog}/category/${slug}`
	const title =
		category.metadata?.title || `${category.title} - Articles & Guides`
	const description =
		category.metadata?.description ||
		category.description ||
		`Explore all articles and curated guides about ${category.title}.`
	let ogImage = `${baseUrl}/api/og?slug=${ROUTES.blog}/category/${slug}`
	if (category.image?.asset) {
		try {
			ogImage = urlFor(category.image).width(1200).height(630).url()
		} catch {
			ogImage = `${baseUrl}/api/og?slug=${ROUTES.blog}/category/${slug}`
		}
	}

	return {
		title,
		description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			title,
			description,
			url: canonicalUrl,
			images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [ogImage],
		},
		robots: {
			index: !category.metadata?.noIndex,
			follow: !category.metadata?.noIndex,
		},
	}
}

export async function generateStaticParams() {
	return await client.fetch<{ slug: string }[]>(
		groq`*[_type == 'blog.category' && defined(slug.current)]{
			'slug': slug.current
		}`,
	)
}
