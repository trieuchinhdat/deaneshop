import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { writeClient } from '@/sanity/lib/write-client'
import AccountClient from './account-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
	title: 'Tài khoản của tôi | ECOCROS',
	description: 'Quản lý thông tin tài khoản, đơn hàng và ưu đãi thành viên ECOCROS.',
}

export default async function AccountPage() {
	const session = await getServerSession()

	if (!session) {
		redirect('/account/login?redirect=/account')
	}

	let customer = null
	let orders = []

	try {
		if (session.id && !session.id.startsWith('cust-google-')) {
			customer = await writeClient.fetch(
				`*[_type == "customer" && _id == $id][0]`,
				{ id: session.id },
				{ cache: 'no-store' },
			)
		} else if (session.email) {
			customer = await writeClient.fetch(
				`*[_type == "customer" && email == $email][0]`,
				{ email: session.email },
				{ cache: 'no-store' },
			)
		}

		const customerId = customer?._id || session.id
		const email = customer?.email || session.email || ''
		const phone = customer?.phone || session.phone || ''

		orders = await writeClient.fetch(
			`*[_type == "order" && (
				customerRef._ref == $customerId ||
				customer.email == $email ||
				(defined($phone) && $phone != "" && customer.phone == $phone)
			)] | order(createdAt desc)[0...50]{
				_id,
				orderId,
				customer,
				items,
				pricing,
				fulfillmentStatus,
				paymentStatus,
				carrier,
				trackingCode,
				status,
				createdAt
			}`,
			{ customerId, email, phone },
			{ cache: 'no-store' },
		)
	} catch (err) {
		console.error('Lỗi fetch dữ liệu tài khoản:', err)
	}

	const initialUser = {
		id: customer?._id || session.id,
		name: customer?.name || session.name || 'Khách hàng',
		email: customer?.email || session.email || '',
		phone: customer?.phone || session.phone || '',
		avatar: customer?.avatar || session.avatar || '',
		address: customer?.address || '',
		orderCount: customer?.orderCount || orders?.length || 0,
		totalSpent: customer?.totalSpent || 0,
		cskhStatus: customer?.cskhStatus || 'customer',
		createdAt: customer?.createdAt || session.createdAt,
	}

	return <AccountClient user={initialUser} orders={orders} />
}
