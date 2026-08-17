'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HiOutlineUser } from 'react-icons/hi2'
import { VscChevronLeft, VscChevronRight } from 'react-icons/vsc'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/use-auth-store'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'

interface Panel {
	id: string
	title: string
	parentTitle?: string
	breadcrumb: string
	parentLink?: SanityLinkType
	items: any[]
}

interface MobileNavProps {
	isOpen: boolean
	onClose: () => void
	items?: any[] | null
	ctas?: any[] | null
}

export default function MobileNav({
	isOpen,
	onClose,
	items,
	ctas,
}: MobileNavProps) {
	const pathname = usePathname()
	const { user, isAuthenticated } = useAuthStore()

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

	// Khóa cuộn trang nền khi mở Menu Mobile
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

	// Đóng menu khi phím ESC được nhấn
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, onClose])

	// Reset stack on navigation or items change
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
			id: item._key || `panel-${Date.now()}-${Math.random()}`,
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
			setActiveIndex((prev) => prev - 1)
		}
	}

	return (
		<div
			className={cn(
				'fixed top-[var(--header-height,56px)] inset-x-0 bottom-0 z-[55] md:hidden flex flex-col transition-all duration-300 ease-out',
				isOpen
					? 'opacity-100 translate-y-0 pointer-events-auto visible'
					: 'opacity-0 -translate-y-2 pointer-events-none invisible',
			)}
			role="dialog"
			aria-modal="true"
			aria-label="Menu di động"
		>
			{/* Backdrop Overlay (Click to Close) */}
			<div
				className="fixed inset-0 top-[var(--header-height,56px)] bg-black/40 backdrop-blur-xs transition-opacity -z-10"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Main Mobile Navigation Floating Container */}
			<div className="w-full h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col justify-between shadow-2xl border-t border-stroke/15 overflow-hidden">
				{/* Navigation Sub-header (chỉ hiện khi có nút Back ở sub-panel) */}
				{activeIndex > 0 && (
					<div className="px-4 pb-2.5 pt-3 border-b border-stroke/15 flex items-center justify-between gap-2 shrink-0 bg-gray-50/80 dark:bg-gray-800/80">
						<button
							type="button"
							onClick={popPanel}
							className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:opacity-80 py-1.5 px-3 -ml-1 rounded-lg bg-black/5 dark:bg-white/10 transition-all active:scale-95 cursor-pointer min-h-[40px]"
						>
							<VscChevronLeft className="text-lg" />
							<span>Quay lại</span>
						</button>

						<span className="text-sm font-bold truncate max-w-[180px] text-right">
							{currentPanel.title}
						</span>
					</div>
				)}

				{/* Sliding Panels Track */}
				<div className="relative w-full overflow-y-auto flex-1 flex flex-col py-3">
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
											className="flex items-center justify-between py-3 px-3.5 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors text-sm min-h-[44px]"
											onClick={onClose}
										>
											<span>Xem tất cả {panel.title}</span>
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

											if (isExpandable) {
												return (
													<button
														key={item._key || idx}
														type="button"
														onClick={() => pushChildPanel(item)}
														className="flex items-center justify-between w-full py-3 px-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors text-left group cursor-pointer min-h-[46px]"
													>
														<span className="text-base font-semibold">{label}</span>
														<VscChevronRight className="text-lg opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-gray-500" />
													</button>
												)
											}

											// Direct link item
											const linkData = item._type === 'link' ? item : item.link
											return (
												<SanityLink
													key={item._key || idx}
													link={linkData}
													className="flex items-center justify-between py-3 px-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors text-base min-h-[46px]"
													onClick={onClose}
												>
													<span>{label}</span>
												</SanityLink>
											)
										})
								) : (
									<div className="py-12 text-center text-sm text-gray-500 flex flex-col items-center gap-3">
										<p>Chưa có mục menu nào được cấu hình</p>
										<a
											href="/"
											onClick={onClose}
											className="text-xs font-semibold text-primary underline"
										>
											Trang chủ
										</a>
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Prominent User / Account Section inside Mobile Menu Drawer with iOS Safe Area */}
				<div className="mt-auto pt-3 px-4 pb-[max(env(safe-area-inset-bottom,0px),16px)] border-t border-border/40 bg-muted/40 shrink-0">
					{isAuthenticated && user ? (
						<Link
							href="/account"
							onClick={onClose}
							className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-primary/40 transition-all cursor-pointer"
						>
							<div className="flex items-center gap-3">
								<div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
									{user.avatar ? (
										<Image
											src={user.avatar}
											alt={user.name || 'User'}
											fill
											sizes="40px"
											unoptimized
											className="object-cover"
										/>
									) : (
										<span className="text-xs font-bold text-primary">
											{(user.name || user.email || 'U').substring(0, 2).toUpperCase()}
										</span>
									)}
								</div>
								<div className="text-left">
									<p className="text-sm font-bold text-foreground line-clamp-1">
										{user.name || 'Tài khoản của bạn'}
									</p>
									<p className="text-xs text-primary font-medium">
										Quản lý đơn hàng & Hồ sơ →
									</p>
								</div>
							</div>
							<VscChevronRight className="text-lg text-muted-foreground" />
						</Link>
					) : (
						<Link
							href={`/account/login?redirect=${encodeURIComponent(pathname || '/')}`}
							onClick={onClose}
							className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 active:scale-[0.98] transition-all text-sm cursor-pointer min-h-[48px]"
						>
							<HiOutlineUser className="text-lg" />
							<span>Đăng nhập / Đăng ký tài khoản</span>
						</Link>
					)}
				</div>
			</div>
		</div>
	)
}
