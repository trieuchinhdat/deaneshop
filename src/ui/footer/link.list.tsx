'use client'

import { useId, useState } from 'react'
import type { LinkList as LinkListType } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkListProps extends LinkListType {
	isMobileAccordion?: boolean
	headingCase?: 'title' | 'uppercase'
}

export default function LinkList({
	link,
	links,
	isMobileAccordion = true,
	headingCase = 'title',
}: LinkListProps) {
	const [isOpen, setIsOpen] = useState(false)
	const contentId = useId()

	const headerClasses = cn(
		'font-semibold text-foreground tracking-tight select-none',
		headingCase === 'uppercase'
			? 'text-xs uppercase tracking-wider'
			: 'text-sm sm:text-base tracking-normal'
	)

	return (
		<div className="flex flex-col">
			{/* Mobile Trigger Button */}
			<button
				type="button"
				onClick={() => {
					if (isMobileAccordion) setIsOpen((prev) => !prev)
				}}
				className={cn(
					'flex w-full items-center justify-between border-b border-border/40 py-3 text-left md:hidden',
					isMobileAccordion ? 'cursor-pointer hover:text-primary transition-colors' : 'cursor-default'
				)}
				aria-expanded={isMobileAccordion ? isOpen : undefined}
				aria-controls={isMobileAccordion ? contentId : undefined}
			>
				<span className={headerClasses}>{link?.label}</span>
				{isMobileAccordion && (
					<ChevronDown
						aria-hidden="true"
						className={cn(
							'size-4 text-muted-foreground transition-transform duration-200 shrink-0',
							isOpen && 'rotate-180 text-primary'
						)}
					/>
				)}
			</button>

			{/* Desktop Static Heading */}
			<div className="hidden md:block pb-1">
				<h3 className={headerClasses}>{link?.label}</h3>
			</div>

			{/* List Items Container with Smooth Grid Transition on Mobile */}
			<div
				id={contentId}
				className={cn(
					'grid transition-[grid-template-rows] duration-200 ease-out md:grid-rows-[1fr]',
					isMobileAccordion
						? isOpen
							? 'grid-rows-[1fr]'
							: 'grid-rows-[0fr]'
						: 'grid-rows-[1fr]'
				)}
			>
				<div className="overflow-hidden">
					<ul className="flex flex-col gap-1.5 pt-2.5 pb-2 md:pt-3 md:pb-0">
						{links?.map((item) => (
							<li key={item._key}>
								<SanityLink
									className="group inline-flex min-h-[38px] md:min-h-0 items-center py-1 text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:translate-x-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
									link={item as SanityLinkType}
								/>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}
