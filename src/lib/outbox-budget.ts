import { getEnvVarSync } from './cf-env'

/** Bound every drain entry point, including authenticated HTTP requests. */
export function outboxJobLimit(requested: number): number {
	const free = getEnvVarSync('NEXT_PUBLIC_DEPLOYMENT_PROFILE') === 'free'
	const raw = getEnvVarSync('OUTBOX_MAX_JOBS_PER_INVOCATION')
	const configured =
		raw === undefined || raw === '' ? (free ? 1 : 15) : Number(raw)
	const ceiling = free ? 1 : 50
	const cap =
		Number.isSafeInteger(configured) && configured > 0
			? Math.min(configured, ceiling)
			: 1
	return Number.isFinite(requested)
		? Math.min(cap, Math.max(0, Math.floor(requested)))
		: 0
}
