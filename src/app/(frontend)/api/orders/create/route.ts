import { NextResponse } from 'next/server'
import { writeClient } from '@/sanity/lib/write-client'

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const {
			orderId,
			name,
			phone,
			email,
			address,
			note,
			items,
			itemsDetail,
			subtotal,
			shippingFee,
			grandTotal,
			webhookUrl,
		} = body

		if (!name || !phone || !address) {
			return NextResponse.json(
				{ success: false, message: 'Thiếu thông tin nhận hàng cơ bản (Tên, SĐT, Địa chỉ)' },
				{ status: 400 },
			)
		}

		const cleanPhone = phone?.trim() || ''
		const cleanEmail = email?.trim() || ''
		const cleanName = name?.trim() || ''
		const cleanAddress = address?.trim() || ''
		const orderAmount = Number(grandTotal) || 0

		// 1. Tìm hoặc Tạo mới Hồ sơ Khách Hàng (Customer Profile) - Chống trùng lặp CRM
		let customerRefId: string | undefined = undefined
		try {
			let existingCustomer = null

			// Tìm kiếm chéo đồng thời theo Phone HOẶC Email để không tạo trùng lặp với tài khoản Google đã có
			if (cleanPhone || cleanEmail) {
				existingCustomer = await writeClient.fetch(
					`*[_type == "customer" && (
						(defined($phone) && $phone != "" && phone == $phone) ||
						(defined($email) && $email != "" && email == $email)
					)][0]`,
					{ phone: cleanPhone, email: cleanEmail.toLowerCase() },
				)
			}

			if (existingCustomer?._id) {
				customerRefId = existingCustomer._id
				const prevOrders = Number(existingCustomer.orderCount) || 0
				const prevSpent = Number(existingCustomer.totalSpent) || 0
				const newTotalSpent = prevSpent + orderAmount
				const newOrderCount = prevOrders + 1

				const patchData: Record<string, any> = {
					orderCount: newOrderCount,
					totalSpent: newTotalSpent,
					lastOrderAt: new Date().toISOString(),
					cskhStatus: newTotalSpent >= 2000000 || newOrderCount >= 5 ? 'vip' : 'customer',
				}
				if (cleanName && (!existingCustomer.name || existingCustomer.name === 'Khách hàng')) {
					patchData.name = cleanName
				}
				if (cleanAddress) patchData.address = cleanAddress
				if (cleanPhone && !existingCustomer.phone) patchData.phone = cleanPhone
				if (cleanEmail && !existingCustomer.email) patchData.email = cleanEmail.toLowerCase()

				if (customerRefId) {
					await writeClient.patch(customerRefId).set(patchData).commit()
				}
			} else {
				const newCust = await writeClient.create({
					_type: 'customer',
					name: cleanName || undefined,
					phone: cleanPhone || undefined,
					email: cleanEmail ? cleanEmail.toLowerCase() : undefined,
					address: cleanAddress || undefined,
					source: 'checkout',
					cskhStatus: 'customer',
					orderCount: 1,
					totalSpent: orderAmount,
					lastOrderAt: new Date().toISOString(),
					createdAt: new Date().toISOString(),
				})
				customerRefId = newCust._id
			}
		} catch (custErr) {
			console.warn('Lỗi liên kết Customer Profile:', custErr)
		}

		// 2. Chuẩn hóa danh sách sản phẩm thành mảng object lưu vào Sanity
		const formattedItems = Array.isArray(itemsDetail)
			? itemsDetail.map((item: any) => ({
					_key: item.id || `${Math.random().toString(36).substring(2, 9)}`,
					productId: item.id || '',
					variantId: item.variantId || '',
					title: item.title || '',
					sku: item.sku || item.id || '',
					price: item.price || 0,
					quantity: item.quantity || 1,
					total: (item.price || 0) * (item.quantity || 1),
					image: typeof item.image === 'string' ? item.image : '',
				}))
			: []

		const orderDoc = {
			_type: 'order' as const,
			orderId: orderId || `ECO-${Date.now().toString().slice(-6)}`,
			customer: {
				name: cleanName,
				phone: cleanPhone,
				email: cleanEmail,
				address: cleanAddress,
			},
			customerRef: customerRefId
				? {
						_type: 'reference' as const,
						_ref: customerRefId,
					}
				: undefined,
			items: formattedItems,
			pricing: {
				subtotal: subtotal || 0,
				shippingFee: shippingFee || 0,
				discount: 0,
				grandTotal: grandTotal || 0,
			},
			paymentMethod: 'COD',
			paymentStatus: 'UNPAID',
			fulfillmentStatus: 'PENDING',
			customerNote: note || '',
			history: [
				{
					_key: `${Date.now()}`,
					timestamp: new Date().toISOString(),
					action: 'Khách hàng khởi tạo đơn hàng từ Checkout',
					user: 'Customer',
				},
			],
		}

		let createdDocId = ''
		try {
			const doc = await writeClient.create(orderDoc)
			createdDocId = doc._id
		} catch (sanityErr) {
			console.warn('Lỗi ghi đơn hàng vào Sanity CMS (kiểm tra SANITY_API_WRITE_TOKEN):', sanityErr)
		}

		// Nếu có Webhook URL (như Google Sheet/Telegram), gửi dữ liệu bổ trợ
		if (webhookUrl && webhookUrl.trim()) {
			try {
				const webhookData = {
					orderId: orderDoc.orderId,
					name: cleanName,
					phone: cleanPhone,
					email: cleanEmail,
					address: cleanAddress,
					note,
					items: typeof items === 'string' ? items : JSON.stringify(formattedItems),
					total: `${grandTotal?.toLocaleString('vi-VN')} đ`,
					shipping: `${shippingFee?.toLocaleString('vi-VN')} đ`,
				}

				await fetch(webhookUrl.trim(), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(webhookData),
				})
			} catch (webhookErr) {
				console.error('Lỗi gửi webhook đơn hàng:', webhookErr)
			}
		}

		return NextResponse.json({
			success: true,
			orderId: orderDoc.orderId,
			docId: createdDocId,
			customerId: customerRefId,
		})
	} catch (error: any) {
		console.error('API Order Create Error:', error)
		return NextResponse.json(
			{ success: false, message: error.message || 'Lỗi server khi tạo đơn hàng' },
			{ status: 500 },
		)
	}
}
