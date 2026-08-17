import { cn } from '@/lib/utils'
import type { Person } from '@/sanity/types'
import Img from '@/ui/img'

export default function Byline({
	author,
	className,
}: { author?: (Person & { role?: string }) | null } & React.ComponentProps<'div'>) {
	if (!author?.name) return null

	return (
		<div className={cn('inline-flex items-center gap-2', className)}>
			<figure className="size-6 sm:size-7 aspect-square shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
				{author.image ? (
					<Img
						className="size-full object-cover"
						image={author.image}
						width={48}
						height={48}
						alt={author.name ?? 'Author'}
					/>
				) : (
					<div className="flex size-full items-center justify-center text-xs font-bold text-zinc-500">
						{author.name.charAt(0)}
					</div>
				)}
			</figure>

			<span className="font-semibold text-zinc-900 dark:text-zinc-100">
				{author.name}
			</span>
		</div>
	)
}
