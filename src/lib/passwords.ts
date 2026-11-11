import { compare, hash } from 'bcryptjs'

export function validPassword(value: unknown): value is string {
	return typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value, 'utf8') <= 72
}
export async function hashPassword(password: string): Promise<string> {
	if (!validPassword(password)) throw new Error('Password must be at least 12 characters and at most 72 UTF-8 bytes')
	return hash(password, 12)
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	if (!/^\$2[aby]\$\d{2}\$/.test(stored) || Buffer.byteLength(password, 'utf8') > 72) return false
	return compare(password, stored)
}
