import pkg from '@@/package.json'
import type { Metadata } from 'next'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import { ROUTES } from '@/lib/env'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { getPage, getProductSettings } from '@/sanity/lib/queries'
import ModulesResolver from '@/ui/modules'
import PageBackground, { type PageAppearanceData } from '@/ui/page-background'
import { cn } from '@/lib/utils'

type Props = {
	params: Promise<{ slug?: string[] }>
}

export default async function Page({ params }: Props) {
	const { slug } = await params
	const [page, productSettings] = await Promise.all([
		getPage(slug),
		getProductSettings(),
	])
	if (!page) notFound()

	const appearance = (page as any)?.appearance as PageAppearanceData | undefined
	const isDarkMode = appearance?.colorScheme === 'dark'
	const headerMode = appearance?.headerMode || 'default'
	const hideFooter = Boolean(appearance?.hideFooter)

	return (
		<div
			className={cn('relative min-h-full w-full', isDarkMode && 'dark')}
			data-header-mode={headerMode}
			data-hide-footer={hideFooter ? 'true' : 'false'}
		>
			{/* SSR Zero-Flicker Style Injections for Funnel Navigation */}
			{headerMode === 'hidden' && (
				<style
					dangerouslySetInnerHTML={{
						__html: `
							#site-header { display: none !important; }
							:root { --header-height: 0px !important; }
						`,
					}}
				/>
			)}
			{headerMode === 'transparent' && (
				<style
					dangerouslySetInnerHTML={{
						__html: `
							#site-header:not([data-scrolled="true"]) {
								position: absolute !important;
								top: 0 !important;
								left: 0 !important;
								right: 0 !important;
								background-color: transparent !important;
								border-bottom-color: transparent !important;
								box-shadow: none !important;
							}
						`,
					}}
				/>
			)}
			{hideFooter && (
				<style
					dangerouslySetInnerHTML={{
						__html: `
							#site-footer { display: none !important; }
						`,
					}}
				/>
			)}

			<PageBackground appearance={appearance} />
			<ModulesResolver page={page} productSettings={productSettings} />
		</div>
	)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const page = await getPage(slug)
	const { title, description, image, noIndex } = page?.metadata ?? {}
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
	const pagePath = slug?.join('/') || ''
	const fullUrl = pagePath ? `${baseUrl}/${pagePath}` : baseUrl

	let ogImageUrl = `${baseUrl}/api/og?slug=${pagePath}`
	if (image?.asset) {
		try {
			ogImageUrl = urlFor(image).width(1200).url()
		} catch {
			ogImageUrl = `${baseUrl}/api/og?slug=${pagePath}`
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
			index: noIndex ? false : undefined,
		},
		alternates: {
			types: {
				'application/rss+xml': `/${ROUTES.blog}/rss.xml`,
			},
		},
		generator: `SanityPress v${pkg.version}`,
	}
}

export async function generateStaticParams() {
	const slugs = await client.fetch<string[]>(
		groq`
			*[
				_type == 'page'
				&& defined(metadata.slug.current)
				&& !(metadata.slug.current in ['404', 'blog', 'checkout', 'search'])
			].metadata.slug.current
		`,
	)

	return slugs.map((slug) => ({
		slug: slug === 'index' ? undefined : slug.split('/'),
	}))
}

