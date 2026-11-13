import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache'

export default defineCloudflareConfig({
	...(process.env.NEXT_PUBLIC_DEPLOYMENT_PROFILE === 'free'
		? {
				incrementalCache: staticAssetsIncrementalCache,
				enableCacheInterception: true,
			}
		: {}),
	// Primary transactional persistence and session state run on Cloudflare D1 binding (`DB`).
	// R2 incremental cache can be enabled here once an R2 bucket is provisioned.
})
