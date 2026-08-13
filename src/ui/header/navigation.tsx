import { cn } from '@/lib/utils'
import type { LinkList, Megamenu as MegamenuType } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import Dropdown from './dropdown'
import Megamenu from './megamenu'
import MobileNav from './mobile-nav'

export default function Navigation({
	items,
	desktopItems,
	mobileItems,
	ctas,
	align = 'center',
}: {
	items?: any[] | null
	desktopItems?: any[] | null
	mobileItems?: any[] | null
	ctas?: any[] | null
	align?: 'left' | 'center' | 'right'
}) {
	const desktopMenu = desktopItems || items
	const mobileMenu = mobileItems || items || desktopMenu

	const justifyClass =
		align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'

	return (
		<nav className="max-md:header-not-open:hidden text-header-foreground [grid-area:navigation] max-md:my-2 w-full">
			{/* Desktop Navigation */}
			<div className={cn('hidden md:flex gap-x-8 items-center', justifyClass)}>
				{desktopMenu?.map((item) => {
					switch (item._type) {
						case 'link':
							return (
								<SanityLink
									link={item as SanityLinkType}
									className="text-header-foreground hover:underline"
									key={item._key}
								/>
							)

						case 'link.list':
							return <Dropdown {...(item as LinkList)} key={item._key} />

						case 'megamenu':
							return <Megamenu {...(item as MegamenuType)} key={item._key} />

						default:
							return null
					}
				})}
			</div>

			{/* Mobile Navigation with Drill-down Panel Stack & Position Header */}
			<div className="md:hidden">
				<MobileNav items={mobileMenu} ctas={ctas} />
			</div>
		</nav>
	)
}
