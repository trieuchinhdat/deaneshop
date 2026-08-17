import { cn } from '@/lib/utils'

interface ComparisonTableProps {
	title?: string
	caption?: string
	headers?: string[]
	highlightedColumnIndex?: number
	rows?: Array<{
		_key?: string
		cells?: string[]
	}>
}

export default function ComparisonTable({
	title,
	caption,
	headers = [],
	highlightedColumnIndex,
	rows = [],
}: ComparisonTableProps) {
	if (!headers || headers.length === 0) return null

	return (
		<figure className="my-8 space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				{title && (
					<strong className="block text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
						{title}
					</strong>
				)}
				<span className="text-[11px] font-medium text-zinc-400 sm:hidden">
					Swipe table ← →
				</span>
			</div>
			<div className="overflow-x-auto rounded-xl border border-zinc-200 shadow-2xs dark:border-zinc-800 scrollbar-thin">
				<table className="w-full min-w-[520px] border-collapse text-left text-xs sm:text-sm">
					<thead>
						<tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
							{headers.map((header, idx) => {
								const isHighlighted = highlightedColumnIndex === idx
								return (
									<th
										key={idx}
										scope="col"
										className={cn(
											'px-3.5 sm:px-4 py-3 sm:py-3.5 font-bold tracking-tight text-zinc-900 dark:text-zinc-100',
											isHighlighted &&
												'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
										)}
									>
										{header}
									</th>
								)
							})}
						</tr>
					</thead>
					<tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
						{rows.map((row, rowIdx) => (
							<tr
								key={row._key || rowIdx}
								className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
							>
								{headers.map((_, colIdx) => {
									const cellValue = row.cells?.[colIdx] ?? ''
									const isHighlighted = highlightedColumnIndex === colIdx
									const isFirstCol = colIdx === 0

									return (
										<td
											key={colIdx}
											className={cn(
												'px-3.5 sm:px-4 py-2.5 sm:py-3 text-zinc-700 dark:text-zinc-300',
												isFirstCol && 'font-semibold text-zinc-900 dark:text-zinc-100',
												isHighlighted &&
													'bg-zinc-50/80 font-medium text-zinc-950 dark:bg-zinc-900/60 dark:text-zinc-50',
											)}
										>
											{cellValue}
										</td>
									)
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{caption && (
				<figcaption className="text-xs text-zinc-500 dark:text-zinc-400 italic">
					{caption}
				</figcaption>
			)}
		</figure>
	)
}
