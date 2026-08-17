'use client'

import { useState } from 'react'
import type { LinkList as LinkListType } from '@/sanity/types'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import { ChevronDown } from 'lucide-react'

interface LinkListProps extends LinkListType {
	isMobileAccordion?: boolean
}

export default function LinkList({
	link,
	links,
	isMobileAccordion = true,
}: LinkListProps) {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<div className="flex flex-col">
			{/* Header / Trigger */}
			<div className="flex items-center justify-between border-b border-border/40 pb-2 md:border-none md:pb-0">
				<h4 className="text-sm font-semibold tracking-wide text-foreground uppercase">
					{link?.label}
				</h4>
				{isMobileAccordion && (
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-transform md:hidden cursor-pointer"
						aria-label={`Toggle ${link?.label} menu`}
						aria-expanded={isOpen}
					>
						<ChevronDown
							className={`size-4 transition-transform duration-200 ${
								isOpen ? 'rotate-180 text-primary' : ''
							}`}
						/>
					</button>
				)}
			</div>

			{/* List Items */}
			<ul
				className={`flex flex-col gap-2 pt-3 transition-all duration-200 ${
					isMobileAccordion
						? `${isOpen ? 'max-md:flex' : 'max-md:hidden'} md:flex`
						: 'flex'
				}`}
			>
				{links?.map((item) => (
					<li key={item._key}>
						<SanityLink
							className="text-sm text-muted-foreground transition-colors hover:text-primary hover:translate-x-0.5 inline-block py-1"
							link={item as SanityLinkType}
						/>
					</li>
				))}
			</ul>
		</div>
	)
}
