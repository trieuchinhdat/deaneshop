import type { Metadata } from 'next'
import AdminOrdersClient from './admin-orders-client'

export const metadata: Metadata = {
	title: 'Quản lý Đơn hàng | Admin Dashboard',
	description: 'Hệ thống quản lý đơn hàng, xử lý giao vận và chi tiết vận hành đơn hàng Ecocros',
	robots: {
		index: false,
		follow: false,
	},
}

export default function AdminOrdersPage() {
	return <AdminOrdersClient />
}
