import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'customer',
	title: 'Khách hàng (Customers)',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Họ và tên',
			type: 'string',
		}),
		defineField({
			name: 'phone',
			title: 'Số điện thoại',
			type: 'string',
		}),
		defineField({
			name: 'email',
			title: 'Email',
			type: 'string',
		}),
		defineField({
			name: 'avatar',
			title: 'Ảnh đại diện (Avatar URL)',
			type: 'url',
		}),
		defineField({
			name: 'googleId',
			title: 'Google OAuth User ID',
			type: 'string',
		}),
		defineField({
			name: 'authProvider',
			title: 'Phương thức xác thực',
			type: 'string',
			options: {
				list: [
					{ title: 'Google OAuth (Gmail)', value: 'google' },
					{ title: 'Số điện thoại / Mật khẩu', value: 'credentials' },
					{ title: 'Khách vãng lai (Guest Checkout)', value: 'guest' },
				],
			},
			initialValue: 'guest',
		}),
		defineField({
			name: 'lastLoginAt',
			title: 'Thời gian đăng nhập gần nhất',
			type: 'datetime',
		}),
		defineField({
			name: 'address',
			title: 'Địa chỉ giao hàng gần nhất',
			type: 'text',
			rows: 2,
		}),
		defineField({
			name: 'source',
			title: 'Nguồn tiếp cận ban đầu',
			type: 'string',
			options: {
				list: [
					{ title: '🎁 Popup Voucher / Newsletter', value: 'popup' },
					{ title: '🛍️ Đặt hàng trực tiếp (Checkout)', value: 'checkout' },
					{ title: '💬 Chatbox / Tư vấn trực tuyến', value: 'chat' },
					{ title: '📞 Hotline / Liên hệ trực tiếp', value: 'hotline' },
					{ title: '🌐 Khác / Nhập thủ công', value: 'other' },
				],
			},
			initialValue: 'popup',
		}),
		defineField({
			name: 'cskhStatus',
			title: 'Trạng thái CSKH / Phân khúc',
			type: 'string',
			options: {
				list: [
					{ title: '🟢 Khách tiềm năng (Lead / Chưa mua hàng)', value: 'lead' },
					{ title: '🟡 Đang tư vấn / Chăm sóc (Contacted)', value: 'contacted' },
					{ title: '🛒 Khách đã mua hàng (Active Customer)', value: 'customer' },
					{ title: '🌟 Khách hàng VIP (VIP Customer)', value: 'vip' },
					{ title: '⚪ Ngừng liên hệ / Khách hủy (Inactive)', value: 'inactive' },
				],
			},
			initialValue: 'lead',
		}),
		defineField({
			name: 'couponReceived',
			title: 'Mã ưu đãi đã nhận',
			description: 'Mã giảm giá được cấp từ Popup hoặc chương trình khuyến mãi.',
			type: 'string',
		}),
		defineField({
			name: 'orderCount',
			title: 'Tổng số đơn hàng đã đặt',
			type: 'number',
			initialValue: 0,
		}),
		defineField({
			name: 'totalSpent',
			title: 'Tổng chi tiêu tích lũy (VNĐ)',
			type: 'number',
			initialValue: 0,
		}),
		defineField({
			name: 'lastOrderAt',
			title: 'Thời gian đặt đơn gần nhất',
			type: 'datetime',
		}),
		defineField({
			name: 'createdAt',
			title: 'Ngày tạo hồ sơ',
			type: 'datetime',
			initialValue: () => new Date().toISOString(),
		}),
		defineField({
			name: 'internalNotes',
			title: 'Nhật ký & Ghi chú CSKH',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						defineField({ name: 'author', title: 'Nhân viên CSKH', type: 'string' }),
						defineField({ name: 'note', title: 'Nội dung ghi chú', type: 'text', rows: 2 }),
						defineField({
							name: 'timestamp',
							title: 'Thời gian ghi',
							type: 'datetime',
							initialValue: () => new Date().toISOString(),
						}),
					],
					preview: {
						select: {
							author: 'author',
							note: 'note',
							timestamp: 'timestamp',
						},
						prepare({ author, note, timestamp }) {
							const time = timestamp ? new Date(timestamp).toLocaleString('vi-VN') : ''
							return {
								title: `${author || 'CSKH'}: ${note || ''}`,
								subtitle: time,
							}
						},
					},
				},
			],
		}),
	],
	preview: {
		select: {
			name: 'name',
			phone: 'phone',
			email: 'email',
			status: 'cskhStatus',
			orders: 'orderCount',
			total: 'totalSpent',
		},
		prepare({ name, phone, email, status, orders, total }) {
			const displayName = name ? `${name} (${phone || email})` : phone || email || 'Khách vãng lai'
			const formattedTotal = total
				? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)
				: '0 đ'
			const orderText = orders ? `${orders} đơn` : '0 đơn'
			const statusLabel =
				status === 'vip'
					? '🌟 VIP'
					: status === 'customer'
						? '🛒 Đã mua'
						: status === 'contacted'
							? '🟡 Đang tư vấn'
							: status === 'lead'
								? '🟢 Tiềm năng'
								: '⚪ Ngừng'

			return {
				title: displayName,
				subtitle: `[${statusLabel}] • ${orderText} • Tổng chi: ${formattedTotal}`,
			}
		},
	},
})
