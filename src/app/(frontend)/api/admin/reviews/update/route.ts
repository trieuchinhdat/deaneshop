import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { PersistenceError, d1Query, reviewsDb } from '@/lib/d1'
import { ROUTES } from '@/lib/env'

async function revalidateReviewTargets(productSlug?: string | null) {
	try {
		const { revalidatePath, revalidateTag } = await import('next/cache')
		revalidateTag('product', 'max')
		revalidateTag('collection', 'max')
		revalidatePath(`/${ROUTES.products}/[slug]`, 'page')
		if (productSlug) {
			revalidatePath(`/${ROUTES.products}/${productSlug}`)
		}
	} catch {}
}

export async function POST(req: Request) {
	try {
		// 1. RBAC Guard: Superadmin & Admin can moderate reviews
		const auth = await requireAdminSession(['superadmin', 'admin'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, message: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const body = await req.json().catch(() => ({}))
		const { reviewId, isApproved, response, action } = body

		if (!reviewId) {
			return NextResponse.json(
				{ success: false, message: 'Missing review ID (reviewId)' },
				{ status: 400 },
			)
		}

		const existing = await reviewsDb.getById(reviewId)

		// 2. Delete Action: Only Super Admin & Admin can permanently delete reviews
		if (action === 'DELETE') {
			if (session.role !== 'superadmin' && session.role !== 'admin') {
				return NextResponse.json(
					{ success: false, message: 'Only Administrators can permanently delete product reviews.' },
					{ status: 403 },
				)
			}

			const deleted = await reviewsDb.delete(reviewId)
			if (!deleted) {
				return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 })
			}

			await d1Query?.(
				`INSERT INTO admin_events (type, resource_id, created_at) VALUES ('REVIEW_UPDATED', ?, ?)`,
				[reviewId, new Date().toISOString()],
			).catch(() => {})

			await revalidateReviewTargets(existing?.product_slug)

			return NextResponse.json({
				success: true,
				message: 'Review deleted successfully',
			})
		}

		// 3. Update Approval and/or Response in Cloudflare D1
		const patch: Record<string, any> = {}
		if (typeof isApproved === 'boolean') {
			patch.is_approved = isApproved ? 1 : 0
		}
		if (response !== undefined) {
			patch.response = String(response).trim() || null
		}

		const updated = await reviewsDb.update(reviewId, patch)
		if (!updated) {
			return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 })
		}

		await d1Query?.(
			`INSERT INTO admin_events (type, resource_id, created_at) VALUES ('REVIEW_UPDATED', ?, ?)`,
			[reviewId, new Date().toISOString()],
		).catch(() => {})

		await revalidateReviewTargets(existing?.product_slug)

		return NextResponse.json({
			success: true,
			message: 'Review updated successfully',
		})
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API Review Update Error:', error)
		return NextResponse.json(
			{ success: false, message: status === 503 ? 'Review database unavailable' : error.message || 'Error updating review' },
			{ status },
		)
	}
}
