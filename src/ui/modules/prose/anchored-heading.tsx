import type { PortableTextBlock, PortableTextComponentProps } from 'next-sanity'
import { slug } from '@/lib/utils'

export default function AnchoredHeading({
	as: Tag = 'h1',
	children,
	value,
}: { as: React.ElementType } & PortableTextComponentProps<PortableTextBlock>) {
	const headingText =
		(value?.children as any[])?.reduce(
			(acc: string, { text }: any) => acc + (text || ''),
			'',
		) || ''

	const id = headingText
		? slug(headingText, { removeLeadingNumberAndHyphen: true })
		: undefined

	return (
		<Tag className="group relative scroll-mt-24 sm:scroll-mt-28 break-words text-balance" id={id}>
			<span>{children}</span>

			{Tag !== 'h1' && id && (
				<a
					href={`#${id}`}
					aria-label={`Link to section: ${headingText}`}
					className="ml-2 inline-flex items-center text-muted-foreground/40 hover:text-primary transition-opacity duration-150 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus:outline-hidden"
				>
					<span aria-hidden="true" className="text-base font-normal select-none">
						#
					</span>
				</a>
			)}
		</Tag>
	)
}
