import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, createSessionToken, getServerSession } from '@/lib/auth'
import { writeClient } from '@/sanity/lib/write-client'

export async function PATCH(request: NextRequest) {
	try {
		const session = await getServerSession()
		if (!session) {
			return NextResponse.json(
				{ success: false, message: 'Bạn chưa đăng nhập' },
				{ status: 401 },
			)
		}

		const body = await request.json()
		const { name, phone, address } = body

		const cleanName = typeof name === 'string' ? name.trim() : undefined
		const cleanPhone = typeof phone === 'string' ? phone.trim() : undefined
		const cleanAddress = typeof address === 'string' ? address.trim() : undefined

		let customerId = session.id
		let customerDoc = null

		// Tìm document customer trong Sanity
		if (customerId && !customerId.startsWith('cust-google-')) {
			customerDoc = await writeClient.fetch(
				`*[_type == "customer" && _id == $id][0]`,
				{ id: customerId },
			)
		} else if (session.email) {
			customerDoc = await writeClient.fetch(
				`*[_type == "customer" && email == $email][0]`,
				{ email: session.email },
			)
		}

		const patchData: Record<string, any> = {}
		if (cleanName !== undefined) patchData.name = cleanName
		if (cleanPhone !== undefined) patchData.phone = cleanPhone
		if (cleanAddress !== undefined) patchData.address = cleanAddress

		if (customerDoc?._id) {
			customerId = customerDoc._id
			await writeClient.patch(customerId).set(patchData).commit()
		} else {
			// Nếu document chưa tồn tại, tạo mới
			const newDoc = await writeClient.create({
				_type: 'customer',
				name: cleanName || session.name || 'Khách hàng',
				email: session.email,
				phone: cleanPhone,
				address: cleanAddress,
				avatar: session.avatar,
				authProvider: session.authProvider || 'google',
				source: 'google',
				cskhStatus: 'customer',
				orderCount: 0,
				totalSpent: 0,
				createdAt: new Date().toISOString(),
				lastLoginAt: new Date().toISOString(),
			})
			customerId = newDoc._id
		}

		// Tạo token session mới với tên & SĐT cập nhật
		const newSessionToken = await createSessionToken({
			id: customerId,
			email: session.email,
			name: cleanName || session.name,
			avatar: session.avatar,
			phone: cleanPhone || session.phone,
			authProvider: session.authProvider,
			createdAt: session.createdAt,
		})

		const updatedUser = {
			id: customerId,
			name: cleanName !== undefined ? cleanName : session.name,
			email: session.email,
			phone: cleanPhone !== undefined ? cleanPhone : session.phone,
			address: cleanAddress !== undefined ? cleanAddress : customerDoc?.address || '',
			avatar: session.avatar,
			authProvider: session.authProvider,
			orderCount: customerDoc?.orderCount || 0,
			totalSpent: customerDoc?.totalSpent || 0,
			cskhStatus: customerDoc?.cskhStatus || 'customer',
		}

		const response = NextResponse.json({
			success: true,
			message: 'Cập nhật thông tin thành công!',
			user: updatedUser,
		})

		response.cookies.set({
			name: AUTH_COOKIE_NAME,
			value: newSessionToken,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 30,
		})

		return response
	} catch (error) {
		console.error('Lỗi cập nhật hồ sơ cá nhân:', error)
		return NextResponse.json(
			{ success: false, message: 'Đã có lỗi xảy ra khi cập nhật hồ sơ' },
			{ status: 500 },
		)
	}
}
