import NextLink, { type LinkProps } from 'next/link'
import type { Link, Page } from '@/sanity/types'

export type SanityLinkType = Omit<Link, 'internal'> & {
	_type?: 'link'
	_key?: string
	internal?: Omit<Page, 'metadata'> & { slug: string }
}

export default function ({
	link,
	children,
	...props
}: { link?: SanityLinkType } & Omit<
	React.ComponentProps<typeof NextLink>,
	'href'
>) {
	const { label, type, internal, external, params } = link ?? {}

	const linkProps: Omit<LinkProps, 'href'> | React.ComponentProps<'a'> = {
		...props,
		children: children || label || internal?.title || external,
	}

	if (type === 'internal' && internal?.slug)
		return (
			<NextLink
				href={[internal.slug, params].filter(Boolean).join('')}
				{...linkProps}
			/>
		)

	if (type === 'external' && external)
		return <NextLink href={external} {...linkProps} />

	return <span {...linkProps} />
}
