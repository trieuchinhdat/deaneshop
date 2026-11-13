import { createClient } from 'next-sanity'
import { NextResponse } from 'next/server'
import { d1Query, PersistenceError, reviewsDb } from '@/lib/d1'
import { takeRateLimit } from '@/lib/rate-limit'
import { getApprovedReviewsForProduct } from '@/lib/reviews'
import {
	MAX_IMAGE_BYTES,
	MAX_REVIEW_IMAGES,
	MAX_REVIEW_TOTAL_BYTES,
	validImage,
} from '@/lib/upload-policy'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { isStaticStorefront } from '@/lib/deployment-profile'

function isUploadedFile(entry: unknown): entry is File {
	if (!entry || typeof entry !== 'object') return false
	if (typeof File !== 'undefined' && !(entry instanceof File)) return false
	const candidate = entry as any
	return typeof candidate.arrayBuffer === 'function' && typeof candidate.size === 'number' && typeof candidate.type === 'string'
}

function parseBoundedInt(raw: string | null, fallback: number, min: number, max: number): number | null {
	if (raw === null || raw === '') return fallback
	if (!/^\d+$/.test(raw.trim())) return null
	const n = Number(raw.trim())
	if (!Number.isSafeInteger(n) || n < min || n > max) return null
	return n
}

async function cleanupUploadedAssets(
	writeClient: ReturnType<typeof createClient> | null,
	assetIds: string[],
) {
	if (!writeClient || assetIds.length === 0) return
	await Promise.allSettled(assetIds.map((assetId) => writeClient.delete(assetId)))
}

export async function POST(req: Request) {
	if (isStaticStorefront) return NextResponse.json({ error: 'Review submissions are unavailable on this deployment.' }, { status: 403 })
	let writeClient: ReturnType<typeof createClient> | null = null
	const uploadedAssetIds: string[] = []

	try {
		const rawContentLength = Number(req.headers.get('content-length') || 0)
		if (Number.isFinite(rawContentLength) && rawContentLength > 16 * 1024 * 1024) {
			return NextResponse.json({ error: 'Upload too large' }, { status: 413 })
		}

		const formData = await req.formData()
		const files = formData
			.getAll('images')
			.filter((entry): entry is File => isUploadedFile(entry) && entry.size > 0)
		const videoEntries = formData
			.getAll('videos')
			.filter((entry): entry is File => isUploadedFile(entry) && entry.size > 0)

		if (videoEntries.length > 0 || files.length > MAX_REVIEW_IMAGES) {
			return NextResponse.json(
				{ error: `Up to ${MAX_REVIEW_IMAGES} images only; video uploads disabled` },
				{ status: 400 },
			)
		}

		let totalBytes = 0
		const validatedImages: Array<{ file: File; buffer: Buffer }> = []
		for (const file of files) {
			totalBytes += file.size
			if (totalBytes > MAX_REVIEW_TOTAL_BYTES) {
				return NextResponse.json({ error: 'Combined photo payload exceeds 15 MB limit' }, { status: 413 })
			}
			const arrayBuf = await file.arrayBuffer()
			if (arrayBuf.byteLength > MAX_IMAGE_BYTES || !validImage(new Uint8Array(arrayBuf), file.type)) {
				return NextResponse.json(
					{ error: 'Invalid image. Only JPEG, PNG, and WebP photos up to 5 MB each are allowed.' },
					{ status: 400 },
				)
			}
			validatedImages.push({ file, buffer: Buffer.from(arrayBuf) })
		}

		const productId = formData.get('productId')
		const productTitle = String(formData.get('productTitle') || '').slice(0, 240)
		const productSlug = String(formData.get('productSlug') || '').slice(0, 180)
		const author = formData.get('author')
		const authorEmail = String(formData.get('authorEmail') || '').slice(0, 160)
		const rating = Number(formData.get('rating') || 5)
		const comment = formData.get('comment')

		if (
			typeof productId !== 'string' ||
			typeof author !== 'string' ||
			typeof comment !== 'string' ||
			!productId.trim() ||
			!author.trim() ||
			!comment.trim() ||
			author.trim().length > 100 ||
			comment.trim().length > 4000 ||
			!Number.isInteger(rating) ||
			rating < 1 ||
			rating > 5
		) {
			return NextResponse.json(
				{ error: 'Please fill in all required fields (Product, Name, Comment).' },
				{ status: 400 },
			)
		}

		const rateQuery = typeof d1Query === 'function' ? d1Query : undefined
		if (rateQuery && !(await takeRateLimit('review', String(authorEmail || author), 5, 3600, rateQuery))) {
			return NextResponse.json({ error: 'Too many submissions' }, { status: 429 })
		}

		const mediaUrls: Array<{ url: string; type: 'image' }> = []
		if (validatedImages.length > 0) {
			const writeToken = process.env.SANITY_API_WRITE_TOKEN
			if (!writeToken) {
				return NextResponse.json(
					{
						error: 'Photo uploads are unavailable right now. Please try submitting without photos.',
					},
					{ status: 503 },
				)
			}

			writeClient = createClient({
				projectId,
				dataset,
				apiVersion,
				token: writeToken,
				useCdn: false,
			})

			try {
				for (const { file, buffer } of validatedImages) {
					const uploaded = await writeClient.assets.upload('image', buffer, {
						filename: file.name,
						contentType: file.type,
					})
					if (uploaded?._id) {
						uploadedAssetIds.push(uploaded._id)
					}
					if (!uploaded?.url) {
						throw new Error('Asset upload returned no CDN URL')
					}
					mediaUrls.push({ url: uploaded.url, type: 'image' })
				}
			} catch (assetErr: any) {
				await cleanupUploadedAssets(writeClient, uploadedAssetIds)
				return NextResponse.json(
					{
						error: assetErr?.message || 'Failed to upload review photos. Please try again.',
					},
					{ status: 502 },
				)
			}
		}

		// Store review in Cloudflare D1 (single source of truth)
		const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
		let d1Review
		try {
			d1Review = await reviewsDb.create({
				id: reviewId,
				product_id: productId.trim(),
				product_title: productTitle.trim() || null,
				product_slug: productSlug.trim() || null,
				author: author.trim(),
				author_email: authorEmail.trim() || null,
				rating: Math.min(Math.max(rating, 1), 5),
				comment: comment.trim(),
				media_urls_json: mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null,
				is_approved: 0,
			})
		} catch (dbErr) {
			await cleanupUploadedAssets(writeClient, uploadedAssetIds)
			throw dbErr
		}

		await d1Query?.(
			`INSERT INTO admin_events (type, resource_id, created_at) VALUES ('NEW_REVIEW', ?, ?)`,
			[d1Review.id, new Date().toISOString()],
		).catch(() => {})

		return NextResponse.json({
			success: true,
			message: 'Your review has been submitted successfully and is awaiting approval!',
			reviewId: d1Review.id,
		})
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('Error submitting review:', error)
		return NextResponse.json(
			{
				error:
					status === 503
						? 'Review storage unavailable'
						: error?.message || 'Error occurred while submitting review',
			},
			{ status },
		)
	}
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url)
		const productId = searchParams.get('productId') || undefined
		const limit = parseBoundedInt(searchParams.get('limit'), 20, 1, 50)
		const offset = parseBoundedInt(searchParams.get('offset'), 0, 0, 10000)

		if (limit === null || offset === null) {
			return NextResponse.json(
				{ success: false, error: 'Invalid pagination parameters' },
				{ status: 400 },
			)
		}

		const data = await getApprovedReviewsForProduct(productId, { limit, offset })

		return NextResponse.json({
			success: true,
			reviews: data.reviews,
			total: data.total,
			averageRating: data.averageRating,
			limit,
			offset,
		})
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('Error fetching reviews:', error)
		return NextResponse.json(
			{
				success: false,
				error: status === 503 ? 'Review storage unavailable' : error?.message || 'Failed to fetch reviews',
			},
			{ status },
		)
	}
}
