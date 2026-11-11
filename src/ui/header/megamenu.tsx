'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { VscChevronDown } from 'react-icons/vsc'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import type { Megamenu, Page } from '@/sanity/types'
import HoverDetails from '@/ui/hover-details'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

export default function MegamenuComponent({ link, items, banner, badge }: Megamenu & { banner?: any }) {
	const pathname = usePathname()
	const hasBanner = Boolean(banner?.image?.asset)

	const isLinkActive = (item: any) => {
		const slug = item?.internal?.slug
		if (slug) {
			return slug === '/' ? pathname === '/' : pathname === slug || pathname.startsWith(slug + '/')
		}
		return false
	}

	const isParentActive =
		isLinkActive(link) ||
		items?.some((column) => {
			if (isLinkActive(column?.link)) return true
			return column?.links?.some((sub: any) => isLinkActive(sub))
		})

	return (
		<HoverDetails
			name="header"
			className="group/megamenu static [--safearea-x:20vw]!"
			safeAreaOnHover
			closeAfterNavigate
			closeDelay={180}
			onKeyDown={(e) => {
				if (e.key === 'Escape') {
					;(e.currentTarget as HTMLDetailsElement).open = false
				}
			}}
		>
			<summary
				className={cn(
					'group relative inline-flex items-center gap-1.5 py-2 text-sm tracking-normal transition-colors list-none cursor-pointer select-none',
					isParentActive
						? 'font-bold text-primary after:absolute after:bottom-0.5 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-primary'
						: 'font-semibold text-header-foreground hover:text-primary after:absolute after:bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:after:w-full'
				)}
				aria-haspopup="true"
			>
				<span>{link?.label || (link?.internal as unknown as Page)?.title}</span>
				{badge && (
					<span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md leading-none bg-primary/10 text-primary">
						{badge}
					</span>
				)}
				<VscChevronDown className="text-xs opacity-70 transition-transform duration-300 group-hover:opacity-100 group-open/megamenu:rotate-180" />
			</summary>

			{/* Mega Menu Panel: Full-width background across screen, content centered inside container-max */}
			<div className="anim-fade-to-b bg-background text-foreground absolute inset-x-0 left-0 right-0 top-full z-50 w-full max-h-[calc(100vh-var(--header-height,64px)-16px)] overflow-y-auto border-b border-stroke/20 shadow-2xl before:absolute before:-top-4 before:inset-x-0 before:h-4 before:content-['']">
				<div className="container-max py-8 grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
					{/* Link Groups */}
					<div className={`grid gap-8 items-start ${hasBanner ? 'md:col-span-3 grid-cols-2 sm:grid-cols-3' : 'md:col-span-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
						{items?.map((item, idx) => {
							const itemKey = item._key || `mega-${idx}`
							switch (item._type) {
								case 'link.list': {
									const colActive = isLinkActive(item.link)
									return (
										<div className="flex flex-col gap-3" key={itemKey}>
											<div className={cn(
												'text-sm tracking-wide border-b border-stroke/15 pb-1.5',
												colActive ? 'font-bold text-primary' : 'font-bold text-foreground'
											)}>
												<SanityLink
													link={item.link as unknown as SanityLinkType}
													className="hover:text-primary transition-colors"
												/>
											</div>

											<ul className="flex flex-col gap-2 text-sm text-muted-foreground">
												{item.links
													?.filter((subLink) => {
														if (!subLink) return false
														const title =
															subLink.label ||
															(subLink.internal as unknown as Page)?.title ||
															(subLink.internal as unknown as { slug?: string })?.slug ||
															subLink.external
														return Boolean(title?.trim?.() ?? title)
													})
													.map((subLink, sIdx) => {
														const subActive = isLinkActive(subLink)
														return (
															<li key={subLink._key || `sub-${sIdx}`}>
																<SanityLink
																	link={subLink as unknown as SanityLinkType}
																	className={cn(
																		'transition-colors py-0.5 inline-block',
																		subActive
																			? 'font-semibold text-primary'
																			: 'hover:text-primary'
																	)}
																	aria-current={subActive ? 'page' : undefined}
																/>
															</li>
														)
													})}
											</ul>
										</div>
									)
								}

								default:
									return null
							}
						})}
					</div>

					{/* Optional Promo Banner */}
					{hasBanner && banner?.image?.asset && (
						<div className="md:col-span-1 rounded-2xl border border-stroke/20 bg-black/[0.02] dark:bg-white/[0.02] p-3.5 flex flex-col gap-3 overflow-hidden group/banner shadow-xs">
							<div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
								<Image
									src={urlFor(banner.image).width(600).height(450).auto('format').quality(90).url()}
									alt={banner.title || link?.label || 'Promo Banner'}
									fill
									sizes="(max-width: 1024px) 300px, 400px"
									className="object-cover group-hover/banner:scale-105 transition-transform duration-500"
								/>
							</div>

							{(banner.title || banner.subtitle) && (
								<div className="flex flex-col gap-0.5">
									{banner.title && (
										<span className="font-bold text-sm text-foreground line-clamp-1">
											{banner.title}
										</span>
									)}
									{banner.subtitle && (
										<span className="text-xs text-muted-foreground line-clamp-1">
											{banner.subtitle}
										</span>
									)}
								</div>
							)}

							{banner.link && (
								<SanityLink
									link={banner.link as SanityLinkType}
									className="inline-flex items-center justify-center py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
								>
									<span>{banner.link.label || 'Explore now'}</span>
								</SanityLink>
							)}
						</div>
					)}
				</div>
			</div>
		</HoverDetails>
	)
}


