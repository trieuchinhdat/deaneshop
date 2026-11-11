declare module '*.css' {
	const content: Record<string, string>
	export default content
}

declare module '*.md' {
	const content: string
	export default content
}

declare module 'swiper/css'
declare module 'swiper/css/*'

interface Window {
	__DEANFLOW_VITALS__?: {
		lcp?: number
		inp?: number
		cls?: number
		checkoutMs?: number
		device?: 'mobile' | 'desktop'
		path?: string
		updatedAt?: string
	}
}
