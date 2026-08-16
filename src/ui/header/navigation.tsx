import { cn } from '@/lib/utils'
import type { LinkList, Megamenu as MegamenuType } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import Dropdown from './dropdown'
import Megamenu from './megamenu'

export default function Navigation({
	items,
	desktopItems,
	align = 'center',
}: {
	items?: any[] | null
	desktopItems?: any[] | null
	mobileItems?: any[] | null
	ctas?: any[] | null
	align?: 'left' | 'center' | 'right'
}) {
	const desktopMenu = desktopItems || items

	const justifyClass =
		align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'

	return (
		<nav className="text-header-foreground [grid-area:navigation] w-full">
			{/* Desktop Navigation */}
			<div className={cn('hidden md:flex gap-x-8 items-center', justifyClass)}>
				{desktopMenu && desktopMenu.length > 0 ? (
					desktopMenu.map((item, index) => {
						const navKey = item._key || `nav-${index}`
						switch (item._type) {
							case 'link':
								return (
									<SanityLink
										link={item as SanityLinkType}
										className="group relative inline-flex items-center py-2 text-sm font-semibold tracking-normal text-header-foreground transition-colors hover:text-primary after:absolute after:bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:after:w-full select-none"
										key={navKey}
									/>
								)

							case 'link.list':
								return <Dropdown {...(item as LinkList)} key={navKey} />

							case 'megamenu':
								return <Megamenu {...(item as MegamenuType)} key={navKey} />

							default:
								return null
						}
					})
				) : (
					<div className="text-xs text-muted-foreground opacity-60">
						Chưa có menu
					</div>
				)}
			</div>
		</nav>
	)
}
