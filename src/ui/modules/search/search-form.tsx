'use client'

import { useSearchParams } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useEffect } from 'react'
import { IoIosSearch } from 'react-icons/io'
import { debounce } from '@/lib/utils'
import type { SearchModule } from '@/sanity/types'
import Loading from '@/ui/loading'
import GoogleResults from './google-results'
import SearchResults from './search-results'
import { useSearchStore } from './store'

export default function SearchPage({ scope }: Partial<SearchModule>) {
	const searchParams = useSearchParams()
	const [query, setQuery] = useQueryState(
		'query',
		parseAsString.withDefault('').withOptions({
			shallow: true,
			clearOnDefault: true,
		}),
	)

	const { loading, clearResults } = useSearchStore()

	// Clear stale results when query becomes empty
	useEffect(() => {
		if (!query.trim()) {
			clearResults()
		}
	}, [query, clearResults])

	// Fallback if accessed via ?q= instead of ?query=
	useEffect(() => {
		const qParam = searchParams.get('q')
		if (!query && qParam) {
			setQuery(qParam)
		}
	}, [searchParams, query, setQuery])

	// Debounced query updater
	const debouncedSetQuery = useCallback(
		debounce((value: string) => {
			setQuery(value || null)
		}, 1000),
		[setQuery],
	)

	return (
		<div className="mx-auto w-full max-w-4xl">
			{/* 1. SEARCH INPUT FORM */}
			<search className="relative mb-8">
				<label className="input input-bordered focus-within:ring-primary/20 flex items-center gap-2 rounded-xl py-2 shadow-sm focus-within:ring-2">
					<IoIosSearch className="text-xl" />
					<input
						id="query"
						className="grow bg-transparent py-1 text-lg outline-none"
						type="search"
						placeholder={scope === 'all' ? 'Search...' : `Search in ${scope}`}
						key={query}
						defaultValue={query}
						onChange={(e) => debouncedSetQuery(e.target.value)}
					/>
				</label>
			</search>

			{/* 2. RESULTS DISPLAY */}
			{query && (
				<output
					htmlFor="query"
					className="animate-in fade-in slide-in-from-bottom-2 block w-full duration-500"
				>
					<div className="space-y-8">
						<div className="border-b pb-4">
							<p className="text-muted-foreground text-lg">
								Search results for "
								<span className="text-primary font-medium">{query}</span>"
							</p>
						</div>

						{/* Keep component mounted to prevent re-triggering effects */}

						{loading && (
							<div className="flex justify-center py-12">
								<Loading>Loading Search...</Loading>
							</div>
						)}

						<div className={loading ? 'hidden' : 'space-y-6'}>
							<SearchResults query={query} scope={scope} />

							<div className="mt-8 border-t pt-8">
								<GoogleResults scope={scope} />
							</div>
						</div>
					</div>
				</output>
			)}
		</div>
	)
}
