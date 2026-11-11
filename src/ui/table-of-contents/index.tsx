import { cn } from '@/lib/utils'
import ToCItem from './toc-item'

export interface TableOfContentsProps extends React.ComponentProps<'details'> {
	headings?: Array<{
		style: string | null
		text: string | null
	}> | null
	title?: string
}

export default function TableOfContents({
	headings,
	className,
	title = 'Table of Contents',
	...props
}: TableOfContentsProps) {
	if (!headings || headings.length === 0) return null

	return (
		<details
			className={cn(
				'accordion max-h-[calc(100svh-var(--header-height,64px)-var(--offset,2rem))] overflow-y-auto rounded-xl border border-border/50 bg-background/60 p-4 text-sm backdrop-blur-xs transition-colors dark:border-border/40',
				className,
			)}
			aria-label={title}
			{...props}
		>
			<summary className="sticky top-0 z-10 cursor-pointer font-semibold text-foreground tracking-tight select-none focus:outline-hidden md:after:content-['']!">
				{title}
			</summary>

			<nav aria-label="Table of contents sections" className="mt-3">
				<ol className="space-y-1">
					{headings.map((heading, key) => (
						<ToCItem heading={heading} key={key} />
					))}
				</ol>
			</nav>
		</details>
	)
}
