const test = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')
const { execFileSync } = require('node:child_process')
const { hashPassword } = require('../shared/password-hash.mjs')

async function fixture() {
 const password = 'Admin-test-password-2026'
 let user = { id: 'staff-1', email: 'admin@example.test', full_name: 'Admin', role: 'superadmin', status: 'active', created_at: '2026-01-01', password_hash: await hashPassword(password) }
 const writes = []
 let limited = false
 let mode = 'password'
 const env = { NODE_ENV: 'production', ADMIN_JWT_SECRET: 'test-only-secret-32-characters-long-enough', NEXT_PUBLIC_ADMIN_AUTH_MODE: 'password' }
 const authMode = { getAdminAuthMode: () => mode }
 const db = { adminUsersDb: { getByEmail: async email => email === user?.email ? user : null, getById: async () => user, update: async () => true } }
 const cookieStore = { set: (...args) => writes.push(args) }
 const auth = load('src/lib/admin-auth.ts', { './d1': db, './admin-auth-mode': authMode, 'next/headers': {} }, { process: { env } })
 const passwords = load('src/lib/passwords.ts', { './cf-env': { getEnvVarSync: () => undefined } })
 const route = load('src/app/(frontend)/api/admin/auth/login/route.ts', {
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  'next/headers': { cookies: async () => cookieStore },
  '@/lib/admin-auth-mode': authMode, '@/lib/admin-auth': auth,
  '@/lib/d1': db, '@/lib/passwords': passwords,
  '@/lib/rate-limit': { takeRateLimit: async () => !limited },
 }, { process: { env } })
 const request = (body = { email: ' Admin@Example.Test ', password }, headers = {}) => new Request('https://site.test/api/admin/auth/login', {
  method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://site.test', ...headers }, body: JSON.stringify(body),
 })
 return { route, request, writes, auth, password, get user() { return user }, setLimited: value => { limited = value }, setMode: value => { mode = value } }
}

test('D1 email/password login verifies native scrypt and returns a protected eight-hour session without leaking the hash', async () => {
 const f = await fixture()
 const response = await f.route.POST(f.request())
 assert.equal(response.status, 200)
 assert.equal(response.headers.get('cache-control'), 'no-store')
 const body = await response.json()
 assert.equal(body.user.email, 'admin@example.test')
 assert.equal(body.user.password_hash, undefined)
 assert.equal(f.writes.length, 1)
 const [name, token, options] = f.writes[0]
 assert.equal(name, 'deanflow_admin_session')
 assert.equal(options.httpOnly, true)
 assert.equal(options.secure, true)
 assert.equal(options.sameSite, 'lax')
 assert.equal(options.maxAge, 28800)
 assert.equal((await f.auth.verifyAdminSessionToken(token)).role, 'superadmin')
 f.user.password_hash = await hashPassword('replacement-password-2026')
 assert.equal(await f.auth.verifyAdminSessionToken(token), null)
})

test('Login rejects incorrect/unknown/inactive accounts, invalid bodies, cross-origin requests and rate limits without issuing cookies', async () => {
 const f = await fixture()
 for (const body of [{ email: 'admin@example.test', password: 'wrong' }, { email: 'missing@example.test', password: f.password }]) {
  const response = await f.route.POST(f.request(body))
  assert.equal(response.status, 401)
  assert.equal((await response.json()).error, 'Invalid credentials')
 }
 f.user.status = 'inactive'
 assert.equal((await f.route.POST(f.request())).status, 401)
 f.user.status = 'active'
 for (const body of [null, {}, { email: 'not-email', password: f.password }, { email: 'admin@example.test', password: 'x'.repeat(73) }])
  assert.equal((await f.route.POST(f.request(body))).status, 400)
 assert.equal((await f.route.POST(f.request(undefined, { origin: 'https://evil.test' }))).status, 403)
 f.setLimited(true)
 const limited = await f.route.POST(f.request())
 assert.equal(limited.status, 429)
 assert.equal(limited.headers.get('retry-after'), '900')
 f.setMode('sanity')
 assert.equal((await f.route.POST(f.request())).status, 403)
 assert.equal(f.writes.length, 0)
})

test('Offline password reset SQL targets only an existing active email and preserves its role and identity', async () => {
 const hash = await hashPassword('replacement-password-2026')
 const code = `
import sys, tempfile, pathlib, shutil, runpy, sqlite3, types, os
from unittest.mock import patch
source=pathlib.Path.cwd()/'scripts'/'prepare-first-admin.py'
expected_hash=sys.argv[1]
with tempfile.TemporaryDirectory() as directory:
 root=pathlib.Path(directory);(root/'scripts').mkdir();target=root/'scripts'/'prepare-first-admin.py';shutil.copy(source,target)
 with patch('sys.argv',[str(target),'--reset-password']),patch('builtins.input',return_value=' ADMIN@EXAMPLE.TEST '),patch('getpass.getpass',return_value='replacement-password-2026'),patch('subprocess.run',return_value=types.SimpleNamespace(returncode=0,stdout=expected_hash)):
  runpy.run_path(str(target),run_name='__main__')
 sql=(root/'backups'/'reset-admin-password.sql').read_text()
 assert 'replacement-password-2026' not in sql
 assert (os.stat(root/'backups'/'reset-admin-password.sql').st_mode & 0o777)==0o600
 c=sqlite3.connect(':memory:')
 c.execute('CREATE TABLE admin_users(email TEXT,password_hash TEXT,role TEXT,status TEXT,sanity_user_id TEXT,updated_at TEXT)')
 c.execute("INSERT INTO admin_users VALUES('admin@example.test','old','superadmin','active','linked-id',NULL)")
 c.executescript(sql)
 assert c.execute('SELECT password_hash,role,sanity_user_id FROM admin_users').fetchone()==(expected_hash,'superadmin','linked-id')
 c.execute("UPDATE admin_users SET status='inactive',password_hash='disabled'")
 c.executescript(sql)
 assert c.execute('SELECT password_hash FROM admin_users').fetchone()[0]=='disabled'
 c.execute('DELETE FROM admin_users');c.executescript(sql)
 assert c.execute('SELECT count(*) FROM admin_users').fetchone()[0]==0
print('reset SQL verified')
`
 assert.match(execFileSync('python3', ['-c', code, hash], { encoding: 'utf8' }), /reset SQL verified/)
})

test('Admin can reset staff password via PUT /api/admin/users and only the four valid roles are accepted', async () => {
 const { verifyPassword } = require('../shared/password-hash.mjs')
 const initialHash = await hashPassword('Initial-Password-2026')
 const staff = {
  id: 'staff-sale-1',
  email: 'sale@example.test',
  full_name: 'Sale Rep',
  role: 'sales',
  status: 'active',
  created_at: '2026-01-01',
  password_hash: initialHash,
 }
 let actor = { id: 'adm-1', email: 'adm@example.test', name: 'Manager', role: 'admin', createdAt: '2026-01-01' }
 const passwords = load('src/lib/passwords.ts', { './cf-env': { getEnvVarSync: () => undefined } })
 const usersRoute = load('src/app/(frontend)/api/admin/users/route.ts', {
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  '@/lib/passwords': passwords,
  '@/lib/admin-auth-mode': { getAdminAuthMode: () => 'password', validSanityUserId: () => true },
  '@/lib/admin-auth': { requireAdminSession: async (roles) => roles?.length && !roles.includes(actor.role) ? { ok: false, error: 'Forbidden', status: 403 } : { ok: true, session: actor } },
  '@/lib/d1': {
   PersistenceError: class PersistenceError extends Error {},
   d1Query: async () => ({ results: [], meta: { changes: 0 } }),
   adminUsersDb: {
    getById: async (id) => id === staff.id ? staff : null,
    getByEmail: async () => null,
    update: async (id, patch) => {
     if (id !== staff.id) return false
     Object.assign(staff, patch)
     return true
    },
   },
  },
 })

 const rejectedRole = await usersRoute.POST(new Request('https://site.test/api/admin/users', {
  method: 'POST',
  body: JSON.stringify({ email: 'legacy@example.test', full_name: 'Legacy', password: 'Valid-Password-2026', role: 'cskh' }),
 }))
 assert.equal(rejectedRole.status, 400)

 const shortReset = await usersRoute.PUT(new Request('https://site.test/api/admin/users', {
  method: 'PUT',
  body: JSON.stringify({ id: staff.id, password: 'short' }),
 }))
 assert.equal(shortReset.status, 400)
 assert.equal(staff.password_hash, initialHash)

 const okReset = await usersRoute.PUT(new Request('https://site.test/api/admin/users', {
  method: 'PUT',
  body: JSON.stringify({ id: staff.id, password: 'Reset-Password-2026' }),
 }))
 assert.equal(okReset.status, 200)
 assert.notEqual(staff.password_hash, initialHash)
 assert.equal(await verifyPassword('Reset-Password-2026', staff.password_hash), true)
 assert.equal(await verifyPassword('Initial-Password-2026', staff.password_hash), false)
})
