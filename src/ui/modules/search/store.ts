import { create } from 'zustand'
import type { SearchModule } from '@/sanity/types'
import {
	searchStorefront,
	type SearchResponse,
	type SearchResultItem,
	type SearchScope,
} from './actions'

export type { SearchResponse, SearchResultItem }

const EMPTY_RESPONSE: SearchResponse = {
	products: [],
	blogs: [],
	pages: [],
	totals: { products: 0, blogs: 0, pages: 0 },
	pageSize: 8,
}

let activeRequestSequence = 0

export type SearchFetcher = (params: {
	query: string
	scope?: SearchScope
	productPage?: number
	blogPage?: number
	pagePage?: number
	pageSize?: number
}) => Promise<SearchResponse>

type SearchStore = {
	loading: boolean
	error: string | null
	products: SearchResultItem[]
	blogs: SearchResultItem[]
	pages: SearchResultItem[]
	totals: SearchResponse['totals']
	pageSize: number
	setLoading: (loading: boolean) => void
	setError: (error: string | null) => void
	setResponse: (response: SearchResponse) => void
	clearResults: () => void
	search: (params: {
		query: string
		scope?: SearchModule['scope']
		productPage?: number
		blogPage?: number
		pagePage?: number
		pageSize?: number
	}) => Promise<void>
}

export const useSearchStore = create<SearchStore>((set) => ({
	loading: false,
	error: null,
	products: [],
	blogs: [],
	pages: [],
	totals: { products: 0, blogs: 0, pages: 0 },
	pageSize: 8,
	setLoading: (loading) => set({ loading }),
	setError: (error) => set({ error }),
	setResponse: (response) =>
		set({
			products: response.products,
			blogs: response.blogs,
			pages: response.pages,
			totals: response.totals,
			pageSize: response.pageSize,
		}),
	clearResults: () => {
		activeRequestSequence += 1
		set({
			loading: false,
			error: null,
			...EMPTY_RESPONSE,
		})
	},

	search: async ({
		query,
		scope = 'all',
		productPage = 1,
		blogPage = 1,
		pagePage = 1,
		pageSize = 8,
	}) => {
		await handleSearch({
			query,
			scope,
			productPage,
			blogPage,
			pagePage,
			pageSize,
			setLoading: (loading) => set({ loading }),
			setError: (error) => set({ error }),
			setResponse: (response) =>
				set({
					products: response.products,
					blogs: response.blogs,
					pages: response.pages,
					totals: response.totals,
					pageSize: response.pageSize,
				}),
		})
	},
}))

export async function handleSearch({
	scope = 'all',
	query,
	productPage = 1,
	blogPage = 1,
	pagePage = 1,
	pageSize = 8,
	setLoading,
	setError,
	setResponse,
	searchFn = searchStorefront,
}: {
	scope?: SearchModule['scope']
	query: string
	productPage?: number
	blogPage?: number
	pagePage?: number
	pageSize?: number
	setLoading: (loading: boolean) => void
	setError?: (error: string | null) => void
	setResponse: (response: SearchResponse) => void
	searchFn?: SearchFetcher
}) {
	const requestId = ++activeRequestSequence
	const trimmedQuery = typeof query === 'string' ? query.trim() : ''

	if (!trimmedQuery) {
		setResponse(EMPTY_RESPONSE)
		setError?.(null)
		setLoading(false)
		return
	}

	setLoading(true)
	setError?.(null)

	try {
		const response = await searchFn({
			query: trimmedQuery,
			scope: scope || 'all',
			productPage,
			blogPage,
			pagePage,
			pageSize,
		})
		if (requestId !== activeRequestSequence) return
		setResponse(response)
	} catch (err) {
		if (requestId !== activeRequestSequence) return
		setResponse(EMPTY_RESPONSE)
		setError?.(
			err instanceof Error && err.message
				? err.message
				: 'Search temporarily unavailable. Please try again.',
		)
	} finally {
		if (requestId === activeRequestSequence) {
			setLoading(false)
		}
	}
}
