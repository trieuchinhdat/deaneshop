'use client'

import { useSearchParams } from 'next/navigation'
import { useQueryState } from 'nuqs'
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
	const [query, setQuery] = useQueryState('query', {
		defaultValue: '',
		shallow: true,
		clearOnDefault: true,
	})

	const { loading } = useSearchStore()

	// Fallback nếu người dùng truy cập qua ?q= thay vì ?query=
	useEffect(() => {
		const qParam = searchParams.get('q')
		if (!query && qParam) {
			setQuery(qParam)
		}
	}, [searchParams, query, setQuery])

	// 👇 TỐI ƯU: Sử dụng useCallback để tạo hàm debounce một lần duy nhất
	// Tăng thời gian lên 600ms hoặc 800ms để chờ người dùng gõ xong hẳn mới chạy
	const debouncedSetQuery = useCallback(
		debounce((value: string) => {
			setQuery(value || null)
		}, 1000),
		[setQuery],
	)

	return (
		<div className="mx-auto w-full max-w-4xl">
			{/* 1. FORM TÌM KIẾM */}
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

			{/* 2. KẾT QUẢ HIỂN THỊ */}
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

						{/* 🔴 QUAN TRỌNG: Không dùng toán tử 3 ngôi (loading ? : ) để ẩn hiện component này.
                            Vì nếu unmount, useEffect bên trong sẽ chạy lại gây vòng lặp.
                            
                            👉 Dùng CSS class để ẩn hiện.
                        */}

						{loading && (
							<div className="flex justify-center py-12">
								<Loading>Loading Search...</Loading>
							</div>
						)}

						<div className={loading ? 'hidden' : 'space-y-6'}>
							{/* 👇 FIX: Truyền thêm scope */}
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
