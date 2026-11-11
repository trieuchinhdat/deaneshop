import { getFooterSettings } from '@/sanity/lib/queries'
import type { LinkList as LinkListType } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import LinkList from './link.list'
import { cn } from '@/lib/utils'

interface NavigationProps {
	footerMenu?: any
	mobileAccordion?: boolean
	columnsCount?: number
	headingCase?: 'title' | 'uppercase'
}

export default async function Navigation({
	footerMenu,
	mobileAccordion = true,
	columnsCount,
	headingCase = 'title',
}: NavigationProps) {
	const menu = footerMenu || (await getFooterSettings())?.footerMenu
	if (!menu?.items || menu.items.length === 0) return null

	const count = columnsCount || menu.items.length
	const gridClass =
		count === 1
			? 'grid grid-cols-1 gap-6'
			: count === 2
				? 'grid grid-cols-1 gap-6 sm:grid-cols-2'
				: count === 3
					? 'grid grid-cols-1 gap-6 sm:grid-cols-3'
					: 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'

	return (
		<nav aria-label="Footer Navigation" className={gridClass}>
			{menu.items.map((item: any) => {
				switch (item._type) {
					case 'link':
						return (
							<div key={item._key} className="flex flex-col py-1 md:py-0">
								<SanityLink
									link={item as SanityLinkType}
									className={cn(
										'inline-flex min-h-[44px] md:min-h-0 items-center font-semibold text-foreground hover:text-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm',
										headingCase === 'uppercase'
											? 'text-xs uppercase tracking-wider'
											: 'text-sm sm:text-base tracking-normal'
									)}
								/>
							</div>
						)

					case 'link.list':
						return (
							<LinkList
								{...(item as unknown as LinkListType)}
								isMobileAccordion={mobileAccordion}
								headingCase={headingCase}
								key={item._key}
							/>
						)

					default:
						return null
				}
			})}
		</nav>
	)
}
