import type { LinkList, Page } from '@/sanity/types'
import HoverDetails from '@/ui/hover-details'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

export default function ({ link: summary, links }: LinkList) {
	return (
		<HoverDetails
			name="header"
			className="accordion group/dropdown relative"
			safeAreaOnHover
		>
			<summary className="group-open/dropdown:max-md:font-bold">
				{summary?.label || (summary?.internal as unknown as Page)?.title}
			</summary>

			<ul className="lg:bg-background text-header-foreground lg:text-foreground anim-fade-to-b border-stroke max-md:pl-ch mb-ch top-full -left-4 z-1 mt-2 p-2 max-md:border-l md:absolute md:min-w-max md:p-3 md:shadow-lg">
				{links?.map((link, key) => (
					<li key={key}>
						<SanityLink
							link={link as SanityLinkType}
							className="text-header-foreground lg:text-foreground"
						/>
					</li>
				))}
			</ul>
		</HoverDetails>
	)
}
