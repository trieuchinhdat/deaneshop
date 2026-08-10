import type { Megamenu, Page } from '@/sanity/types'
import HoverDetails from '@/ui/hover-details'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import MobileOnlyDetails from './mobile-only-details'

export default function ({ link, items }: Megamenu) {
	return (
		<HoverDetails
			name="header"
			className="accordion group/megamenu [--safearea-x:20vw]!"
			safeAreaOnHover
		>
			<summary className="group-open/megamenu:max-md:font-bold cursor-pointer">
				{link?.label || (link?.internal as unknown as Page)?.title}
			</summary>

			<div className="anim-fade-to-b md:bg-background text-header-foreground lg:text-foreground inset-x-0 top-full md:absolute md:max-h-[calc(100vh-var(--header-height))] md:overflow-y-auto md:shadow-lg md:before:content-[''] md:before:absolute md:before:-top-4 md:before:inset-x-0 md:before:h-4">
				<div className="section max-md:pl-ch md:py-lh py-0 max-md:grid max-md:border-l md:grid md:grid-cols-4 md:items-start md:gap-8">
					{items?.map((item) => {
						switch (item._type) {
							case 'link.list':
								return (
									<MobileOnlyDetails
										className="max-md:accordion group/megamenu-linklist break-inside-avoid md:details-content:h-[initial]"
										name="megamenu-linklist"
										key={item._key}
									>
										<summary className="group-open/megamenu-linklist:font-bold md:block">
											<SanityLink
												link={item.link as unknown as SanityLinkType}
											/>
										</summary>

										<ul className="border-stroke max-md:pl-ch max-md:anim-fade-to-b mb-ch max-md:border-l">
											{item.links?.map((link) => {
												return (
													<li key={link._key}>
														<SanityLink
															link={link as unknown as SanityLinkType}
															className="[:is(a)]:link"
														/>
													</li>
												)
											})}
										</ul>
									</MobileOnlyDetails>
								)

							default:
								return null
						}
					})}
				</div>
			</div>
		</HoverDetails>
	)
}
