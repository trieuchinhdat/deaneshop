import type { LinkList } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

export default function ({
	link,
	links,
	...props
}: LinkList & React.ComponentProps<'li'>) {
	return (
		<li {...props}>
			<div>
				<b>{link?.label}</b>
			</div>
			<ul>
				{links?.map((item) => (
					<li key={item._key}>
						<SanityLink
							className="link text-footer-foreground"
							link={item as SanityLinkType}
						/>
					</li>
				))}
			</ul>
		</li>
	)
}
