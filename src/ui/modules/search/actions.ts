'use server'

import { groq } from 'next-sanity'
import { draftMode } from 'next/headers'
import { ROUTES } from '@/lib/env'
import { enrichProductsWithD1Reviews } from '@/lib/reviews'
import { sanityFetchLive } from '@/sanity/lib/live'
import { PRODUCT_CARD_FIELDS } from '@/sanity/lib/product-card-query'
import type { SearchModule } from '@/sanity/types'

export type SearchScope = NonNullable<SearchModule['scope']>

export interface SearchResultItem {
	_id: string
	_type: 'product' | 'blog.post' | 'page'
	title?: string | null
	price?: number | null
	compareAtPrice?: number | null
	images?: any[]
	reviews?: Array<{ rating: number }>
	metadata?: any
	slug: string
}

export interface SearchResponse {
	products: SearchResultItem[]
	blogs: SearchResultItem[]
	pages: SearchResultItem[]
	totals: {
		products: number
		blogs: number
		pages: number
	}
	pageSize: number
}

const DEFAULT_PAGE_SIZE = 8
const MAX_PAGE_SIZE = 24
const MAX_PAGE = 100
const MAX_QUERY_LENGTH = 120

const ALLOWED_SCOPES = new Set<SearchScope>([
	'all',
	'blog posts',
	'pages',
	'product',
])

const TYPE_FOR_SCOPE: Record<
	Exclude<SearchScope, 'all'>,
	'blog.post' | 'page' | 'product'
> = {
	'blog posts': 'blog.post',
	pages: 'page',
	product: 'product',
}

function clampInt(
	value: unknown,
	fallback: number,
	min: number,
	max: number,
): number {
	const num = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(num)) return fallback
	const int = Math.trunc(num)
	if (int < min) return min
	if (int > max) return max
	return int
}

const SEARCH_GROUP_QUERY = groq`{
	"items": *[
		_type == $docType
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
	] | order(_updatedAt desc) [$start...$end]{
		_id,
		_type,
		title,
		${PRODUCT_CARD_FIELDS},
		metadata{
			...,
			image{
				...,
				asset->
			}
		},
		'slug': select(
			_type == 'product' => $productDir + metadata.slug.current,
			_type == 'blog.post' => $blogDir + metadata.slug.current,
			metadata.slug.current == 'index' => '/',
			'/' + metadata.slug.current
		)
	},
	"total": count(*[
		_type == $docType
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
	])
}`

export async function searchStorefront(input: {
	query: string
	scope?: SearchScope
	productPage?: number
	blogPage?: number
	pagePage?: number
	pageSize?: number
}): Promise<SearchResponse> {
	const rawQuery = typeof input?.query === 'string' ? input.query.trim() : ''
	const safeQuery = rawQuery
		.slice(0, MAX_QUERY_LENGTH)
		.replace(/\*/g, '')
		.trim()
	const pageSize = clampInt(
		input?.pageSize,
		DEFAULT_PAGE_SIZE,
		1,
		MAX_PAGE_SIZE,
	)

	if (!safeQuery) {
		return {
			products: [],
			blogs: [],
			pages: [],
			totals: { products: 0, blogs: 0, pages: 0 },
			pageSize,
		}
	}

	const rawScope = input?.scope
	const scope: SearchScope =
		typeof rawScope === 'string' && ALLOWED_SCOPES.has(rawScope as SearchScope)
			? (rawScope as SearchScope)
			: 'all'

	const productPage = clampInt(input?.productPage, 1, 1, MAX_PAGE)
	const blogPage = clampInt(input?.blogPage, 1, 1, MAX_PAGE)
	const pagePage = clampInt(input?.pagePage, 1, 1, MAX_PAGE)

	const isDraft = (await draftMode()).isEnabled
	const perspective =
		process.env.NODE_ENV === 'development' || isDraft ? 'drafts' : 'published'

	const targetTypes: Array<'product' | 'blog.post' | 'page'> =
		scope === 'all' ? ['product', 'blog.post', 'page'] : [TYPE_FOR_SCOPE[scope]]

	const queryMatch = `*${safeQuery}*`
	const blogDir = `/${ROUTES.blog}/`
	const productDir = `/${ROUTES.products}/`

	const fetchGroup = async (
		docType: 'product' | 'blog.post' | 'page',
		pageNum: number,
	) => {
		const start = (pageNum - 1) * pageSize
		const end = start + pageSize
		const res = await sanityFetchLive<{
			items?: SearchResultItem[]
			total?: number
		}>({
			query: SEARCH_GROUP_QUERY,
			params: {
				docType,
				queryMatch,
				start,
				end,
				blogDir,
				productDir,
			},
			perspective,
		})
		return {
			items: Array.isArray(res?.items) ? res.items.slice(0, pageSize) : [],
			total: typeof res?.total === 'number' && res.total >= 0 ? res.total : 0,
		}
	}

	const [productGroup, blogGroup, pageGroup] = await Promise.all([
		targetTypes.includes('product')
			? fetchGroup('product', productPage)
			: Promise.resolve({ items: [], total: 0 }),
		targetTypes.includes('blog.post')
			? fetchGroup('blog.post', blogPage)
			: Promise.resolve({ items: [], total: 0 }),
		targetTypes.includes('page')
			? fetchGroup('page', pagePage)
			: Promise.resolve({ items: [], total: 0 }),
	])

	const enrichedProducts = await enrichProductsWithD1Reviews(
		productGroup.items as any[],
	)

	return {
		products: enrichedProducts as SearchResultItem[],
		blogs: blogGroup.items,
		pages: pageGroup.items,
		totals: {
			products: productGroup.total,
			blogs: blogGroup.total,
			pages: pageGroup.total,
		},
		pageSize,
	}
}
