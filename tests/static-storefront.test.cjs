const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const { load } = require('./load-ts.cjs')
const { verifyStaticStorefront } = require('../scripts/verify-static-storefront.cjs')

test('Public misses never load Next.js; runtime routes and cron still dispatch to the Worker', async () => {
	const prefixes = require('../shared/runtime-routes.json')
	const routes = load('src/lib/static-runtime-routes.ts', { '../../shared/runtime-routes.json': prefixes })
	let calls = []
	const runtime = {
		fetch: async (request) => { calls.push(new URL(request.url).pathname); return new Response('runtime') },
		scheduled: async () => { calls.push('scheduled') },
	}
	const { default: worker } = load('worker-free.ts', {
		'./src/lib/static-runtime-routes': routes,
		'./worker': { __esModule: true, default: runtime },
	})
	const env = { ASSETS: { fetch: async () => new Response('Static 404', { status: 404 }) } }
	for (const pathname of ['/missing', '/admin-public', '/quote-list', '/admin.txt']) {
		assert.equal((await worker.fetch(new Request(`https://site.test${pathname}`), env, {})).status, 404)
	}
	assert.equal(calls.length, 0)
	for (const pathname of ['/api/leads', '/api/search', '/admin', '/admin/staff', '/quote/private?token=secret', '/order-success?rt=secret', '/studio']) {
		assert.equal(await (await worker.fetch(new Request(`https://site.test${pathname}`), env, {})).text(), 'runtime')
	}
	assert.equal(calls.length, 7)
	await worker.scheduled({}, env, {})
	assert.equal(calls.at(-1), 'scheduled')
})

test('Artifact verification rejects stale config, missing navigation payloads and private HTML', (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deanflow-static-test-'))
	t.after(() => fs.rmSync(root, { recursive: true, force: true }))
	const write = (file, text) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text) }
	const hash = (text) => crypto.createHash('sha256').update(text).digest('hex')
	write('wrangler.jsonc', '{}')
	write('wrangler.free.generated.json', '{}')
	write('.next/BUILD_ID', 'worker-build')
	const manifest = { version: 1, html: ['index.html', '404.html'], workerBuildId: 'worker-build', configHash: hash('{}'), generatedConfigHash: hash('{}') }
	const save = () => write('.open-next/free-static-manifest.json', JSON.stringify(manifest))
	save()
	for (const file of ['index.html', 'index.txt', '404.html']) write(`.open-next/free-assets/${file}`, 'public')
	assert.equal(verifyStaticStorefront(root).html.length, 2)
	write('wrangler.jsonc', '{"changed":true}')
	assert.throws(() => verifyStaticStorefront(root), /configuration changed/)
	write('wrangler.jsonc', '{}')
	write('.next/BUILD_ID', 'another-build')
	assert.throws(() => verifyStaticStorefront(root), /builds differ/)
	write('.next/BUILD_ID', 'worker-build')
	fs.unlinkSync(path.join(root, '.open-next/free-assets/index.txt'))
	assert.throws(() => verifyStaticStorefront(root), /navigation payload/)
	write('.open-next/free-assets/index.txt', 'public')
	manifest.html.push('admin.html'); save()
	assert.throws(() => verifyStaticStorefront(root), /Private/)
})

test('Static search uses an HTTP endpoint with validation and no shared preview cache', async () => {
	let calls = 0
	let fail = false
	const route = load('src/app/(frontend)/api/search/route.ts', {
		'@/ui/modules/search/actions': { searchStorefront: async (input) => { calls++; if (fail) throw new Error('private provider detail'); return { query: input.query } } },
	})
	const request = (body) => new Request('https://site.test/api/search', { method: 'POST', body: JSON.stringify(body) })
	for (const input of [null, [], {}, { query: 'x'.repeat(121) }]) {
		assert.equal((await route.POST(request(input))).status, 400)
	}
	assert.equal(calls, 0)
	const result = await route.POST(request({ query: 'tray' }))
	assert.equal(result.status, 200)
	assert.equal(result.headers.get('cache-control'), 'no-store')
	assert.deepEqual(await result.json(), { query: 'tray' })
	fail = true
	const error = await route.POST(request({ query: 'tray' }))
	assert.equal(error.status, 503)
	assert.doesNotMatch(await error.text(), /private provider detail/)
})

test('Published export never accepts draft options or stega', async () => {
	let options
	const published = load('src/sanity/lib/published.ts', {
		'server-only': {},
		'./client': { client: { fetch: async (_query, _params, supplied) => { options = supplied; return [] } } },
		'./token': { token: 'test-token' },
	})
	await published.sanityFetchPublished({ query: '*[]', perspective: 'drafts' })
	assert.equal(options.perspective, 'published')
	assert.equal(options.stega, false)
	assert.equal(options.useCdn, false)
})
