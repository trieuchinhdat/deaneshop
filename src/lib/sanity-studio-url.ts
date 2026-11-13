// Public URL is compiled into the website; use the local Studio during development.
export const sanityStudioUrl = (
	process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ||
	(process.env.NODE_ENV === 'development'
		? 'http://localhost:3333'
		: 'https://deanflow.sanity.studio')
).replace(/\/+$/, '')
