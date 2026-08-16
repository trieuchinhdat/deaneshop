import crypto from 'crypto'
import { cookies } from 'next/headers'

export interface SessionUser {
	id: string
	email: string
	name?: string
	avatar?: string
	phone?: string
	authProvider: 'google' | 'credentials' | 'guest'
	createdAt?: string
}

const AUTH_COOKIE_NAME = 'ecocros_session'
const DEFAULT_SECRET = 'ecocros-secret-jwt-key-2026-auth-session-ultra-secure'

function getSecretKey(): string {
	return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || DEFAULT_SECRET
}

// Base64URL encoding helpers
function base64UrlEncode(str: string): string {
	return Buffer.from(str)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
	let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
	while (base64.length % 4) {
		base64 += '='
	}
	return Buffer.from(base64, 'base64').toString('utf-8')
}

/**
 * Tạo JWT Session Token bảo mật bằng HMAC SHA-256
 */
export async function createSessionToken(
	payload: SessionUser,
	expiresInSeconds = 60 * 60 * 24 * 30, // 30 ngày
): Promise<string> {
	const header = { alg: 'HS256', typ: 'JWT' }
	const now = Math.floor(Date.now() / 1000)
	const fullPayload = {
		...payload,
		iat: now,
		exp: now + expiresInSeconds,
	}

	const headerB64 = base64UrlEncode(JSON.stringify(header))
	const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload))
	const dataToSign = `${headerB64}.${payloadB64}`

	const secret = getSecretKey()
	const signature = crypto
		.createHmac('sha256', secret)
		.update(dataToSign)
		.digest('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')

	return `${dataToSign}.${signature}`
}

/**
 * Xác thực và giải mã JWT Session Token
 */
export async function verifySessionToken(
	token?: string | null,
): Promise<SessionUser | null> {
	if (!token) return null
	try {
		const parts = token.split('.')
		if (parts.length !== 3) return null

		const [headerB64, payloadB64, signatureB64] = parts
		const dataToSign = `${headerB64}.${payloadB64}`

		const secret = getSecretKey()
		const expectedSignature = crypto
			.createHmac('sha256', secret)
			.update(dataToSign)
			.digest('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '')

		if (signatureB64 !== expectedSignature) {
			return null
		}

		const payloadJson = base64UrlDecode(payloadB64)
		const payload = JSON.parse(payloadJson)

		const now = Math.floor(Date.now() / 1000)
		if (payload.exp && payload.exp < now) {
			return null // Token đã hết hạn
		}

		return {
			id: payload.id,
			email: payload.email,
			name: payload.name,
			avatar: payload.avatar,
			phone: payload.phone,
			authProvider: payload.authProvider || 'google',
			createdAt: payload.createdAt,
		}
	} catch (error) {
		console.error('Lỗi giải mã session token:', error)
		return null
	}
}

/**
 * Lấy thông tin user hiện tại từ Cookie trên Server Component / Route Handler
 */
export async function getServerSession(): Promise<SessionUser | null> {
	try {
		const cookieStore = await cookies()
		const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
		if (!token) return null
		return await verifySessionToken(token)
	} catch {
		return null
	}
}

export { AUTH_COOKIE_NAME }
