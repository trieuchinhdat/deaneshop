import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

export async function POST(req: Request) {
	try {
		const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN

		if (!token) {
			return NextResponse.json(
				{ error: 'Server configuration error: SANITY_API_WRITE_TOKEN is missing.' },
				{ status: 500 },
			)
		}

		const body = await req.json()
		const {
			postId,
			authorName,
			authorEmail,
			content,
			parentCommentId,
			honeypot,
		} = body || {}

		// 1. Honeypot Anti-Spam Trap: If filled, a bot entered it. Quietly succeed without saving.
		if (honeypot && typeof honeypot === 'string' && honeypot.trim().length > 0) {
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

		if (!cleanContent || cleanContent.length < 5 || cleanContent.length > 1000) {
			return NextResponse.json(
				{ error: 'Comment must be between 5 and 1,000 characters.' },
				{ status: 400 },
			)
		}

		const writeClient = createClient({
			projectId,
			dataset,
			apiVersion,
			token,
			useCdn: false,
		})

		// 3. Create blog.comment document
		const newDoc: any = {
			_type: 'blog.comment',
			post: {
				_type: 'reference',
				_ref: postId,
			},
			authorName: cleanName,
			authorEmail: cleanEmail,
			content: cleanContent,
			isAuthorReply: false,
			isApproved: false, // Default to moderated status for SEO safety
			createdAt: new Date().toISOString(),
		}

		if (parentCommentId && typeof parentCommentId === 'string') {
			newDoc.parentComment = {
				_type: 'reference',
				_ref: parentCommentId,
			}
		}

		await writeClient.create(newDoc)

		return NextResponse.json({
			success: true,
			message: 'Thank you! Your comment has been submitted and is pending review by our editorial team.',
		})
	} catch (error: any) {
		console.error('Error submitting comment:', error)
		return NextResponse.json(
			{ error: 'An unexpected error occurred. Please try again later.' },
			{ status: 500 },
		)
	}
}
