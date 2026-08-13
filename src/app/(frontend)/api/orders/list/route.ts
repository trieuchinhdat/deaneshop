import { NextResponse } from 'next/server'
import { writeClient } from '@/sanity/lib/write-client'

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const status = searchParams.get('status') || 'ALL'
		const search = searchParams.get('search') || ''

		let groqFilter = `_type == "order"`

		if (status !== 'ALL') {
			groqFilter += ` && fulfillmentStatus == "${status}"`
		}

		if (search.trim()) {
			const s = search.trim().toLowerCase()
			groqFilter += ` && (
				lower(orderId) match "*${s}*" || 
				lower(customer.name) match "*${s}*" || 
				lower(customer.phone) match "*${s}*" ||
				lower(trackingCode) match "*${s}*"
			)`
		}

		const query = `*[${groqFilter}] | order(_createdAt desc) [0...100] {
			_id,
			_createdAt,
			_updatedAt,
			_rev,
			orderId,
			customer,
			items,
			pricing,
			paymentMethod,
			paymentStatus,
			fulfillmentStatus,
			carrier,
			trackingCode,
			customerNote,
			internalNotes,
			history
		}`

		const orders = await writeClient.fetch(query)

		// Lấy số lượng theo các trạng thái (Counts)
		const countsQuery = `{
			"ALL": count(*[_type == "order"]),
			"PENDING": count(*[_type == "order" && fulfillmentStatus == "PENDING"]),
			"CONFIRMED": count(*[_type == "order" && fulfillmentStatus == "CONFIRMED"]),
			"PROCESSING": count(*[_type == "order" && fulfillmentStatus == "PROCESSING"]),
			"SHIPPING": count(*[_type == "order" && fulfillmentStatus == "SHIPPING"]),
			"DELIVERED": count(*[_type == "order" && fulfillmentStatus == "DELIVERED"]),
			"RETURNED": count(*[_type == "order" && fulfillmentStatus == "RETURNED"]),
			"CANCELLED": count(*[_type == "order" && fulfillmentStatus == "CANCELLED"])
		}`

		const counts = await writeClient.fetch(countsQuery)

		return NextResponse.json({
			success: true,
			orders: orders || [],
			counts: counts || {},
		})
	} catch (error: any) {
		console.error('API Orders List Error:', error)
		return NextResponse.json(
			{ success: false, message: error.message || 'Lỗi khi tải danh sách đơn hàng' },
			{ status: 500 },
		)
	}
}
