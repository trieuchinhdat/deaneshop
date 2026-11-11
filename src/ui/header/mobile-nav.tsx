'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { HiOutlineUser, HiXMark } from 'react-icons/hi2'
import { IoIosSearch } from 'react-icons/io'
import { VscChevronLeft, VscChevronRight } from 'react-icons/vsc'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

interface Panel {
	id: string
	title: string
	parentTitle?: string
	breadcrumb: string
	parentLink?: SanityLinkType
	banner?: any
	items: any[]
}

interface MobileNavProps {
	isOpen: boolean
	onClose: () => void
	items?: any[] | null
	footerLinks?: any[] | null
	highlightCta?: any | null
	showAccount?: boolean
	onOpenSearch?: () => void
}

export default function MobileNav({
	isOpen,
	onClose,
	items,
	footerLinks,
	highlightCta,
	showAccount = false,
	onOpenSearch,
}: MobileNavProps) {
	const pathname = usePathname()
	const containerRef = useRef<HTMLDivElement>(null)
	const scrollRef = useRef<HTMLDivElement>(null)

	const rootPanel: Panel = {
		id: 'root',
		title: 'Menu',
		breadcrumb: 'Menu',
		items: items || [],
	}

	const [stack, setStack] = useState<Panel[]>([rootPanel])
	const [activeIndex, setActiveIndex] = useState<number>(0)

	// Lock background scroll when mobile menu is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	// Close menu on Escape key press & Focus trap
	useEffect(() => {
		if (!isOpen) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
				return
			}

			// Focus trap logic
			if (e.key === 'Tab' && containerRef.current) {
				const focusables = containerRef.current.querySelectorAll<HTMLElement>(
					'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
				)
				if (focusables.length === 0) return

				const first = focusables[0]
				const last = focusables[focusables.length - 1]

				if (e.shiftKey) {
					if (document.activeElement === first) {
						last.focus()
						e.preventDefault()
					}
				} else {
					if (document.activeElement === last) {
						first.focus()
						e.preventDefault()
					}
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, onClose])

	// Reset panel scroll position to top when navigating into a new panel
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = 0
		}
	}, [activeIndex])

	// Reset stack on navigation or items change
	useEffect(() => {
		setStack([
			{
				id: 'root',
				title: 'Menu',
				breadcrumb: 'Menu',
				items: items || [],
			},
		])
		setActiveIndex(0)
		onClose()
	}, [pathname, items])

	const currentPanel = stack[activeIndex] || stack[stack.length - 1] || rootPanel

	const getItemLabel = (item: any): string => {
		if (!item) return ''
		if (item.label) return item.label
		if (item.link?.label) return item.link.label
		if (item.link?.internal?.title) return item.link.internal.title
		if (item.title) return item.title
		if (item.internal?.title) return item.internal.title
		return ''
	}

	const isItemActive = (item: any): boolean => {
		const slug = item?.internal?.slug || item?.link?.internal?.slug
		if (slug) {
			return slug === '/' ? pathname === '/' : pathname === slug || pathname.startsWith(slug + '/')
		}
		return false
	}

	const hasChildren = (item: any): boolean => {
		if (!item) return false
		if (item._type === 'link.list' && Array.isArray(item.links) && item.links.length > 0) {
			return true
		}
		if (item._type === 'megamenu' && Array.isArray(item.items) && item.items.length > 0) {
			return true
		}
		return false
	}

	const pushChildPanel = (item: any) => {
		const title = getItemLabel(item) || 'Category'
		const newBreadcrumb = `${currentPanel.breadcrumb} > ${title}`
		const parentLink = item.link || (item._type === 'link' ? item : undefined)
		const subItems = item.links || item.items || []

		const newPanel: Panel = {
			id: item._key || `panel-${Date.now()}-${Math.random()}`,
			title,
			parentTitle: currentPanel.title,
			breadcrumb: newBreadcrumb,
			parentLink,
			banner: item.banner,
			items: subItems,
		}

		setStack((prev) => [...prev.slice(0, activeIndex + 1), newPanel])
		setActiveIndex((prev) => prev + 1)
	}

	const popPanel = () => {
		if (activeIndex > 0) {
			setActiveIndex((prev) => prev - 1)
		}
	}

	return (
		<div
			ref={containerRef}
			className={cn(
				'fixed top-[var(--header-height,56px)] inset-x-0 bottom-0 z-[55] md:hidden flex flex-col transition-all duration-300 ease-out',
				isOpen
					? 'opacity-100 translate-y-0 pointer-events-auto visible'
					: 'opacity-0 -translate-y-2 pointer-events-none invisible'
			)}
			role="dialog"
			aria-modal="true"
			aria-label="Mobile Navigation"
		>
			{/* Backdrop Overlay (Click to Close) */}
			<div
				className="fixed inset-0 top-[var(--header-height,56px)] bg-black/50 backdrop-blur-xs transition-opacity -z-10"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Main Mobile Navigation Container */}
			<div className="w-full h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col justify-between shadow-2xl border-t border-stroke/15 overflow-hidden">
				{/* Top Drawer Header with Back / Close Button */}
				<div className="flex items-center justify-between px-3.5 py-2.5 border-b border-stroke/15 bg-gray-50/90 dark:bg-gray-800/90 shrink-0">
					<div className="flex items-center gap-1.5 min-w-[70px]">
						{activeIndex > 0 ? (
							<button
								type="button"
								onClick={popPanel}
								className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:opacity-80 py-1.5 px-2.5 rounded-lg bg-black/5 dark:bg-white/10 transition-all active:scale-95 cursor-pointer min-h-[36px]"
								aria-label={`Back to ${currentPanel.parentTitle || 'Menu'}`}
							>
								<VscChevronLeft className="text-base" />
								<span>Back</span>
							</button>
						) : (
							<span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
								Navigation
							</span>
						)}
					</div>

					<span className="text-sm font-bold truncate max-w-[170px] text-center">
						{currentPanel.title}
					</span>

					<div className="flex items-center justify-end min-w-[70px]">
						<button
							type="button"
							onClick={onClose}
							className="flex size-9 items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
							aria-label="Close menu"
						>
							<HiXMark className="text-xl" />
						</button>
					</div>
				</div>

				{/* Quick Search Trigger inside Mobile Drawer (Root Panel Only) */}
				{activeIndex === 0 && onOpenSearch && (
					<div className="px-3.5 pt-3 pb-1.5 shrink-0 border-b border-stroke/10">
						<button
							type="button"
							onClick={() => {
								onClose()
								onOpenSearch()
							}}
							className="flex w-full items-center gap-2.5 rounded-full border border-stroke/20 bg-gray-50 dark:bg-gray-800 text-gray-500 px-3.5 py-2 text-xs font-medium transition-all active:scale-[0.99] cursor-pointer min-h-[40px]"
						>
							<IoIosSearch className="text-primary text-base shrink-0" />
							<span className="grow text-left">Search products, collections, brands...</span>
						</button>
					</div>
				)}

				{/* Sliding Panels Track */}
				<div ref={scrollRef} className="relative w-full overflow-y-auto flex-1 flex flex-col py-2.5">
					<div
						className="flex w-full h-full transition-transform duration-300 ease-out items-start"
						style={{ transform: `translateX(-${activeIndex * 100}%)` }}
					>
						{stack.map((panel) => (
							<div key={panel.id} className="w-full shrink-0 min-w-full flex flex-col gap-1 px-3">
								{/* Option to view all if parent link exists */}
								{panel.parentLink && (panel.parentLink.internal || panel.parentLink.external) && (
									<div className="pb-2 mb-1.5 border-b border-stroke/15">
										<SanityLink
											link={panel.parentLink}
											className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors text-sm min-h-[44px]"
											onClick={onClose}
										>
											<span>View all {panel.title}</span>
											<VscChevronRight className="text-base" />
										</SanityLink>
									</div>
								)}

								{panel.items && panel.items.length > 0 ? (
									panel.items
										.filter((item: any) => {
											if (!item) return false
											const label = getItemLabel(item)
											const expandable = hasChildren(item)
											const linkData = item._type === 'link' ? item : item.link
											return Boolean(
												label?.trim?.() ||
													expandable ||
													linkData?.external ||
													linkData?.internal?.slug
											)
										})
										.map((item: any, idx: number) => {
											const label = getItemLabel(item)
											const isExpandable = hasChildren(item)
											const active = isItemActive(item)

											if (isExpandable) {
												return (
													<button
														key={item._key || idx}
														type="button"
														onClick={() => pushChildPanel(item)}
														className="flex items-center justify-between w-full py-2.5 px-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors text-left group cursor-pointer min-h-[44px]"
													>
														<span className={cn('text-sm font-semibold', active && 'text-primary')}>
															{label}
														</span>
														<VscChevronRight className="text-base opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-gray-500" />
													</button>
												)
											}

											// Direct link item
											const linkData = item._type === 'link' ? item : item.link
											return (
												<SanityLink
													key={item._key || idx}
													link={linkData}
													className={cn(
														'flex items-center justify-between py-2.5 px-3.5 rounded-xl transition-colors text-sm min-h-[44px]',
														active
															? 'bg-primary/10 text-primary font-bold'
															: 'hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
													)}
													aria-current={active ? 'page' : undefined}
													onClick={onClose}
												>
													<span>{label}</span>
												</SanityLink>
											)
										})
								) : (
									<div className="py-12 text-center text-sm text-gray-500 flex flex-col items-center gap-3">
										<p>No menu items configured yet</p>
										<a
											href="/"
											onClick={onClose}
											className="text-xs font-semibold text-primary underline"
										>
											Home
										</a>
									</div>
								)}

								{/* Compact Promo Card for Mega Menu items on Mobile */}
								{panel.banner?.image?.asset && (
									<div className="mt-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-stroke/15 flex items-center gap-3">
										<div className="relative size-16 shrink-0 rounded-xl overflow-hidden bg-black/5">
											<Image
												src={urlFor(panel.banner.image).width(200).height(200).url()}
												alt={panel.banner.title || panel.title}
												fill
												sizes="64px"
												className="object-cover"
											/>
										</div>
										<div className="flex-1 min-w-0 flex flex-col gap-0.5">
											{panel.banner.title && (
												<p className="font-bold text-xs text-foreground truncate">{panel.banner.title}</p>
											)}
											{panel.banner.subtitle && (
												<p className="text-[11px] text-muted-foreground truncate">{panel.banner.subtitle}</p>
											)}
											{panel.banner.link && (
												<SanityLink
													link={panel.banner.link as SanityLinkType}
													onClick={onClose}
													className="text-xs font-semibold text-primary mt-0.5 inline-flex items-center gap-1 hover:underline"
												>
													<span>{panel.banner.link.label || 'Explore'}</span>
													<VscChevronRight className="text-[10px]" />
												</SanityLink>
											)}
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Mobile Drawer Bottom Section (Account Link + Highlight CTA + Footer Links) */}
				<div className="border-t border-stroke/15 bg-gray-50/90 dark:bg-gray-800/90 p-3.5 flex flex-col gap-2.5 shrink-0">
					{/* Optional Customer Account / Login Button */}
					{showAccount && (
						<a
							href="/account"
							onClick={onClose}
							className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl border border-stroke/20 bg-white dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-100 hover:text-primary transition-all active:scale-[0.99] min-h-[42px] shadow-xs"
						>
							<HiOutlineUser className="text-base text-primary" />
							<span>Customer Account / Sign In</span>
						</a>
					)}

					{/* Highlight CTA */}
					{highlightCta?.link && (
						<SanityLink
							link={highlightCta.link as SanityLinkType}
							onClick={onClose}
							className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold text-center justify-center transition-all shadow-xs active:scale-98 min-h-[42px]"
						>
							<span>{highlightCta.link.label || 'Explore'}</span>
						</SanityLink>
					)}

					{/* Footer Links */}
					{footerLinks && footerLinks.length > 0 && (
						<div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-xs text-muted-foreground pt-1">
							{footerLinks.map((link: any, idx: number) => (
								<SanityLink
									key={link._key || idx}
									link={link as SanityLinkType}
									onClick={onClose}
									className="hover:text-primary transition-colors py-1.5 px-2 font-medium"
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
