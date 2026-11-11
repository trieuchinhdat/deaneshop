import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { getEnvVarSync } from '@/lib/cf-env'
import { PersistenceError, commentsDb, d1Query } from '@/lib/d1'

export async function POST(req: Request) {
	try {
		// 1. RBAC Guard: Superadmin, Admin, Marketing can moderate blog comments
		const auth = await requireAdminSession(['superadmin', 'admin', 'marketing'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const body = await req.json().catch(() => ({}))
		const { commentId, action, isApproved, isAuthorReply, replyContent, authorName } = body

		if (!commentId) {
			return NextResponse.json(
				{ success: false, error: 'Missing comment identifier (commentId).' },
				{ status: 400 },
			)
		}

		// 2. Action: Delete Comment (Only Super Admin & Admin)
		if (action === 'DELETE') {
			if (session.role !== 'superadmin' && session.role !== 'admin') {
				return NextResponse.json(
					{ success: false, error: 'Only Administrators can permanently delete blog discussions.' },
					{ status: 403 },
				)
			}

			const deleted = await commentsDb.delete(commentId)
			if (!deleted) {
				return NextResponse.json({ success: false, error: 'Comment not found.' }, { status: 404 })
			}

			return NextResponse.json({
				success: true,
				message: 'Comment deleted successfully.',
			})
		}

		// 3. Action: Official Reply from Author/Specialist
		if (action === 'REPLY' && replyContent?.trim()) {
			const parentComment = await commentsDb.getById(commentId)
			if (!parentComment) {
				return NextResponse.json({ success: false, error: 'Parent comment not found.' }, { status: 404 })
			}
			const replyId = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

			const replyDoc = await commentsDb.create({
				id: replyId,
				post_id: parentComment.post_id,
				post_title: parentComment.post_title || null,
				post_slug: parentComment.post_slug || null,
				parent_comment_id: commentId,
				author_name: authorName?.trim() || session.name || 'Editorial Team',
				author_email: getEnvVarSync('SUPPORT_EMAIL') || 'support@store.com',
				content: replyContent.trim(),
				is_author_reply: 1,
				is_approved: 1,
			})

			// Auto-approve parent comment
			await commentsDb.update(commentId, { is_approved: 1 })

			return NextResponse.json({
				success: true,
				reply: replyDoc,
				message: 'Official reply posted successfully!',
			})
		}

		// 4. Action: Update Approval / Author Badge in D1
		const patch: Record<string, any> = {}
		if (typeof isApproved === 'boolean') {
			patch.is_approved = isApproved ? 1 : 0
		}
		if (typeof isAuthorReply === 'boolean') {
			patch.is_author_reply = isAuthorReply ? 1 : 0
		}

		const updated = await commentsDb.update(commentId, patch)
		if (!updated) {
			return NextResponse.json({ success: false, error: 'Comment not found.' }, { status: 404 })
		}

		await d1Query?.(
			`INSERT INTO admin_events (type, resource_id, created_at) VALUES ('COMMENT_UPDATED', ?, ?)`,
			[commentId, new Date().toISOString()],
		).catch(() => {})

		return NextResponse.json({
			success: true,
			message: 'Comment status updated successfully!',
		})
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API Admin Comments Update Error:', error)
		return NextResponse.json(
			{ success: false, error: status === 503 ? 'Comment database unavailable.' : error?.message || 'Error updating comment.' },
			{ status },
		)
	}
}
