'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useHeaderHeight } from '@/hooks/use-header-height'
import { cn, slug } from '@/lib/utils'

export default function TOC({ headings }: { headings: any }) {
	const [activeId, setActiveId] = useState<string | null>(null)
	const [visible, setVisible] = useState(false)
	const [open, setOpen] = useState(false)

	// 1. Lấy chiều cao Header tự động
	const headerHeight = useHeaderHeight()
	// 2. Chiều cao của thanh TOC Bar (h-12 = 48px)
	const TOC_HEIGHT = 48
	// 3. Khoảng thở thêm (padding top) để tiêu đề không sát mép
	const SCROLL_OFFSET = 20

	const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

	// Tìm Heading đang active để hiển thị label
	const activeHeading = headings.find(
		(h: any) =>
			slug(h.text, { removeLeadingNumberAndHyphen: true }) === activeId,
	)
	const displayLabel = activeHeading ? activeHeading.text : 'Mục lục bài viết'

	/* -----------------------------
	 * 1️⃣ VISIBILITY LOGIC
	 * ----------------------------- */
	useEffect(() => {
		const onScroll = () => {
			// Hiện TOC khi scroll qua 100px
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
				// Offset: Active khi heading cách đỉnh màn hình khoảng 100px
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
		e.preventDefault() // Chặn hành vi mặc định

		const element = document.getElementById(id)
		if (element) {
			// Lấy vị trí tuyệt đối của element
			const elementPosition =
				element.getBoundingClientRect().top + window.scrollY

			// Tính toán vị trí scroll cuối cùng:
			// Vị trí Element - Chiều cao Header - Chiều cao TOC - Khoảng thở
			const offsetPosition =
				elementPosition - headerHeight - TOC_HEIGHT - SCROLL_OFFSET

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth',
			})

			// Cập nhật URL hash thủ công
			window.history.pushState(null, '', `#${id}`)
			setOpen(false)
		}
	}

	if (!headings.length) return null

	return (
		<>
			<div
				// Dynamic Top: Luôn nằm ngay dưới Header
				style={{ top: headerHeight }}
				className={cn(
					// Base Styles
					'fixed inset-x-0 z-40 w-full border-b border-gray-200 bg-[#fdfdfd] text-gray-900',
					'transition-all duration-300 ease-in-out',

					// Logic Ẩn/Hiện
					visible
						? 'visible translate-y-0 opacity-100' // Hiện
						: 'pointer-events-none invisible -translate-y-2 opacity-0', // Ẩn
				)}
			>
				{/* Main Content Container */}
				<div className="mx-auto max-w-screen-lg px-4 md:px-8">
					{/* --- TOGGLE BAR (h-12 = 48px khớp với TOC_HEIGHT) --- */}
					<div className="flex h-12 items-center justify-between">
						{/* Khu vực Click mở menu */}
						<div
							className="flex flex-1 cursor-pointer items-center gap-4 overflow-hidden py-2"
							onClick={() => setOpen((v) => !v)}
						>
							{/* Label: BROWSE */}
							<span className="hidden shrink-0 text-[11px] font-bold tracking-wider text-gray-500 uppercase sm:block">
								Browse
							</span>

							{/* Divider */}
							<span className="hidden h-4 w-[1px] bg-gray-300 sm:block"></span>

							{/* Active Title */}
							<span className="text-primary truncate text-sm font-medium md:text-base">
								{displayLabel}
							</span>
						</div>

						{/* Nút Chevron */}
						<button
							onClick={() => setOpen((v) => !v)}
							className={cn(
								'ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
								open
									? 'bg-black text-white' // Active: Đen
									: 'hover:bg-gray-200', // Inactive: Xám nhẹ
							)}
						>
							{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
						</button>
					</div>
				</div>

				{/* --- DROPDOWN LIST --- */}
				<div
					className={cn(
						'overflow-hidden bg-white transition-[max-height] duration-300 ease-in-out',
						open
							? 'max-h-[60vh] border-t border-gray-100 shadow-xl'
							: 'max-h-0',
					)}
				>
					<div className="mx-auto max-w-screen-lg px-4 py-4 md:px-8">
						<ul className="custom-scrollbar max-h-[50vh] space-y-1 overflow-y-auto pr-2">
							{headings.map((h: any, i: any) => {
								// Tính ID chuẩn
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
											// Gọi hàm scroll thủ công
											onClick={(e) => handleScrollTo(e, computedId)}
											className={cn(
												'block rounded-md px-3 py-2 text-sm transition-all',
												isActive
													? 'bg-gray-100 font-bold text-black'
													: 'text-gray-600 hover:bg-gray-50 hover:text-black',
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
					className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity"
					onClick={() => setOpen(false)}
					// Backdrop bắt đầu SAU TOC (Header + TOC Height)
					style={{
						top: `calc(${headerHeight}px + ${TOC_HEIGHT}px)`,
					}}
				/>
			)}
		</>
	)
}
