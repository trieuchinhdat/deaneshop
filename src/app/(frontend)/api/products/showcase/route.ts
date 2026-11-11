import { groq } from 'next-sanity'
import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'
import { enrichProductsWithD1Reviews } from '@/lib/reviews'
import { client } from '@/sanity/lib/client'
import {
	PRODUCT_CARD_FIELDS,
	PRODUCT_CARD_SORT_PRICE,
} from '@/sanity/lib/product-card-query'
import { token } from '@/sanity/lib/token'

const PRODUCT_PROJECTION = groq`{${PRODUCT_CARD_FIELDS}}`

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url)
		const collectionId = searchParams.get('collectionId')?.trim() || null
		const rawCategory = searchParams.get('category')?.trim() || null
		const category = rawCategory && rawCategory !== 'all' ? rawCategory : null
		const sort = searchParams.get('sort')?.trim() || 'default'
		const offset = Math.max(
			0,
			parseInt(searchParams.get('offset') || '0', 10) || 0,
		)
		const limit = Math.min(
			48,
			Math.max(1, parseInt(searchParams.get('limit') || '8', 10) || 8),
		)

		// Sort Order GROQ fragment
		let orderClause = 'order(_createdAt desc)'
		if (sort === 'price_asc') {
			orderClause = `order(${PRODUCT_CARD_SORT_PRICE} asc, _id asc)`
		} else if (sort === 'price_desc') {
			orderClause = `order(${PRODUCT_CARD_SORT_PRICE} desc, _id asc)`
		} else if (sort === 'title_asc') {
			orderClause = 'order(title asc)'
		} else if (sort === 'title_desc') {
			orderClause = 'order(title desc)'
		} else if (sort === 'newest') {
			orderClause = 'order(_createdAt desc)'
		}

		// Category filter fragment
		const categoryFilter = category
			? '&& count((categories[]->slug.current)[@ == $category]) > 0'
			: ''

		let query = ''
		const params: Record<string, any> = {
			offset,
			limitEnd: offset + limit,
			category: category || null,
		}

		if (collectionId) {
			params.collectionId = collectionId

			if (sort === 'default') {
				// Follow collection curated sequence when default sort
				query = groq`{
					"total": count(*[_type == "product" && !(_id in path("drafts.**")) && _id in *[_type == "collection" && _id == $collectionId][0].products[]._ref ${categoryFilter}]),
					"products": *[_type == "collection" && _id == $collectionId][0].products[@-> != null && !(@->_id in path("drafts.**")) && (!defined($category) || count((@->categories[]->slug.current)[@ == $category]) > 0)][$offset...$limitEnd]-> ${PRODUCT_PROJECTION}
				}`
			} else {
				// Apply user-selected sort
				query = groq`{
					"total": count(*[_type == "product" && !(_id in path("drafts.**")) && _id in *[_type == "collection" && _id == $collectionId][0].products[]._ref ${categoryFilter}]),
					"products": *[_type == "product" && !(_id in path("drafts.**")) && _id in *[_type == "collection" && _id == $collectionId][0].products[]._ref ${categoryFilter}] | ${orderClause} [$offset...$limitEnd] ${PRODUCT_PROJECTION}
				}`
			}
		} else {
			// Catalog-wide showcase
			query = groq`{
				"total": count(*[_type == "product" && !(_id in path("drafts.**")) ${categoryFilter}]),
				"products": *[_type == "product" && !(_id in path("drafts.**")) ${categoryFilter}] | ${orderClause} [$offset...$limitEnd] ${PRODUCT_PROJECTION}
			}`
		}

		const preview =
			process.env.NODE_ENV === 'development' || (await draftMode()).isEnabled
		const data = await client.fetch(query, params, {
			perspective: preview ? 'drafts' : 'published',
			...(preview ? { token } : {}),
			useCdn: !preview,
			...(preview
				? { cache: 'no-store' as const }
				: { next: { revalidate: 60, tags: ['product', 'collection'] } }),
		})

		const products = await enrichProductsWithD1Reviews(data?.products || [])
		const total = data?.total || 0
		const hasMore = offset + products.length < total

		return NextResponse.json(
			{
				products,
				total,
				hasMore,
				offset,
				limit,
			},
			{
				headers: {
					'Cache-Control': preview
						? 'private, no-store'
						: 'public, s-maxage=60, stale-while-revalidate=120',
				},
			},
		)
	} catch (error: any) {
		console.error('[Product Showcase API Error]:', error)
		return NextResponse.json(
			{ error: error?.message || 'Failed to fetch showcase products' },
			{ status: 500 },
		)
	}
}
