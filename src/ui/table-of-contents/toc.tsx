'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useHeaderHeight } from '@/hooks/use-header-height'
import { cn, slug } from '@/lib/utils'

export default function TOC({ headings }: { headings: any }) {
	const [activeId, setActiveId] = useState<string | null>(null)
	const [visible, setVisible] = useState(false)
	const [open, setOpen] = useState(false)

	// 1. Measure header height dynamically
	const headerHeight = useHeaderHeight()
	// 2. TOC Bar height (h-12 = 48px)
	const TOC_HEIGHT = 48
	// 3. Scroll offset padding
	const SCROLL_OFFSET = 20

	const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

	// Find active heading to display current section label
	const activeHeading = headings.find(
		(h: any) =>
			slug(h.text, { removeLeadingNumberAndHyphen: true }) === activeId,
	)
	const displayLabel = activeHeading ? activeHeading.text : 'Table of Contents'

	/* -----------------------------
	 * 1️⃣ VISIBILITY LOGIC
	 * ----------------------------- */
	useEffect(() => {
		const onScroll = () => {
			// Show TOC bar when scrolled past 100px
			setVisible(window.scrollY > 100)
		}
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	/* -----------------------------
	 * 2️⃣ OBSERVER LOGIC (Highlight Active)
	 * ----------------------------- */
	useEffect(() => {
		if (!headings.length) return

		const observer = new IntersectionObserver(
			(entries) => {
				const visibleEntries = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

				if (visibleEntries[0]) {
					setActiveId(visibleEntries[0].target.id)
				}
			},
			{
				// Offset: Active when heading is ~100px from viewport top
				rootMargin: '-100px 0px -70% 0px',
			},
		)

		headings.forEach((h: any) => {
			const id = slug(h.text, { removeLeadingNumberAndHyphen: true })
			const el = document.getElementById(id)
			if (el) observer.observe(el)
		})

		return () => observer.disconnect()
	}, [headings])

	/* -----------------------------
	 * 3️⃣ AUTO SCROLL MENU (Inside Dropdown)
	 * ----------------------------- */
	useEffect(() => {
		if (open && activeId && itemRefs.current[activeId]) {
			itemRefs.current[activeId]?.scrollIntoView({
				block: 'nearest',
				behavior: 'smooth',
			})
		}
	}, [activeId, open])

	/* -----------------------------
	 * 4️⃣ HANDLE MANUAL CLICK SCROLL
	 * ----------------------------- */
	const handleScrollTo = (
		e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
		id: string,
	) => {
		e.preventDefault()

		const element = document.getElementById(id)
		if (element) {
			const elementPosition =
				element.getBoundingClientRect().top + window.scrollY

			// Calculate target scroll position taking header and TOC bar into account
			const offsetPosition =
				elementPosition - headerHeight - TOC_HEIGHT - SCROLL_OFFSET

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth',
			})

			// Update URL hash
			window.history.pushState(null, '', `#${id}`)
			setOpen(false)
		}
	}

	if (!headings.length) return null

	return (
		<>
			<div
				// Dynamic Top: Anchored below site header
				style={{ top: headerHeight }}
				className={cn(
					// Base Styles
					'fixed inset-x-0 z-40 w-full border-b border-zinc-200 bg-white/95 text-zinc-900 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-100',
					'transition-all duration-300 ease-in-out',

					// Visibility
					visible
						? 'visible translate-y-0 opacity-100'
						: 'pointer-events-none invisible -translate-y-2 opacity-0',
				)}
			>
				{/* Main Content Container */}
				<div className="mx-auto max-w-screen-lg px-4 md:px-8">
					{/* --- TOGGLE BAR (h-12 = 48px) --- */}
					<div className="flex h-12 items-center justify-between">
						{/* Menu Toggle Click Area */}
						<div
							className="flex flex-1 cursor-pointer items-center gap-4 overflow-hidden py-2"
							onClick={() => setOpen((v) => !v)}
						>
							{/* Label: CONTENTS */}
							<span className="hidden shrink-0 text-[11px] font-bold tracking-wider text-zinc-500 uppercase sm:block dark:text-zinc-400">
								Contents
							</span>

							{/* Divider */}
							<span className="hidden h-4 w-[1px] bg-zinc-200 sm:block dark:bg-zinc-800"></span>

							{/* Active Title */}
							<span className="truncate text-sm font-semibold text-zinc-900 md:text-base dark:text-zinc-100">
								{displayLabel}
							</span>
						</div>

						{/* Chevron Toggle Button */}
						<button
							onClick={() => setOpen((v) => !v)}
							className={cn(
								'ml-2 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer',
								open
									? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
									: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
							)}
							aria-label={open ? 'Close Table of Contents' : 'Open Table of Contents'}
						>
							{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
						</button>
					</div>
				</div>

				{/* --- DROPDOWN LIST --- */}
				<div
					className={cn(
						'overflow-hidden bg-white dark:bg-zinc-950 transition-[max-height] duration-300 ease-in-out',
						open
							? 'max-h-[60vh] border-t border-zinc-100 dark:border-zinc-800 shadow-xl'
							: 'max-h-0',
					)}
				>
					<div className="mx-auto max-w-screen-lg px-4 py-4 md:px-8">
						<ul className="custom-scrollbar max-h-[50vh] space-y-1 overflow-y-auto pr-2">
							{headings.map((h: any, i: any) => {
								const computedId = slug(h.text, {
									removeLeadingNumberAndHyphen: true,
								})
								const isActive = activeId === computedId

								return (
									<li
										key={i}
										style={{
											paddingLeft: `${Math.max(h.level - 2, 0) * 16}px`,
										}}
									>
										<a
											ref={(el) => {
												if (el) itemRefs.current[computedId] = el
											}}
											href={`#${computedId}`}
											onClick={(e) => handleScrollTo(e, computedId)}
											className={cn(
												'min-h-[44px] flex items-center rounded-lg px-3.5 py-2 text-sm transition-all',
												isActive
													? 'bg-zinc-100 font-bold text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50'
													: 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100',
											)}
										>
											{h.text}
										</a>
									</li>
								)
							})}
						</ul>
					</div>
				</div>
			</div>

			{/* --- BACKDROP --- */}
			{open && visible && (
				<div
					className="fixed inset-0 z-30 bg-black/30 backdrop-blur-xs transition-opacity"
					onClick={() => setOpen(false)}
					style={{
						top: `calc(${headerHeight}px + ${TOC_HEIGHT}px)`,
					}}
				/>
			)}
		</>
	)
}
