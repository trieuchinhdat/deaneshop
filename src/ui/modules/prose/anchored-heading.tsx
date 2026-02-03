import type { PortableTextBlock, PortableTextComponentProps } from 'next-sanity'
import { slug } from '@/lib/utils'

export default function ({
	as: Tag = 'h1',
	children,
	value,
}: { as: React.ElementType } & PortableTextComponentProps<PortableTextBlock>) {
	const id = slug(
		value.children.reduce((acc, { text }) => acc + text, ''),
		{ removeLeadingNumberAndHyphen: true },
	)

	return (
		<Tag className="group grid-cols-[1fr_auto] max-md:grid" id={id}>
			{children}

			{Tag !== 'h1' && (
				<a
					href={`#${id}`}
					className="text-primary ml-ch inline-block pointer-fine:not-group-hover:invisible"
				>
					#
				</a>
			)}
		</Tag>
	)
}
