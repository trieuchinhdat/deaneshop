'use client'

import {
	useCallback,
	useId,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
} from 'react'
import {
	ChevronDown,
	CreditCard,
	FileCheck,
	Globe,
	CircleHelp,
	Leaf,
	Minus,
	Package,
	Plus,
	RotateCcw,
	Search,
	ShieldCheck,
	Sparkles,
	Truck,
	X,
} from 'lucide-react'
import { PortableText, stegaClean } from 'next-sanity'
import { cn, getBlockText } from '@/lib/utils'

export type AccordionItemData = {
	_key?: string
	summary?: string
	badge?: string
	iconPreset?: string
	content?: any[]
	open?: boolean
}

export type AccordionSupportCard = {
	enabled?: boolean
	title?: string
	description?: string
	linkText?: string
	linkUrl?: string
}

export interface AccordionListClientProps {
	moduleKey?: string
	items: AccordionItemData[]
	layout?: 'vertical' | 'horizontal' | 'grid'
	accordionStyle?: 'card' | 'separated' | 'contained'
	iconStyle?: 'chevron' | 'plus-minus'
	exclusive?: boolean
	defaultOpen?: 'first' | 'none' | 'all' | 'custom'
	showSearch?: boolean
	searchPlaceholder?: string
	showExpandAll?: boolean
	supportCard?: AccordionSupportCard
	itemSanityAttrs?: (string | undefined)[]
}

// Render clean, high-utility Lucide preset icons
function renderPresetIcon(name?: string) {
	if (!name || name === 'none') return null
	const iconProps = {
		className: 'size-4.5 sm:size-5 shrink-0 text-primary',
		'aria-hidden': true,
	}

	switch (name) {
		case 'help':
			return <CircleHelp {...iconProps} />
		case 'shield':
			return <ShieldCheck {...iconProps} />
		case 'truck':
			return <Truck {...iconProps} />
		case 'credit-card':
			return <CreditCard {...iconProps} />
		case 'refresh':
			return <RotateCcw {...iconProps} />
		case 'package':
			return <Package {...iconProps} />
		case 'leaf':
			return <Leaf {...iconProps} />
		case 'globe':
			return <Globe {...iconProps} />
		case 'sparkles':
			return <Sparkles {...iconProps} />
		case 'fileCheck':
			return <FileCheck {...iconProps} />
		default:
			return null
	}
}

export default function AccordionListClient({
	moduleKey,
	items,
	layout = 'vertical',
	accordionStyle = 'card',
	iconStyle = 'chevron',
	exclusive = false,
	defaultOpen = 'first',
	showSearch = false,
	searchPlaceholder = 'Search questions, terms, or topics...',
	showExpandAll = false,
	supportCard,
	itemSanityAttrs = [],
}: AccordionListClientProps) {
	const baseId = useId()
	const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

	// Stega clean all control props
	const cleanLayout = (stegaClean(layout) || 'vertical') as
		| 'vertical'
		| 'horizontal'
		| 'grid'
	const cleanStyle = (stegaClean(accordionStyle) || 'card') as
		| 'card'
		| 'separated'
		| 'contained'
	const cleanIconStyle = (stegaClean(iconStyle) || 'chevron') as
		| 'chevron'
		| 'plus-minus'
	const isExclusive = Boolean(stegaClean(exclusive))
	const cleanDefaultOpen = (stegaClean(defaultOpen) || 'first') as
		| 'first'
		| 'none'
		| 'all'
		| 'custom'
	const hasSearch = Boolean(stegaClean(showSearch))
	const hasExpandAll = Boolean(stegaClean(showExpandAll))

	// Search query state
	const [searchQuery, setSearchQuery] = useState('')

	// Initial open keys calculation
	const initialOpenKeys = useMemo(() => {
		const keys = new Set<string>()
		items.forEach((item, index) => {
			const itemKey = item._key || `item-${index}`
			if (cleanDefaultOpen === 'all') {
				keys.add(itemKey)
			} else if (cleanDefaultOpen === 'first' && index === 0) {
				keys.add(itemKey)
			} else if (cleanDefaultOpen === 'custom' && item.open) {
				keys.add(itemKey)
			}
		})
		return keys
	}, [items, cleanDefaultOpen])

	// Active open keys state
	const [openKeys, setOpenKeys] = useState<Set<string>>(initialOpenKeys)

	// Filtered items based on live search
	const filteredItems = useMemo(() => {
		const query = searchQuery.trim().toLowerCase()
		if (!query) return items

		return items.filter((item) => {
			const summary = (item.summary || '').toLowerCase()
			const badge = (item.badge || '').toLowerCase()
			const bodyText = getBlockText(item.content, ' ').toLowerCase()
			return (
				summary.includes(query) ||
				badge.includes(query) ||
				bodyText.includes(query)
			)
		})
	}, [items, searchQuery])

	// Automatically open matching items when user is actively searching
	const isSearching = searchQuery.trim().length > 0

	const isItemOpen = useCallback(
		(key: string) => {
			if (isSearching) return true
			return openKeys.has(key)
		},
		[isSearching, openKeys],
	)

	// Toggle individual accordion item
	const toggleItem = useCallback(
		(key: string) => {
			if (isSearching) return

			setOpenKeys((prev) => {
				const next = new Set(prev)
				if (next.has(key)) {
					next.delete(key)
				} else {
					if (isExclusive) {
						next.clear()
					}
					next.add(key)
				}
				return next
			})
		},
		[isSearching, isExclusive],
	)

	// Toggle Expand All / Collapse All
	const allExpanded = useMemo(() => {
		if (filteredItems.length === 0) return false
		return filteredItems.every((item, i) =>
			openKeys.has(item._key || `item-${i}`),
		)
	}, [filteredItems, openKeys])

	const handleToggleAll = useCallback(() => {
		if (allExpanded) {
			setOpenKeys(new Set())
		} else {
			const allKeys = new Set(
				filteredItems.map((item, i) => item._key || `item-${i}`),
			)
			setOpenKeys(allKeys)
		}
	}, [allExpanded, filteredItems])

	// Keyboard navigation per W3C APG Accordion pattern
	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
			const total = filteredItems.length
			if (total <= 1) return

			let targetIndex: number | null = null

			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault()
					targetIndex = (currentIndex + 1) % total
					break
				case 'ArrowUp':
					event.preventDefault()
					targetIndex = (currentIndex - 1 + total) % total
					break
				case 'Home':
					event.preventDefault()
					targetIndex = 0
					break
				case 'End':
					event.preventDefault()
					targetIndex = total - 1
					break
			}

			if (targetIndex !== null && buttonRefs.current[targetIndex]) {
				buttonRefs.current[targetIndex]?.focus()
			}
		},
		[filteredItems.length],
	)

	// Support Card configuration
	const isSupportCardVisible = Boolean(
		stegaClean(supportCard?.enabled) ?? false,
	)

	return (
		<div className="w-full">
			{/* Utility Bar: Live Search & Expand All */}
			{(hasSearch || (hasExpandAll && filteredItems.length > 1)) && (
				<div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					{/* Live Search Input */}
					{hasSearch && (
						<div className="relative flex-1 max-w-md">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
								<Search className="size-4" aria-hidden="true" />
							</div>
							<input
								type="search"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={searchPlaceholder}
								aria-label="Search questions"
								className="w-full rounded-xl border border-border/70 bg-surface dark:bg-zinc-900/60 pl-10 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all shadow-2xs"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery('')}
									aria-label="Clear search query"
									className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
								>
									<X className="size-4" />
								</button>
							)}
						</div>
					)}

					{/* Expand All / Collapse All Action */}
					{hasExpandAll && !isSearching && filteredItems.length > 1 && (
						<div className="flex items-center sm:ml-auto">
							<button
								type="button"
								onClick={handleToggleAll}
								className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
							>
								{allExpanded ? (
									<>
										<Minus className="size-3.5" aria-hidden="true" />
										<span>Collapse all</span>
									</>
								) : (
									<>
										<Plus className="size-3.5" aria-hidden="true" />
										<span>Expand all</span>
									</>
								)}
							</button>
						</div>
					)}
				</div>
			)}

			{/* Search Results Feedback Counter */}
			{isSearching && (
				<div className="mb-4 flex items-center justify-between text-xs text-muted-foreground px-1">
					<span>
						Showing {filteredItems.length} matching question
						{filteredItems.length === 1 ? '' : 's'}
					</span>
					<button
						type="button"
						onClick={() => setSearchQuery('')}
						className="underline underline-offset-2 hover:text-foreground transition-colors"
					>
						Reset filter
					</button>
				</div>
			)}

			{/* Empty State when no questions match search */}
			{isSearching && filteredItems.length === 0 && (
				<div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center sm:p-12">
					<CircleHelp className="mx-auto size-8 text-muted-foreground/60" />
					<h3 className="mt-3 text-sm sm:text-base font-semibold text-foreground">
						No matching questions found
					</h3>
					<p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
						We couldn&apos;t find any questions matching &ldquo;{searchQuery}
						&rdquo;. Try searching with different keywords.
					</p>
					<div className="mt-4">
						<button
							type="button"
							onClick={() => setSearchQuery('')}
							className="inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90 transition-colors shadow-2xs"
						>
							View all questions
						</button>
					</div>
				</div>
			)}

			{/* Accordion List Container */}
			<div
				className={cn(
					cleanLayout === 'grid' &&
						'grid grid-cols-1 md:grid-cols-2 gap-4 items-start',
					cleanLayout !== 'grid' &&
						cleanStyle === 'card' &&
						'space-y-3 sm:space-y-3.5',
					cleanLayout !== 'grid' && cleanStyle === 'separated' && 'divide-y-0',
					cleanLayout !== 'grid' &&
						cleanStyle === 'contained' &&
						'rounded-2xl border border-border/70 bg-surface dark:bg-zinc-900/70 divide-y divide-border/60 shadow-2xs overflow-hidden',
				)}
			>
				{filteredItems.map((item, index) => {
					const itemKey = item._key || `item-${index}`
					const isOpen = isItemOpen(itemKey)
					const headerId = `${baseId}-header-${itemKey}`
					const panelId = `${baseId}-panel-${itemKey}`
					const sanityAttr = itemSanityAttrs[index]
					const iconPreset = stegaClean(item.iconPreset)

					return (
						<div
							key={itemKey}
							data-sanity={sanityAttr}
							data-open={isOpen}
							className={cn(
								'transition-all duration-200',
								// Card style
								cleanStyle === 'card' && [
									'rounded-2xl border border-border/70 bg-surface dark:bg-zinc-900/70 px-5 sm:px-6 shadow-2xs',
									'hover:border-border hover:shadow-xs',
									isOpen &&
										'border-primary/40 dark:border-primary/40 shadow-sm ring-1 ring-primary/10',
								],
								// Separated style
								cleanStyle === 'separated' && [
									'border-b border-border/60 px-1 sm:px-2 py-1',
									index === 0 && 'border-t',
								],
								// Contained style
								cleanStyle === 'contained' && [
									'px-5 sm:px-6 py-1',
									isOpen && 'bg-muted/15 dark:bg-zinc-800/20',
								],
							)}
						>
							{/* Accordion Trigger Header */}
							<h3 className="m-0 p-0 text-left font-normal">
								<button
									ref={(el) => {
										buttonRefs.current[index] = el
									}}
									type="button"
									id={headerId}
									aria-expanded={isOpen}
									aria-controls={panelId}
									onClick={() => toggleItem(itemKey)}
									onKeyDown={(e) => handleKeyDown(e, index)}
									className={cn(
										'group flex w-full items-center justify-between gap-4 py-4 sm:py-4.5 min-h-[52px] text-left cursor-pointer select-none',
										'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 rounded-xl',
									)}
								>
									{/* Question Label & Topic Badge */}
									<div className="flex items-center gap-3 pr-2 flex-1 min-w-0">
										{renderPresetIcon(iconPreset)}
										<div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 flex-1 min-w-0">
											<span className="text-sm sm:text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors tracking-tight">
												{item.summary}
											</span>
											{item.badge && (
												<span className="inline-flex self-start sm:self-center shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border/50">
													{item.badge}
												</span>
											)}
										</div>
									</div>

									{/* Expand / Collapse Indicator */}
									<div className="shrink-0 pl-1">
										{cleanIconStyle === 'chevron' ? (
											<div
												className={cn(
													'flex size-7 sm:size-8 items-center justify-center rounded-full bg-muted/60 text-foreground transition-all duration-200',
													'group-hover:bg-primary/10 group-hover:text-primary',
													isOpen &&
														'rotate-180 bg-primary/15 text-primary ring-1 ring-primary/20',
												)}
											>
												<ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
											</div>
										) : (
											<div
												className={cn(
													'flex size-7 sm:size-8 items-center justify-center rounded-full bg-muted/60 text-foreground transition-all duration-200',
													'group-hover:bg-primary/10 group-hover:text-primary',
													isOpen &&
														'bg-primary/15 text-primary ring-1 ring-primary/20',
												)}
											>
												{isOpen ? (
													<Minus className="size-3.5 shrink-0" />
												) : (
													<Plus className="size-3.5 shrink-0" />
												)}
											</div>
										)}
									</div>
								</button>
							</h3>

							{/* Smooth Collapsible Panel via CSS Grid Template Rows */}
							<div
								id={panelId}
								role="region"
								aria-labelledby={headerId}
								aria-hidden={!isOpen}
								className={cn(
									'grid transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
									isOpen
										? 'grid-rows-[1fr] opacity-100'
										: 'grid-rows-[0fr] opacity-0 pointer-events-none',
								)}
							>
								<div className="overflow-hidden">
									<div
										className={cn(
											'pb-5 pt-1 text-muted-foreground',
											cleanStyle === 'card' && 'border-t border-border/40 mt-1',
											cleanStyle === 'separated' &&
												'border-t border-border/30 mt-1',
											cleanStyle === 'contained' &&
												'border-t border-border/40 mt-1',
										)}
									>
										{item.content && item.content.length > 0 && (
											<div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed pt-2">
												<PortableText value={item.content} />
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{/* Conversion-Focused Support Assistance Box */}
			{isSupportCardVisible && (
				<div className="mt-8 sm:mt-10 rounded-2xl border border-border/70 bg-surface/80 dark:bg-zinc-900/60 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="space-y-1">
						<h4 className="text-sm sm:text-base font-semibold text-foreground">
							{supportCard?.title || 'Still have questions?'}
						</h4>
						<p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
							{supportCard?.description ||
								'Can’t find what you’re looking for? Reach out to our specialist team for dedicated support.'}
						</p>
					</div>
					{supportCard?.linkUrl && (
						<a
							href={supportCard.linkUrl}
							className="inline-flex shrink-0 items-center justify-center rounded-xl bg-foreground px-4 py-2.5 text-xs sm:text-sm font-semibold text-background hover:bg-foreground/90 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
						>
							{supportCard?.linkText || 'Contact Support'}
						</a>
					)}
				</div>
			)}
		</div>
	)
}
