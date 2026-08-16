import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const redirectPath = searchParams.get('redirect') || '/account'

	const clientId = process.env.GOOGLE_CLIENT_ID
	const origin = request.nextUrl.origin

	if (!clientId) {
		// Trong môi trường dev khi chưa điền GOOGLE_CLIENT_ID, chuyển về trang login với thông báo hướng dẫn
		return NextResponse.redirect(
			new URL(
				`/account/login?error=missing_google_credentials&redirect=${encodeURIComponent(redirectPath)}`,
				origin,
			),
		)
	}

	const redirectUri = `${origin}/api/auth/google/callback`

	// State chứa URL đích cần quay lại sau khi đăng nhập xong
	const stateData = JSON.stringify({ redirect: redirectPath })
	const state = Buffer.from(stateData).toString('base64url')

	const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
	googleAuthUrl.searchParams.set('client_id', clientId)
	googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
	googleAuthUrl.searchParams.set('response_type', 'code')
	googleAuthUrl.searchParams.set('scope', 'openid email profile')
	googleAuthUrl.searchParams.set('access_type', 'offline')
	googleAuthUrl.searchParams.set('prompt', 'select_account')
	googleAuthUrl.searchParams.set('state', state)

	return NextResponse.redirect(googleAuthUrl.toString())
}
