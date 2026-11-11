import { AsyncLocalStorage } from 'node:async_hooks'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const CF_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__')

export type D1BindingLike = {
	prepare: (sql: string) => {
		bind: (...params: any[]) => { all: () => Promise<any>; first?: () => Promise<any>; run?: () => Promise<any> }
		all: () => Promise<any>
	}
	batch?: (statements: any[]) => Promise<any[]>
	exec?: (sql: string) => Promise<any>
}

export type RuntimeCloudflareContext = {
	env?: Record<string, any>
	ctx?: { waitUntil?: (promise: Promise<unknown>) => void }
	cf?: Record<string, any>
}

const runtimeContextStorage = new AsyncLocalStorage<RuntimeCloudflareContext>()

export function runWithRuntimeContext<T>(
	context: RuntimeCloudflareContext,
	fn: () => Promise<T>,
): Promise<T> {
	return runtimeContextStorage.run(context, fn)
}

export function getCloudflareContextSyncSafe(): RuntimeCloudflareContext | null {
	const als = runtimeContextStorage.getStore()
	if (als) return als
	const fromGlobal = (globalThis as any)[CF_CONTEXT_SYMBOL]
	if (fromGlobal && typeof fromGlobal === 'object') {
		return fromGlobal as RuntimeCloudflareContext
	}
	return null
}

export async function getCloudflareContextSafe(): Promise<RuntimeCloudflareContext | null> {
	const syncCtx = getCloudflareContextSyncSafe()
	if (syncCtx) return syncCtx

	if (
		typeof process !== 'undefined' &&
		process.env?.NEXT_RUNTIME === 'nodejs' &&
		process.env?.NEXT_PHASE !== 'phase-production-build'
	) {
		try {
			const ctx = await getCloudflareContext({ async: true })
			if (ctx && typeof ctx === 'object') {
				return ctx as unknown as RuntimeCloudflareContext
			}
		} catch {
			return null
		}
	}

	return null
}

export function getEnvVarSync(key: string): string | undefined {
	const syncCtx = getCloudflareContextSyncSafe()
	const fromCtx = syncCtx?.env?.[key]
	if (typeof fromCtx === 'string' && fromCtx.length > 0) return fromCtx
	if (typeof process !== 'undefined') {
		const fromProcess = process.env?.[key]
		if (typeof fromProcess === 'string' && fromProcess.length > 0) return fromProcess
	}
	return undefined
}

export async function getEnvVar(key: string): Promise<string | undefined> {
	const syncVal = getEnvVarSync(key)
	if (syncVal !== undefined) return syncVal

	const ctx = await getCloudflareContextSafe()
	const fromCtx = ctx?.env?.[key]
	if (typeof fromCtx === 'string' && fromCtx.length > 0) return fromCtx
	return undefined
}

export function getD1BindingSync(): D1BindingLike | undefined {
	const syncCtx = getCloudflareContextSyncSafe()
	const fromCtx = syncCtx?.env?.DB
	if (fromCtx && typeof fromCtx.prepare === 'function') return fromCtx as D1BindingLike

	const fromGlobal = (globalThis as any).DB
	if (fromGlobal && typeof fromGlobal.prepare === 'function') return fromGlobal as D1BindingLike

	if (typeof process !== 'undefined') {
		const fromProcess = (process.env as any)?.DB
		if (fromProcess && typeof fromProcess.prepare === 'function') return fromProcess as D1BindingLike
	}

	return undefined
}

export async function getD1Binding(): Promise<D1BindingLike | undefined> {
	const syncBinding = getD1BindingSync()
	if (syncBinding) return syncBinding

	const ctx = await getCloudflareContextSafe()
	const fromCtx = ctx?.env?.DB
	if (fromCtx && typeof fromCtx.prepare === 'function') return fromCtx as D1BindingLike

	return undefined
}

export async function isCloudflareWorkerRuntime(): Promise<boolean> {
	const ctx = await getCloudflareContextSafe()
	if (!ctx?.env) return false
	// OpenNext Workers bind ASSETS or DB or WORKER_SELF_REFERENCE on ctx.env.
	// Only treat as Worker runtime when not explicitly in Node local dev without bindings.
	return Boolean(ctx.env.ASSETS || ctx.env.DB || ctx.env.WORKER_SELF_REFERENCE)
}

export function scheduleBackgroundTask(task: Promise<unknown> | (() => Promise<unknown>)): void {
	const syncCtx = getCloudflareContextSyncSafe()
	if (syncCtx?.ctx && typeof syncCtx.ctx.waitUntil === 'function') {
		try {
			const promise = typeof task === 'function' ? task() : task
			syncCtx.ctx.waitUntil(
				promise.catch((err) => {
					console.error('[Background Task Error]:', err)
				}),
			)
			return
		} catch {
			// Fall through if waitUntil is unavailable outside request scope
		}
	}
	if (typeof task === 'function') {
		if (!getD1BindingSync() && (!process.env.D1_DATABASE_ID || !process.env.CLOUDFLARE_API_TOKEN)) {
			return
		}
		void task().catch((err) => {
			console.error('[Background Task Error]:', err)
		})
		return
	}
	void task.catch((err) => {
		console.error('[Background Task Error]:', err)
	})
}
