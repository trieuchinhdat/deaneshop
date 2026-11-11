export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_REVIEW_IMAGES = 3
export const MAX_REVIEW_TOTAL_BYTES = MAX_IMAGE_BYTES * MAX_REVIEW_IMAGES
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function validImage(bytes: Uint8Array, mime: string): boolean {
	if (bytes.length < 12 || bytes.length > MAX_IMAGE_BYTES) return false
	if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
	if (mime === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
	if (mime === 'image/webp') {
		return (
			String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
			String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
		)
	}
	return false
}
