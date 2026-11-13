/** Public HTML/RSC/assets are served by Cloudflare before this entrypoint runs. */
import { isRuntimePath } from './src/lib/static-runtime-routes'
type WorkerContext = {
	waitUntil: (promise: Promise<unknown>) => void
	passThroughOnException?: () => void
}
type ScheduledEvent = { cron: string; scheduledTime: number; noRetry: () => void }

export default {
	async fetch(request: Request, env: CloudflareEnv, ctx: WorkerContext): Promise<Response> {
		if (isRuntimePath(new URL(request.url).pathname)) {
			const { default: runtime } = await import('./worker')
			return runtime.fetch(request, env, ctx)
		}
		// Unknown public URLs must never fall back to request-time Next.js rendering.
		return env.ASSETS.fetch(request)
	},
	async scheduled(controller: ScheduledEvent, env: CloudflareEnv, ctx: WorkerContext) {
		const { default: runtime } = await import('./worker')
		return runtime.scheduled(controller, env, ctx)
	},
}
