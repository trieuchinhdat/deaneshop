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
			setTimeout(() => inputRef.current?.focus(), 100)
		} else {
			document.body.style.overflow = ''
			setQuery('')
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	if (!isOpen) return null

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		if (query.trim()) {
			router.push(`/products?q=${encodeURIComponent(query.trim())}`)
			onClose()
		}
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in"
				onClick={onClose}
			/>

			<div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 md:p-20">
				<div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden border border-stroke/20 transition-all transform animate-scale-in">
					{/* Search Input Bar */}
					<form onSubmit={handleSearch} className="flex items-center px-4 py-3.5 border-b border-stroke/20">
						<HiOutlineMagnifyingGlass className="text-2xl text-primary shrink-0 mr-3" />
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Nhập tên sản phẩm, từ khóa cần tìm..."
							className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-base sm:text-lg focus:outline-none"
						/>
						{query && (
							<button
								type="button"
								onClick={() => setQuery('')}
								className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full mr-2 text-xs"
							>
								Xóa
							</button>
						)}
						<button
							type="button"
							onClick={onClose}
							className="p-2 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
							aria-label="Đóng tìm kiếm"
						>
							<HiXMark className="text-xl" />
						</button>
					</form>

					{/* Quick Suggestions */}
					<div className="p-6 bg-black/[0.02] dark:bg-white/[0.02]">
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
							Gợi ý tìm kiếm phổ biến
						</p>
						<div className="flex flex-wrap gap-2">
							{['Khuyến mãi', 'Tất cả sản phẩm', 'Flash Sale', 'Bán chạy'].map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={() => {
										router.push(`/products?q=${encodeURIComponent(tag)}`)
										onClose()
									}}
									className="px-3 py-1.5 rounded-full bg-background border border-stroke/30 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
								>
									{tag}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
