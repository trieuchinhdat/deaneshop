const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { webcrypto } = require('node:crypto')
const { load } = require('./load-ts.cjs')

const nextMock = {
	NextResponse: { json: (body, init) => Response.json(body, init) },
}
function database(t) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deanflow-release-'))
	t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
	const file = path.join(dir, 'test.sqlite')
	const run = (sql, params = [], script = false) =>
		JSON.parse(
			execFileSync(
				'python3',
				[
					'-c',
					`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]);c.row_factory=sqlite3.Row
if sys.argv[4]=='true':
 c.executescript(sys.argv[2]);rows=[]
else:
 rows=[dict(r) for r in c.execute(sys.argv[2],json.loads(sys.argv[3])).fetchall()]
changes=c.execute('SELECT changes()').fetchone()[0]
c.commit();c.close();print(json.dumps({'success':True,'results':rows,'meta':{'changes':changes}}))`,
					file,
					sql,
					JSON.stringify(params),
					String(script),
				],
				{ encoding: 'utf8' },
			),
		)
	run(
		fs
			.readdirSync('migrations')
			.filter((n) => n.endsWith('.sql'))
			.sort()
			.map((n) => fs.readFileSync(path.join('migrations', n), 'utf8'))
			.join('\n'),
		[],
		true,
	)
	const binding = {
		prepare: (sql) => ({
			all: async () => run(sql),
			bind: (...args) => ({ all: async () => run(sql, args) }),
		}),
	}
	const repo = load(
		'src/lib/d1.ts',
		{},
		{ DB: binding, console: { error() {} } },
	)
	return { run, repo }
}

test('analytics executes on migrated SQLite, scopes staff, and counts old follow-ups beyond the first page', async (t) => {
	const { run, repo } = database(t)
	for (let i = 0; i < 32; i++) {
		run(
			'INSERT INTO leads(id,name,source,status,assigned_to,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
			[
				`l${i}`,
				'Buyer',
				'product_quote_request',
				'new',
				'sales-a',
				i === 0 ? new Date().toISOString() : '2020-01-01 12:00:00',
				new Date().toISOString(),
			],
		)
		run(
			"INSERT INTO lead_assessments(lead_id,qualification,priority,follow_up_at,next_action,reason,updated_at,updated_by) VALUES(?,'qualified','high','2020-02-01T00:00:00.000Z','Call','Relevant','2020-01-01','admin')",
			[`l${i}`],
		)
	}
	run(
		"INSERT INTO leads(id,name,assigned_to,created_at) VALUES('other','Other','sales-b','2020-01-01')",
	)
	const handler = load('src/app/(frontend)/api/admin/intelligence/route.ts', {
		'next/server': nextMock,
		'@/lib/admin-auth': {
			requireAdminSession: async () => ({
				ok: true,
				session: { id: 'sales-a', role: 'sales' },
			}),
		},
		'@/lib/d1': { ...repo, adminUsersDb: { list: async () => [] } },
	})
	const res = await handler.GET(
		new Request('https://test/api?view=analytics&dateRange=today'),
	)
	assert.equal(res.status, 200)
	const data = await res.json()
	assert.equal(
		data.trends.reduce((n, row) => n + row.total, 0),
		1,
	)
	assert.equal(data.priorities[0].count, 1)
	assert.deepEqual(data.followups, { total: 32, overdue: 32 })
	const followups = await (
		await handler.GET(
			new Request('https://test/api?filter=followups&dateRange=today'),
		)
	).json()
	assert.equal(followups.total, 32)
	assert.equal(followups.items.length, 25)
	for (const filter of ['assessed', 'qualified', 'won', 'contacted']) {
		const response = await handler.GET(
			new Request(`https://test/api?filter=${filter}`),
		)
		assert.equal(response.status, 200)
		const filtered = await response.json()
		assert.equal(filtered.total, ['won', 'contacted'].includes(filter) ? 0 : 32)
	}
})

test('UTC date windows handle month/year boundaries and both SQLite and ISO timestamp formats', (t) => {
	const { run } = database(t)
	const { leadDateWindow } = load('src/lib/lead-intelligence.ts')
	const now = new Date('2026-01-01T00:30:00Z')
	const yesterday = leadDateWindow('yesterday', now)
	assert.equal(yesterday.start, '2025-12-31T00:00:00.000Z')
	assert.equal(yesterday.end, '2026-01-01T00:00:00.000Z')
	assert.equal(leadDateWindow('7d', now).start, '2025-12-26T00:00:00.000Z')
	assert.equal(leadDateWindow('month', now).start, '2026-01-01T00:00:00.000Z')
	for (const [timestamp, included] of [
		['2025-12-31T23:59:59.999Z', 1],
		['2025-12-31 00:00:00', 1],
		['2026-01-01T00:00:00.000Z', 0],
		['2025-12-30T23:59:59.999Z', 0],
	]) {
		assert.equal(
			run(
				'SELECT julianday(?) >= julianday(?) AND julianday(?) < julianday(?) AS included',
				[timestamp, yesterday.start, timestamp, yesterday.end],
			).results[0].included,
			included,
		)
	}
})

test('lead retry uses one committed response and one complete dossier job, and rejects changed requirements', async (t) => {
	const { repo, run } = database(t)
	let limits = 0
	const handler = load(
		'src/app/(frontend)/api/leads/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/lib/rate-limit': {
				takeRateLimit: async () => {
					limits++
					return true
				},
			},
			'@/lib/admin-events': { broadcastAdminEvent() {} },
			'@/lib/cf-env': { scheduleBackgroundTask() {} },
			'@/lib/outbox': { drainOutbox: async () => {} },
			'@/lib/compliance-assets': {
				lookupPublishedComplianceAsset: async () => ({
					assetId: 'asset-1',
					downloadUrl: 'https://cdn.sanity.io/files/p/d/spec.pdf',
					title: 'Specification',
					category: 'Technical',
					fileSize: '1 MB',
				}),
			},
			'@/sanity/lib/client': {
				client: { fetch: async () => ({ siteName: 'Test' }) },
			},
		},
		{ console: { error() {} } },
	)
	const payload = {
		name: 'Buyer',
		email: 'buyer@example.test',
		source: 'compliance_vault_gated',
		assetId: 'asset-1',
		message: 'Requirements',
		dossierConsent: true,
	}
	const send = (body) =>
		handler.POST(
			new Request('https://test/api/leads', {
				method: 'POST',
				headers: { 'Idempotency-Key': 'submission-command-0001' },
				body: JSON.stringify(body),
			}),
		)
	const [a, b] = await Promise.all([send(payload), send(payload)])
	assert.equal(a.status, 200)
	assert.equal(b.status, 200)
	const first = await a.json()
	assert.deepEqual(await b.json(), first)
	const rateCalls = limits
	for (let i = 0; i < 12; i++)
		assert.deepEqual(
			await (await send({ ...payload, journey_json: [] })).json(),
			first,
		)
	assert.equal(limits, rateCalls)
	assert.equal(run('SELECT COUNT(*) AS n FROM leads').results[0].n, 1)
	assert.equal(run('SELECT COUNT(*) AS n FROM outbox').results[0].n, 2)
	const job = run("SELECT payload FROM outbox WHERE event_type='lead.dossier'")
		.results[0]
	assert.equal(JSON.parse(job.payload).downloadUrl, first.downloadUrl)
	assert.equal(JSON.parse(job.payload).documentTitle, 'Specification')
	assert.equal(
		(await send({ ...payload, message: 'Different requirements' })).status,
		409,
	)
})

test('submission key survives reload and changing journey, and retires only after confirmation', async () => {
	const storage = new Map()
	const globals = {
		crypto: webcrypto,
		sessionStorage: {
			getItem: (k) => storage.get(k),
			setItem: (k, v) => storage.set(k, v),
			removeItem: (k) => storage.delete(k),
		},
	}
	const helper = load('src/lib/lead-submission.ts', {}, globals)
	const payload = {
		email: 'buyer@test.com',
		message: '100 units',
		journey_json: [],
	}
	const first = await helper.leadSubmissionKey(payload)
	const reloaded = load('src/lib/lead-submission.ts', {}, globals)
	assert.equal(
		await reloaded.leadSubmissionKey({
			...payload,
			journey_json: [{ path: '/new' }],
		}),
		first,
	)
	assert.notEqual(
		await helper.leadSubmissionKey({ ...payload, message: '200 units' }),
		first,
	)
	await helper.retireLeadSubmission(payload)
	assert.notEqual(await helper.leadSubmissionKey(payload), first)
})

test('outbox never sends after envelope write failure or lease loss, and reuses persisted body after a lost provider response', async () => {
	for (const failure of ['throw', 'lease', 'provider']) {
		let envelope = null,
			sent = [],
			attempts = 0
		const repo = {
			ordersDb: {
				getById: async () => ({
					id: 'order',
					customer_email: 'buyer@test.com',
					customer_name: attempts > 1 ? 'Changed buyer' : 'Buyer',
					order_number: 'ORD-1',
				}),
			},
			d1Query: async (sql, args) => {
				if (sql.includes('RETURNING id, payload'))
					return {
						results: [
							{
								id: 'email:order',
								payload: '{"orderId":"order"}',
								attempts: ++attempts,
								event_type: 'order.email',
								delivery_envelope: envelope,
							},
						],
					}
				if (sql.includes('SET delivery_envelope')) {
					if (failure === 'throw') throw new Error('DB write failed')
					if (failure === 'lease') return { results: [], meta: { changes: 0 } }
					envelope = args[0]
				}
				return { results: [], meta: { changes: 1 } }
			},
		}
		const box = load(
			'src/lib/outbox.ts',
			{ './d1': repo },
			{
				process: {
					env: { RESEND_API_KEY: 'test', RESEND_FROM_EMAIL: 'orders@test.com' },
				},
				fetch: async (_url, options) => {
					sent.push(options)
					if (sent.length === 1)
						throw new Error('Provider accepted but response was lost')
					return Response.json({ id: 'msg-1' })
				},
			},
		)
		assert.equal((await box.processOutbox()).status, 'failed')
		if (failure === 'provider') {
			assert.equal((await box.processOutbox()).status, 'sent')
			assert.equal(sent[0].body, sent[1].body)
			assert.equal(
				sent[0].headers['Idempotency-Key'],
				sent[1].headers['Idempotency-Key'],
			)
		} else assert.equal(sent.length, 0)
	}
})

test('legacy dossier job resolves published metadata before sending and does not send an unavailable asset', async () => {
	for (const available of [true, false]) {
		let sends = 0,
			html = ''
		const box = load(
			'src/lib/outbox.ts',
			{
				'./d1': {
					leadsDb: {
						getById: async () => ({
							email: 'buyer@test.com',
							name: 'Buyer',
							dossier_asset_id: 'asset-1',
						}),
					},
					d1Query: async (sql) =>
						sql.includes('RETURNING id, payload')
							? {
									results: [
										{
											id: 'dossier:1',
											payload: '{"leadId":"lead","assetId":"asset-1"}',
											attempts: 1,
											event_type: 'lead.dossier',
										},
									],
								}
							: { results: [], meta: { changes: 1 } },
				},
				'./compliance-assets': {
					lookupPublishedComplianceAsset: async () =>
						available
							? {
									title: 'Published specification',
									downloadUrl: 'https://cdn.sanity.io/files/p/d/spec.pdf',
								}
							: null,
				},
			},
			{
				process: {
					env: { RESEND_API_KEY: 'test', RESEND_FROM_EMAIL: 'sales@test.com' },
				},
				fetch: async (_url, options) => {
					sends++
					html = JSON.parse(options.body).html
					return Response.json({ id: 'msg-2' })
				},
			},
		)
		assert.equal(
			(await box.processOutbox()).status,
			available ? 'sent' : 'failed',
		)
		assert.equal(sends, available ? 1 : 0)
		if (available) assert.match(html, /spec\.pdf/)
	}
})

test('newsletter saves consent evidence and public health detects missing RFQ triggers', async (t) => {
	const { repo, run } = database(t)
	const popup = load('src/app/(frontend)/api/popup/lead/route.ts', {
		'next/server': nextMock,
		'@/lib/d1': repo,
		'@/lib/rate-limit': { takeRateLimit: async () => true },
		'@/lib/admin-events': { broadcastAdminEvent() {} },
		'@/lib/cf-env': { scheduleBackgroundTask() {} },
	})
	const res = await popup.POST(
		new Request('https://test/api/popup/lead', {
			method: 'POST',
			body: JSON.stringify({
				email: 'subscriber@test.com',
				source: 'newsletter',
				consent: true,
				consentText: 'Receive product updates',
			}),
		}),
	)
	assert.equal(res.status, 200)
	const consent = JSON.parse(
		run('SELECT consent_json FROM leads').results[0].consent_json,
	)
	assert.equal(consent.marketing, true)
	assert.equal(consent.consentText, 'Receive product updates')
	assert.ok(consent.capturedAt && consent.policyVersion)
	const health = load('src/app/(frontend)/api/health/route.ts', {
		'next/server': nextMock,
		'@/lib/d1': { ...repo, getD1RuntimeMode: async () => 'binding' },
	})
	assert.equal((await health.GET()).status, 200)
	run('DROP TRIGGER wholesale_rfq_to_lead')
	assert.equal((await health.GET()).status, 503)
})

test('security overrides preserve YAML v3, TOML, selector and glob APIs used by build tools', async () => {
	assert.equal(
		require('js-yaml').safeLoad('site: production').site,
		'production',
	)
	assert.equal(
		require('smol-toml').parse('site = "production"').site,
		'production',
	)
	assert.equal(
		require('postcss-selector-parser')().astSync('a:hover').toString(),
		'a:hover',
	)
	const files = await require('glob').glob('migrations/*.sql')
	assert.ok(
		files.some((file) =>
			file.endsWith('0010_lead_delivery_and_submissions.sql'),
		),
	)
	assert.equal(require('minimatch').minimatch('test.ts', '*.ts'), true)
})
