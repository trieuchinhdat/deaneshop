const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { load } = require('./load-ts.cjs')

test('Staff login diagnostics distinguish incomplete schema without exposing raw SQL or credentials', () => {
	const { adminLoginError } = load('src/lib/admin-login-error.ts')
	for (const causeMessage of ['no such column: sanity_user_id', 'no such table: admin_users', 'table admin_users has no column named sanity_user_id']) {
		const result = adminLoginError({ message: 'Persistent storage unavailable', causeMessage })
		assert.equal(result.code, 'AUTH_SCHEMA_OUTDATED')
		assert.match(result.error, /0011/)
		assert.doesNotMatch(result.error, /SELECT|password_hash|sanity_user_id/)
	}
	assert.equal(adminLoginError(new Error('ADMIN_JWT_SECRET must contain at least 32 bytes')).code, 'AUTH_CONFIGURATION_ERROR')
	assert.equal(adminLoginError({ causeMessage: 'D1 is not configured' }).code, 'AUTH_STORAGE_NOT_CONFIGURED')
	assert.doesNotMatch(adminLoginError(new Error('synthetic-secret-must-not-be-exposed')).error, /synthetic-secret/)
})

const sessionToken = 'synthetic-personal-sanity-token-123456789'
const projectId = 'test123'
const userId = 'pHuman123'
const next = { NextResponse: { json: (body, init) => Response.json(body, init) } }
const identityConfig = { './cf-env': { getEnvVarSync: key => key === 'NEXT_PUBLIC_SANITY_PROJECT_ID' ? projectId : undefined } }
const project = (members) => ({ id: projectId, members })
const member = { id: userId, isCurrentUser: true, isRobot: false }

test('Sanity identity verifier authenticates the caller and checks human membership of the configured project', async () => {
	const calls = []
	const verifier = load('src/lib/sanity-staff-identity.ts', identityConfig, {
		fetch: async (url, options) => {
			calls.push([url, options])
			return Response.json(url.includes('/users/me') ? { id: userId, email: 'Staff@Example.test' } : project([member]))
		},
	})
	const verified = await verifier.verifySanityStaffToken(sessionToken)
	assert.equal(verified.userId, userId)
	assert.equal(verified.projectId, projectId)
	assert.equal(verified.email, 'staff@example.test')
	assert.equal(calls.length, 2)
	for (const [url, options] of calls) {
		assert.ok(url.startsWith('https://api.sanity.io/'))
		assert.equal(options.headers.Authorization, `Bearer ${sessionToken}`)
		assert.equal(options.cache, 'no-store')
		assert.equal(options.redirect, 'error')
	}
})

test('Sanity identity rejects invalid tokens, wrong project, robots, non-members and absent current-user flags', async () => {
	for (const payload of [project([]), project([{ ...member, isRobot: true }]), project([{ ...member, id: 'other' }]), project([{ ...member, isCurrentUser: false }]), project([{ id: userId }]), { ...project([member]), id: 'other-project' }, { ...project([member]), isDisabled: true }]) {
		const verifier = load('src/lib/sanity-staff-identity.ts', identityConfig, { fetch: async url => Response.json(url.includes('/users/me') ? { id: userId } : payload) })
		await assert.rejects(verifier.verifySanityStaffToken(sessionToken), error => error.status === 403)
	}
	for (const reply of [() => new Response('unauthorized', { status: 401 }), () => new Response('<html>offline</html>', { status: 503 }), () => Response.json({ id: 'x'.repeat(10000) }), () => { throw new Error('network unavailable') }]) {
		const verifier = load('src/lib/sanity-staff-identity.ts', identityConfig, { fetch: reply })
		await assert.rejects(verifier.verifySanityStaffToken(sessionToken))
	}
})

function exchange(overrides = {}) {
	const calls = { verified: 0, issued: 0, updated: 0, cookie: null }
	const user = { id: 'staff-1', email: 'staff@example.test', full_name: 'Staff', role: 'sales', status: 'active', created_at: '2026-01-01' }
	const handler = load('src/app/(frontend)/api/admin/auth/sanity-verify/route.ts', {
		'next/server': next,
		'next/headers': { cookies: async () => ({ set: (...args) => { calls.cookie = args } }) },
		'@/lib/admin-auth-mode': { getAdminAuthMode: () => 'sanity' },
		'@/lib/rate-limit': { takeRateLimit: async () => true },
		'@/lib/sanity-staff-access': { resolveSanityStaff: async () => null },
		'@/lib/sanity-staff-identity': { SanityIdentityError: Error, verifySanityStaffToken: async () => { calls.verified++; return { userId, projectId } } },
		'@/lib/d1': { adminUsersDb: { getBySanityId: async id => { assert.equal(id, userId); return user }, update: async () => { calls.updated++ } } },
		'@/lib/admin-auth': { ADMIN_AUTH_COOKIE_NAME: 'session', createAdminSessionToken: async (staff, ttl, identity) => { calls.issued++; assert.equal(staff.role, 'sales'); assert.equal(identity.userId, userId); assert.equal(ttl, 3600); return 'signed-app-session' } },
		...overrides,
	}, { process: { env: { NODE_ENV: 'production' } } })
	return { handler, calls, user }
}
const request = (headers = {}, body = {}) => new Request('https://site.example.test/api/admin/auth/sanity-verify', {
	method: 'POST', headers: { origin: 'https://site.example.test', authorization: `Bearer ${sessionToken}`, ...headers }, body: JSON.stringify(body),
})

test('Sanity exchange reports missing staff identity migration as a safe 503 without issuing a session', async () => {
	const { handler, calls } = exchange({
		'@/lib/sanity-staff-identity': {
			SanityIdentityError: class ProviderError extends Error {},
			verifySanityStaffToken: async () => ({ userId, projectId }),
		},
		'@/lib/d1': { adminUsersDb: { getBySanityId: async () => { throw { message: 'Persistent storage unavailable', causeMessage: 'no such column: sanity_user_id' } } } },
	})
	const response = await handler.POST(request())
	assert.equal(response.status, 503)
	const result = await response.json()
	assert.equal(result.code, 'AUTH_SCHEMA_OUTDATED')
	assert.match(result.error, /0011/)
	assert.equal(calls.issued, 0)
	assert.equal(calls.cookie, null)
})

test('Sanity exchange ignores client identity/role, binds only the verified user and issues a protected cookie', async () => {
	const { handler, calls } = exchange()
	const response = await handler.POST(request({}, { sanityUser: { id: 'attacker', email: 'owner@example.test', role: 'superadmin' } }))
	assert.equal(response.status, 200)
	assert.equal((await response.json()).user.role, 'sales')
	assert.equal(response.headers.get('cache-control'), 'no-store')
	assert.equal(calls.verified, 1)
	assert.equal(calls.issued, 1)
	assert.equal(calls.cookie[2].httpOnly, true)
	assert.equal(calls.cookie[2].secure, true)
	assert.equal(calls.cookie[2].sameSite, 'lax')
})

test('Sanity exchange rejects forged profile-only requests, cross-origin, inactive/unlinked accounts and rate limits', async () => {
	for (const headers of [{ authorization: '' }, { origin: 'https://evil.example.test' }]) {
		const { handler, calls } = exchange()
		assert.ok([401, 403].includes((await handler.POST(request(headers, { sanityUser: { email: 'owner@example.test' } }))).status))
		assert.equal(calls.verified, 0)
		assert.equal(calls.issued, 0)
	}
	for (const linked of [null, { status: 'inactive' }]) {
		const { handler, calls } = exchange({ '@/lib/d1': { adminUsersDb: { getBySanityId: async () => linked } } })
		assert.equal((await handler.POST(request())).status, 403)
		assert.equal(calls.issued, 0)
	}
	const { handler, calls } = exchange({ '@/lib/rate-limit': { takeRateLimit: async () => false } })
	assert.equal((await handler.POST(request())).status, 429)
	assert.equal(calls.verified, 0)
})

test('Sanity exchange provisions verified project members without invitations and ignores client role/profile', async () => {
	let provisioned = 0
	const verified = { userId, projectId, email: 'staff@example.test' }
	const staff = { id: 'staff-1', email: verified.email, full_name: 'Staff', role: 'sales', status: 'active' }
	const { handler, calls } = exchange({
		'@/lib/sanity-staff-identity': { SanityIdentityError: class ProviderError extends Error {}, verifySanityStaffToken: async () => verified },
		'@/lib/d1': { adminUsersDb: { getBySanityId: async () => null, update: async () => {} } },
		'@/lib/sanity-staff-access': { resolveSanityStaff: async identity => { provisioned++; assert.equal(identity, verified); return staff } },
	})
	assert.equal((await handler.POST(request({}, { email: 'owner@example.test', role: 'superadmin', sanityUser: { id: 'forged' } }))).status, 200)
	assert.equal(provisioned, 1)
	assert.equal(calls.issued, 1)
})

test('Sanity session is revoked on staff unlink/disable/role/password changes and authentication-mode or project change', async () => {
	const environment = { NEXT_PUBLIC_ADMIN_AUTH_MODE: 'sanity', NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, ADMIN_JWT_SECRET: 'synthetic-session-key-at-least-32-bytes' }
	const user = { id: 'staff-1', email: 'staff@example.test', full_name: 'Staff', role: 'sales', status: 'active', created_at: '2026-01-01', password_hash: 'sanity-only:random-marker', sanity_user_id: userId }
	const auth = load('src/lib/admin-auth.ts', { './d1': { adminUsersDb: { getById: async () => user } }, 'next/headers': {} }, { process: { env: environment } })
	await assert.rejects(auth.createAdminSessionToken({ id: user.id }))
	const token = await auth.createAdminSessionToken({ id: user.id }, 28800, { userId, projectId })
	assert.equal((await auth.verifyAdminSessionToken(token)).role, 'sales')
	const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'))
	assert.equal(claims.exp - claims.iat, 3600)
	for (const [field, value] of [['sanity_user_id', 'other'], ['status', 'inactive'], ['role', 'admin'], ['password_hash', 'changed']]) {
		const original = user[field]; user[field] = value
		assert.equal(await auth.verifyAdminSessionToken(token), null)
		user[field] = original
	}
	environment.NEXT_PUBLIC_SANITY_PROJECT_ID = 'other'; assert.equal(await auth.verifyAdminSessionToken(token), null)
	environment.NEXT_PUBLIC_SANITY_PROJECT_ID = projectId
	environment.NEXT_PUBLIC_ADMIN_AUTH_MODE = 'password'; assert.equal(await auth.verifyAdminSessionToken(token), null)
})

test('Sanity staff creation needs only email and role, without invitation, bcrypt or client identity', async () => {
	let saved
	const handler = load('src/app/(frontend)/api/admin/users/route.ts', {
		'next/server': next,
		'@/lib/admin-auth': { requireAdminSession: async () => ({ ok: true, session: { id: 'owner', role: 'superadmin' } }) },
		'@/lib/admin-auth-mode': { getAdminAuthMode: () => 'sanity', validSanityUserId: id => id === userId },
		'@/lib/passwords': { hashPassword: () => { throw new Error('No bcrypt allowed') } },
		'@/lib/d1': { adminUsersDb: { getByEmail: async () => null, getBySanityId: async () => null, create: async value => { saved = value; return value } } },
	})
	const response = await handler.POST(new Request('https://test/api', { method: 'POST', body: JSON.stringify({ email: 'staff@example.test', role: 'sales', sanity_user_id: 'client-id-must-be-ignored' }) }))
	assert.equal(response.status, 200)
	assert.equal(saved.sanity_user_id, undefined)
	assert.equal(saved.full_name, 'staff@example.test')
	assert.equal(response.headers.get('cache-control'), 'no-store')
	assert.match(saved.password_hash, /^sanity-only:/)
	const result = await response.json()
	assert.equal(result.user.password_hash, undefined)
	assert.equal(result.invitation, undefined)
})

test('Real SQLite migration enforces one-to-one identities; offline bootstrap and linking preserve staff authority', (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deanflow-sanity-link-'))
	t.after(() => fs.rmSync(root, { recursive: true, force: true }))
	fs.mkdirSync(path.join(root, 'scripts'))
	for (const script of ['prepare-first-admin.py', 'link-sanity-admin.py']) fs.copyFileSync(`scripts/${script}`, path.join(root, 'scripts', script))
	const migrations = fs.readdirSync('migrations').filter(name => name.endsWith('.sql')).sort().map(name => fs.readFileSync(`migrations/${name}`, 'utf8')).join('\n')
	const code = `import sys,sqlite3,runpy,json,os
from unittest.mock import patch
root=sys.argv[1]; c=sqlite3.connect(':memory:'); c.executescript(sys.stdin.read())
sys.argv=['prepare-first-admin.py','--sanity']
with patch('builtins.input',side_effect=['owner@example.test',"Owner's account"]):runpy.run_path(root+'/scripts/prepare-first-admin.py',run_name='__main__')
c.executescript(open(root+'/backups/first-admin.sql').read())
assert c.execute('SELECT role,sanity_user_id FROM admin_users').fetchone()==('superadmin',None)
c.execute("UPDATE admin_users SET sanity_user_id='pOwner123' WHERE id='admin-root'")
# Re-running bootstrap must not create or overwrite another root.
c.executescript(open(root+'/backups/first-admin.sql').read())
assert c.execute('SELECT count(*) FROM admin_users').fetchone()==(1,)
c.execute("INSERT INTO admin_users(id,email,password_hash,full_name,role) VALUES('sales','sales@example.test','marker','Sales','sales')")
with patch('builtins.input',side_effect=['sales@example.test','pSales123']):runpy.run_path(root+'/scripts/link-sanity-admin.py',run_name='__main__')
c.executescript(open(root+'/backups/link-sanity-admin.sql').read())
assert c.execute("SELECT role,sanity_user_id FROM admin_users WHERE id='sales'").fetchone()==('sales','pSales123')
try:
 c.execute("UPDATE admin_users SET sanity_user_id='pOwner123' WHERE id='sales'");raise AssertionError('duplicate accepted')
except sqlite3.IntegrityError:pass
assert os.stat(root+'/backups/first-admin.sql').st_mode & 0o777 == 0o600
print('SQLITE_PASS')`
	const output = execFileSync('python3', ['-c', code, root], { input: migrations, encoding: 'utf8' })
	assert.match(output, /SQLITE_PASS/)
})
