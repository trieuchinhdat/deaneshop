'use client'

import { Search, X } from 'lucide-react'
import { useBlogIndexStore } from './store'

export default function SearchBar() {
	const { searchQuery, setSearchQuery } = useBlogIndexStore()

	return (
		<div className="relative w-full max-w-xs">
			<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
				<Search className="size-4" />
			</div>
			<input
				type="text"
				value={searchQuery || ''}
				onChange={(e) => setSearchQuery(e.target.value || null)}
				placeholder="Search articles & topics..."
				className="w-full rounded-full border border-zinc-200 bg-white py-2 pr-9 pl-9 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 shadow-2xs transition-all focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
			/>
			{searchQuery && (
				<button
					type="button"
					onClick={() => setSearchQuery(null)}
					className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
					aria-label="Clear search"
				>
					<X className="size-3.5" />
				</button>
			)}
		</div>
	)
}
