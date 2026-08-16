import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'order',
	title: 'Đơn hàng (Orders)',
	type: 'document',
	fields: [
		defineField({
			name: 'orderId',
			title: 'Mã đơn hàng',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'customer',
			title: 'Thông tin khách hàng',
			type: 'object',
			fields: [
				defineField({ name: 'name', title: 'Họ và tên', type: 'string' }),
				defineField({ name: 'phone', title: 'Số điện thoại', type: 'string' }),
				defineField({ name: 'email', title: 'Email', type: 'string' }),
				defineField({ name: 'address', title: 'Địa chỉ giao hàng', type: 'text' }),
			],
		}),
		defineField({
			name: 'customerRef',
			title: 'Liên kết Hồ sơ Khách hàng (Customer Profile)',
			description: 'Hồ sơ khách hàng tổng hợp tương ứng trong hệ thống CRM.',
			type: 'reference',
			to: [{ type: 'customer' }],
		}),
		defineField({
			name: 'items',
			title: 'Danh sách sản phẩm',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						defineField({ name: 'productId', title: 'ID Sản phẩm', type: 'string' }),
						defineField({ name: 'variantId', title: 'ID Biến thể', type: 'string' }),
						defineField({ name: 'title', title: 'Tên sản phẩm', type: 'string' }),
						defineField({ name: 'sku', title: 'Mã SKU', type: 'string' }),
						defineField({ name: 'price', title: 'Đơn giá', type: 'number' }),
						defineField({ name: 'quantity', title: 'Số lượng', type: 'number' }),
						defineField({ name: 'total', title: 'Thành tiền', type: 'number' }),
						defineField({ name: 'image', title: 'Hình ảnh', type: 'string' }),
					],
				},
			],
		}),
		defineField({
			name: 'pricing',
			title: 'Tài chính & Thanh toán',
			type: 'object',
			fields: [
				defineField({ name: 'subtotal', title: 'Tạm tính', type: 'number' }),
				defineField({ name: 'shippingFee', title: 'Phí vận chuyển', type: 'number' }),
				defineField({ name: 'discount', title: 'Giảm giá', type: 'number' }),
				defineField({ name: 'couponCode', title: 'Mã giảm giá', type: 'string' }),
				defineField({ name: 'grandTotal', title: 'Tổng cộng', type: 'number' }),
			],
		}),
		defineField({
			name: 'paymentMethod',
			title: 'Phương thức thanh toán',
			type: 'string',
			options: {
				list: [
					{ title: 'Thanh toán khi nhận hàng (COD)', value: 'COD' },
					{ title: 'Chuyển khoản ngân hàng (Bank Transfer)', value: 'BANK_TRANSFER' },
					{ title: 'VNPAY', value: 'VNPAY' },
					{ title: 'Ví MoMo', value: 'MOMO' },
				],
			},
			initialValue: 'COD',
		}),
		defineField({
			name: 'paymentStatus',
			title: 'Trạng thái thanh toán',
			type: 'string',
			options: {
				list: [
					{ title: 'Chưa thanh toán', value: 'UNPAID' },
					{ title: 'Đã thanh toán', value: 'PAID' },
					{ title: 'Đã hoàn tiền', value: 'REFUNDED' },
				],
			},
			initialValue: 'UNPAID',
		}),
		defineField({
			name: 'fulfillmentStatus',
			title: 'Trạng thái giao hàng',
			type: 'string',
			options: {
				list: [
					{ title: 'Chờ xác nhận (Pending)', value: 'PENDING' },
					{ title: 'Đã xác nhận (Confirmed)', value: 'CONFIRMED' },
					{ title: 'Đang đóng gói (Processing)', value: 'PROCESSING' },
					{ title: 'Đang giao hàng (Shipping)', value: 'SHIPPING' },
					{ title: 'Đã giao (Delivered)', value: 'DELIVERED' },
					{ title: 'Chuyển hoàn / Trả hàng (Returned)', value: 'RETURNED' },
					{ title: 'Đã hủy (Cancelled)', value: 'CANCELLED' },
				],
			},
			initialValue: 'PENDING',
		}),
		defineField({
			name: 'carrier',
			title: 'Đơn vị vận chuyển',
			type: 'string',
			options: {
				list: [
					{ title: 'Giao Hàng Nhanh (GHN)', value: 'GHN' },
					{ title: 'Giao Hàng Tiết Kiệm (GHTK)', value: 'GHTK' },
					{ title: 'ViettelPost', value: 'VIETTELPOST' },
					{ title: 'Ahamove / Giao hỏa tốc', value: 'AHAMOVE' },
					{ title: 'Shop tự giao', value: 'INTERNAL' },
				],
			},
		}),
		defineField({
			name: 'trackingCode',
			title: 'Mã vận đơn',
			type: 'string',
		}),
		defineField({
			name: 'customerNote',
			title: 'Ghi chú từ khách hàng',
			type: 'text',
		}),
		defineField({
			name: 'internalNotes',
			title: 'Ghi chú nội bộ Admin',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						defineField({ name: 'author', title: 'Người viết', type: 'string' }),
						defineField({ name: 'note', title: 'Nội dung ghi chú', type: 'text' }),
						defineField({ name: 'timestamp', title: 'Thời gian', type: 'datetime' }),
					],
				},
			],
		}),
		defineField({
			name: 'history',
			title: 'Nhật ký lịch sử đơn hàng',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						defineField({ name: 'timestamp', title: 'Thời gian', type: 'datetime' }),
						defineField({ name: 'action', title: 'Hành động', type: 'string' }),
						defineField({ name: 'user', title: 'Người thực hiện', type: 'string' }),
					],
				},
			],
		}),
	],
	preview: {
		select: {
			title: 'orderId',
			subtitle: 'customer.name',
			status: 'fulfillmentStatus',
			total: 'pricing.grandTotal',
		},
		prepare({ title, subtitle, status, total }) {
			const formattedTotal = total ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total) : '0 đ'
			return {
				title: `${title ?? 'Đơn hàng'} - ${subtitle ?? 'Khách lẻ'}`,
				subtitle: `[${status ?? 'PENDING'}] ${formattedTotal}`,
			}
		},
	},
})
