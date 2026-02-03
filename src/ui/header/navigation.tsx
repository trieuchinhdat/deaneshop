import { getSite } from '@/sanity/lib/queries'
import type { LinkList, Megamenu as MegamenuType } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import Dropdown from './dropdown'
import Megamenu from './megamenu'

export default async function () {
	const site = await getSite()

	return (
		<nav className="max-md:header-not-open:hidden text-header-foreground max-md:anim-fade-to-b flex justify-center gap-x-8 [grid-area:navigation] max-md:my-4 max-md:flex-col">
			{site?.header?.items?.map((item) => {
				switch (item._type) {
					case 'link':
						return (
							<SanityLink
								link={item as SanityLinkType}
								className="text-header-foreground"
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
		</nav>

		// New navigation design
		// <>
		// 	{/* Overlay */}
		// 	<label
		// 		htmlFor="header-open"
		// 		className="header-not-open:pointer-events-none header-not-open:opacity-0 header-open:opacity-100 fixed inset-0 z-[999] h-[100vh] bg-black/40 transition-opacity duration-300"
		// 	/>

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
