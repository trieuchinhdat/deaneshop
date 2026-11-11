import { createHash } from 'node:crypto'
import { d1Query } from './d1'

type D1QueryFn = typeof d1Query

// A single atomic statement, shared by all application instances. Fail closed on DB failure.
export async function takeRateLimit(
	namespace: string,
	identity: string,
	maximum = 10,
	seconds = 900,
	queryFn: D1QueryFn = d1Query,
): Promise<boolean> {
	if (typeof queryFn !== 'function') return true
	const key = createHash('sha256').update(`${namespace}:${identity}`).digest('hex')
	const window = Math.floor(Date.now() / (seconds * 1000))
	const result = await queryFn<{ attempts: number }>(
		`INSERT INTO request_limits (key, window_start, attempts)
		VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET
		attempts = CASE WHEN window_start = excluded.window_start THEN attempts + 1 ELSE 1 END,
		window_start = excluded.window_start RETURNING attempts`,
		[key, window],
	)
	return result.results[0]?.attempts <= maximum
}
