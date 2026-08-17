import { PortableText, stegaClean } from 'next-sanity'
import { cn } from '@/lib/utils'
import type { Prose } from '@/sanity/types'
import CustomHTML from '@/ui/modules/custom-html'
import TableOfContents from '@/ui/table-of-contents'
import { moduleAttributes } from '..'
import AnchoredHeading from './anchored-heading'
import Code from './code'
import Image from './image'
import CalloutBox from '@/ui/modules/blog/blocks/callout-box'
import ProductEmbed from '@/ui/modules/blog/blocks/product-embed'
import ComparisonTable from '@/ui/modules/blog/blocks/comparison-table'
import VideoEmbed from '@/ui/modules/blog/blocks/video-embed'
import FAQAccordion from '@/ui/modules/blog/blocks/faq-accordion'
import ImageGallery from '@/ui/modules/blog/blocks/image-gallery'
import CTABanner from '@/ui/modules/blog/blocks/cta-banner'
import AffiliateLink from '@/ui/modules/affiliate-link'

export default function ProseModule({
	content,
	tableOfContents,
	headings,
	...props
}: Prose & React.ComponentProps<typeof TableOfContents>) {
	const toc = stegaClean(tableOfContents)

	return (
		<section
			className={cn(
				'section',
				toc && 'flex gap-4 max-md:flex-col md:items-start',
			)}
			{...moduleAttributes(props)}
		>
			{(toc === 'left' || toc === 'right') && (
				<TableOfContents
					headings={headings}
					className={cn(
						'md:sticky-below-header shrink-0 [--offset:1rem] md:w-[20ch]',
						toc === 'right' && 'md:order-last',
					)}
					open
				/>
			)}
			<div className="rounded-xl bg-white p-4 lg:p-8 dark:bg-zinc-900">
				<article className="prose prose-zinc dark:prose-invert mx-auto w-full max-w-3xl">
					<PortableText
						value={content ?? []}
						components={{
							block: {
								h1: (node) => <AnchoredHeading as="h1" {...node} />,
								h2: (node) => <AnchoredHeading as="h2" {...node} />,
								h3: (node) => <AnchoredHeading as="h3" {...node} />,
								h4: (node) => <AnchoredHeading as="h4" {...node} />,
								h5: (node) => <AnchoredHeading as="h5" {...node} />,
								h6: (node) => <AnchoredHeading as="h6" {...node} />,
							},
							types: {
								image: Image,
								code: Code,
								'custom-html': ({ value }) => <CustomHTML {...value} />,
								affiliateLink: ({ value }: any) => <AffiliateLink {...value} />,
								'callout-box': ({ value }) => <CalloutBox {...value} />,
								'product-embed': ({ value }) => <ProductEmbed {...value} />,
								'comparison-table': ({ value }) => <ComparisonTable {...value} />,
								'video-embed': ({ value }) => <VideoEmbed {...value} />,
								'faq-accordion': ({ value }) => <FAQAccordion {...value} />,
								'image-gallery': ({ value }) => <ImageGallery {...value} />,
								'cta-banner': ({ value }) => <CTABanner {...value} />,
							},
						}}
					/>
				</article>
			</div>
		</section>
	)
}
