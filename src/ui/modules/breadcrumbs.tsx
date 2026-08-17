import type { ComponentProps } from 'react'
import type { Breadcrumbs, Page } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import { moduleAttributes } from '.'

export default function BreadcrumbsComponent({
	crumbs,
	currentPage,
	...props
}: Breadcrumbs & { currentPage?: any }) {
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
			className="border-b border-gray-100 bg-gray-50/50 py-2.5"
			{...moduleAttributes(props)}
		>
			<div className="section !py-0 text-xs lg:text-sm">
				<ol
					className="flex items-center gap-x-2 text-gray-500 overflow-hidden whitespace-nowrap min-w-0"
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
							<span className="font-medium text-gray-900 truncate">
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
			} truncate not-first:before:mr-2 not-first:before:content-["/"] not-first:before:text-gray-400 not-first:before:shrink-0`}
			itemProp="itemListElement"
			itemScope
			itemType="https://schema.org/ListItem"
		>
			{link ? (
				<SanityLink
					link={link as SanityLinkType}
					className="hover:text-primary-600 transition-colors truncate"
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
