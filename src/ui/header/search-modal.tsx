'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { HiOutlineMagnifyingGlass, HiXMark } from 'react-icons/hi2'

interface SearchModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
	const [query, setQuery] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)
	const router = useRouter()

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			setTimeout(() => inputRef.current?.focus(), 80)
		} else {
			document.body.style.overflow = ''
			setQuery('')
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	// Đóng modal khi nhấn phím ESC
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, onClose])

	if (!isOpen) return null

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		const trimmed = query.trim()
		if (trimmed) {
			router.push(`/search?query=${encodeURIComponent(trimmed)}`)
		} else {
			router.push('/search')
		}
		onClose()
	}

	return (
		<div
			className="fixed inset-0 z-[100] overflow-y-auto"
			role="dialog"
			aria-modal="true"
			aria-label="Cửa sổ tìm kiếm nhanh"
		>
			{/* Backdrop Overlay */}
			<div
				className="animate-in fade-in duration-200 fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Responsive Positioning Container (Mobile: Top Sheet with Safe Area, Desktop: Centered Top Dialog) */}
			<div className="relative flex min-h-screen items-start justify-center px-3 pt-[max(env(safe-area-inset-top,0px),12px)] pb-6 sm:px-6 sm:pt-16 md:pt-24">
				<div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl md:rounded-3xl border border-stroke/20 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
					{/* Search Input Bar */}
					<form
						onSubmit={handleSearch}
						className="flex items-center border-b border-stroke/15 px-3.5 py-3 sm:px-5 sm:py-4 gap-2.5"
					>
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<HiOutlineMagnifyingGlass className="text-xl" />
						</div>

						<input
							ref={inputRef}
							type="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Tìm kiếm sản phẩm, thương hiệu..."
							className="w-full bg-transparent text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
							autoComplete="off"
						/>

						{query && (
							<button
								type="button"
								onClick={() => setQuery('')}
								className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors shrink-0"
							>
								Xóa
							</button>
						)}

						<button
							type="button"
							onClick={onClose}
							className="flex size-11 shrink-0 items-center justify-center rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
							aria-label="Đóng tìm kiếm"
						>
							<HiXMark className="text-xl" />
						</button>
					</form>

					{/* Quick Suggestions */}
					<div className="bg-gray-50/60 dark:bg-gray-800/40 p-4 sm:p-6">
						<p className="mb-3 text-[11px] font-bold tracking-wider text-gray-600 dark:text-gray-400 uppercase">
							Gợi ý tìm kiếm phổ biến
						</p>
						<div className="flex flex-wrap gap-2">
							{['Khuyến mãi', 'Tất cả sản phẩm', 'Flash Sale', 'Bán chạy', 'Sản phẩm mới'].map(
								(tag) => (
									<button
										key={tag}
										type="button"
										onClick={() => {
											router.push(`/search?query=${encodeURIComponent(tag)}`)
											onClose()
										}}
										className="rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary transition-colors cursor-pointer min-h-[36px]"
									>
										{tag}
									</button>
								),
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
