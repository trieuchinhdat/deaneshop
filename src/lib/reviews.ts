import { d1Query, reviewsDb, type D1Review } from '@/lib/d1'
import { isStaticStorefront } from './deployment-profile'

export interface PublicReviewMediaItem {
	url: string
	asset: {
		url: string
		alt?: string
	}
}

export interface PublicProductReview {
	_id: string
	id: string
	productId: string
	author: string
	rating: number
	comment: string
	response: string | null
	createdAt: string
	images: PublicReviewMediaItem[]
	videos: PublicReviewMediaItem[]
}

export interface ProductReviewAggregate {
	count: number
	avgRating: number
}

function isSafeMediaUrl(raw: unknown): raw is string {
	if (typeof raw !== 'string') return false
	const trimmed = raw.trim()
	if (!trimmed) return false
	if (trimmed.startsWith('/')) return true
	try {
		const u = new URL(trimmed)
		return u.protocol === 'https:' || u.protocol === 'http:'
	} catch {
		return false
	}
}

export function parseReviewMediaUrls(mediaUrlsJson?: string | null): {
	images: PublicReviewMediaItem[]
	videos: PublicReviewMediaItem[]
} {
	if (!mediaUrlsJson) return { images: [], videos: [] }
	let parsed: unknown = []
	try {
		parsed = JSON.parse(mediaUrlsJson)
	} catch {
		return { images: [], videos: [] }
	}
	if (!Array.isArray(parsed)) return { images: [], videos: [] }

	const images: PublicReviewMediaItem[] = []
	const videos: PublicReviewMediaItem[] = []

	for (const entry of parsed) {
		if (!entry || typeof entry !== 'object') continue
		const url = (entry as any).url
		const type = (entry as any).type
		if (!isSafeMediaUrl(url)) continue
		if (type === 'image') {
			images.push({
				url,
				asset: { url, alt: 'Customer review photo' },
			})
		} else if (type === 'video') {
			videos.push({
				url,
				asset: { url },
			})
		}
	}

	return { images, videos }
}

/**
 * Strip `author_email` and transform a D1 review row into the public storefront shape.
 */
export function formatPublicReview(row: Partial<D1Review> & Record<string, any>): PublicProductReview {
	const { images, videos } = parseReviewMediaUrls(row.media_urls_json ?? null)
	const ratingNum = Number(row.rating)
	return {
		_id: String(row.id || row._id || ''),
		id: String(row.id || row._id || ''),
		productId: String(row.product_id || row.productId || ''),
		author: String(row.author || 'Verified Buyer'),
		rating: Number.isFinite(ratingNum) ? Math.min(5, Math.max(1, ratingNum)) : 5,
		comment: String(row.comment || ''),
		response: row.response ? String(row.response) : null,
		createdAt: String(row.created_at || row.createdAt || ''),
		images,
		videos,
	}
}

/**
 * Fetch approved review count & average rating for a batch of product IDs from D1
 * using grouped SQL queries (no N+1).
 */
export async function getApprovedReviewAggregates(
	productIds: string[],
): Promise<Map<string, ProductReviewAggregate>> {
	const map = new Map<string, ProductReviewAggregate>()
	if (isStaticStorefront) return map
	const uniqueIds = Array.from(
		new Set(productIds.map((id) => (typeof id === 'string' ? id.trim() : '')).filter(Boolean)),
	)
	if (uniqueIds.length === 0) return map

	try {
		const CHUNK_SIZE = 80
		for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
			const chunk = uniqueIds.slice(i, i + CHUNK_SIZE)
			const placeholders = chunk.map(() => '?').join(', ')
			const sql = `
				SELECT product_id, COUNT(*) AS review_count, AVG(rating) AS avg_rating
				FROM reviews
				WHERE is_approved = 1 AND product_id IN (${placeholders})
				GROUP BY product_id
			`
			const res = await d1Query<{
				product_id: string
				review_count: number
				avg_rating: number
			}>(sql, chunk)

			for (const row of res.results || []) {
				const count = Number(row.review_count) || 0
				const avgRating = count > 0 ? Number(row.avg_rating) || 0 : 0
				map.set(row.product_id, {
					count,
					avgRating: Math.round(avgRating * 100) / 100,
				})
			}
		}
	} catch (err) {
		console.warn('[Reviews] Failed to load D1 review aggregates:', err)
	}

	return map
}

/**
 * Fetch bounded, paginated approved reviews + accurate aggregate stats for one product from D1.
 * Never selects or returns `author_email`.
 */
export async function getApprovedReviewsForProduct(
	productId?: string,
	options?: { limit?: number; offset?: number },
): Promise<{
	reviews: PublicProductReview[]
	total: number
	averageRating: number
}> {
	if (isStaticStorefront) return { reviews: [], total: 0, averageRating: 0 }
	const limit = Math.min(100, Math.max(1, Math.floor(Number(options?.limit) || 50)))
	const offset = Math.max(0, Math.floor(Number(options?.offset) || 0))
	const cleanProductId = productId && productId.trim() ? productId.trim() : undefined

	const rawRows = await reviewsDb.list({
		productId: cleanProductId,
		isApproved: 1,
		limit,
		offset,
	})
	const reviews = (rawRows || []).map((row) => formatPublicReview(row))

	let total = reviews.length
	let averageRating =
		total > 0
			? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 100) / 100
			: 0

	if (typeof d1Query === 'function') {
		try {
			const whereParts = ['is_approved = 1']
			const whereParams: any[] = []
			if (cleanProductId) {
				whereParts.push('product_id = ?')
				whereParams.push(cleanProductId)
			}
			const aggRes = await d1Query<{ total: number; avg_rating: number }>(
				`SELECT COUNT(*) AS total, AVG(rating) AS avg_rating FROM reviews WHERE ${whereParts.join(' AND ')}`,
				whereParams,
			)
			const dbTotal = Number(aggRes.results?.[0]?.total)
			const dbAvg = Number(aggRes.results?.[0]?.avg_rating)
			if (Number.isFinite(dbTotal) && dbTotal >= 0) {
				total = dbTotal
				averageRating = total > 0 && Number.isFinite(dbAvg) ? Math.round(dbAvg * 100) / 100 : 0
			}
		} catch (err) {
			console.warn('[Reviews] Failed to query D1 review aggregate stats:', err)
		}
	}

	return { reviews, total, averageRating }
}

/**
 * Enrich Sanity product records with approved D1 review aggregates (`reviewSummary` + `reviews`).
 */
export async function enrichProductsWithD1Reviews<T extends Record<string, any>>(
	products: T[],
): Promise<T[]> {
	if (!Array.isArray(products) || products.length === 0) return products
	const ids = products.map((p) => p?._id).filter((id): id is string => typeof id === 'string' && Boolean(id))
	const aggregates = await getApprovedReviewAggregates(ids)

	return products.map((product) => {
		const agg = product?._id ? aggregates.get(product._id) : undefined
		if (!agg || agg.count <= 0) {
			return {
				...product,
				reviewSummary: { count: 0, avgRating: 0 },
				reviews: [],
			}
		}
		return {
			...product,
			reviewSummary: agg,
			reviews: Array.from({ length: Math.min(agg.count, 50) }, () => ({
				rating: agg.avgRating,
			})),
		}
	})
}
