import { groq } from 'next-sanity'
import { create } from 'zustand'
import { ROUTES } from '@/lib/env'
import { sanityFetchLive } from '@/sanity/lib/live'
import type { SEARCH_QUERY_RESULT, SearchModule } from '@/sanity/types'

// 1. Định nghĩa Type cho Store
type SearchStore = {
	loading: boolean
	setLoading: (loading: boolean) => void
	results: SEARCH_QUERY_RESULT
	setResults: (results: SEARCH_QUERY_RESULT) => void
	// 👇 Thêm action search vào store
	search: (params: {
		query: string
		scope?: SearchModule['scope']
	}) => Promise<void>
}

export const useSearchStore = create<SearchStore>((set) => ({
	loading: false,
	setLoading: (loading) => set({ loading }),
	results: [],
	setResults: (results) => set({ results }),

	// 👇 Tích hợp logic search vào store
	search: async ({ query, scope = 'all' }) => {
		// Tận dụng hàm handleSearch có sẵn
		await handleSearch({
			query,
			scope,
			setLoading: (l) => set({ loading: l }),
			setResults: (r) => set({ results: r }),
		})
	},
}))

const SCOPE_MAP = {
	'blog posts': 'blog.post',
	pages: 'page',
	product: 'product',
}

// Hàm này giữ nguyên để xử lý logic gọi API
export async function handleSearch({
	scope = 'all',
	query,
	setLoading,
	setResults,
}: {
	scope: SearchModule['scope']
	query: string
	setLoading: (loading: boolean) => void
	setResults: (results: SEARCH_QUERY_RESULT) => void
}) {
	if (!query) {
		setResults([])
		setLoading(false)
		return
	}

	setLoading(true)

	const scopeValue = SCOPE_MAP[scope as keyof typeof SCOPE_MAP]

	const results = await sanityFetchLive<SEARCH_QUERY_RESULT>({
		query: SEARCH_QUERY,
		params: {
			queryMatch: `*${query}*`,
			scope: scope === 'all' ? Object.values(SCOPE_MAP) : [scopeValue],
			blogDir: `/${ROUTES.blog}/`,
			productDir: `/${ROUTES.products}/`,
		},
	})

	setResults(results)
	setLoading(false)
}

const SEARCH_QUERY = groq`*[
    _type in $scope
    && defined(metadata.slug.current)
    && metadata.noIndex != true
    && !(metadata.slug.current in ['404'])
    && [
        modules[].intro[].children[].text,
        modules[].content[].children[].text,
        content[].children[].text,
        title,
        metadata.title,
        metadata.description
    ] match $queryMatch
]{
    _id,
    _type,
    title,
    price,
    "compareAtPrice": compareAtPrice,
    images,
    "reviews": *[_type == "review" && references(^._id) && isApproved == true]{ rating },
    metadata{
        ...,
        image{
            ...,
            asset->
        }
    },
    'slug': select(
        _type == 'product' => '/products/' + metadata.slug.current, 
        _type == 'blog.post' => $blogDir + metadata.slug.current,
        metadata.slug.current == 'index' => '/',
        '/' + metadata.slug.current
    )
}`
