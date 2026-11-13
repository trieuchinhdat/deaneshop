const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const { load } = require('./load-ts.cjs')

// Execute the actual production queries against SQLite, including DELETE RETURNING.
function bridgeDatabase() {
	const os = require('node:os'),
		path = require('node:path')
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sanity-bridge-'))
	const db = path.join(dir, 'test.sqlite')
	execFileSync(
		'python3',
		[
			'-c',
			'import sqlite3,sys;sqlite3.connect(sys.argv[1]).executescript(sys.stdin.read())',
			db,
		],
		{ input: fs.readFileSync('migrations/0014_sanity_login_bridge.sql') },
	)
	const query = async (sql, params = []) => {
		const output = execFileSync(
			'python3',
			[
				'-c',
				`import sqlite3,sys,json
c=sqlite3.connect(sys.argv[1]);c.row_factory=sqlite3.Row
q,p=json.load(sys.stdin);r=c.execute(q,p);rows=[dict(x) for x in r.fetchall()];c.commit();print(json.dumps(rows))`,
				db,
			],
			{ input: JSON.stringify([sql, params]), encoding: 'utf8' },
		)
		return { results: JSON.parse(output) }
	}
	return {
		query,
		close: () => fs.rmSync(dir, { recursive: true, force: true }),
	}
}

test('Login codes require the initiating browser, expire and can only be redeemed once', async (t) => {
	const db = bridgeDatabase()
	t.after(db.close)
	const api = load('src/lib/sanity-login-bridge.ts', {
		'./d1': { d1Query: db.query },
	})
	const { state, verifier } = await api.beginSanityLogin()
	const grant = {
		staff_id: 'staff',
		sanity_user_id: 'pHuman',
		project_id: 'project',
	}
	const code = await api.issueSanityLoginCode(state, grant)
	assert.equal(typeof code, 'string')
	assert.equal(await api.issueSanityLoginCode(state, grant), null)
	assert.equal(
		await api.redeemSanityLoginCode(state, code, api.loginNonce()),
		null,
	)
	assert.equal(
		await api.redeemSanityLoginCode(api.loginNonce(), code, verifier),
		null,
	)
	assert.equal(
		await api.redeemSanityLoginCode(state, api.loginNonce(), verifier),
		null,
	)
	assert.deepEqual(
		await api.redeemSanityLoginCode(state, code, verifier),
		grant,
	)
	assert.equal(await api.redeemSanityLoginCode(state, code, verifier), null)
	const second = await api.beginSanityLogin()
	const expiredCode = await api.issueSanityLoginCode(second.state, grant)
	await db.query('UPDATE sanity_login_transactions SET code_expires_at = 0')
	assert.equal(
		await api.redeemSanityLoginCode(second.state, expiredCode, second.verifier),
		null,
	)
	await db.query('UPDATE sanity_login_transactions SET expires_at = 0')
	assert.equal(await api.issueSanityLoginCode(second.state, grant), null)
	await api.beginSanityLogin()
	assert.equal(
		(await db.query('SELECT COUNT(*) AS n FROM sanity_login_transactions'))
			.results[0].n,
		1,
	)
})

const next = {
	NextResponse: {
		json: (body, init) => Response.json(body, init),
		redirect: (url, init = {}) =>
			new Response(null, {
				...init,
				status: init.status || 307,
				headers: { ...init.headers, Location: url.toString() },
			}),
	},
}
const config = {
	sanityLoginConfig: () => ({
		studio: new URL('https://deanflow.sanity.studio'),
		web: new URL('https://web.example'),
	}),
	loginResponseHeaders: {
		'Cache-Control': 'no-store',
		'Referrer-Policy': 'no-referrer',
	},
}
const state = 's'.repeat(43),
	code = 'c'.repeat(43)
const identity = { userId: 'pHuman', projectId: 'project' }
class IdentityError extends Error {}

function exchange(overrides = {}) {
	const calls = { issued: 0, verified: 0 }
	const handler = load(
		'src/app/(frontend)/api/admin/auth/sanity/exchange/route.ts',
		{
			'next/server': next,
			'@/lib/sanity-login-config': config,
			'@/lib/admin-auth-mode': { getAdminAuthMode: () => 'sanity' },
			'@/lib/rate-limit': { takeRateLimit: async () => true },
			'@/lib/d1': {
				adminUsersDb: {
					getBySanityId: async () => ({
						id: 'staff',
						status: 'active',
						sanity_user_id: identity.userId,
					}),
				},
			},
			'@/lib/sanity-staff-access': { resolveSanityStaff: async () => null },
			'@/lib/sanity-staff-identity': {
				SanityIdentityError: IdentityError,
				verifySanityStaffToken: async () => {
					calls.verified++
					return identity
				},
			},
			'@/lib/sanity-login-bridge': {
				validLoginNonce: (v) =>
					typeof v === 'string' && /^[A-Za-z0-9_-]{43}$/.test(v),
				issueSanityLoginCode: async (s, grant) => {
					calls.issued++
					assert.equal(s, state)
					assert.equal(grant.staff_id, 'staff')
					return code
				},
			},
			...overrides,
		},
	)
	return { handler, calls }
}
function exchangeRequest(
	origin = 'https://deanflow.sanity.studio',
	authorization = 'Bearer synthetic-personal-token-123456789',
) {
	return new Request(
		`https://web.example/api/admin/auth/sanity/exchange?state=${state}`,
		{
			method: 'POST',
			headers: { Origin: origin, Authorization: authorization },
		},
	)
}

test('Standalone exchange allowlists Studio origin and never issues cross-site session cookies', async () => {
	const { handler, calls } = exchange()
	const preflight = await handler.OPTIONS(exchangeRequest())
	assert.equal(preflight.status, 204)
	assert.equal(
		preflight.headers.get('access-control-allow-origin'),
		'https://deanflow.sanity.studio',
	)
	assert.equal(preflight.headers.get('access-control-allow-credentials'), null)
	for (const origin of [
		'https://evil.example',
		'null',
		'https://deanflow.sanity.studio.evil.example',
	]) {
		assert.equal((await handler.POST(exchangeRequest(origin))).status, 403)
		assert.equal((await handler.OPTIONS(exchangeRequest(origin))).status, 403)
	}
	assert.equal(calls.verified, 0)
	const result = await handler.POST(exchangeRequest())
	assert.equal(result.status, 200)
	assert.equal((await result.json()).code, code)
	assert.equal(result.headers.get('set-cookie'), null)
	assert.equal(result.headers.get('cache-control'), 'no-store')
	assert.equal(calls.issued, 1)
})

test('Exchange rejects absent token, non-member, inactive staff, expired transaction and rate limits', async () => {
	assert.equal(
		(await exchange().handler.POST(exchangeRequest(undefined, ''))).status,
		401,
	)
	for (const [overrides, status] of [
		[
			{
				'@/lib/sanity-staff-identity': {
					SanityIdentityError: IdentityError,
					verifySanityStaffToken: async () => {
						const e = new IdentityError('Not a member')
						e.status = 403
						throw e
					},
				},
			},
			403,
		],
		[
			{
				'@/lib/d1': {
					adminUsersDb: { getBySanityId: async () => ({ status: 'inactive' }) },
				},
			},
			403,
		],
		[{ '@/lib/rate-limit': { takeRateLimit: async () => false } }, 429],
		[
			{
				'@/lib/sanity-login-bridge': {
					validLoginNonce: () => true,
					issueSanityLoginCode: async () => null,
				},
			},
			400,
		],
	])
		assert.equal(
			(await exchange(overrides).handler.POST(exchangeRequest())).status,
			status,
		)
})

function callback({
	verifier = 'v'.repeat(43),
	grant = {
		staff_id: 'staff',
		sanity_user_id: 'pHuman',
		project_id: 'project',
	},
	status = 'active',
	mode = 'sanity',
} = {}) {
	const calls = { issued: 0, redeemed: 0, cookies: [] }
	const handler = load(
		'src/app/(frontend)/api/admin/auth/sanity/callback/route.ts',
		{
			'next/server': next,
			'next/headers': {
				cookies: async () => ({
					get: () => ({ value: verifier }),
					set: (...args) => calls.cookies.push(args),
				}),
			},
			'@/lib/sanity-login-config': config,
			'@/lib/admin-auth-mode': { getAdminAuthMode: () => mode },
			'@/lib/cf-env': { getEnvVarSync: () => 'project' },
			'@/lib/d1': {
				adminUsersDb: {
					getById: async () => ({
						id: 'staff',
						status,
						sanity_user_id: 'pHuman',
						role: 'sales',
					}),
					update: async () => {},
				},
			},
			'@/lib/admin-auth': {
				ADMIN_AUTH_COOKIE_NAME: 'session',
				createAdminSessionToken: async (s, ttl, verified) => {
					calls.issued++
					assert.equal(verified.userId, 'pHuman')
					assert.equal(ttl, 3600)
					return 'app-session'
				},
			},
			'@/lib/sanity-login-bridge': {
				SANITY_LOGIN_COOKIE: 'login',
				validLoginNonce: (v) => typeof v === 'string' && v.length === 43,
				redeemSanityLoginCode: async () => {
					calls.redeemed++
					return grant
				},
			},
		},
		{ process: { env: { NODE_ENV: 'production' } } },
	)
	return { handler, calls }
}
const callbackRequest = () =>
	new Request(
		`https://web.example/api/admin/auth/sanity/callback?state=${state}&code=${code}`,
	)
test('Callback rechecks browser, identity, project and active staff before setting a website cookie', async () => {
	for (const options of [
		{ verifier: '' },
		{ grant: null },
		{ grant: { project_id: 'wrong' } },
		{ status: 'inactive' },
		{ mode: 'password' },
	]) {
		const { handler, calls } = callback(options)
		const result = await handler.GET(callbackRequest())
		assert.equal(calls.issued, 0)
		assert.equal(calls.cookies.length, 0)
		assert.ok([303, 403].includes(result.status))
		if (options.verifier === '') assert.equal(calls.redeemed, 0)
	}
	const { handler, calls } = callback()
	const result = await handler.GET(callbackRequest())
	assert.equal(result.headers.get('location'), 'https://web.example/admin')
	assert.equal(result.headers.get('referrer-policy'), 'no-referrer')
	assert.equal(calls.cookies[0][0], 'session')
	assert.equal(calls.cookies[0][2].httpOnly, true)
	assert.equal(calls.cookies[0][2].secure, true)
	assert.equal(calls.cookies[0][2].sameSite, 'lax')
})

test('Start creates a protected browser verifier and redirects only to configured Studio', async () => {
 const calls = []
 const handler = load('src/app/(frontend)/api/admin/auth/sanity/start/route.ts', {
  'next/server': next,
  'next/headers': { cookies: async () => ({ set: (...args) => calls.push(args) }) },
  '@/lib/admin-auth-mode': { getAdminAuthMode: () => 'sanity' },
  '@/lib/rate-limit': { takeRateLimit: async () => true },
  '@/lib/sanity-login-config': config,
  '@/lib/sanity-login-bridge': { SANITY_LOGIN_COOKIE: '__Host-login', beginSanityLogin: async () => ({ state, verifier: 'browser-secret' }) },
 }, { process: { env: { NODE_ENV: 'production' } } })
 const response = await handler.GET(new Request('https://web.example/api/admin/auth/sanity/start?returnTo=https://evil.example'))
 const target = new URL(response.headers.get('location'))
 assert.equal(target.origin, 'https://deanflow.sanity.studio')
 assert.equal(target.pathname, '/workspace-login')
 assert.equal(target.searchParams.get('state'), state)
 assert.equal(target.searchParams.get('returnTo'), null)
 assert.equal(calls[0][1], 'browser-secret')
 assert.equal(calls[0][2].httpOnly, true)
 assert.equal(calls[0][2].secure, true)
 assert.equal(calls[0][2].sameSite, 'lax')
 assert.equal(calls[0][2].maxAge, 300)
 assert.equal(calls[0][2].domain, undefined)
 assert.equal((await handler.GET(new Request('https://evil.example/api/admin/auth/sanity/start'))).status, 403)
})

test('Production bridge configuration rejects insecure, path-bearing or identical origins', () => {
 for (const studio of ['http://studio.example', 'https://studio.example/path', 'https://user:pass@studio.example', 'https://studio.example?next=evil', 'https://web.example']) {
  const settings = { SANITY_STUDIO_ORIGIN: studio, NEXT_PUBLIC_BASE_URL: 'https://web.example' }
  const api = load('src/lib/sanity-login-config.ts', {
   './cf-env': { getEnvVarSync: key => settings[key] }, './sanity-studio-url': { sanityStudioUrl: studio },
  }, { process: { env: { NODE_ENV: 'production' } } })
  assert.throws(() => api.sanityLoginConfig())
 }
})
