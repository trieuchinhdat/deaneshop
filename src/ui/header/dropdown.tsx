import { VscChevronDown } from 'react-icons/vsc'
import type { LinkList, Page } from '@/sanity/types'
import HoverDetails from '@/ui/hover-details'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

export default function Dropdown({ link: summary, links }: LinkList) {
	const validLinks = links?.filter((link) => {
		if (!link) return false
		const title =
			link.label ||
			(link.internal as unknown as Page)?.title ||
			(link.internal as unknown as { slug?: string })?.slug ||
			link.external
		return Boolean(title?.trim?.() ?? title)
	})

	return (
		<HoverDetails
			name="header"
			className="group/dropdown relative"
			safeAreaOnHover
		>
			<summary className="group relative inline-flex items-center gap-1 py-2 text-sm font-semibold tracking-normal text-header-foreground transition-colors hover:text-primary list-none cursor-pointer after:absolute after:bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:after:w-full select-none">
				<span>{summary?.label || (summary?.internal as unknown as Page)?.title}</span>
				<VscChevronDown className="text-xs opacity-70 transition-transform duration-300 group-hover:opacity-100 group-open/dropdown:rotate-180" />
			</summary>

			{validLinks && validLinks.length > 0 && (
				<ul className="anim-fade-to-b bg-background text-foreground border border-stroke/20 rounded-xl shadow-xl p-2 min-w-[200px] absolute top-full left-0 mt-2 z-50 flex flex-col gap-1 before:absolute before:inset-x-0 before:-top-4 before:h-4 before:content-['']">
					{validLinks.map((link, key) => (
						<li key={link._key || `drop-${key}`}>
							<SanityLink
								link={link as SanityLinkType}
								className="block px-3 py-2 text-sm font-medium text-foreground/90 hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
							/>
						</li>
					))}
				</ul>
			)}
		</HoverDetails>
	)
}


