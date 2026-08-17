import Link from 'next/link'
import { ROUTES } from '@/lib/env'
import { cn } from '@/lib/utils'
import type { BlogCategory } from '@/sanity/types'

export default function Categories({
	categories,
	className,
	linked,
}: {
	categories: BlogCategory[]
	linked?: boolean
} & React.ComponentProps<'ul'>) {
	if (!categories || categories.length === 0) return null

	return (
		<ul className={cn('flex flex-wrap items-center gap-1.5 p-0', className)}>
			{categories.map((category, key) => {
				const catSlug =
					typeof category.slug === 'string'
						? category.slug
						: category.slug?.current

				return (
					<li className="shrink-0" key={category._id || key}>
						{linked && catSlug ? (
							<Link
								href={`/${ROUTES.blog}/category/${catSlug}`}
								className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-900 hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-zinc-900"
							>
								{category.title}
							</Link>
						) : (
							<span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
								{category.title}
							</span>
						)}
					</li>
				)
			})}
		</ul>
	)
}
