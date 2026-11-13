import type { SearchResponse, SearchResultItem, SearchScope } from './actions'

export type { SearchResponse, SearchResultItem, SearchScope }

export async function searchStorefront(input: {
	query: string
	scope?: SearchScope
	productPage?: number
	blogPage?: number
	pagePage?: number
	pageSize?: number
}): Promise<SearchResponse> {
	const response = await fetch('/api/search', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!response.ok) throw new Error('Search is temporarily unavailable. Please try again.')
	return response.json()
}
