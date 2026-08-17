'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { PortableText } from 'next-sanity'
import { cn } from '@/lib/utils'

interface FAQItem {
	_key?: string
	question: string
	answer: any[]
}

interface FAQAccordionProps {
	title?: string
	items?: FAQItem[]
}

export default function FAQAccordion({
	title = 'Frequently Asked Questions',
	items = [],
}: FAQAccordionProps) {
	const [openIndexes, setOpenIndexes] = useState<Record<number, boolean>>({
		0: true, // First item open by default
	})

	if (!items || items.length === 0) return null

	const toggleIndex = (index: number) => {
		setOpenIndexes((prev) => ({
			...prev,
			[index]: !prev[index],
		}))
	}

	return (
		<section className="my-10 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 sm:p-7 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/40">
			{title && (
				<div className="flex items-center gap-2.5 border-b border-zinc-200/80 pb-4 dark:border-zinc-800">
					<HelpCircle className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
					<h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
						{title}
					</h3>
				</div>
			)}

			<div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
				{items.map((item, idx) => {
					const isOpen = !!openIndexes[idx]

					return (
						<div key={item._key || idx} className="py-3.5 first:pt-0 last:pb-0">
							<button
								type="button"
								onClick={() => toggleIndex(idx)}
								className="flex w-full cursor-pointer items-start justify-between gap-4 text-left font-semibold text-zinc-900 transition-colors hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
								aria-expanded={isOpen}
							>
								<span className="text-base sm:text-lg leading-snug">
									{item.question}
								</span>
								<span
									className={cn(
										'mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-200/70 text-zinc-600 transition-transform duration-200 dark:bg-zinc-800 dark:text-zinc-300',
										isOpen && 'rotate-180 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
									)}
								>
									<ChevronDown className="size-4" />
								</span>
							</button>

							<div
								className={cn(
									'overflow-hidden transition-all duration-300 ease-in-out',
									isOpen
										? 'max-h-[500px] pt-3 opacity-100'
										: 'max-h-0 opacity-0 pointer-events-none',
								)}
							>
								<div className="prose prose-sm max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed">
									{item.answer && <PortableText value={item.answer} />}
								</div>
							</div>
						</div>
					)
				})}
			</div>
		</section>
	)
}
