'use client'

import { usePathname } from 'next/navigation'
import { VscChevronDown } from 'react-icons/vsc'
import { cn } from '@/lib/utils'
import type { LinkList, Page } from '@/sanity/types'
import HoverDetails from '@/ui/hover-details'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

export default function Dropdown({ link: summary, links }: LinkList) {
	const pathname = usePathname()

	const validLinks = links?.filter((link) => {
		if (!link) return false
		const title =
			link.label ||
			(link.internal as unknown as Page)?.title ||
			(link.internal as unknown as { slug?: string })?.slug ||
			link.external
		return Boolean(title?.trim?.() ?? title)
	})

	const isLinkActive = (link: any) => {
		const slug = link?.internal?.slug
		if (slug) {
			return slug === '/' ? pathname === '/' : pathname === slug || pathname.startsWith(slug + '/')
		}
		return false
	}

	const isParentActive = validLinks?.some(isLinkActive)

	return (
		<HoverDetails
			name="header"
			className="group/dropdown relative"
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
				aria-haspopup="menu"
			>
				<span>{summary?.label || (summary?.internal as unknown as Page)?.title}</span>
				<VscChevronDown className="text-xs opacity-70 transition-transform duration-300 group-hover:opacity-100 group-open/dropdown:rotate-180" />
			</summary>

			{validLinks && validLinks.length > 0 && (
				<ul
					role="menu"
					className="anim-fade-to-b bg-background text-foreground border border-stroke/20 rounded-2xl shadow-2xl p-2 min-w-[210px] absolute top-full left-0 mt-2 z-50 flex flex-col gap-0.5 before:absolute before:inset-x-0 before:-top-4 before:h-4 before:content-['']"
				>
					{validLinks.map((link, key) => {
						const active = isLinkActive(link)
						return (
							<li key={link._key || `drop-${key}`} role="none">
								<SanityLink
									link={link as SanityLinkType}
									role="menuitem"
									className={cn(
										'block px-3.5 py-2.5 text-sm rounded-xl transition-colors',
										active
											? 'font-bold text-primary bg-primary/10'
											: 'font-medium text-foreground/85 hover:text-primary hover:bg-black/5 dark:hover:bg-white/10'
									)}
									aria-current={active ? 'page' : undefined}
								/>
							</li>
						)
					})}
				</ul>
			)}
		</HoverDetails>
	)
}


