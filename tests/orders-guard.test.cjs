const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')

const nextMock = {
	NextResponse: {
		json: (data, init) => {
			const res = Response.json(data, init)
			return res
		},
	},
}

test('assertOrdersApiEnabled blocks execution with HTTP 410 when ENABLE_COMMERCE_ORDERS is not true', async () => {
	const guard = load('src/lib/orders-guard.ts', {}, {
		process: { env: { ENABLE_COMMERCE_ORDERS: 'false' } },
	})
	assert.equal(guard.isOrdersApiEnabled(), false)
	const res = guard.assertOrdersApiEnabled()
	assert.ok(res)
	assert.equal(res.status, 410)
	const body = await res.json()
	assert.equal(body.success, false)
	assert.equal(body.code, 'ORDERS_DISABLED')
	assert.equal(body.error, 'Orders API is disabled in B2B RFQ mode')
})

test('assertOrdersApiEnabled permits execution when ENABLE_COMMERCE_ORDERS is true', async () => {
	const guard = load('src/lib/orders-guard.ts', {}, {
		process: { env: { ENABLE_COMMERCE_ORDERS: 'true' } },
	})
	assert.equal(guard.isOrdersApiEnabled(), true)
	assert.equal(guard.assertOrdersApiEnabled(), null)
})

test('All 9 /api/orders/* route handlers return 410 Gone and never touch D1 when commerce is disabled', async () => {
	let dbTouched = false
	const d1Trap = new Proxy({}, {
		get() {
			dbTouched = true
			return async () => { throw new Error('D1 should not be called when orders API is disabled') }
		},
	})
	const globalsDisabled = {
		process: { env: { ENABLE_COMMERCE_ORDERS: 'false', NEXT_PUBLIC_SANITY_DATASET: 'production', NEXT_PUBLIC_SANITY_PROJECT_ID: 'test' } },
	}
	const mocks = {
		'next/server': nextMock,
		'@/lib/d1': d1Trap,
		'@/sanity/lib/client': { client: {} },
		'@/lib/admin-auth': { requireAdminSession: async () => { dbTouched = true; return { ok: false, status: 401 } } },
		'@/lib/orders-guard': load('src/lib/orders-guard.ts', {}, globalsDisabled),
	}

	const routes = [
		{ path: 'src/app/(frontend)/api/orders/create/route.ts', method: 'POST', url: 'https://test/api/orders/create' },
		{ path: 'src/app/(frontend)/api/orders/list/route.ts', method: 'GET', url: 'https://test/api/orders/list' },
		{ path: 'src/app/(frontend)/api/orders/update-status/route.ts', method: 'POST', url: 'https://test/api/orders/update-status' },
		{ path: 'src/app/(frontend)/api/orders/record-payment/route.ts', method: 'POST', url: 'https://test/api/orders/record-payment' },
		{ path: 'src/app/(frontend)/api/orders/release-fulfillment/route.ts', method: 'POST', url: 'https://test/api/orders/release-fulfillment' },
		{ path: 'src/app/(frontend)/api/orders/delete/route.ts', method: 'POST', url: 'https://test/api/orders/delete' },
		{ path: 'src/app/(frontend)/api/orders/delete/route.ts', method: 'DELETE', url: 'https://test/api/orders/delete' },
		{ path: 'src/app/(frontend)/api/orders/approve-quote/route.ts', method: 'POST', url: 'https://test/api/orders/approve-quote' },
		{ path: 'src/app/(frontend)/api/orders/accept-quote/route.ts', method: 'POST', url: 'https://test/api/orders/accept-quote' },
		{ path: 'src/app/(frontend)/api/orders/request-revision/route.ts', method: 'POST', url: 'https://test/api/orders/request-revision' },
	]

	for (const { path: routePath, method, url } of routes) {
		dbTouched = false
		const handler = load(routePath, mocks, globalsDisabled)
		const req = new Request(url, { method, body: method !== 'GET' ? JSON.stringify({ test: true }) : undefined })
		const fn = handler[method]
		assert.ok(fn, `Handler function ${method} missing in ${routePath}`)
		const res = await fn(req)
		assert.equal(res.status, 410, `${method} ${routePath} must return HTTP 410 Gone`)
		const data = await res.json()
		assert.equal(data.code, 'ORDERS_DISABLED', `${method} ${routePath} code must be ORDERS_DISABLED`)
		assert.equal(dbTouched, false, `${method} ${routePath} touched D1 while disabled!`)
	}
})

test('Edge Worker intercepts /api/orders/* with HTTP 410 before calling Next.js runtime', async () => {
	let nextJsHandlerCalled = false
	const mockOpenNext = {
		fetch: async () => {
			nextJsHandlerCalled = true
			return new Response('openNext', { status: 200 })
		},
	}
	const worker = load('worker.ts', {
		'./.open-next/worker.js': mockOpenNext,
		'./src/lib/cf-env': { runWithRuntimeContext: async (_ctx, fn) => fn() },
	})

	const res = await worker.default.fetch(
		new Request('https://deanflow.test/api/orders/create', { method: 'POST' }),
		{ ENABLE_COMMERCE_ORDERS: 'false' },
		{ waitUntil: () => {} },
	)

	assert.equal(res.status, 410)
	const body = await res.json()
	assert.equal(body.code, 'ORDERS_DISABLED')
	assert.equal(nextJsHandlerCalled, false, 'Edge Worker must not invoke OpenNext when orders are disabled')
})
