import { NextResponse } from 'next/server'
import { writeClient } from '@/sanity/lib/write-client'

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}))
		const { commentId, action, isApproved, isAuthorReply, replyContent, authorName } = body

		if (!commentId) {
			return NextResponse.json(
				{ success: false, error: 'Thiếu mã bình luận (commentId).' },
				{ status: 400 },
			)
		}

		// 1. Action: Xóa bình luận (Spam/Vi phạm)
		if (action === 'DELETE') {
			await writeClient.delete(commentId)
			return NextResponse.json({
				success: true,
				message: 'Đã xóa bình luận thành công.',
			})
		}

		// 2. Action: Tạo phản hồi chính thức từ Tác giả / Chuyên viên (Reply to comment)
		if (action === 'REPLY' && replyContent?.trim()) {
			// Lấy thông tin bài viết từ comment cha
			const parentDoc = await writeClient.fetch(
				`*[_type == "blog.comment" && _id == $commentId][0]{
					_id,
					"postId": post._ref
				}`,
				{ commentId },
			)

			if (!parentDoc?.postId) {
				return NextResponse.json(
					{ success: false, error: 'Không tìm thấy bài viết tương ứng với bình luận này.' },
					{ status: 404 },
				)
			}

			const replyDoc = {
				_type: 'blog.comment',
				post: {
					_type: 'reference',
					_ref: parentDoc.postId,
				},
				authorName: authorName?.trim() || 'Ecocros Specialist (Tác giả)',
				authorEmail: 'contact@ecocros.com',
				content: replyContent.trim(),
				isAuthorReply: true,
				isApproved: true,
				parentComment: {
					_type: 'reference',
					_ref: commentId,
				},
				createdAt: new Date().toISOString(),
			}

			const createdReply = await writeClient.create(replyDoc)

			// Tự động duyệt comment cha nếu chưa duyệt
			await writeClient.patch(commentId).set({ isApproved: true }).commit()

			return NextResponse.json({
				success: true,
				reply: createdReply,
				message: 'Đã đăng phản hồi chính thức của Tác giả thành công!',
			})
		}

		// 3. Action: Cập nhật trạng thái Duyệt (Approved) / Huy hiệu Tác giả (Author Badge)
		const patchData: Record<string, any> = {}
		if (typeof isApproved === 'boolean') {
			patchData.isApproved = isApproved
		}
		if (typeof isAuthorReply === 'boolean') {
			patchData.isAuthorReply = isAuthorReply
		}

		const updated = await writeClient.patch(commentId).set(patchData).commit()

		return NextResponse.json({
			success: true,
			comment: updated,
			message: 'Cập nhật trạng thái bình luận thành công!',
		})
	} catch (error: any) {
		console.error('Lỗi API Admin Comments Update:', error)
		return NextResponse.json(
			{ success: false, error: error?.message || 'Có lỗi xảy ra khi cập nhật bình luận.' },
			{ status: 500 },
		)
	}
}
