import type { NextConfig } from 'next'
import { groq } from 'next-sanity'
import { ROUTES } from './src/lib/env'
import { client } from './src/sanity/lib/client'

const nextConfig: NextConfig = {
	experimental: {
		viewTransition: true,
	},

	reactCompiler: true,

	images: {
		localPatterns: [{ pathname: '/api/og' }],
		remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
	},

	async redirects() {
		return await client.fetch(
			groq`*[_type == 'redirect']{
				source,
				'destination': select(
					destination.type == 'internal' =>
						select(
							destination.internal->._type == 'blog.post' => $blogDir,
							''
						) + select(
							destination.internal->.metadata.slug.current == 'index' => '/',
							'/' + destination.internal->.metadata.slug.current
						),
					destination.external
				),
				'permanent': true
			}`,
			{ blogDir: `/${ROUTES.blog}/` },
		)
	},
}

export default nextConfig
