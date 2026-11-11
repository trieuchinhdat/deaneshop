import { NextResponse } from 'next/server'
import { commentsDb, d1Query, PersistenceError } from '@/lib/d1'
import { takeRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}))
		const {
			postId,
			postTitle,
			postSlug,
			authorName,
			authorEmail,
			content,
			parentCommentId,
			honeypot,
		} = body || {}

		// 1. Honeypot Anti-Spam Trap: If filled, a bot entered it. Quietly succeed without saving.
		if (
			honeypot &&
			typeof honeypot === 'string' &&
			honeypot.trim().length > 0
		) {
			return NextResponse.json({
				success: true,
				message: 'Comment submitted successfully.',
			})
		}

		// 2. Validation
		if (!postId || typeof postId !== 'string') {
			return NextResponse.json(
				{ error: 'Invalid article identifier.' },
				{ status: 400 },
			)
		}

		const cleanName = (authorName || '').trim()
		const cleanEmail = (authorEmail || '').trim()
		const cleanContent = (content || '').trim()

		if (!cleanName || cleanName.length < 2 || cleanName.length > 80) {
			return NextResponse.json(
				{ error: 'Please enter a valid name (2–80 characters).' },
				{ status: 400 },
			)
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!cleanEmail || !emailRegex.test(cleanEmail)) {
			return NextResponse.json(
				{ error: 'Please enter a valid email address.' },
				{ status: 400 },
			)
		}

		if (
			!cleanContent ||
			cleanContent.length < 5 ||
			cleanContent.length > 1000
		) {
			return NextResponse.json(
				{ error: 'Comment must be between 5 and 1,000 characters.' },
				{ status: 400 },
			)
		}

		if (!(await takeRateLimit('comment', cleanEmail.toLowerCase(), 10, 3600))) {
			return NextResponse.json(
				{
					error:
						'Too many comment submissions. Please wait before posting again.',
				},
				{ status: 429 },
			)
		}

		// 3. PRIMARY: Insert into Cloudflare D1
		const commentId = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
		const d1Comment = await commentsDb.create({
			id: commentId,
			post_id: postId,
			post_title: postTitle || null,
			post_slug: postSlug || null,
			parent_comment_id: parentCommentId || null,
			author_name: cleanName,
			author_email: cleanEmail,
			content: cleanContent,
			is_author_reply: 0,
			is_approved: 0, // Default to moderated status
		})

		await d1Query?.(
			`INSERT INTO admin_events (type, resource_id, created_at) VALUES ('NEW_COMMENT', ?, ?)`,
			[d1Comment.id, new Date().toISOString()],
		).catch(() => {})

		return NextResponse.json({
			success: true,
			commentId: d1Comment.id,
			message:
				'Thank you! Your comment has been submitted and is pending review by our editorial team.',
		})
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('Error submitting comment:', error)
		return NextResponse.json(
			{
				error:
					status === 503
						? 'Comment service unavailable.'
						: 'An unexpected error occurred. Please try again later.',
			},
			{ status },
		)
	}
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url)
		const postId = searchParams.get('postId') || undefined
		const isApproved = 1

		const comments = await commentsDb.list({
			postId,
			isApproved,
		})

		return NextResponse.json({
			success: true,
			comments: comments.map(
				({ author_email, ...publicRecord }) => publicRecord,
			),
		})
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('Error getting comments:', error)
		return NextResponse.json(
			{
				success: false,
				error:
					status === 503
						? 'Comment service unavailable'
						: 'Failed to retrieve comments',
			},
			{ status },
		)
	}
}
