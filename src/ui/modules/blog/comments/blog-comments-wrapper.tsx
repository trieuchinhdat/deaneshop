import { Suspense } from 'react'
import { connection } from 'next/server'
import { commentsDb } from '@/lib/d1'
import type { CommentItem } from './comment-card'
import CommentsSection from './comments-section'

export function CommentsSkeleton() {
	return (
		<div className="my-12 sm:my-16 border-t border-zinc-200/80 pt-10 sm:pt-14 dark:border-zinc-800 space-y-8 animate-pulse">
			<div className="space-y-2">
				<div className="h-8 w-64 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
				<div className="h-4 w-96 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
			</div>
			<div className="h-44 w-full rounded-3xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800" />
		</div>
	)
}

interface BlogCommentsWrapperProps {
	postId: string
	postTitle?: string
	postSlug?: string
	enableComments?: boolean
	allowComments?: boolean
	title?: string
	subtitle?: string
}

export default async function BlogCommentsWrapper({
	postId,
	enableComments = true,
	allowComments = true,
	title,
	subtitle,
}: BlogCommentsWrapperProps) {
	if (!enableComments || !allowComments || !postId) return null
	await connection()

	let commentItems: CommentItem[] = []

	try {
		const rawComments = await commentsDb.list({
			postId,
			isApproved: 1,
			limit: 100,
		})

		commentItems = (rawComments || [])
			.map((c) => ({
				_id: c.id,
				authorName: c.author_name,
				content: c.content,
				isAuthorReply: Boolean(c.is_author_reply),
				createdAt: c.created_at,
				parentId: c.parent_comment_id || undefined,
			}))
			.sort(
				(a, b) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
			)
	} catch (error) {
		console.error('Failed to fetch blog comments from D1:', error)
	}

	return (
		<CommentsSection
			postId={postId}
			comments={commentItems}
			enableComments={enableComments}
			allowComments={allowComments}
			title={title}
			subtitle={subtitle}
		/>
	)
}
