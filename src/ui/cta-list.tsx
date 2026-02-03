import { stegaClean } from 'next-sanity'
import { cn } from '@/lib/utils'
import type { Cta } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from './sanity-link'

export default function ({
	ctas,
	className,
}: {
	ctas?: (Cta & { _key?: string })[]
} & React.ComponentProps<'div'>) {
	if (!ctas?.length) return null

	return (
		<div
			className={cn(
				'flex flex-wrap items-center gap-x-[.5em] gap-y-[.25em]',
				className,
			)}
		>
			{ctas.map((cta) => (
				<SanityLink
					link={cta.link as SanityLinkType}
					className={stegaClean(cta.style)}
					key={cta._key}
				/>
			))}
		</div>
	)
}
