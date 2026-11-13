const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')

const environment = (extra = {}) => ({
	process: {
		env: {
			NODE_ENV: 'production',
			NEXT_PUBLIC_DEPLOYMENT_PROFILE: 'free',
			...extra,
		},
	},
})

test('Free published queries never read draft cookies and cannot request raw/draft perspective', async () => {
	let called
	const module = load(
		'src/sanity/lib/live.ts',
		{
			'server-only': {},
			'next/headers': {
				draftMode: () => {
					throw new Error('Cookies must not be read for static pages')
				},
			},
			'next-sanity/live': {
				defineLive: () => ({
					sanityFetch: () => {
						throw new Error('Live query must not run')
					},
				}),
			},
			'./token': { token: 'synthetic-read-token' },
			'./client': {
				client: {
					withConfig: () => ({}),
					fetch: async (...args) => {
						called = args
						return { title: 'Published' }
					},
				},
			},
		},
		environment(),
	)
	assert.equal(
		(
			await module.sanityFetchLive({
				query: '*[0]',
				params: { slug: 'index' },
				perspective: 'raw',
			})
		).title,
		'Published',
	)
	assert.equal(called[2].perspective, 'published')
	assert.equal(called[2].stega, false)
})

test('Free storefront review paths return no ratings without accessing D1', async () => {
	const forbidden = () => {
		throw new Error('D1 must not be queried at build time')
	}
	const module = load(
		'src/lib/reviews.ts',
		{ '@/lib/d1': { d1Query: forbidden, reviewsDb: { list: forbidden } } },
		environment(),
	)
	const reviews = await module.getApprovedReviewsForProduct('p1')
	assert.equal(reviews.total, 0)
	assert.equal(reviews.reviews.length, 0)
	const enriched = await module.enrichProductsWithD1Reviews([
		{ _id: 'p1', title: 'Product', reviews: [{ rating: 5 }] },
	])
	assert.equal(enriched[0].reviewSummary.count, 0)
	assert.equal(enriched[0].reviews.length, 0)
})

test('Free production blocks review/comment writes before reading request payloads', async () => {
	for (const route of ['reviews', 'blog/comments']) {
		const handler = load(
			`src/app/(frontend)/api/${route}/route.ts`,
			{
				'next/server': {
					NextResponse: { json: (data, init) => Response.json(data, init) },
				},
				'next-sanity': {},
				'@/sanity/env': {},
				'@/lib/d1': {},
				'@/lib/rate-limit': {},
				'@/lib/reviews': {},
			},
			environment(),
		)
		const response = await handler.POST({
			json() {
				throw new Error('Must not read body')
			},
			formData() {
				throw new Error('Must not buffer upload')
			},
		})
		assert.equal(response.status, 403)
	}
})

test('Outbox caps all Free drains at one job and rejects invalid/negative batch sizes', () => {
	for (const configured of [undefined, '', '15', '0', '-5', 'invalid']) {
		const { outboxJobLimit } = load('src/lib/outbox-budget.ts', {
			'./cf-env': {
				getEnvVarSync: (key) =>
					key === 'NEXT_PUBLIC_DEPLOYMENT_PROFILE' ? 'free' : configured,
			},
		})
		assert.equal(outboxJobLimit(15), 1)
		assert.equal(outboxJobLimit(-1), 0)
		assert.equal(outboxJobLimit(NaN), 0)
	}
	const standard = load('src/lib/outbox-budget.ts', {
		'./cf-env': { getEnvVarSync: () => undefined },
	})
	assert.equal(standard.outboxJobLimit(10), 10)
})

test('Free retains local vitals snapshots without sending beacons by default', () => {
	let sent = 0
	const window = { innerWidth: 800, location: { pathname: '/test' } }
	const module = load(
		'src/lib/vitals.ts',
		{},
		{
			...environment(),
			window,
			navigator: {
				sendBeacon: () => {
					sent++
				},
			},
		},
	)
	const snapshot = module.updateVitalsSnapshot({ lcp: 1000 })
	module.sendVitalsBeacon(snapshot)
	module.sendVitalsBeacon(snapshot)
	assert.equal(window.__DEANFLOW_VITALS__.lcp, 1000)
	assert.equal(sent, 0)
})

test('Malformed login bodies return JSON 400 before accessing account/password services', async () => {
	const forbidden = () => {
		throw new Error('Account service must not be used')
	}
	const handler = load('src/app/(frontend)/api/admin/auth/login/route.ts', {
		'next/server': {
			NextResponse: { json: (data, init) => Response.json(data, init) },
		},
		'next/headers': {},
		'@/lib/admin-auth': {},
		'@/lib/d1': { adminUsersDb: { getByEmail: forbidden } },
		'@/lib/rate-limit': { takeRateLimit: forbidden },
	})
	for (const body of [
		'{}',
		'null',
		'[]',
		'{',
		'{"email":"test@example.test"}',
	]) {
		const response = await handler.POST(
			new Request('https://test/api', { method: 'POST', body }),
		)
		assert.equal(response.status, 400)
		assert.equal((await response.json()).success, false)
	}
})
