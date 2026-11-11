import { PortableText, stegaClean } from 'next-sanity'
import { serializeJsonLd } from '@/lib/json-ld'
import { cn, getBlockText } from '@/lib/utils'
import type { AccordionList } from '@/sanity/types'
import CTAList from '@/ui/cta-list'
import { moduleAttributes, type ModuleProps } from '.'
import AccordionListClient, {
	type AccordionItemData,
	type AccordionSupportCard,
} from './accordion-list-client'

export type EnhancedAccordionList = AccordionList & {
	items?: AccordionItemData[]
	headerAlign?: 'center' | 'left'
	accordionStyle?: 'card' | 'separated' | 'contained'
	iconStyle?: 'chevron' | 'plus-minus'
	containerStyle?: 'plain' | 'boxed' | 'tinted'
	spacing?: 'default' | 'compact' | 'spacious' | 'none'
	defaultOpen?: 'first' | 'none' | 'all' | 'custom'
	showSearch?: boolean
	searchPlaceholder?: string
	showExpandAll?: boolean
	supportCard?: AccordionSupportCard
}

function getSpacingClass(sp: string) {
	switch (sp) {
		case 'compact':
			return 'py-8 lg:py-12'
		case 'spacious':
			return 'py-16 lg:py-28'
		case 'none':
			return 'py-0'
		default:
			return 'py-12 lg:py-20'
	}
}

export default function AccordionListModule({
	_key: _module_key,
	badge,
	intro,
	ctas,
	accordions,
	items: legacyItems,
	exclusive = false,
	enableSchema = true,
	layout: rawLayout,
	headerAlign: rawHeaderAlign,
	accordionStyle: rawAccordionStyle,
	iconStyle: rawIconStyle,
	containerStyle: rawContainerStyle,
	spacing: rawSpacing,
	defaultOpen: rawDefaultOpen,
	showSearch: rawShowSearch,
	searchPlaceholder: rawSearchPlaceholder,
	showExpandAll: rawShowExpandAll,
	supportCard: rawSupportCard,
	sanityAttr,
	...props
}: EnhancedAccordionList & ModuleProps & { _key: string; sanityAttr?: any }) {
	// Clean stega characters for safe CSS class mapping and condition evaluation
	const cleanLayout = (stegaClean(rawLayout) || 'vertical') as
		| 'vertical'
		| 'horizontal'
		| 'grid'
	const cleanHeaderAlign = (stegaClean(rawHeaderAlign) || 'center') as
		| 'center'
		| 'left'
	const cleanAccordionStyle = (stegaClean(rawAccordionStyle) || 'card') as
		| 'card'
		| 'separated'
		| 'contained'
	const cleanIconStyle = (stegaClean(rawIconStyle) || 'chevron') as
		| 'chevron'
		| 'plus-minus'
	const cleanContainerStyle = (stegaClean(rawContainerStyle) || 'plain') as
		| 'plain'
		| 'boxed'
		| 'tinted'
	const cleanSpacing = (stegaClean(rawSpacing) || 'default') as
		| 'default'
		| 'compact'
		| 'spacious'
		| 'none'
	const isExclusive = Boolean(stegaClean(exclusive))
	const cleanDefaultOpen = (stegaClean(rawDefaultOpen) || 'first') as
		| 'first'
		| 'none'
		| 'all'
		| 'custom'
	const showSearch = Boolean(stegaClean(rawShowSearch))
	const searchPlaceholder =
		stegaClean(rawSearchPlaceholder) || 'Search questions, terms, or topics...'
	const showExpandAll = Boolean(stegaClean(rawShowExpandAll))
	const isSchemaEnabled = Boolean(stegaClean(enableSchema) ?? true)
	const sectionBadge = stegaClean(badge)

	// Backward compatibility: support both accordions and legacy items arrays
	const rawItems: AccordionItemData[] = accordions || legacyItems || []

	// Generate Google-compliant FAQPage JSON-LD
	const schemaLd =
		isSchemaEnabled && rawItems.length > 0
			? {
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: rawItems
						.filter((item) => item?.summary && item?.content)
						.map((item) => ({
							'@type': 'Question',
							name: item.summary,
							acceptedAnswer: {
								'@type': 'Answer',
								text: getBlockText(item.content, ' ').trim(),
							},
						})),
				}
			: null

	// Sanity Studio Presentation / Click-to-edit attribute scopes
	const itemSanityAttrs = rawItems.map((item) => {
		if (!sanityAttr || !item?._key) return undefined
		const arrayField = accordions ? 'accordions' : 'items'
		return sanityAttr.scope(`${arrayField}[_key=="${item._key}"]`).toString()
	})

	const isBoxed = cleanContainerStyle === 'boxed'
	const isTinted = cleanContainerStyle === 'tinted'
	const isHeaderCentered = cleanHeaderAlign === 'center'

	// Render section header block
	const renderHeader = (centered: boolean, sticky = false) => {
		if (!intro?.length && !sectionBadge && (!ctas || ctas.length === 0))
			return null

		return (
			<header
				className={cn(
					'space-y-4 sm:space-y-5',
					centered ? 'text-center' : 'text-left',
					sticky && 'lg:sticky lg:top-24 self-start',
				)}
			>
				{sectionBadge && (
					<div>
						<span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-primary uppercase ring-1 ring-primary/20 ring-inset">
							{sectionBadge}
						</span>
					</div>
				)}

				{intro && intro.length > 0 && (
					<div
						className={cn(
							'prose dark:prose-invert max-w-none text-foreground prose-headings:tracking-tight',
							centered && 'mx-auto',
						)}
					>
						<PortableText value={intro} />
					</div>
				)}

				{ctas && ctas.length > 0 && (
					<div
						className={cn(
							'pt-2 flex flex-wrap gap-3',
							centered ? 'justify-center' : 'justify-start',
						)}
					>
						<CTAList
							ctas={ctas}
							className={centered ? 'justify-center' : undefined}
						/>
					</div>
				)}
			</header>
		)
	}

	return (
		<section
			className={cn('section', getSpacingClass(cleanSpacing))}
			{...moduleAttributes({ _key: _module_key, ...props })}
		>
			{/* Google FAQPage JSON-LD Structured Data */}
			{schemaLd && (
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemaLd) }}
				/>
			)}

			<div
				className={cn(
					'w-full',
					isBoxed &&
						'rounded-3xl border border-border/70 bg-surface/60 dark:bg-zinc-900/40 p-6 sm:p-10 lg:p-14 shadow-2xs',
					isTinted &&
						'rounded-3xl bg-muted/30 dark:bg-zinc-900/30 border border-border/40 p-6 sm:p-10 lg:p-14',
				)}
			>
				{/* =========================================================================
				    LAYOUT 1: HORIZONTAL (2-Column Split: Intro Left, Questions Right)
				    ========================================================================= */}
				{cleanLayout === 'horizontal' ? (
					<div className="grid items-start gap-10 lg:gap-14 lg:grid-cols-12">
						<div className="lg:col-span-5">{renderHeader(false, true)}</div>
						<div className="lg:col-span-7">
							<AccordionListClient
								moduleKey={_module_key}
								items={rawItems}
								layout="horizontal"
								accordionStyle={cleanAccordionStyle}
								iconStyle={cleanIconStyle}
								exclusive={isExclusive}
								defaultOpen={cleanDefaultOpen}
								showSearch={showSearch}
								searchPlaceholder={searchPlaceholder}
								showExpandAll={showExpandAll}
								supportCard={rawSupportCard}
								itemSanityAttrs={itemSanityAttrs}
							/>
						</div>
					</div>
				) : cleanLayout === 'grid' ? (
					/* =========================================================================
					    LAYOUT 2: TWO-COLUMN GRID (Questions in 2 balanced columns on desktop)
					    ========================================================================= */
					<div className="mx-auto max-w-6xl">
						<div className="mb-8 sm:mb-12">
							{renderHeader(isHeaderCentered)}
						</div>
						<AccordionListClient
							moduleKey={_module_key}
							items={rawItems}
							layout="grid"
							accordionStyle={cleanAccordionStyle}
							iconStyle={cleanIconStyle}
							exclusive={isExclusive}
							defaultOpen={cleanDefaultOpen}
							showSearch={showSearch}
							searchPlaceholder={searchPlaceholder}
							showExpandAll={showExpandAll}
							supportCard={rawSupportCard}
							itemSanityAttrs={itemSanityAttrs}
						/>
					</div>
				) : (
					/* =========================================================================
					    LAYOUT 3: VERTICAL (Single Column Centered or Left - Default)
					    ========================================================================= */
					<div className="mx-auto max-w-3xl">
						<div className="mb-8 sm:mb-12">
							{renderHeader(isHeaderCentered)}
						</div>
						<AccordionListClient
							moduleKey={_module_key}
							items={rawItems}
							layout="vertical"
							accordionStyle={cleanAccordionStyle}
							iconStyle={cleanIconStyle}
							exclusive={isExclusive}
							defaultOpen={cleanDefaultOpen}
							showSearch={showSearch}
							searchPlaceholder={searchPlaceholder}
							showExpandAll={showExpandAll}
							supportCard={rawSupportCard}
							itemSanityAttrs={itemSanityAttrs}
						/>
					</div>
				)}
			</div>
		</section>
	)
}
