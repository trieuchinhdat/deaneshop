import { getAdminSession } from '@/lib/admin-auth'
import { writeClient } from '@/sanity/lib/write-client'
import AdminStudioGuard from './admin-studio-guard'
import AdminWorkspace from './admin-workspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
	// 1. Kiểm tra phiên xác thực quyền Admin / Sanity Studio
	const session = await getAdminSession()

	if (!session) {
		return <AdminStudioGuard />
	}

	// 2. Tải song song toàn bộ dữ liệu quản trị (Đơn hàng, Khách hàng CRM, Đánh giá, Bình luận blog)
	const [orders, customers, reviews, comments] = await Promise.all([
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
		writeClient.fetch(
			`*[_type == "blog.comment"] | order(createdAt desc) {
				_id,
				authorName,
				authorEmail,
				content,
				isAuthorReply,
				isApproved,
				createdAt,
				post->{ _id, title, "slug": metadata.slug.current },
				parentComment->{ _id, authorName, content }
			}`,
		),
	])

	return (
		<AdminWorkspace
			initialOrders={orders || []}
			initialCustomers={customers || []}
			initialReviews={reviews || []}
			initialComments={comments || []}
			adminUser={session}
		/>
	)
}
