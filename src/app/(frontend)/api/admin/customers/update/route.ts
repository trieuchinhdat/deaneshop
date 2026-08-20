import { NextResponse } from 'next/server'
import { writeClient } from '@/sanity/lib/write-client'

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}))
		const { customerId, cskhStatus, newNote, internalNote, author = 'Admin CSKH' } = body
		const noteText = newNote || internalNote

		if (!customerId) {
			return NextResponse.json(
				{ success: false, message: 'Thiếu ID khách hàng cần cập nhật' },
				{ status: 400 },
			)
		}

		// Lấy document khách hàng hiện tại
		const currentCustomer = await writeClient.fetch(
			`*[_type == "customer" && _id == $customerId][0]`,
			{ customerId },
		)

		if (!currentCustomer) {
			return NextResponse.json(
				{ success: false, message: 'Không tìm thấy hồ sơ khách hàng' },
				{ status: 404 },
			)
		}

		const patch = writeClient.patch(customerId)

		if (cskhStatus) {
			patch.set({ cskhStatus })
		}

		if (noteText && noteText.trim()) {
			const noteItem = {
				_key: `${Date.now()}`,
				author,
				note: noteText.trim(),
				timestamp: new Date().toISOString(),
			}
			const updatedNotes = [noteItem, ...(currentCustomer.internalNotes || [])]
			patch.set({ internalNotes: updatedNotes })
		}

		const updatedDoc = await patch.commit()

		return NextResponse.json({
			success: true,
			customer: updatedDoc,
		})
	} catch (error: any) {
		console.error('API Customer Update Error:', error)
		return NextResponse.json(
			{ success: false, message: error.message || 'Lỗi khi cập nhật hồ sơ khách hàng' },
			{ status: 500 },
		)
	}
}
