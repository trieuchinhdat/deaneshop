'use client'

import { cn } from '@/lib/utils'
import type { BlogCategory } from '@/sanity/types'
import { useBlogIndexStore } from './blog-index/store'

export default function Filter({
	category,
	count,
	children,
}: {
	category?: BlogCategory
	count?: number
	children?: React.ReactNode
} & React.ComponentProps<'button'>) {
	const { categoryParam, setCategoryParam } = useBlogIndexStore()
	const slug = category?.slug?.current
	const isActive = categoryParam === slug || (!categoryParam && !category)

	return (
		<button
			type="button"
			className={cn(
				'inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-2xs',
				isActive
					? 'bg-zinc-950 text-white shadow-xs dark:bg-white dark:text-zinc-950'
					: 'bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white',
			)}
			onClick={() => {
				if (categoryParam === slug) {
					setCategoryParam(null)
				} else {
					setCategoryParam(slug ?? null)
				}
			}}
		>
			<span>{children || category?.title}</span>
			{typeof count === 'number' && (
				<span
					className={cn(
						'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
						isActive
							? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-950'
							: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
					)}
				>
					{count}
				</span>
			)}
		</button>
	)
}
