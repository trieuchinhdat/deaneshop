import { NextResponse } from 'next/server'
import { writeClient } from '@/sanity/lib/write-client'

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const {
			docId,
			fulfillmentStatus,
			paymentStatus,
			carrier,
			trackingCode,
			internalNote,
			author = 'Admin CSKH',
		} = body

		if (!docId) {
			return NextResponse.json(
				{ success: false, message: 'Thiếu ID đơn hàng cần cập nhật' },
				{ status: 400 },
			)
		}

		// Lấy đơn hàng hiện tại để ghép lịch sử & check revision
		const currentOrder = await writeClient.fetch(`*[_type == "order" && _id == $docId][0]`, { docId })
		if (!currentOrder) {
			return NextResponse.json(
				{ success: false, message: 'Không tìm thấy đơn hàng' },
				{ status: 404 },
			)
		}

		const patch = writeClient.patch(docId)

		const historyItem = {
			_key: `${Date.now()}`,
			timestamp: new Date().toISOString(),
			action: `Cập nhật trạng thái: [Trạng thái giao: ${fulfillmentStatus || currentOrder.fulfillmentStatus}] [Thanh toán: ${paymentStatus || currentOrder.paymentStatus}]`,
			user: author,
		}

		const updatedHistory = [...(currentOrder.history || []), historyItem]
		patch.set({ history: updatedHistory })

		if (fulfillmentStatus) patch.set({ fulfillmentStatus })
		if (paymentStatus) patch.set({ paymentStatus })
		if (carrier !== undefined) patch.set({ carrier })
		if (trackingCode !== undefined) patch.set({ trackingCode })

		if (internalNote && internalNote.trim()) {
			const noteItem = {
				_key: `${Date.now()}`,
				author,
				note: internalNote.trim(),
				timestamp: new Date().toISOString(),
			}
			const updatedNotes = [...(currentOrder.internalNotes || []), noteItem]
			patch.set({ internalNotes: updatedNotes })
		}

		const updatedDoc = await patch.commit()

		return NextResponse.json({
			success: true,
			order: updatedDoc,
		})
	} catch (error: any) {
		console.error('API Order Update Error:', error)
		return NextResponse.json(
			{ success: false, message: error.message || 'Lỗi khi cập nhật trạng thái đơn hàng' },
			{ status: 500 },
		)
	}
}
