import { PortableText, stegaClean } from 'next-sanity'
import { Clock } from 'lucide-react'
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

export interface ProseModuleProps extends Prose {
	headings?: Array<{
		style: string | null
		text: string | null
	}> | null
	readingTime?: number
	badge?: string
	tocTitle?: string
	containerWidth?: 'narrow' | 'standard' | 'wide' | 'full'
	containerStyle?: 'clean' | 'card' | 'muted'
	showReadingTime?: boolean
	enableDropCap?: boolean
}

function estimateReadingTime(blocks?: any[]): number {
	if (!blocks || !Array.isArray(blocks)) return 1
	const text = blocks
		.map((b) =>
			b?._type === 'block' && Array.isArray(b.children)
				? b.children.map((c: any) => c?.text || '').join(' ')
				: '',
		)
		.join(' ')
	const words = text.trim().split(/\s+/).filter(Boolean).length
	return Math.max(1, Math.ceil(words / 200))
}

export default function ProseModule({
	content,
	tableOfContents,
	headings,
	...props
}: ProseModuleProps & React.ComponentProps<typeof TableOfContents>) {
	const toc = stegaClean(tableOfContents)
	const rawWidth = stegaClean(props.containerWidth) || 'standard'
	const rawStyle = stegaClean(props.containerStyle) || 'card'
	const badge = stegaClean(props.badge)
	const tocTitle = stegaClean(props.tocTitle) || 'On this page'
	const showReadingTime = Boolean(stegaClean(props.showReadingTime))
	const enableDropCap = Boolean(stegaClean(props.enableDropCap))

	const hasHeadings = Boolean(headings && headings.length > 0)
	const hasToc = hasHeadings && (toc === 'left' || toc === 'right')

	const readingMinutes = props.readingTime
		? Math.max(1, Math.round(Number(props.readingTime)))
		: estimateReadingTime(content)

	const widthClasses = {
		narrow: 'max-w-2xl',
		standard: 'max-w-3xl',
		wide: 'max-w-4xl',
		full: 'max-w-5xl',
	}[rawWidth] || 'max-w-3xl'

	const containerStyleClasses = {
		clean: 'bg-transparent p-0',
		card: 'rounded-2xl border border-border/60 bg-white p-6 sm:p-10 lg:p-12 shadow-xs dark:bg-zinc-900/90 dark:border-zinc-800',
		muted: 'rounded-2xl border border-border/40 bg-muted/30 p-6 sm:p-10 lg:p-12',
	}[rawStyle] || 'rounded-2xl border border-border/60 bg-white p-6 sm:p-10 lg:p-12 shadow-xs dark:bg-zinc-900/90 dark:border-zinc-800'

	if (!content || content.length === 0) {
		return null
	}

	return (
		<section
			className={cn(
				'section',
				hasToc && 'flex flex-col lg:flex-row lg:items-start lg:gap-10 xl:gap-12',
			)}
			{...moduleAttributes(props)}
		>
			{hasToc && (
				<TableOfContents
					headings={headings}
					title={tocTitle}
					className={cn(
						'w-full mb-8 lg:mb-0 lg:sticky-below-header shrink-0 lg:w-64 xl:w-72 [--offset:2rem]',
						toc === 'right' && 'lg:order-last',
					)}
					open
				/>
			)}

			<div
				className={cn(
					'w-full min-w-0 transition-colors',
					hasToc ? 'flex-1' : 'mx-auto',
					containerStyleClasses,
				)}
			>
				{(badge || showReadingTime) && (
					<header className="mb-8 border-b border-border/50 pb-5">
						<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
							{badge && (
								<span className="font-semibold tracking-wider uppercase text-primary">
									{badge}
								</span>
							)}
							{badge && showReadingTime && (
								<span className="opacity-40" aria-hidden="true">
									•
								</span>
							)}
							{showReadingTime && (
								<span className="inline-flex items-center gap-1.5 font-medium">
									<Clock className="size-3.5 text-muted-foreground/70" aria-hidden="true" />
									<span>{readingMinutes} min read</span>
								</span>
							)}
						</div>
					</header>
				)}

				<article
					className={cn(
						'prose prose-zinc dark:prose-invert mx-auto w-full transition-colors',
						widthClasses,
						enableDropCap &&
							'[&>p:first-of-type]:first-letter:text-5xl [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:leading-none [&>p:first-of-type]:first-letter:text-foreground',
						'prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground',
						'prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:font-bold',
						'prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:font-semibold',
						'prose-p:text-foreground/90 prose-p:leading-relaxed',
						'prose-lead:text-lg sm:prose-lead:text-xl prose-lead:text-muted-foreground prose-lead:leading-relaxed',
						'prose-strong:text-foreground prose-strong:font-semibold',
						'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground/80',
						'prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80 prose-a:underline-offset-4',
						'prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-xs sm:prose-code:text-sm',
						'prose-hr:border-border/60',
					)}
				>
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
