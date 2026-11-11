const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const exec = promisify(execFile)
const { load } = require('./load-ts.cjs')

const CF_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__')

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

function createBinding(dbFile) {
	return {
		prepare(sql) {
			const execSql = async (params = []) => {
				const { stdout } = await exec('python3', ['-c', pySqlite, dbFile, JSON.stringify({ sql, params })])
				return JSON.parse(stdout)
			}
			return {
				bind: (...params) => ({ all: () => execSql(params) }),
				all: () => execSql([]),
			}
		},
	}
}

test('Cloudflare D1 binding fails closed on DB outage and forbids memory fallback in Workers/Production', async () => {
	const brokenBinding = {
		prepare: () => ({
			bind: () => ({ all: async () => { throw new Error('D1 connection lost') } }),
			all: async () => { throw new Error('D1 connection lost') },
		}),
	}

	const nextServer = { NextResponse: { json: (data, init) => Response.json(data, init) } }
	const env = {
		NODE_ENV: 'production',
		ADMIN_JWT_SECRET: 'resilience-test-secret-key-at-least-32-bytes',
		D1_ALLOW_MEMORY: 'true',
	}

	// 1. Worker context without DB + ASSETS present rejects even with D1_ALLOW_MEMORY=true
	const d1NoDb = load(
		'src/lib/d1.ts',
		{ '@opennextjs/cloudflare': { getCloudflareContext: async () => null } },
		{
			process: { env: { ...env, NODE_ENV: 'development' } },
			console: { error() {}, warn() {} },
			[CF_CONTEXT_SYMBOL]: { env: { ASSETS: {}, D1_ALLOW_MEMORY: 'true' } },
		},
	)
	await assert.rejects(d1NoDb.ordersDb.list())
	assert.equal(await d1NoDb.getD1RuntimeMode(), 'unconfigured')

	// 2. Broken D1 binding causes checkout, lead capture, login, and health endpoints to return 503
	const globalsBroken = {
		process: { env },
		console: { error() {}, warn() {} },
		[CF_CONTEXT_SYMBOL]: { env: { DB: brokenBinding, ASSETS: {}, ...env } },
	}
	const mocksBroken = {
		'next/server': nextServer,
		'next/headers': { cookies: async () => ({ get: () => null, set() {} }) },
		'@/sanity/lib/client': { client: { withConfig: () => ({ fetch: async () => [] }), fetch: async () => null } },
		'@opennextjs/cloudflare': { getCloudflareContext: async () => globalsBroken[CF_CONTEXT_SYMBOL] },
	}
	const d1Broken = load('src/lib/d1.ts', mocksBroken, globalsBroken)
	const authBroken = load('src/lib/admin-auth.ts', { ...mocksBroken, './d1': d1Broken }, globalsBroken)

	const healthPublic = load('src/app/(frontend)/api/health/route.ts', { ...mocksBroken, '@/lib/d1': d1Broken }, globalsBroken)
	const ordersCreate = load('src/app/(frontend)/api/orders/create/route.ts', { ...mocksBroken, '@/lib/d1': d1Broken }, globalsBroken)
	const leadsCreate = load('src/app/(frontend)/api/leads/route.ts', { ...mocksBroken, '@/lib/d1': d1Broken }, globalsBroken)
	const loginRoute = load('src/app/(frontend)/api/admin/auth/login/route.ts', { ...mocksBroken, '@/lib/d1': d1Broken, '@/lib/admin-auth': authBroken }, globalsBroken)

	assert.equal((await healthPublic.GET()).status, 503)
	assert.equal(
		(
			await ordersCreate.POST(
				new Request('https://test/api/orders/create', {
					method: 'POST',
					headers: { 'Idempotency-Key': 'resilience-key-00001' },
					body: JSON.stringify({
						mode: 'direct',
						name: 'Buyer',
						email: 'buyer@test.com',
						shippingAddress: '123 Main',
						shippingCountry: 'US',
						itemsDetail: [{ productId: 'p1', quantity: 1 }],
					}),
				}),
			)
		).status,
		503,
	)
	assert.equal(
		(
			await leadsCreate.POST(
				new Request('https://test/api/leads', {
					method: 'POST',
					body: JSON.stringify({ name: 'Lead', email: 'lead@test.com' }),
				}),
			)
		).status,
		503,
	)
	assert.equal(
		(
			await loginRoute.POST(
				new Request('https://test/api/admin/auth/login', {
					method: 'POST',
					body: JSON.stringify({ email: 'admin@test.com', password: 'Password123456' }),
				}),
			)
		).status,
		503,
	)
})

test('Revoked staff session is immediately rejected across auth, poll, SSE, and health; 0-row mutations return 404', async (t) => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deanflow-res-'))
	t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
	const dbFile = path.join(dir, 'res.sqlite')
	const script = fs
		.readdirSync('migrations')
		.filter((f) => f.endsWith('.sql'))
		.sort()
		.map((f) => fs.readFileSync(path.join('migrations', f), 'utf8'))
		.join('\n')
	await exec('python3', ['-c', pySqlite, dbFile, JSON.stringify({ script })])

	const dbBinding = createBinding(dbFile)
	const env = {
		NODE_ENV: 'production',
		ADMIN_JWT_SECRET: 'resilience-test-secret-key-at-least-32-bytes',
	}
	let activeToken = null
	const globals = {
		process: { env },
		console: { error() {}, warn() {} },
		ReadableStream,
		[CF_CONTEXT_SYMBOL]: { env: { DB: dbBinding, ASSETS: {}, ...env } },
	}
	const mocks = {
		'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
		'next/headers': {
			cookies: async () => ({
				get: (n) => (n === 'deanflow_admin_session' && activeToken ? { value: activeToken } : undefined),
			}),
		},
		'@opennextjs/cloudflare': { getCloudflareContext: async () => globals[CF_CONTEXT_SYMBOL] },
	}

	const d1Mod = load('src/lib/d1.ts', mocks, globals)
	const authMod = load('src/lib/admin-auth.ts', { ...mocks, './d1': d1Mod }, globals)

	await d1Mod.adminUsersDb.create({
		id: 'u_admin',
		email: 'admin@test.com',
		password_hash: 'hash_v1',
		full_name: 'Admin',
		role: 'admin',
		status: 'active',
		assigned_leads_count: 0,
	})
	activeToken = await authMod.createAdminSessionToken({
		id: 'u_admin',
		email: 'admin@test.com',
		name: 'Admin',
		role: 'admin',
		createdAt: new Date().toISOString(),
	})

	const adminHealth = load('src/app/(frontend)/api/admin/health/route.ts', { ...mocks, '@/lib/d1': d1Mod, '@/lib/admin-auth': authMod }, globals)
	const publicHealth = load('src/app/(frontend)/api/health/route.ts', { ...mocks, '@/lib/d1': d1Mod }, globals)
	const pollRoute = load('src/app/(frontend)/api/admin/poll/route.ts', { ...mocks, '@/lib/d1': d1Mod, '@/lib/admin-auth': authMod }, globals)
	const eventsRoute = load('src/app/(frontend)/api/admin/events/route.ts', { ...mocks, '@/lib/d1': d1Mod, '@/lib/admin-auth': authMod }, globals)
	const reviewsUpd = load('src/app/(frontend)/api/admin/reviews/update/route.ts', { ...mocks, '@/lib/d1': d1Mod, '@/lib/admin-auth': authMod }, globals)
	const commentsUpd = load('src/app/(frontend)/api/admin/comments/update/route.ts', { ...mocks, '@/lib/d1': d1Mod, '@/lib/admin-auth': authMod }, globals)
	const usersRoute = load('src/app/(frontend)/api/admin/users/route.ts', { ...mocks, '@/lib/d1': d1Mod, '@/lib/admin-auth': authMod }, globals)

	// Health check verifies Cloudflare binding + all triggers & tables
	const pubRes = await publicHealth.GET()
	assert.equal(pubRes.status, 200)
	assert.deepEqual(await pubRes.json(), { ok: true, database: 'connected' })

	const admHealthRes = await adminHealth.GET()
	assert.equal(admHealthRes.status, 200)
	const admHealthJson = await admHealthRes.json()
	assert.equal(admHealthJson.healthy, true)
	assert.equal(admHealthJson.d1Mode, 'binding')

	// 0-row updates/deletes must return 404
	assert.equal((await reviewsUpd.POST(new Request('https://t/api', { method: 'POST', body: JSON.stringify({ reviewId: 'missing', isApproved: true }) }))).status, 404)
	assert.equal((await commentsUpd.POST(new Request('https://t/api', { method: 'POST', body: JSON.stringify({ commentId: 'missing', isApproved: true }) }))).status, 404)
	assert.equal((await usersRoute.PUT(new Request('https://t/api', { method: 'PUT', body: JSON.stringify({ id: 'missing', full_name: 'X' }) }))).status, 404)

	// Disable staff user -> existing valid JWT immediately loses access everywhere
	await d1Mod.adminUsersDb.update('u_admin', { status: 'inactive' })
	assert.equal((await pollRoute.GET(new Request('https://t/api/admin/poll'))).status, 401)
	assert.equal((await adminHealth.GET()).status, 401)
	assert.equal((await eventsRoute.GET({ headers: new Headers(), nextUrl: new URL('https://t/api/admin/events'), signal: new AbortController().signal })).status, 401)

	// Dossier email escapes HTML and does not report success when unconfigured
	const dossierMod = load('src/lib/dossier-email.ts', mocks, globals)
	const simResult = await dossierMod.sendComplianceDossierEmail({
		customerName: '<script>alert(1)</script>',
		customerEmail: 'buyer@test.com',
		documentTitle: 'Test & Audit',
	})
	assert.equal(simResult.success, false)
	assert.equal(simResult.providerStatus, 'simulated')
})

