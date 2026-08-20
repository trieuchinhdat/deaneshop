import type { Metadata, Viewport } from 'next'
import '@/app.css'

export const metadata: Metadata = {
	title: 'Quản Trị Bán Hàng & CSKH | Ecocros Store',
	description:
		'Trung tâm quản lý Đơn hàng, Khách hàng CRM, Đánh giá sản phẩm và Bình luận bài viết dành cho nhân viên vận hành.',
	robots: {
		index: false,
		follow: false,
	},
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	themeColor: '#f8fafc',
}

export default function AdminRootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="vi" className="h-full bg-slate-50">
			<body className="min-h-screen bg-slate-50/70 text-slate-900 antialiased font-sans flex flex-col selection:bg-emerald-600 selection:text-white">
				{children}
			</body>
		</html>
	)
}
