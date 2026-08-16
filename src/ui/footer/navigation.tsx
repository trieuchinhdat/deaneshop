import { getFooterSettings } from '@/sanity/lib/queries'
import type { LinkList as LinkListType } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import LinkList from './link.list'

interface NavigationProps {
	footerMenu?: any
	mobileAccordion?: boolean
	columnsCount?: number
}

export default async function Navigation({
	footerMenu,
	mobileAccordion = true,
	columnsCount = 2,
}: NavigationProps) {
	const menu = footerMenu || (await getFooterSettings())?.footerMenu
	if (!menu?.items || menu.items.length === 0) return null

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
			{menu.items.map((item: any) => {
				switch (item._type) {
					case 'link':
						return (
							<div key={item._key} className="flex flex-col">
								<SanityLink
									link={item as SanityLinkType}
									className="text-sm font-semibold tracking-wide text-foreground uppercase hover:text-primary"
								/>
							</div>
						)

					case 'link.list':
						return (
							<LinkList
								{...(item as unknown as LinkListType)}
								isMobileAccordion={mobileAccordion}
								key={item._key}
							/>
						)

					default:
						return null
				}
			})}
		</div>
	)
}
