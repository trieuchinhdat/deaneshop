import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export { slug, count, getBlockText } from '../../shared/content-utils'

export function debounce<T extends (...args: any[]) => void>(
	fn: T,
	delay: number = 1000, // 1 sec
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout | null = null

	return function (this: any, ...args: Parameters<T>) {
		if (timeoutId) clearTimeout(timeoutId)
		timeoutId = setTimeout(() => fn.apply(this, args), delay)
	}
}

export const formatCurrency = (
	value: number | string | undefined | null,
	currency: string = 'USD',
	locale: string = 'en-US',
) => {
	const num = Number(value) || 0
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currency?.trim().toUpperCase() || 'USD',
	}).format(num)
}

export const formatPrice = formatCurrency

export function generateOrderId() {
	const now = new Date()
	const day = String(now.getDate()).padStart(2, '0')
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const year = String(now.getFullYear()).slice(-2)

	const datePart = `${year}${month}${day}`
	const random = Math.floor(1000 + Math.random() * 9000)

	return `ORD-${datePart}-${random}`
}
