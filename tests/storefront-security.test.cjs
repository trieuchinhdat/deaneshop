const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const exec = promisify(execFile)
const { load } = require('./load-ts.cjs')

const pySqlite = `import sqlite3, json, sys
p = json.loads(sys.argv[2])
c = sqlite3.connect(sys.argv[1], timeout=20)
c.row_factory = sqlite3.Row
if 'script' in p:
    c.executescript(p['script'])
    c.commit()
    print('{}')
else:
    q = c.execute(p['sql'], p.get('params', []))
    rows = [dict(r) for r in q.fetchall()]
    changes = c.execute('SELECT changes()').fetchone()[0]
    c.commit()
    print(json.dumps({'success': True, 'results': rows, 'meta': {'changes': changes}}))
c.close()`

function createSqliteBinding(dbFile) {
	async function run(sql, params = []) {
		const { stdout } = await exec('python3', ['-c', pySqlite, dbFile, JSON.stringify({ sql, params })])
		return JSON.parse(stdout)
	}
	return {
		run,
		binding: {
			prepare(sql) {
				return {
					bind(...params) {
						return { all: () => run(sql, params) }
					},
					all: () => run(sql, []),
				}
			},
		},
	}
}

async function applyAllMigrations(dbFile) {
	const files = fs
		.readdirSync('migrations')
		.filter((f) => f.endsWith('.sql'))
		.sort()
	const script = files.map((f) => fs.readFileSync(path.join('migrations', f), 'utf8')).join('\n')
	await exec('python3', ['-c', pySqlite, dbFile, JSON.stringify({ script })])
}

test('DF-022 & DF-030: live.ts is not a Server Action, forces published in prod, and useSearchStore prevents out-of-order races', async () => {
	const liveSrc = fs.readFileSync('src/sanity/lib/live.ts', 'utf8')
	assert.doesNotMatch(liveSrc, /^['"]use server['"]/m)

	let usedPerspective
	const liveMod = load(
		'src/sanity/lib/live.ts',
		{
			'server-only': {},
			'next/headers': { draftMode: async () => ({ isEnabled: false }) },
			'next-sanity/live': {
				defineLive: () => ({
					sanityFetch: async ({ perspective }) => {
						usedPerspective = perspective
						return { data: null }
					},
					SanityLive: () => null,
				}),
			},
			'./token': { token: 'read-token-test' },
			'./client': {
				client: { withConfig: () => ({}) },
			},
		},
		{ process: { env: { NODE_ENV: 'production' } } },
	)

	await liveMod.sanityFetchLive({ query: '*[0]', perspective: 'raw' })
	assert.equal(usedPerspective, 'published')

	const actionsMod = load(
		'src/ui/modules/search/actions.ts',
		{
			'next-sanity': { groq: (s) => s.join('') },
			'next/headers': { draftMode: async () => ({ isEnabled: false }) },
			'@/lib/reviews': { enrichProductsWithD1Reviews: async (items) => items },
			'@/sanity/lib/live': {
				sanityFetchLive: async ({ params }) => ({
					items: [{ _id: 'p1', _type: 'product', title: 'Item', slug: '/products/item' }],
					total: 1,
					params,
				}),
			},
		},
		{ process: { env: { NODE_ENV: 'production' } } },
	)

	const searchOut = await actionsMod.searchStorefront({ query: 'item', scope: 'product', pageSize: 500 })
	assert.equal(searchOut.pageSize, 24)
	assert.equal(searchOut.products.length, 1)

	const storeMod = load('src/ui/modules/search/store.ts', {
		'./http': { searchStorefront: actionsMod.searchStorefront },
	})

	let resolveFirst
	let callCount = 0
	const fetcher = () => {
		callCount += 1
		if (callCount === 1) {
			return new Promise((res) => {
				resolveFirst = () =>
					res({
						products: [{ _id: 'stale', _type: 'product', title: 'Stale', slug: '/products/stale' }],
						blogs: [],
						pages: [],
						totals: { products: 1, blogs: 0, pages: 0 },
						pageSize: 8,
					})
			})
		}
		return Promise.resolve({
			products: [{ _id: 'fresh', _type: 'product', title: 'Fresh', slug: '/products/fresh' }],
			blogs: [],
			pages: [],
			totals: { products: 1, blogs: 0, pages: 0 },
			pageSize: 8,
		})
	}

	let latestResponse = null
	let loadingState = false
	let errState = null
	const p1 = storeMod.handleSearch({
		query: 'old',
		setLoading: (l) => {
			loadingState = l
		},
		setError: (e) => {
			errState = e
		},
		setResponse: (r) => {
			latestResponse = r
		},
		searchFn: fetcher,
	})
	const p2 = storeMod.handleSearch({
		query: 'new',
		setLoading: (l) => {
			loadingState = l
		},
		setError: (e) => {
			errState = e
		},
		setResponse: (r) => {
			latestResponse = r
		},
		searchFn: fetcher,
	})
	await p2
	resolveFirst()
	await p1

	assert.equal(latestResponse.products[0]._id, 'fresh')
	assert.equal(loadingState, false)

	// Error clears loading flag cleanly
	await storeMod.handleSearch({
		query: 'err',
		setLoading: (l) => {
			loadingState = l
		},
		setError: (e) => {
			errState = e
		},
		setResponse: (r) => {
			latestResponse = r
		},
		searchFn: async () => {
			throw new Error('Network failure')
		},
	})
	assert.equal(loadingState, false)
	assert.match(errState || '', /Search temporarily unavailable|Network failure/)
})

test('DF-023: serializeJsonLd escapes closing script tags and HTML comments without altering parsed JSON', () => {
	const { serializeJsonLd } = load('src/lib/json-ld.ts')
	const malicious = { name: '</script><script>alert("xss")</script><!--', price: 10 }
	const output = serializeJsonLd(malicious)
	assert.doesNotMatch(output, /<\/script>/i)
	assert.doesNotMatch(output, /</)
	assert.deepEqual(JSON.parse(output), malicious)
})

test('DF-026 & DF-027: unified D1 reviews strip emails, reject invalid media & missing write token, clean orphan Sanity assets, and update admin_events', async (t) => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-reviews-'))
	t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
	const dbFile = path.join(dir, 'db.sqlite')
	await applyAllMigrations(dbFile)
	const sqlite = createSqliteBinding(dbFile)
	const repo = load('src/lib/d1.ts', {}, { console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding })

	await repo.reviewsDb.create({
		id: 'rev-pub-1',
		product_id: 'prod-a',
		product_title: 'Valve A',
		product_slug: 'valve-a',
		author: 'Public Buyer',
		author_email: 'secret-buyer@example.com',
		rating: 5,
		comment: 'Excellent',
		is_approved: 1,
	})
	await repo.reviewsDb.create({
		id: 'rev-pend-2',
		product_id: 'prod-a',
		product_title: 'Valve A',
		product_slug: 'valve-a',
		author: 'Pending Buyer',
		author_email: 'pending@example.com',
		rating: 1,
		comment: 'Unmoderated',
		is_approved: 0,
	})

	const reviewsLib = load('src/lib/reviews.ts', { '@/lib/d1': repo }, { DB: sqlite.binding })
	const pdpData = await reviewsLib.getApprovedReviewsForProduct('prod-a')
	assert.equal(pdpData.total, 1)
	assert.equal(pdpData.averageRating, 5)
	assert.equal(pdpData.reviews[0].author_email, undefined)

	const enriched = await reviewsLib.enrichProductsWithD1Reviews([{ _id: 'prod-a', title: 'Valve A' }])
	assert.equal(enriched[0].reviewSummary.count, 1)
	assert.equal(enriched[0].reviewSummary.avgRating, 5)

	// Invalid pagination on GET /api/reviews -> 400
	const reviewsRoute = load(
		'src/app/(frontend)/api/reviews/route.ts',
		{
			'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
			'@/lib/d1': repo,
			'@/sanity/env': { apiVersion: '2025-07-01', dataset: 'production', projectId: 'p' },
		},
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)
	assert.equal((await reviewsRoute.GET(new Request('https://test/api/reviews?limit=-1'))).status, 400)

	// Missing SANITY_API_WRITE_TOKEN fails when photos are uploaded rather than dropping them
	const validPngBytes = new Uint8Array(24)
	validPngBytes.set([137, 80, 78, 71, 13, 10, 26, 10])
	const makePhotoForm = () => {
		const fd = new FormData()
		fd.append('productId', 'prod-a')
		fd.append('author', 'Photo User')
		fd.append('comment', 'With photo')
		fd.append('rating', '5')
		fd.append('images', new File([validPngBytes], 'photo.png', { type: 'image/png' }))
		return fd
	}

	const noTokenRoute = load(
		'src/app/(frontend)/api/reviews/route.ts',
		{
			'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
			'@/lib/d1': repo,
			'@/sanity/env': { apiVersion: '2025-07-01', dataset: 'production', projectId: 'p' },
		},
		{ process: { env: {} }, console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding, File, FormData, Blob },
	)
	const missingTokenRes = await noTokenRoute.POST(
		new Request('https://test/api/reviews', { method: 'POST', body: makePhotoForm() }),
	)
	assert.equal(missingTokenRes.status, 503)

	// If Sanity upload succeeds and D1 insert fails, uploaded Sanity assets are cleaned up
	const deletedAssets = []
	const cleanupRoute = load(
		'src/app/(frontend)/api/reviews/route.ts',
		{
			'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
			'@/lib/d1': {
				...repo,
				reviewsDb: {
					...repo.reviewsDb,
					create: async () => {
						throw new repo.PersistenceError('D1 write error')
					},
				},
			},
			'next-sanity': {
				createClient: () => ({
					assets: { upload: async () => ({ _id: 'image-orphan-1', url: 'https://cdn.sanity.io/images/p/d/a.png' }) },
					delete: async (id) => deletedAssets.push(id),
				}),
			},
			'@/sanity/env': { apiVersion: '2025-07-01', dataset: 'production', projectId: 'p' },
		},
		{ process: { env: { SANITY_API_WRITE_TOKEN: 'sk_test' } }, console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding, File, FormData, Blob },
	)
	const failAfterUploadRes = await cleanupRoute.POST(
		new Request('https://test/api/reviews', { method: 'POST', body: makePhotoForm() }),
	)
	assert.equal(failAfterUploadRes.status, 503)
	assert.deepEqual(deletedAssets, ['image-orphan-1'])
})

test('DF-031, DF-032, DF-033, DF-034: canonical entity routing, image loader, consent UTM capture, and security/perf gates', async (t) => {
	const routing = load('src/lib/routing.ts')
	assert.equal(routing.resolveEntityRoute({ type: 'product', slug: '/steel-valve/' }), '/products/steel-valve')
	assert.equal(routing.resolveEntityRoute({ type: 'collection', slug: 'medical' }), '/collections/medical')
	assert.equal(routing.resolveEntityRoute({ type: 'blog.post', slug: '/news/' }), '/blog/news')
	assert.equal(routing.resolveEntityRoute({ type: 'page', slug: 'index' }), '/')

	const redir = routing.normalizeRedirectEntry({
		source: '/old-prod',
		destinationType: 'internal',
		internalType: 'product',
		internalSlug: 'steel-valve',
	})
	assert.deepEqual(JSON.parse(JSON.stringify(redir)), { source: '/old-prod', destination: '/products/steel-valve', permanent: true })
	const sitemapSrc = fs.readFileSync('src/app/sitemap.ts', 'utf8')
	assert.match(sitemapSrc, /_type == 'collection'/)

	const loaderMod = load('src/sanity/lib/image-loader.ts')
	const resized = loaderMod.default({
		src: 'https://cdn.sanity.io/images/proj/prod/sample-1200x800.jpg',
		width: 640,
		quality: 75,
	})
	assert.match(resized, /w=640/)
	assert.match(resized, /auto=format/)
	assert.equal(loaderMod.default({ src: '/api/og?slug=home', width: 640 }), '/api/og?slug=home')

	const imgSrc = fs.readFileSync('src/ui/img.tsx', 'utf8')
	assert.match(imgSrc, /IntersectionObserver/)
	assert.match(imgSrc, /prefers-reduced-motion/)
	assert.match(imgSrc, /loading="lazy"/)

	const attr = load('src/lib/attribution.ts')
	const captured = attr.captureCurrentUrlAttribution(
		'https://deanflow.com/products/valve?utm_source=google&utm_medium=cpc&gclid=g123',
		'https://google.com/',
		'',
	)
	assert.equal(captured.utm_source, 'google')
	assert.equal(captured.gclid, 'g123')
	assert.equal(captured.landing_page, '/products/valve')

	// DF-034: perf-check --ci fails non-zero when .next/static/chunks is absent
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-perf-ci-'))
	t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }))
	await assert.rejects(
		exec('node', [path.resolve('scripts/perf-check.cjs'), '--ci'], { cwd: tmpDir }),
	)
})
