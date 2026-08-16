import { getFooterSettings } from '@/sanity/lib/queries'
import type { LinkList as LinkListType } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import LinkList from './link.list'

export default async function Navigation({ footerMenu }: { footerMenu?: any }) {
	const menu = footerMenu || (await getFooterSettings())?.footerMenu

	return (
		<nav>
			<ul className="flex items-start justify-center gap-x-8 gap-y-4 max-md:flex-col">
				{menu?.items?.map((item: any) => {
					switch (item._type) {
						case 'link':
							return (
								<li key={item._key}>
									<SanityLink
										link={item as SanityLinkType}
										className="link text-footer-foreground"
									/>
								</li>
							)

						case 'link.list':
							return (
								<LinkList
									{...(item as unknown as LinkListType)}
									className="text-footer-foreground text-left"
									key={item._key}
								/>
							)

						default:
							return null
					}
				})}
			</ul>
		</nav>
	)
}
