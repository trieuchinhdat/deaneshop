import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

export async function POST(req: Request) {
	try {
		const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN

		if (!token) {
			return NextResponse.json(
				{ error: 'Chưa cấu hình SANITY_API_WRITE_TOKEN trong môi trường server' },
				{ status: 500 },
			)
		}

		const writeClient = createClient({
			projectId,
			dataset,
			apiVersion,
			token,
			useCdn: false,
		})

		const body = await req.json()
		const { name, email, phone, couponGiven, pageUrl, source } = body

		const cleanPhone = phone?.trim() || ''
		const cleanEmail = email?.trim() || ''
		const cleanName = name?.trim() || ''

		if (!cleanEmail && !cleanPhone) {
			return NextResponse.json(
				{ error: 'Vui lòng cung cấp Email hoặc Số điện thoại để nhận ưu đãi' },
				{ status: 400 },
			)
		}

		// 1. Tìm hoặc Tạo mới Hồ sơ Khách Hàng (Customer Profile)
		let existingCustomer = null
		if (cleanPhone) {
			existingCustomer = await writeClient.fetch(
				`*[_type == "customer" && phone == $phone][0]`,
				{ phone: cleanPhone },
			)
		} else if (cleanEmail) {
			existingCustomer = await writeClient.fetch(
				`*[_type == "customer" && email == $email][0]`,
				{ email: cleanEmail },
			)
		}

		let customerId = ''
		if (existingCustomer?._id) {
			customerId = existingCustomer._id
			const patchData: Record<string, any> = {}
			if (!existingCustomer.name && cleanName) patchData.name = cleanName
			if (!existingCustomer.email && cleanEmail) patchData.email = cleanEmail
			if (!existingCustomer.phone && cleanPhone) patchData.phone = cleanPhone
			if (couponGiven?.trim()) patchData.couponReceived = couponGiven.trim()

			if (Object.keys(patchData).length > 0) {
				await writeClient.patch(customerId).set(patchData).commit()
			}
		} else {
			const newCustomer = await writeClient.create({
				_type: 'customer',
				name: cleanName || undefined,
				phone: cleanPhone || cleanEmail,
				email: cleanEmail || undefined,
				source: 'popup',
				cskhStatus: 'lead',
				couponReceived: couponGiven?.trim() || undefined,
				orderCount: 0,
				totalSpent: 0,
				createdAt: new Date().toISOString(),
			})
			customerId = newCustomer._id
		}

		// 2. Tạo bản ghi Lead độc lập để lưu vết lịch sử
		const leadDoc = await writeClient.create({
			_type: 'lead',
			name: cleanName || undefined,
			email: cleanEmail || undefined,
			phone: cleanPhone || undefined,
			couponGiven: couponGiven?.trim() || undefined,
			pageUrl: pageUrl || undefined,
			source: source || 'Popup Newsletter / Voucher',
			status: 'new',
			createdAt: new Date().toISOString(),
		})

		return NextResponse.json({
			success: true,
			message: 'Đăng ký thành công!',
			customerId,
			leadId: leadDoc._id,
		})
	} catch (error: any) {
		console.error('Error saving lead & customer:', error)
		if (
			error?.statusCode === 403 ||
			error?.message?.includes('Insufficient permissions') ||
			error?.message?.includes('permission "create" required')
		) {
			return NextResponse.json(
				{
					error:
						'Sanity Token hiện tại không có quyền Ghi (Write/Create). Vui lòng cấu hình SANITY_API_WRITE_TOKEN.',
				},
				{ status: 403 },
			)
		}
		return NextResponse.json(
			{ error: error?.message || 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.' },
			{ status: 500 },
		)
	}
}
