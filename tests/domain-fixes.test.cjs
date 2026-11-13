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

async function setupDb(t, prefix = 'df-domain-') {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
	t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
	const dbFile = path.join(dir, 'db.sqlite')
	await applyAllMigrations(dbFile)
	const sqlite = createSqliteBinding(dbFile)
	const repo = load('src/lib/d1.ts', {}, { console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding })
	return { sqlite, repo, dbFile }
}

const nextMock = { NextResponse: { json: (data, init) => Response.json(data, init) } }

test('DF-001..DF-005: D2C/RFQ separation, ledger payment invariants, quote draft revision, and optimistic concurrency', async (t) => {
	const { sqlite, repo } = await setupDb(t)
	const adminSession = { id: 'adm-1', role: 'superadmin', name: 'Root Admin', email: 'admin@test.com' }
	const cskhSession = { id: 'cs-1', role: 'cskh', name: 'Support Agent', email: 'cs@test.com' }

	await repo.ordersDb.create({
		id: 'ord-d2c',
		order_number: 'ORD-1001',
		order_intent: 'direct',
		customer_name: 'Alice',
		customer_email: 'alice@example.com',
		shipping_country: 'US',
		shipping_address: '100 Main St',
		items_json: JSON.stringify([{ productId: 'p1', title: 'Widget', quantity: 2, price: 25 }]),
		subtotal: 50,
		discount: 0,
		shipping_fee: 10,
		total: 60,
		currency: 'USD',
		payment_method: 'cod',
		payment_status: 'unpaid',
		fulfillment_status: 'pending',
		quote_status: null,
	})

	await repo.ordersDb.create({
		id: 'ord-rfq',
		order_number: 'RFQ-2001',
		order_intent: 'wholesale_rfq',
		customer_name: 'Acme Buyer',
		customer_email: 'buyer@acme.com',
		shipping_country: 'US',
		shipping_address: '500 Industrial Way',
		items_json: JSON.stringify([{ productId: 'p2', title: 'Industrial Valve', quantity: 100, price: 0 }]),
		subtotal: 0,
		discount: 0,
		shipping_fee: 0,
		total: 0,
		currency: 'USD',
		payment_method: 'manual',
		payment_status: 'unpaid',
		fulfillment_status: 'pending',
		quote_status: 'pending',
	})

	const makeUpdateRoute = (session) =>
		load(
			'src/app/(frontend)/api/orders/update-status/route.ts',
			{
				'next/server': nextMock,
				'@/lib/d1': repo,
				'@/lib/admin-auth': { requireAdminSession: async () => ({ ok: true, session }) },
			},
			{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
		)

	const updateAdmin = makeUpdateRoute(adminSession)
	const updateCskh = makeUpdateRoute(cskhSession)

	// DF-001: D2C rejects quote fields (422) & direct paymentStatus mutation (422)
	const d2cQuoteAttempt = await updateAdmin.POST(
		new Request('https://test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({ orderId: 'ord-d2c', quoteStatus: 'sent' }),
		}),
	)
	assert.equal(d2cQuoteAttempt.status, 422)

	const directPayAttempt = await updateAdmin.POST(
		new Request('https://test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({ orderId: 'ord-d2c', paymentStatus: 'paid' }),
		}),
	)
	assert.equal(directPayAttempt.status, 422)

	// DF-001: CSKH cannot mutate commercial pricing (403)
	const cskhPricingAttempt = await updateCskh.POST(
		new Request('https://test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({ orderId: 'ord-rfq', discount: 50 }),
		}),
	)
	assert.equal(cskhPricingAttempt.status, 403)

	// DF-001: SQL trigger rejects negative financials
	await assert.rejects(
		sqlite.run('UPDATE orders SET total = -5 WHERE id = ?', ['ord-d2c']),
		/Invalid order financial values/,
	)

	// DF-003: Cannot issue quote (`sent`) when line item price <= 0
	const zeroPriceQuote = await updateAdmin.POST(
		new Request('https://test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({
				orderId: 'ord-rfq',
				quoteStatus: 'sent',
				quoteValidUntil: '2099-01-01T00:00:00.000Z',
			}),
		}),
	)
	assert.equal(zeroPriceQuote.status, 422)

	// Issue priced RFQ (`sent`), server derives subtotal/total
	const issuedRes = await updateAdmin.POST(
		new Request('https://test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({
				orderId: 'ord-rfq',
				expectedVersion: 1,
				items: [{ productId: 'p2', title: 'Industrial Valve', quantity: 100, price: 15 }],
				shippingFee: 100,
				discount: 50,
				quoteStatus: 'sent',
				paymentTerms: '30% Deposit, 70% Prior to Dispatch',
				quoteValidUntil: '2099-01-01T00:00:00.000Z',
				incoterm: 'FOB',
				portOfDestination: 'Los Angeles',
				note: 'Initial formal quotation',
			}),
		}),
	)
	assert.equal(issuedRes.status, 200)
	const issuedJson = await issuedRes.json()
	assert.equal(issuedJson.order.pricing.subtotal, 1500)
	assert.equal(issuedJson.order.pricing.grandTotal, 1550)
	assert.equal(issuedJson.order.version, 2)

	// DF-005: Stale expectedVersion returns 409 conflict
	const staleRes = await updateAdmin.POST(
		new Request('https://test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({ orderId: 'ord-rfq', expectedVersion: 1, trackingCode: 'TRACK-OLD' }),
		}),
	)
	assert.equal(staleRes.status, 409)

	// DF-004: Locked issued terms cannot be modified even on quote_valid_until directly in SQL
	await assert.rejects(
		sqlite.run('UPDATE orders SET quote_valid_until = ? WHERE id = ?', ['2099-06-01T00:00:00.000Z', 'ord-rfq']),
		/Move an unapproved quote to draft/,
	)

	// DF-004: Move back to draft to revise, then re-issue
	const moveDraftRes = await updateAdmin.POST(
		new Request('https://test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({ orderId: 'ord-rfq', expectedVersion: 2, quoteStatus: 'draft' }),
		}),
	)
	assert.equal(moveDraftRes.status, 200)

	const reIssueRes = await updateAdmin.POST(
		new Request('https://test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({
				orderId: 'ord-rfq',
				expectedVersion: 3,
				items: [{ productId: 'p2', title: 'Industrial Valve', quantity: 100, price: 14 }],
				shippingFee: 100,
				discount: 0,
				quoteStatus: 'sent',
				quoteValidUntil: '2099-02-01T00:00:00.000Z',
			}),
		}),
	)
	assert.equal(reIssueRes.status, 200)
	assert.equal((await reIssueRes.json()).order.pricing.grandTotal, 1500)

	// DF-002: Release fulfillment blocks unpaid non-COD order before quote approval/payment
	const releaseRoute = load(
		'src/app/(frontend)/api/orders/release-fulfillment/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/lib/admin-auth': { requireAdminSession: async () => ({ ok: true, session: adminSession }) },
		},
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)
	const prematureRelease = await releaseRoute.POST(
		new Request('https://test/api/orders/release-fulfillment', {
			method: 'POST',
			body: JSON.stringify({ orderId: 'ord-rfq', expectedVersion: 4 }),
		}),
	)
	assert.equal(prematureRelease.status, 422)

	// DF-002: Accept quote + record partial payment + final payment + release
	const acceptRoute = load(
		'src/app/(frontend)/api/orders/accept-quote/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/lib/admin-auth': { requireAdminSession: async () => ({ ok: true, session: adminSession }) },
		},
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)
	const accepted = await acceptRoute.POST(
		new Request('https://test/api/orders/accept-quote', {
			method: 'POST',
			body: JSON.stringify({ orderId: 'ord-rfq', expectedVersion: 4, approvedBy: 'Buyer PO#99' }),
		}),
	)
	assert.equal(accepted.status, 200)
	assert.equal((await accepted.json()).order.quoteStatus, 'APPROVED')

	const paymentRoute = load(
		'src/app/(frontend)/api/orders/record-payment/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/lib/admin-auth': { requireAdminSession: async () => ({ ok: true, session: adminSession }) },
		},
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)

	// Partial payment $500 of $1500
	const p1 = await paymentRoute.POST(
		new Request('https://test/api/orders/record-payment', {
			method: 'POST',
			body: JSON.stringify({
				orderId: 'ord-rfq',
				expectedVersion: 5,
				amount: 500,
				method: 'bank_transfer',
				reference: 'SWIFT-001',
			}),
		}),
	)
	assert.equal(p1.status, 200)
	const p1Json = await p1.json()
	assert.equal(p1Json.order.paymentStatus, 'PARTIAL')
	assert.equal(p1Json.order.paidCents, 50000)

	// Overpayment $1100 fails (422)
	const overPay = await paymentRoute.POST(
		new Request('https://test/api/orders/record-payment', {
			method: 'POST',
			body: JSON.stringify({
				orderId: 'ord-rfq',
				expectedVersion: 6,
				amount: 1100,
				method: 'bank_transfer',
				reference: 'SWIFT-OVER',
			}),
		}),
	)
	assert.equal(overPay.status, 422)

	// Final $1000 settlement -> PAID
	const p2 = await paymentRoute.POST(
		new Request('https://test/api/orders/record-payment', {
			method: 'POST',
			body: JSON.stringify({
				orderId: 'ord-rfq',
				expectedVersion: 6,
				amount: 1000,
				method: 'bank_transfer',
				reference: 'SWIFT-002',
			}),
		}),
	)
	assert.equal(p2.status, 200)
	assert.equal((await p2.json()).order.paymentStatus, 'PAID')

	// Release to warehouse succeeds once settled
	const released = await releaseRoute.POST(
		new Request('https://test/api/orders/release-fulfillment', {
			method: 'POST',
			body: JSON.stringify({ orderId: 'ord-rfq', expectedVersion: 7, fulfillmentStatus: 'processing' }),
		}),
	)
	assert.equal(released.status, 200)
	assert.equal((await released.json()).order.fulfillmentStatus, 'PROCESSING')

	// DF-005: Bulk update reports per-ID partial results without silent full success
	const bulkRes = await updateAdmin.POST(
		new Request('https://test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({ orderIds: ['ord-d2c', 'missing-id'], fulfillmentStatus: 'confirmed' }),
		}),
	)
	assert.equal(bulkRes.status, 200)
	const bulkJson = await bulkRes.json()
	assert.equal(bulkJson.partial, true)
	assert.equal(bulkJson.updatedCount, 1)
	assert.equal(bulkJson.failedCount, 1)
	assert.deepEqual(
		bulkJson.results.map((r) => r.status),
		['updated', 'not_found'],
	)
})

test('DF-006, DF-012, DF-019: checkout validation order, price-diff 409, idempotent retry before rate-limit, and receipt token verification', async (t) => {
	const { sqlite, repo } = await setupDb(t)
	const product = {
		_id: 'p1',
		title: 'Precision Valve',
		price: 25,
		currency: 'USD',
		inStock: true,
		moq: 1,
		conversionType: 'order_request',
	}
	const sanityClient = {
		withConfig: () => ({
			fetch: async (q) => (q.includes('checkout-settings') ? { priceShipping: 10 } : [product]),
		}),
	}
	const route = load(
		'src/app/(frontend)/api/orders/create/route.ts',
		{ 'next/server': nextMock, '@/lib/d1': repo, '@/sanity/lib/client': { client: sanityClient } },
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)

	// Invalid email fails with 400
	const badEmailRes = await route.POST(
		new Request('https://test/api/orders/create', {
			method: 'POST',
			headers: { 'Idempotency-Key': 'checkout-key-00001' },
			body: JSON.stringify({
				mode: 'direct',
				name: 'Buyer',
				email: 'not-an-email',
				shippingAddress: '10 St',
				shippingCountry: 'US',
				itemsDetail: [{ productId: 'p1', quantity: 1 }],
			}),
		}),
	)
	assert.equal(badEmailRes.status, 400)

	// Stale client expectedTotal + requirePriceMatch returns 409 priceChanged
	const stalePriceRes = await route.POST(
		new Request('https://test/api/orders/create', {
			method: 'POST',
			headers: { 'Idempotency-Key': 'checkout-key-00002' },
			body: JSON.stringify({
				mode: 'direct',
				name: 'Buyer',
				email: 'buyer@example.com',
				shippingAddress: '10 St',
				shippingCountry: 'US',
				itemsDetail: [{ productId: 'p1', quantity: 2 }],
				requirePriceMatch: true,
				expectedTotal: 40,
			}),
		}),
	)
	assert.equal(stalePriceRes.status, 409)
	const stalePriceJson = await stalePriceRes.json()
	assert.equal(stalePriceJson.priceChanged, true)
	assert.equal(stalePriceJson.serverPricing.total, 60)

	// Valid submission succeeds & returns receiptToken
	const validBody = {
		mode: 'direct',
		name: 'Buyer',
		email: 'buyer@example.com',
		shippingAddress: '10 St',
		shippingCountry: 'US',
		itemsDetail: [{ productId: 'p1', quantity: 2 }],
		requirePriceMatch: true,
		expectedTotal: 60,
	}
	const okRes = await route.POST(
		new Request('https://test/api/orders/create', {
			method: 'POST',
			headers: { 'Idempotency-Key': 'checkout-key-00003', 'cf-connecting-ip': '203.0.113.5' },
			body: JSON.stringify(validBody),
		}),
	)
	assert.equal(okRes.status, 200)
	const okJson = await okRes.json()
	assert.match(okJson.receiptToken, /^[a-f0-9]{48}$/)

	// Verify receipt token hash matches & wrong token fails
	const receiptMod = load('src/lib/order-receipt.ts')
	const stored = await repo.ordersDb.getById(okJson.id)
	assert.equal(receiptMod.verifyReceiptToken(okJson.receiptToken, stored.receipt_token_hash), true)
	assert.equal(receiptMod.verifyReceiptToken('a'.repeat(48), stored.receipt_token_hash), false)
	assert.equal(receiptMod.verifyReceiptToken(undefined, stored.receipt_token_hash), false)

	// Exhaust per-contact limit (8/hr; keys 00002 & 00003 already used 2 slots -> 00004..00009 use slots 3..8) -> next new key returns 429, while prior idempotency key STILL returns 200
	for (let i = 4; i <= 9; i++) {
		const res = await route.POST(
			new Request('https://test/api/orders/create', {
				method: 'POST',
				headers: { 'Idempotency-Key': `checkout-key-000${String(i).padStart(2, '0')}` },
				body: JSON.stringify(validBody),
			}),
		)
		assert.equal(res.status, 200)
	}
	const rateLimitedNew = await route.POST(
		new Request('https://test/api/orders/create', {
			method: 'POST',
			headers: { 'Idempotency-Key': 'checkout-key-rate-9999' },
			body: JSON.stringify(validBody),
		}),
	)
	assert.equal(rateLimitedNew.status, 429)

	// Replay original key bypasses rate limit cleanly
	const replayRes = await route.POST(
		new Request('https://test/api/orders/create', {
			method: 'POST',
			headers: { 'Idempotency-Key': 'checkout-key-00003' },
			body: JSON.stringify(validBody),
		}),
	)
	assert.equal(replayRes.status, 200)
	assert.equal((await replayRes.json()).orderId, okJson.orderId)
})

test('DF-007, DF-016, DF-017, DF-018, DF-020, DF-021: admin pagination, CSV formula defense, last-superadmin trigger, claim race, sales import & batch idempotency', async (t) => {
	const { sqlite, repo } = await setupDb(t)
	await repo.adminUsersDb.create({
		id: 'root-1',
		email: 'root@test.com',
		password_hash: 'hash',
		full_name: 'Root Super',
		role: 'superadmin',
		status: 'active',
	})
	await repo.adminUsersDb.create({
		id: 'sales-1',
		email: 'sales1@test.com',
		password_hash: 'hash',
		full_name: 'Sales One',
		role: 'sales',
		status: 'active',
	})
	await repo.adminUsersDb.create({
		id: 'sales-2',
		email: 'sales2@test.com',
		password_hash: 'hash',
		full_name: 'Sales Two',
		role: 'sales',
		status: 'active',
	})

	// DF-016: SQLite trigger blocks demoting or deleting last active superadmin
	await assert.rejects(
		sqlite.run("UPDATE admin_users SET role = 'admin' WHERE id = 'root-1'"),
		/last active superadmin/,
	)
	await assert.rejects(
		sqlite.run("DELETE FROM admin_users WHERE id = 'root-1'"),
		/last active superadmin/,
	)

	const usersRoute = load(
		'src/app/(frontend)/api/admin/users/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/lib/admin-auth': {
				requireAdminSession: async () => ({
					ok: true,
					session: { id: 'root-1', role: 'superadmin', name: 'Root' },
				}),
			},
		},
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)
	const selfDemoteRes = await usersRoute.PUT(
		new Request('https://test/api/admin/users', {
			method: 'PUT',
			body: JSON.stringify({ id: 'root-1', role: 'admin', status: 'active' }),
		}),
	)
	assert.equal(selfDemoteRes.status, 409)

	// DF-018: Invalid lead pagination limits return 400
	const leadsRoute = load(
		'src/app/(frontend)/api/admin/leads/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/lib/admin-auth': {
				requireAdminSession: async () => ({
					ok: true,
					session: { id: 'root-1', role: 'superadmin', name: 'Root' },
				}),
			},
		},
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)
	for (const qs of ['limit=-1', 'limit=NaN', 'limit=1.5', 'offset=-2']) {
		const bad = await leadsRoute.GET(new Request(`https://test/api/admin/leads?${qs}`))
		assert.equal(bad.status, 400, `Expected 400 for ${qs}`)
	}

	// DF-020: Atomic unassigned lead claim race -> one 200, one 409
	await sqlite.run(
		`INSERT INTO leads (id, name, email, status, assigned_to, created_at, updated_at)
		 VALUES (?, ?, ?, ?, NULL, ?, ?)`,
		['lead-unassigned', 'Pool Lead', 'pool@acme.com', 'new', new Date().toISOString(), new Date().toISOString()],
	)
	const claimAs = (id) =>
		load(
			'src/app/(frontend)/api/admin/leads/claim/route.ts',
			{
				'next/server': nextMock,
				'@/lib/d1': repo,
				'@/lib/admin-auth': {
					requireAdminSession: async () => ({ ok: true, session: { id, role: 'sales', name: id } }),
				},
			},
			{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
		)
	const [c1, c2] = await Promise.all([
		claimAs('sales-1').POST(
			new Request('https://test/api/admin/leads/claim', {
				method: 'POST',
				body: JSON.stringify({ leadId: 'lead-unassigned' }),
			}),
		),
		claimAs('sales-2').POST(
			new Request('https://test/api/admin/leads/claim', {
				method: 'POST',
				body: JSON.stringify({ leadId: 'lead-unassigned' }),
			}),
		),
	])
	assert.deepEqual([c1.status, c2.status].sort(), [200, 409])

	// DF-021: Sales import blocks pool (403), forces self-ownership, deduplicates emails, and enforces importKey idempotency
	const salesImport = load(
		'src/app/(frontend)/api/admin/import/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/lib/admin-auth': {
				requireAdminSession: async () => ({ ok: true, session: { id: 'sales-1', role: 'sales', name: 'Sales One' } }),
			},
		},
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)
	const poolDenied = await salesImport.POST(
		new Request('https://test/api/admin/import', {
			method: 'POST',
			body: JSON.stringify({
				type: 'leads',
				assignmentMode: 'pool',
				records: [{ name: 'A', email: 'a@corp.com' }],
			}),
		}),
	)
	assert.equal(poolDenied.status, 403)

	const importPayload = {
		type: 'leads',
		importKey: 'batch-sales-0001-key',
		records: [
			{ name: 'Dup 1', email: 'dup@corp.com', phone: '0901234567' },
			{ name: 'Dup 2', email: 'DUP@corp.com' },
		],
	}
	const imp1 = await salesImport.POST(
		new Request('https://test/api/admin/import', {
			method: 'POST',
			body: JSON.stringify(importPayload),
		}),
	)
	assert.equal(imp1.status, 200)
	const imp1Json = await imp1.json()
	assert.equal(imp1Json.importedCount, 1)
	assert.equal(imp1Json.failedRecords.length, 1)
	assert.equal(imp1Json.assignedTo, 'sales-1')

	const impReplay = await salesImport.POST(
		new Request('https://test/api/admin/import', {
			method: 'POST',
			body: JSON.stringify(importPayload),
		}),
	)
	assert.equal(impReplay.status, 200)
	assert.equal((await impReplay.json()).idempotent, true)

	const impConflict = await salesImport.POST(
		new Request('https://test/api/admin/import', {
			method: 'POST',
			body: JSON.stringify({ ...importPayload, records: [{ name: 'Other', email: 'other@corp.com' }] }),
		}),
	)
	assert.equal(impConflict.status, 409)

	// DF-007 & DF-017: Server pagination & formula-safe RFC-4180 CSV helper
	const csv = load('src/lib/csv.ts')
	const serialized = csv.serializeCsv(
		['Name', 'Phone', 'Note'],
		[
			['=CMD("calc")', { value: '00987', preserveLeadingZero: true }, 'Hello, "world"\nline2'],
		],
	)
	assert.match(serialized, /"'=CMD\(""calc""\)"|'=CMD/)
	assert.match(serialized, /"'00987"/)
	const parsed = csv.parseCsv(serialized)
	assert.equal(parsed[1][2], 'Hello, "world"\nline2')

	const dataRoute = load(
		'src/app/(frontend)/api/admin/data/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/lib/admin-auth': {
				requireAdminSession: async () => ({
					ok: true,
					session: { id: 'root-1', role: 'superadmin', name: 'Root' },
				}),
				canAccessTab: () => true,
			},
		},
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)
	const csvRes = await dataRoute.GET(new Request('https://test/api/admin/data?resource=leads&format=csv'))
	assert.equal(csvRes.status, 200)
	assert.match(csvRes.headers.get('content-type') || '', /text\/csv/)
	assert.match(await csvRes.text(), /dup@corp\.com/)
})

test('DF-008: SSE checkpoint cursor reset', async () => {
	const sseRoute = load(
		'src/app/(frontend)/api/admin/events/route.ts',
		{
			'next/server': {},
			'@/lib/admin-auth': {
				getAdminSession: async () => ({ id: 'root', role: 'superadmin' }),
				ROLE_PERMITTED_TABS: { superadmin: ['orders', 'leads', 'reviews', 'comments'] },
			},
			'@/lib/d1': {
				d1Query: async (sql) => {
					if (sql.includes('MAX(id)')) return { results: [{ maxId: 12 }] }
					return { results: [] }
				},
			},
		},
		{ ReadableStream },
	)
	const sseRes = await sseRoute.GET({
		headers: new Headers({ 'last-event-id': '500' }),
		nextUrl: new URL('https://test/api/admin/events'),
		signal: new AbortController().signal,
	})
	const reader = sseRes.body.getReader()
	const first = await reader.read()
	await reader.cancel()
	const text = new TextDecoder().decode(first.value)
	assert.match(text, /event: checkpoint/)
	assert.match(text, /"cursor":12/)
})

test('DF-010..DF-015, DF-024, DF-025, DF-028, DF-029: quote snapshot/TTL alignment, outbox delivery envelope idempotency, lead notify/dossier triggers, and email idempotency', async (t) => {
	const { sqlite, repo } = await setupDb(t)
	await repo.ordersDb.create({
		id: 'ord-q1',
		order_number: 'RFQ-5001',
		order_intent: 'wholesale_rfq',
		customer_name: 'Buyer Co',
		customer_email: 'quote@buyerco.com',
		shipping_country: 'US',
		shipping_address: '1 Dock',
		items_json: JSON.stringify([{ title: 'Widget', quantity: 10, price: 20 }]),
		subtotal: 200,
		discount: 0,
		shipping_fee: 0,
		total: 200,
		currency: 'USD',
		payment_method: 'manual',
		payment_terms: 'Net 30',
		payment_status: 'unpaid',
		fulfillment_status: 'pending',
		quote_status: 'pending',
		quote_valid_until: '2026-12-10T00:00:00.000Z',
	})
	await repo.ordersDb.update('ord-q1', {
		quote_status: 'sent',
		quote_valid_until: '2026-12-10T00:00:00.000Z',
	})

	const accessMod = load(
		'src/lib/quote-access.ts',
		{ './d1': repo, './admin-auth': { getAdminSession: async () => null } },
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)
	const tok1 = await accessMod.issueQuoteAccess('ord-q1', { now: new Date('2026-11-10T00:00:00.000Z') })
	const row1 = (await sqlite.run('SELECT * FROM quote_access WHERE order_id = ?', ['ord-q1'])).results[0]
	assert.equal(row1.expires_at, '2026-12-10T00:00:00.000Z')

	// Superseded token is flagged after a newer quote version is issued
	await repo.ordersDb.update('ord-q1', { quote_status: 'draft' })
	await repo.ordersDb.update('ord-q1', {
		quote_status: 'sent',
		quote_valid_until: '2026-12-15T00:00:00.000Z',
	})
	const tok2 = await accessMod.issueQuoteAccess('ord-q1', { now: new Date('2026-11-11T00:00:00.000Z') })
	const checkOld = await accessMod.resolveQuoteAccess('ord-q1', tok1)
	assert.equal(checkOld.authorized, true)
	assert.equal(checkOld.isSuperseded, true)
	assert.equal(await accessMod.canAccessQuote('ord-q1', tok1), false)
	const checkNew = await accessMod.resolveQuoteAccess('ord-q1', tok2)
	assert.equal(checkNew.authorized, true)
	assert.equal(checkNew.isSuperseded, false)
	assert.equal(await accessMod.canAccessQuote('ord-q1', tok2), true)

	// DF-010 + DF-029: Atomic lead notify & published dossier asset triggers + delivery_envelope immutability on retry
	const leadsPost = load(
		'src/app/(frontend)/api/leads/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/sanity/lib/client': {
				client: {
					fetch: async () => ({ siteName: 'DeanFlow' }),
					withConfig: () => ({
						fetch: async () => [
							{
								vaults: [
									{
										gatedDocuments: [
											{
												_key: 'asset-fda-1',
												title: 'ISO 13485 Technical Dossier',
												category: 'Medical',
												fileSize: '1.2 MB',
												fileAsset: {
													asset: {
														_id: 'asset-fda-1',
														url: 'https://cdn.sanity.io/files/proj/prod/dossier.pdf',
													},
												},
											},
										],
									},
								],
							},
						],
					}),
				},
			},
			'@/lib/cf-env': { scheduleBackgroundTask: () => {} },
		},
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)
	const leadRes = await leadsPost.POST(
		new Request('https://test/api/leads', {
			method: 'POST',
			headers: { 'cf-connecting-ip': '198.51.100.2' },
			body: JSON.stringify({
				name: 'Compliance Lead',
				email: 'qa@buyerco.com',
				source: 'compliance_vault_gated',
				assetId: 'asset-fda-1',
				asset_url: 'https://evil.example/phish.exe',
				dossierConsent: true,
				consent: false,
			}),
		}),
	)
	assert.equal(leadRes.status, 200)
	const leadJson = await leadRes.json()
	const storedLead = await repo.leadsDb.getById(leadJson.leadId)
	const consent = JSON.parse(storedLead.consent_json || '{}')
	assert.equal(consent.marketing, false)
	assert.equal(consent.dossierCommunication, true)
	assert.equal(storedLead.dossier_asset_id, 'asset-fda-1')

	const dossierOutboxRow = (
		await sqlite.run("SELECT payload FROM outbox WHERE id = ?", [`lead-dossier:${leadJson.leadId}`])
	).results[0]
	const dossierPayload = JSON.parse(dossierOutboxRow.payload)
	assert.equal(dossierPayload.downloadUrl, 'https://cdn.sanity.io/files/proj/prod/dossier.pdf')
	assert.doesNotMatch(dossierOutboxRow.payload, /evil\.example/)

	// Triggers enqueued BOTH lead.notify and lead.dossier in outbox atomically
	const jobs = (
		await sqlite.run(
			"SELECT id, event_type, status FROM outbox WHERE id IN (?, ?) ORDER BY id ASC",
			[`lead-notify:${leadJson.leadId}`, `lead-dossier:${leadJson.leadId}`],
		)
	).results
	assert.deepEqual(
		jobs.map((j) => j.event_type).sort(),
		['lead.dossier', 'lead.notify'],
	)

	// DF-015 & DF-025: Lead email idempotent command + durable delivery_envelope retry parity
	const fetchCalls = []
	let resendOk = false
	const emailRoute = load(
		'src/app/(frontend)/api/admin/leads/email/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/lib/admin-auth': {
				requireAdminSession: async () => ({
					ok: true,
					session: { id: 'adm-1', role: 'superadmin', name: 'Root' },
				}),
			},
			'@/lib/cf-env': {
				getEnvVarSync: (k) =>
					k === 'RESEND_API_KEY'
						? 're_test_key'
						: k === 'RESEND_FROM_EMAIL'
							? 'hello@deanflow.com'
							: undefined,
			},
		},
		{
			console: { error() {}, warn() {}, log() {} },
			DB: sqlite.binding,
			process: { env: { RESEND_API_KEY: 're_test_key', RESEND_FROM_EMAIL: 'hello@deanflow.com' } },
			fetch: async (url, opts) => {
				fetchCalls.push({ url, opts })
				if (resendOk) return new Response(JSON.stringify({ id: 'msg_123' }), { status: 200 })
				return new Response('rate limited', { status: 503 })
			},
		},
	)

	const e1 = await emailRoute.POST(
		new Request('https://test/api/admin/leads/email', {
			method: 'POST',
			body: JSON.stringify({
				leadId: leadJson.leadId,
				toEmail: 'qa@buyerco.com',
				subject: 'Follow Up Specs',
				content: 'Original body line',
				commandId: 'cmd-outreach-0001',
			}),
		}),
	)
	assert.equal(e1.status, 502)
	const e1Json = await e1.json()
	assert.equal(e1Json.providerStatus, 'failed')
	assert.ok(e1Json.deliveryId)

	// Retry via outbox / replay commandId sends exact persisted envelope HTML & same Idempotency-Key
	resendOk = true
	await sqlite.run('UPDATE outbox SET available_at = ? WHERE id = ?', ['2020-01-01T00:00:00.000Z', e1Json.deliveryId])
	const eRetry = await emailRoute.POST(
		new Request('https://test/api/admin/leads/email', {
			method: 'POST',
			body: JSON.stringify({
				leadId: leadJson.leadId,
				toEmail: 'qa@buyerco.com',
				subject: 'TAMPERED SUBJECT SHOULD NOT OVERRIDE ENVELOPE',
				content: 'TAMPERED BODY SHOULD NOT OVERRIDE ENVELOPE',
				commandId: 'cmd-outreach-0001',
			}),
		}),
	)
	assert.equal(eRetry.status, 200)
	const fetchCountAfterSend = fetchCalls.length
	assert.equal(fetchCountAfterSend, 2)
	assert.equal(fetchCalls[0].opts.headers['Idempotency-Key'], fetchCalls[1].opts.headers['Idempotency-Key'])
	assert.equal(fetchCalls[0].opts.body, fetchCalls[1].opts.body)

	// Repeat after 'sent' returns idempotent: true without calling provider again
	const eIdempotent = await emailRoute.POST(
		new Request('https://test/api/admin/leads/email', {
			method: 'POST',
			body: JSON.stringify({
				leadId: leadJson.leadId,
				toEmail: 'qa@buyerco.com',
				subject: 'Follow Up Specs',
				content: 'Original body line',
				commandId: 'cmd-outreach-0001',
			}),
		}),
	)
	assert.equal(eIdempotent.status, 200)
	assert.equal((await eIdempotent.json()).idempotent, true)
	assert.equal(fetchCalls.length, fetchCountAfterSend)
})

test('Super Admin Soft Delete: RBAC superadmin-only, eligibility guards, snapshot preservation, KPI/outbox cleanup, and bulk delete', async (t) => {
	const { sqlite, repo } = await setupDb(t, 'df-soft-delete-')
	const superSession = { id: 'sa-1', role: 'superadmin', name: 'Root Super', email: 'super@test.com' }
	const adminSession = { id: 'adm-1', role: 'admin', name: 'Store Admin', email: 'admin@test.com' }
	const cskhSession = { id: 'cs-1', role: 'cskh', name: 'CSKH', email: 'cs@test.com' }

	const makeDeleteRoute = (session, ok = true, status = 403) =>
		load(
			'src/app/(frontend)/api/orders/delete/route.ts',
			{
				'next/server': nextMock,
				'@/lib/d1': repo,
				'@/lib/admin-auth': {
					requireAdminSession: async (roles) => {
						if (!ok) return { ok: false, error: 'Unauthorized', status: 401 }
						if (roles?.length && !roles.includes(session.role)) {
							return { ok: false, error: 'Forbidden', status }
						}
						return { ok: true, session }
					},
				},
			},
			{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
		)

	const deleteSuper = makeDeleteRoute(superSession)
	const deleteAdmin = makeDeleteRoute(adminSession)
	const deleteCskh = makeDeleteRoute(cskhSession)
	const deleteAnon = makeDeleteRoute(null, false)

	// Create test orders covering all eligibility cases
	await repo.ordersDb.create({
		id: 'ord-del-d2c',
		order_number: 'ORD-DEL-001',
		order_intent: 'direct',
		customer_name: 'Test Buyer',
		customer_email: 'del-buyer@example.com',
		shipping_country: 'US',
		shipping_address: '1 Test St',
		items_json: JSON.stringify([{ productId: 'p1', title: 'Widget', quantity: 1, price: 40 }]),
		subtotal: 40,
		discount: 0,
		shipping_fee: 10,
		total: 50,
		currency: 'USD',
		payment_method: 'cod',
		payment_status: 'unpaid',
		fulfillment_status: 'pending',
		quote_status: null,
	})

	await repo.ordersDb.create({
		id: 'ord-del-rfq-sent',
		order_number: 'RFQ-DEL-002',
		order_intent: 'wholesale_rfq',
		customer_name: 'Sent RFQ Buyer',
		customer_email: 'rfq-sent@example.com',
		shipping_country: 'DE',
		shipping_address: '2 Port Rd',
		items_json: JSON.stringify([{ productId: 'p2', title: 'Bulk Box', quantity: 100, price: 12 }]),
		subtotal: 1200,
		discount: 0,
		shipping_fee: 50,
		total: 1250,
		currency: 'USD',
		payment_method: 'manual',
		payment_status: 'unpaid',
		fulfillment_status: 'pending',
		quote_status: 'pending',
	})
	await repo.ordersDb.update('ord-del-rfq-sent', {
		quote_status: 'sent',
		payment_terms: 'T/T 30/70',
		quote_valid_until: '2099-01-01T00:00:00.000Z',
	})
	const quoteToken = load('src/lib/quote-token.ts', { './d1': repo })
	await quoteToken.issueQuoteAccess('ord-del-rfq-sent')

	await repo.ordersDb.create({
		id: 'ord-del-paid',
		order_number: 'ORD-PAID-003',
		order_intent: 'direct',
		customer_name: 'Paid Buyer',
		customer_email: 'paid@example.com',
		shipping_country: 'US',
		shipping_address: '3 Main St',
		items_json: JSON.stringify([{ productId: 'p1', title: 'Widget', quantity: 2, price: 50 }]),
		subtotal: 100,
		discount: 0,
		shipping_fee: 0,
		total: 100,
		currency: 'USD',
		payment_method: 'card',
		payment_status: 'partial',
		paid_cents: 5000,
		fulfillment_status: 'pending',
		quote_status: null,
	})

	await repo.ordersDb.create({
		id: 'ord-del-approved',
		order_number: 'RFQ-APP-004',
		order_intent: 'wholesale_rfq',
		customer_name: 'Approved Buyer',
		customer_email: 'approved@example.com',
		shipping_country: 'US',
		shipping_address: '4 Main St',
		items_json: JSON.stringify([{ productId: 'p2', title: 'Bulk Box', quantity: 50, price: 10 }]),
		subtotal: 500,
		discount: 0,
		shipping_fee: 0,
		total: 500,
		currency: 'USD',
		payment_method: 'manual',
		payment_status: 'unpaid',
		fulfillment_status: 'confirmed',
		quote_status: 'approved',
		quote_approved_at: '2026-11-11T00:00:00.000Z',
		quote_approved_by: 'Buyer',
	})

	await repo.ordersDb.create({
		id: 'ord-del-shipping',
		order_number: 'ORD-SHIP-005',
		order_intent: 'direct',
		customer_name: 'Transit Buyer',
		customer_email: 'ship@example.com',
		shipping_country: 'US',
		shipping_address: '5 Main St',
		items_json: JSON.stringify([{ productId: 'p1', title: 'Widget', quantity: 1, price: 80 }]),
		subtotal: 80,
		discount: 0,
		shipping_fee: 0,
		total: 80,
		currency: 'USD',
		payment_method: 'cod',
		payment_status: 'unpaid',
		fulfillment_status: 'shipping',
		quote_status: null,
	})

	await repo.ordersDb.create({
		id: 'ord-del-bulk-ok',
		order_number: 'ORD-BLK-006',
		order_intent: 'direct',
		customer_name: 'Bulk Cancel Buyer',
		customer_email: 'bulk@example.com',
		shipping_country: 'US',
		shipping_address: '6 Main St',
		items_json: JSON.stringify([{ productId: 'p1', title: 'Widget', quantity: 1, price: 30 }]),
		subtotal: 30,
		discount: 0,
		shipping_fee: 0,
		total: 30,
		currency: 'USD',
		payment_method: 'cod',
		payment_status: 'unpaid',
		fulfillment_status: 'cancelled',
		quote_status: null,
	})

	// 1. RBAC: unauthenticated -> 401; admin & cskh -> 403
	assert.equal(
		(await deleteAnon.POST(new Request('https://test/api/orders/delete', { method: 'POST', body: JSON.stringify({ orderId: 'ord-del-d2c' }) }))).status,
		401,
	)
	assert.equal(
		(await deleteAdmin.POST(new Request('https://test/api/orders/delete', { method: 'POST', body: JSON.stringify({ orderId: 'ord-del-d2c' }) }))).status,
		403,
	)
	assert.equal(
		(await deleteCskh.POST(new Request('https://test/api/orders/delete', { method: 'POST', body: JSON.stringify({ orderId: 'ord-del-d2c' }) }))).status,
		403,
	)

	// 2. Confirmation mismatch -> 400; stale expectedVersion -> 409
	assert.equal(
		(
			await deleteSuper.POST(
				new Request('https://test/api/orders/delete', {
					method: 'POST',
					body: JSON.stringify({ orderId: 'ord-del-d2c', confirmOrderNumber: 'WRONG-ID' }),
				}),
			)
		).status,
		400,
	)
	assert.equal(
		(
			await deleteSuper.POST(
				new Request('https://test/api/orders/delete', {
					method: 'POST',
					body: JSON.stringify({ orderId: 'ord-del-rfq-sent', expectedVersion: 1 }),
				}),
			)
		).status,
		409,
	)

	// 3. Ineligible orders blocked by both API (422) AND SQLite trigger
	for (const blockedId of ['ord-del-paid', 'ord-del-approved', 'ord-del-shipping']) {
		const res = await deleteSuper.POST(
			new Request('https://test/api/orders/delete', {
				method: 'POST',
				body: JSON.stringify({ orderId: blockedId }),
			}),
		)
		assert.equal(res.status, 422, `Expected 422 for ${blockedId}`)
		await assert.rejects(
			sqlite.run('UPDATE orders SET deleted_at = ? WHERE id = ?', ['2026-11-11T09:00:00.000Z', blockedId]),
			/Cannot delete paid, approved, or in-transit\/delivered orders/,
		)
	}

	// 4. Superadmin soft-deletes sent RFQ (with quote_versions + quote_access + outbox) cleanly
	const delRfqRes = await deleteSuper.DELETE(
		new Request('https://test/api/orders/delete', {
			method: 'DELETE',
			body: JSON.stringify({
				orderId: 'ord-del-rfq-sent',
				expectedVersion: 2,
				confirmOrderNumber: 'RFQ-DEL-002',
				reason: 'Duplicate B2B test quote',
			}),
		}),
	)
	assert.equal(delRfqRes.status, 200)

	// Immutable quote_versions snapshot remains intact, quote_access revoked, outbox superseded
	assert.equal((await sqlite.run('SELECT COUNT(*) AS n FROM quote_versions WHERE order_id = ?', ['ord-del-rfq-sent'])).results[0].n, 1)
	const revokedRows = (await sqlite.run('SELECT revoked_at FROM quote_access WHERE order_id = ?', ['ord-del-rfq-sent'])).results
	assert.ok(revokedRows.length === 1 && revokedRows[0].revoked_at)
	const outboxStatuses = (
		await sqlite.run("SELECT status FROM outbox WHERE id IN ('order:ord-del-rfq-sent', 'order-email:ord-del-rfq-sent', 'quote-email:ord-del-rfq-sent:1')")
	).results
	assert.ok(outboxStatuses.every((r) => r.status === 'superseded'))

	// Re-deleting or mutating soft-deleted order is rejected
	assert.equal(
		(
			await deleteSuper.POST(
				new Request('https://test/api/orders/delete', {
					method: 'POST',
					body: JSON.stringify({ orderId: 'ord-del-rfq-sent' }),
				}),
			)
		).status,
		404,
	)
	await assert.rejects(
		sqlite.run("UPDATE orders SET customer_name = 'Tamper' WHERE id = ?", ['ord-del-rfq-sent']),
		/Cannot modify a deleted order/,
	)

	// Soft-deleted orders are excluded from ordersDb & aggregates
	assert.equal(await repo.ordersDb.getById('ord-del-rfq-sent'), null)
	assert.equal(await repo.ordersDb.getByOrderNumber('RFQ-DEL-002'), null)
	assert.ok((await repo.ordersDb.getById('ord-del-rfq-sent', { includeDeleted: true }))?.deleted_at)

	const rolesMod = load('src/lib/admin-roles.ts')
	const queriesMod = load('src/lib/admin-queries.ts', { '@/lib/d1': repo, '@/lib/admin-auth': rolesMod }, { DB: sqlite.binding })
	const summaryBefore = await queriesMod.getRoleScopedAggregates(superSession)
	assert.equal(summaryBefore.orders.totalOrders, 5)
	const crmMod = load('src/lib/crm-metrics.ts', { './d1': repo })
	const metricsDeleted = await crmMod.customerMetrics(['rfq-sent@example.com'])
	assert.equal(metricsDeleted.get('rfq-sent@example.com'), undefined)

	// 5. Bulk soft delete mixed batch
	const bulkRes = await deleteSuper.POST(
		new Request('https://test/api/orders/delete', {
			method: 'POST',
			body: JSON.stringify({
				orderIds: ['ord-del-bulk-ok', 'ord-del-approved', 'ord-del-d2c', 'ord-missing'],
				expectedVersions: { 'ord-del-bulk-ok': 1, 'ord-del-d2c': 99 },
				reason: 'Batch cleanup',
			}),
		}),
	)
	assert.equal(bulkRes.status, 200)
	const bulkJson = await bulkRes.json()
	assert.equal(bulkJson.partial, true)
	assert.equal(bulkJson.deletedCount, 1)
	assert.equal(bulkJson.conflictCount, 1)
	assert.equal(bulkJson.failedCount, 2)

	const summaryAfter = await queriesMod.getRoleScopedAggregates(superSession)
	assert.equal(summaryAfter.orders.totalOrders, 4)

	// 6. Deleted order's idempotency key cannot be replayed via /api/orders/create (returns 409 instead of 503)
	const createRoute = load(
		'src/app/(frontend)/api/orders/create/route.ts',
		{
			'next/server': nextMock,
			'@/lib/d1': repo,
			'@/sanity/lib/client': { client: { withConfig: () => ({ fetch: async () => [] }) } },
		},
		{ console: { error() {}, warn() {}, log() {} }, DB: sqlite.binding },
	)
	const cryptoNode = require('node:crypto')
	const replayKey = 'replay-deleted-order-key-0001'
	const replayId = `ord_${cryptoNode.createHash('sha256').update(replayKey).digest('hex')}`
	await repo.ordersDb.create({
		id: replayId,
		order_number: 'ORD-REPLAY-1',
		order_intent: 'direct',
		customer_name: 'Replay Buyer',
		customer_email: 'replay@example.com',
		shipping_country: 'US',
		shipping_address: '10 Replay Rd',
		items_json: JSON.stringify([{ productId: 'p1', title: 'Widget', quantity: 1, price: 20 }]),
		subtotal: 20,
		discount: 0,
		shipping_fee: 0,
		total: 20,
		currency: 'USD',
		payment_method: 'cod',
		payment_status: 'unpaid',
		fulfillment_status: 'pending',
	})
	await deleteSuper.POST(
		new Request('https://test/api/orders/delete', {
			method: 'POST',
			body: JSON.stringify({ orderId: replayId }),
		}),
	)
	const replayAttempt = await createRoute.POST(
		new Request('https://test/api/orders/create', {
			method: 'POST',
			headers: { 'Idempotency-Key': replayKey },
			body: JSON.stringify({
				mode: 'direct',
				name: 'Replay Buyer',
				email: 'replay@example.com',
				shippingAddress: '10 Replay Rd',
				shippingCountry: 'US',
				itemsDetail: [{ productId: 'p1', quantity: 1 }],
			}),
		}),
	)
	assert.equal(replayAttempt.status, 409)
})
