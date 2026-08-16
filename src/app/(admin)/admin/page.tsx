import { writeClient } from '@/sanity/lib/write-client'
import AdminWorkspace from './admin-workspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
	// Parallel fetch: Orders, Customers, Reviews
	const [orders, customers, reviews] = await Promise.all([
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

	return (
		<AdminWorkspace
			initialOrders={orders || []}
			initialCustomers={customers || []}
			initialReviews={reviews || []}
		/>
	)
}
