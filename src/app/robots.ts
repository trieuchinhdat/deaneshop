import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'
export const revalidate = 86400

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ecocros.com'

	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: ['/admin/', '/api/', '/account/', '/studio/'],
			},
			{
				userAgent: 'GPTBot',
				allow: ['/', '/llms.txt', '/llms-full.txt'],
				disallow: ['/admin/', '/api/', '/account/', '/studio/'],
			},
			{
				userAgent: 'ClaudeBot',
				allow: ['/', '/llms.txt', '/llms-full.txt'],
				disallow: ['/admin/', '/api/', '/account/', '/studio/'],
			},
			{
				userAgent: 'Google-Extended',
				allow: ['/', '/llms.txt', '/llms-full.txt'],
				disallow: ['/admin/', '/api/', '/account/', '/studio/'],
			},
			{
				userAgent: 'PerplexityBot',
				allow: ['/', '/llms.txt', '/llms-full.txt'],
				disallow: ['/admin/', '/api/', '/account/', '/studio/'],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	}
}
