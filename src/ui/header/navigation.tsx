import { getSite } from '@/sanity/lib/queries'
import type { LinkList, Megamenu as MegamenuType } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import Dropdown from './dropdown'
import Megamenu from './megamenu'
import MobileNav from './mobile-nav'

export default async function () {
	const site = await getSite()

	return (
		<nav className="max-md:header-not-open:hidden text-header-foreground [grid-area:navigation] max-md:my-2">
			{/* Desktop Navigation */}
			<div className="hidden md:flex justify-center gap-x-8">
				{site?.header?.items?.map((item) => {
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
				<MobileNav items={site?.header?.items} />
			</div>
		</nav>

		// 	{/* Drawer */}
		// 	<nav className="bg-background header-not-open:-translate-x-full header-open:translate-x-0 fixed inset-y-0 left-0 z-[999] h-[100vh] w-[90vw] overflow-y-auto shadow-xl transition-transform duration-300 ease-out md:w-[30vw]">
		// 		<div className="p-4">
		// 			{site?.header?.items?.map((item) => {
		// 				switch (item._type) {
		// 					case 'link':
		// 						return (
		// 							<SanityLink
		// 								link={item as SanityLinkType}
		// 								className="block py-2 text-base font-medium"
		// 								key={item._key}
		// 							/>
		// 						)
		// 					case 'link.list':
		// 						return <Dropdown {...(item as LinkList)} key={item._key} />
		// 					case 'megamenu':
		// 						return <Megamenu {...(item as MegamenuType)} key={item._key} />

		// 					default:
		// 						return null
		// 				}
		// 			})}
		// 		</div>
		// 	</nav>
		// </>
	)
}
