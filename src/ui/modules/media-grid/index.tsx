import { PortableText } from 'next-sanity'
import { ArrowUpRight } from 'lucide-react'
import { FiImage } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import ResponsiveImage from '@/ui/responsiveImage'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import { moduleAttributes, type ModuleProps } from '..'

export type MediaGridItem = {
	_key: string
	image?: any
	mobileImage?: any
	alt?: string
	badge?: string
	title?: string
	subtitle?: string
	link?: any
	aspectRatio?: 'portrait' | 'square' | 'landscape' | 'auto'
	cardStyle?: 'overlay' | 'below' | 'visual-only'
}

export type MediaGridProps = {
	intro?: any[]
	items?: MediaGridItem[]
	layout?: '2-cols' | '3-cols' | '4-cols' | 'bento-1-2' | 'bento-2-1'
	mobileLayout?: 'peek-scroll' | 'grid-2' | 'stacked'
	gap?: 'sm' | 'md' | 'lg'
	fullWidth?: boolean
	borderRadius?: boolean
} & ModuleProps & { sanityAttr?: any }

export default function MediaGrid({
	intro = [],
	items = [],
	layout = '3-cols',
	mobileLayout = 'peek-scroll',
	gap = 'md',
	fullWidth = false,
	borderRadius = true,
	sanityAttr,
	...props
}: MediaGridProps) {
	if (!items.length) {
		return (
			<section className="section py-12 text-center" {...moduleAttributes(props)}>
				<div className="rounded-3xl border-2 border-dashed border-border/80 bg-muted/20 p-8 sm:p-12 space-y-3">
					<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<FiImage className="size-6" />
					</div>
					<h3 className="text-base sm:text-lg font-bold text-foreground">
						Media Grid Section
					</h3>
					<p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
						No grid items added yet. Add promo banners or category cards in Sanity Studio.
					</p>
				</div>
			</section>
		)
	}

	const gapClasses = {
		sm: 'gap-3 lg:gap-4',
		md: 'gap-4 lg:gap-6',
		lg: 'gap-5 lg:gap-8',
	}[gap] || 'gap-4 lg:gap-6'

	const desktopLayoutClasses = {
		'2-cols': 'lg:grid-cols-2',
		'3-cols': 'lg:grid-cols-3',
		'4-cols': 'lg:grid-cols-4 md:grid-cols-2',
		'bento-1-2': 'lg:grid-cols-3 lg:grid-rows-2',
		'bento-2-1': 'lg:grid-cols-3 lg:grid-rows-2',
	}[layout] || 'lg:grid-cols-3'

	const isBento = layout === 'bento-1-2' || layout === 'bento-2-1'

	return (
		<section
			className={cn(
				fullWidth ? 'w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12' : 'section py-8 sm:py-12',
			)}
			{...moduleAttributes(props)}
		>
			{/* Section Intro (Optional) */}
			{intro?.length > 0 && (
				<header className="prose dark:prose-invert max-w-2xl mx-auto text-center mb-6 sm:mb-10">
					<PortableText value={intro} />
				</header>
			)}

			{/* Responsive Grid Container */}
			<div
				className={cn(
					// Mobile Layout variants
					mobileLayout === 'peek-scroll' && [
						'flex overflow-x-auto snap-x snap-mandatory scrollbar-none',
						'-mx-4 px-4 sm:mx-0 sm:px-0',
						'lg:overflow-visible lg:snap-none',
					],
					mobileLayout === 'grid-2' && 'grid grid-cols-2',
					mobileLayout === 'stacked' && 'flex flex-col',

					// Desktop Layout
					'lg:grid',
					desktopLayoutClasses,
					gapClasses,
				)}
				style={{ touchAction: 'pan-y' }}
			>
				{items.map((item, index) => {
					const cardStyle = item.cardStyle || 'overlay'
					const aspectRatio = item.aspectRatio || 'portrait'
					const hasLink = Boolean(item.link?.internal || item.link?.external)

					const aspectClass = {
						portrait: 'aspect-[3/4]',
						square: 'aspect-square',
						landscape: 'aspect-[16/9]',
						auto: 'min-h-[260px] h-full',
					}[aspectRatio]

					// Bento grid item spans
					let bentoSpanClass = ''
					if (isBento) {
						if (layout === 'bento-1-2' && index === 0) {
							bentoSpanClass = 'lg:col-span-2 lg:row-span-2'
						} else if (layout === 'bento-2-1' && index === 2) {
							bentoSpanClass = 'lg:col-span-2 lg:row-span-2'
						}
					}

					const cardContent = (
						<article
							className={cn(
								'group relative w-full overflow-hidden transition-all duration-300',
								borderRadius && 'rounded-2xl sm:rounded-3xl',
								cardStyle === 'below'
									? 'flex flex-col bg-surface dark:bg-zinc-900 border border-border/70 hover:border-primary/40'
									: 'border border-border/40 hover:border-white/40 shadow-xs hover:shadow-md',
								// Mobile peek width sizing
								mobileLayout === 'peek-scroll' &&
									'shrink-0 snap-start w-[82vw] sm:w-[50vw] md:w-[40vw] lg:w-auto',
								bentoSpanClass,
							)}
							data-sanity={sanityAttr?.scope(`items[_key=="${item._key}"]`).toString()}
						>
							{/* Card Image Area */}
							<div
								className={cn(
									'relative overflow-hidden w-full',
									cardStyle === 'below' ? 'aspect-[4/3] w-full' : aspectClass,
									isBento && bentoSpanClass && 'lg:h-full lg:aspect-auto',
								)}
							>
								<ResponsiveImage
									image={{
										...item.image,
										mobileImage: item.mobileImage,
										alt: item.alt || item.title || 'Media Grid Item',
									}}
									className="h-full w-full"
									imgClassName="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
									sizes="(max-width: 768px) 82vw, (max-width: 1200px) 50vw, 33vw"
								/>

								{/* Badge in top left corner */}
								{item.badge && (
									<div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
										<span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase shadow-xs">
											{item.badge}
										</span>
									</div>
								)}

								{/* Arrow icon in top right corner for hover affordance */}
								{hasLink && cardStyle !== 'below' && (
									<div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
										<span className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20">
											<ArrowUpRight className="size-4" />
										</span>
									</div>
								)}

								{/* Overlay style: Dark gradient & Text inside visual */}
								{cardStyle === 'overlay' && (
									<>
										<div
											className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-black/90"
											aria-hidden="true"
										/>
										<div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-white z-10 space-y-1">
											{item.title && (
												<h3 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-sm leading-snug">
													{item.title}
												</h3>
											)}
											{item.subtitle && (
												<p className="text-xs sm:text-sm text-white/85 line-clamp-2 drop-shadow-xs leading-relaxed">
													{item.subtitle}
												</p>
											)}
										</div>
									</>
								)}
							</div>

							{/* Below style: Text below image like a clean product/category card */}
							{cardStyle === 'below' && (
								<div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
									<div className="space-y-1">
										{item.title && (
											<h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
												{item.title}
											</h3>
										)}
										{item.subtitle && (
											<p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
												{item.subtitle}
											</p>
										)}
									</div>
									{hasLink && (
										<div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
											<span>{item.link?.label || 'Explore'}</span>
											<ArrowUpRight className="size-3.5" />
										</div>
									)}
								</div>
							)}
						</article>
					)

					if (hasLink) {
						return (
							<SanityLink
								key={item._key || index}
								link={item.link as SanityLinkType}
								className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl sm:rounded-3xl"
							>
								{cardContent}
							</SanityLink>
						)
					}

					return <div key={item._key || index}>{cardContent}</div>
				})}
			</div>
		</section>
	)
}
