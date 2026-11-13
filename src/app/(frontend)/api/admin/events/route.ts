import { NextRequest } from 'next/server'
import { getAdminSession, ROLE_PERMITTED_TABS } from '@/lib/admin-auth'
import { d1Query } from '@/lib/d1'

export const dynamic = 'force-dynamic'

const MAX_SSE_TICKS = 10
const MAX_SKIP_BATCHES_PER_TICK = 5

export async function GET(req: NextRequest) {
	const session = await getAdminSession()
	if (!session) return new Response('Unauthorized', { status: 401 })
	const encoder = new TextEncoder()
	let stopped = false
	let sentRetryPrefix = false
	let timer: ReturnType<typeof setTimeout> | undefined
	let ticks = 0
	const rawCursor = Number(
		req.headers.get('last-event-id') || req.nextUrl.searchParams.get('cursor'),
	)
	let cursor = Number.isSafeInteger(rawCursor) && rawCursor >= 0 ? rawCursor : 0
	let lastSentEventId = cursor

	const stream = new ReadableStream({
		start(controller) {
			const close = () => {
				stopped = true
				clearTimeout(timer)
				try {
					controller.close()
				} catch {}
			}
			req.signal.addEventListener('abort', close, { once: true })
			const tick = async () => {
				try {
					const current = await getAdminSession()
					if (!current || current.id !== session.id) return close()
					const tabs = ROLE_PERMITTED_TABS[current.role]

					// Reset cursor safely if DB was recreated or cursor exceeds max event ID
					let cursorReset = false
					if (cursor > 0 && ticks === 0) {
						const maxRes = await d1Query<{ maxId: number | null }>(
							'SELECT MAX(id) AS maxId FROM admin_events',
						).catch(() => ({ results: [] as Array<{ maxId: number | null }> }))
						const maxId = maxRes?.results?.[0]?.maxId
						if (typeof maxId === 'number' && cursor > maxId) {
							cursor = maxId
							lastSentEventId = -1
							cursorReset = true
						}
					}

					let emittedVisibleInTick = false
					let batches = 0

					while (!stopped && batches < MAX_SKIP_BATCHES_PER_TICK) {
						batches++
						const rows = await d1Query<{
							id: number
							type: string
							resource_id: string
							created_at: string
							assigned_to?: string
						}>(
							`SELECT e.*, l.assigned_to FROM admin_events e LEFT JOIN leads l ON e.resource_id = l.id WHERE e.id > ? ORDER BY e.id LIMIT 100`,
							[cursor],
						)
						const batch = rows.results || []
						if (batch.length === 0) break

						for (const event of batch) {
							cursor = event.id
							const isOrder = event.type.includes('ORDER')
							const isReview = event.type.includes('REVIEW')
							const isComment = event.type.includes('COMMENT')

							const visible = isOrder
								? tabs.includes('orders')
								: isReview
									? tabs.includes('reviews')
									: isComment
										? tabs.includes('comments')
										: tabs.includes('leads') &&
											(current.role !== 'sales' ||
												event.assigned_to === current.id)

							if (!stopped && visible) {
								const prefix = sentRetryPrefix ? '' : 'retry: 2000\n'
								sentRetryPrefix = true
								lastSentEventId = event.id
								emittedVisibleInTick = true
								controller.enqueue(
									encoder.encode(
										`${prefix}id: ${event.id}\ndata: ${JSON.stringify({ type: event.type, timestamp: event.created_at, data: { id: event.resource_id } })}\n\n`,
									),
								)
							}
						}

						if (batch.length < 100 || emittedVisibleInTick) break
					}

					// Always emit a data-bearing checkpoint event when cursor moved past last sent ID or was reset
					// so both EventSource Last-Event-ID and client handler advance past filtered backlog (DF-008)
					if (!stopped && (cursor > lastSentEventId || cursorReset)) {
						const prefix = sentRetryPrefix ? '' : 'retry: 2000\n'
						sentRetryPrefix = true
						lastSentEventId = cursor
						controller.enqueue(
							encoder.encode(
								`${prefix}id: ${cursor}\nevent: checkpoint\ndata: ${JSON.stringify({ type: 'CHECKPOINT', cursor })}\n\n`,
							),
						)
					} else if (!stopped && !emittedVisibleInTick) {
						const prefix = sentRetryPrefix ? '' : 'retry: 2000\n'
						sentRetryPrefix = true
						controller.enqueue(encoder.encode(`${prefix}id: ${cursor}\n: heartbeat\n\n`))
					}
				} catch {
					return close()
				}
				ticks += 1
				if (ticks >= MAX_SSE_TICKS) return close()
				if (!stopped) timer = setTimeout(tick, 5000)
			}
			void tick()
		},
		cancel() {
			stopped = true
			clearTimeout(timer)
		},
	})
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			'X-Accel-Buffering': 'no',
		},
	})
}
