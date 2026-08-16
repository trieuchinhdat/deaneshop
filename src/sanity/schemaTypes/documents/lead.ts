import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'lead',
	title: 'Khách hàng tiềm năng (Leads)',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Họ và tên',
			type: 'string',
		}),
		defineField({
			name: 'email',
			title: 'Email',
			type: 'string',
		}),
		defineField({
			name: 'phone',
			title: 'Số điện thoại',
			type: 'string',
		}),
		defineField({
			name: 'source',
			title: 'Nguồn đăng ký (Source)',
			type: 'string',
			initialValue: 'Popup Newsletter / Voucher',
		}),
		defineField({
			name: 'couponGiven',
			title: 'Mã giảm giá đã nhận',
			type: 'string',
		}),
		defineField({
			name: 'status',
			title: 'Trạng thái xử lý',
			type: 'string',
			options: {
				list: [
					{ title: '🟢 Mới nhận (New)', value: 'new' },
					{ title: '🟡 Đang liên hệ / CSKH (Contacted)', value: 'contacted' },
					{ title: '🔵 Đã mua hàng (Converted)', value: 'converted' },
					{ title: '⚪ Đóng / Hủy (Closed)', value: 'closed' },
				],
			},
			initialValue: 'new',
		}),
		defineField({
			name: 'pageUrl',
			title: 'Trang gửi form (URL)',
			type: 'string',
		}),
		defineField({
			name: 'createdAt',
			title: 'Thời gian gửi',
			type: 'datetime',
			initialValue: () => new Date().toISOString(),
		}),
		defineField({
			name: 'notes',
			title: 'Ghi chú nội bộ',
			type: 'text',
			rows: 2,
		}),
	],
	preview: {
		select: {
			name: 'name',
			email: 'email',
			phone: 'phone',
			coupon: 'couponGiven',
			status: 'status',
			createdAt: 'createdAt',
		},
		prepare({ name, email, phone, coupon, status, createdAt }) {
			const contact = email || phone || 'Khách vãng lai'
			const formattedDate = createdAt ? new Date(createdAt).toLocaleString('vi-VN') : ''
			const statusLabel =
				status === 'new'
					? '🟢 Mới'
					: status === 'contacted'
						? '🟡 Đã liên hệ'
						: status === 'converted'
							? '🔵 Đã mua hàng'
							: '⚪ Đóng'

			return {
				title: `${name ? `${name} - ` : ''}${contact}`,
				subtitle: `${statusLabel} • ${coupon ? `Mã: ${coupon} • ` : ''}${formattedDate}`,
			}
		},
	},
})
