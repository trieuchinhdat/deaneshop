import Link from 'next/link'
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Info,
	Shield,
	XCircle,
} from 'lucide-react'
import { stegaClean } from 'next-sanity'
import { cn } from '@/lib/utils'

export interface ComparisonTableRow {
	_key?: string
	cells?: string[]
}

export interface ComparisonTableProps {
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

export default function ComparisonTable({
	badge,
	title,
	caption,
	headers = [],
	rows = [],
	highlightedColumnIndex = 1,
	highlightBadge = 'Recommended',
	tableStyle = 'card',
	mobileLayout = 'sticky-column',
	rowDensity = 'comfortable',
	headerAlignment = 'left',
	footnote,
	ctaText,
	ctaLink = '#lead-form',
	ctaStyle = 'primary',
	ctaSubtext,
}: ComparisonTableProps) {
	if (!headers || headers.length === 0) return null

	const cleanBadge = stegaClean(badge)
	const cleanTitle = stegaClean(title)
	const cleanCaption = stegaClean(caption)
	const cleanHighlightBadge = stegaClean(highlightBadge) || 'Recommended'
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
	const cleanHeaderAlign = (stegaClean(headerAlignment) || 'left') as
		| 'center'
		| 'left'
	const cleanFootnote = stegaClean(footnote)
	const cleanCtaText = stegaClean(ctaText)
	const cleanCtaLink = stegaClean(ctaLink) || '#lead-form'
	const cleanCtaStyle = (stegaClean(ctaStyle) || 'primary') as
		| 'primary'
		| 'secondary'
		| 'outline'
	const cleanCtaSubtext = stegaClean(ctaSubtext)

	const highlightIdx =
		typeof highlightedColumnIndex === 'number' ? highlightedColumnIndex : 1

	const densityCellClasses = {
		compact: 'py-2 px-2.5 sm:px-3 text-xs',
		comfortable: 'py-2.5 sm:py-3.5 px-3 sm:px-4 text-xs sm:text-sm',
		spacious: 'py-3.5 sm:py-5 px-3.5 sm:px-5 text-xs sm:text-base',
	}[cleanDensity]

	const densityHeaderClasses = {
		compact: 'py-2.5 px-2.5 sm:px-3 text-xs',
		comfortable: 'py-3 sm:py-3.5 px-3 sm:px-4 text-xs sm:text-sm',
		spacious: 'py-4 sm:py-5 px-3.5 sm:px-5 text-xs sm:text-base',
	}[cleanDensity]

	const renderCellIndicator = (parsed: ParsedCell) => {
		if (parsed.status === 'check') {
			return (
				<CheckCircle2
					className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
					aria-hidden="true"
				/>
			)
		}
		if (parsed.status === 'cross') {
			return (
				<XCircle
					className="size-4 shrink-0 text-rose-600 dark:text-rose-400"
					aria-hidden="true"
				/>
			)
		}
		if (parsed.status === 'warning') {
			return (
				<AlertTriangle
					className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
					aria-hidden="true"
				/>
			)
		}
		return null
	}

	return (
		<figure className="not-prose my-8 space-y-3">
			{/* Table Header Section */}
			{(cleanBadge || cleanTitle || cleanCaption) && (
				<header
					className={cn(
						'space-y-1.5',
						cleanHeaderAlign === 'center' ? 'text-center' : 'text-left',
					)}
				>
					{cleanBadge && (
						<div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold uppercase tracking-wider">
							<Shield className="size-3 shrink-0" aria-hidden="true" />
							<span>{cleanBadge}</span>
						</div>
					)}
					{cleanTitle && (
						<strong className="block text-base sm:text-lg lg:text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
							{cleanTitle}
						</strong>
					)}
					{cleanCaption && (
						<p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
							{cleanCaption}
						</p>
					)}
				</header>
			)}

			{/* Mobile Swipe Hint for Scroll / Sticky Modes */}
			{cleanMobileLayout !== 'cards' && (
				<div
					className="sm:hidden flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 px-1 pt-1"
					aria-hidden="true"
				>
					<span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400 dark:text-zinc-500">
						Technical Matrix
					</span>
					<span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
						<span>Swipe to compare</span>
						<span className="font-mono text-xs">→</span>
					</span>
				</div>
			)}

			{/* Mobile Stacked Feature Cards (When mobileLayout === 'cards') */}
			{cleanMobileLayout === 'cards' && rows.length > 0 && (
				<div className="md:hidden space-y-3">
					{rows.map((row, rowIdx) => {
						const criterion = row.cells?.[0] || `Criterion ${rowIdx + 1}`
						return (
							<div
								key={row._key || rowIdx}
								className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/50"
							>
								<h4 className="font-bold text-zinc-950 dark:text-zinc-50 text-xs sm:text-sm border-b border-zinc-100 pb-2 dark:border-zinc-800">
									{criterion}
								</h4>
								<div className="space-y-1.5">
									{headers.slice(1).map((colHeader, i) => {
										const colIdx = i + 1
										const isHighlighted = highlightIdx === colIdx
										const cellValue = row.cells?.[colIdx] ?? ''
										const parsed = parseCell(cellValue)

										return (
											<div
												key={colIdx}
												className={cn(
													'flex items-center justify-between gap-2.5 text-xs p-2.5 rounded-lg transition-colors',
													isHighlighted
														? 'bg-blue-50/80 border border-blue-200/80 font-medium text-zinc-950 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-zinc-100'
														: 'bg-zinc-50/70 border border-zinc-200/60 text-zinc-700 dark:bg-zinc-950/40 dark:border-zinc-800 dark:text-zinc-300',
												)}
											>
												<div className="flex items-center gap-1.5 min-w-0">
													<span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
														{colHeader}
													</span>
													{isHighlighted && cleanHighlightBadge && (
														<span className="shrink-0 rounded-full bg-blue-600 text-white px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider dark:bg-blue-500">
															{cleanHighlightBadge}
														</span>
													)}
												</div>
												<div className="flex items-center gap-1.5 shrink-0 text-right tabular-nums">
													{renderCellIndicator(parsed)}
													{parsed.displayText && (
														<span
															className={cn(
																parsed.displayText === '—' &&
																	'text-zinc-400 dark:text-zinc-500 font-mono',
															)}
														>
															{parsed.displayText}
														</span>
													)}
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

			{/* Full Table View (Desktop, or on mobile when not in 'cards' mode) */}
			<div
				className={cn(
					'relative group',
					cleanMobileLayout === 'cards' && 'hidden md:block',
				)}
			>
				{/* Mobile Right Edge Overflow Fade */}
				<div
					className="pointer-events-none absolute inset-y-0 right-0 z-30 w-8 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent sm:hidden rounded-r-2xl"
					aria-hidden="true"
				/>
				<div
					tabIndex={0}
					role="region"
					aria-label={cleanTitle || 'Comparison table'}
					className={cn(
						'relative overflow-x-auto scrollbar-thin outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
						cleanTableStyle === 'card' &&
							'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs',
						cleanTableStyle === 'bordered' &&
							'bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl',
						cleanTableStyle === 'minimal' &&
							'bg-transparent border-t border-b border-zinc-200 dark:border-zinc-800 rounded-none',
					)}
				>
					<table
						data-custom-table="true"
						className="w-full border-collapse text-left text-xs sm:text-sm"
					>
						<caption className="sr-only">
							{cleanTitle || 'Comparison table'}
						</caption>
						<thead>
							<tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-900/90">
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
												'font-bold tracking-tight transition-colors',
												isFirstCol
													? 'min-w-[130px] max-w-[170px] sm:min-w-[170px] sm:max-w-none'
													: 'min-w-[120px] sm:min-w-[140px]',
												isStickyCol &&
													'sticky left-0 z-20 bg-zinc-50 dark:bg-zinc-900 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[3px_0_8px_-2px_rgba(0,0,0,0.5)] sm:shadow-none sm:static',
												isHighlighted
													? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
													: 'text-zinc-900 dark:text-zinc-100',
											)}
										>
											<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
												<span className="truncate">{header}</span>
												{isHighlighted && cleanHighlightBadge && (
													<span
														className={cn(
															'inline-flex items-center self-start sm:self-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
															isHighlighted
																? 'bg-blue-600 text-white dark:bg-blue-500'
																: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
														)}
													>
														{cleanHighlightBadge}
													</span>
												)}
											</div>
										</th>
									)
								})}
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-200/80 bg-white dark:divide-zinc-800/80 dark:bg-zinc-950">
							{rows.map((row, rowIdx) => (
								<tr
									key={row._key || rowIdx}
									className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
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
														'font-bold text-zinc-950 dark:text-zinc-50 text-left break-words hyphens-auto transition-colors',
														'min-w-[130px] max-w-[170px] sm:min-w-[170px] sm:max-w-none',
														isStickyCol &&
															'sticky left-0 z-10 bg-white dark:bg-zinc-950 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[3px_0_8px_-2px_rgba(0,0,0,0.5)] sm:shadow-none sm:static',
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
														? 'bg-blue-50/40 dark:bg-blue-950/20 font-medium text-zinc-950 dark:text-zinc-50 border-x border-blue-200/40 dark:border-blue-900/30'
														: 'text-zinc-700 dark:text-zinc-300',
												)}
											>
												<div className="flex items-center gap-1.5 sm:gap-2">
													{renderCellIndicator(parsed)}
													{parsed.displayText && (
														<span
															className={cn(
																'leading-relaxed break-words tabular-nums',
																parsed.displayText === '—' &&
																	'text-zinc-400 dark:text-zinc-500 font-mono',
															)}
														>
															{parsed.displayText}
														</span>
													)}
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

			{/* Footnote / Disclaimer */}
			{cleanFootnote && (
				<figcaption className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 px-1 pt-0.5">
					<Info
						className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500 mt-0.5"
						aria-hidden="true"
					/>
					<span>
						<strong className="font-semibold text-zinc-700 dark:text-zinc-300 not-italic mr-1">
							Verified Benchmark Data:
						</strong>
						<span className="italic">{cleanFootnote}</span>
					</span>
				</figcaption>
			)}

			{/* Call to Action Button */}
			{cleanCtaText && (
				<div className="pt-2 text-center sm:text-left space-y-1.5">
					<Link
						href={cleanCtaLink}
						className={cn(
							'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold tracking-tight transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
							cleanCtaStyle === 'primary' &&
								'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs',
							cleanCtaStyle === 'secondary' &&
								'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
							cleanCtaStyle === 'outline' &&
								'border border-zinc-300 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900',
						)}
					>
						<span>{cleanCtaText}</span>
						<ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
					</Link>
					{cleanCtaSubtext && (
						<p className="text-[11px] text-zinc-500 dark:text-zinc-400">
							{cleanCtaSubtext}
						</p>
					)}
				</div>
			)}
		</figure>
	)
}
