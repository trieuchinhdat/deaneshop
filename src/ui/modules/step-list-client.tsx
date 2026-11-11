'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
	ArrowRight,
	CheckCircle2,
	Clock,
	Cpu,
	CreditCard,
	Factory,
	FileText,
	Globe,
	Package,
	Phone,
	Play,
	Search,
	Send,
	Settings,
	ShieldCheck,
	Sparkles,
	Truck,
	UserCheck,
	X,
	Zap,
} from 'lucide-react'
import { PortableText, stegaClean } from 'next-sanity'
import { cn } from '@/lib/utils'
import CTAList from '@/ui/cta-list'
import Img from '@/ui/img'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

export type EnhancedStep = {
	_key?: string
	title?: string
	badge?: string
	iconPreset?: string
	icon?: any
	image?: any
	videoUrl?: string
	videoThumbnail?: any
	videoAutoplay?: boolean
	content?: any[]
	link?: any
	ctas?: any[]
}

export interface StepListInteractiveProps {
	steps?: EnhancedStep[]
	layout?: 'split' | 'horizontal' | 'grid' | 'vertical'
	columns?: number
	mobileLayout?: 'stack' | 'carousel'
	headerAlign?: 'left' | 'center'
	stepStyle?: 'card' | 'elevated' | 'minimal' | 'outline'
	numberStyle?: 'brand' | 'neutral' | 'outline' | 'gradient'
	showConnector?: boolean
	animateTimeline?: boolean
	stepSanityAttrs?: (string | undefined)[]
}

// Render clean, high-utility Lucide preset icons
function renderPresetIcon(name?: string, className?: string) {
	if (!name || name === 'none') return null
	const iconProps = {
		className: className || 'size-5 sm:size-5.5',
		'aria-hidden': true,
	}

	switch (name) {
		case 'search':
			return <Search {...iconProps} />
		case 'fileText':
			return <FileText {...iconProps} />
		case 'cpu':
			return <Cpu {...iconProps} />
		case 'factory':
			return <Factory {...iconProps} />
		case 'check':
			return <CheckCircle2 {...iconProps} />
		case 'package':
			return <Package {...iconProps} />
		case 'truck':
			return <Truck {...iconProps} />
		case 'globe':
			return <Globe {...iconProps} />
		case 'zap':
			return <Zap {...iconProps} />
		case 'shield':
			return <ShieldCheck {...iconProps} />
		case 'sparkles':
			return <Sparkles {...iconProps} />
		case 'clock':
			return <Clock {...iconProps} />
		case 'phone':
			return <Phone {...iconProps} />
		case 'userCheck':
			return <UserCheck {...iconProps} />
		case 'creditCard':
			return <CreditCard {...iconProps} />
		case 'settings':
			return <Settings {...iconProps} />
		case 'send':
			return <Send {...iconProps} />
		default:
			return null
	}
}

function getEmbedVideoUrl(url: string): string | null {
	if (!url || typeof url !== 'string') return null
	const trimmed = url.trim()

	// 1. YouTube
	const ytMatch = trimmed.match(
		/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/i,
	)
	if (ytMatch && ytMatch[1]) {
		return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
	}

	// 2. Vimeo
	const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
	if (vimeoMatch && vimeoMatch[1]) {
		return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
	}

	// 3. TikTok
	const ttMatch = trimmed.match(
		/tiktok\.com\/(?:@[^\/]+\/video\/|v\/|embed\/v2\/)(\d+)/i,
	)
	if (ttMatch && ttMatch[1]) {
		return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`
	}

	return null
}

export function StepVideoLightbox({
	isOpen,
	videoUrl,
	videoTitle,
	onClose,
}: {
	isOpen: boolean
	videoUrl: string | null
	videoTitle?: string
	onClose: () => void
}) {
	const closeButtonRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		if (!isOpen) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		const originalOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		closeButtonRef.current?.focus()

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = originalOverflow
		}
	}, [isOpen, onClose])

	if (!isOpen || !videoUrl) return null

	const embedUrl = getEmbedVideoUrl(videoUrl)

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-label={videoTitle || 'Step demonstration video'}
		>
			<div
				className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Accessible Close Button */}
				<button
					ref={closeButtonRef}
					type="button"
					onClick={onClose}
					className="absolute top-3 right-3 z-20 flex size-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
					aria-label="Close video"
				>
					<X className="size-5" aria-hidden="true" />
				</button>

				{/* Video Player Embed OR Native Video */}
				<div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
					{embedUrl ? (
						<iframe
							src={embedUrl}
							title={videoTitle || 'Step video player'}
							className="h-full w-full border-0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
						/>
					) : (
						<video
							src={videoUrl}
							controls
							autoPlay
							playsInline
							className="h-full w-full object-contain"
						/>
					)}
				</div>
			</div>
		</div>
	)
}

function StepVideoTrigger({
	videoUrl,
	videoThumbnail,
	videoAutoplay,
	fallbackImage,
	stepTitle,
	onOpenVideo,
}: {
	videoUrl: string
	videoThumbnail?: any
	videoAutoplay?: boolean
	fallbackImage?: any
	stepTitle?: string
	onOpenVideo: (url: string, title?: string) => void
}) {
	const posterImage = videoThumbnail?.asset ? videoThumbnail : fallbackImage

	// Mode 1: Ambient Autoplay Looping Video Preview
	if (videoAutoplay) {
		return (
			<div className="relative mb-4 overflow-hidden rounded-xl border border-border/60 bg-black/5 aspect-[16/9]">
				<Img
					image={{
						videoUrl,
						poster: posterImage?.asset?.url,
					}}
					alt={stepTitle || 'Step process preview'}
					className="h-full w-full object-cover"
				/>
				<button
					type="button"
					onClick={() => onOpenVideo(videoUrl, stepTitle)}
					className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-black cursor-pointer"
					aria-label={`Expand ${stepTitle || 'step'} video`}
				>
					<Play className="size-3 fill-current" aria-hidden="true" />
					<span>Watch Full</span>
				</button>
			</div>
		)
	}

	// Mode 2: Click-to-Play Video Trigger Card
	return (
		<div className="group/video relative mb-4 overflow-hidden rounded-xl border border-border/60 bg-muted/40 aspect-[16/9]">
			{posterImage?.asset ? (
				<Img
					image={posterImage}
					alt={posterImage.alt || stepTitle || 'Step video thumbnail'}
					width={640}
					height={360}
					className="h-full w-full object-cover transition-transform duration-300 group-hover/video:scale-105"
				/>
			) : (
				<div className="flex h-full w-full items-center justify-center bg-muted/50" />
			)}
			<div className="absolute inset-0 bg-black/25 transition-opacity group-hover/video:bg-black/15" />

			<button
				type="button"
				onClick={() => onOpenVideo(videoUrl, stepTitle)}
				className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
				aria-label={`Play demonstration video for ${stepTitle || 'this step'}`}
			>
				<span className="flex size-11 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg backdrop-blur-xs transition-transform duration-300 group-hover/video:scale-110">
					<Play className="size-4 fill-current ml-0.5" aria-hidden="true" />
				</span>
				<span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-xs">
					Watch Step Video
				</span>
			</button>
		</div>
	)
}

export default function StepListInteractive({
	steps,
	layout = 'split',
	columns = 3,
	mobileLayout = 'stack',
	stepStyle = 'card',
	numberStyle = 'brand',
	showConnector = true,
	animateTimeline = true,
	stepSanityAttrs = [],
}: StepListInteractiveProps) {
	const stegaLayout = (stegaClean(layout) || 'split') as
		| 'split'
		| 'horizontal'
		| 'grid'
		| 'vertical'
	const stegaColumns = Number(stegaClean(columns)) || 3
	const stegaMobileLayout = (stegaClean(mobileLayout) || 'stack') as
		| 'stack'
		| 'carousel'
	const stegaStepStyle = (stegaClean(stepStyle) || 'card') as
		| 'card'
		| 'elevated'
		| 'minimal'
		| 'outline'
	const stegaNumberStyle = (stegaClean(numberStyle) || 'brand') as
		| 'brand'
		| 'neutral'
		| 'outline'
		| 'gradient'
	const isConnectorVisible = Boolean(stegaClean(showConnector) ?? true)
	const isAnimateTimeline = Boolean(stegaClean(animateTimeline) ?? true)
	const isMobileCarousel = stegaMobileLayout === 'carousel'

	const [activeStep, setActiveStep] = useState<number>(0)
	const [activeVideo, setActiveVideo] = useState<{
		url: string
		title?: string
	} | null>(null)

	const itemRefs = useRef<(HTMLElement | null)[]>([])

	const setItemRef = useCallback(
		(index: number) => (el: HTMLElement | null) => {
			itemRefs.current[index] = el
		},
		[],
	)

	useEffect(() => {
		if (!isAnimateTimeline || typeof window === 'undefined') return

		const prefersReducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)',
		).matches

		if (prefersReducedMotion) {
			setActiveStep((steps?.length ?? 1) - 1)
			return
		}

		const observers: IntersectionObserver[] = []

		itemRefs.current.forEach((el, index) => {
			if (!el) return

			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							setActiveStep((prev) => Math.max(prev, index))
						}
					})
				},
				{
					threshold: 0.25,
					rootMargin: '-40px 0px -40px 0px',
				},
			)

			observer.observe(el)
			observers.push(observer)
		})

		return () => {
			observers.forEach((obs) => obs.disconnect())
		}
	}, [steps?.length, isAnimateTimeline])

	const handleOpenVideo = useCallback((url: string, title?: string) => {
		setActiveVideo({ url, title })
	}, [])

	const handleCloseVideo = useCallback(() => {
		setActiveVideo(null)
	}, [])

	// Number badge styling helper
	const getNumberBadgeClass = (style: string) => {
		switch (style) {
			case 'neutral':
				return 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 ring-4 ring-background shadow-xs'
			case 'outline':
				return 'border-2 border-primary text-primary bg-background ring-4 ring-background/50 shadow-2xs'
			case 'gradient':
				return 'bg-linear-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground ring-4 ring-background shadow-xs'
			case 'brand':
			default:
				return 'bg-primary text-primary-foreground ring-4 ring-background shadow-xs'
		}
	}

	// Step card styling helper
	const getStepCardClass = (style: string) => {
		switch (style) {
			case 'elevated':
				return 'border border-border/50 bg-surface shadow-xs hover:shadow-lg hover:border-primary/40'
			case 'minimal':
				return 'bg-muted/40 hover:bg-muted/70 border border-transparent'
			case 'outline':
				return 'border-2 border-border/80 hover:border-primary/60 bg-transparent'
			case 'card':
			default:
				return 'border border-border/70 bg-surface dark:bg-zinc-900/60 shadow-2xs hover:border-primary/50 hover:shadow-md'
		}
	}

	// Desktop grid columns helper
	const getGridColsClass = (cols: number) => {
		switch (cols) {
			case 2:
				return 'md:grid-cols-2'
			case 4:
				return 'md:grid-cols-2 lg:grid-cols-4'
			case 3:
			default:
				return 'md:grid-cols-2 lg:grid-cols-3'
		}
	}

	// Render Individual Step Card Content
	const renderStepCardContent = (step: EnhancedStep, index: number) => {
		const stepTitle = stegaClean(step.title)
		const stepBadge = stegaClean(step.badge)
		const presetIcon = stegaClean(step.iconPreset)
		const hasPresetIcon = Boolean(presetIcon && presetIcon !== 'none')
		const hasCustomIcon = Boolean(step.icon?.asset)
		const hasAnyIcon = hasPresetIcon || hasCustomIcon
		const hasImage = Boolean(step.image?.asset)

		const targetLink = step.link as SanityLinkType | undefined

		return (
			<div className="flex h-full w-full flex-col justify-between">
				<div>
					{/* Step Top Meta Row (Badge or Icon) */}
					{(stepBadge || hasAnyIcon) && (
						<div className="flex items-center justify-between gap-3 mb-3">
							{stepBadge ? (
								<span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/20 ring-inset">
									{stepBadge}
								</span>
							) : (
								<span />
							)}
							{hasAnyIcon && (
								<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
									{hasCustomIcon ? (
										<Img
											image={step.icon}
											alt=""
											className="size-5 sm:size-5.5 object-contain"
										/>
									) : (
										renderPresetIcon(presetIcon, 'size-5 sm:size-5.5')
									)}
								</div>
							)}
						</div>
					)}

					{/* Step Video Walkthrough or Showcase Image */}
					{step.videoUrl ? (
						<StepVideoTrigger
							videoUrl={step.videoUrl}
							videoThumbnail={step.videoThumbnail}
							videoAutoplay={step.videoAutoplay}
							fallbackImage={step.image}
							stepTitle={stepTitle}
							onOpenVideo={handleOpenVideo}
						/>
					) : hasImage ? (
						<div className="overflow-hidden rounded-xl border border-border/50 mb-4 aspect-[16/9] bg-muted/30">
							<Img
								image={step.image}
								alt={step.image?.alt || stepTitle || `Step ${index + 1}`}
								className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
								width={640}
								height={360}
							/>
						</div>
					) : null}

					{/* Step Title (if structured) */}
					{stepTitle && (
						<h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground mb-2">
							{stepTitle}
						</h3>
					)}

					{/* Step Body Content (PortableText) */}
					{step.content && step.content.length > 0 && (
						<div className="prose dark:prose-invert max-w-none text-muted-foreground text-sm sm:text-base leading-relaxed">
							<PortableText value={step.content} />
						</div>
					)}
				</div>

				{/* Step Action Link or CTAs */}
				{(targetLink || (step.ctas && step.ctas.length > 0)) && (
					<div className="pt-4 mt-auto">
						{step.ctas && step.ctas.length > 0 ? (
							<CTAList ctas={step.ctas} />
						) : targetLink ? (
							<SanityLink
								link={targetLink}
								className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group-hover:gap-2 transition-all motion-reduce:transition-none"
							>
								<span>{targetLink.label || 'Learn more'}</span>
								<ArrowRight className="size-4" aria-hidden="true" />
							</SanityLink>
						) : null}
					</div>
				)}
			</div>
		)
	}

	return (
		<>
			{/* =========================================================================
			    LAYOUT 1: SPLIT (Two-Column Editorial Sticky Steps)
			    ========================================================================= */}
			{stegaLayout === 'split' && (
				<ol className="relative lg:col-span-7 list-none p-0 m-0 space-y-6 sm:space-y-8">
					{steps?.map((step, index) => {
						const isLast = index === (steps?.length ?? 0) - 1
						const isReached = index <= activeStep
						const isLineFilled = index < activeStep

						return (
							<li
								key={step._key || `step-${index}`}
								ref={setItemRef(index)}
								data-sanity={stepSanityAttrs[index]}
								className="relative flex items-start gap-4 sm:gap-6 group"
							>
								{/* Accessible Step Indicator for Screen Readers */}
								<span className="sr-only">Step {index + 1}: </span>

								{/* Connecting timeline segment between steps */}
								{isConnectorVisible && !isLast && (
									<span
										className={cn(
											'absolute left-[1.125rem] sm:left-[1.375rem] top-10 sm:top-12 bottom-0 -mb-6 sm:-mb-8 w-0.5 transition-all duration-500',
											isAnimateTimeline
												? isLineFilled
													? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]'
													: 'bg-linear-to-b from-primary/30 to-border/40'
												: 'bg-linear-to-b from-primary via-border to-border/40',
										)}
										aria-hidden="true"
									/>
								)}

								{/* Step Number Badge */}
								<div
									className={cn(
										'relative z-10 flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-2xl font-mono text-sm sm:text-base font-black transition-all duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none',
										getNumberBadgeClass(stegaNumberStyle),
										isAnimateTimeline &&
											isReached &&
											'ring-primary/40 shadow-md scale-102',
									)}
									aria-hidden="true"
								>
									<span>{index + 1}</span>
								</div>

								{/* Step Content Card */}
								<div
									className={cn(
										'flex-1 rounded-2xl p-5 sm:p-6 transition-all duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none',
										getStepCardClass(stegaStepStyle),
									)}
								>
									{renderStepCardContent(step, index)}
								</div>
							</li>
						)
					})}
				</ol>
			)}

			{/* =========================================================================
			    LAYOUT 2: HORIZONTAL (Progressive Milestones Chain across Columns)
			    ========================================================================= */}
			{stegaLayout === 'horizontal' && (
				<ol
					className={cn(
						'list-none p-0 m-0',
						isMobileCarousel &&
							'flex overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid',
						!isMobileCarousel && 'grid gap-6 sm:gap-6 lg:gap-8',
						getGridColsClass(stegaColumns),
					)}
				>
					{steps?.map((step, index) => {
						const isLast = index === (steps?.length ?? 0) - 1
						const isReached = index <= activeStep
						const isLineFilled = index < activeStep

						return (
							<li
								key={step._key || `step-${index}`}
								ref={setItemRef(index)}
								data-sanity={stepSanityAttrs[index]}
								className={cn(
									'group relative flex flex-col',
									isMobileCarousel &&
										'shrink-0 w-[84vw] max-w-[320px] snap-start sm:w-auto sm:max-w-none',
								)}
							>
								{/* Accessible Step Indicator for Screen Readers */}
								<span className="sr-only">Step {index + 1}: </span>

								{/* Milestone Badge Header with Connecting Line */}
								<div className="relative flex items-center mb-4 sm:mb-5">
									{/* Horizontal Connector Line on Desktop */}
									{isConnectorVisible && !isLast && (
										<div
											className={cn(
												'hidden md:block absolute top-1/2 left-[calc(2.75rem)] right-[-1.5rem] lg:right-[-2rem] h-0.5 transition-all duration-500 z-0',
												isAnimateTimeline
													? isLineFilled
														? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]'
														: 'bg-linear-to-r from-primary/30 to-border/70'
													: 'bg-linear-to-r from-primary via-primary/50 to-border/70',
											)}
											aria-hidden="true"
										/>
									)}

									{/* Number Badge */}
									<div
										className={cn(
											'relative z-10 flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-2xl font-mono text-sm sm:text-base font-black transition-all duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none',
											getNumberBadgeClass(stegaNumberStyle),
											isAnimateTimeline &&
												isReached &&
												'ring-primary/40 shadow-md scale-102',
										)}
										aria-hidden="true"
									>
										<span>{index + 1}</span>
									</div>
								</div>

								{/* Milestone Content Card */}
								<div
									className={cn(
										'flex-1 rounded-2xl p-5 sm:p-6 transition-all duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none',
										getStepCardClass(stegaStepStyle),
									)}
								>
									{renderStepCardContent(step, index)}
								</div>
							</li>
						)
					})}
				</ol>
			)}

			{/* =========================================================================
			    LAYOUT 3: GRID (Multi-column Step Cards Matrix)
			    ========================================================================= */}
			{stegaLayout === 'grid' && (
				<ol
					className={cn(
						'list-none p-0 m-0',
						isMobileCarousel &&
							'flex overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid',
						!isMobileCarousel && 'grid gap-6 sm:gap-6 lg:gap-8',
						getGridColsClass(stegaColumns),
					)}
				>
					{steps?.map((step, index) => {
						const isReached = index <= activeStep

						return (
							<li
								key={step._key || `step-${index}`}
								ref={setItemRef(index)}
								data-sanity={stepSanityAttrs[index]}
								className={cn(
									'group relative flex flex-col rounded-2xl transition-all duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none p-5 sm:p-6',
									getStepCardClass(stegaStepStyle),
									isMobileCarousel &&
										'shrink-0 w-[84vw] max-w-[320px] snap-start sm:w-auto sm:max-w-none',
								)}
							>
								{/* Accessible Step Indicator */}
								<span className="sr-only">Step {index + 1}: </span>

								{/* Step Card Header with Number Badge */}
								<div className="flex items-center justify-between gap-3 mb-4">
									<div
										className={cn(
											'flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm sm:text-base font-black transition-all duration-300',
											getNumberBadgeClass(stegaNumberStyle),
											isAnimateTimeline &&
												isReached &&
												'ring-primary/40 shadow-sm',
										)}
										aria-hidden="true"
									>
										<span>{index + 1}</span>
									</div>
								</div>

								{renderStepCardContent(step, index)}
							</li>
						)
					})}
				</ol>
			)}

			{/* =========================================================================
			    LAYOUT 4: VERTICAL (Centered Single-Column Timeline)
			    ========================================================================= */}
			{stegaLayout === 'vertical' && (
				<ol className="relative max-w-3xl mx-auto list-none p-0 m-0 space-y-6 sm:space-y-8">
					{steps?.map((step, index) => {
						const isLast = index === (steps?.length ?? 0) - 1
						const isReached = index <= activeStep
						const isLineFilled = index < activeStep

						return (
							<li
								key={step._key || `step-${index}`}
								ref={setItemRef(index)}
								data-sanity={stepSanityAttrs[index]}
								className="relative flex items-start gap-4 sm:gap-6 group"
							>
								{/* Accessible Step Indicator for Screen Readers */}
								<span className="sr-only">Step {index + 1}: </span>

								{/* Connecting timeline segment between steps */}
								{isConnectorVisible && !isLast && (
									<span
										className={cn(
											'absolute left-[1.125rem] sm:left-[1.375rem] top-10 sm:top-12 bottom-0 -mb-6 sm:-mb-8 w-0.5 transition-all duration-500',
											isAnimateTimeline
												? isLineFilled
													? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]'
													: 'bg-linear-to-b from-primary/30 to-border/40'
												: 'bg-linear-to-b from-primary via-border to-border/40',
										)}
										aria-hidden="true"
									/>
								)}

								{/* Step Number Badge */}
								<div
									className={cn(
										'relative z-10 flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-2xl font-mono text-sm sm:text-base font-black transition-all duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none',
										getNumberBadgeClass(stegaNumberStyle),
										isAnimateTimeline &&
											isReached &&
											'ring-primary/40 shadow-md scale-102',
									)}
									aria-hidden="true"
								>
									<span>{index + 1}</span>
								</div>

								{/* Step Content Card */}
								<div
									className={cn(
										'flex-1 rounded-2xl p-5 sm:p-6 transition-all duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none',
										getStepCardClass(stegaStepStyle),
									)}
								>
									{renderStepCardContent(step, index)}
								</div>
							</li>
						)
					})}
				</ol>
			)}

			{/* Accessible Video Lightbox Modal */}
			<StepVideoLightbox
				isOpen={Boolean(activeVideo)}
				videoUrl={activeVideo?.url || null}
				videoTitle={activeVideo?.title}
				onClose={handleCloseVideo}
			/>
		</>
	)
}
