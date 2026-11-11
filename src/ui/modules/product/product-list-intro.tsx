'use client'

import Link from 'next/link'
import { PortableText } from 'next-sanity'
import { parseAsString, useQueryState } from 'nuqs'
import { Suspense } from 'react'
import { FiArrowRight } from 'react-icons/fi'

interface ProductListIntroProps {
	badge?: string
	intro?: any[]
	collectionTitle?: string
	collectionSlug?: string
	showViewAll?: boolean
	viewAllLabel?: string
	enableFilter?: boolean
	textColor?: string
}

function IntroContent({
	badge,
	intro,
	collectionTitle,
	collectionSlug,
	showViewAll,
	viewAllLabel,
	enableFilter,
	textColor,
}: ProductListIntroProps) {
	const [category] = useQueryState('category', parseAsString.withOptions({ shallow: true }))

	// If no badge, intro, collection, or view-all, return null
	const hasIntro = Array.isArray(intro) && intro.length > 0
	const hasBadge = Boolean(badge && badge.trim())
	const hasTitle = Boolean(collectionTitle && collectionTitle.trim())
	const hasViewAll = Boolean(showViewAll && collectionSlug)

	if (!hasIntro && !hasBadge && !hasTitle && !hasViewAll) {
		return null
	}

	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-100 pb-5 dark:border-slate-800">
			<div className="space-y-2 max-w-3xl">
				{/* Kicker / Category Badge */}
				{hasBadge && (
					<div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wider text-slate-800 uppercase dark:bg-slate-800 dark:text-slate-200">
						<span>{badge}</span>
					</div>
				)}

				{/* Primary Intro Content or Fallback Collection Title */}
				{hasIntro ? (
					<div
						className="prose prose-slate max-w-none dark:prose-invert prose-headings:mb-1 prose-headings:font-bold prose-p:my-1 prose-p:text-sm prose-p:text-gray-600 dark:prose-p:text-gray-300"
						style={{ color: textColor || undefined }}
					>
						<PortableText value={intro} />
					</div>
				) : hasTitle ? (
					<h2
						className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl dark:text-white"
						style={{ color: textColor || undefined }}
					>
						{collectionTitle}
					</h2>
				) : null}

				{/* Active Category Filter Indicator (if filter is active & intro exists) */}
				{enableFilter && category && (
					<div className="flex items-center gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400">
						<span>Filtering by category:</span>
						<span className="font-semibold text-slate-900 dark:text-white capitalize">
							{category.replace(/-/g, ' ')}
						</span>
					</div>
				)}
			</div>

			{/* View All Collection Link */}
			{hasViewAll && (
				<div className="shrink-0">
					<Link
						href={`/collections/${collectionSlug}`}
						className="group inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-2xs transition-all hover:border-slate-400 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
					>
						<span>{viewAllLabel || 'View All Products'}</span>
						<FiArrowRight
							className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
							aria-hidden="true"
						/>
					</Link>
				</div>
			)}
		</div>
	)
}

export default function ProductListIntro(props: ProductListIntroProps) {
	return (
		<Suspense fallback={null}>
			<IntroContent {...props} />
		</Suspense>
	)
}
