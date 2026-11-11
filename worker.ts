import { runWithRuntimeContext } from './src/lib/cf-env'
import { drainOutbox } from './src/lib/outbox'
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
		return openNextHandler.fetch(request, env, ctx)
	},

	async scheduled(
		_controller: WorkerScheduledController,
		env: CloudflareEnv,
		ctx: WorkerExecutionContext,
	): Promise<void> {
		ctx.waitUntil(
			runWithRuntimeContext({ env: env as Record<string, any>, ctx }, () =>
				drainOutbox(15),
			),
		)
	},
}

export default worker
