import type { Metadata } from 'next'
import { ROUTES } from '@/lib/env'
import { urlFor } from '@/sanity/lib/image'
import {
	getBlogSettings,
	getGlobalModules,
	getPage,
	getProductSettings,
} from '@/sanity/lib/queries'
import BlogIndex from '@/ui/modules/blog/blog-index'
import ModulesResolver from '@/ui/modules'

export async function generateMetadata(): Promise<Metadata> {
	const [blogSettings, page] = await Promise.all([
		getBlogSettings(),
		getPage(['blog']),
	])

	const meta = blogSettings?.metadata ?? page?.metadata ?? {}
	const title = meta.title || blogSettings?.title || 'Editorial & Journal'
	const description =
		meta.description ||
		blogSettings?.subtitle ||
		'Insights, stories, and curated guides from our team of specialists.'

	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
	const fullUrl = `${baseUrl}/${ROUTES.blog}`

	let ogImageUrl = `${baseUrl}/api/og?slug=${ROUTES.blog}`
	const heroImage = blogSettings?.heroBanner || meta.image
	if (heroImage?.asset) {
		try {
			ogImageUrl = urlFor(heroImage).width(1200).url()
		} catch {
			ogImageUrl = `${baseUrl}/api/og?slug=${ROUTES.blog}`
		}
	}

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: fullUrl,
			images: [ogImageUrl],
		},
		robots: {
			index: meta.noIndex ? false : undefined,
		},
		alternates: {
			types: {
				'application/rss+xml': `/${ROUTES.blog}/rss.xml`,
			},
		},
	}
}

export default async function BlogPage() {
	const [blogSettings, productSettings, globalModules, page] = await Promise.all([
		getBlogSettings(),
		getProductSettings(),
		getGlobalModules('blog'),
		getPage(['blog']),
	])

	const topModules = [
		...(globalModules?.before || []),
		...(blogSettings?.topModules || []),
	]

	// Filter out any legacy blog-index module if present in page document
	const legacyOtherModules = (page?.modules || []).filter(
		(m: any) => m?._type !== 'blog-index',
	)

	const bottomModules = [
		...(blogSettings?.bottomModules || []),
		...legacyOtherModules,
		...(globalModules?.after || []),
	]

	return (
		<main className="min-h-screen pb-16">
			{/* 1. Top CRO / Announcement Banners */}
			{topModules.length > 0 && (
				<div className="mb-6">
					<ModulesResolver
						modules={topModules}
						blogSettings={blogSettings}
						productSettings={productSettings}
					/>
				</div>
			)}

			{/* 2. Fixed Core Functional View: Blog Index */}
			<BlogIndex postsPerPage={blogSettings?.postsPerPage || 9} />

			{/* 3. Bottom CRO Modules (Lead capture, Featured products, Social proof) */}
			{bottomModules.length > 0 && (
				<div className="mt-12">
					<ModulesResolver
						modules={bottomModules}
						blogSettings={blogSettings}
						productSettings={productSettings}
					/>
				</div>
			)}
		</main>
	)
}
