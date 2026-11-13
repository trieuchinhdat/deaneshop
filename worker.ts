import { runWithRuntimeContext } from './src/lib/cf-env'
// @ts-expect-error -- generated at build time by @opennextjs/cloudflare
import openNextHandler from './.open-next/worker.js'

// @ts-expect-error -- generated at build time by @opennextjs/cloudflare
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js'

type WorkerExecutionContext = {
	waitUntil: (promise: Promise<unknown>) => void
	passThroughOnException?: () => void
}

type WorkerScheduledController = {
	cron: string
	scheduledTime: number
	noRetry: () => void
}

const worker = {
	async fetch(request: Request, env: CloudflareEnv, ctx: WorkerExecutionContext): Promise<Response> {
		const pathname = new URL(request.url).pathname
		if (pathname === '/api/orders' || pathname.startsWith('/api/orders/')) {
			if (env.ENABLE_COMMERCE_ORDERS !== 'true') {
				return new Response(
					JSON.stringify({
						success: false,
						error: 'Orders API is disabled in B2B RFQ mode',
						code: 'ORDERS_DISABLED',
					}),
					{
						status: 410,
						headers: {
							'content-type': 'application/json',
							'cache-control': 'no-store',
						},
					},
				)
			}
		}
		return openNextHandler.fetch(request, env, ctx)
	},

	async scheduled(
		_controller: WorkerScheduledController,
		env: CloudflareEnv,
		ctx: WorkerExecutionContext,
	): Promise<void> {
		ctx.waitUntil(
			runWithRuntimeContext({ env: env as Record<string, any>, ctx }, async () => {
				const { drainOutbox } = await import('./src/lib/outbox')
				return drainOutbox(15)
			}),
		)
	},
}

export default worker
