import Link from 'next/link'
import {
	FiAlertTriangle,
	FiArrowRight,
	FiCheckCircle,
	FiInfo,
	FiShield,
	FiXCircle,
} from 'react-icons/fi'
import { stegaClean } from 'next-sanity'
import { cn } from '@/lib/utils'
import { moduleAttributes, type ModuleProps } from '.'

export interface ComparisonTableRow {
	_key?: string
	cells?: string[]
}

export interface ComparisonTableProps extends ModuleProps {
	badge?: string
	title?: string
	caption?: string
	headers?: string[]
	rows?: ComparisonTableRow[]
	highlightedColumnIndex?: number
	highlightBadge?: string
	tableStyle?: 'card' | 'bordered' | 'minimal'
	mobileLayout?: 'sticky-column' | 'cards' | 'scroll'
	rowDensity?: 'compact' | 'comfortable' | 'spacious'
	headerAlignment?: 'center' | 'left'
	footnote?: string
	ctaText?: string
	ctaLink?: string
	ctaStyle?: 'primary' | 'secondary' | 'outline'
	ctaSubtext?: string
	sanityAttr?: any
	'data-sanity'?: string
}

type CellStatus = 'check' | 'cross' | 'warning' | 'neutral'

interface ParsedCell {
	status: CellStatus
	displayText: string
	accessibleLabel: string
	isSelfContainedIcon: boolean
}

function parseCell(rawCell: string | undefined): ParsedCell {
	if (!rawCell || rawCell.trim() === '') {
		return {
			status: 'neutral',
			displayText: '—',
			accessibleLabel: 'Not specified',
			isSelfContainedIcon: false,
		}
	}

	const cleaned = stegaClean(rawCell).trim()
	const lower = cleaned.toLowerCase()

	const hasCheckIcon =
		cleaned.startsWith('✅') ||
		cleaned.startsWith('✓') ||
		cleaned.startsWith('✔')
	const hasCrossIcon =
		cleaned.startsWith('❌') ||
		cleaned.startsWith('✕') ||
		cleaned.startsWith('✖')
	const hasWarnIcon =
		cleaned.startsWith('⚠️') ||
		cleaned.startsWith('!')

	const isExplicitCheck =
		hasCheckIcon ||
		lower === 'yes' ||
		lower === 'true' ||
		lower.startsWith('yes ') ||
		lower.startsWith('yes(') ||
		lower.startsWith('yes -') ||
		lower.startsWith('yes:')
	const isExplicitCross =
		hasCrossIcon ||
		lower === 'no' ||
		lower === 'false' ||
		lower.startsWith('no ') ||
		lower.startsWith('no(') ||
		lower.startsWith('no -') ||
		lower.startsWith('no:')
	const isExplicitWarn =
		hasWarnIcon ||
		lower.startsWith('warn') ||
		lower.startsWith('partial') ||
		lower.startsWith('risk')

	let status: CellStatus = 'neutral'
	if (isExplicitCheck) status = 'check'
	else if (isExplicitCross) status = 'cross'
	else if (isExplicitWarn) status = 'warning'

	// Strip leading emoji or symbol if present
	const textWithoutLeadingEmoji = cleaned
		.replace(/^([✅✓✔❌✕✖⚠️!]\s*)+/u, '')
		.trim()

	// If the cell was just the icon or "yes"/"no", displayText is empty and we rely on accessible icon
	const isSelfContainedIcon = textWithoutLeadingEmoji === ''
	const displayText = isSelfContainedIcon ? '' : textWithoutLeadingEmoji

	let accessibleLabel = cleaned
	if (status === 'check') {
		accessibleLabel = displayText ? `Supported: ${displayText}` : 'Yes, supported'
	} else if (status === 'cross') {
		accessibleLabel = displayText ? `Not supported: ${displayText}` : 'No, not supported'
	} else if (status === 'warning') {
		accessibleLabel = displayText ? `Notice: ${displayText}` : 'Conditional / Warning'
	}

	return {
		status,
		displayText,
		accessibleLabel,
		isSelfContainedIcon,
	}
}

export default function ComparisonTableModule({
	badge = 'Competitive Advantage & ESG Impact',
	title = 'DeanFlow vs. Conventional Solutions',
	caption = 'Engineered for high-performance conversion, seamless integration, and measurable business ROI.',
	headers = ['Key Performance Criteria', 'DeanFlow Platform', 'Conventional Alternative'],
	rows = [],
	highlightedColumnIndex = 1,
	highlightBadge = 'Recommended',
	tableStyle = 'card',
	mobileLayout = 'sticky-column',
	rowDensity = 'comfortable',
	headerAlignment = 'center',
	footnote,
	ctaText = 'Request Technical Sample Kit',
	ctaLink = '#lead-form',
	ctaStyle = 'primary',
	ctaSubtext = 'Complimentary technical sample kit • Expedited dispatch within 24 hours',
	sanityAttr,
	...props
}: ComparisonTableProps) {
	const cleanTableStyle = (stegaClean(tableStyle) || 'card') as
		| 'card'
		| 'bordered'
		| 'minimal'
	const cleanMobileLayout = (stegaClean(mobileLayout) || 'sticky-column') as
		| 'sticky-column'
		| 'cards'
		| 'scroll'
	const cleanDensity = (stegaClean(rowDensity) || 'comfortable') as
		| 'compact'
		| 'comfortable'
		| 'spacious'
	const cleanHeaderAlign = (stegaClean(headerAlignment) || 'center') as
		| 'center'
		| 'left'
	const cleanCtaStyle = (stegaClean(ctaStyle) || 'primary') as
		| 'primary'
		| 'secondary'
		| 'outline'
	const cleanHighlightBadge = stegaClean(highlightBadge) || 'Recommended'
	const cleanCtaLink = stegaClean(ctaLink) || '#lead-form'
	const cleanCtaText = stegaClean(ctaText)
	const cleanCtaSubtext = stegaClean(ctaSubtext)
	const cleanFootnote = stegaClean(footnote)

	const highlightIdx =
		typeof highlightedColumnIndex === 'number' ? highlightedColumnIndex : 1

	// Empty state handler
	if (!headers || headers.length === 0) {
		return (
			<section
				className="section py-12 lg:py-16 text-center"
				{...moduleAttributes(props)}
			>
				<div className="container mx-auto max-w-4xl px-4">
					<div className="rounded-3xl border-2 border-dashed border-border/80 bg-surface/50 p-8 sm:p-12 space-y-3">
						<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<FiShield className="size-6" />
						</div>
						<h3 className="text-base sm:text-lg font-bold text-foreground">
							Us vs. Them Comparison
						</h3>
						<p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
							No comparison headers configured. Open this block in Sanity Studio to define your product differentiators and competitors.
						</p>
					</div>
				</div>
			</section>
		)
	}

	const densityCellClasses = {
		compact: 'py-2.5 px-3 sm:px-4 text-xs',
		comfortable: 'py-3.5 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm',
		spacious: 'py-5 sm:py-6 px-5 sm:px-8 text-sm sm:text-base',
	}[cleanDensity]

	const densityHeaderClasses = {
		compact: 'py-3 px-3 sm:px-4 text-xs',
		comfortable: 'py-4 px-4 sm:px-6 text-xs sm:text-sm',
		spacious: 'py-5 px-5 sm:px-8 text-sm sm:text-base',
	}[cleanDensity]

	const renderCellIndicator = (parsed: ParsedCell) => {
		if (parsed.status === 'check') {
			return (
				<FiCheckCircle
					className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
					aria-hidden="true"
				/>
			)
		}
		if (parsed.status === 'cross') {
			return (
				<FiXCircle
					className="size-4 shrink-0 text-red-600 dark:text-red-400"
					aria-hidden="true"
				/>
			)
		}
		if (parsed.status === 'warning') {
			return (
				<FiAlertTriangle
					className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
					aria-hidden="true"
				/>
			)
		}
		return null
	}

	return (
		<section
			className="section py-12 lg:py-20 relative overflow-hidden"
			{...moduleAttributes(props)}
		>
			<div className="container mx-auto max-w-6xl px-4 sm:px-6">
				{/* Header Section */}
				<header
					className={cn(
						'mb-10 sm:mb-12 space-y-3.5',
						cleanHeaderAlign === 'center'
							? 'text-center max-w-3xl mx-auto'
							: 'text-left max-w-3xl mr-auto',
					)}
				>
					{badge && (
						<div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
							<FiShield className="text-sm shrink-0" aria-hidden="true" />
							<span>{badge}</span>
						</div>
					)}
					<h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
						{title}
					</h2>
					{caption && (
						<p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
							{caption}
						</p>
					)}
				</header>

				{/* Mobile Stacked Feature Cards (When mobileLayout === 'cards') */}
				{cleanMobileLayout === 'cards' && rows.length > 0 && (
					<div className="md:hidden space-y-4 mb-8">
						{rows.map((row, rowIdx) => {
							const criterion = row.cells?.[0] || `Criterion ${rowIdx + 1}`
							return (
								<div
									key={row._key || rowIdx}
									data-sanity={sanityAttr?.scope(`rows[_key=="${row._key}"]`).toString()}
									className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3 shadow-xs"
								>
									<h3 className="font-bold text-foreground text-sm border-b border-border/70 pb-2">
										{criterion}
									</h3>
									<div className="space-y-2">
										{headers.slice(1).map((colHeader, i) => {
											const colIdx = i + 1
											const isHighlighted = highlightIdx === colIdx
											const cellValue = row.cells?.[colIdx] ?? ''
											const parsed = parseCell(cellValue)

											return (
												<div
													key={colIdx}
													className={cn(
														'flex items-center justify-between gap-3 text-xs p-3 rounded-xl transition-colors',
														isHighlighted
															? 'bg-primary/10 border border-primary/25 font-medium text-foreground'
															: 'bg-muted/40 border border-border/40 text-muted-foreground',
													)}
												>
													<div className="flex items-center gap-2 min-w-0">
														<span className="font-bold text-foreground truncate">
															{colHeader}
														</span>
														{isHighlighted && cleanHighlightBadge && (
															<span className="shrink-0 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
																{cleanHighlightBadge}
															</span>
														)}
													</div>
													<div className="flex items-center gap-2 shrink-0">
														{renderCellIndicator(parsed)}
														<span
															className={cn(
																parsed.displayText === '—' &&
																	'text-muted-foreground/40 font-mono',
															)}
														>
															{parsed.displayText}
														</span>
														<span className="sr-only">
															{parsed.accessibleLabel}
														</span>
													</div>
												</div>
											)
										})}
									</div>
								</div>
							)
						})}
					</div>
				)}

				{/* Table Container (Visible on desktop, or on mobile when not in 'cards' mode) */}
				<div
					className={cn(
						cleanMobileLayout === 'cards' && 'hidden md:block',
					)}
				>
					{/* Mobile Horizontal Swipe Prompt for Scroll / Sticky Modes */}
					{cleanMobileLayout !== 'cards' && (
						<div
							className="sm:hidden flex items-center justify-end gap-1 pb-2 text-[11px] font-medium text-muted-foreground"
							aria-hidden="true"
						>
							<span>Swipe to compare</span>
							<span className="font-mono text-xs">→</span>
						</div>
					)}

					<div
						tabIndex={0}
						role="region"
						aria-label={title || 'Product and competitor comparison matrix'}
						className={cn(
							'overflow-x-auto transition-all scrollbar-thin outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
							cleanTableStyle === 'card' &&
								'bg-surface border border-border rounded-2xl shadow-xl shadow-foreground/5',
							cleanTableStyle === 'bordered' &&
								'bg-background border-2 border-border/80 rounded-2xl',
							cleanTableStyle === 'minimal' &&
								'bg-transparent border-t border-b border-border rounded-none',
						)}
					>
						<table className="w-full min-w-[580px] sm:min-w-[620px] border-collapse text-left text-xs sm:text-sm">
							<caption className="sr-only">
								{title || 'Comparison Table'}
							</caption>
							<thead>
								<tr className="border-b border-border/80 bg-muted/50">
									{headers.map((header, idx) => {
										const isHighlighted = highlightIdx === idx
										const isFirstCol = idx === 0
										const isStickyCol =
											isFirstCol && cleanMobileLayout === 'sticky-column'

										return (
											<th
												key={idx}
												scope="col"
												className={cn(
													densityHeaderClasses,
													'font-extrabold transition-colors',
													isStickyCol &&
														'sticky left-0 z-20 bg-muted/95 backdrop-blur-xs sm:static shadow-[3px_0_10px_-2px_rgba(0,0,0,0.06)] dark:shadow-[3px_0_10px_-2px_rgba(0,0,0,0.4)] sm:shadow-none',
													isHighlighted
														? 'bg-primary text-primary-foreground shadow-sm'
														: 'text-foreground',
												)}
											>
												<div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
													<span>{header}</span>
													{isHighlighted && cleanHighlightBadge && (
														<span className="inline-flex items-center self-start sm:self-auto rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-xs">
															{cleanHighlightBadge}
														</span>
													)}
												</div>
											</th>
										)
									})}
								</tr>
							</thead>
							<tbody className="divide-y divide-border/60">
								{rows.map((row, rowIdx) => (
									<tr
										key={row._key || rowIdx}
										data-sanity={sanityAttr?.scope(`rows[_key=="${row._key}"]`).toString()}
										className="transition-colors hover:bg-muted/30 motion-reduce:transition-none"
									>
										{headers.map((_, colIdx) => {
											const cellValue = row.cells?.[colIdx] ?? ''
											const isHighlighted = highlightIdx === colIdx
											const isFirstCol = colIdx === 0
											const isStickyCol =
												isFirstCol && cleanMobileLayout === 'sticky-column'
											const parsed = parseCell(cellValue)

											if (isFirstCol) {
												return (
													<th
														key={colIdx}
														scope="row"
														className={cn(
															densityCellClasses,
															'font-bold text-foreground text-left transition-colors',
															isStickyCol &&
																'sticky left-0 z-10 bg-surface/95 backdrop-blur-xs sm:static shadow-[3px_0_10px_-2px_rgba(0,0,0,0.06)] dark:shadow-[3px_0_10px_-2px_rgba(0,0,0,0.4)] sm:shadow-none',
														)}
													>
														{parsed.displayText}
													</th>
												)
											}

											return (
												<td
													key={colIdx}
													className={cn(
														densityCellClasses,
														'tabular-nums transition-colors',
														isHighlighted
															? 'bg-primary/[0.04] dark:bg-primary/[0.08] font-semibold text-foreground border-x border-primary/15 dark:border-primary/25'
															: 'text-muted-foreground',
													)}
												>
													<div className="flex items-center gap-2 tabular-nums">
														{renderCellIndicator(parsed)}
														<span
															className={cn(
																'tabular-nums',
																parsed.displayText === '—' &&
																	'text-muted-foreground/40 font-mono',
															)}
														>
															{parsed.displayText}
														</span>
														<span className="sr-only">
															{parsed.accessibleLabel}
														</span>
													</div>
												</td>
											)
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Verification Footnote / Legal Disclaimer */}
				{cleanFootnote && (
					<div className="mt-4 sm:mt-5 flex items-start gap-2 text-xs text-muted-foreground leading-relaxed px-1">
						<FiInfo
							className="size-4 shrink-0 text-muted-foreground/80 mt-0.5"
							aria-hidden="true"
						/>
						<p>{cleanFootnote}</p>
					</div>
				)}

				{/* Call to Action Footer */}
				{cleanCtaText && (
					<div className="mt-8 lg:mt-12 text-center space-y-2.5">
						<div>
							<Link
								href={cleanCtaLink}
								className={cn(
									'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-7 py-3 text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
									cleanCtaStyle === 'primary' &&
										'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 hover:shadow-lg hover:shadow-primary/25',
									cleanCtaStyle === 'secondary' &&
										'bg-secondary text-secondary-foreground hover:opacity-95 shadow-sm',
									cleanCtaStyle === 'outline' &&
										'border-2 border-primary text-primary hover:bg-primary/5',
								)}
							>
								<span>{cleanCtaText}</span>
								<FiArrowRight
									className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
									aria-hidden="true"
								/>
							</Link>
						</div>
						{cleanCtaSubtext && (
							<p className="text-xs text-muted-foreground tracking-normal font-medium max-w-md mx-auto">
								{cleanCtaSubtext}
							</p>
						)}
					</div>
				)}
			</div>
		</section>
	)
}

