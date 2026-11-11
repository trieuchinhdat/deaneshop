import { PortableText, type PortableTextTypeComponentProps } from 'next-sanity'
import Img from '@/ui/img'

export default function ProseImage({
	value,
}: PortableTextTypeComponentProps<any>) {
	if (!value) return null
	const { figcaption, ...image } = value

	return (
		<figure className="not-prose my-6 sm:my-8 space-y-2.5 text-center first:mt-0 last:mb-0">
			<div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20 shadow-2xs">
				<Img
					className="mx-auto w-full h-auto object-cover"
					image={image}
					width={1200}
					alt={image.alt || 'Editorial story image'}
				/>
			</div>

			{figcaption && (
				<figcaption className="text-xs sm:text-sm text-muted-foreground italic px-4">
					<PortableText value={figcaption} />
				</figcaption>
			)}
		</figure>
	)
}
