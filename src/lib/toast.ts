'use client'

import Swal from 'sweetalert2'

// Basic HTML escaping utility to prevent XSS in Swal.fire({ html: ... })
export function escapeHtml(unsafe: string): string {
	if (!unsafe || typeof unsafe !== 'string') return ''
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

export type CartToastOptions = {
	title?: string
	subtitle?: string
	checkoutUrl?: string
	checkoutLabel?: string
	timer?: number
}

/**
 * Standardized, XSS-safe, dark-mode aware toast for Add-to-Cart / Quote events.
 */
export function showCartToast({
	title = 'Added to Cart',
	subtitle,
	checkoutUrl = '/checkout',
	checkoutLabel = 'Proceed to Checkout →',
	timer = 3500,
}: CartToastOptions) {
	const safeTitle = escapeHtml(title)
	const safeSubtitle = subtitle ? escapeHtml(subtitle) : ''
	const safeUrl = escapeHtml(checkoutUrl)
	const safeLabel = escapeHtml(checkoutLabel)

	return Swal.fire({
		toast: true,
		position: 'top-end',
		showConfirmButton: false,
		timer,
		timerProgressBar: false,
		customClass: {
			popup:
				'!p-3.5 !rounded-2xl !border !border-gray-200/90 !shadow-xl !bg-white dark:!bg-slate-900 dark:!border-slate-800 !w-auto !min-w-[280px]',
			container: 'mt-20 md:mt-24 z-[999]',
		},
		html: `
			<div class="flex flex-col gap-2.5 p-1 font-sans text-left">
				<div class="flex items-center gap-2.5">
					<div class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
						<svg class="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
					</div>
					<div class="flex flex-col">
						<span class="text-xs font-bold text-gray-900 dark:text-white leading-tight">${safeTitle}</span>
						${safeSubtitle ? `<span class="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[200px]">${safeSubtitle}</span>` : ''}
					</div>
				</div>
				<div class="flex items-center gap-2 pt-1">
					<a href="${safeUrl}" class="flex h-8 flex-1 items-center justify-center rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs transition no-underline shadow-2xs dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100">
						${safeLabel}
					</a>
				</div>
			</div>
		`,
	})
}

export type SimpleToastOptions = {
	title: string
	subtitle?: string
	type?: 'success' | 'info' | 'warning' | 'error'
	timer?: number
}

/**
 * Standardized simple notification toast (e.g. for variant updates, status changes).
 */
export function showSimpleToast({
	title,
	subtitle,
	type = 'success',
	timer = 2500,
}: SimpleToastOptions) {
	const safeTitle = escapeHtml(title)
	const safeSubtitle = subtitle ? escapeHtml(subtitle) : ''

	const iconBg =
		type === 'error'
			? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
			: type === 'warning'
				? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
				: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'

	return Swal.fire({
		toast: true,
		position: 'top-end',
		showConfirmButton: false,
		timer,
		customClass: {
			popup:
				'!p-3 !rounded-2xl !border !border-gray-200/90 !shadow-xl !bg-white dark:!bg-slate-900 dark:!border-slate-800 !w-auto !min-w-[260px]',
			container: 'mt-20 md:mt-24 z-[999]',
		},
		html: `
			<div class="flex items-center gap-2.5 p-1 font-sans text-left">
				<div class="flex h-7 w-7 flex-none items-center justify-center rounded-full ${iconBg}">
					<svg class="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
				</div>
				<div>
					<p class="text-xs font-semibold text-gray-900 dark:text-white leading-tight">${safeTitle}</p>
					${safeSubtitle ? `<p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">${safeSubtitle}</p>` : ''}
				</div>
			</div>
		`,
	})
}

export default Swal
