import { createHash, timingSafeEqual } from 'node:crypto'

export function verifyReceiptToken(
	token: string | undefined | null,
	expectedHash: string | null | undefined,
): boolean {
	if (!token || !expectedHash || !/^[a-f0-9]{48}$/.test(token)) return false
	const actualHash = createHash('sha256').update(token).digest('hex')
	if (actualHash.length !== expectedHash.length) return false
	return timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash))
}

