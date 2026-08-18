'use client'

import { ArrowUpDown } from 'lucide-react'
import { SORT_BY_OPTIONS, useBlogIndexStore } from './store'

export default function SortBy() {
	const { sortBy, setSortBy } = useBlogIndexStore()

	return (
		<div className="relative inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
			<ArrowUpDown className="size-3.5 text-zinc-400" aria-hidden="true" />
			<label
				htmlFor="blog-sort-select"
				className="cursor-pointer text-[11px] uppercase tracking-wider text-zinc-500"
			>
				Sort:
			</label>
			<select
				id="blog-sort-select"
				name="sortBy"
				aria-label="Sort articles"
				value={sortBy || SORT_BY_OPTIONS[0].value}
				onChange={(e) => setSortBy(e.target.value)}
				className="cursor-pointer bg-transparent font-semibold text-zinc-900 focus:outline-hidden dark:text-zinc-100"
			>
				{SORT_BY_OPTIONS.map((option) => (
					<option
						value={option.value}
						key={option.value}
						className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
					>
						{option.label}
					</option>
				))}
			</select>
		</div>
	)
}
