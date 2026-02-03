import { PortableText, type PortableTextTypeComponentProps } from 'next-sanity'
import Img from '@/ui/img'

export default function ({
	value: { figcaption, ...image },
}: PortableTextTypeComponentProps<any>) {
	return (
		//max-md:full-bleed
		<figure className="my-4 space-y-2 text-center first:mt-0 md:col-[bleed]! lg:my-6">
			<Img
				className="mx-auto"
				image={image}
				width={900}
				alt={image.alt ?? ''}
			/>

			{figcaption && (
				<figcaption className="text-foreground/50 italic max-md:px-4">
					<PortableText value={figcaption} />
				</figcaption>
			)}
		</figure>
	)
}
