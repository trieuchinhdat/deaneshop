'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HiOutlineUser } from 'react-icons/hi2'
import { VscChevronLeft, VscChevronRight } from 'react-icons/vsc'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

interface Panel {
	id: string
	title: string
	parentTitle?: string
	breadcrumb: string
	parentLink?: SanityLinkType
	items: any[]
}

export default function MobileNav({
	items,
	ctas,
}: {
	items?: any[] | null
	ctas?: any[] | null
}) {
	const pathname = usePathname()

	// Find user CTA in ctas list if present
	const userCta = ctas?.find((cta: any) => {
		const configuredIcon = cta.iconType || 'auto'
		const labelClean = cta.link?.label?.toLowerCase().trim() || ''
		return (
			configuredIcon === 'user' ||
			(configuredIcon === 'auto' &&
				(labelClean === 'tài khoản' ||
					labelClean === 'account' ||
					labelClean === 'user' ||
					labelClean === 'đăng nhập'))
		)
	})

	const rootPanel: Panel = {
		id: 'root',
		title: 'Danh mục chính',
		breadcrumb: 'Menu',
		items: items || [],
	}

	const [stack, setStack] = useState<Panel[]>([rootPanel])
	const [activeIndex, setActiveIndex] = useState<number>(0)

	// Close menu helper
	const closeMobileMenu = () => {
		if (typeof document === 'undefined') return
		const toggle = document.querySelector('#header-open') as HTMLInputElement
		if (toggle) toggle.checked = false
	}

	// Reset stack on navigation or menu toggle
	useEffect(() => {
		setStack([
			{
				id: 'root',
				title: 'Danh mục chính',
				breadcrumb: 'Menu',
				items: items || [],
			},
		])
		setActiveIndex(0)
		closeMobileMenu()
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
		const title = getItemLabel(item) || 'Danh mục'
		const newBreadcrumb = `${currentPanel.breadcrumb} > ${title}`
		const parentLink = item.link || (item._type === 'link' ? item : undefined)
		const subItems = item.links || item.items || []

		const newPanel: Panel = {
			id: item._key || `${Date.now()}-${Math.random()}`,
			title,
			parentTitle: currentPanel.title,
			breadcrumb: newBreadcrumb,
			parentLink,
			items: subItems,
		}

		setStack((prev) => [...prev.slice(0, activeIndex + 1), newPanel])
		setActiveIndex((prev) => prev + 1)
	}

	const popPanel = () => {
		if (activeIndex > 0) {
			const nextIndex = activeIndex - 1
			setActiveIndex(nextIndex)
			setTimeout(() => {
				setStack((prev) => prev.slice(0, nextIndex + 1))
			}, 300)
		}
	}

	return (
		<div className="w-full bg-header text-header-foreground border-t border-stroke/20 py-2 min-h-[calc(100dvh-120px)] flex flex-col justify-start overflow-hidden transition-all duration-300">
			{/* Navigation Header (chỉ hiện khi có nút Back ở sub-panel) */}
			{activeIndex > 0 && (
				<div className="px-3 pb-2 pt-1 border-b border-stroke/15 mb-2 flex items-center justify-between gap-2 shrink-0 transition-all">
					<button
						type="button"
						onClick={popPanel}
						className="flex items-center gap-1 text-sm font-semibold text-header-foreground hover:opacity-80 py-1 px-2.5 -ml-1 rounded-md bg-black/5 dark:bg-white/10 transition-all active:scale-95 cursor-pointer"
					>
						<VscChevronLeft className="text-lg" />
						<span>Back</span>
					</button>

					<span className="text-sm font-bold truncate max-w-[180px] text-right">
						{currentPanel.title}
					</span>
				</div>
			)}

			{/* Sliding Panels Track */}
			<div className="relative w-full overflow-hidden flex-1 flex flex-col">
				<div
					className="flex w-full h-full transition-transform duration-300 ease-in-out items-start"
					style={{ transform: `translateX(-${activeIndex * 100}%)` }}
				>
					{stack.map((panel) => (
						<div key={panel.id} className="w-full shrink-0 min-w-full flex flex-col gap-1 px-2">
							{/* Option to view all if parent link exists */}
							{panel.parentLink && (panel.parentLink.internal || panel.parentLink.external) && (
								<div className="pb-1.5 mb-1 border-b border-stroke/15">
									<SanityLink
										link={panel.parentLink}
										className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors text-sm"
										onClick={closeMobileMenu}
									>
										<span>Xem tất cả {panel.title}</span>
										<VscChevronRight className="text-base" />
									</SanityLink>
								</div>
							)}

							{panel.items && panel.items.length > 0 ? (
								panel.items.map((item: any, idx: number) => {
									const label = getItemLabel(item)
									const isExpandable = hasChildren(item)

									if (isExpandable) {
										return (
											<button
												key={item._key || idx}
												type="button"
												onClick={() => pushChildPanel(item)}
												className="flex items-center justify-between w-full py-3 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 font-medium transition-colors text-left group cursor-pointer"
											>
												<span className="text-base font-semibold">{label}</span>
												<VscChevronRight className="text-lg opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
											</button>
										)
									}

									// Direct link item
									const linkData = item._type === 'link' ? item : item.link
									return (
										<SanityLink
											key={item._key || idx}
											link={linkData}
											className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 font-medium transition-colors text-base"
											onClick={closeMobileMenu}
										>
											<span>{label}</span>
										</SanityLink>
									)
								})
							) : (
								<div className="py-4 text-center text-sm opacity-60">
									Không có mục nào
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Prominent User / Account CTA Button inside Mobile Menu Drawer */}
			<div className="mt-auto pt-4 px-2 pb-2 border-t border-stroke/15 shrink-0">
				{userCta ? (
					<SanityLink
						link={userCta.link as SanityLinkType}
						onClick={closeMobileMenu}
						className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all text-sm cursor-pointer"
					>
						<HiOutlineUser className="text-lg" />
						<span>{userCta.link?.label || 'Tài khoản / Đăng nhập'}</span>
					</SanityLink>
				) : (
					<a
						href="/account"
						onClick={closeMobileMenu}
						className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all text-sm cursor-pointer"
					>
						<HiOutlineUser className="text-lg" />
						<span>Tài khoản / Đăng nhập</span>
					</a>
				)}
			</div>
		</div>
	)
}
