export const dev =
	process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview'

export const ROUTES = {
	blog: 'blog',
	products: 'products',
	collections: 'collections',
	checkout: 'checkout',
	cart: 'checkout',
	search: 'search',
	orderSuccess: 'order-success',
} as const

