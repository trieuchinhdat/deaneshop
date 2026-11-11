import { CheckCircle2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KeyTakeawaysProps {
	takeaways?: string[]
	title?: string
	className?: string
}

export default function KeyTakeaways({
	takeaways = [],
	title = 'Executive Summary & Key Takeaways',
	className,
}: KeyTakeawaysProps) {
	if (!takeaways || takeaways.length === 0) return null

	return (
		<section
			aria-labelledby="key-takeaways-heading"
			className={cn(
				'not-prose my-6 sm:my-8 rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 sm:p-6 shadow-2xs dark:border-blue-900/60 dark:bg-blue-950/20',
				className,
			)}
		>
			<div className="flex items-center gap-2 pb-3.5 border-b border-blue-200/60 dark:border-blue-900/40">
				<div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white dark:bg-blue-500">
					<Sparkles className="size-4" />
				</div>
				<h3
					id="key-takeaways-heading"
					className="text-sm sm:text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50"
				>
					{title}
				</h3>
			</div>

			<ul className="pt-4 space-y-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
				{takeaways.map((point, index) => (
					<li key={index} className="flex items-start gap-2.5 leading-relaxed">
						<CheckCircle2 className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
						<span className="break-words">{point}</span>
					</li>
				))}
			</ul>
		</section>
	)
}
