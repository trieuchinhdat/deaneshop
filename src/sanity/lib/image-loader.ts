'use client'

import type { ImageLoaderProps } from 'next/image'

export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
	if (!src) return ''
	if (!src.startsWith('https://cdn.sanity.io/images/') || /\.svg($|\?)/i.test(src)) {
		return src
	}

	try {
		const url = new URL(src)
		url.searchParams.set('w', String(width))
		url.searchParams.set('q', String(quality || 80))
		url.searchParams.set('auto', 'format')
		url.searchParams.set('fit', 'max')
		if (url.searchParams.has('h') && !url.searchParams.has('crop')) {
			url.searchParams.delete('h')
		}
		return url.toString()
	} catch {
		return src
	}
}
