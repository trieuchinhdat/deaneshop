const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { load } = require('./load-ts.cjs')

test('Real SQLite provisions sales, preserves assigned roles, blocks disabled/conflicting accounts and repeated-login duplicates', async t => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sanity-staff-access-'))
	t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
	const database = path.join(directory, 'test.sqlite')
	const migrations = fs.readdirSync('migrations').filter(f => f.endsWith('.sql')).sort().map(f => fs.readFileSync(`migrations/${f}`, 'utf8')).join('\n')
	execFileSync('python3', ['-c', `import sqlite3,sys
c=sqlite3.connect(sys.argv[1]);c.executescript(sys.stdin.read());c.commit()`, database], { input: migrations })
	async function query(sql, parameters = []) {
		return JSON.parse(execFileSync('python3', ['-c', `import sqlite3,sys,json
c=sqlite3.connect(sys.argv[1]);c.row_factory=sqlite3.Row
q=json.load(sys.stdin);r=c.execute(q['sql'],q['parameters']);rows=[dict(row) for row in r.fetchall()];changes=c.execute('SELECT changes()').fetchone()[0];c.commit()
print(json.dumps({'results':rows,'meta':{'changes':changes}}))`, database], { input: JSON.stringify({ sql, parameters }), encoding: 'utf8' }))
	}
	const getBySanityId = async id => (await query('SELECT * FROM admin_users WHERE sanity_user_id = ?', [id])).results[0] || null
	const { resolveSanityStaff } = load('src/lib/sanity-staff-access.ts', { './d1': { d1Query: query, adminUsersDb: { getBySanityId } } })
	const identity = { userId: 'human-1', projectId: 'project1', email: 'NEW@Example.test' }
	assert.equal(await resolveSanityStaff({ ...identity, email: null }), null)
	const sales = await resolveSanityStaff(identity)
	assert.equal(sales.role, 'sales')
	assert.equal(sales.status, 'active')
	assert.equal(sales.email, 'new@example.test')
	assert.equal(sales.sanity_user_id, identity.userId)
	assert.match(sales.password_hash, /^sanity-only:/)
	assert.equal((await resolveSanityStaff(identity)).id, sales.id)
	assert.equal((await query('SELECT count(*) AS count FROM admin_users')).results[0].count, 1)
	await query("INSERT INTO admin_users(id,email,password_hash,full_name,role,status) VALUES('approved','admin@example.test','preserve-marker','Admin','admin','active')")
	const admin = await resolveSanityStaff({ ...identity, userId: 'approved-id', email: 'admin@example.test' })
	assert.equal(admin.role, 'admin')
	assert.equal(admin.password_hash, 'preserve-marker')
	assert.equal(admin.id, 'approved')
	assert.equal(await resolveSanityStaff({ ...identity, userId: 'different-human', email: 'admin@example.test' }), null)
	await query("INSERT INTO admin_users(id,email,password_hash,full_name,role,status) VALUES('disabled','disabled@example.test','marker','Disabled','sales','inactive')")
	assert.equal(await resolveSanityStaff({ ...identity, userId: 'disabled-id', email: 'disabled@example.test' }), null)
	await query("UPDATE admin_users SET status='inactive' WHERE id=?", [sales.id])
	assert.equal((await resolveSanityStaff(identity)).status, 'inactive')
	assert.equal((await query('SELECT count(*) AS count FROM admin_users')).results[0].count, 3)
	// First superadmin can be set up by an operator even after automatic sales provisioning.
	fs.mkdirSync(path.join(directory, 'scripts'))
	fs.copyFileSync('scripts/prepare-first-admin.py', path.join(directory, 'scripts/prepare-first-admin.py'))
	execFileSync('python3', ['-c', `import runpy,sys
from unittest.mock import patch
root=sys.argv[1];sys.argv=['prepare-first-admin.py','--sanity']
with patch('builtins.input',side_effect=['admin@example.test','Owner']):runpy.run_path(root+'/scripts/prepare-first-admin.py',run_name='__main__')`, directory])
	const bootstrap = fs.readFileSync(path.join(directory, 'backups/first-admin.sql'), 'utf8')
	execFileSync('python3', ['-c', `import sqlite3,sys
c=sqlite3.connect(sys.argv[1]);c.executescript(sys.stdin.read())`, database], { input: bootstrap })
	const owner = await getBySanityId('approved-id')
	assert.equal(owner.role, 'superadmin')
	assert.equal(owner.password_hash, 'preserve-marker')
	assert.equal(owner.id, 'approved')
})
