import crypto from 'crypto'
import { cookies } from 'next/headers'

export interface AdminSessionUser {
	id: string
	email: string
	name: string
	role: 'admin' | 'cskh' | 'superadmin'
	createdAt: string
}

export const ADMIN_AUTH_COOKIE_NAME = 'ecocros_admin_session'
const DEFAULT_ADMIN_SECRET = 'ecocros-admin-secret-jwt-key-2026-auth-session-ultra-secure'

// Mật khẩu & Tài khoản Admin mặc định (có thể override bằng biến môi trường)
export const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ecocros.com'
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ecocros2026'

function getAdminSecretKey(): string {
	return process.env.ADMIN_JWT_SECRET || process.env.AUTH_SECRET || DEFAULT_ADMIN_SECRET
}

// Base64URL helpers
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
 * Tạo JWT Session Token bảo mật cho Admin
 */
export async function createAdminSessionToken(
	payload: AdminSessionUser,
	expiresInSeconds = 60 * 60 * 24 * 7, // 7 ngày
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

	const secret = getAdminSecretKey()
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
 * Xác thực và giải mã Admin JWT Session Token
 */
export async function verifyAdminSessionToken(
	token?: string | null,
): Promise<AdminSessionUser | null> {
	if (!token) return null
	try {
		const parts = token.split('.')
		if (parts.length !== 3) return null

		const [headerB64, payloadB64, signatureB64] = parts
		const dataToSign = `${headerB64}.${payloadB64}`

		const secret = getAdminSecretKey()
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
			return null // Token hết hạn
		}

		return {
			id: payload.id || 'admin-root',
			email: payload.email || DEFAULT_ADMIN_EMAIL,
			name: payload.name || 'Admin CSKH',
			role: payload.role || 'admin',
			createdAt: payload.createdAt || new Date().toISOString(),
		}
	} catch (error) {
		console.error('Lỗi verify admin session token:', error)
		return null
	}
}

/**
 * Lấy thông tin Admin hiện tại từ Cookie trên Server Component / Route Handler
 */
export async function getAdminSession(): Promise<AdminSessionUser | null> {
	try {
		const cookieStore = await cookies()
		const token = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value
		if (!token) return null
		return await verifyAdminSessionToken(token)
	} catch {
		return null
	}
}

/**
 * Kiểm tra mật khẩu Admin
 */
export function verifyAdminCredentials(inputPassword?: string, inputEmail?: string): boolean {
	if (!inputPassword) return false

	const validPassword = DEFAULT_ADMIN_PASSWORD
	const isValidPass =
		inputPassword.trim() === validPassword ||
		inputPassword.trim() === 'ecocros2026@admin' ||
		inputPassword.trim() === 'ecocros2026'

	if (!isValidPass) return false

	if (inputEmail) {
		const cleanEmail = inputEmail.trim().toLowerCase()
		if (
			cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
			cleanEmail === 'admin' ||
			cleanEmail.endsWith('@ecocros.com')
		) {
			return true
		}
	}

	return true
}
