/** Public, build-time settings. Rebuild after changing the deployment profile. */
export const isFreeDeployment =
	process.env.NEXT_PUBLIC_DEPLOYMENT_PROFILE === 'free'

// Development keeps the editor workflow; production Free serves published snapshots.
export const isStaticStorefront =
	isFreeDeployment && process.env.NODE_ENV === 'production'

export const adminRefreshIntervalMs = isFreeDeployment ? 300_000 : 60_000

export function vitalsSampleRate(): number {
	const raw = process.env.NEXT_PUBLIC_VITALS_SAMPLE_RATE
	if (raw === undefined || raw === '') return isFreeDeployment ? 0 : 1
	const rate = Number(raw)
	return Number.isFinite(rate) ? Math.min(1, Math.max(0, rate)) : 0
}
