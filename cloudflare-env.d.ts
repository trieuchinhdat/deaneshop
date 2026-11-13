/// <reference types="@opennextjs/cloudflare" />

declare global {
	interface AnalyticsEngineDataPoint {
		blobs?: Array<string | ArrayBuffer | null>
		doubles?: Array<number | null>
		indexes?: Array<string | ArrayBuffer | null>
	}

	interface AnalyticsEngineDataset {
		writeDataPoint(event?: AnalyticsEngineDataPoint): void
	}

	interface CloudflareEnv {
		ASSETS: { fetch: (request: Request) => Promise<Response> }
		NEXT_PUBLIC_SANITY_STUDIO_URL?: string
		SANITY_STUDIO_ORIGIN?: string
		NEXT_PUBLIC_ADMIN_AUTH_MODE?: string
		NEXT_PUBLIC_DEPLOYMENT_PROFILE?: string
		OUTBOX_MAX_JOBS_PER_INVOCATION?: string
		ENABLE_COMMERCE_ORDERS?: string
		D1_LOG_METRICS?: string
		DB: D1Database
		ANALYTICS?: AnalyticsEngineDataset
		ANALYTICS_DATASET?: string
		ADMIN_JWT_SECRET?: string
		D1_ALLOW_MEMORY?: string
		D1_DATABASE_ID?: string
		D1_ACCOUNT_ID?: string
		CLOUDFLARE_D1_DATABASE_ID?: string
		CLOUDFLARE_ACCOUNT_ID?: string
		CLOUDFLARE_API_TOKEN?: string
		CLOUDFLARE_ANALYTICS_API_TOKEN?: string
		SANITY_API_READ_TOKEN?: string
		SANITY_API_WRITE_TOKEN?: string
		RESEND_API_KEY?: string
		RESEND_FROM_EMAIL?: string
		ORDER_WEBHOOK_URL?: string
		LEAD_WEBHOOK_URL?: string
		NOTIFICATION_WEBHOOK_URL?: string
		CRM_WEBHOOK_URL?: string
		HUBSPOT_WEBHOOK_URL?: string
		KLAVIYO_WEBHOOK_URL?: string
		TELEGRAM_BOT_TOKEN?: string
		TELEGRAM_CHAT_ID?: string
		OUTBOX_CRON_SECRET?: string
		ALLOW_TRUSTED_CUSTOM_HTML?: string
		SUPPORT_EMAIL?: string
		NEXT_PUBLIC_BASE_URL?: string
		NEXT_PUBLIC_SITE_NAME?: string
		NEXT_PUBLIC_SANITY_PROJECT_ID?: string
		NEXT_PUBLIC_SANITY_DATASET?: string
		NEXT_PUBLIC_SANITY_API_VERSION?: string
	}
}

export {}

