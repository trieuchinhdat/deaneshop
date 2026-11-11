import { PortableText, stegaClean } from 'next-sanity'
import { serializeJsonLd } from '@/lib/json-ld'
import { cn, getBlockText } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import type { StepList } from '@/sanity/types'
import CTAList from '@/ui/cta-list'
import { moduleAttributes, type ModuleProps } from '.'
import StepListInteractive, { type EnhancedStep } from './step-list-client'

type EnhancedStepList = Omit<StepList, 'steps'> & {
	badge?: string
	layout?: 'split' | 'horizontal' | 'grid' | 'vertical'
	columns?: number
	mobileLayout?: 'stack' | 'carousel'
	headerAlign?: 'left' | 'center'
	containerStyle?: 'plain' | 'boxed'
	spacing?: 'default' | 'compact' | 'spacious' | 'none'
	stepStyle?: 'card' | 'elevated' | 'minimal' | 'outline'
	numberStyle?: 'brand' | 'neutral' | 'outline' | 'gradient'
	showConnector?: boolean
	animateTimeline?: boolean
	steps?: EnhancedStep[]
}

// Safe block text extraction
function safeGetBlockText(blocks?: any[]): string {
	if (!blocks || !blocks.length) return ''
	try {
		return getBlockText(blocks as any) || ''
	} catch {
		return ''
	}
}

// Extract first heading or text line from PortableText blocks
function getFirstHeadingOrText(blocks?: any[]): string {
	if (!blocks || !blocks.length) return ''
	const headingBlock = blocks.find((b) => b.style === 'h2' || b.style === 'h3')
	if (headingBlock) return safeGetBlockText([headingBlock])
	return safeGetBlockText([blocks[0]])
}

// Extract clean description for Schema.org HowTo
function getStepDescription(step: EnhancedStep): string {
	if (step.title) {
		return safeGetBlockText(step.content)
	}
	if (!step.content || !step.content.length) return ''
	if (
		step.content.length > 1 &&
		(step.content[0].style === 'h3' || step.content[0].style === 'h2')
	) {
		return safeGetBlockText(step.content.slice(1))
	}
	return safeGetBlockText(step.content)
}

export default function StepListModule({
	badge,
	intro = [],
	ctas,
	steps,
	layout = 'split',
	columns = 3,
	mobileLayout = 'stack',
	headerAlign = 'left',
	containerStyle = 'plain',
	spacing = 'default',
	stepStyle = 'card',
	numberStyle = 'brand',
	showConnector = true,
	animateTimeline = true,
	enableSchema = true,
	sanityAttr,
	...props
}: EnhancedStepList & ModuleProps & { sanityAttr?: any }) {
	// Clean stega characters for safe CSS class mapping
	const stegaLayout = (stegaClean(layout) || 'split') as
		| 'split'
		| 'horizontal'
		| 'grid'
		| 'vertical'
	const stegaColumns = Number(stegaClean(columns)) || 3
	const stegaMobileLayout = (stegaClean(mobileLayout) || 'stack') as
		| 'stack'
		| 'carousel'
	const stegaHeaderAlign = (stegaClean(headerAlign) || 'left') as
		| 'left'
		| 'center'
	const stegaContainer = (stegaClean(containerStyle) || 'plain') as
		| 'plain'
		| 'boxed'
	const stegaSpacing = (stegaClean(spacing) || 'default') as
		| 'default'
		| 'compact'
		| 'spacious'
		| 'none'
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
	const isSchemaEnabled = Boolean(stegaClean(enableSchema) ?? true)

	const isBoxed = stegaContainer === 'boxed'
	const isHeaderCentered = stegaHeaderAlign === 'center'

	// Section vertical spacing helper
	const getSpacingClass = (sp: string) => {
		switch (sp) {
			case 'compact':
				return 'py-8 lg:py-12'
			case 'spacious':
				return 'py-16 lg:py-28'
			case 'none':
				return 'py-0'
			case 'default':
			default:
				return 'py-12 lg:py-20'
		}
	}

	// Text extractions for JSON-LD HowTo schema
	const sectionBadge = stegaClean(badge)
	const sectionTitle = intro?.length ? getFirstHeadingOrText(intro) : ''
	const sectionDesc =
		intro?.length && intro.length > 1
			? safeGetBlockText(intro.filter((b) => b.style !== 'h2' && b.style !== 'h3'))
			: ''

	// Google Search Central validated HowTo JSON-LD
	const schemaLd =
		isSchemaEnabled && steps && steps.length > 0
			? {
					'@context': 'https://schema.org',
					'@type': 'HowTo',
					name: sectionBadge || sectionTitle || 'How It Works',
					description: sectionDesc || undefined,
					step: steps.map((step, idx) => {
						const stepName =
							stegaClean(step.title) ||
							getFirstHeadingOrText(step.content) ||
							`Step ${idx + 1}`
						const stepDesc = getStepDescription(step)
						const stepImageUrl = step.image?.asset
							? urlFor(step.image).url()
							: undefined
						return {
							'@type': 'HowToStep',
							position: idx + 1,
							name: stepName,
							text: stepDesc || stepName,
							...(stepImageUrl ? { image: stepImageUrl } : {}),
						}
					}),
				}
			: null

	// Serializable step sanity attributes for Visual Editing
	const stepSanityAttrs = steps?.map((step) =>
		step._key && sanityAttr
			? sanityAttr.scope(`steps[_key=="${step._key}"]`).toString()
			: undefined,
	)

	// Render Header Block (Eyebrow Badge, Heading, Copy, CTAs)
	const renderHeader = (centered: boolean = false) => {
		const hasIntro = intro && intro.length > 0
		const hasCtas = ctas && ctas.length > 0
		if (!sectionBadge && !hasIntro && !hasCtas) return null

		return (
			<header
				className={cn(
					'space-y-4',
					centered
						? 'text-center mx-auto max-w-3xl mb-12 lg:mb-16'
						: 'max-w-2xl mb-10 sm:mb-12 lg:mb-16',
				)}
			>
				{sectionBadge && (
					<div>
						<span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-primary uppercase ring-1 ring-primary/20 ring-inset">
							{sectionBadge}
						</span>
					</div>
				)}
				{hasIntro && (
					<div className="prose dark:prose-invert max-w-none">
						<PortableText value={intro} />
					</div>
				)}
				{hasCtas && (
					<div className={cn('pt-2', centered && 'flex justify-center')}>
						<CTAList ctas={ctas} />
					</div>
				)}
			</header>
		)
	}

	return (
		<section
			className={cn('section', getSpacingClass(stegaSpacing))}
			{...moduleAttributes(props)}
		>
			{/* Schema.org HowTo JSON-LD without DOM duplication */}
			{schemaLd && (
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemaLd) }}
				/>
			)}

			<div
				className={cn(
					isBoxed &&
						'rounded-3xl border border-border/70 bg-surface/50 dark:bg-zinc-900/30 p-6 sm:p-10 lg:p-14 shadow-2xs',
				)}
			>
				{/* =========================================================================
				    LAYOUT 1: SPLIT (Two-Column Editorial Sticky Layout - Default)
				    ========================================================================= */}
				{stegaLayout === 'split' ? (
					<div className="grid items-start gap-10 lg:gap-14 lg:grid-cols-12">
						{/* Sticky Editorial Intro Column (Server-rendered) */}
						<header className="lg:col-span-5 lg:sticky lg:top-24 space-y-6 self-start">
							{sectionBadge && (
								<div>
									<span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-primary uppercase ring-1 ring-primary/20 ring-inset">
										{sectionBadge}
									</span>
								</div>
							)}
							{intro && intro.length > 0 && (
								<div className="prose dark:prose-invert max-w-none">
									<PortableText value={intro} />
								</div>
							)}
							{ctas && ctas.length > 0 && (
								<div className="pt-2">
									<CTAList ctas={ctas} />
								</div>
							)}
						</header>

						{/* Interactive Steps List (Client-hydrated with scroll animation & video) */}
						<StepListInteractive
							steps={steps}
							layout="split"
							stepStyle={stegaStepStyle}
							numberStyle={stegaNumberStyle}
							showConnector={isConnectorVisible}
							animateTimeline={isAnimateTimeline}
							stepSanityAttrs={stepSanityAttrs}
						/>
					</div>
				) : (
					/* =========================================================================
					    LAYOUTS 2, 3, 4: HORIZONTAL, GRID, VERTICAL
					    ========================================================================= */
					<div>
						{renderHeader(stegaLayout === 'vertical' || isHeaderCentered)}

						<StepListInteractive
							steps={steps}
							layout={stegaLayout}
							columns={stegaColumns}
							mobileLayout={stegaMobileLayout}
							headerAlign={stegaHeaderAlign}
							stepStyle={stegaStepStyle}
							numberStyle={stegaNumberStyle}
							showConnector={isConnectorVisible}
							animateTimeline={isAnimateTimeline}
							stepSanityAttrs={stepSanityAttrs}
						/>
					</div>
				)}
			</div>
		</section>
	)
}
