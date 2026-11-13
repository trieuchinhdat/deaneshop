import { getCloudflareContextSafe, getEnvVar } from './cf-env'

export interface AnalyticsEngineDataPoint {
	blobs?: Array<string | ArrayBuffer | null>
	doubles?: Array<number | null>
	indexes?: Array<string | ArrayBuffer | null>
}

export interface AnalyticsEngineDataset {
	writeDataPoint(event?: AnalyticsEngineDataPoint): void
}

export const ANALYTICS_EVENT_TYPES = [
	'page_view',
	'cta_click',
	'form_start',
	'contact_click',
	'catalog_download',
	'checkout_start',
	'conversion',
	'vitals',
] as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number]

export interface AnalyticsBeaconInput {
	event: AnalyticsEventType
	path: string
	utm_source?: string
	utm_medium?: string
	utm_campaign?: string
	country?: string
	device?: 'mobile' | 'desktop'
	placement?: string
	label?: string
	lcp?: number
	inp?: number
	cls?: number
	checkoutMs?: number
	value?: number
}

export interface AnalyticsEngineSummary {
	configured: boolean
	bindingAvailable: boolean
	dataset: string
	days: number
	reason?: string
	funnel?: {
		pageViews: number
		ctaClicks: number
		formStarts: number
		contactClicks: number
		catalogDownloads: number
		checkoutStarts: number
		conversions: number
	}
	vitals?: {
		samples: number
		avgLcpMs: number
		avgInpMs: number
		avgCls: number
	}
	topSources?: Array<{
		source: string
		pageViews: number
		conversions: number
	}>
	topPaths?: Array<{
		path: string
		views: number
	}>
}

function cleanStr(value: unknown, maxLen: number): string {
	if (typeof value !== 'string') return ''
	return value.replace(/[\r\n\t\u0000-\u001f]/g, ' ').trim().slice(0, maxLen)
}

function cleanMetric(value: unknown, max: number): number | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
		return undefined
	}
	return value
}

/**
 * Normalizes and validates an untrusted telemetry beacon payload before pushing
 * it to Cloudflare Workers Analytics Engine (zero D1 writes).
 */
export function normalizeAnalyticsEvent(raw: unknown): AnalyticsBeaconInput | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
	const rec = raw as Record<string, unknown>
	const event = typeof rec.event === 'string' ? rec.event.trim() : ''
	if (!(ANALYTICS_EVENT_TYPES as readonly string[]).includes(event)) {
		return null
	}
	const rawPath = cleanStr(rec.path, 160) || '/'
	const path = rawPath.startsWith('/') ? rawPath.split('?')[0].slice(0, 120) : '/'

	return {
		event: event as AnalyticsEventType,
		path,
		utm_source: cleanStr(rec.utm_source, 80),
		utm_medium: cleanStr(rec.utm_medium, 80),
		utm_campaign: cleanStr(rec.utm_campaign, 100),
		country: cleanStr(rec.country, 8).toUpperCase(),
		device: rec.device === 'mobile' ? 'mobile' : 'desktop',
		placement: cleanStr(rec.placement, 60),
		label: cleanStr(rec.label, 120),
		lcp: cleanMetric(rec.lcp, 120000),
		inp: cleanMetric(rec.inp, 60000),
		cls: cleanMetric(rec.cls, 10),
		checkoutMs: cleanMetric(rec.checkoutMs, 600000),
		value: cleanMetric(rec.value, 10000000),
	}
}

/**
 * Streams a structured telemetry point into Cloudflare Workers Analytics Engine.
 * Safely degrades to a no-op outside Cloudflare Workers when `ANALYTICS` is unbound.
 */
export async function writeAnalyticsDataPoint(
	input: AnalyticsBeaconInput,
	explicitDataset?: AnalyticsEngineDataset | null,
): Promise<boolean> {
	try {
		const ctx = explicitDataset ? null : await getCloudflareContextSafe()
		const dataset = (explicitDataset ?? ctx?.env?.ANALYTICS) as
			| AnalyticsEngineDataset
			| undefined
		if (!dataset || typeof dataset.writeDataPoint !== 'function') {
			return false
		}

		const isConversion = input.event === 'conversion' ? 1 : 0
		const indexKey = `${input.utm_source || 'direct'}:${input.path || '/'}`.slice(0, 96)

		dataset.writeDataPoint({
			blobs: [
				input.event,
				input.path || '/',
				input.utm_source || '',
				input.utm_medium || '',
				input.utm_campaign || '',
				input.country || '',
				input.device || 'desktop',
				input.placement || '',
				input.label || '',
			],
			doubles: [
				1,
				input.lcp ?? 0,
				input.inp ?? 0,
				input.cls ?? 0,
				input.checkoutMs ?? 0,
				input.value ?? 0,
				isConversion,
			],
			indexes: [indexKey],
		})
		return true
	} catch {
		return false
	}
}

async function runAeSql<T>(
	accountId: string,
	apiToken: string,
	sql: string,
): Promise<T[]> {
	const res = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/analytics_engine/sql`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiToken}`,
				'Content-Type': 'text/plain',
			},
			body: sql,
		},
	)
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(
			`Analytics Engine SQL HTTP ${res.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`,
		)
	}
	const payload = (await res.json()) as { data?: T[] }
	return Array.isArray(payload.data) ? payload.data : []
}

/**
 * Queries aggregated funnel & Web Vitals metrics from Cloudflare Analytics Engine SQL API.
 * Falls back cleanly with setup guidance when API credentials are not configured.
 */
export async function queryAnalyticsEngineOverview(days = 7): Promise<AnalyticsEngineSummary> {
	const clampedDays = Math.min(Math.max(Math.round(days) || 7, 1), 90)
	const [ctx, accountId, analyticsToken, legacyToken, envDataset] = await Promise.all([
		getCloudflareContextSafe(),
		getEnvVar('CLOUDFLARE_ACCOUNT_ID'),
		getEnvVar('CLOUDFLARE_ANALYTICS_API_TOKEN'),
		getEnvVar('CLOUDFLARE_API_TOKEN'),
		getEnvVar('ANALYTICS_DATASET'),
	])
	const apiToken = analyticsToken || legacyToken
	const bindingAvailable = Boolean(
		ctx?.env?.ANALYTICS && typeof ctx.env.ANALYTICS.writeDataPoint === 'function',
	)
	const datasetName =
		envDataset && /^[a-zA-Z0-9_]+$/.test(envDataset)
			? envDataset
			: 'deanflow_analytics'

	if (!accountId || !apiToken) {
		return {
			configured: false,
			bindingAvailable,
			dataset: datasetName,
			days: clampedDays,
			reason:
				'Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ANALYTICS_API_TOKEN (or CLOUDFLARE_API_TOKEN) to view Analytics Engine funnel & Web Vitals rollups.',
		}
	}

	try {
		const tables = await runAeSql<{ dataset: string }>(
			accountId,
			apiToken,
			'SHOW TABLES',
		)
		const hasDataset = tables.some((t) => t.dataset === datasetName)
		if (!hasDataset) {
			return {
				configured: true,
				bindingAvailable,
				dataset: datasetName,
				days: clampedDays,
				reason: `Analytics Engine credentials verified. Dataset "${datasetName}" will appear automatically after the first deployed Worker event.`,
				funnel: {
					pageViews: 0,
					ctaClicks: 0,
					formStarts: 0,
					contactClicks: 0,
					catalogDownloads: 0,
					checkoutStarts: 0,
					conversions: 0,
				},
				vitals: {
					samples: 0,
					avgLcpMs: 0,
					avgInpMs: 0,
					avgCls: 0,
				},
				topSources: [],
				topPaths: [],
			}
		}

		const [funnelRows, vitalsRows, sourceRows, pathRows] = await Promise.all([
			runAeSql<{ event_type: string; cnt: number }>(
				accountId,
				apiToken,
				`SELECT blob1 AS event_type, SUM(double1) AS cnt
				 FROM ${datasetName}
				 WHERE timestamp > NOW() - INTERVAL '${clampedDays}' DAY
				 GROUP BY blob1`,
			),
			runAeSql<{
				samples: number
				avg_lcp: number
				avg_inp: number
				avg_cls: number
			}>(
				accountId,
				apiToken,
				`SELECT
					SUM(double1) AS samples,
					AVG(IF(double2 > 0, double2, NULL)) AS avg_lcp,
					AVG(IF(double3 > 0, double3, NULL)) AS avg_inp,
					AVG(IF(double4 > 0, double4, NULL)) AS avg_cls
				 FROM ${datasetName}
				 WHERE timestamp > NOW() - INTERVAL '${clampedDays}' DAY
				   AND blob1 = 'vitals'`,
			),
			runAeSql<{ source: string; page_views: number; conversions: number }>(
				accountId,
				apiToken,
				`SELECT
					IF(empty(blob3), 'direct', blob3) AS source,
					SUM(IF(blob1 = 'page_view', double1, 0)) AS page_views,
					SUM(double7) AS conversions
				 FROM ${datasetName}
				 WHERE timestamp > NOW() - INTERVAL '${clampedDays}' DAY
				 GROUP BY source
				 ORDER BY page_views DESC
				 LIMIT 8`,
			),
			runAeSql<{ path: string; views: number }>(
				accountId,
				apiToken,
				`SELECT blob2 AS path, SUM(double1) AS views
				 FROM ${datasetName}
				 WHERE timestamp > NOW() - INTERVAL '${clampedDays}' DAY
				   AND blob1 = 'page_view'
				 GROUP BY path
				 ORDER BY views DESC
				 LIMIT 8`,
			),
		])

		const countFor = (type: AnalyticsEventType) =>
			Math.round(
				Number(funnelRows.find((r) => r.event_type === type)?.cnt || 0),
			)
		const vit = vitalsRows[0]

		return {
			configured: true,
			bindingAvailable,
			dataset: datasetName,
			days: clampedDays,
			funnel: {
				pageViews: countFor('page_view'),
				ctaClicks: countFor('cta_click'),
				formStarts: countFor('form_start'),
				contactClicks: countFor('contact_click'),
				catalogDownloads: countFor('catalog_download'),
				checkoutStarts: countFor('checkout_start'),
				conversions: countFor('conversion'),
			},
			vitals: {
				samples: Math.round(Number(vit?.samples || 0)),
				avgLcpMs: Math.round(Number(vit?.avg_lcp || 0)),
				avgInpMs: Math.round(Number(vit?.avg_inp || 0)),
				avgCls: Number(Number(vit?.avg_cls || 0).toFixed(3)),
			},
			topSources: sourceRows.map((r) => ({
				source: r.source || 'direct',
				pageViews: Math.round(Number(r.page_views || 0)),
				conversions: Math.round(Number(r.conversions || 0)),
			})),
			topPaths: pathRows.map((r) => ({
				path: r.path || '/',
				views: Math.round(Number(r.views || 0)),
			})),
		}
	} catch (error) {
		return {
			configured: true,
			bindingAvailable,
			dataset: datasetName,
			days: clampedDays,
			reason:
				error instanceof Error
					? error.message
					: 'Unable to query Analytics Engine SQL API',
		}
	}
}

