import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth'
import { writeClient } from '@/sanity/lib/write-client'

interface GoogleTokenResponse {
	access_token?: string
	id_token?: string
	token_type?: string
	error?: string
	error_description?: string
}

interface GoogleUserInfo {
	id: string
	email: string
	verified_email?: boolean
	name?: string
	given_name?: string
	family_name?: string
	picture?: string
}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const code = searchParams.get('code')
	const stateParam = searchParams.get('state')
	const error = searchParams.get('error')
	const origin = request.nextUrl.origin

	// Parse state để lấy URL redirect ban đầu
	let redirectPath = '/account'
	if (stateParam) {
		try {
			const decoded = JSON.parse(
				Buffer.from(stateParam, 'base64url').toString('utf-8'),
			)
			if (decoded?.redirect && typeof decoded.redirect === 'string') {
				redirectPath = decoded.redirect
			}
		} catch {
			// ignore state decode error
		}
	}

	if (error || !code) {
		return NextResponse.redirect(
			new URL(
				`/account/login?error=${encodeURIComponent(error || 'cancelled')}&redirect=${encodeURIComponent(redirectPath)}`,
				origin,
			),
		)
	}

	const clientId = process.env.GOOGLE_CLIENT_ID
	const clientSecret = process.env.GOOGLE_CLIENT_SECRET
	const redirectUri = `${origin}/api/auth/google/callback`

	if (!clientId || !clientSecret) {
		return NextResponse.redirect(
			new URL(
				`/account/login?error=missing_google_credentials&redirect=${encodeURIComponent(redirectPath)}`,
				origin,
			),
		)
	}

	try {
		// 1. Đổi authorization code lấy Access Token từ Google
		const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				code,
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: redirectUri,
				grant_type: 'authorization_code',
			}),
		})

		const tokenData: GoogleTokenResponse = await tokenRes.json()

		if (!tokenRes.ok || !tokenData.access_token) {
			console.error('Lỗi lấy Google Token:', tokenData)
			return NextResponse.redirect(
				new URL(
					`/account/login?error=token_exchange_failed&redirect=${encodeURIComponent(redirectPath)}`,
					origin,
				),
			)
		}

		// 2. Lấy thông tin tài khoản người dùng từ Google API
		const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
		})

		if (!userRes.ok) {
			return NextResponse.redirect(
				new URL(
					`/account/login?error=userinfo_fetch_failed&redirect=${encodeURIComponent(redirectPath)}`,
					origin,
				),
			)
		}

		const googleUser: GoogleUserInfo = await userRes.json()

		if (!googleUser?.email) {
			return NextResponse.redirect(
				new URL(
					`/account/login?error=no_email_provided&redirect=${encodeURIComponent(redirectPath)}`,
					origin,
				),
			)
		}

		const cleanEmail = googleUser.email.trim().toLowerCase()
		const displayName = googleUser.name?.trim() || cleanEmail.split('@')[0]
		const avatarUrl = googleUser.picture || ''
		const googleId = googleUser.id

		// 3. Tra cứu hoặc tạo mới Customer trong Sanity CMS
		let customerId = ''
		let customerPhone = ''
		try {
			const existingCustomer = await writeClient.fetch(
				`*[_type == "customer" && (googleId == $googleId || email == $email)][0]`,
				{ googleId, email: cleanEmail },
			)

			if (existingCustomer?._id) {
				customerId = existingCustomer._id
				customerPhone = existingCustomer.phone || ''

				// Cập nhật thông tin mới nhất và thời gian đăng nhập
				const patchDoc: Record<string, any> = {
					googleId,
					authProvider: 'google',
					lastLoginAt: new Date().toISOString(),
				}
				if (avatarUrl && !existingCustomer.avatar) {
					patchDoc.avatar = avatarUrl
				}
				if (!existingCustomer.name && displayName) {
					patchDoc.name = displayName
				}

				await writeClient.patch(customerId).set(patchDoc).commit()
			} else {
				// Tạo hồ sơ Customer mới từ Google
				const newCustomer = await writeClient.create({
					_type: 'customer',
					name: displayName,
					email: cleanEmail,
					avatar: avatarUrl,
					googleId,
					authProvider: 'google',
					source: 'register',
					cskhStatus: 'lead',
					orderCount: 0,
					totalSpent: 0,
					createdAt: new Date().toISOString(),
					lastLoginAt: new Date().toISOString(),
				})
				customerId = newCustomer._id
			}
		} catch (sanityErr) {
			console.error('Lỗi ghi dữ liệu Customer vào Sanity:', sanityErr)
			// Nếu có lỗi Sanity tạm thời, tạo fallback ID dựa trên googleId để user không bị chặn đăng nhập
			customerId = `cust-google-${googleId}`
		}

		// 4. Tạo JWT Session Token
		const sessionToken = await createSessionToken({
			id: customerId,
			email: cleanEmail,
			name: displayName,
			avatar: avatarUrl,
			phone: customerPhone,
			authProvider: 'google',
			createdAt: new Date().toISOString(),
		})

		// 5. Thiết lập Cookie và Chuyển hướng
		const response = NextResponse.redirect(new URL(redirectPath, origin))
		response.cookies.set({
			name: AUTH_COOKIE_NAME,
			value: sessionToken,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 30, // 30 ngày
		})

		return response
	} catch (err) {
		console.error('Lỗi ngoại lệ xác thực Google OAuth callback:', err)
		return NextResponse.redirect(
			new URL(
				`/account/login?error=server_error&redirect=${encodeURIComponent(redirectPath)}`,
				origin,
			),
		)
	}
}
