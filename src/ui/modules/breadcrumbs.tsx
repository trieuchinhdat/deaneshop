import type { ComponentProps } from 'react'
import type { Breadcrumbs, Page } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import { moduleAttributes } from '.'

export default function BreadcrumbsComponent({
	crumbs,
	currentPage,
	...props
}: Partial<Breadcrumbs> & { currentPage?: any }) {
	let effectiveCrumbs = crumbs

	if (!effectiveCrumbs || effectiveCrumbs.length === 0) {
		const generatedCrumbs: any[] = [
			{
				_key: 'home',
				label: 'Home',
				type: 'external',
				external: '/',
			},
		]

		if (currentPage) {
			const type = currentPage._type
			if (type === 'product') {
				const primaryCategory = currentPage.categories?.[0]
				if (primaryCategory?.slug) {
					const catSlug =
						typeof primaryCategory.slug === 'string'
							? primaryCategory.slug
							: primaryCategory.slug?.current
					generatedCrumbs.push({
						_key: 'category',
						label: primaryCategory.title || 'Category',
						type: 'external',
						external: `/collections/${catSlug}`,
					})
				} else {
					generatedCrumbs.push({
						_key: 'products',
						label: 'Products',
						type: 'external',
						external: '/collections/all',
					})
				}
			} else if (type === 'collection') {
				generatedCrumbs.push({
					_key: 'collections',
					label: 'Collections',
					type: 'external',
					external: '/collections/all',
				})
			} else if (type === 'blog.post') {
				const primaryCategory = currentPage.categories?.[0]
				generatedCrumbs.push({
					_key: 'blog',
					label: 'Blog',
					type: 'external',
					external: '/blog',
				})
				if (primaryCategory?.slug) {
					const catSlug =
						typeof primaryCategory.slug === 'string'
							? primaryCategory.slug
							: primaryCategory.slug?.current
					generatedCrumbs.push({
						_key: 'blog-category',
						label: primaryCategory.title || 'Category',
						type: 'external',
						external: `/blog/category/${catSlug}`,
					})
				}
			}
		}

		effectiveCrumbs = generatedCrumbs
	}

	const pageTitle = currentPage?.title || currentPage?.metadata?.title

	return (
		<nav
			aria-label="Breadcrumbs"
			className="border-b border-zinc-200/80 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-950 py-2.5"
			{...moduleAttributes(props)}
		>
			<div className="section !py-0 text-xs lg:text-sm">
				<ol
					className="flex items-center gap-x-2 text-zinc-500 dark:text-zinc-400 overflow-x-auto whitespace-nowrap min-w-0 scrollbar-none"
					itemScope
					itemType="https://schema.org/BreadcrumbList"
				>
					{effectiveCrumbs?.map((crumb, index) => {
						const isLast = !pageTitle && index === effectiveCrumbs.length - 1
						return (
							<Crumb
								link={crumb as SanityLinkType}
								position={index + 1}
								key={crumb._key || index}
								isLast={isLast}
							/>
						)
					})}

					{pageTitle && (
						<Crumb position={(effectiveCrumbs?.length ?? 0) + 1} isLast>
							<span
								className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none"
								aria-current="page"
							>
								{pageTitle}
							</span>
						</Crumb>
					)}
				</ol>
			</div>
		</nav>
	)
}

function Crumb({
	link,
	position,
	children,
	isLast,
}: {
	position: number
	link?: Partial<ComponentProps<typeof SanityLink>['link']>
	isLast?: boolean
} & ComponentProps<'li'>) {
	const Content = (
		<>
			<span itemProp="name" className="truncate">
				{children || link?.label || link?.internal?.title}
			</span>
			<meta itemProp="position" content={position.toString()} />
		</>
	)

	return (
		<li
			className={`inline-flex items-center min-w-0 ${
				isLast ? 'flex-1' : 'shrink-0'
			} truncate not-first:before:mr-2 not-first:before:content-["/"] not-first:before:text-zinc-300 dark:not-first:before:text-zinc-600 not-first:before:shrink-0`}
			itemProp="itemListElement"
			itemScope
			itemType="https://schema.org/ListItem"
		>
			{link ? (
				<SanityLink
					link={link as SanityLinkType}
					className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors truncate"
					itemProp="item"
				>
					{Content}
				</SanityLink>
			) : (
				Content
			)}
		</li>
	)
}
