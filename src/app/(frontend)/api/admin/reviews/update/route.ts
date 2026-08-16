import { NextResponse } from 'next/server'
import { writeClient } from '@/sanity/lib/write-client'

export async function POST(req: Request) {
	try {
		const body = await req.json()
		const { reviewId, isApproved, response } = body

		if (!reviewId) {
			return NextResponse.json(
				{ success: false, message: 'Thiếu ID review cần cập nhật' },
				{ status: 400 },
			)
		}

		const patch = writeClient.patch(reviewId)

		if (typeof isApproved === 'boolean') {
			patch.set({ isApproved })
		}

		if (response !== undefined) {
			patch.set({ response: response.trim() || undefined })
		}

		const updatedDoc = await patch.commit()

		return NextResponse.json({
			success: true,
			review: updatedDoc,
		})
	} catch (error: any) {
		console.error('API Review Update Error:', error)
		return NextResponse.json(
			{ success: false, message: error.message || 'Lỗi khi cập nhật đánh giá' },
			{ status: 500 },
		)
	}
}
