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
		<div
			className="fixed inset-0 z-50 overflow-y-auto"
			role="dialog"
			aria-modal="true"
		>
			{/* Backdrop */}
			<div
				className="animate-fade-in fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
				onClick={onClose}
			/>

			<div className="relative flex min-h-screen items-start justify-center p-4 sm:p-6 md:p-20">
				<div className="bg-background border-stroke/20 animate-scale-in relative w-full max-w-2xl transform overflow-hidden rounded-2xl border shadow-2xl transition-all">
					{/* Search Input Bar */}
					<form
						onSubmit={handleSearch}
						className="border-stroke/20 flex items-center border-b px-4 py-3.5"
					>
						<HiOutlineMagnifyingGlass className="text-primary mr-3 shrink-0 text-2xl" />
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Nhập tên sản phẩm, từ khóa cần tìm..."
							className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-base focus:outline-none sm:text-lg"
						/>
						{query && (
							<button
								type="button"
								onClick={() => setQuery('')}
								className="mr-2 rounded-full p-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
							>
								Xóa
							</button>
						)}
						<button
							type="button"
							onClick={onClose}
							className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
							aria-label="Đóng tìm kiếm"
						>
							<HiXMark className="text-xl" />
						</button>
					</form>

					{/* Quick Suggestions */}
					<div className="bg-black/[0.02] p-6 dark:bg-white/[0.02]">
						<p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
							Gợi ý tìm kiếm phổ biến
						</p>
						<div className="flex flex-wrap gap-2">
							{['Khuyến mãi', 'Tất cả sản phẩm', 'Flash Sale', 'Bán chạy'].map(
								(tag) => (
									<button
										key={tag}
										type="button"
										onClick={() => {
											router.push(`/products?q=${encodeURIComponent(tag)}`)
											onClose()
										}}
										className="bg-background border-stroke/30 hover:border-primary hover:text-primary rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
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
