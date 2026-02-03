export const dev =
	process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview'

export const ROUTES = {
	blog: 'blog',
	products: 'products',
	// etc. services: 'services',
	// etc. caseStudies: 'case-studies',
} as const
