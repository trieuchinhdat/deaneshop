import { PortableText } from 'next-sanity'
import { cn } from '@/lib/utils'
import type { HeroSplit } from '@/sanity/types'
import CTAList from '@/ui/cta-list'
import Img from '@/ui/img'
import { moduleAttributes } from '.'
import ResponsiveImage from '../responsiveImage'

export default function ({ content = [], ctas, image, ...props }: HeroSplit) {
	return (
		<section
			className="section grid items-center gap-8 md:grid-cols-2"
			{...moduleAttributes(props)}
		>
			<figure
				className={cn(
					image?.onRight && 'md:order-last',
					image?.afterContent && 'max-md:order-last',
				)}
			>
				{/* <Img
					className="w-full"
					image={image}
					width={600}
					alt={image?.alt ?? ''}
				/> */}
				<ResponsiveImage
					className="w-full"
					image={image}
					desktop={{ width: 1200 }}
					mobile={{ width: 390 }}
				/>
			</figure>

			<header className="prose">
				<PortableText value={content} />
				<CTAList ctas={ctas} />
			</header>
		</section>
	)
}
