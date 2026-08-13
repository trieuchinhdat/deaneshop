import type { Metadata } from 'next'
import Link from 'next/link'
import { HiOutlineCheckCircle, HiOutlineShoppingBag, HiOutlineHome, HiOutlineDocumentText } from 'react-icons/hi2'
import { ROUTES } from '@/lib/env'

export const metadata: Metadata = {
	title: 'Đặt hàng thành công | Xác nhận đơn hàng',
	description: 'Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được ghi nhận thành công.',
}

type Props = {
	searchParams: Promise<{ orderId?: string }>
}

export default async function OrderSuccessPage({ searchParams }: Props) {
	const { orderId } = await searchParams

	return (
		<main className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50/50">
			<div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
				{/* Icon Checkmark lớn */}
				<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 ring-8 ring-green-50/50">
					<HiOutlineCheckCircle className="h-12 w-12 stroke-[1.5]" />
				</div>

				{/* Header & Tiêu đề */}
				<div className="space-y-2">
					<h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
						Đặt hàng thành công!
					</h1>
					<p className="text-sm sm:text-base text-gray-600">
						Cảm ơn bạn đã tin tưởng và mua sắm tại cửa hàng. Đơn hàng của bạn đã được hệ thống tiếp nhận.
					</p>
				</div>

				{/* Khối Mã Đơn Hàng & Thông tin */}
				<div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:p-5 text-left space-y-3">
					<div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
						<span className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5">
							<HiOutlineDocumentText className="text-base text-gray-400" />
							Mã đơn hàng:
						</span>
						<span className="font-mono text-sm sm:text-base font-bold text-gray-900 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
							{orderId ? orderId : 'Đang cập nhật'}
						</span>
					</div>

					<div className="flex items-center justify-between text-xs sm:text-sm">
						<span className="text-gray-500">Phương thức thanh toán:</span>
						<span className="font-semibold text-gray-800">Thanh toán khi nhận hàng (COD)</span>
					</div>

					<div className="flex items-center justify-between text-xs sm:text-sm">
						<span className="text-gray-500">Trạng thái đơn hàng:</span>
						<span className="inline-flex items-center gap-1 font-semibold text-green-700 bg-green-100/80 px-2 py-0.5 rounded-full text-xs">
							<span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse"></span>
							Đang xử lý
						</span>
					</div>
				</div>

				{/* Hướng dẫn tiếp theo */}
				<div className="rounded-xl bg-blue-50/60 p-4 border border-blue-100/80 text-left text-xs sm:text-sm text-blue-900 leading-relaxed">
					<p className="font-semibold mb-1 flex items-center gap-1 text-blue-800">
						<span>ℹ️</span> Lưu ý đơn hàng:
					</p>
					<p className="text-blue-700/90">
						Bộ phận chăm sóc khách hàng sẽ sớm gọi điện thoại xác nhận lại danh sách sản phẩm và địa chỉ trước khi đóng gói gửi cho bạn.
					</p>
				</div>

				{/* Nút hành động */}
				<div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
					<Link
						href="/"
						className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-800 active:scale-98 transition-all shadow-md"
					>
						<HiOutlineShoppingBag className="text-lg" />
						Tiếp tục mua sắm
					</Link>
					<Link
						href="/"
						className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 active:scale-98 transition-all"
					>
						<HiOutlineHome className="text-lg text-gray-500" />
						Trang chủ
					</Link>
				</div>
			</div>
		</main>
	)
}
