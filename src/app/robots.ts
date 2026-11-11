import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'
export const revalidate = 86400

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://deanflow.com'

	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: ['/admin/', '/api/', '/studio/', '/quote/'],
			},
			{
				userAgent: 'GPTBot',
				allow: ['/', '/llms.txt', '/llms-full.txt'],
				disallow: ['/admin/', '/api/', '/studio/', '/quote/'],
			},
			{
				userAgent: 'ClaudeBot',
				allow: ['/', '/llms.txt', '/llms-full.txt'],
				disallow: ['/admin/', '/api/', '/studio/', '/quote/'],
			},
			{
				userAgent: 'Google-Extended',
				allow: ['/', '/llms.txt', '/llms-full.txt'],
				disallow: ['/admin/', '/api/', '/studio/', '/quote/'],
			},
			{
				userAgent: 'PerplexityBot',
				allow: ['/', '/llms.txt', '/llms-full.txt'],
				disallow: ['/admin/', '/api/', '/studio/', '/quote/'],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	}
}
