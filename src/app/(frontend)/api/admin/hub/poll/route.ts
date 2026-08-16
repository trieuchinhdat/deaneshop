import { NextResponse } from 'next/server'
import { writeClient } from '@/sanity/lib/write-client'

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url)
		const since = searchParams.get('since')

		const [newOrders, allOrders, allCustomers, allReviews] = await Promise.all([
			since
				? writeClient.fetch(
						`*[_type == "order" && _createdAt > $since] | order(_createdAt desc) {
							_id,
							_createdAt,
							orderId,
							customer,
							items,
							pricing,
							paymentMethod,
							paymentStatus,
							fulfillmentStatus,
							customerNote
						}`,
						{ since },
					)
				: Promise.resolve([]),

			writeClient.fetch(
				`*[_type == "order"] | order(_createdAt desc) {
					_id,
					_createdAt,
					orderId,
					customer,
					customerRef->{ _id, name, phone, email, cskhStatus },
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
				}`,
			),

			writeClient.fetch(
				`*[_type == "customer"] | order(createdAt desc) {
					_id,
					name,
					phone,
					email,
					address,
					source,
					cskhStatus,
					couponReceived,
					orderCount,
					totalSpent,
					lastOrderAt,
					createdAt,
					internalNotes
				}`,
			),

			writeClient.fetch(
				`*[_type == "review"] | order(createdAt desc) {
					_id,
					author,
					rating,
					comment,
					isApproved,
					response,
					createdAt,
					product->{ _id, title, "slug": metadata.slug.current },
					images[]{
						_key,
						asset->{ _id, url }
					},
					videos[]{
						_key,
						asset->{ _id, url }
					}
				}`,
			),
		])

		return NextResponse.json({
			success: true,
			hasNew: (newOrders || []).length > 0,
			newCount: (newOrders || []).length,
			newOrders: newOrders || [],
			orders: allOrders || [],
			customers: allCustomers || [],
			reviews: allReviews || [],
			timestamp: new Date().toISOString(),
		})
	} catch (error: any) {
		console.error('API Hub Poll Error:', error)
		return NextResponse.json(
			{ success: false, message: error.message || 'Lỗi khi kiểm tra dữ liệu mới' },
			{ status: 500 },
		)
	}
}
