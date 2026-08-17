import { stegaClean } from 'next-sanity'
import { cn } from '@/lib/utils'
import type { Cta } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from './sanity-link'

type ExtendedCta = Cta & {
	_key?: string
	size?: string
	fullWidth?: boolean
}

export default function ({
	ctas,
	className,
}: {
	ctas?: ExtendedCta[]
} & React.ComponentProps<'div'>) {
	if (!ctas?.length) return null

	return (
		<div
			className={cn(
				'flex flex-wrap items-center gap-3',
				className,
			)}
		>
			{ctas.map((cta) => {
				const style = stegaClean(cta.style) || 'action'
				const size = stegaClean(cta.size) || 'btn-md'
				const isLink = style === 'link'
				const isFullWidth = Boolean(stegaClean(cta.fullWidth))

				return (
					<SanityLink
						link={cta.link as SanityLinkType}
						className={cn(
							style,
							!isLink && size,
							isFullWidth && 'w-full',
						)}
						key={cta._key}
					/>
				)
			})}
		</div>
	)
}

