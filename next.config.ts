import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import type { NextConfig } from 'next'
import { normalizeRedirectEntry, type RawSanityRedirectEntry } from './src/lib/routing'

if (process.env.NODE_ENV === 'development') {
	void initOpenNextCloudflareForDev()
}

const nextConfig: NextConfig = {
	reactCompiler: true,

	images: {
		loader: 'custom',
		loaderFile: './src/sanity/lib/image-loader.ts',
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [384, 640, 750, 828, 1080, 1200, 1920],
		imageSizes: [64, 96, 128, 256, 384],
		localPatterns: [{ pathname: '/api/og' }],
		remotePatterns: [
			{ protocol: 'https', hostname: 'cdn.sanity.io' },
			{ protocol: 'https', hostname: '*.googleusercontent.com' },
			{ protocol: 'https', hostname: 'lh3.googleusercontent.com' },
		],
	},

	webpack: (config) => {
		config.module.rules.push({
			test: /\.md$/,
			type: 'asset/source',
		})
		return config
	},

	async redirects() {
		const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
		const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
		const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-07-01'
		if (!projectId) return []

		const query = `*[_type == 'redirect' && !(_id in path('drafts.**')) && defined(source)]{
			source,
			'destinationType': destination.type,
			'internalType': destination.internal->._type,
			'internalSlug': destination.internal->.metadata.slug.current,
			'params': destination.params,
			'external': destination.external,
			'permanent': coalesce(permanent, true)
		}`

		try {
			const url = new URL(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`)
			url.searchParams.set('query', query)

			const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) })
			if (!res.ok) return []
			const json = (await res.json()) as {
				result?: RawSanityRedirectEntry[]
			}

			return (
				json.result
					?.map((item) => normalizeRedirectEntry(item))
					.filter((item): item is NonNullable<typeof item> => Boolean(item)) || []
			)
		} catch (error) {
			console.error('Failed to load redirects from Sanity:', error)
			return []
		}
	},
}

export default nextConfig
