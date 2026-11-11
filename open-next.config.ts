import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default defineCloudflareConfig({
	// Primary transactional persistence and session state run on Cloudflare D1 binding (`DB`).
	// R2 incremental cache can be enabled here once an R2 bucket is provisioned.
})

