import type { LinkList, Page } from '@/sanity/types'
import HoverDetails from '@/ui/hover-details'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

export default function ({ link: summary, links }: LinkList) {
	return (
		<HoverDetails
			name="header"
			className="accordion group/dropdown"
			safeAreaOnHover
		>
			<summary className="group-open/dropdown:max-md:font-bold cursor-pointer">
				{summary?.label || (summary?.internal as unknown as Page)?.title}
			</summary>

			<ul className="lg:bg-background text-header-foreground lg:text-foreground anim-fade-to-b border-stroke max-md:pl-ch mb-ch top-full z-10 p-2 max-md:border-l md:absolute md:min-w-max md:p-3 md:shadow-lg md:before:content-[''] md:before:absolute md:before:-top-6 md:before:inset-x-0 md:before:h-6">
				{links?.map((link, key) => (
					<li key={key}>
						<SanityLink
							link={link as SanityLinkType}
							className="text-header-foreground lg:text-foreground hover:underline"
						/>
					</li>
				))}
			</ul>
		</HoverDetails>
	)
}
