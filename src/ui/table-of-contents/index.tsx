import { cn } from '@/lib/utils'
import ToCItem from './toc-item'

export default function ({
	headings,
	className,
	...props
}: {
	headings: Array<{
		style: string | null
		text: string | null
	}> | null
} & React.ComponentProps<'details'>) {
	return (
		<details
			className={cn(
				'accordion max-h-[calc(100svh-var(--header-height)-var(--offset))] overflow-y-auto',
				className,
			)}
			{...props}
		>
			<summary className="sticky top-0 font-bold md:after:content-['']!">
				Table of Contents
			</summary>

			<ol>
				{headings?.map((heading, key) => (
					<ToCItem heading={heading} key={key} />
				))}
			</ol>
		</details>
	)
}
